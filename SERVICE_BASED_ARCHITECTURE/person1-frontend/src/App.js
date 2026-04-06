import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import FoodList from './pages/FoodList';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import './App.css';

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [headerNotification, setHeaderNotification] = useState(null);

  useEffect(() => {
    if (!headerNotification) return;
    const t = setTimeout(() => setHeaderNotification(null), 14000);
    return () => clearTimeout(t);
  }, [headerNotification]);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage('foods');
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setHeaderNotification(null);
    setPage('login');
  };

  const addToCart = (food) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === food.id);
      if (exists) return prev.map(i => i.id === food.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="app">
      {user && (
        <>
          <nav className="navbar">
            <div className="nav-brand">🍜 Food Ordering</div>
            <div className="nav-links">
              <button type="button" onClick={() => setPage('foods')} className={page === 'foods' ? 'active' : ''}>Món ăn</button>
              <button type="button" onClick={() => setPage('cart')} className={page === 'cart' ? 'active' : ''}>
                🛒 Giỏ hàng {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </button>
              <button type="button" onClick={() => setPage('orders')} className={page === 'orders' ? 'active' : ''}>Đơn hàng</button>
              <span className="user-info">👤 {user.name}</span>
              <button type="button" onClick={handleLogout} className="btn-logout">Đăng xuất</button>
            </div>
          </nav>
          {headerNotification && (
            <div className="header-notify" role="status" aria-live="polite">
              <div className="header-notify-icon" aria-hidden>🔔</div>
              <div className="header-notify-text">
                <div className="header-notify-line1">
                  <span className="header-notify-tag">[{headerNotification.notifType}]</span>
                  <span className="header-notify-title">{headerNotification.notifTitle}</span>
                </div>
                <div className="header-notify-line2">
                  <span>📧 {headerNotification.userEmail}</span>
                  <span className="header-notify-sep">·</span>
                  <span>💬 {headerNotification.notifBody}</span>
                </div>
              </div>
              <button
                type="button"
                className="header-notify-close"
                aria-label="Đóng thông báo"
                onClick={() => setHeaderNotification(null)}
              >
                ×
              </button>
            </div>
          )}
        </>
      )}

      <div className="content">
        {!user && page === 'login' && <Login onLogin={handleLogin} onSwitch={() => setPage('register')} />}
        {!user && page === 'register' && <Register onSuccess={() => setPage('login')} onSwitch={() => setPage('login')} />}
        {user && page === 'foods' && <FoodList user={user} onAddToCart={addToCart} />}
        {user && page === 'cart' && (
          <Cart user={user} cart={cart} setCart={setCart} onOrderSuccess={setHeaderNotification} />
        )}
        {user && page === 'orders' && <Orders user={user} />}
      </div>
    </div>
  );
}
