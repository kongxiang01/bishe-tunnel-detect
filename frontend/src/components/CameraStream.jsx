import { useEffect, useState, useRef } from 'react';

const ALGO_WS = 'ws://localhost:8000/ws/stream';

export default function CameraStream({ device, isDetecting, onEvent, style }) {
  const canvasRef = useRef(null);
  const [frameCount, setFrameCount] = useState(0);
  const [streamStatus, setStreamStatus] = useState('connecting');

  useEffect(() => {
    let ws = null;

    if (isDetecting && device?.streamUrl) {
      const targetUrl = encodeURIComponent(device.streamUrl);
      ws = new WebSocket(`${ALGO_WS}?stream_url=${targetUrl}`);

      ws.onopen = () => {
        console.log('Connected to algorithm stream:', device.name);
        setStreamStatus('connected');
        const img = document.getElementById('live-stream-img-' + device.id);
        if (canvasRef.current && img && img.naturalWidth) {
          canvasRef.current.width = img.naturalWidth;
          canvasRef.current.height = img.naturalHeight;
        }
      };

      let lastFpsTime = performance.now();
      let frameCount = 0;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          const now = performance.now();
          frameCount++;
          if (now - lastFpsTime >= 1000) {
            setFrameCount(frameCount);
            frameCount = 0;
            lastFpsTime = now;
          }

          if (data.detections) {
            drawBBoxes(data.detections);
          }

          if (data.events && onEvent) {
            data.events.forEach(evt => onEvent({ ...evt, deviceId: device.id, deviceName: device.name }));
          }
        } catch (e) {
          console.error("Parse WS msg error", e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error for device:', device.name, error);
        setStreamStatus('error');
      };

      ws.onclose = () => {
        console.log('WebSocket closed for device:', device.name);
        setStreamStatus('disconnected');
      };
    }

    return () => {
      if (ws) ws.close();
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
  }, [isDetecting, device]);

  const drawBBoxes = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sortedDetections = [...detections].sort((a, b) => {
      if (a.class_name === 'accident' && b.class_name !== 'accident') return 1;
      if (a.class_name !== 'accident' && b.class_name === 'accident') return -1;
      return 0;
    });

    sortedDetections.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const width = x2 - x1;
      const height = y2 - y1;

      // Determine color based on detection type
      const isAccident = det.class_name === 'accident';
      const isWarning = det.class_name === 'fire';

      let strokeColor;
      if (isAccident) {
        strokeColor = '#ef4444';
      } else if (isWarning) {
        strokeColor = '#f59e0b';
      } else {
        strokeColor = '#00d4ff';
      }

      // Glow effect
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 8;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

      ctx.shadowBlur = 0;

      // Label background
      const text = `${det.class_name} ${(det.confidence * 100).toFixed(1)}%`;
      const trackIdText = det.track_id !== undefined ? ` ID:${det.track_id}` : '';
      const fullText = text + trackIdText;

      ctx.font = 'bold 14px Inter, sans-serif';
      const textWidth = ctx.measureText(fullText).width;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(x1, y1 - 26, textWidth + 16, 24);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(fullText, x1 + 8, y1 - 8);
    });
  };

  if (!device) return null;

  return (
    <div className="camera-stream" style={style}>
      <div className="stream-header">
        <div className="stream-title">
          <div style={styles.statusDot(streamStatus)} />
          <h3 style={styles.title}>{device.name}</h3>
          <span style={styles.location}>{device.location}</span>
        </div>
        <div style={styles.headerRight}>
          <span className="fps-indicator">
            {frameCount} FPS
          </span>
        </div>
      </div>

      <div className="player-wrapper">
        <div className="aspect-box">
          <img
            id={'live-stream-img-' + device.id}
            src={device.streamUrl}
            className="stream-video"
            alt={device.name + ' 视频流'}
            style={styles.video}
            onLoad={(e) => {
              if (canvasRef.current) {
                canvasRef.current.width = e.target.naturalWidth;
                canvasRef.current.height = e.target.naturalHeight;
              }
              setStreamStatus('streaming');
            }}
            onError={() => setStreamStatus('error')}
          />
          <canvas
            ref={canvasRef}
            className="overlay-canvas"
            style={styles.canvas}
          />
          {!isDetecting && (
            <div style={styles.pausedOverlay}>
              <div style={styles.pauseIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              </div>
              <span>检测已暂停</span>
            </div>
          )}
          {streamStatus === 'error' && (
            <div style={styles.errorOverlay}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>视频流错误</span>
            </div>
          )}
          {streamStatus === 'connecting' && (
            <div style={styles.connectingOverlay}>
              <div style={styles.spinner} />
              <span>连接中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  statusDot: (status) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: status === 'connected' || status === 'streaming' ? '#10b981' :
                      status === 'connecting' ? '#f59e0b' : '#ef4444',
    boxShadow: status === 'connected' || status === 'streaming'
      ? '0 0 8px #10b981' : 'none',
    animation: status === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none',
    flexShrink: 0,
  }),
  title: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0,
  },
  location: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginLeft: '8px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none',
    zIndex: 1,
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    zIndex: 2,
    gap: '8px',
  },
  pauseIcon: {
    color: 'var(--text-muted)',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    color: 'var(--accent-danger)',
    fontSize: '0.9rem',
    zIndex: 2,
    gap: '8px',
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    zIndex: 2,
    gap: '8px',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '2px solid var(--border-default)',
    borderTopColor: 'var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
