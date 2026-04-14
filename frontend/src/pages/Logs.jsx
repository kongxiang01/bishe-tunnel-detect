import { useState } from 'react';

const mockLogs = [
  { id: 1, time: '2026-04-14 10:23:15', level: 'INFO', module: '系统', description: '用户 admin 登录系统' },
  { id: 2, time: '2026-04-14 10:25:30', level: 'INFO', module: '监控', description: '摄像头 隧道入口摄像头 连接成功' },
  { id: 3, time: '2026-04-14 10:26:45', level: 'WARN', module: '算法', description: '检测到异常行为：违规停车 - 隧道中部摄像头' },
  { id: 4, time: '2026-04-14 10:28:00', level: 'INFO', module: '监控', description: '摄像头 隧道出口摄像头 连接成功' },
  { id: 5, time: '2026-04-14 10:30:22', level: 'ERROR', module: '算法', description: '目标追踪模块初始化失败：模型文件损坏' },
  { id: 6, time: '2026-04-14 10:32:10', level: 'WARN', module: '系统', description: '存储空间不足：剩余 15%' },
  { id: 7, time: '2026-04-14 10:35:00', level: 'INFO', module: '告警', description: '异常事件告警已发送至管理员' },
  { id: 8, time: '2026-04-14 10:40:15', level: 'ERROR', module: '监控', description: '摄像头 隧道中部摄像头 连接超时' },
  { id: 9, time: '2026-04-14 10:42:30', level: 'WARN', module: '监控', description: '视频流帧率过低：15fps (预期 25fps)' },
  { id: 10, time: '2026-04-14 10:45:00', level: 'INFO', module: '系统', description: '系统健康检查完成：所有服务正常运行' }
];

function Logs() {
  const [levelFilter, setLevelFilter] = useState('全部');
  const [timeRange, setTimeRange] = useState('今天');

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'INFO': return 'online';
      case 'WARN': return 'warning';
      case 'ERROR': return 'offline';
      default: return 'neutral';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'INFO': return 'var(--accent-primary)';
      case 'WARN': return 'var(--accent-warning)';
      case 'ERROR': return 'var(--accent-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const filteredLogs = mockLogs.filter(log => {
    if (levelFilter !== '全部' && log.level !== levelFilter) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="top">
        <h1>日志查看</h1>
      </div>

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
        <div className="control-group">
          <span className="control-label">时间范围</span>
          <div className="layout-toggle">
            {['今天', '近7天', '近30天'].map((range) => (
              <button
                key={range}
                className={`layout-toggle-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>日志列表</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            共 {filteredLogs.length} 条记录
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>时间</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>级别</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>模块</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>描述</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-default)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.time}</td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge ${getLevelBadgeClass(log.level)}`}>
                    {log.level}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-primary)' }}>{log.module}</td>
                <td style={{ padding: '16px', color: getLevelColor(log.level) }}>{log.description}</td>
                <td style={{ padding: '16px' }}>
                  <button
                    className="header-btn"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Logs;
