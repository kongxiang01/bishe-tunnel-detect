import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles.css';

const API_BASE = '/api';
const ALGO_WS = 'ws://localhost:8000/ws/stream';

export default function Monitor() {
  const [health, setHealth] = useState('checking');
  const [isDetecting, setIsDetecting] = useState(true);
  const [events, setEvents] = useState([]); // 保存告警记录
  const navigate = useNavigate();
  
  const canvasRef = useRef(null);

  // 初始化健康检查
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    axios.get(`${API_BASE}/health`)
      .then((r) => setHealth(r.data.status || 'unknown'))
      .catch(() => setHealth('offline'));
  }, []);

  // 定时拉取后端的告警事件列表
  useEffect(() => {
    const fetchEvents = () => {
      axios.get(`${API_BASE}/events/list`)
        .then(res => {
          if (res.data) setEvents(res.data);
        })
        .catch(err => console.error('Failed to fetch events:', err));
    };

    fetchEvents(); // 初始化查一次
    const interval = setInterval(fetchEvents, 2000); // 每2秒轮询一次新告警

    return () => clearInterval(interval);
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

    // 将 detections 排序，让 'accident' 排在最后绘制，从而覆盖在 vehicle 等其他框之上
    const sortedDetections = [...detections].sort((a, b) => {
      if (a.class_name === 'accident' && b.class_name !== 'accident') return 1;
      if (a.class_name !== 'accident' && b.class_name === 'accident') return -1;
      return 0;
    });

    sortedDetections.forEach(det => {
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
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span className={`badge ${health}`}>backend: {health}</span>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              navigate('/login');
            }}
            style={{ padding: '4px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            退出登录
          </button>
        </div>
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

      <section className="card card-events" style={{ marginTop: '20px' }}>
        <h2>📢 实时异常告警中心 (Recent Events)</h2>
        <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#1e1e1e', borderRadius: '8px', padding: '10px' }}>
          {events.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center' }}>当前无告警记录</p>
          ) : (
            events.map((evt, index) => (
              <div 
                key={index} 
                style={{
                  borderLeft: '4px solid #ef4444',
                  background: '#2b2b2b',
                  marginBottom: '10px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ color: '#ef4444', marginRight: '10px' }}>{evt.eventType}</strong>
                  <span style={{ color: '#e5e7eb' }}>{evt.description}</span>
                  {evt.trackId && <span style={{ marginLeft: '10px', color: '#fbbf24' }}>[追踪ID: {evt.trackId}]</span>}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '0.85em' }}>
                  {new Date(evt.eventTime).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
