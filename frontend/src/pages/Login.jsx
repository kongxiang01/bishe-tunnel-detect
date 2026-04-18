import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // 这里的 /api 由 vite proxy 转发给 8080
      const res = await axios.post('/api/auth/login', { username, password });
      if (res.data.code === 200 && res.data.data?.token) {
        localStorage.setItem('token', res.data.data.token);
        localStorage.setItem('username', res.data.data.username);
        localStorage.setItem('role', res.data.data.role);
        // 登录成功，跳转到监控大屏
        navigate('/monitor');
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录异常，请检查后端是否启动');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>隧道交通综合监控系统</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>用户名</label>
            <input 
              style={styles.input}
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
          <div style={styles.inputGroup}>
            <label>密码</label>
            <input 
              style={styles.input}
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button}>登 录</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '360px' },
  title: { textAlign: 'center', marginBottom: '30px', color: '#333' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #d9d9d9' },
  button: { padding: '12px', fontSize: '16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { color: 'red', fontSize: '14px', textAlign: 'center' }
};
