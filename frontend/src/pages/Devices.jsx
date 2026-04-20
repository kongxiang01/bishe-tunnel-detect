import { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Space, Popconfirm, ConfigProvider, theme } from 'antd';

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
      setError('获取设备列表失败');
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
          // 后端返回的 data 为 null，用本地数据更新
          setDevices(devices.map(d => d.id === currentDevice.id ? { ...d, ...formData } : d));
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

  const columns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '设备ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 260,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {text}
        </span>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (text) => <span style={{ color: 'var(--text-secondary)' }}>{text}</span>,
    },
    {
      title: '流地址',
      dataIndex: 'streamUrl',
      key: 'streamUrl',
      ellipsis: true,
      render: (text) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            maxWidth: 280,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={text}
        >
          {text}
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
            className="device-action-btn"
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除设备 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger className="device-action-btn">
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
        },
      }}
    >
      <div className="page">
        <div className="top">
          <h1>设备管理</h1>
          <div className="header-controls">
            <Button type="primary" onClick={handleAddDevice}>
              + 添加设备
            </Button>
          </div>
        </div>

        {error && (
          <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', color: 'var(--accent-danger)' }}>
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>设备列表</h2>
          </div>

          <Table
            columns={columns}
            dataSource={devices}
            rowKey="id"
            loading={loading}
            pagination={false}
            locale={{
              emptyText: '暂无设备',
            }}
            className="devices-table"
          />
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
                {modalMode === 'edit' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    设备ID
                  </label>
                  <input
                    type="text"
                    value={currentDevice?.deviceId || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      background: 'var(--bg-card-hover)',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                )}
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
                  <Button onClick={closeModal}>
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit">
                    {modalMode === 'add' ? '添加' : '保存'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          .devices-table .ant-table {
            background: transparent !important;
          }

          .devices-table .ant-table-thead > tr > th {
            background: var(--bg-secondary) !important;
            border-bottom: 1px solid var(--border-default) !important;
            color: var(--text-muted) !important;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .devices-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--border-default) !important;
            color: var(--text-primary);
            padding: 14px 16px;
          }

          .devices-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-card-hover) !important;
          }

          .devices-table .ant-table-tbody > tr:last-child > td {
            border-bottom: none !important;
          }

          .device-action-btn {
            background: var(--bg-surface) !important;
            border-color: var(--border-default) !important;
            color: var(--text-secondary) !important;
          }

          .device-action-btn:hover:not(:disabled) {
            background: var(--bg-card-hover) !important;
            border-color: var(--border-hover) !important;
            color: var(--text-primary) !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}

export default Devices;
