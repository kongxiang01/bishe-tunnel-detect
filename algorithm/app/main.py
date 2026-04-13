import os
import sys
import cv2
import asyncio
import time
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.services.model_service import ModelService
from app.services.tracker_service import TrackerService
from app.services.event_service import EventService

app = FastAPI(title="Tunnel MVP Algorithm Service")

# --- 初始化服务引擎 (全局单例) ---
# 将庞大的深度学习与跟踪初始化提至全局
model_service = ModelService()
tracker_service = TrackerService()

@app.get("/health")
def health():
    return {"status": "online", "service": "algorithm", "model": "YOLOv5s"}

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_ip = websocket.client.host
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔌 新的前端连接已建立: {client_ip}")
    
    # 每个前端连接(监控窗口)产生一个独立的异常事件追踪器，防坐标重叠
    event_service = EventService()
    
    stream_url = settings.STREAM_URL
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
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎥 视频流拉取成功! 初始诊断 => 分辨率: {width}x{height}, 源端FPS: {fps}")
    
    try:
        frame_id = 0
        skip_counter = 0
        
        algo_fps_start = time.time()
        algo_frame_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.1)
                continue
                
            skip_counter += 1
            if skip_counter % 1 != 0:
                continue 
                
            frame_id += 1
            algo_frame_count += 1
            
            # --- 步骤 1：深度学习目标检测推理 ---
            infer_start = time.time()
            results = model_service.detect(frame)
            infer_cost_ms = (time.time() - infer_start) * 1000
            
            raw_dets = results.xyxy[0].tolist()

            # --- 步骤 2：帧间追踪分配 ---
            class_names = model_service.get_names()
            detections = tracker_service.track_and_match(raw_dets, frame.shape, class_names)
            
            # --- 步骤 3：业务逻辑 -> 异常事件拦截 ---
            current_events = event_service.process_events(detections)

            # --- 步骤 4：引擎日志与 Socket 推送 ---
            now = time.time()
            if now - algo_fps_start >= 1.0:
                current_fps = algo_frame_count / (now - algo_fps_start)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚙️ 算法引擎算力: {current_fps:.1f} FPS | 最近耗时: {infer_cost_ms:.1f} ms | 捕获: {len(detections)} 目标")
                algo_frame_count = 0
                algo_fps_start = now
                
            await websocket.send_json({
                "frame_id": frame_id,
                "timestamp_ms": round(now * 1000),
                "vehicle_count": len(detections),
                "detections": detections,
                "events": current_events,
                "infer_cost_ms": round(infer_cost_ms, 1)
            })
            
            await asyncio.sleep(0.001) 
            
    except WebSocketDisconnect:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔌 前端断开连接: {client_ip}")
    except Exception as e:
        import traceback
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ WebSocket 异常: {e}")
        traceback.print_exc()
    finally:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🛑 释放视频流资源。")
        cap.release()
