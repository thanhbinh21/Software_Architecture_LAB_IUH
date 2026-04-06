# 📦 Order Service - Person 4

## Setup
```bash
npm install
npm start
```

## Port: 3003

## ⚙️ QUAN TRỌNG - Đổi IP trước khi chạy
Mở file `index.js`, tìm phần `CONFIG`:
```js
const CONFIG = {
  USER_SERVICE_URL: 'http://192.168.1.X:3001',  // 👈 IP máy Person 2
  FOOD_SERVICE_URL: 'http://192.168.1.X:3002',  // 👈 IP máy Person 3
};
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /orders | Tạo đơn hàng (gọi User + Food service) |
| GET | /orders | Lấy danh sách đơn (filter: ?user_id=1&status=PENDING) |
| GET | /orders/:id | Lấy 1 đơn hàng |
| PATCH | /orders/:id/status | Cập nhật trạng thái (dùng bởi Payment Service) |
| GET | /health | Health check |

## Test
```bash
# Tạo đơn hàng
curl -X POST http://localhost:3003/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "items": [
      {"food_id": 1, "quantity": 2},
      {"food_id": 3, "quantity": 1}
    ],
    "note": "Ít cay"
  }'
```

## Order Status Flow
PENDING → CONFIRMED → PAID → DELIVERING → COMPLETED
