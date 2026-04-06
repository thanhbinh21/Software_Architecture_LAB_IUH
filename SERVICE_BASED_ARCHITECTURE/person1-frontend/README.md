# 🖥️ Frontend (ReactJS) - Person 1

## Setup
```bash
npm install
npm start
```

## Port: 3000 (React default)

## ⚙️ QUAN TRỌNG - Đổi IP trước khi chạy
Mở file `src/services/api.js`, tìm phần `CONFIG`:
```js
export const CONFIG = {
  USER_SERVICE:    'http://192.168.1.X:3001',  // 👈 IP máy Person 2
  FOOD_SERVICE:    'http://192.168.1.X:3002',  // 👈 IP máy Person 3
  ORDER_SERVICE:   'http://192.168.1.X:3003',  // 👈 IP máy Person 4
  PAYMENT_SERVICE: 'http://192.168.1.X:3004',  // 👈 IP máy Person 5
};
```

## Tính năng
- ✅ Đăng nhập / Đăng ký
- ✅ Xem danh sách món ăn
- ✅ Thêm vào giỏ hàng
- ✅ Đặt hàng + thanh toán COD/Banking
- ✅ Xem lịch sử đơn hàng
