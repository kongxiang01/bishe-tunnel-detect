import os

class Settings:
    # --- 路径配置 ---
    # BASE_DIR 指向 algorithm 根目录
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    YOLO_DIR = os.path.join(BASE_DIR, "yolov5")
    MODEL_PATH = os.path.join(BASE_DIR, "SimAM+SIoU+BiFPN.pt")
    # MODEL_PATH = os.path.join(BASE_DIR, "tunnel_baseline.pt")
    BYTETRACK_DIR = os.path.join(BASE_DIR, "ByteTrack")

    # --- 流媒体源配置 ---
    STREAM_URL = "http://127.0.0.1:5000/stream"

    # --- 模型与检测参数 ---
    CONF_THRESH = 0.3  # YOLO 框置信度

    # --- 事件策略参数 ---
    CONGESTION_EVAL_WINDOW = 3.0  # 计算平均速度的时间窗口(秒)
    MIN_VEHICLES_FOR_CONGESTION = 3 # 触发拥堵计算的最低车辆数阈值
    CONGESTION_INDEX_THRESHOLD = 5.0 # 拥堵指数阈值 (V_avg / N < 该值则判定拥堵)
    ALERT_COOLDOWN = 15.0 # 全局拥堵告警冷却时间(秒)，防止频繁刷屏
    STATIC_EVENT_COOLDOWN = 1800.0  # 静态异常事件(火灾、事故、行人)类型的独立冷却时间(秒)，默认30分钟

settings = Settings()