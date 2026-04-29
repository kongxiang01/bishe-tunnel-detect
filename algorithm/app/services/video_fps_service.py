import cv2
import time
import threading


class VideoFpsService:
    """独立线程测量视频流实际帧率，不受算法推理时间影响"""

    def __init__(self, stream_url, nominal_fps=25):
        """
        stream_url: 视频流地址
        nominal_fps: 标称帧率，作为初始值
        """
        self.stream_url = stream_url
        self.nominal_fps = nominal_fps
        self.fps = nominal_fps
        self.running = False
        self._thread = None
        self._last_frame_time = None
        self._lock = threading.Lock()

    def _measure_loop(self):
        """在独立线程中持续读取帧并计算帧率"""
        cap = cv2.VideoCapture(self.stream_url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        while self.running:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue

            now = time.time()

            if self._last_frame_time is not None:
                frame_interval = now - self._last_frame_time
                if frame_interval > 0:
                    instantaneous_fps = 1.0 / frame_interval
                    with self._lock:
                        self.fps = self.fps * 0.9 + instantaneous_fps * 0.1

            self._last_frame_time = now

        cap.release()

    def start(self):
        """启动帧率测量线程"""
        self.running = True
        self._last_frame_time = time.time()
        self._thread = threading.Thread(target=self._measure_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """停止帧率测量线程"""
        self.running = False
        if self._thread:
            self._thread.join(timeout=2)

    def get_fps(self):
        """获取当前测量帧率（取整）"""
        with self._lock:
            return round(self.fps)
