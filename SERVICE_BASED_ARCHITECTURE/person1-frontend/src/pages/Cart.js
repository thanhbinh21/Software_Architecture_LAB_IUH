import React, { useState } from 'react';
import { orderApi, paymentApi } from '../services/api';

export default function Cart({ user, cart, setCart, onOrderSuccess }) {
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleOrder = async () => {
    if (cart.length === 0) return alert('Giỏ hàng trống!');
    setLoading(true);
    try {
      // 1. Tạo đơn hàng
      const orderRes = await orderApi.create({
        user_id: user.id,
        items: cart.map(i => ({ food_id: i.id, quantity: i.quantity })),
        note,
      });
      const order = orderRes.data.order;

      // 2. Thanh toán
      const payRes = await paymentApi.pay({ order_id: order.id, method, amount: total });
      const payData = payRes.data || {};
      const transactionId =
        payData.transaction_id ||
        payData.transactionId ||
        payData.txn_id ||
        (method === 'BANKING'
          ? `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
          : `COD-${order.id}-${Date.now()}`);

      const notifType = method === 'BANKING' ? 'PAYMENT_SUCCESS' : 'ORDER_CONFIRMED';
      const notifTitle =
        method === 'BANKING'
          ? `Thanh toán thành công - Đơn #${order.id}`
          : `Đặt hàng thành công - Đơn #${order.id}`;
      const notifBody =
        method === 'BANKING'
          ? `Đơn hàng #${order.id} đã được thanh toán thành công qua Chuyển khoản. Tổng tiền: ${total.toLocaleString('vi-VN')}đ. Mã giao dịch: ${transactionId}`
          : `Đơn hàng #${order.id} đã được xác nhận. Thanh toán khi nhận hàng (COD). Tổng tiền: ${total.toLocaleString('vi-VN')}đ. Mã tham chiếu: ${transactionId}`;

      onOrderSuccess?.({
        notifType,
        notifTitle,
        notifBody,
        userEmail: user.email,
      });
      setCart([]);
    } catch (err) {
      const d = err.response?.data;
      const msg =
        (d?.error && d?.detail ? `${d.error} — ${d.detail}` : d?.error) ||
        d?.detail ||
        err.message;
      alert('Lỗi: ' + msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <h2>🛒 Giỏ hàng</h2>
      {cart.length === 0 ? (
        <div className="empty-cart">Giỏ hàng trống. Hãy chọn món!</div>
      ) : (
        <>
          <div className="cart-list">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <span className="cart-name">{item.name}</span>
                <div className="qty-control">
                  <button onClick={() => updateQty(item.id, -1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <span className="cart-subtotal">{(item.price * item.quantity).toLocaleString()}đ</span>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <div className="total-row"><strong>Tổng cộng:</strong> <strong>{total.toLocaleString()}đ</strong></div>
            <div className="form-group">
              <label>Ghi chú:</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ít cay, không hành..." />
            </div>
            <div className="form-group">
              <label>Phương thức thanh toán:</label>
              <div className="payment-methods">
                {['COD', 'BANKING'].map(m => (
                  <label key={m} className={`method-btn ${method === m ? 'selected' : ''}`}>
                    <input type="radio" value={m} checked={method === m} onChange={() => setMethod(m)} />
                    {m === 'COD' ? '💵 Tiền mặt (COD)' : '🏦 Chuyển khoản'}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn-primary btn-order" onClick={handleOrder} disabled={loading}>
              {loading ? 'Đang xử lý...' : `Đặt hàng · ${total.toLocaleString()}đ`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
