import { useState, useEffect } from 'react';
import axios from 'axios';

const mockDevices = [
  {
    id: 1,
    deviceCode: 'DEV001',
    name: '隧道入口摄像头',
    location: '东进口 50m 处',
    streamUrl: 'rtsp://192.168.1.101:554/stream1',
    status: 'ONLINE',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 2,
    deviceCode: 'DEV002',
    name: '隧道出口摄像头',
    location: '西出口 30m 处',
    streamUrl: 'rtsp://192.168.1.102:554/stream1',
    status: 'ONLINE',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 3,
    deviceCode: 'DEV003',
    name: '隧道中部摄像头',
    location: '中段 200m 处',
    streamUrl: 'rtsp://192.168.1.103:554/stream1',
    status: 'OFFLINE',
    resolution: '1280x720',
    fps: 25
  }
];

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  }
});

function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentDevice, setCurrentDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    streamUrl: '',
    resolution: '',
    fps: ''
  });

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/devices/list', getAuthHeaders());
      setDevices(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setError('获取设备列表失败，使用模拟数据');
      setDevices(mockDevices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      streamUrl: '',
      resolution: '',
      fps: ''
    });
    setCurrentDevice(null);
  };

  const handleAddDevice = () => {
    setModalMode('add');
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (device) => {
    setModalMode('edit');
    setCurrentDevice(device);
    setFormData({
      name: device.name,
      location: device.location,
      streamUrl: device.streamUrl,
      resolution: device.resolution || '',
      fps: device.fps || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (device) => {
    if (!window.confirm(`确定要删除设备 "${device.name}" 吗？`)) {
      return;
    }

    try {
      await axios.delete(`/api/devices/delete/${device.id}`, getAuthHeaders());
      setDevices(devices.filter(d => d.id !== device.id));
    } catch (err) {
      console.error('Failed to delete device:', err);
      alert('删除设备失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const deviceData = {
      ...formData,
      fps: formData.fps ? parseInt(formData.fps, 10) : null
    };

    try {
      if (modalMode === 'add') {
        const response = await axios.post('/api/devices/add', deviceData, getAuthHeaders());
        if (response.data.code === 200) {
          setDevices([...devices, response.data.data]);
        }
      } else {
        const response = await axios.put(`/api/devices/update/${currentDevice.id}`, deviceData, getAuthHeaders());
        if (response.data.code === 200) {
          setDevices(devices.map(d => d.id === currentDevice.id ? response.data.data : d));
        }
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save device:', err);
      alert(modalMode === 'add' ? '添加设备失败' : '更新设备失败');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
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

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'var(--bg-card-hover)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>设备列表</h2>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            加载中...
          </div>
        ) : (
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
              {devices.map((device) => (
                <tr key={device.id} style={{ borderBottom: '1px solid var(--border-default)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 500 }}>{device.name}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{device.location}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{device.streamUrl}</td>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${device.status?.toLowerCase()}`}>
                      {device.status === 'ONLINE' ? '在线' : '离线'}
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
        )}
      </div>

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
        }} onClick={closeModal}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '24px',
            width: '480px',
            maxWidth: '90%'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>
              {modalMode === 'add' ? '添加设备' : '编辑设备'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  设备名称
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  位置
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  流地址
                </label>
                <input
                  type="text"
                  name="streamUrl"
                  value={formData.streamUrl}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  分辨率
                </label>
                <input
                  type="text"
                  name="resolution"
                  value={formData.resolution}
                  onChange={handleInputChange}
                  placeholder="如: 1920x1080"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  帧率 (FPS)
                </label>
                <input
                  type="number"
                  name="fps"
                  value={formData.fps}
                  onChange={handleInputChange}
                  placeholder="如: 30"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="header-btn"
                  style={{ padding: '10px 20px' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ padding: '10px 20px' }}
                >
                  {modalMode === 'add' ? '添加' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Devices;
