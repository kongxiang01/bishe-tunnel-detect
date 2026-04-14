import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles.css';

const API_BASE = '/api';

// Mock data for MVP
const mockEvents = [
  { id: 1, type: '超速', severity: '严重', plate: '鄂A12345', desc: '超速 85km/h', device: '隧道入口', time: '2026-04-14 10:30:15', status: '待处理' },
  { id: 2, type: '违停', severity: '警告', plate: '鄂B67890', desc: '停车超过3分钟', device: '隧道出口', time: '2026-04-14 10:28:30', status: '已处理' },
  { id: 3, type: '逆行', severity: '严重', plate: '鄂C11111', desc: '逆向行驶', device: '隧道中段', time: '2026-04-14 10:25:00', status: '待处理' },
  { id: 4, type: '超速', severity: '警告', plate: '鄂D22222', desc: '超速 72km/h', device: '隧道入口', time: '2026-04-14 10:20:45', status: '已处理' },
  { id: 5, type: '其他', severity: '普通', plate: '鄂E33333', desc: '异常物品遗留', device: '隧道出口', time: '2026-04-14 10:15:30', status: '已处理' },
  { id: 6, type: '违停', severity: '警告', plate: '鄂F44444', desc: '停车超过2分钟', device: '隧道中段', time: '2026-04-14 10:10:00', status: '待处理' },
  { id: 7, type: '超速', severity: '严重', plate: '鄂G55555', desc: '超速 95km/h', device: '隧道入口', time: '2026-04-14 09:55:20', status: '已处理' },
  { id: 8, type: '逆行', severity: '严重', plate: '鄂H66666', desc: '逆向行驶', device: '隧道出口', time: '2026-04-14 09:48:10', status: '待处理' },
];

const EVENT_TYPES = ['全部', '超速', '违停', '逆行', '其他'];
const SEVERITIES = ['全部', '严重', '警告', '普通'];
const TIME_RANGES = ['今日', '本周', '本月', '自定义'];

const ITEMS_PER_PAGE = 5;

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedSeverity, setSelectedSeverity] = useState('全部');
  const [selectedTimeRange, setSelectedTimeRange] = useState('今日');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    let filtered = [...events];

    if (selectedType !== '全部') {
      filtered = filtered.filter(e => e.type === selectedType);
    }

    if (selectedSeverity !== '全部') {
      filtered = filtered.filter(e => e.severity === selectedSeverity);
    }

    // Time range filtering (simplified for MVP)
    // In production, this would filter by actual timestamps
    if (selectedTimeRange !== '自定义') {
      // For demo, just show all since mock data is all from today
      filtered = filtered;
    }

    setFilteredEvents(filtered);
    setCurrentPage(1);
  }, [selectedType, selectedSeverity, selectedTimeRange, events]);

  const getSeverityIndicator = (severity) => {
    switch (severity) {
      case '严重':
        return { color: 'var(--accent-danger)', glow: 'var(--shadow-danger)' };
      case '警告':
        return { color: 'var(--accent-warning)', glow: '0 0 15px rgba(245, 158, 11, 0.3)' };
      case '普通':
        return { color: 'var(--accent-primary)', glow: 'var(--shadow-glow)' };
      default:
        return { color: 'var(--text-muted)', glow: 'none' };
    }
  };

  const getEventTypeBadge = (type) => {
    const typeColors = {
      '超速': { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', border: 'rgba(239, 68, 68, 0.3)' },
      '违停': { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)', border: 'rgba(245, 158, 11, 0.3)' },
      '逆行': { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', border: 'rgba(239, 68, 68, 0.3)' },
      '其他': { bg: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-secondary)', border: 'rgba(59, 130, 246, 0.3)' },
    };
    return typeColors[type] || typeColors['其他'];
  };

  const handleProcess = (eventId) => {
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, status: '已处理' } : e
    ));
  };

  const handleDetails = (eventId) => {
    console.log('查看事件详情:', eventId);
    // In production, this would open a modal or navigate to details page
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setEvents([...mockEvents]);
      setFilteredEvents([...mockEvents]);
      setLoading(false);
    }, 500);
  };

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => setCurrentPage(i)}
        >
          {i}
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
          <button className="header-btn" onClick={handleRefresh}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            刷新
          </button>
        </div>
      </header>

      {/* Filter Controls */}
      <div className="filter-bar">
        {/* Event Type Dropdown */}
        <div className="filter-group">
          <label className="control-label">事件类型</label>
          <div className="filter-dropdown">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              {EVENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {/* Severity Dropdown */}
        <div className="filter-group">
          <label className="control-label">严重程度</label>
          <div className="filter-dropdown">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="filter-select"
            >
              {SEVERITIES.map(severity => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </select>
            <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {/* Time Range Dropdown */}
        <div className="filter-group">
          <label className="control-label">时间范围</label>
          <div className="filter-dropdown">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="filter-select"
            >
              {TIME_RANGES.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {/* Results Count */}
        <div className="filter-results">
          <span className="results-count">共 {filteredEvents.length} 条记录</span>
        </div>
      </div>

      {/* Events List */}
      <section className="events-section">
        {loading ? (
          <div className="events-loading">
            <div className="loading-spinner"></div>
            <span>加载中...</span>
          </div>
        ) : currentEvents.length === 0 ? (
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
            {currentEvents.map((event) => {
              const severityStyle = getSeverityIndicator(event.severity);
              const typeBadge = getEventTypeBadge(event.type);

              return (
                <div
                  key={event.id}
                  className="event-card-full"
                  style={{ '--severity-color': severityStyle.color, '--severity-glow': severityStyle.glow }}
                >
                  {/* Severity Indicator */}
                  <div className="severity-indicator">
                    <div className="severity-dot"></div>
                  </div>

                  {/* Main Content */}
                  <div className="event-main">
                    {/* Left Section - Event Info */}
                    <div className="event-info">
                      <div className="event-header-row">
                        <span
                          className="event-type-badge"
                          style={{
                            background: typeBadge.bg,
                            color: typeBadge.color,
                            borderColor: typeBadge.border
                          }}
                        >
                          {event.type}
                        </span>
                        <span className={`status-badge ${event.status === '待处理' ? 'pending' : 'resolved'}`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="event-description-full">
                        <span className="plate-number">{event.plate}</span>
                        <span className="desc-separator"> - </span>
                        <span className="desc-text">{event.desc}</span>
                      </div>
                    </div>

                    {/* Middle Section - Location & Time */}
                    <div className="event-meta">
                      <div className="event-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>{event.device}</span>
                      </div>
                      <div className="event-timestamp">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>{event.time}</span>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="event-actions">
                      {event.status === '待处理' && (
                        <button
                          className="action-btn process-btn"
                          onClick={() => handleProcess(event.id)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          处理
                        </button>
                      )}
                      <button
                        className="action-btn details-btn"
                        onClick={() => handleDetails(event.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        详情
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pagination */}
      {!loading && filteredEvents.length > 0 && (
        <div className="pagination">
          <button
            className="pagination-btn nav-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
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
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
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
          color: var(--accent-warning);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-badge.resolved {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-success);
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
          color: var(--accent-success);
        }

        .process-btn:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: var(--accent-success);
          transform: translateY(-1px);
        }

        .details-btn {
          background: var(--bg-surface);
          border-color: var(--border-default);
          color: var(--text-secondary);
        }

        .details-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          color: var(--text-primary);
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

        /* Responsive */
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
