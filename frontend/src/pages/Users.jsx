import { useState } from 'react';

const mockUsers = [
  {
    id: 1,
    username: 'admin',
    role: '管理员',
    status: 'active',
    lastLogin: '2026-04-14 08:30:22'
  },
  {
    id: 2,
    username: 'operator01',
    role: '操作员',
    status: 'active',
    lastLogin: '2026-04-14 09:15:45'
  },
  {
    id: 3,
    username: 'operator02',
    role: '操作员',
    status: 'inactive',
    lastLogin: '2026-04-10 17:22:00'
  }
];

function Users() {
  const [showModal, setShowModal] = useState(false);

  const handleAddUser = () => {
    alert('功能开发中');
  };

  const handleEdit = (user) => {
    alert(`编辑用户: ${user.username}`);
  };

  const handleDelete = (user) => {
    alert(`删除用户: ${user.username}`);
  };

  const getRoleBadgeClass = (role) => {
    return role === '管理员' ? 'online' : 'neutral';
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'online' : 'offline';
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
            {mockUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-default)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.username}</td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                    {user.status === 'active' ? '正常' : '停用'}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{user.lastLogin}</td>
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
    </div>
  );
}

export default Users;
