import React, { useState } from 'react';
import { userApi } from '../services/api';

export default function Register({ onSuccess, onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await userApi.register(form);
      alert('Đăng ký thành công! Hãy đăng nhập.');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>📝 Đăng ký</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Họ tên</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nguyễn Văn A" required /></div>
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="user@company.com" required /></div>
          <div className="form-group"><label>Mật khẩu</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Tối thiểu 6 ký tự" required /></div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</button>
        </form>
        <p className="auth-switch">Đã có tài khoản? <button onClick={onSwitch}>Đăng nhập</button></p>
      </div>
    </div>
  );
}
