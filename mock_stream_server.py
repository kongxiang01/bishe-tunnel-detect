import cv2
import time
import asyncio
import threading
import uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Mock Media Stream Server")

# 允许跨域，前端和算法都可以直接连
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

latest_frame = None

# >>> 在这里直接控制模拟摄像头的物理推流帧率 <<<
# 实际安防工业界，为了节省带宽，摄像头默认往往就是 10~15 FPS
TARGET_FPS = 15.0  

def capture_video():
    """
    后台线程：模拟一个不间断推流的摄像头硬件
    负责按照真实帧率将视频解码到内存池 `latest_frame` 中
    """
    global latest_frame
    cap = cv2.VideoCapture("mock-video.mp4")
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    if original_fps == 0: original_fps = 30.0
    
    # 计算为了保持 1x 倍速播放，读 1 帧画面需要“抽掉”并抛弃多少原始帧
    frame_step = max(1, int(original_fps / TARGET_FPS))
    delay = 1.0 / TARGET_FPS

    while True:
        start_time = time.time()
        
        # 核心：抽帧抓取。跳过那些多余的帧，保证时间不被拉长（防止慢动作播放）
        for _ in range(frame_step - 1):
            cap.grab()
            
        success, frame = cap.read()
        if not success:
            # 视频播完，循环播放，模拟 7x24 小时不断流摄像头
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
        
        # 编码为 JPEG 用于网络分发
        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        latest_frame = buffer.tobytes()
        
        # 精确控制摄像头物理推流耗时
        elapsed = time.time() - start_time
        sleep_time = delay - elapsed
        if sleep_time > 0:
            time.sleep(sleep_time)

# 启动摄像头硬件级后台模拟
threading.Thread(target=capture_video, daemon=True).start()

async def generate_frames():
    """
    生成 MJPEG 流给订阅者（无论多少个客户端连接，大家都只拿到最新的 `latest_frame`，确保绝对同步且省资源）
    """
    global latest_frame
    last_sent_frame = None
    
    while True:
        # 当且仅当内存池 `latest_frame` 更新了，才向网络里分发（极大节省全链路带宽！）
        if latest_frame is not None and latest_frame != last_sent_frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + latest_frame + b'\r\n')
            last_sent_frame = latest_frame
            
        # 此处休息 0.01 秒（100Hz下发刷新率），确保客户端拿到画面最实时
        await asyncio.sleep(0.01)

@app.get("/stream")
async def video_feed():
    # 使用著名的 Multipart Mixed Replace 输出机制，这就是 IP 摄像头标准的直播传输方式
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    print("🎥 模拟流媒体转发核心服务器启动...")
    print("✅ Web 直播流地址: http://127.0.0.1:5000/stream")
    uvicorn.run("mock_stream_server:app", host="0.0.0.0", port=5000, reload=False)
