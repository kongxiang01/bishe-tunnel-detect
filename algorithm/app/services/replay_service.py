import os
import cv2
import threading
from collections import deque
from datetime import datetime
from app.core.config import settings

class ReplayService:
    def __init__(self, device_id=None):
        self.device_id = str(device_id) if device_id else "unknown"
        # 存储到指定路径
        self.base_dir = r"F:\workspace\graduation_project\algorithm\replay"
        self.save_dir = os.path.join(self.base_dir, self.device_id)
        os.makedirs(self.save_dir, exist_ok=True)
        
        # 假设算法处理帧率大约在 10-20 之间，设置一个合理的 buffer
        self.fps = 15  
        self.pre_seconds = 10
        self.post_seconds = 10
        self.frame_buffer = deque(maxlen=self.fps * self.pre_seconds)
        
        self.record_lock = threading.Lock()
        self.recording_tasks = []
        
    def add_frame(self, frame):
        # 将画面存入环形队列
        self.frame_buffer.append(frame.copy())
        
        with self.record_lock:
            # 遍历所有正在录制的任务，补充后续的帧
            for task in self.recording_tasks:
                if task['frames_to_capture'] > 0:
                    task['frames'].append(frame.copy())
                    task['frames_to_capture'] -= 1
                    
                    # 采集完毕，触发保存
                    if task['frames_to_capture'] == 0:
                        self._save_video_async(task)
                        
            # 移除已完成的任务
            self.recording_tasks = [t for t in self.recording_tasks if t['frames_to_capture'] > 0]
            
    def trigger_record(self, event_id):
        """激发录制，提取过去的 pre_seconds 帧，并建立任务捕获未来的 post_seconds 帧"""
        with self.record_lock:
            # 拷贝过去的缓冲帧
            pre_frames = list(self.frame_buffer)
            
            task = {
                'event_id': event_id,
                'frames': pre_frames,
                'frames_to_capture': self.fps * self.post_seconds
            }
            self.recording_tasks.append(task)
            
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎬 启动事件回放录制任务 ({event_id})...")
            
    def _save_video_async(self, task):
        threading.Thread(target=self._save_video, args=(task,), daemon=True).start()
        
    def _save_video(self, task):
        event_id = task['event_id']
        frames = task['frames']
        if not frames:
            return
            
        height, width, _ = frames[0].shape
        img_name = f"{event_id}.jpg"
        img_path = os.path.join(self.save_dir, img_name)
        
        # 存一张事件刚刚发生时的截图 (也就是 pre_frames 的最后一帧附近的内容)
        if len(frames) > self.fps * self.post_seconds:
            key_frame_idx = len(frames) - self.fps * self.post_seconds
            cv2.imwrite(img_path, frames[key_frame_idx])
        else:
            cv2.imwrite(img_path, frames[0])
        
        # 保存视频 - 改用 webm 或 h264 兼容性更好的编码，这里使用 mp4 + avc1 编码格式，或者如果 OpenCV 没对应插件则最好使用 VP8 webm 以确保浏览器原生支持
        # 为了最高兼容度我们采用 WebM 格式
        video_name = f"{event_id}.webm"
        video_path = os.path.join(self.save_dir, video_name)
        fourcc = cv2.VideoWriter_fourcc(*'vp80')
        out = cv2.VideoWriter(video_path, fourcc, self.fps, (width, height))
        
        for frame in frames:
            out.write(frame)
            
        out.release()
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 📼 事件视频已合成: {video_path}")
