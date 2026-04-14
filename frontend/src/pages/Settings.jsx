import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Settings() {
  const [settings, setSettings] = useState([]); // [{ id, settingKey, settingValue, description }]
  const [editValues, setEditValues] = useState({}); // { settingKey: editedValue }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await axios.get('/api/v1/settings', {
        headers: authHeader(),
      });
      const data = res.data;
      setSettings(data);
      // Initialise edit buffer with current values
      const initial = {};
      data.forEach((s) => {
        initial[s.settingKey] = s.settingValue ?? '';
      });
      setEditValues(initial);
    } catch (err) {
      setFetchError(err.response?.data?.message || '加载设置失败，请检查后端连接');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleValueChange = (key, value) => {
    setSaveSuccess(false);
    setSaveError('');
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      // Build the payload: only include entries whose value has changed
      const payload = settings.map((s) => ({
        settingKey: s.settingKey,
        settingValue: editValues[s.settingKey] ?? s.settingValue,
      }));
      await axios.put('/api/v1/settings', payload, {
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
      });
      setSaveSuccess(true);
      // Refresh from server to confirm persisted values
      await fetchSettings();
    } catch (err) {
      setSaveError(err.response?.data?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const reset = {};
    settings.forEach((s) => {
      reset[s.settingKey] = s.settingValue ?? '';
    });
    setEditValues(reset);
    setSaveSuccess(false);
    setSaveError('');
  };

  const isDirty = settings.some((s) => editValues[s.settingKey] !== (s.settingValue ?? ''));

  const inputStyle = {
    padding: '8px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    width: '100%',
    transition: 'border-color var(--transition-fast)',
    outline: 'none',
  };

  return (
    <div className="page">
      <header className="top">
        <h1>系统设置</h1>
        <div className="header-controls">
          <button
            className="header-btn"
            onClick={fetchSettings}
            disabled={loading || saving}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            刷新
          </button>
        </div>
      </header>

      <div className="card">
        <div className="card-header">
          <h2>系统配置</h2>
          {!loading && !fetchError && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              共 {settings.length} 项配置
            </span>
          )}
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div style={alertStyle('danger')}>
            {fetchError}
          </div>
        )}

        {/* Save feedback */}
        {saveError && (
          <div style={alertStyle('danger')}>
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div style={alertStyle('success')}>
            设置已保存成功
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-default)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <span>加载配置中...</span>
          </div>
        ) : !fetchError && settings.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>暂无配置数据</p>
        ) : (
          <>
            {/* Settings form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Table header */}
              <div style={rowStyle('header')}>
                <div style={{ ...colStyle, flex: '0 0 220px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>配置键</div>
                <div style={{ ...colStyle, flex: 1, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>说明</div>
                <div style={{ ...colStyle, flex: '0 0 300px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>值</div>
              </div>

              {settings.map((s, idx) => {
                const changed = editValues[s.settingKey] !== (s.settingValue ?? '');
                return (
                  <div
                    key={s.id ?? s.settingKey}
                    style={rowStyle(idx % 2 === 0 ? 'even' : 'odd')}
                  >
                    {/* Key */}
                    <div style={{ ...colStyle, flex: '0 0 220px' }}>
                      <code style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 8px',
                        fontSize: '0.82rem',
                        color: 'var(--accent-primary)',
                        fontFamily: 'monospace',
                      }}>
                        {s.settingKey}
                      </code>
                    </div>

                    {/* Description */}
                    <div style={{ ...colStyle, flex: 1, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {s.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>无描述</span>}
                    </div>

                    {/* Editable value */}
                    <div style={{ ...colStyle, flex: '0 0 300px' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          value={editValues[s.settingKey] ?? ''}
                          onChange={(e) => handleValueChange(s.settingKey, e.target.value)}
                          style={{
                            ...inputStyle,
                            borderColor: changed ? 'var(--accent-primary)' : 'var(--border-default)',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
                          onBlur={(e) => (e.target.style.borderColor = changed ? 'var(--accent-primary)' : 'var(--border-default)')}
                        />
                        {changed && (
                          <span style={{
                            position: 'absolute',
                            right: '10px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            flexShrink: 0,
                          }} title="已修改" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
              <button
                className="header-btn"
                onClick={handleReset}
                disabled={!isDirty || saving}
              >
                重置
              </button>
              <button
                className="primary-btn"
                onClick={handleSave}
                disabled={!isDirty || saving}
                style={{ opacity: (!isDirty || saving) ? 0.6 : 1, cursor: (!isDirty || saving) ? 'not-allowed' : 'pointer' }}
              >
                {saving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .header-btn:disabled,
        .primary-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// Helper style factories to keep JSX readable
function alertStyle(type) {
  const isSuccess = type === 'success';
  return {
    padding: '10px 16px',
    marginBottom: '16px',
    background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
    border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
    borderRadius: 'var(--radius-md)',
    color: isSuccess ? 'var(--accent-success)' : 'var(--accent-danger)',
    fontSize: '0.875rem',
  };
}

function rowStyle(variant) {
  const base = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
  };
  if (variant === 'header') {
    return { ...base, borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' };
  }
  if (variant === 'even') {
    return { ...base, background: 'transparent', borderBottom: '1px solid var(--border-default)' };
  }
  return { ...base, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-default)' };
}

const colStyle = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
};
