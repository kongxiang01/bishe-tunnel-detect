import { useState } from 'react';

const mockDevices = [
  {
    id: 1,
    name: '隧道入口摄像头',
    location: '东进口 50m 处',
    streamUrl: 'rtsp://192.168.1.101:554/stream1',
    status: 'online'
  },
  {
    id: 2,
    name: '隧道出口摄像头',
    location: '西出口 30m 处',
    streamUrl: 'rtsp://192.168.1.102:554/stream1',
    status: 'online'
  },
  {
    id: 3,
    name: '隧道中部摄像头',
    location: '中段 200m 处',
    streamUrl: 'rtsp://192.168.1.103:554/stream1',
    status: 'offline'
  }
];

function Devices() {
  const [showModal, setShowModal] = useState(false);

  const handleAddDevice = () => {
    alert('功能开发中');
  };

  const handleEdit = (device) => {
    alert(`编辑设备: ${device.name}`);
  };

  const handleDelete = (device) => {
    alert(`删除设备: ${device.name}`);
  };

  return (
    <div className="page">
      <div className="top">
        <h1>设备管理</h1>
        <div className="header-controls">
          <button className="primary-btn" onClick={handleAddDevice}>
            + 添加设备
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>设备列表</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>设备名称</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>位置</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>流地址</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>状态</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {mockDevices.map((device) => (
              <tr key={device.id} style={{ borderBottom: '1px solid var(--border-default)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 500 }}>{device.name}</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{device.location}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{device.streamUrl}</td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge ${device.status}`}>
                    {device.status === 'online' ? '在线' : '离线'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="header-btn"
                      onClick={() => handleEdit(device)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      编辑
                    </button>
                    <button
                      className="header-btn danger"
                      onClick={() => handleDelete(device)}
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

export default Devices;
