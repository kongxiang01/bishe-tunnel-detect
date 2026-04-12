import os
import sys
import cv2
import torch
import asyncio
import time
import warnings
import numpy as np
from datetime import datetime
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

# 屏蔽 YOLOv5 源码在较新版本 PyTorch 下产生的 FutureWarning 警告，保持日志清爽
warnings.filterwarnings("ignore", category=FutureWarning, module="torch.cuda.amp.autocast")
warnings.filterwarnings("ignore", category=FutureWarning)

app = FastAPI(title="Tunnel MVP Algorithm Service")

# 启动时常驻加载 YOLOv5 模型，避免每次请求重复加载
print("Loading YOLOv5 model...")
# 获取 main.py 的绝对路径所在的目录的上一级目录（即 algorithm/）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YOLO_DIR = os.path.join(BASE_DIR, "yolov5")
MODEL_PATH = os.path.join(BASE_DIR, "SimAM+SIoU+BiFPN.pt") # <--- 这里修改为你自己训练出来的最优权重

# 添加 ByteTrack 路径（在 BASE_DIR 定义后）
sys.path.append(os.path.join(BASE_DIR, "ByteTrack"))
sys.path.append(os.path.join(BASE_DIR, "yolov5"))
from yolox.tracker.byte_tracker import BYTETracker

# 使用基于文件位置计算出的绝对路径进行加载
model = torch.hub.load(YOLO_DIR, 'custom', path=MODEL_PATH, source='local')
print(f"当前模型设备：{next(model.parameters()).device}")
model.conf = 0.5  # 置信度阈值

# 初始化 ByteTrack
class ByteTrackArgs:
    track_thresh = 0.5
    track_buffer = 30
    match_thresh = 0.8
    mot20 = False

byte_tracker = BYTETracker(args=ByteTrackArgs(), frame_rate=30)
byte_tracker.low_thresh = 0.2
print("ByteTrack 初始化完成")

@app.get("/health")
def health():
    return {"status": "online", "service": "algorithm", "model": "YOLOv5s"}

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_ip = websocket.client.host
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔌 新的前端连接已建立: {client_ip}")
    
    # 彻底模拟真实摄像头/流媒体服务器架构的推拉流关系
    stream_url = "http://127.0.0.1:5000/stream"
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 📡 正在拉取源视频流: {stream_url}")
    
    cap = cv2.VideoCapture(stream_url)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) 
    
    if not cap.isOpened():
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ 无法连接到视频流: {stream_url}")
        await websocket.close(code=1011, reason="Stream unreachable")
        return

    # 拉取流基础信息
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎥 视频流拉取成功! 初始诊断信息 => 分辨率: {width}x{height}, 源端标称FPS: {fps}")
    
    try:
        frame_id = 0
        skip_counter = 0
        
        # 用于计算算法处理耗时
        algo_fps_start = time.time()
        algo_frame_count = 0
        
        while cap.isOpened():
            grab_start = time.time()
            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.1)
                continue
                
            skip_counter += 1
            # 抽帧设置：如果算力跟不上，可以改这里跳帧，目前先全收
            if skip_counter % 1 != 0:
                continue 
                
            frame_id += 1
            algo_frame_count += 1
            
            # --- 开始推理统计 ---
            infer_start = time.time()
            results = model(frame)
            infer_cost_ms = (time.time() - infer_start) * 1000

            # ByteTrack 输入格式: [x1, y1, x2, y2, score, cls]
            raw_dets = results.xyxy[0].tolist()
            if len(raw_dets) > 0:
                # Yolov5 结果组装成 N x 5 矩阵 (x1, y1, x2, y2, score)
                output_results = np.array([[d[0], d[1], d[2], d[3], d[4]] for d in raw_dets], dtype=np.float64)
                
                # frame 的宽高
                img_h, img_w = frame.shape[:2]
                img_info = [img_h, img_w]
                img_size = [img_h, img_w]  # 由于 YOLOv5 导出的也是原图尺度的 box，所以传跟 info 一直保持 scale=1 即可
                
                # 更新 ByteTrack
                tracked_tracks = byte_tracker.update(output_results, img_info, img_size)
            else:
                tracked_tracks = byte_tracker.update(np.empty((0, 5)), [frame.shape[0], frame.shape[1]], [frame.shape[0], frame.shape[1]])

            # 通过 IoU 匹配为每个 track 分配 cls_id
            detections = []
            for track in tracked_tracks:
                track_tlbr = track.tlbr
                # 找到与当前 track IoU 最大的原始检测
                max_iou = 0
                best_cls_id = 0
                for d in raw_dets:
                    det_tlbr = [d[0], d[1], d[2], d[3]]
                    # 计算 IoU
                    inter_x1 = max(track_tlbr[0], det_tlbr[0])
                    inter_y1 = max(track_tlbr[1], det_tlbr[1])
                    inter_x2 = min(track_tlbr[2], det_tlbr[2])
                    inter_y2 = min(track_tlbr[3], det_tlbr[3])
                    inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
                    track_area = (track_tlbr[2] - track_tlbr[0]) * (track_tlbr[3] - track_tlbr[1])
                    det_area = (det_tlbr[2] - det_tlbr[0]) * (det_tlbr[3] - det_tlbr[1])
                    iou = inter_area / (track_area + det_area - inter_area + 1e-6)
                    if iou > max_iou:
                        max_iou = iou
                        best_cls_id = int(d[5])
                detections.append({
                    "class_name": model.names[best_cls_id],
                    "confidence": round(track.score, 3),
                    "bbox": [round(x, 1) for x in track_tlbr],
                    "track_id": track.track_id
                })
            
            # --- 周期性日志输出 (每秒输出1次) ---
            now = time.time()
            if now - algo_fps_start >= 1.0:
                current_fps = algo_frame_count / (now - algo_fps_start)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚙️ [算法引擎] 实时算力: {current_fps:.1f} FPS | 最近单帧推理耗时: {infer_cost_ms:.1f} ms | 当帧捕获目标: {len(detections)} 个")
                algo_frame_count = 0
                algo_fps_start = now
                
            await websocket.send_json({
                "frame_id": frame_id,
                "timestamp_ms": round(time.time() * 1000),
                "vehicle_count": len(detections),
                "detections": detections,
                "infer_cost_ms": round(infer_cost_ms, 1)
            })
            
            await asyncio.sleep(0.001) 
            
    except WebSocketDisconnect:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔌 前端断开连接: {client_ip}")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ WebSocket 异常: {e}")
    finally:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🛑 释放视频流资源。")
        cap.release()
