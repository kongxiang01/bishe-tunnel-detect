import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Table, Tag, Button, ConfigProvider, theme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import '../styles.css';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Client-side level filter
  const [levelFilter, setLevelFilter] = useState('全部');

  const fetchLogs = useCallback(async (page) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/v1/logs', {
        params: { page: page - 1, size: PAGE_SIZE },
        headers: authHeader(),
      });
      const data = res.data.data || {};
      setLogs(data.content || []);
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

  const handleRefresh = () => {
    fetchLogs(currentPage);
  };

  const getLevelTag = (level) => {
    let color = 'default';
    let displayLevel = level || 'INFO';

    if (displayLevel === 'INFO') color = 'cyan';
    else if (displayLevel === 'WARN') color = 'orange';
    else if (displayLevel === 'ERROR') color = 'red';

    return <Tag color={color}>{displayLevel}</Tag>;
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (text) => {
        if (!text) return <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>—</span>;
        const formatted = text.replace('T', ' ').split('.')[0];
        return <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formatted}</span>;
      },
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (_, record) => {
        const actionUpper = (record.action || '').toUpperCase();
        const displayLevel = record.level || (
          actionUpper.includes('ERROR') ? 'ERROR' :
          actionUpper.includes('WARN')  ? 'WARN'  : 'INFO'
        );
        return getLevelTag(displayLevel);
      },
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text) => <span style={{ fontWeight: 500 }}>{text || '—'}</span>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => (
        <span>
          <span style={{ color: 'var(--text-primary)' }}>{text || '—'}</span>
          {record.targetResource && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 6 }}>
              [{record.targetResource}]
            </span>
          )}
        </span>
      ),
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (text, record) => {
        const actionUpper = (record.action || '').toUpperCase();
        let color = 'var(--text-secondary)';
        if (actionUpper.includes('ERROR')) color = 'var(--accent-danger)';
        else if (actionUpper.includes('WARN')) color = 'var(--accent-warning)';

        return (
          <span style={{ color }}>
            {text || '—'}
          </span>
        );
      },
    },
  ];

  // Apply client-side filter
  const filteredData = logs.filter((log) => {
    if (levelFilter === '全部') return true;
    const level = log.level || (log.action || '').toUpperCase();
    if (level.includes('ERROR')) return levelFilter === 'ERROR';
    if (level.includes('WARN')) return levelFilter === 'WARN';
    return levelFilter === 'INFO';
  });

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00d4ff',
          colorBgContainer: '#1a2235',
          colorBgElevated: '#1a2235',
          colorBorder: '#2a3441',
          colorText: '#f1f5f9',
          colorTextSecondary: '#94a3b8',
          colorTextTertiary: '#64748b',
          borderRadius: 10,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        },
        components: {
          Table: {
            headerBg: '#111827',
            headerColor: '#94a3b8',
            rowHoverBg: '#1f2940',
            borderColor: '#2a3441',
          },
          Button: {
            defaultBg: '#252d3d',
            defaultBorderColor: '#2a3441',
            defaultColor: '#94a3b8',
          },
          Tag: {
            defaultBg: '#252d3d',
            defaultColor: '#94a3b8',
          },
        },
      }}
    >
      <div className="page">
        <div className="top">
          <h1>日志查看</h1>
          <div className="header-controls">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              className="logs-refresh-btn"
            >
              刷新
            </Button>
          </div>
        </div>

        {/* Level filter */}
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
              共 {totalElements} 条记录
            </span>
          </div>

          {error && (
            <div className="logs-error">
              {error}
            </div>
          )}

          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total: totalElements,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false,
              showQuickJumper: false,
              showTotal: (total) => `共 ${total} 条`,
              size: 'default',
            }}
            locale={{
              emptyText: '暂无日志记录',
            }}
            className="logs-table"
          />
        </div>

        <style>{`
          .logs-refresh-btn {
            background: var(--bg-surface) !important;
            border-color: var(--border-default) !important;
            color: var(--text-secondary) !important;
          }

          .logs-refresh-btn:hover:not(:disabled) {
            background: var(--bg-card-hover) !important;
            border-color: var(--border-hover) !important;
            color: var(--text-primary) !important;
          }

          .logs-error {
            padding: 12px 16px;
            margin-bottom: 16px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: var(--radius-md);
            color: var(--accent-danger);
            font-size: 0.875rem;
          }

          .logs-table .ant-table {
            background: transparent !important;
          }

          .logs-table .ant-table-thead > tr > th {
            background: var(--bg-secondary) !important;
            border-bottom: 1px solid var(--border-default) !important;
            color: var(--text-muted) !important;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .logs-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--border-default) !important;
            color: var(--text-primary);
            padding: 14px 16px;
          }

          .logs-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-card-hover) !important;
          }

          .logs-table .ant-table-tbody > tr:last-child > td {
            border-bottom: none !important;
          }

          .logs-table .ant-pagination {
            margin-top: 16px !important;
          }

          .logs-table .ant-pagination-item {
            background: var(--bg-surface) !important;
            border-color: var(--border-default) !important;
          }

          .logs-table .ant-pagination-item a {
            color: var(--text-secondary) !important;
          }

          .logs-table .ant-pagination-item-active {
            background: var(--accent-primary-dim) !important;
            border-color: var(--accent-primary) !important;
          }

          .logs-table .ant-pagination-item-active a {
            color: var(--accent-primary) !important;
          }

          .logs-table .ant-pagination-prev .ant-pagination-item-link,
          .logs-table .ant-pagination-next .ant-pagination-item-link {
            background: var(--bg-surface) !important;
            border-color: var(--border-default) !important;
            color: var(--text-secondary) !important;
          }

          .logs-table .ant-pagination-disabled .ant-pagination-item-link {
            color: var(--text-muted) !important;
          }

          .logs-table .ant-empty-description {
            color: var(--text-muted) !important;
          }

          .logs-table .ant-spin-dot-item {
            background-color: var(--accent-primary) !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}

export default Logs;
