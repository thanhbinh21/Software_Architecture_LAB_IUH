# MicroCMS Plugin-based theo kiến trúc Microkernel (Node.js)

Đây là project CMS đơn giản để demo kiến trúc Microkernel Plugin-based bằng Node.js thuần (không dùng Express).

## 1) Mục tiêu của project

Project này tập trung vào 3 mục tiêu:

1. Quản lý nội dung cơ bản (CRUD bài viết).
2. Quản lý plugin động (bật/tắt plugin khi runtime).
3. Phân tích hoạt động hệ thống qua plugin analytics.

Ý tưởng chính: lõi Microkernel giữ nhỏ gọn, còn logic nghiệp vụ đặt ở plugin để mở rộng dễ dàng mà không sửa lõi.

## 2) Kiến trúc Microkernel trong project

### 2.1 Thành phần lõi (core)

Lõi nằm trong thư mục core:

- kernel.js: Quản lý vòng đời plugin + EventBus + ServiceRegistry.
- base-plugin.js: Lớp cơ sở cho plugin.
- content-store.js: Dịch vụ lõi luôn bật để lưu bài viết trong bộ nhớ.

### 2.2 Cách kernel hoạt động

Kernel chỉ làm 3 việc:

1. Đăng ký, kích hoạt, vô hiệu hóa plugin.
2. Điều phối sự kiện qua EventBus.
3. Quản lý dịch vụ dùng chung qua ServiceRegistry.

Kernel không chứa logic SEO, Markdown, Analytics.
Kernel cũng không import cứng từng plugin cụ thể.

### 2.3 Thành phần mở rộng (plugins)

Các plugin hiện có:

- seo-plugin: Tạo slug, metaDescription, readingTime.
- markdown-plugin: Chuyển markdown sang HTML.
- analytics-plugin: Theo dõi lượt xem/tạo/sửa/xóa.

Plugin giao tiếp với hệ thống qua 2 cơ chế:

1. Hook event: kernel.events.on(...) / off(...)
2. Đăng ký service: kernel.services.register(...) / unregister(...)

### 2.4 Luồng dữ liệu mẫu khi tạo bài viết

1. Client gửi POST /api/posts.
2. server.js gọi content service từ kernel.services.
3. content-store phát event content:before-create (emitAsync).
4. Các plugin đang active lần lượt enrich dữ liệu.
5. ContentStore lưu dữ liệu cuối cùng.
6. ContentStore phát event content:created.
7. analytics-plugin nhận sự kiện và cập nhật thống kê.

## 3) Cấu trúc thư mục

```text
2.Microkernel_Plugin-based/
├── core/
│   ├── base-plugin.js
│   ├── content-store.js
│   └── kernel.js
├── plugins/
│   ├── analytics-plugin/
│   │   └── index.js
│   ├── markdown-plugin/
│   │   └── index.js
│   └── seo-plugin/
│       └── index.js
├── public/
│   └── index.html
├── index.js
├── server.js
└── package.json
```

## 4) Vì sao code hiện tại đúng hướng Microkernel

