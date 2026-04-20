import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import '../../styles.css';

const API_BASE = '/api';

const navItems = [
  { path: '/monitor', label: '监控大屏', icon: 'monitor' },
  { path: '/events', label: '事件中心', icon: 'bell' },
  { path: '/statistics', label: '统计分析', icon: 'chart' },
  { path: '/devices', label: '设备管理', icon: 'device' },
  { path: '/users', label: '用户管理', icon: 'user' },
  { path: '/logs', label: '日志查看', icon: 'logs' },
];

const iconMap = {
  monitor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  device: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  logs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
};

function NavItem({ item, isActive }) {
  return (
    <div className={`nav-item ${isActive ? 'active' : ''}`}>
      {iconMap[item.icon]}
      <span>{item.label}</span>
    </div>
  );
}

export default function MainLayout() {
  const [health, setHealth] = useState('checking');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Admin';
  const userRole = localStorage.getItem('role') || '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }

    axios.get(API_BASE + '/health')
      .then((r) => setHealth(r.data?.data?.status || r.data?.status || 'unknown'))
      .catch(() => setHealth('offline'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
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

  const getPageTitle = () => {
    const item = navItems.find(item => item.path === location.pathname);
    return item ? item.label : '隧道监控系统';
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          {sidebarOpen && <span className="logo-text">隧道监控系统</span>}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            // 非管理员用户隐藏用户管理菜单
            if ((item.path === '/users' || item.path === '/devices') && userRole !== 'ADMIN') {
              return null;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <NavItem item={item} isActive={location.pathname === item.path} />
              </NavLink>
            );
          })}
        </nav>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen ? (
              <polyline points="15 18 9 12 15 6"></polyline>
            ) : (
              <polyline points="9 18 15 12 9 6"></polyline>
            )}
          </svg>
        </button>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>

          <div className="header-right">
            <span className={getHealthBadgeClass()}>{getHealthLabel()}</span>

            <div className="user-menu">
              <button
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{username}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        .main-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* Sidebar Styles */
        .sidebar {
          width: 240px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-default);
          display: flex;
          flex-direction: column;
          transition: width var(--transition-normal);
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
        }

        .sidebar.collapsed {
          width: 72px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-default);
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--accent-primary-dim);
          border-radius: var(--radius-md);
          color: var(--accent-primary);
          flex-shrink: 0;
        }

        .logo-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--spacing-md);
          overflow-y: auto;
        }

        .nav-link {
          text-decoration: none;
          margin-bottom: var(--spacing-xs);
          display: block;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .nav-item:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--accent-primary-dim);
          color: var(--accent-primary);
          border-left: 3px solid var(--accent-primary);
        }

        .nav-item span {
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar.collapsed .nav-item span {
          display: none;
        }

        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: var(--spacing-md) 0;
        }

        .sidebar.collapsed .nav-item svg {
          width: 20px;
          height: 20px;
        }

        .sidebar.collapsed .sidebar-header {
          justify-content: center;
        }

        .sidebar.collapsed .logo-text {
          display: none;
        }

        .sidebar-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: var(--spacing-md);
          background: transparent;
          border: none;
          border-top: 1px solid var(--border-default);
          color: var(--text-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .sidebar-toggle:hover {
          color: var(--text-primary);
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 240px;
          transition: margin-left var(--transition-normal);
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .sidebar.collapsed ~ .main-content {
          margin-left: 72px;
        }

        /* Header */
        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-default);
          height: 60px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-left {
          display: flex;
          align-items: center;
        }

        .page-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        /* User Menu */
        .user-menu {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .user-menu-trigger:hover {
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + var(--spacing-sm));
          right: 0;
          min-width: 160px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
          overflow: hidden;
          z-index: 100;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-md);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .dropdown-item:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .dropdown-item.danger {
          color: var(--accent-danger);
        }

        .dropdown-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Page Content */
        .page-content {
          flex: 1;
          padding: var(--spacing-lg);
          background: var(--bg-primary);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            width: 72px;
          }

          .sidebar.open {
            width: 240px;
          }

          .main-content {
            margin-left: 72px;
          }

          .sidebar.open ~ .main-content {
            margin-left: 240px;
          }

          .logo-text,
          .nav-item span {
            display: none;
          }

          .sidebar.open .logo-text,
          .sidebar.open .nav-item span {
            display: block;
          }

          .page-title {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
