import time
import requests
import threading
import uuid
from datetime import datetime
from app.core.config import settings
from app.services.replay_service import ReplayService

def send_event_to_backend(track_id, event_type, message, severity, device_id=None, device_name=None, event_uuid=None):
    """
    异步发送事件到 Spring Boot 后端
    """
    url = "http://localhost:8080/api/events/upload"

    # 填充生成好的回放URL
    video_url = f"http://127.0.0.1:8000/replay/{device_id}/{event_uuid}.webm" if event_uuid else None
    image_url = f"http://127.0.0.1:8000/replay/{device_id}/{event_uuid}.jpg" if event_uuid else None

    payload = {
        "eventType": event_type,
        "description": message,
        "severity": severity,
        "trackId": track_id,
        "deviceId": device_id,
        "deviceName": device_name,
        "videoClipUrl": video_url,
        "imageUrl": image_url
    }
    try:
        # Timeout 限制避免拥满算法帧率
        requests.post(url, json=payload, timeout=2.0)
    except Exception as e:
        print(f"⚠️ [警告] 发送事件 {track_id} 到后端失败: {e}")

class EventService:
    def __init__(self, device_id=None, device_name=None):
        # 生命周期状态：{track_id: {"history": [(cx, cy, timestamp)], "alerted": bool}}
        self.track_history = {}
        # 记录上一次发布拥堵警报的时间，用于冷却
        self.last_congestion_alert = 0.0

        # 按类型记录静态异常事件（火灾/事故/行人）的上一次报警时间
        # 时间设定为 0.0 代表从未触发
        self.event_type_cooldowns = {
            "fire": 0.0,
            "accident": 0.0,
            "person": 0.0
        }

        # 当前设备的标识信息
        self.device_id = device_id
        self.device_name = device_name
        self.replay_service = ReplayService(device_id=device_id)

    def feed_frame(self, frame):
        """将当前帧馈送到回溯服务"""
        self.replay_service.add_frame(frame)
        
    def process_events(self, detections):
        """
        拦截当前帧检测的上下文关联态，产出告警事件
        """
        current_time = time.time()
        current_events = []
        active_track_ids = set()
        
        for det in detections:
            tid = det["track_id"]
            active_track_ids.add(tid)
            bbox = det["bbox"]
            # 计算中心点坐标
            cx = (bbox[0] + bbox[2]) / 2.0
            cy = (bbox[1] + bbox[3]) / 2.0
            
            if tid not in self.track_history:
                self.track_history[tid] = {"history": [], "alerted": False}
            
            history = self.track_history[tid]["history"]
            history.append((cx, cy, current_time))
            
            # 定容：维持最近 CONGESTION_EVAL_WINDOW 长度的历史轨迹足以计算速度
            while len(history) > 0 and current_time - history[0][2] > settings.CONGESTION_EVAL_WINDOW:
                history.pop(0)
            
            # --- 针对静态异常采取直接阻断+冷却上报的形式 ---
            class_name = det.get("class_name", "")
            
            # 加上 len(history) > 1 防抖：必须连续出现至少两帧才确认为异常，防止单帧干扰
            if class_name in self.event_type_cooldowns and len(history) > 1:
                # 检查该类型的事件是否还在冷却期内 (使用 config 中的独立冷却时间，通常为半小时)
                last_time = self.event_type_cooldowns[class_name]
                
                if current_time - last_time > settings.STATIC_EVENT_COOLDOWN:
                    # 分发事件文字类型
                    event_type = None
                    event_msg = ""
                    
                    if class_name == "fire":
                        event_type = "FIRE_DISASTER"
                        event_msg = f"🔥 火灾紧急告警：隧道内发现明火或浓烟!"
                        event_severity = "CRITICAL"
                    elif class_name == "accident":
                        event_type = "TRAFFIC_ACCIDENT"
                        event_msg = f"💥 事故严重告警：隧道内发生车辆碰撞事故!"
                        event_severity = "CRITICAL"
                    elif class_name == "person":
                        event_type = "PEDESTRIAN_INTRUSION"
                        event_msg = f"🚶 行人闯入告警：行车道侦测到违规闯入轨迹!"
                        event_severity = "WARNING"

                    if event_type:
                        # 立刻刷新这个类型事件的最后触发时间
                        self.event_type_cooldowns[class_name] = current_time

                        event_uuid = str(uuid.uuid4())
                        self.replay_service.trigger_record(event_uuid)

                        threading.Thread(
                            target=send_event_to_backend,
                            args=(tid, event_type, event_msg, event_severity, self.device_id, self.device_name, event_uuid),
                            daemon=True
                        ).start()

                        current_events.append({
                            "type": event_type.lower(),
                            "severity": event_severity,
                            "track_id": tid, # 前端可以用这个值来标亮当下的危险框
                            "message": event_msg,
                            "timestamp": int(current_time * 1000),
                            "event_uuid": event_uuid
                        })
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚨 EventService: {event_msg}")

            # 告警规则判断分类（现在只剩废弃代码里的后续防刷屏结构，原单体规则1/2/3已上移）
            if not self.track_history[tid]["alerted"]:
                pass # 原针对火/车祸的处理已经被我直接拿到了上方的立刻上报逻辑中处理了

        # 规则 4 替换方案：轻量级交通拥堵状态建模
        # 我们根据画面中所有 'vehicle' 的平均相对移动速度和密度来计算拥堵指数，抵抗透视形变
        if current_time - self.last_congestion_alert > settings.ALERT_COOLDOWN:
            vehicles = [det for det in detections if det.get("class_name") == "vehicle"]
            N = len(vehicles)
            
            # 当车辆数超过拥堵触发下限时才进行速度计算
            if N >= settings.MIN_VEHICLES_FOR_CONGESTION:
                total_speed = 0.0
                valid_vehicles = 0
                
                for det in vehicles:
                    tid = det["track_id"]
                    history = self.track_history.get(tid, {}).get("history", [])
                    if len(history) > 1:
                        # 计算起止位移与时间差求出绝对像素位移
                        disp_dist = ((history[-1][0] - history[0][0])**2 + (history[-1][1] - history[0][1])**2)**0.5
                        time_span = history[-1][2] - history[0][2]
                        
                        if time_span > 0:
                            # 方案二核心：获取当前框自身的对角线长度作为“透视尺规”
                            bbox = det["bbox"]
                            diag_len = ((bbox[2] - bbox[0])**2 + (bbox[3] - bbox[1])**2)**0.5
                            diag_len = max(diag_len, 1.0) # 避免除零
                            
                            # 相对速度：每秒移动了几个“车身比例” (v_relative)
                            # 为了无缝兼容原有 config.py 里的 5.0 阈值，乘以 100 进行标准化放缩
                            v_norm = (disp_dist / diag_len) * 100.0 / time_span
                            
                            total_speed += v_norm
                            valid_vehicles += 1
                
                if valid_vehicles > 0:
                    v_avg = total_speed / valid_vehicles
                    # 拥堵指数公式： I = V_avg_norm / N (平均标准化速度相比车辆密度占比)
                    congestion_index = v_avg / N
                    
                    if congestion_index < settings.CONGESTION_INDEX_THRESHOLD:
                        self.last_congestion_alert = current_time
                        event_msg = f"🐌 交通拥堵：识别到多车缓行阻塞 (车辆数:{N}, 指数:{congestion_index:.2f})"
                        
                        event_uuid = str(uuid.uuid4())
                        self.replay_service.trigger_record(event_uuid)

                        threading.Thread(
                            target=send_event_to_backend,
                            args=(0, "TRAFFIC_CONGESTION", event_msg, "NORMAL", self.device_id, self.device_name, event_uuid),
                            daemon=True
                        ).start()

                        current_events.append({
                            "type": "traffic_congestion",
                            "severity": "NORMAL",
                            "track_id": 0,
                            "message": event_msg,
                            "timestamp": int(current_time * 1000),
                            "event_uuid": event_uuid
                        })
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚨 EventService: {event_msg}")

        # 垃圾回收：清理过期未出现的轨迹 (超过 10 秒)
        for tid in list(self.track_history.keys()):
            if tid not in active_track_ids:
                if current_time - self.track_history[tid]["history"][-1][2] > 10.0:
                    del self.track_history[tid]
                    
        return current_events