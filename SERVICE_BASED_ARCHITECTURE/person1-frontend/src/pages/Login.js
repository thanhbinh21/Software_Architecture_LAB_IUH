import React, { useState } from 'react';
import { userApi } from '../services/api';

export default function Login({ onLogin, onSwitch }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await userApi.login(form);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🍜 Đăng nhập</h2>
        <p className="auth-subtitle">Hệ thống đặt món nội bộ</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="admin@company.com" required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-switch">Chưa có tài khoản? <button onClick={onSwitch}>Đăng ký</button></p>
        <div className="demo-account">Demo: admin@company.com / admin123</div>
      </div>
    </div>
  );
}
