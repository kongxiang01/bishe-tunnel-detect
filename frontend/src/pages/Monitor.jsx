import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CameraGrid from '../components/CameraGrid';
import useMonitorStore from '../stores/useMonitorStore';
import '../styles.css';

const API_BASE = '/api';

export default function Monitor() {
  const [health, setHealth] = useState('checking');
  const [events, setEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();

  const { isDetecting, setIsDetecting } = useMonitorStore();

  // 弹窗容器引用（用于 flex 堆叠）
  const toastContainerRef = useRef(null);

  // 播放警报音效 — 一声长警报
  const playAlertSound = (onEnd) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const duration = 3.0;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);

      // 声音结束后立即触发语音
      osc.onended = () => onEnd?.();
    } catch (e) {
      console.warn('Audio alert failed:', e);
      onEnd?.(); // 出错时也尝试播语音
    }
  };

  // 报警文字语音播报（Web Speech API）
  const speakAlertText = (eventObj) => {
    const eventType = eventObj.eventType?.toUpperCase() || '';
    if (!window.speechSynthesis) return;

    // 取消之前所有待处理的语音，立即播报新的
    window.speechSynthesis.cancel();

    let text = '';
    if (eventType === 'FIRE_DISASTER' || eventType === 'FIRE') text = '火灾警报，请立即处理';
    else if (eventType === 'TRAFFIC_ACCIDENT') text = '交通事故警报，请立即处理';
    else if (eventType === 'PEDESTRIAN_INTRUSION') text = '行人闯入警报';
    else text = '收到一条告警通知';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.2;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // 设置 Authorization header
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    } else {
      navigate('/login');
      return;
    }

    // 获取健康状态
    axios
      .get(API_BASE + '/health')
      .then((r) => setHealth(r.data?.data?.status || r.data?.status || 'unknown'))
      .catch(() => setHealth('offline'));

    // 获取设备列表
    axios
      .get(API_BASE + '/devices/list')
      .then((res) => {
        if (res.data.code === 200 && res.data.data.length > 0) {
          setDevices(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch devices', err);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      });

    // ===== 建立 SSE 连接，接收后端实时告警事件 =====
    const sseUrl = `${API_BASE}/events/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('newEvent', (e) => {
      try {
        const newEvent = JSON.parse(e.data);
        console.log('【实时收到后端告警推送】:', newEvent);
        // 弹窗警报
        showAlert(newEvent);
        // 更新事件列表
        setEvents((prev) => {
          // 避免重复（基于后端ID去重）
          if (prev.find((item) => item.id === newEvent.id)) return prev;
          return [newEvent, ...prev].slice(0, 100); // 仅保留最新100条
        });
      } catch (err) {
        console.error('Parse SSE event error:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE connection error', err);
      // 处理断线重连等可以在此做，默认EventSource会自动重连
    };

    return () => {
      eventSource.close();
    };
  }, [navigate]);

  const showAlert = (eventObj) => {
    const eventType = eventObj.eventType?.toUpperCase() || '';
    const severity = eventObj.severity?.toUpperCase() || 'NORMAL';

    // 所有级别都弹窗，只是样式不同
    const isCritical = severity === 'CRITICAL';
    const isWarning = severity === 'WARNING';
    const isNormal = severity === 'NORMAL';

    // 获取事件类型中文描述
    let typeStr = '事件通知';
    if (eventType === 'TRAFFIC_ACCIDENT') typeStr = '交通事故';
    else if (eventType === 'FIRE_DISASTER' || eventType === 'FIRE') typeStr = '火灾事故';
    else if (eventType === 'PEDESTRIAN_INTRUSION') typeStr = '行人闯入';
    else if (eventType === 'TRAFFIC_CONGESTION') typeStr = '交通拥堵';

    let toastClass = 'normal';
    if (isCritical) toastClass = 'danger';
    else if (isWarning) toastClass = 'warning';

    // CRITICAL 播放声音警报，结束后立即播报语音
    if (isCritical) {
      playAlertSound(() => speakAlertText(eventObj));
    }

    // 创建弹窗 DOM，追加到 toastContainer 中
    const toast = document.createElement('div');
    toast.className = `alert-toast ${toastClass}`;
    toast.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <strong>🚨 ${isCritical ? '严重告警' : isWarning ? '告警' : '通知'} - ${typeStr}</strong>
        <button class="toast-close-btn" style="background: none; border: none; font-size: 1.5rem; color: white; cursor: pointer; line-height: 1; padding: 0;">&times;</button>
      </div>
      <p>${eventObj.description}</p>
      <p><small>设备: ${eventObj.deviceName || '未知'} | 时间: ${new Date(eventObj.eventTime).toLocaleString()}</small></p>
    `;

    const container = toastContainerRef.current || document.body;
    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.onclick = () => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    };
  };

  useEffect(() => {
    const fetchEvents = () => {
      axios
        .get(API_BASE + '/events/list')
        .then((res) => {
          const apiData = res.data.data || {};
          if (apiData.content) {
            setEvents(apiData.content);
          } else if (Array.isArray(apiData)) {
            setEvents(apiData);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch events:', err);
          if (err.response?.status === 401) {
            navigate('/login');
          }
        });
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleCameraEvent = (event) => {
    console.log('Camera event received:', event);
  };

  const getHealthBadgeClass = () => {
    switch (health) {
      case 'healthy':
      case 'online':
        return 'badge online';
      case 'offline':
      case 'error':
        return 'badge offline';
      default:
        return 'badge neutral';
    }
  };

  const getHealthLabel = () => {
    switch (health) {
      case 'healthy':
      case 'online':
        return '系统在线';
      case 'offline':
      case 'error':
        return '系统离线';
      case 'checking':
        return '检测中...';
      default:
        return '未知状态';
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="top">
        <h1>隧道交通监控中心</h1>
        <div className="header-controls">
          <button className="header-btn" onClick={() => navigate('/devices')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            设备管理
          </button>
          <span className={getHealthBadgeClass()}>{getHealthLabel()}</span>
          <button
            className="header-btn danger"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              navigate('/login');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            退出登录
          </button>
        </div>
      </header>

      {/* Main Surveillance Section */}
      <section className="card card-stream">
        <div className="card-header">
          <h2>多路监控画面</h2>
          <button
            className={`simulate-btn ${isDetecting ? 'active' : 'paused'}`}
            onClick={() => setIsDetecting(!isDetecting)}
          >
            {isDetecting ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                停止检测
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                开始检测
              </>
            )}
          </button>
        </div>

        <CameraGrid devices={devices} onEvent={handleCameraEvent} />
      </section>

      {/* Events Section */}
      <section className="card card-events" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h2>实时告警中心</h2>
          <span className="badge warning">{events.length} 条事件</span>
        </div>
        <div className="events-container">
          {events.length === 0 ? (
            <div className="empty-events">
              <span>暂无告警信息</span>
            </div>
          ) : (
            events.map((evt, index) => (
              <div
                key={index}
                className={`event-card ${evt.eventType?.toLowerCase().includes('warning') ? 'warning' : ''}`}
              >
                <div className="event-icon">
                  {evt.eventType?.toLowerCase().includes('warning') ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  )}
                </div>
                <div className="event-content">
                  <div className="event-type">{evt.eventType}</div>
                  <div className="event-description">
                    {evt.description}
                    {evt.trackId && <span className="event-track-id">ID: {evt.trackId}</span>}
                  </div>
                </div>
                <div className="event-time">{evt.eventTime ? evt.eventTime.replace('T', ' ').split('.')[0] : '-'}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 弹窗容器，flex column 使新弹窗在下方弹出 */}
      <div
        ref={toastContainerRef}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
        }}
      />
    </div>
  );
}
