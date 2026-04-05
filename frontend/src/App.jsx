import { useEffect, useState, useRef } from 'react';
import './styles.css';

const API_BASE = 'http://localhost:8080/api';

export default function App() {
  const [health, setHealth] = useState('checking');
  const canvasRef = useRef(null);

  // 初始化健康检查
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setHealth(d.status || 'unknown'))
      .catch(() => setHealth('offline'));
  }, []);

  // 联调的核心触发点：手动请求后端处理当前画面并返回坐标
  const processMockFrame = async () => {
    try {
      // 通过 Axios/Fetch 调用我们的 Spring Boot API 端点
      const response = await fetch(`${API_BASE}/stream/mock-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // 固化调用咱们电脑里的那张照片，模拟视频的某一帧
          imagePath: "F:\\workspace\\graduation_project\\algorithm\\yolov5\\data\\images\\bus.jpg" 
        })
      });
      const data = await response.json();
      
      if (data && data.detections) {
        drawBBoxes(data.detections);
      }
    } catch (error) {
      console.error('获取帧检测结果失败:', error);
      alert('联调调用失败！请确保后端8080和算法8000都在运行');
    }
  };

  // 在 Canvas 专属图层上绘制红框
  const drawBBoxes = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 清空上一帧的画布内容 (虽然只点一次，但在多帧推流中非常有必要)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(det => {
      // 算法直接把图片的绝对像素坐标传来: [x1, y1, x2, y2]
      const [x1, y1, x2, y2] = det.bbox;
      const width = x2 - x1;
      const height = y2 - y1;

      // 开始绘画！绘制车辆/行人红色方框
      ctx.strokeStyle = '#ff0b3a';
      ctx.lineWidth = 4;
      ctx.strokeRect(x1, y1, width, height);

      // 绘制左上角的小铭牌 (带填充底色)
      ctx.fillStyle = '#ff0b3a';
      // ctx.measureText() 是一个极其好用的 API，用来撑宽背景！
      ctx.fillRect(x1, y1 - 28, ctx.measureText(det.class_name).width + 65, 28);
      
      // 绘画文字标签 (内容 + 可信度%)
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      ctx.fillText(`${det.class_name} ${(det.confidence * 100).toFixed(1)}%`, x1 + 5, y1 - 6);
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
          <button className="simulate-btn" onClick={processMockFrame}>
            [联调] 获取分析数据并画框
          </button>
        </div>
        
        {/* 重点设计：这个框里的东西完美对应您最终期的 "底层流、顶层透明框" 结构 */}
        <div className="player-wrapper">
          {/* 将来这里替换成 <video src="...">, 现在用网络版同款图作为底版假装它是一帧 */}
          <img 
            src="https://raw.githubusercontent.com/ultralytics/yolov5/master/data/images/bus.jpg" 
            alt="stream-background" 
            className="stream-video"
            onLoad={(e) => {
              // 骚操作：在图层加载时，让顶层 Canvas 的网格数强行=底面原始分辨率(810*1080)
              // 这样在 JS 里用原分辨率去画框时，才不会产生错位和漂移。
              canvasRef.current.width = e.target.naturalWidth;
              canvasRef.current.height = e.target.naturalHeight;
            }}
          />
          
          <canvas 
            ref={canvasRef} 
            className="overlay-canvas"
          />
        </div>
      </section>

      <section className="card">
        <h2>Recent Events</h2>
        <p>正在打通阶段一链路，异常检测与报警分发系统将在集成多目标追踪(DeepSORT)算法后持续滚动日志…</p>
      </section>
    </div>
  );
}
