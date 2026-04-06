# 💳 Payment + Notification Service - Person 5

## Setup
```bash
npm install
npm start
```

## Port: 3004 (Payment + Notification)

## ⚙️ QUAN TRỌNG - Đổi IP trước khi chạy
Mở file `index.js`, tìm phần `CONFIG`:
```js
const CONFIG = {
  ORDER_SERVICE_URL: 'http://192.168.1.X:3003',  // 👈 IP máy Person 4
};
```

## API Endpoints

### Payment
| Method | URL | Description |
|--------|-----|-------------|
| POST | /payments | Thanh toán đơn hàng (COD/BANKING) |
| GET | /payments | Lấy danh sách thanh toán |
| GET | /payments/:id | Lấy 1 thanh toán |

### Notification
| Method | URL | Description |
|--------|-----|-------------|
| POST | /notifications | Nhận thông báo từ service khác |
| GET | /notifications | Lấy danh sách thông báo |

## Test
```bash
# Thanh toán COD
curl -X POST http://localhost:3004/payments \
  -H "Content-Type: application/json" \
  -d '{"order_id": 1, "method": "COD", "amount": 90000}'

# Thanh toán Banking
curl -X POST http://localhost:3004/payments \
  -H "Content-Type: application/json" \
  -d '{"order_id": 2, "method": "BANKING", "amount": 55000}'
```

## Flow
1. Nhận request thanh toán
2. Gọi Order Service lấy thông tin đơn
3. Xử lý thanh toán (simulate)
4. Gọi Order Service cập nhật status → PAID
5. Lưu notification + console.log
