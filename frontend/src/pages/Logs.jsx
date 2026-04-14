import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PAGE_SIZE = 10;

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(0); // Spring uses 0-based pages
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Client-side level filter
  const [levelFilter, setLevelFilter] = useState('全部');

  const fetchLogs = useCallback(async (page) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/v1/logs', {
        params: { page, size: PAGE_SIZE },
        headers: authHeader(),
      });
      const data = res.data.data || {};
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.message || '加载日志失败，请检查后端连接');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, fetchLogs]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'INFO':  return 'online';
      case 'WARN':  return 'warning';
      case 'ERROR': return 'offline';
      default:      return 'neutral';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'INFO':  return 'var(--accent-primary)';
      case 'WARN':  return 'var(--accent-warning)';
      case 'ERROR': return 'var(--accent-danger)';
      default:      return 'var(--text-secondary)';
    }
  };

  // Client-side filter applied to the current page's data
  const filteredLogs = logs.filter((log) => {
    if (levelFilter === '全部') return true;
    // Map API action field to level: try log.level first, fall back to deriving from action
    const level = log.level || (log.action || '').toUpperCase();
    return level === levelFilter;
  });

  const thStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  };

  return (
    <div className="page">
      <div className="top">
        <h1>日志查看</h1>
        <div className="header-controls">
          <button
            className="header-btn"
            onClick={() => fetchLogs(currentPage)}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            刷新
          </button>
        </div>
      </div>

      {/* Level filter — applied client-side on the fetched page */}
      <div className="control-bar">
        <div className="control-group">
          <span className="control-label">日志级别</span>
          <div className="layout-toggle">
            {['全部', 'INFO', 'WARN', 'ERROR'].map((level) => (
              <button
                key={level}
                className={`layout-toggle-btn ${levelFilter === level ? 'active' : ''}`}
                onClick={() => setLevelFilter(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>日志列表</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {loading ? '加载中...' : `共 ${totalElements} 条记录`}
          </span>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-danger)',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-default)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <span>加载日志中...</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={thStyle}>时间</th>
                <th style={thStyle}>级别</th>
                <th style={thStyle}>用户</th>
                <th style={thStyle}>操作</th>
                <th style={thStyle}>详情</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    暂无日志记录
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  // Derive a display level from the action string for coloring
                  const rawLevel = log.level || '';
                  const actionUpper = (log.action || '').toUpperCase();
                  const displayLevel = rawLevel || (
                    actionUpper.includes('ERROR') ? 'ERROR' :
                    actionUpper.includes('WARN')  ? 'WARN'  : 'INFO'
                  );

                  return (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid var(--border-default)', transition: 'background var(--transition-fast)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {log.createTime || '—'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${getLevelBadgeClass(displayLevel)}`}>
                          {displayLevel}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {log.username || '—'}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)' }}>
                        {log.action || '—'}
                        {log.targetResource && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>
                            [{log.targetResource}]
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: getLevelColor(displayLevel), fontSize: '0.875rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border-default)', marginTop: '8px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              第 {currentPage + 1} / {totalPages} 页
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="header-btn"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                disabled={currentPage === 0}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                上一页
              </button>
              <button
                className="header-btn"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                disabled={currentPage >= totalPages - 1}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                下一页
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .header-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default Logs;
