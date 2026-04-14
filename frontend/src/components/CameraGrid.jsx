import { useState, useMemo, useEffect } from 'react';
import CameraStream from './CameraStream';

export default function CameraGrid({ devices, isDetecting, onEvent }) {
  const [layoutMode, setLayoutMode] = useState('auto');
  const [customCount, setCustomCount] = useState(4);
  const [selectedDevices, setSelectedDevices] = useState([]);

  // 初始化：设备加载后默认全选
  useEffect(() => {
    if (devices && devices.length > 0 && selectedDevices.length === 0) {
      setSelectedDevices(devices.map(d => d.id));
    }
  }, [devices]);

  // 根据选中的设备列表显示，没有选中则不显示任何监控
  const visibleDevices = useMemo(() => {
    if (!devices || devices.length === 0) return [];
    if (selectedDevices.length === 0) return [];

    const deviceList = devices.filter(d => selectedDevices.includes(d.id));

    switch (layoutMode) {
      case '1':
        return deviceList.slice(0, 1);
      case '2':
        return deviceList.slice(0, 2);
      case '4':
        return deviceList.slice(0, 4);
      case '6':
        return deviceList.slice(0, 6);
      case 'custom':
        return deviceList.slice(0, customCount);
      case 'auto':
      default:
        const count = deviceList.length;
        if (count <= 1) return deviceList.slice(0, 1);
        if (count <= 4) return deviceList.slice(0, count);
        return deviceList.slice(0, Math.min(count, 6));
    }
  }, [devices, layoutMode, customCount, selectedDevices]);

  const gridCols = useMemo(() => {
    const count = visibleDevices.length;
    if (count <= 1) return 1;
    if (count <= 2) return 2;
    if (count <= 4) return 2;
    return 3;
  }, [visibleDevices.length]);

  const toggleDeviceSelection = (deviceId) => {
    setSelectedDevices(prev => {
      if (prev.includes(deviceId)) {
        return prev.filter(id => id !== deviceId);
      }
      return [...prev, deviceId];
    });
  };

  const selectLayout = (mode) => {
    setLayoutMode(mode);
  };

  if (!devices || devices.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </div>
        <p style={styles.emptyTitle}>无设备连接</p>
        <p style={styles.emptyText}>请在设备管理页面添加设备</p>
      </div>
    );
  }

  // 没有任何设备被选中时的提示
  const showNoSelection = selectedDevices.length === 0 && devices.length > 0;

  return (
    <div style={styles.container}>
      {/* Control Bar */}
      <div className="control-bar">
        <div className="control-group">
          <span className="control-label">画面布局:</span>
          <div className="layout-toggle">
            <button
              className={`layout-toggle-btn ${layoutMode === '1' ? 'active' : ''}`}
              onClick={() => selectLayout('1')}
            >
              1画面
            </button>
            <button
              className={`layout-toggle-btn ${layoutMode === '2' ? 'active' : ''}`}
              onClick={() => selectLayout('2')}
            >
              2画面
            </button>
            <button
              className={`layout-toggle-btn ${layoutMode === '4' ? 'active' : ''}`}
              onClick={() => selectLayout('4')}
            >
              4画面
            </button>
            <button
              className={`layout-toggle-btn ${layoutMode === '6' ? 'active' : ''}`}
              onClick={() => selectLayout('6')}
            >
              6画面
            </button>
            <button
              className={`layout-toggle-btn ${layoutMode === 'auto' ? 'active' : ''}`}
              onClick={() => selectLayout('auto')}
            >
              自动
            </button>
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">自定义:</span>
          <input
            type="number"
            min="1"
            max={devices.length}
            value={customCount}
            onChange={(e) => {
              setCustomCount(Math.max(1, Math.min(devices.length, parseInt(e.target.value) || 1)));
              setLayoutMode('custom');
            }}
            className="number-input"
          />
          <button
            className={`layout-toggle-btn ${layoutMode === 'custom' ? 'active' : ''}`}
            onClick={() => selectLayout('custom')}
            style={{ padding: '4px 12px' }}
          >
            应用
          </button>
        </div>

        <div className="control-group" style={{ flex: 1, minWidth: '250px' }}>
          <span className="control-label">设备:</span>
          <div className="device-chips">
            {devices.map(device => (
              <label
                key={device.id}
                className={`device-chip ${selectedDevices.includes(device.id) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(device.id)}
                  onChange={() => toggleDeviceSelection(device.id)}
                />
                <span className="device-chip-text">{device.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="info-text">
          {selectedDevices.length > 0
            ? `显示 ${visibleDevices.length} / ${selectedDevices.length} 路已选摄像头`
            : `共 ${devices.length} 路摄像头`
          }
        </div>
      </div>

      {/* Camera Grid */}
      {showNoSelection ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <p style={styles.emptyTitle}>未选择摄像头</p>
          <p style={styles.emptyText}>请从上方列表选择至少一个摄像头</p>
        </div>
      ) : (
        <div
          className={`camera-grid ${visibleDevices.length === 1 ? 'single' : ''}`}
        >
          {visibleDevices.map((device, index) => (
            <CameraStream
              key={device.id}
              device={device}
              isDetecting={isDetecting}
              onEvent={onEvent}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-md)',
  },
  grid: {
    display: 'grid',
    gap: 'var(--spacing-md)',
    width: '100%',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-xl) var(--spacing-lg)',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--border-default)',
    textAlign: 'center',
  },
  emptyIcon: {
    color: 'var(--text-muted)',
    marginBottom: 'var(--spacing-md)',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 'var(--spacing-xs)',
  },
  emptyText: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
};
