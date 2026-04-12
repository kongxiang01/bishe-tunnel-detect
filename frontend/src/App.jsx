import { useEffect, useState, useRef } from 'react';
import './styles.css';

const API_BASE = 'http://localhost:8080/api';
// 直连算法服务，未来真实方案这里连的是边缘计算集群提供的 WS 地址
const ALGO_WS = 'ws://localhost:8000/ws/stream';

export default function App() {
  const [health, setHealth] = useState('checking');
  const [isDetecting, setIsDetecting] = useState(true);
  
  const canvasRef = useRef(null);
  // 不再需要 hiddenCanvasRef 与 videoRef，因为我们现在是直接消费流源！

  // 初始化健康检查
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setHealth(d.status || 'unknown'))
      .catch(() => setHealth('offline'));
  }, []);

  // 持续检测视频流的核心循环 (替换过去所有复杂的时间同步轮询代码！)
  useEffect(() => {
    let ws = null;

    if (isDetecting) {
      ws = new WebSocket(ALGO_WS);

      ws.onopen = () => {
        console.log('算法节点WebSocket 直连流已连通，开始实况接受！');
        // 当收到连接信号时，将重叠画布尺寸与图片真实尺寸同步对齐
        const img = document.getElementById('live-stream-img');
        if (canvasRef.current && img && img.naturalWidth) {
          canvasRef.current.width = img.naturalWidth;
          canvasRef.current.height = img.naturalHeight;
        }
      };

      // 用于计算 FPS 的变量
      let lastFpsTime = performance.now();
      let frameCount = 0;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // --- 监控日志：跟踪算法推送速率与延迟 ---
          const now = performance.now();
          frameCount++;
          if (now - lastFpsTime >= 1000) {
            // 计算推理结果从 Python 产生到前端接收的端到端网络+处理延迟
            const networkLatency = Date.now() - data.timestamp_ms;
            console.log(`📊 [监控] 算法推框速率: ${frameCount} FPS | 网络传输延迟: 约 ${networkLatency} ms`);
            frameCount = 0;
            lastFpsTime = now;
          }

          // 超低延迟的制胜法宝：收到 WebSocket 通知那一刻直接绘制！不存数组，不排队，拿到即刷！
          // 在同网络层级下，画出的位置和当前屏幕流 100% 对应！
          if (data.detections) {
            drawBBoxes(data.detections);
          }
        } catch (e) {
          console.error("Parse WS msg error", e);
        }
      };
    }

    return () => {
      // 断开清理屏幕残影
      if (ws) ws.close();
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
  }, [isDetecting]);

  // 在 Canvas 专属图层上绘制红框
  const drawBBoxes = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 清除上一个瞬间画上去的内容（流推陈出新的关键）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const width = x2 - x1;
      const height = y2 - y1;

      ctx.strokeStyle = '#ff0b3a';
      ctx.lineWidth = 4;
      ctx.strokeRect(x1, y1, width, height);

      ctx.fillStyle = '#ff0b3a';
      ctx.fillRect(x1, y1 - 28, ctx.measureText(det.class_name).width + 65, 28);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      const trackIdText = det.track_id !== undefined ? ` ID:${det.track_id}` : '';
      ctx.fillText(`${det.class_name} ${(det.confidence * 100).toFixed(1)}%${trackIdText}`, x1 + 5, y1 - 6);
    });
  };

  return (
    <div className="page">
      <header className="top">
        <h1>Tunnel Traffic MVP</h1>
        <span className={`badge ${health}`}>backend: {health}</span>
      </header>

      <section className="card card-stream">
        <div className="stream-header">
          <h2>Stream Monitor (Preview)</h2>
          <button 
            className="simulate-btn" 
            style={{ backgroundColor: isDetecting ? '#ef4444' : '#10b981' }}
            onClick={() => setIsDetecting(!isDetecting)}
          >
            {isDetecting ? '停止监控检测' : '[联调] 开始实时视频推流'}
          </button>
        </div>
        
        <div className="player-wrapper">
          {/* 这里放我们的本地视频文件，这就像是你最终从转发服务器接管下来的 <LivePlayer> */}
          <img 
            id="live-stream-img"
            src="http://127.0.0.1:5000/stream" 
            className="stream-video"
            alt="隧道实时监控画面直播源"
            onLoad={(e) => {
              // 为了保证刚刷出直播画面就能将画布正确悬浮覆盖其上
              if (canvasRef.current) {
                canvasRef.current.width = e.target.naturalWidth;
                canvasRef.current.height = e.target.naturalHeight;
              }
            }}
          />
          
          {/* 画框图层，绝对定位悬浮在 Video/IMG 身上，永远同步 */}
          <canvas 
            ref={canvasRef} 
            className="overlay-canvas"
          />
        </div>
      </section>

      <section className="card">
        <h2>Recent Events</h2>
        <p>我们已经成功把静态图升级成了视频流！现在前端负责播放视频并向后端传切帧 Base64 数据。</p>
      </section>
    </div>
  );
}
