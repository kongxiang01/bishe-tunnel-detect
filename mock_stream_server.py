import cv2
import time
import asyncio
import threading
import uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Mock Multi-Stream Media Server")

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TARGET_FPS = 30

# 存储不同路视频流的最新帧
cameras = {
    "camera_01": {"frame": None, "file": "隧道合集2.mp4"},
    "camera_02": {"frame": None, "file": "mock-video-0.mp4"},
    "camera_03": {"frame": None, "file": "起火精简版.mp4"},
    "camera_04": {"frame": None, "file": "普通道路.mp4"},
}

def capture_video(cam_id, video_file):
    """
    后台线程：模拟不同摄像头的硬件推流
    """
    cap = cv2.VideoCapture(video_file)
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    if original_fps == 0: original_fps = 30.0

    frame_step = max(1, int(original_fps / TARGET_FPS))
    delay = 1.0 / TARGET_FPS

    while True:
        start_time = time.time()

        for _ in range(frame_step - 1):
            cap.grab()

        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        # 为了区分多路不同摄像头，在左上角打上水印
        cv2.putText(frame, f"DEVICE: {cam_id.upper()}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        cameras[cam_id]["frame"] = buffer.tobytes()

        elapsed = time.time() - start_time
        sleep_time = delay - elapsed
        if sleep_time > 0:
            time.sleep(sleep_time)

# 为每路摄像头启动一个物理捕获线程
for cam_id, info in cameras.items():
    threading.Thread(target=capture_video, args=(cam_id, info["file"]), daemon=True).start()

async def generate_frames(cam_id):
    last_sent_frame = None
    while True:
        current_frame = cameras[cam_id]["frame"]
        if current_frame is not None and current_frame != last_sent_frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + current_frame + b'\r\n')
            last_sent_frame = current_frame
        await asyncio.sleep(0.01)

@app.get("/stream/{cam_id}")
async def video_feed(cam_id: str):
    if cam_id not in cameras:
        return {"error": "Camera offline"}
    return StreamingResponse(generate_frames(cam_id), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    print("🎥 多路模拟流媒体转发核心服务器启动...")
    print("✅ 摄像头 1 (隧道A段): http://127.0.0.1:5000/stream/camera_01")
    print("✅ 摄像头 2 (隧道B段): http://127.0.0.1:5000/stream/camera_02")
    print("✅ 摄像头 3 (隧道C段): http://127.0.0.1:5000/stream/camera_03")
    print("✅ 摄像头 4 (隧道D段): http://127.0.0.1:5000/stream/camera_04")
    uvicorn.run("mock_stream_server:app", host="0.0.0.0", port=5000, reload=False)
