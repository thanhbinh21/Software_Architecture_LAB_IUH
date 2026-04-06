# 👤 User Service - Person 2

## Setup
```bash
npm install
npm start
```

## Port: 3001

## ⚙️ Đổi IP khi deploy
Mở file `index.js`, tìm phần `CONFIG` ở đầu file và đổi IP/port cho phù hợp.

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /register | Đăng ký user mới |
| POST | /login | Đăng nhập, trả về JWT |
| GET | /users | Lấy danh sách users |
| GET | /users/:id | Lấy thông tin 1 user (dùng cho Order Service) |
| GET | /health | Health check |

## Test với curl

```bash
# Đăng ký
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Nguyen Van A","email":"test@test.com","password":"123456"}'

# Đăng nhập
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
```

## Default Accounts
- Admin: `admin@company.com` / `admin123`
