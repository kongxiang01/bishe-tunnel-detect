import time
import requests
import threading
from app.core.config import settings

def send_traffic_count_to_backend(track_id, device_id):
    """
    异步发送车辆撞线数据到 Spring Boot 后端
    """
    url = "http://localhost:8080/api/stream/traffic/count"
    payload = {
        "trackId": track_id,
        "deviceId": device_id
    }
    try:
        response = requests.post(url, json=payload, timeout=2.0)
        response.raise_for_status()
    except Exception as e:
        print(f"⚠️ [警告] 发送车流计数 {track_id} 到后端失败: {e}")

class TrafficService:
    def __init__(self, device_id=None):
        # 记录已经统计过的车辆 ID，防止重复计数
        self.counted_track_ids = set()
        # 清理字典的时间戳记录 {track_id: timestamp_when_counted}
        self.track_timestamp_map = {}
        # 当前设备的标识信息
        self.device_id = device_id if device_id else "cam_default"
        
    def process_traffic(self, detections, line_y=300):
        """
        判断 bounding box 的中心点或者底部是否跨越了设定的检测线 (line_y)
        """
        current_time = time.time()
        
        for det in detections:
            class_name = det.get("class_name", "")
            # 只统计车辆
            if class_name in ["vehicle", "car", "truck", "bus"]:
                tid = det["track_id"]
                bbox = det["bbox"] # [x1, y1, x2, y2]
                
                # 计算车辆的底边中心点，一般底边更贴近地面，越线更准确
                center_y = (bbox[1] + bbox[3]) / 2.0
                bottom_y = bbox[3]
                
                # 如果目标的底边或者中心越过了参考线，并且还没有被统计过
                if bottom_y > line_y and tid not in self.counted_track_ids:
                    self.counted_track_ids.add(tid)
                    self.track_timestamp_map[tid] = current_time
                    
                    # 打印日志并异步发往后端
                    print(f"[{time.strftime('%H:%M:%S')}] 🚙 车辆越线计数: track_id={tid}, device_id={self.device_id}")
                    threading.Thread(
                        target=send_traffic_count_to_backend,
                        args=(tid, self.device_id),
                        daemon=True
                    ).start()
        
        # 垃圾回收：清理已经统计超过 2 分钟的 track_id，避免内存无限膨胀
        expired_tids = [tid for tid, timestamp in self.track_timestamp_map.items() 
                        if current_time - timestamp > 120.0]
        for tid in expired_tids:
            self.counted_track_ids.remove(tid)
            del self.track_timestamp_map[tid]