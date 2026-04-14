import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles.css';

const API_BASE = '/api';

// 注意：值必须与算法端 (event_service.py) 保持一致
const EVENT_TYPES = ['全部', 'TRAFFIC_ACCIDENT', 'FIRE_DISASTER', 'PEDESTRIAN_INTRUSION', 'TRAFFIC_CONGESTION', 'other'];
const EVENT_TYPE_LABELS = {
  '全部': '全部',
  'TRAFFIC_ACCIDENT': '交通事故',
  'FIRE_DISASTER': '火灾',
  'PEDESTRIAN_INTRUSION': '行人闯入',
  'TRAFFIC_CONGESTION': '拥堵',
  'other': '其他'
};

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待处理' },
  { value: 'RESOLVED', label: '已处理' }
];

const TIME_RANGES = [
  { value: 'all', label: '全部' },
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' }
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
    status: '',
    timeRange: 'all'
  });
  const [customTimeRange, setCustomTimeRange] = useState({ startTime: '', endTime: '' });
  const [statistics, setStatistics] = useState({ total: 0, pendingCount: 0, resolvedCount: 0 });
  const [processingId, setProcessingId] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStatistics = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/events/statistics`, { headers: getAuthHeaders() });
      setStatistics(res.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, []);

  const fetchEvents = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', PAGE_SIZE.toString());

      if (filters.eventType && filters.eventType !== '全部') {
        params.append('type', filters.eventType);
      }
      if (filters.status) {
        params.append('status', filters.status);
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
        headers: getAuthHeaders()
      });

      // Handle both array and paginated response
      const data = Array.isArray(res.data) ? res.data : (res.data.content || res.data.list || []);
      const total = res.data.totalElements || res.data.total || data.length;
      const totalPages = res.data.totalPages || Math.ceil(total / PAGE_SIZE);

      setEvents(data);
      setPagination({ page, size: PAGE_SIZE, total, totalPages });
    } catch (error) {
      console.error('获取事件列表失败:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters, customTimeRange]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchEvents(0);
  }, [filters, customTimeRange, fetchEvents]);

  const handleResolve = async (eventId) => {
    setProcessingId(eventId);
    try {
      await axios.put(
        `${API_BASE}/events/${eventId}/status`,
        { status: 'RESOLVED' },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      await fetchEvents(pagination.page);
      await fetchStatistics();
    } catch (error) {
      console.error('处理事件失败:', error);
      alert('处理失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchEvents(newPage);
    }
  };

  const getSeverityBadge = (severity) => {
    const config = {
      '严重': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', label: '严重' },
      '警告': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)', label: '警告' },
      '普通': { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)', label: '普通' }
    };
    const style = config[severity] || config['普通'];
    return (
      <span className="severity-badge" style={{ background: style.bg, color: style.color, borderColor: style.border }}>
        {style.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const isPending = status === 'PENDING';
    return (
      <span className={`status-badge ${isPending ? 'pending' : 'resolved'}`}>
        {isPending ? '待处理' : '已处理'}
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
        <button
          key={i}
          className={`pagination-btn ${page === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
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
          <button className="header-btn" onClick={() => { fetchEvents(pagination.page); fetchStatistics(); }}>
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
        <div className="stat-item pending">
          <span className="stat-label">待处理</span>
          <span className="stat-value">{statistics.pendingCount}</span>
        </div>
        <div className="stat-item resolved">
          <span className="stat-label">已处理</span>
          <span className="stat-value">{statistics.resolvedCount}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="control-label">事件类型</label>
          <div className="filter-dropdown">
            <select
              value={filters.eventType}
              onChange={(e) => setFilters(f => ({ ...f, eventType: e.target.value }))}
              className="filter-select"
            >
              {EVENT_TYPES.map(type => (
                <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>
              ))}
            </select>
            <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <div className="filter-group">
          <label className="control-label">处理状态</label>
          <div className="filter-dropdown">
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="filter-select"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <div className="filter-group">
          <label className="control-label">时间范围</label>
          <div className="filter-dropdown">
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(f => ({ ...f, timeRange: e.target.value }))}
              className="filter-select"
            >
              {TIME_RANGES.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
            <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                onChange={(e) => setCustomTimeRange(r => ({ ...r, startTime: e.target.value }))}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="control-label">结束时间</label>
              <input
                type="datetime-local"
                value={customTimeRange.endTime}
                onChange={(e) => setCustomTimeRange(r => ({ ...r, endTime: e.target.value }))}
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
                  '--severity-color': event.severity === '严重' ? '#ef4444' : event.severity === '警告' ? '#f59e0b' : '#06b6d4',
                  '--severity-glow': event.severity === '严重' ? '0 0 15px rgba(239, 68, 68, 0.3)' : event.severity === '警告' ? '0 0 15px rgba(245, 158, 11, 0.3)' : '0 0 15px rgba(6, 182, 212, 0.3)'
                }}
              >
                <div className="severity-indicator">
                  <div className="severity-dot"></div>
                </div>

                <div className="event-main">
                  <div className="event-info">
                    <div className="event-header-row">
                      <span className="event-type-badge">
                        {getEventTypeLabel(event.eventType)}
                      </span>
                      {getSeverityBadge(event.severity)}
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="event-description-full">
                      {event.plate && (
                        <>
                          <span className="plate-number">{event.plate}</span>
                          <span className="desc-separator"> - </span>
                        </>
                      )}
                      <span className="desc-text">{event.description}</span>
                    </div>
                  </div>

                  <div className="event-meta">
                    <div className="event-location">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>{event.deviceName || '-'}</span>
                    </div>
                    <div className="event-timestamp">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>{formatDateTime(event.eventTime)}</span>
                    </div>
                  </div>

                  <div className="event-actions">
                    {event.status === 'PENDING' && (
                      <button
                        className="action-btn process-btn"
                        onClick={() => handleResolve(event.id)}
                        disabled={processingId === event.id}
                      >
                        {processingId === event.id ? (
                          <span className="btn-spinner"></span>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                        处理
                      </button>
                    )}
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
          <div className="page-numbers">
            {renderPageNumbers()}
          </div>
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

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.pending {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-badge.resolved {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .event-description-full {
          font-size: 0.9rem;
        }

        .plate-number {
          font-weight: 600;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
        }

        .desc-separator {
          color: var(--text-muted);
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

        .event-location,
        .event-timestamp {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .event-location svg,
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

        .process-btn {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10b981;
        }

        .process-btn:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          transform: translateY(-1px);
        }

        .process-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
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