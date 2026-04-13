import sys
import torch
import warnings
from app.core.config import settings

# 屏蔽 YOLOv5 源码在较新版本 PyTorch 下产生的 FutureWarning 警告
warnings.filterwarnings("ignore", category=FutureWarning, module="torch.cuda.amp.autocast")
warnings.filterwarnings("ignore", category=FutureWarning)

class ModelService:
    def __init__(self):
        print("[ModelService] Loading YOLOv5 model...")
        # 依赖本地 local 方式加载 yolov5
        self.model = torch.hub.load(settings.YOLO_DIR, 'custom', path=settings.MODEL_PATH, source='local')
        print(f"[ModelService] 当前模型设备：{next(self.model.parameters()).device}")
        self.model.conf = settings.CONF_THRESH
        
    def detect(self, frame):
        """对单帧画面进行推断，返回 YOLO 原始 Results 对象"""
        return self.model(frame)
        
    def get_names(self):
        """获取目标对应字典，比如 {0: 'car', 1: 'truck'}"""
        return self.model.names