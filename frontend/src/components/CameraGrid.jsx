import { useState, useMemo, useEffect } from 'react';
import CameraStream from './CameraStream';

export default function CameraGrid({ devices, isDetecting, onEvent }) {
  const [layoutMode, setLayoutMode] = useState('2');
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
    return devices.filter(d => selectedDevices.includes(d.id));
  }, [devices, selectedDevices]);

  const gridCols = useMemo(() => {
    switch (layoutMode) {
      case '1': return 1;
      case '2': return 2;
      case '3': return 3;
      default: return 2;
    }
  }, [layoutMode]);

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
              1列
            </button>
            <button
              className={`layout-toggle-btn ${layoutMode === '2' ? 'active' : ''}`}
              onClick={() => selectLayout('2')}
            >
              2列
            </button>
            <button
              className={`layout-toggle-btn ${layoutMode === '3' ? 'active' : ''}`}
              onClick={() => selectLayout('3')}
            >
              3列
            </button>
          </div>
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
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
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
