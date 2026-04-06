# 🍜 Food Service - Person 3

## Setup
```bash
npm install
npm start
```

## Port: 3002

## ⚙️ Đổi IP khi deploy
Mở file `index.js`, tìm phần `CONFIG` ở đầu file và đổi IP/port.

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /foods | Lấy danh sách món ăn (filter: ?category=main&available=true) |
| GET | /foods/:id | Lấy 1 món ăn |
| POST | /foods | Thêm món ăn mới |
| PUT | /foods/:id | Cập nhật món ăn |
| DELETE | /foods/:id | Xóa món ăn |
| GET | /health | Health check |

## Test
```bash
# Lấy danh sách món
curl http://localhost:3002/foods

# Thêm món mới
curl -X POST http://localhost:3002/foods \
  -H "Content-Type: application/json" \
  -d '{"name":"Cơm chiên dương châu","price":40000,"category":"main"}'
```
