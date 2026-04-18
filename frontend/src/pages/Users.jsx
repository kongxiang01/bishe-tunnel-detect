import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Table, Button, Tag, Space, Popconfirm, ConfigProvider, theme } from 'antd';

const API_BASE = '/api/v1/users';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'VIEWER', status: 'active' });
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_BASE, { headers: getAuthHeaders() });
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 检查用户角色，非管理员不能访问
    const role = localStorage.getItem('role');
    if (role !== 'ADMIN') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setModalMode('add');
    setSelectedUser(null);
    setFormData({ username: '', password: '', role: 'VIEWER', status: 'active' });
    setFormError('');
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({ username: user.username, password: '', role: user.role, status: user.status || 'active' });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = (user) => {
    setDeleteConfirm(user);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await axios.delete(`${API_BASE}/${deleteConfirm.id}`, { headers: getAuthHeaders() });
      setUsers(users.filter(u => u.id !== deleteConfirm.id));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('删除用户失败');
    }
    setDeleteConfirm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.username.trim()) {
      setFormError('用户名不能为空');
      return;
    }
    if (modalMode === 'add' && !formData.password) {
      setFormError('密码不能为空');
      return;
    }

    try {
      if (modalMode === 'add') {
        const response = await axios.post(API_BASE, formData, { headers: getAuthHeaders() });
        setUsers([...users, response.data.data]);
      } else {
        const payload = { username: formData.username, role: formData.role, status: formData.status };
        if (formData.password) {
          payload.password = formData.password;
        }
        await axios.put(`${API_BASE}/${selectedUser.id}`, payload, { headers: getAuthHeaders() });
        setUsers(users.map(u => u.id === selectedUser.id ? {
          ...u,
          username: formData.username,
          role: formData.role,
          status: formData.status
        } : u));
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save user:', err);
      setFormError(err.response?.data?.message || '保存用户失败');
    }
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return '-';
    try {
      const date = new Date(lastLogin);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return lastLogin;
    }
  };

  const getRoleTag = (role) => {
    const color = role === 'ADMIN' ? 'blue' : 'default';
    const text = role === 'ADMIN' ? '管理员' : '操作员';
    return <Tag color={color}>{text}</Tag>;
  };

  const getStatusTag = (status) => {
    const color = status === 'active' ? 'success' : 'error';
    const text = status === 'active' ? '正常' : '停用';
    return <Tag color={color}>{text}</Tag>;
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (text) => getRoleTag(text),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => getStatusTag(text),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 180,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {formatLastLogin(text)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => handleEdit(record)}
            className="user-action-btn"
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除用户 "${record.username}" 吗？`}
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger className="user-action-btn">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
          <h1>用户管理</h1>
          <div className="header-controls">
            <Button type="primary" onClick={handleAddUser}>
              + 添加用户
            </Button>
          </div>
        </div>

        {loading && (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            加载中...
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: '20px', color: 'var(--accent-danger)' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="card">
            <div className="card-header">
              <h2>用户列表</h2>
            </div>

            <Table
              columns={columns}
              dataSource={users}
              rowKey="id"
              loading={loading}
              pagination={false}
              locale={{
                emptyText: '暂无用户',
              }}
              className="users-table"
            />
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setShowModal(false)}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '24px',
              width: '400px',
              maxWidth: '90%'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>{modalMode === 'add' ? '添加用户' : '编辑用户'}</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>用户名</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>密码{modalMode === 'edit' && '(留空则不修改)'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>角色</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="ADMIN">管理员</option>
                    <option value="VIEWER">操作员</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>状态</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="active">正常</option>
                    <option value="disabled">停用</option>
                  </select>
                </div>
                {formError && <p style={{ color: 'var(--accent-danger)', marginBottom: '16px', fontSize: '0.9rem' }}>{formError}</p>}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setShowModal(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">保存</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setDeleteConfirm(null)}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '24px',
              width: '350px',
              maxWidth: '90%'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>确认删除</h3>
              <p style={{ color: 'var(--text-secondary)' }}>确定要删除用户 "{deleteConfirm.username}" 吗？此操作无法撤销。</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button onClick={() => setDeleteConfirm(null)}>取消</Button>
                <Button danger onClick={confirmDelete}>删除</Button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .users-table .ant-table {
            background: transparent !important;
          }

          .users-table .ant-table-thead > tr > th {
            background: var(--bg-secondary) !important;
            border-bottom: 1px solid var(--border-default) !important;
            color: var(--text-muted) !important;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .users-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--border-default) !important;
            color: var(--text-primary);
            padding: 14px 16px;
          }

          .users-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-card-hover) !important;
          }

          .users-table .ant-table-tbody > tr:last-child > td {
            border-bottom: none !important;
          }

          .user-action-btn {
            background: var(--bg-surface) !important;
            border-color: var(--border-default) !important;
            color: var(--text-secondary) !important;
          }

          .user-action-btn:hover:not(:disabled) {
            background: var(--bg-card-hover) !important;
            border-color: var(--border-hover) !important;
            color: var(--text-primary) !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}

export default Users;
