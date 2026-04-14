import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CameraGrid from '../components/CameraGrid';
import '../styles.css';

const API_BASE = '/api';

export default function Monitor() {
  const [health, setHealth] = useState('checking');
  const [isDetecting, setIsDetecting] = useState(true);
  const [events, setEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 设置 Authorization header
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    } else {
      // 没有 token，跳转登录
      navigate('/login');
      return;
    }

    // 获取健康状态
    axios.get(API_BASE + '/health')
      .then((r) => setHealth(r.data.status || 'unknown'))
      .catch(() => setHealth('offline'));

    // 获取设备列表
    axios.get(API_BASE + '/devices/list')
      .then(res => {
        if (res.data.code === 200 && res.data.data.length > 0) {
          setDevices(res.data.data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch devices', err);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      });
  }, [navigate]);

  useEffect(() => {
    const fetchEvents = () => {
      axios.get(API_BASE + '/events/list')
        .then(res => {
          // 后端返回 Page 对象，需要取 content 字段
          if (res.data && res.data.content) {
            setEvents(res.data.content);
          } else if (Array.isArray(res.data)) {
            setEvents(res.data);
          }
        })
        .catch(err => {
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
          <button
            className="header-btn"
            onClick={() => navigate('/devices')}
          >
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

        <CameraGrid
          devices={devices}
          isDetecting={isDetecting}
          onEvent={handleCameraEvent}
        />
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
                    {evt.trackId && (
                      <span className="event-track-id">ID: {evt.trackId}</span>
                    )}
                  </div>
                </div>
                <div className="event-time">
                  {evt.eventTime ? evt.eventTime.replace('T', ' ').split('.')[0] : '-'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
