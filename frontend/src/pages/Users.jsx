import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api/v1/users';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'Viewer' });
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_BASE, { headers: getAuthHeaders() });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    setModalMode('add');
    setSelectedUser(null);
    setFormData({ username: '', password: '', role: 'Viewer' });
    setFormError('');
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({ username: user.username, password: '', role: user.role });
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
        setUsers([...users, { ...response.data, status: 'active', lastLogin: '-' }]);
      } else {
        const payload = { username: formData.username, role: formData.role };
        if (formData.password) {
          payload.password = formData.password;
        }
        await axios.put(`${API_BASE}/${selectedUser.id}`, payload, { headers: getAuthHeaders() });
        setUsers(users.map(u => u.id === selectedUser.id ? {
          ...u,
          username: formData.username,
          role: formData.role
        } : u));
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save user:', err);
      setFormError(err.response?.data?.message || '保存用户失败');
    }
  };

  const getRoleBadgeClass = (role) => {
    return role === 'Admin' ? 'online' : 'neutral';
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'online' : 'offline';
  };

  const getRoleName = (role) => {
    return role === 'Admin' ? '管理员' : '操作员';
  };

  const getStatusName = (status) => {
    return status === 'active' ? '正常' : '停用';
  };

  return (
    <div className="page">
      <div className="top">
        <h1>用户管理</h1>
        <div className="header-controls">
          <button className="primary-btn" onClick={handleAddUser}>
            + 添加用户
          </button>
        </div>
      </div>

      {loading && <div className="card"><p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</p></div>}

      {error && <div className="card"><p style={{ padding: '20px', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</p></div>}

      {!loading && !error && (
        <div className="card">
          <div className="card-header">
            <h2>用户列表</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>用户名</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>角色</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>状态</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>最后登录</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-default)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.username}</td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                      {getStatusName(user.status)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{user.lastLogin || '-'}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="header-btn"
                        onClick={() => handleEdit(user)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        编辑
                      </button>
                      <button
                        className="header-btn danger"
                        onClick={() => handleDelete(user)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <option value="Admin">管理员</option>
                  <option value="Viewer">操作员</option>
                </select>
              </div>
              {formError && <p style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '0.9rem' }}>{formError}</p>}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="header-btn">取消</button>
                <button type="submit" className="primary-btn">保存</button>
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
              <button onClick={() => setDeleteConfirm(null)} className="header-btn">取消</button>
              <button onClick={confirmDelete} className="header-btn danger">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
