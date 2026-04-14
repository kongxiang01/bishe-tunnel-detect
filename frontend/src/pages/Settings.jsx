import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Settings() {
  return (
    <div className="page">
      <header className="top">
        <h1>系统设置</h1>
      </header>
      <div className="card">
        <div className="card-header">
          <h2>系统配置</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>暂无配置数据</p>
      </div>
    </div>
  );
}