1. Core tách riêng, không lẫn nghiệp vụ plugin.
2. Plugin hoạt động qua event/service, không sửa file lõi khi xử lý nghiệp vụ.
3. Bootstrap tự quét plugin từ plugins/*/index.js để nạp plugin động.
4. Kích hoạt plugin có kiểm tra dependency.
5. Deactivate plugin có kiểm tra plugin phụ thuộc.

## 5) Chạy project

Yêu cầu:

- Node.js 18+ (khuyến nghị LTS mới)

Chạy:

```bash
node index.js
```

Mở trình duyệt:

- http://localhost:3000

Lưu ý:

- Project dùng module built-in của Node.js, không cần cài thư viện ngoài.

## 6) API chính

### 6.1 Content

- GET /api/posts: Lấy danh sách bài viết.
- POST /api/posts: Tạo bài viết mới.
- GET /api/posts/:id: Xem chi tiết bài viết (tăng view).
- PUT /api/posts/:id: Cập nhật bài viết.
- DELETE /api/posts/:id: Xóa bài viết.

### 6.2 Plugin Manager

- GET /api/plugins: Danh sách plugin và trạng thái.
- POST /api/plugins/activate: Kích hoạt plugin theo tên.
- POST /api/plugins/deactivate: Vô hiệu hóa plugin theo tên.

### 6.3 Analytics và Kernel log

- GET /api/analytics: Thống kê từ analytics-plugin.
- GET /api/logs: Nhật ký REGISTER/ACTIVATE/DEACTIVATE plugin.

## 7) Cách test 3 chức năng chính (chi tiết)

## 7.1 Test chức năng Quản lý nội dung + plugin enrich

Mục tiêu:

- Xác nhận tạo bài viết sẽ được SEO và Markdown plugin enrich tự động.

Bước test bằng PowerShell:

```powershell
$body = @{
  title = 'Bai viet demo'
  body  = '## Xin chao **Microkernel**'
  tags  = @('demo','ktpm')
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/api/posts' -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 6
```

Kỳ vọng:

1. Có các field từ plugin:
   - slug
   - metaDescription
   - readingTime
   - renderedHtml
2. GET /api/posts trả về bài viết vừa tạo.

## 7.2 Test chức năng Plugin Manager (activate/deactivate runtime)

Mục tiêu:

- Xác nhận bật/tắt plugin làm thay đổi hành vi hệ thống ngay lập tức.

Bước 1: Tắt seo-plugin

```powershell
$payload = @{ name = 'seo-plugin' } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/api/plugins/deactivate' -ContentType 'application/json' -Body $payload | ConvertTo-Json -Depth 6
```

Bước 2: Tạo bài viết mới

```powershell
$body = @{ title='Khong SEO'; body='No SEO fields'; tags=@('test') } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/api/posts' -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 6
```

Kỳ vọng:

1. Bài viết mới không có slug/metaDescription/readingTime.
2. markdown-plugin vẫn hoạt động nếu còn active.

Bước 3: Bật lại seo-plugin

```powershell
$payload = @{ name = 'seo-plugin' } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri 'http://localhost:3000/api/plugins/activate' -ContentType 'application/json' -Body $payload | ConvertTo-Json -Depth 6
```

Bước 4: Tạo lại bài viết và kiểm tra các field SEO xuất hiện lại.

## 7.3 Test chức năng Analytics Dashboard

Mục tiêu:

- Xác nhận analytics-plugin bắt đúng sự kiện hệ thống.

Bước test:

1. Tạo 1-2 bài viết.
2. Gọi GET /api/posts/:id vài lần để tăng view.
3. Cập nhật và xóa ít nhất 1 bài.
4. Gọi API analytics:

```powershell
Invoke-RestMethod -Method GET -Uri 'http://localhost:3000/api/analytics' | ConvertTo-Json -Depth 6
```

Kỳ vọng:

1. stats.views/creates/updates/deletes tăng tương ứng.
2. feed có lịch sử hành động gần nhất.
3. topPosts liệt kê bài có nhiều view.

## 8) Cách test chức năng thêm plugin mới

Mục tiêu:

- Xác nhận hệ thống tự nạp plugin mới mà không cần sửa index.js.

Bước 1: Tạo plugin mới tại plugins/wordcount-plugin/index.js

```js
const { BasePlugin } = require('../../core/base-plugin');

class WordCountPlugin extends BasePlugin {
  static meta = {
    name: 'wordcount-plugin',
    displayName: 'WordCount Plugin',
    version: '1.0.0',
    description: 'Dem so tu trong bai viet',
    author: 'Your Team',
    dependencies: [],
    color: '#22c55e',
  };

  async activate() {
    this._onBeforeCreate = async (data) => this._enrich(data);
    this._onBeforeUpdate = async (data) => this._enrich(data);
    this.kernel.events.on('content:before-create', this._onBeforeCreate);
    this.kernel.events.on('content:before-update', this._onBeforeUpdate);
  }

  async deactivate() {
    this.kernel.events.off('content:before-create', this._onBeforeCreate);
    this.kernel.events.off('content:before-update', this._onBeforeUpdate);
  }

  _enrich(data) {
    const text = (data.body || '').trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    return { ...data, wordCount };
  }
}

module.exports = WordCountPlugin;
```

Bước 2: Khởi động lại ứng dụng

```bash
node index.js
```

Bước 3: Kiểm tra plugin đã được auto-load

```powershell
Invoke-RestMethod -Method GET -Uri 'http://localhost:3000/api/plugins' | ConvertTo-Json -Depth 6
```

Kỳ vọng:

1. Có plugin wordcount-plugin trong danh sách.
2. Trạng thái active sau khi startup.

Bước 4: Tạo bài viết mới và kiểm tra field wordCount xuất hiện.

## 9) Checklist đánh giá đúng kiến trúc (cho báo cáo/demo)

Bạn có thể dùng checklist sau khi thuyết trình:

1. Kernel không phụ thuộc trực tiếp plugin cụ thể.
2. Có EventBus để plugin hook vào vòng đời dữ liệu.
3. Có ServiceRegistry để chia sẻ dịch vụ giữa các thành phần.
4. Core service tồn tại độc lập kể cả khi tắt plugin.
5. Plugin có thể bật/tắt lúc runtime.
6. Có thể thêm plugin mới bằng cách thêm thư mục plugin, không sửa lõi.

## 10) Hạn chế hiện tại và hướng mở rộng

Hạn chế:

1. Dữ liệu đang lưu in-memory, restart là mất.
2. Chưa có test tự động.
3. Chưa có cơ chế phân quyền plugin.

Hướng mở rộng:

1. Thay ContentStore bằng DB (SQLite/PostgreSQL) qua service adapter.
2. Thêm test tự động cho event pipeline và plugin lifecycle.
3. Thêm plugin cache/search/notification để demo mở rộng sâu hơn.

---

Nếu bạn cần, có thể bổ sung luôn bộ kịch bản demo 5-7 phút để thuyết trình trên lớp (bao gồm thứ tự click UI + các lệnh API ngắn gọn để live demo).
