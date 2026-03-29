import os
import cv2
import torch
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Tunnel MVP Algorithm Service")

# 启动时常驻加载 YOLOv5 模型，避免每次请求重复加载
print("Loading YOLOv5 model...")
# 获取 main.py 的绝对路径所在的目录的上一级目录（即 algorithm/）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YOLO_DIR = os.path.join(BASE_DIR, "yolov5")
MODEL_PATH = os.path.join(BASE_DIR, "yolov5s.pt")

# 使用基于文件位置计算出的绝对路径进行加载
model = torch.hub.load(YOLO_DIR, 'custom', path=MODEL_PATH, source='local')
model.conf = 0.5  # 置信度阈值

class InferRequest(BaseModel):
    frame_id: int
    image_path: str  # MVP: 接收绝对路径以保证最快速度

@app.get("/health")
def health():
    return {"status": "online", "service": "algorithm", "model": "YOLOv5s"}

@app.post("/infer")
def infer(req: InferRequest):
    if not os.path.exists(req.image_path):
        raise HTTPException(status_code=404, detail="Image file not found")
        
    # 直接使用 OpenCV 高速读取本地图片
    img = cv2.imread(req.image_path)
    if img is None:
        raise HTTPException(status_code=400, detail="Cannot read image")
        
    # 模型推理阶段
    results = model(img)
    
    # 解析并格式化 YOLOv5 返回的数据
    detections = []
    # results.xyxy[0] 格式为 [x1, y1, x2, y2, confidence, class]
    for *box, conf, cls in results.xyxy[0].tolist():
        detections.append({
            "class_name": model.names[int(cls)],
            "confidence": round(conf, 3),
            "bbox": [round(x, 1) for x in box]
        })

    # MVP stub: 由于还没有引入 DeepSORT 追踪，速度等字段暂时预留为空或简写
    return {
        "frame_id": req.frame_id,
        "timestamp": datetime.now().isoformat(),
        "vehicle_count": len(detections),
        "detections": detections,
        "events": []
    }
