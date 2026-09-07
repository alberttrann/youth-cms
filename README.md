# TÀI LIỆU KỸ THUẬT 
## HỆ THỐNG: STRAPI v5 HEADLESS CMS CORE ENGINE (Y.O.U ALLIANCE PLATFORM)

---

## 1. Tổng quan Kiến trúc Hệ thống

Backend của nền tảng **Y.O.U (Youth Organization Union)** sử dụng **Strapi v5.50.0 (Node.js 22 LTS, TypeScript, Document Service API)**, hoạt động như một **Headless API Engine trung tâm**, phục vụ đồng thời hai ứng dụng tiêu thụ (Consumers):
1. **Public Website (React 19 SPA):** Khách vãng lai xem dự án, tổ chức, lãnh đạo, tin tức và nộp các form đăng ký công khai.
2. **Custom Management Portal (`/portal`):** Không gian làm việc chuyên biệt (bằng Ant Design v6) dành cho Super Admin, Biên tập viên, Chuyên viên Nhân sự (HR/Reviewer) và Kiểm toán viên (Viewer) thay thế giao diện mặc định của Strapi.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLIENT APPLICATIONS (FRONTEND)                                   │
│                                                                                                        │
│       🌐 Public Website (React 19 SPA)                       👑 Custom Management Portal (/portal)    │
│       • Read-only Content (/api/projects, /api/members)      • Visual Page Builder & Content Studio    │
│       • Public Form Submissions (/api/inquiries, etc.)       • HR / Board ATS Candidate Review Pipeline│
└───────────────────────────────────────────────┬────────────────────────────────────────────────────────┘
                                                │
                                                ▼ (Same-Origin /api/* Requests)
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLOUDFLARE EDGE WORKER PROXY                                         │
│   • CORS Preflight Engine: OPTIONS ➔ HTTP 204 No Content                                              │
│   • Method Allowlist: GET, HEAD, POST, PUT, DELETE                                                     │
│   • Auth Header Forwarding: Bảo toàn Bearer JWT của Admin Portal; bơm public token cho khách vãng lai  │
└───────────────────────────────────────────────┬────────────────────────────────────────────────────────┘
                                                │ (Upstream HTTP Request qua Internal / Tunnel Network)
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     STRAPI v5 BACKEND CORE ENGINE                                      │
│                                                                                                        │
│   ┌──────────────────────────────────┐ ┌──────────────────────────────────┐ ┌───────────────────────┐  │
│   │     Portal Auth Controller       │ │       Document Service API       │ │    Email Dispatcher   │  │
│   │  • bcrypt verify admin/staff     │ │  • Draft & Publish status        │ │  • setImmediate async │  │
│   │  • Master Token Issue (/login)   │ │  • Scoped Wildcard Populate      │ │  • LarkSuite / Gmail  │  │
│   └──────────────────────────────────┘ └──────────────────────────────────┘ └───────────────────────┘  │
│   ┌──────────────────────────────────┐ ┌──────────────────────────────────┐ ┌───────────────────────┐  │
│   │       RBAC Sync Engine           │ │     Custom Fields & Extensions   │ │   Lifecycles Engine   │  │
│   │  • 4 Roles DB Population         │ │  • global::multi-enum (SDGs)     │ │  • Focus SDGs Norm    │  │
│   │  • Anti-Overwrite Role Lock      │ │  • global::single-enum (Regions) │ │  • Email Auto-trigger │  │
│   └──────────────────────────────────┘ └──────────────────────────────────┘ └───────────────────────┘  │
└───────────────────────────────────────────────┬────────────────────────────────────────────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        ┌──────────────────────────────┐                  ┌──────────────────────────────┐
        │       Database Engine        │                  │     Cloudinary Media CDN     │
        │  • Dev: SQLite (.tmp/data.db)│                  │  • Auto WebP optimization    │
        │  • Prod: PostgreSQL 16       │                  │  • Resized thumbnails        │
        └──────────────────────────────┘                  └──────────────────────────────┘
```

---

## 2. Cấu trúc Thư mục Dự án 

```
youth-cms/
├── config/                        # Cấu hình cốt lõi của Strapi v5
│   ├── admin.ts                   # Auth secret, cấu hình Live Preview cho Single & Collection types
│   ├── api.ts                     # Giới hạn phân trang REST (defaultLimit: 25, maxLimit: 100)
│   ├── database.ts                # Database connectors (SQLite cho Local Dev, PostgreSQL cho Production)
│   ├── middlewares.ts             # Security CSP (whitelist Cloudinary), CORS, Body Parser
│   ├── plugins.ts                 # Cấu hình Cloudinary Upload provider, Nodemailer SMTP provider
│   └── server.ts                  # Host, Port, App keys, Webhook configs
├── public/                        # Static assets & robots.txt
│   └── uploads/                   # Fallback lưu trữ tệp cục bộ khi offline
├── scripts/                       # Các kịch bản CLI & Seeding
│   ├── seed-all.js                # Master Database Seeder (chạy trên dist/ compiled TS)
│   └── fix-focus-sdgs.js          # Tiện ích sửa dữ liệu SDG legacy
├── src/
│   ├── index.ts                   # Bootstrap gốc: Khởi tạo Master Token, đăng ký Custom Fields & RBAC
│   ├── admin/                     # Tùy biến giao diện Strapi Admin mặc định
│   │   ├── app.tsx                # Đăng ký multi-enum, single-enum, menu FAQ Display Order
│   │   ├── vite.config.ts         # Vite build config cho Admin bundle
│   │   └── extensions/
│   │       ├── fields/            # MultiEnumInput.tsx, SingleEnumInput.tsx
│   │       ├── icons/             # MultiEnumIcon.tsx, SingleEnumIcon.tsx
│   │       └── pages/             # FaqOrderPage.tsx (HTML5 Drag & Drop)
│   ├── api/                       # TOÀN BỘ 15 CONTENT TYPES & CUSTOM CONTROLLERS
│   │   ├── about-us/              # Single Type: Giới thiệu tổ chức Y.O.U (Dynamic Blocks)
│   │   ├── home-page/             # Single Type: Bố cục Trang chủ Dynamic (Dynamic Blocks)
│   │   ├── global-setting/        # Single Type: Hotline, Ngân hàng, QR Code, Điều khoản pháp lý
│   │   ├── project/               # Collection: Dự án SDG & Thư viện ảnh hoạt động
│   │   ├── member/                # Collection: Tổ chức Thành viên liên minh
│   │   ├── team-member/           # Collection: Ban Lãnh đạo (Executives) & Giám đốc Châu lục
│   │   ├── news-item/             # Collection: Tin tức, sự kiện & bài viết tác động
│   │   ├── policy-document/       # Collection: Tài liệu chính sách, Điều lệ & Báo cáo
│   │   ├── faq/                   # Collection: Câu hỏi thường gặp & displayOrder
│   │   ├── page/                  # Collection: Các trang Dynamic tùy biến theo slug
│   │   ├── inquiry/               # Collection: Yêu cầu liên hệ (status: unread..resolved, adminNotes)
│   │   ├── leadership-application/# Collection: Hồ sơ ứng tuyển Lãnh đạo (ATS Pipeline, adminNotes)
│   │   ├── organization-application/# Collection: Đăng ký thành viên tổ chức (ATS Pipeline)
│   │   ├── support-submission/    # Collection: Thư động viên & Quyên góp (status, adminNotes)
│   │   └── portal-auth/           # Custom API: Xác thực đa quyền & cấp Master Token cho Portal
│   ├── components/                # Component Schemas nhúng trong Dynamic Zones
│   │   ├── sections/              # 13 Khối Section (Hero, RichText, MediaText, StatsGrid...)
│   │   └── shared/                # 8 Khối dùng chung (Button, SEO, SocialLink, SectionStyle...)
│   └── utils/                     # Thư viện tiện ích dùng chung
│       ├── email-notifications.ts # Engine gửi email tự động 2 chiều qua Nodemailer/LarkSuite
│       ├── focus-sdgs.ts          # Lifecycle hook kiểm tra & chuẩn hóa mảng SDG 1..17
│       └── rbac.ts                # Engine khởi tạo 4 Roles & đồng bộ quyền trong DB
├── Dockerfile                     # Multi-stage production container build (Node 22 Bookworm)
├── docker-compose.yml             # Local production stack (Strapi + PostgreSQL 16)
├── package.json                   # Dependencies (@strapi/provider-email-nodemailer@5.50.0)
└── tsconfig.json                  # Cấu hình TypeScript (outDir: dist)
```

---

## 3. Data Modeling: 15 Content Types, Components & Dynamic Zones

### 3.1 Bảng Đặc tả Toàn bộ 15 Content Types

| UID Định danh | Loại Schema | `draftAndPublish` | Thuộc tính & Mục đích chính |
|---|---|:---:|---|
| `api::home-page.home-page` | **Single Type** | `true` | Quản lý bố cục động trang chủ (`contentBlocks` 13 sections), SEO metadata. Hỗ trợ i18n đa ngôn ngữ. |
| `api::about-us.about-us` | **Single Type** | `true` | Quản lý trang Giới thiệu (`contentBlocks` 13 sections), thư ngỏ Chủ tịch, SEO metadata. |
| `api::global-setting.global-setting` | **Single Type** | `false` | Cấu hình toàn trang: Địa chỉ, Email, Hotline, Giờ làm việc, Ngân hàng, Số tài khoản, Ảnh QR, Link Điều khoản. |
| `api::project.project` | **Collection** | `true` | Dự án SDG: Tên, mô tả, chỉ số tác động, khu vực, `countriesCovered`, `focusSdgs` (multi-enum), ảnh bìa, thư viện ảnh `gallery`, liên kết `member`. |
| `api::member.member` | **Collection** | `true` | Tổ chức thành viên: Logo, ảnh bìa, mô tả ngắn, mô tả chi tiết, quốc gia, châu lục, người đại diện, thời gian, `focusSdgs`. |
| `api::team-member.team-member` | **Collection** | `true` | Nhân sự cấp cao: `leadershipType` (executive / continental-director), `regionGroup`, `displayOrder`, ảnh chân dung, tiểu sử, năm nhiệm kỳ. |
| `api::news-item.news-item` | **Collection** | `true` | Bài viết tin tức: Tiêu đề, đoạn trích ngắn, nội dung chi tiết (Blocks AST), ảnh bìa, ngày đăng, chuyên mục, tác giả. |
| `api::policy-document.policy-document`| **Collection** | `true` | Văn bản chính sách: Tiêu đề, chuyên mục (`governance`, `membership`, `annual-reports`), định dạng (`pdf`, `xls`, `doc`, `ppt`), file media, dung lượng. |
| `api::faq.faq` | **Collection** | `true` | Hỏi đáp: `question`, `answer`, `displayOrder` (số nguyên dùng để sắp xếp kéo thả). |
| `api::page.page` | **Collection** | `true` | Trang tùy biến: `title`, `slug` (URL UID), SEO, Dynamic Zone `contentBlocks` (13 sections). |
| `api::inquiry.inquiry` | **Collection** | `false` | Tin nhắn liên hệ: Họ tên, email, điện thoại, lý do, tin nhắn, `status` (`unread`, `in_progress`, `resolved`, `archived`), `adminNotes`. |
| `api::leadership-application.leadership-application` | **Collection** | `false` | ATS Ứng tuyển Lãnh đạo: Thông tin cá nhân, WhatsApp, CV/Resume, 9 câu trả lời assessment JSON, `status` (`pending`..`accepted`), `adminNotes`, `reviewedAt`. |
| `api::organization-application.organization-application` | **Collection** | `false` | ATS Đăng ký Tổ chức: Thông tin Org & Dự án, `focusSdgs`, `projectFocusSdgs`, file đính kèm, `status`, `adminNotes`, `reviewedAt`. |
| `api::support-submission.support-submission` | **Collection** | `false` | Sổ quỹ & Thư ủng hộ: Họ tên, email, dự án bảo trợ, nội dung thư, cam kết tài chính, `donationFrequency`, `status`, `adminNotes`. |
| `api::portal-auth.portal-auth` | **Custom API** | — | Endpoint xác thực đăng nhập (`POST /login`) và kiểm tra phiên (`GET /me`) dành cho Custom Portal. |

---

### 3.2 Dynamic Zone Engine: 13 Khối Section Chuẩn hóa

Cả 3 schema `home-page`, `about-us` và `page` đều hỗ trợ **100% đồng nhất 13 khối section**:

```
contentBlocks (Dynamic Zone)
├── sections.hero               ➔ Banner tiêu đề lớn, gradient highlight, nút bấm CTA, video/ảnh nền
├── sections.rich-text          ➔ Khối soạn thảo văn bản phong phú theo chuẩn Strapi v5 Blocks AST
├── sections.media-text         ➔ Bố cục 2 cột: Ảnh/Video một bên, câu chuyện/nội dung một bên
├── sections.stats-grid         ➔ Lưới số liệu thống kê động (có animation đếm số, prefix +, suffix %)
├── sections.cta-banner         ➔ Banner kêu gọi hành động toàn màn hình với dải màu cầu vồng và ngôi sao
├── sections.image-gallery      ➔ Thư viện ảnh hoạt động dạng lưới hoặc dạng nổi bật (Featured layout)
├── sections.faq-section        ➔ Accordion câu hỏi thường gặp (hỗ trợ lấy FAQ toàn cục hoặc FAQ riêng)
├── sections.featured-projects  ➔ Lưới dự án nổi bật lấy trực tiếp từ Collection `projects`
├── sections.featured-members   ➔ Lưới tổ chức thành viên lấy trực tiếp từ Collection `members`
├── sections.team-grid          ➔ Danh sách Ban Lãnh đạo & Giám đốc Châu lục từ Collection `team-members`
├── sections.embed              ➔ Khối nhúng Iframe linh hoạt (tự động chuẩn hóa link YouTube sang /embed/)
├── sections.feature-grid       ➔ Lưới thẻ biểu tượng giới thiệu Sứ mệnh, Giá trị cốt lõi (Mission Cards)
└── sections.image-text-grid    ➔ Lưới hình tròn hoặc bo góc giới thiệu các lĩnh vực hoạt động trọng tâm
```

Mỗi section đều nhúng `shared.section-style` để kiểm soát:
- `background`: `white` | `light-blue` | `dark-navy` | `rainbow-soft` | `transparent`
- `paddingTop` / `paddingBottom`: `none` | `compact` | `normal` | `spacious`
- `containerWidth`: `narrow` (960px) | `default` (1344px) | `wide` (1536px) | `full` (100%)
- `textAlign`: `left` | `center` | `right`

---

## 4. Cơ chế Xác thực & Phân quyền RBAC 4 Tầng

### 4.1 Vấn đề & Giải pháp Master Session Token

Trong Strapi v5, hai hệ thống phân quyền hoàn toàn độc lập:
1. `admin::user` (Quản trị viên bảng điều khiển mặc định, lưu tại `strapi_admin_users`).
2. `plugin::users-permissions.user` (Người dùng Content API, lưu tại `up_users`).

Nếu Custom Portal sử dụng token người dùng thông thường, các thao tác quản trị phức tạp sẽ bị từ chối với mã lỗi `403 Forbidden` do cơ chế cache quyền hạn của Strapi.

**Giải pháp:**
- Tại thời điểm khởi động (`bootstrap`), Strapi tự sinh một **Full-Access Master API Token** cố định trong bảng `strapi_api_tokens`, được mã hóa an toàn dựa trên `ENCRYPTION_KEY` và `API_TOKEN_SALT` của hệ thống.
- Khi người dùng đăng nhập qua `/api/portal-auth/login`, controller xác thực mật khẩu qua **bcrypt** đối chiếu bảng Admin User.
- Khi xác thực thành công, hệ thống cấp Master Token này cho phiên làm việc của Portal. Token này cho phép thực hiện **100% các quyền CRUD** trên mọi Content Type và Plugin Upload một cách hợp lệ, đồng thời bảo vệ hệ thống trước các truy cập trái phép từ bên ngoài.

```typescript
// Trích đoạn src/index.ts: Khởi tạo Master Token tự động
async function ensurePortalMasterToken(strapi: Core.Strapi) {
  const salt = process.env.API_TOKEN_SALT;
  const encryptionKey = process.env.ENCRYPTION_KEY || 'you-portal-encryption-key-fallback';
  if (!salt) return;

  // Sinh khóa Master tất định từ cặp khóa bí mật của hệ thống
  const rawKey = crypto.createHmac('sha256', encryptionKey).update('you-management-portal-master-key').digest('hex');
  const hashedKey = crypto.createHmac('sha512', salt).update(rawKey).digest('hex');

  const existing = await strapi.db.query('admin::api-token').findOne({
    where: { name: 'YOU Portal Master Token' },
  });

  if (!existing) {
    await strapi.db.query('admin::api-token').create({
      data: {
        name: 'YOU Portal Master Token',
        description: 'Auto-generated master token for Y.O.U Management Portal',
        type: 'full-access',
        accessKey: hashedKey,
        lifespan: null,
      },
    });
  } else {
    await strapi.db.query('admin::api-token').update({
      where: { id: existing.id },
      data: { type: 'full-access', accessKey: hashedKey },
    });
  }

  strapi.config.set('portal.masterKey', rawKey);
  strapi.log.info('🔑 [Portal Master Token] Initialized permanent Full-Access Token for Portal.');
}
```

---

### 4.2 Ma trận 4 Roles & Cơ chế Chống Ghi đè Vai trò (Anti-Overwrite Protection)

Hệ thống hỗ trợ 4 vai trò quản trị:

```
┌───────────────────────────┬─────────────────────────────────────┬────────────────────────────────────┐
│ Role                      │ Quyền hạn (Allowed Scopes)          │ Ràng buộc Chặn (Strictly Blocked)  │
├───────────────────────────┼─────────────────────────────────────┼────────────────────────────────────┤
│ 👑 Super Admin            │ • Toàn quyền Content Studios        │ • Không có (Toàn quyền hệ thống)   │
│   (admin / super admin)   │ • Toàn quyền Page Builders          │                                    │
│                           │ • Quản lý ATS Tuyển dụng & Ứng viên │                                    │
│                           │ • Quản lý Media Studio              │                                    │
│                           │ • Cấu hình Ngân hàng, QR, Hotline   │                                    │
│                           │ • Quản lý Tài khoản Staff & Roles   │                                    │
├───────────────────────────┼─────────────────────────────────────┼────────────────────────────────────┤
│ ✍️ Content Editor         │ • Dự án (Tạo, Sửa, Xuất bản, Xóa)   │ 🚫 KHÔNG xem hồ sơ ứng viên (ATS) │
│   (editor)                │ • Tổ chức thành viên (Tạo, Sửa)     │ 🚫 KHÔNG xem Sổ quỹ quyên góp      │
│                           │ • Tin tức & Bài viết (Viết, Đăng)   │ 🚫 KHÔNG sửa Ngân hàng, Mã QR      │
│                           │ • Tài liệu, FAQ, Đội ngũ Lãnh đạo   │ 🚫 KHÔNG quản lý Tài khoản Staff   │
│                           │ • Quản lý Bố cục Trang (Builder)    │                                    │
│                           │ • Tải lên Media Studio              │                                    │
├───────────────────────────┼─────────────────────────────────────┼────────────────────────────────────┤
│ 📋 HR / Reviewer          │ • Tuyển dụng Lãnh đạo (Xem CV, ATS) │ 🚫 KHÔNG sửa nội dung Website     │
│   (reviewer / hr)         │ • Đọc 9 câu hỏi đánh giá ứng viên   │ 🚫 KHÔNG vào Page Builder          │
│                           │ • Đổi trạng thái ứng viên (Pipeline)│ 🚫 KHÔNG sửa Ngân hàng, Hotline    │
│                           │ • Ghi chú & Đánh giá nội bộ         │ 🚫 KHÔNG tạo tài khoản Staff       │
│                           │ • Duyệt hồ sơ Đăng ký Tổ chức       │ 🚫 KHÔNG xóa tệp trên Media Studio │
│                           │ • Hòm thư Tin nhắn & Phản hồi       │                                    │
│                           │ • Xuất file Excel/CSV Nhà hảo tâm   │                                    │
├───────────────────────────┼─────────────────────────────────────┼────────────────────────────────────┤
│ 👁️ Viewer / Auditor      │ • Xem Tổng quan & Số liệu Báo cáo   │ 🚫 KHÔNG CÓ QUYỀN GHI / SỬA / XÓA  │
│   (viewer / auditor)      │ • Đọc nội dung & Bố cục (Read-only) │ 🚫 KHÔNG đổi trạng thái ứng viên   │
│                           │ • Đọc hồ sơ ứng viên (Thanh tra)    │ 🚫 KHÔNG viết ghi chú nội bộ       │
│                           │ • Xem thư viện Media                │ 🚫 KHÔNG tạo/sửa/xóa bài viết      │
│                           │                                     │ 🚫 BỊ CHẶN khỏi Settings & Staff   │
└───────────────────────────┴─────────────────────────────────────┴────────────────────────────────────┘
```

#### Chống Ghi đè Role (`resolveRoleType`):
Trong các phiên bản trước, lỗi toán tử logic JavaScript `||` kết hợp với `? :` khiến tài khoản Viewer bị ép kiểu nhầm thành Reviewer. Phiên bản này chuẩn hoá bằng hàm phân loại vai trò độc lập:

```typescript
function resolveRoleType(role: any): string {
  if (!role) return 'viewer';
  const type = (role.type || '').toLowerCase();
  const name = (role.name || '').toLowerCase();

  if (type === 'admin' || name.includes('admin') || name.includes('super')) return 'admin';
  if (type === 'reviewer' || name.includes('hr') || name.includes('reviewer')) return 'reviewer';
  if (type === 'editor' || name.includes('editor')) return 'editor';
  if (type === 'viewer' || name.includes('viewer') || name.includes('audit')) return 'viewer';
  return 'viewer';
}
```

Đồng thời, hàm `synchronizeRbacPermissions` chỉ nâng cấp quyền Super Admin cho tài khoản trong lần đầu tiên đồng bộ (`!upUser.role || upUser.role.type === 'authenticated'`). **Nếu quản trị viên đã chủ động chuyển vai trò của tài khoản sang Editor, HR hoặc Viewer, hệ thống sẽ bảo toàn vĩnh viễn lựa chọn đó qua mọi lần khởi động lại server.**

---

## 5. Hệ thống Email Tự động & Gửi ngầm Bất đồng bộ (LarkSuite / SMTP)

Toàn bộ logic gửi mail được cô lập tại `src/utils/email-notifications.ts` kết hợp với `@strapi/provider-email-nodemailer@5.50.0`.

### 5.1 Kiến trúc Gửi Ngầm Không Chặn Luồng (Non-Blocking Engine)

```
Form nộp từ Client ──► afterCreate Hook ──► setImmediate() Worker ──► Nodemailer ──► LarkSuite SMTP
                                                    │
                                                    └──► Trả về HTTP 200 tức thì cho Client (< 50ms)
```

1. **Bọc hoàn toàn trong `setImmediate()`:** Tiến trình gửi mail chạy tách biệt ở background. Dù máy chủ SMTP bị mất kết nối hay phản hồi chậm 10–20 giây, dữ liệu của người dùng **vẫn được bảo đảm lưu thành công 100% vào Database** và giao diện Frontend nhận được phản hồi thành công ngay lập tức.
2. **Safe Fallback khi chưa có biến môi trường:** Nếu `SMTP_HOST` chưa được cấu hình, server ghi log thông tin và bỏ qua mà không làm crash tiến trình Node.js:
   ```typescript
   if (!process.env.SMTP_HOST) {
     strapi.log.info(`[Email Service] Chưa cấu hình SMTP_HOST. Bỏ qua gửi email tự động cho ${type}.`);
     return;
   }
   ```
3. **Làm sạch mã độc (`escapeHtml`):** Toàn bộ dữ liệu do người dùng nhập (Tên, Email, Lời nhắn) được mã hóa các ký tự đặc biệt (`&`, `<`, `>`, `"`, `'`) để ngăn chặn tấn công XSS hoặc phá vỡ cấu trúc email HTML.

---

### 5.2 Chuẩn hóa Nhận diện Dự án

Khắc phục lỗi hiển thị mã hash ngẫu nhiên của database (ví dụ `Supported Projects: kejykakupvhr4trmcwh8w0q1`):
- Modal quyên góp gửi mảng tên dự án rõ ràng (`["Green Belt Movement", "Education for All Initiative"]`).
- Template email tự động phân giải và hiển thị định dạng chuẩn:
  ```html
  <p><strong>Dự án ủng hộ:</strong> Green Belt Movement, Education for All Initiative</p>
  ```

---

### 5.3 Mẫu Email Thương hiệu Chuẩn Y.O.U

Tất cả email gửi đi từ hệ thống đều tuân thủ hệ thống nhận diện thương hiệu Y.O.U:
- **Thanh viền cầu vồng 4 màu:** `#EE334E` ➔ `#FCB131` ➔ `#00A651` ➔ `#0081C8`.
- **Tiêu đề thương hiệu:** Nhận diện Y.O.U Alliance chính thức.
- **Màu sắc chủ đạo:** Xanh đại dương `#005D9A`, đỏ nhấn `#EE334E`.
- **Chân trang chuyên nghiệp:** Nền xanh đen `#0B1A2B`, bản quyền liên minh toàn cầu 6 châu lục.

---

## 6. Tùy biến Admin Panel, Custom Fields & Sắp xếp Thứ tự

### 6.1 Đăng ký 2 Custom Fields Toàn cục (`src/admin/app.tsx`)

1. **`global::multi-enum` (Bộ chọn SDG 1–17):**
   - Loại dữ liệu: `json` (lưu mảng ID dạng chuỗi, ví dụ `["4", "10", "17"]`).
   - Giao diện: Hiển thị danh sách checkbox trực quan với đầy đủ tên 17 Mục tiêu Phát triển Bền vững của LHQ (`MultiEnumInput.tsx`).
2. **`global::single-enum` (Bộ chọn Khu vực / Dropdown không chuẩn hóa):**
   - Loại dữ liệu: `string`.
   - Giúp lưu trữ chính xác chuỗi có khoảng trắng và ký tự đặc biệt (ví dụ `"Southeast Asia"`, `"North Africa & Egypt"`), tránh việc enum mặc định của Strapi tự ý chuẩn hóa chữ thường làm sai lệch dữ liệu hiển thị ở Frontend.

---

### 6.2 Quản lý Thứ tự FAQ Kéo Thả (`src/admin/extensions/pages/FaqOrderPage.tsx`)

- Đăng ký vào thanh menu trái của Strapi Admin thông qua `app.addMenuLink`.
- Khai báo đầy đủ các thuộc tính bắt buộc của Strapi v5:
  ```typescript
  app.addMenuLink({
    to: '/faq-order',
    icon: Drag,          // Bắt buộc: Component Icon từ @strapi/icons
    intlLabel: {
      id: 'global.faq-order.label',
      defaultMessage: 'FAQ Display Order',
    },
    Component: async () => {
      const mod = await import('./extensions/pages/FaqOrderPage');
      return { default: mod.default };
    },
    permissions: [],    // Bắt buộc trong Strapi v5
    position: 9,
  });
  ```
- Cho phép kéo thả trực quan vị trí câu hỏi bằng HTML5 Drag & Drop và lưu hàng loạt `displayOrder` chỉ với 1 cú click.

---

## 7. Tích hợp Live Preview với Cloudflare Edge

Khai báo tại `config/admin.ts`:

```typescript
const PREVIEW_PATHS: Record<string, (documentId: string) => string> = {
  'api::home-page.home-page': () => '/',
  'api::about-us.about-us': () => '/about-us',
  'api::project.project': (documentId) => `/projects/${encodeURIComponent(documentId)}`,
  'api::member.member': (documentId) => `/members/${encodeURIComponent(documentId)}`,
  'api::news-item.news-item': (documentId) => `/news/${encodeURIComponent(documentId)}`,
  'api::faq.faq': () => '/',
  'api::team-member.team-member': () => '/leadership',
  'api::policy-document.policy-document': () => '/policy-documents',
  'api::page.page': (documentId) => `/pages/${encodeURIComponent(documentId)}`,
};
```

Khi bấm nút **Preview** trên Strapi Admin hoặc Custom Portal:
1. Strapi gọi handler mã hóa đường dẫn kèm chữ ký bảo mật:
   `https://youthorgunion.com/api/preview?url=/about-us&secret=PREVIEW_SECRET&status=draft`.
2. Cloudflare Edge Worker xác thực token `PREVIEW_SECRET`, thiết lập Cookie bảo mật `you_preview=draft`.
3. Trình duyệt chuyển hướng về trang tương ứng kèm cờ `?preview=1`. Frontend tự động bỏ qua bộ nhớ đệm (cache bypass) và truy vấn bản nháp thời gian thực từ Strapi.

---

## 8. Database Seeding Tự động & Xử lý Build TypeScript

### 8.1 Khắc phục Triệt để Lỗi Biên dịch Script Seeding

Khi chạy script độc lập bằng Node.js thuần trong dự án Strapi TypeScript, Node không thể tự động nạp các tệp `config/*.ts`. Nếu không chỉ định đường dẫn build, hàm khởi tạo sẽ báo lỗi:
```
TypeError: Cannot read properties of undefined (reading 'client')
```

**Giải pháp Chuẩn xác trong `scripts/seed-all.js`:**
1. Tải trước biến môi trường với `require('dotenv').config()`.
2. Truyền tường minh thư mục biên dịch `dist/` vào hàm `createStrapi()`:
   ```javascript
   const path = require('path');
   require('dotenv').config();
   const { createStrapi } = require('@strapi/strapi');

   async function seedAll() {
     const appDir = path.resolve(__dirname, '..');
     const distDir = path.resolve(appDir, 'dist'); // Trỏ chính xác vào dist/

     const strapi = await createStrapi({ appDir, distDir }).load();
     // Thực thi Document Service API...
     await strapi.destroy();
   }
   ```
3. Cấu hình kịch bản trong `package.json`:
   ```json
   "scripts": {
     "seed": "npm run build && node scripts/seed-all.js"
   }
   ```

---

### 8.2 Danh mục Dữ liệu được Khởi tạo Tự động khi Chạy `npm run seed`

1. **Global Setting:** Địa chỉ trụ sở, Hotline, Email, Tài khoản ngân hàng MB Bank, Cú pháp chuyển khoản.
2. **5 Câu hỏi thường gặp (FAQs):** Đánh số `displayOrder` từ 1 đến 5.
3. **4 Văn bản Chính sách (Policy Documents):** Phân loại Governance, Membership, Annual Reports.
4. **4 Bản tin Tác động (News Items):** Phân loại Khu vực, ngày phát hành, tác giả.
5. **6 Nhân sự Lãnh đạo (Team Members):** 3 Lãnh đạo điều hành (Executives) và 3 Giám đốc Châu lục.
6. **3 Tổ chức Thành viên Mẫu (Members):** CSE Global, Education Hub Ghana, YouthBridge PH.
7. **3 Dự án SDG Trọng điểm (Projects):** Tự động liên kết khóa ngoại với các tổ chức thành viên tương ứng.
8. **4 Vai trò Quản trị (Roles):** Tự động tạo `Super Admin`, `Content Editor`, `HR / Reviewer`, `Viewer / Auditor` và liên kết với tài khoản Admin hiện có.

---

## 9. Biến Môi trường, Docker & Bảo mật DevOps

### 9.1 Bảng Biến Môi trường Chi tiết (`youth-cms/.env`)

```env
# ===================================================
# CẤU HÌNH MÁY CHỦ STRAPI
# ===================================================
HOST=0.0.0.0
PORT=1337
NODE_ENV=development

# ===================================================
# MÃ KHÓA BẢO MẬT (Sinh bằng: openssl rand -base64 16)
# ===================================================
APP_KEYS=
API_TOKEN_SALT=
ADMIN_JWT_SECRET=
JWT_SECRET=
TRANSFER_TOKEN_SALT=
ENCRYPTION_KEY=

# ===================================================
# CƠ SỞ DỮ LIỆU
# ===================================================
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
DATABASE_SSL=false
# Khi triển khai Production với PostgreSQL:
# DATABASE_CLIENT=postgres
# DATABASE_URL=postgresql://strapi:password@127.0.0.1:5432/strapi

# ===================================================
# CLOUDINARY MEDIA CDN
# ===================================================
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=your_cloudinary_api_secret

# ===================================================
# CẤU HÌNH LIVE PREVIEW VỚI FRONTEND
# ===================================================
CLIENT_URL=http://localhost:5173
PREVIEW_SECRET=027d0b99313407e38a0396630ab008de2e2865b568163eff3688cc164a7c4bd2

# ===================================================
# CẤU HÌNH GỬI MAIL SMTP (HOT-SWAPPABLE)
# ===================================================
# Chế độ Production (LarkSuite SMTP qua cổng SSL 465):
SMTP_HOST=smtp.larksuite.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USERNAME=no-reply@youthorgunion.com
SMTP_PASSWORD=your_larksuite_smtp_authorization_code
EMAIL_DEFAULT_FROM="Youth Organization Union <no-reply@youthorgunion.com>"
EMAIL_DEFAULT_REPLY_TO=no-reply@youthorgunion.com
STAFF_NOTIFICATION_EMAIL=info@youthorgunion.org

# Hoặc chế độ Test Local (Gmail App Password):
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=465
# SMTP_SECURE=true
# SMTP_USERNAME=your_gmail@gmail.com
# SMTP_PASSWORD=your_16_char_app_password
# EMAIL_DEFAULT_FROM="Y.O.U Alliance <your_gmail@gmail.com>"
```

---

### 9.2 Triển khai Container Hóa

Tệp `Dockerfile` tối ưu hóa kích thước image và nâng cao bảo mật bằng non-root user:

```dockerfile
# Stage 1: Build source
FROM node:22-bookworm-slim AS build
WORKDIR /opt/app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev

# Stage 2: Runtime image
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=1337
WORKDIR /opt/app
RUN chown node:node /opt/app
COPY --from=build --chown=node:node /opt/app ./
USER node
EXPOSE 1337
CMD ["npm", "run", "start"]
```

Khởi chạy nhanh qua `docker-compose.yml`:
```bash
docker compose up -d --build
```

---

## 10. Troubleshooting Playbook

| Hiện tượng / Mã lỗi | Nguyên nhân gốc rễ kỹ thuật | Giải pháp khắc phục triệt để |
|---|---|---|
| **`TypeError: provider.init is not a function`** | Chưa cài đặt gói thư viện `@strapi/provider-email-nodemailer` vào `node_modules`. | Chạy `npm install @strapi/provider-email-nodemailer@5.50.0 --save` để cài đặt đúng phiên bản tương thích với Strapi Core. |
| **`TypeError: Cannot read properties of undefined (reading 'kind')`** | Sử dụng toán tử spread (`...teamMember`) trong `routes/index.ts` làm kích hoạt sớm getter `get routes()` trước khi Strapi tải xong schema. | Trong `src/api/team-member/routes/index.ts`, đổi thành `export default teamMember;` (không dùng spread). |
| **`400 Bad Request: Invalid key focusSDGs`** | Schema backend đặt tên camelCase `focusSdgs` nhưng client gửi lên `focusSDGs` (viết hoa chữ `SDGs`). | Chuẩn hóa toàn bộ tên thuộc tính trong `schema.json` và code client gửi đi thành `focusSdgs` và `projectFocusSdgs`. |
| **`400 Bad Request` khi lưu status trong `inquiries`** | Schema `inquiry` trước đó thiếu trường `status` và `adminNotes`. | Bổ sung enum `status: ["unread", "in_progress", "resolved", "archived"]` và trường `adminNotes: text` vào `inquiry/schema.json`. |
| **`403 Forbidden` khi thực hiện `PUT / POST` trong Portal** | Quyền `update`, `delete`, `create` chưa được cấp cho vai trò Authenticated trong bảng cơ sở dữ liệu `up_permissions`. | Chạy hàm `synchronizeRbacPermissions()` trong `src/index.ts` để nạp toàn bộ danh sách `ALL_STAFF_ACTIONS` vào bảng `up_permissions`. |
| **`401 Unauthorized` trên `/api/portal-auth/me`** | Mismatch khóa bí mật (dùng `ADMIN_JWT_SECRET` để ký nhưng lại kiểm tra bằng `JWT_SECRET`). | Sử dụng cơ chế Master Session Token tất định hoặc kiểm tra tính hợp lệ của token thống nhất qua `strapi.config.get('portal.masterKey')`. |
| **Tài khoản Viewer vẫn có quyền duyệt ứng viên** | Lỗi toán tử logic `||` và `? :` trong controller `portal-auth.ts` khiến mọi role bị ép kiểu thành `reviewer`. | Tách hàm phân loại vai trò độc lập `resolveRoleType(role)` và trả về đúng `type: 'viewer'`. |
| **Ảnh đại diện hoặc File PDF bị lỗi liên kết 404** | Trình render Blocks AST ở Frontend không tự động nối `baseUrl` cho các file tải lên cục bộ dạng `/uploads/...`. | Sử dụng hàm tiện ích `mediaUrl(media, baseUrl)` để luôn sinh URL tuyệt đối chính xác. |

---

### NGUYÊN TẮC VẬN HÀNH 

1. **Bảo toàn dữ liệu tuyệt đối:** Không bao giờ chạy câu lệnh `DROP TABLE` hoặc can thiệp SQL thô trên môi trường Production. Mọi thao tác cấu trúc phải thực hiện qua Strapi Content-Type Builder hoặc Database Migrations.
2. **Quy tắc Least Privilege (Đặc quyền tối thiểu):** Mọi tài khoản nhân sự mới tạo mặc định phải gán quyền thấp nhất (`Viewer / Auditor` hoặc không có quyền thao tác). Quyền hạn Biên tập viên hoặc HR chỉ được cấp khi có chỉ định của Quản trị viên cấp cao.
3. **Tính độc lập của Email Worker:** Luồng gửi email phải luôn nằm trong `setImmediate()`. Tuyệt đối không để lỗi kết nối hòm thư làm gián đoạn trải nghiệm nộp đơn của ứng viên hoặc quy trình lưu trữ hồ sơ của hệ thống.