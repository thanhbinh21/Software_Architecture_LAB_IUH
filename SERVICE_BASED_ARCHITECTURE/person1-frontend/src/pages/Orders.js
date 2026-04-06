import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';

const STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', color: '#f39c12' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#3498db' },
  PAID: { label: 'Đã thanh toán', color: '#27ae60' },
  DELIVERING: { label: 'Đang giao', color: '#8e44ad' },
  COMPLETED: { label: 'Hoàn thành', color: '#2ecc71' },
  CANCELLED: { label: 'Đã hủy', color: '#e74c3c' },
};

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll().then(res => {
      const myOrders = res.data.filter(o => o.user_id === user.id);
      setOrders(myOrders);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="loading">⏳ Đang tải đơn hàng...</div>;

  return (
    <div className="page">
      <h2>📋 Đơn hàng của tôi</h2>
      {orders.length === 0 ? (
        <div className="empty-cart">Bạn chưa có đơn hàng nào.</div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const status = STATUS_MAP[order.status] || { label: order.status, color: '#999' };
            return (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Đơn #{order.id}</span>
                  <span className="order-status" style={{ backgroundColor: status.color }}>{status.label}</span>
                </div>
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      {item.food_name} × {item.quantity} = {item.subtotal?.toLocaleString()}đ
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <span>Tổng: <strong>{order.total_price?.toLocaleString()}đ</strong></span>
                  <span className="order-date">{new Date(order.created_at).toLocaleString('vi-VN')}</span>
                </div>
                {order.note && <div className="order-note">📝 {order.note}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
