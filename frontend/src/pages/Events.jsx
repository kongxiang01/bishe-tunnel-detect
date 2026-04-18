import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles.css';

const API_BASE = '/api';

// 注意：值必须与算法端 (event_service.py) 保持一致
const EVENT_TYPES = [
  '全部',
  'TRAFFIC_ACCIDENT',
  'FIRE_DISASTER',
  'PEDESTRIAN_INTRUSION',
  'TRAFFIC_CONGESTION',
  'other',
];
const EVENT_TYPE_LABELS = {
  全部: '全部',
  TRAFFIC_ACCIDENT: '交通事故',
  FIRE_DISASTER: '火灾',
  PEDESTRIAN_INTRUSION: '行人闯入',
  TRAFFIC_CONGESTION: '拥堵',
  other: '其他',
};

const TIME_RANGES = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' },
];

const PAGE_SIZE = 20;

// 格式化时间显示，去掉T和毫秒
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  // 兼容 LocalDateTime 格式 (2026-04-14T10:30:00) 和 ISO 格式 (2026-04-14T10:30:00.000)
  const cleaned = dateStr.replace('T', ' ').split('.')[0];
  return cleaned;
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 0, size: PAGE_SIZE, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    eventType: '全部',
    timeRange: 'all',
  });
  const [customTimeRange, setCustomTimeRange] = useState({ startTime: '', endTime: '' });
  const [statistics, setStatistics] = useState({ total: 0, pendingCount: 0, resolvedCount: 0 });
  const [replayModal, setReplayModal] = useState({ visible: false, event: null, loading: false, replayInfo: null });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStatistics = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/events/statistics`, { headers: getAuthHeaders() });
      setStatistics(res.data.data || { total: 0, pendingCount: 0, resolvedCount: 0 });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, []);

  const fetchEvents = useCallback(
    async (page = 0) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('size', PAGE_SIZE.toString());

        if (filters.eventType && filters.eventType !== '全部') {
          params.append('type', filters.eventType);
        }

        // Time range handling
        // 格式化日期为 yyyy-MM-dd HH:mm:ss
        const formatDateTime = (date) => {
          const pad = (n) => String(n).padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        // 将 datetime-local 格式 (yyyy-MM-ddTHH:mm) 转换为后端格式 (yyyy-MM-dd HH:mm:ss)
        const convertLocalDateTime = (value) => {
          if (!value) return null;
          // datetime-local 格式: yyyy-MM-ddTHH:mm
          return value.replace('T', ' ') + ':00';
        };

        if (filters.timeRange === 'custom') {
          if (customTimeRange.startTime) params.append('startTime', convertLocalDateTime(customTimeRange.startTime));
          if (customTimeRange.endTime) params.append('endTime', convertLocalDateTime(customTimeRange.endTime));
        } else if (filters.timeRange === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          params.append('startTime', formatDateTime(today));
        } else if (filters.timeRange === 'week') {
          const today = new Date();
          const dayOfWeek = today.getDay();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - dayOfWeek);
          startOfWeek.setHours(0, 0, 0, 0);
          params.append('startTime', formatDateTime(startOfWeek));
        } else if (filters.timeRange === 'month') {
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          params.append('startTime', formatDateTime(startOfMonth));
        }
        // 'all' - no time filter, show all events

        const res = await axios.get(`${API_BASE}/events/list?${params.toString()}`, {
          headers: getAuthHeaders(),
        });

        // Handle both array and paginated response
        const apiData = res.data.data || {};
        const data = Array.isArray(apiData) ? apiData : apiData.content || apiData.list || [];
        const total = apiData.totalElements || apiData.total || data.length;
        const totalPages = apiData.totalPages || Math.ceil(total / PAGE_SIZE);

        setEvents(data);
        setPagination({ page, size: PAGE_SIZE, total, totalPages });
      } catch (error) {
        console.error('获取事件列表失败:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, customTimeRange]
  );

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchEvents(0);
  }, [filters, customTimeRange, fetchEvents]);

  const handleReplay = async (event) => {
    setReplayModal({ visible: true, event, loading: true, replayInfo: null });
    try {
      const res = await axios.get(`${API_BASE}/events/${event.id}/replay`, { headers: getAuthHeaders() });
      setReplayModal((prev) => ({ ...prev, loading: false, replayInfo: res.data.data }));
    } catch (error) {
      console.error('获取回放信息失败:', error);
      setReplayModal((prev) => ({ ...prev, loading: false }));
      alert('获取回放信息失败');
    }
  };

  const closeReplayModal = () => {
    setReplayModal({ visible: false, event: null, loading: false, replayInfo: null });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchEvents(newPage);
    }
  };

  const getSeverityBadge = (severity) => {
    const config = {
      CRITICAL: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', label: '严重' },
      WARNING: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', label: '警告' },
      NORMAL: { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)', label: '普通' },
    };
    const style = config[severity] || config['NORMAL'];
    return (
      <span className="severity-badge" style={{ background: style.bg, color: style.color, borderColor: style.border }}>
        {style.label}
      </span>
    );
  };

  const getEventTypeLabel = (type) => EVENT_TYPE_LABELS[type] || type;

  const renderPageNumbers = () => {
    const pages = [];
    const { page, totalPages } = pagination;
    const maxVisible = 5;
    let start = Math.max(0, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(0, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button key={i} className={`pagination-btn ${page === i ? 'active' : ''}`} onClick={() => handlePageChange(i)}>
          {i + 1}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="top">
        <h1>事件中心</h1>
        <div className="header-controls">
          <button
            className="header-btn"
            onClick={() => {
              fetchEvents(pagination.page);
              fetchStatistics();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            刷新
          </button>
        </div>
      </header>

      {/* Statistics Bar */}
      <div className="statistics-bar">
        <div className="stat-item">
          <span className="stat-label">总事件数</span>
          <span className="stat-value">{statistics.total}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="control-label">事件类型</label>
          <div className="filter-dropdown">
            <select
              value={filters.eventType}
              onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}
              className="filter-select"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EVENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <svg
              className="dropdown-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <div className="filter-group">
          <label className="control-label">时间范围</label>
          <div className="filter-dropdown">
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters((f) => ({ ...f, timeRange: e.target.value }))}
              className="filter-select"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <svg
              className="dropdown-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {filters.timeRange === 'custom' && (
          <>
            <div className="filter-group">
              <label className="control-label">开始时间</label>
              <input
                type="datetime-local"
                value={customTimeRange.startTime}
                onChange={(e) => setCustomTimeRange((r) => ({ ...r, startTime: e.target.value }))}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="control-label">结束时间</label>
              <input
                type="datetime-local"
                value={customTimeRange.endTime}
                onChange={(e) => setCustomTimeRange((r) => ({ ...r, endTime: e.target.value }))}
                className="filter-input"
              />
            </div>
          </>
        )}

        <div className="filter-results">
          <span className="results-count">共 {pagination.total} 条记录</span>
        </div>
      </div>

      {/* Events List */}
      <section className="events-section">
        {loading ? (
          <div className="events-loading">
            <div className="loading-spinner"></div>
            <span>加载中...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="events-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 15s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <span>暂无事件记录</span>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div
                key={event.id}
                className="event-card-full"
                style={{
                  '--severity-color':
                    event.severity === '严重' ? '#ef4444' : event.severity === '警告' ? '#f59e0b' : '#06b6d4',
                  '--severity-glow':
                    event.severity === '严重'
                      ? '0 0 15px rgba(239, 68, 68, 0.3)'
                      : event.severity === '警告'
                        ? '0 0 15px rgba(245, 158, 11, 0.3)'
                        : '0 0 15px rgba(6, 182, 212, 0.3)',
                }}
              >
                <div className="severity-indicator">
                  <div className="severity-dot"></div>
                </div>

                <div className="event-main">
                  <div className="event-info">
                    <div className="event-header-row">
                      <span className="event-type-badge">{getEventTypeLabel(event.eventType)}</span>
                      {getSeverityBadge(event.severity)}
                    </div>
                    <div className="event-description-full">
                      <span className="desc-text">{event.description}</span>
                    </div>
                  </div>

                  <div className="event-meta">
                    <div className="event-timestamp">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{formatDateTime(event.eventTime)}</span>
                    </div>
                  </div>

                  <div className="event-actions">
                    <button className="action-btn replay-btn" onClick={() => handleReplay(event)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      回放
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pagination */}
      {!loading && events.length > 0 && (
        <div className="pagination">
          <button
            className="pagination-btn nav-btn"
            disabled={pagination.page === 0}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            上一页
          </button>
          <div className="page-numbers">{renderPageNumbers()}</div>
          <button
            className="pagination-btn nav-btn"
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            下一页
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* 回放弹窗 */}
      {replayModal.visible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeReplayModal}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '24px',
              width: '800px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
            >
              <h2 style={{ margin: 0 }}>事件回放</h2>
              <button
                onClick={closeReplayModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  color: 'var(--text-muted)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {replayModal.loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>加载回放信息...</div>
            ) : replayModal.replayInfo ? (
              <>
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>事件类型：</span>
                      {EVENT_TYPE_LABELS[replayModal.replayInfo.eventType] || replayModal.replayInfo.eventType}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>设备名称：</span>
                      {replayModal.replayInfo.deviceName || '-'}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>发生时间：</span>
                      {formatDateTime(replayModal.replayInfo.eventTime)}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>事件描述：</span>
                      {replayModal.replayInfo.description}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '8px',
                    background: 'rgba(245,158,11,0.1)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--accent-warning)',
                  }}
                >
                  注意：若存在历史切片将优先播放历史录像，否则降级显示设备实时流。
                </div>
                <div
                  style={{
                    position: 'relative',
                    background: '#000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    minHeight: '300px',
                  }}
                >
                  {replayModal.replayInfo.streamUrl &&
                  (replayModal.replayInfo.streamUrl.endsWith('.mp4') ||
                    replayModal.replayInfo.streamUrl.endsWith('.webm')) ? (
                    <video
                      src={replayModal.replayInfo.streamUrl}
                      controls
                      autoPlay
                      loop
                      style={{ width: '100%', display: 'block' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <img
                      src={replayModal.replayInfo.streamUrl}
                      alt="事件回放"
                      style={{ width: '100%', display: 'block' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#1a1a1a',
                      color: 'var(--text-muted)',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>视频流加载失败</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-danger)' }}>
                无法加载回放信息
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Styles for Events Page */}
      <style>{`
        .statistics-bar {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          margin-bottom: var(--spacing-lg);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          min-width: 120px;
        }

        .stat-item.pending {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .stat-item.resolved {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-item.pending .stat-value {
          color: #f59e0b;
        }

        .stat-item.resolved .stat-value {
          color: #10b981;
        }

        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-lg);
          align-items: flex-end;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          margin-bottom: var(--spacing-lg);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .filter-dropdown {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-select {
          appearance: none;
          padding: var(--spacing-sm) var(--spacing-xl) var(--spacing-sm) var(--spacing-md);
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          min-width: 120px;
        }

        .filter-input {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.875rem;
          min-width: 180px;
        }

        .filter-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--accent-primary-dim);
        }

        .filter-select:hover {
          border-color: var(--border-hover);
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--accent-primary-dim);
        }

        .dropdown-arrow {
          position: absolute;
          right: var(--spacing-sm);
          color: var(--text-muted);
          pointer-events: none;
        }

        .filter-results {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .results-count {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .events-section {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          padding: var(--spacing-lg);
          min-height: 400px;
        }

        .events-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: var(--text-muted);
          gap: var(--spacing-md);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-default);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .events-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: var(--text-muted);
          gap: var(--spacing-md);
        }

        .events-empty svg {
          opacity: 0.5;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .event-card-full {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          border-left: 4px solid var(--severity-color);
          transition: all var(--transition-fast);
        }

        .event-card-full:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          transform: translateX(4px);
          box-shadow: var(--severity-glow);
        }

        .severity-indicator {
          flex-shrink: 0;
        }

        .severity-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--severity-color);
          box-shadow: 0 0 10px var(--severity-color);
        }

        .event-main {
          display: flex;
          flex: 1;
          align-items: center;
          gap: var(--spacing-lg);
          min-width: 0;
        }

        .event-info {
          flex: 1;
          min-width: 0;
        }

        .event-header-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
        }

        .event-type-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-secondary);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .severity-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid;
        }

        .event-description-full {
          font-size: 0.9rem;
        }

        .desc-text {
          color: var(--text-secondary);
        }

        .event-meta {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          flex-shrink: 0;
          min-width: 150px;
        }

        .event-timestamp {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .event-timestamp svg {
          flex-shrink: 0;
        }

        .event-actions {
          display: flex;
          gap: var(--spacing-sm);
          flex-shrink: 0;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          border: 1px solid;
        }

        .replay-btn {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: var(--accent-secondary);
        }

        .replay-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: var(--accent-secondary);
          transform: translateY(-1px);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
          padding: var(--spacing-md);
        }

        .pagination-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          color: var(--text-primary);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn.active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #000;
          font-weight: 600;
        }

        .nav-btn {
          background: var(--bg-surface);
        }

        .page-numbers {
          display: flex;
          gap: var(--spacing-xs);
        }

        @media (max-width: 1024px) {
          .event-main {
            flex-wrap: wrap;
          }

          .event-meta {
            flex-direction: row;
            gap: var(--spacing-md);
            width: 100%;
            margin-top: var(--spacing-sm);
          }
        }

        @media (max-width: 768px) {
          .statistics-bar {
            flex-direction: column;
          }

          .stat-item {
            width: 100%;
          }

          .filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-results {
            margin-left: 0;
            margin-top: var(--spacing-sm);
          }

          .event-card-full {
            flex-direction: column;
            align-items: flex-start;
          }

          .event-main {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }

          .event-actions {
            width: 100%;
            margin-top: var(--spacing-sm);
          }

          .action-btn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
