# 🛠️ TÀI LIỆU KỸ THUẬT
## HỆ THỐNG: STRAPI v5 HEADLESS CMS ENGINE (Y.O.U ALLIANCE PLATFORM)
*Phiên bản: 2.0 (Strapi v5.50.0) — Tháng 9/2026*

---

## 📑 MỤC LỤC
1. [Tổng quan Kiến trúc Backend & Triết lý Thiết kế](#1-tổng-quan-kiến-trúc-backend--triết-lý-thiết-kế)
2. [Cấu trúc Thư mục Dự án (`alberttrann-youth-cms`)](#2-cấu-trúc-thư-mục-dự-án-alberttrann-youth-cms)
3. [Data Modeling: Content Types, Components & Dynamic Zones](#3-data-modeling-content-types-components--dynamic-zones)
4. [Cơ chế Xác thực & Phân quyền Đa tầng (Authentication & RBAC)](#4-cơ-chế-xác-thực--phân-quyền-đa-tầng-authentication--rbac)
5. [Hệ thống Email Tự động & Gửi ngầm Bất đồng bộ (LarkSuite / SMTP)](#5-hệ-thống-email-tự-động--gửi-ngầm-bất-đồng-bộ-larksuite--smtp)
6. [Tùy biến Admin Panel & Custom Fields (Multi-Enum, Single-Enum, FAQ Drag-Drop)](#6-tùy-biến-admin-panel--custom-fields-multi-enum-single-enum-faq-drag-drop)
7. [Tích hợp Live Preview Thời gian thực với Cloudflare Edge](#7-tích-hợp-live-preview-thời-gian-thực-với-cloudflare-edge)
8. [Database Seeding & Khởi tạo Dữ liệu Quan hệ](#8-database-seeding--khởi-tạo-dữ-liệu-quan-hệ)
9. [Cấu hình Hạ tầng, Docker & Bảo mật Môi trường (DevOps)](#9-cấu-hình-hạ-tầng-docker--bảo-mật-môi-trường-devops)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Tổng quan Kiến trúc Backend & Triết lý Thiết kế

Backend của nền tảng **Y.O.U** được xây dựng trên nền **Strapi v5 (Node.js 22 LTS, TypeScript)**, hoạt động như một **Headless API Engine** độc lập hoàn toàn với tầng giao diện.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT APPS / CONSUMERS                                        │
│                                                                                                  │
│       🌐 Public Website (React 19 SPA)                     👑 Custom Management Portal          │
│       • Read-only Content (/api/projects, /api/members)    • Content Studio & Visual Page Builder│
│       • Public Forms (/api/inquiries, /api/upload)         • HR / Board ATS Candidate Pipeline   │
└─────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                              │
                                              ▼ Same-Origin /api/*
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CLOUDFLARE EDGE WORKER PROXY                                    │
│   • Bơm Secret Token an toàn (Không lộ token ra client bundle)                                   │
│   • CORS Preflight Handler (OPTIONS ➔ 204) & Forward Headers                                    │
└─────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                              │ Upstream HTTP Request
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   STRAPI v5 BACKEND CORE                                         │
│                                                                                                  │
│   ┌────────────────────────────────┐ ┌────────────────────────────────┐ ┌────────────────────┐   │
│   │     Portal Auth Controller     │ │      Document Service API      │ │ Email Dispatcher   │   │
│   │  • bcrypt verify admin::user   │ │  • Draft & Publish status      │ │ • Non-blocking     │   │
│   │  • Master Token Issue (/login) │ │  • Deep Wildcard Populate      │ │   setImmediate     │   │
│   └────────────────────────────────┘ └────────────────────────────────┘ └────────────────────┘   │
│   ┌────────────────────────────────┐ ┌────────────────────────────────┐ ┌────────────────────┐   │
│   │      Users & Permissions       │ │    Custom Fields / Plugins     │ │ Lifecycle Hooks    │   │
│   │  • RBAC 4 Roles Sync (/me)     │ │  • multi-enum (SDGs 1-17)      │ │ • Data normalizer  │   │
│   │  • Auto-grant permissions      │ │  • single-enum (Region picker) │ │ • Email trigger    │   │
│   └────────────────────────────────┘ └────────────────────────────────┘ └────────────────────┘   │
└─────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │   Database Engine       │                       │  Cloudinary Media CDN   │
        │   • Dev: SQLite (.tmp)  │                       │  • Auto-webp conversion │
        │   • Prod: PostgreSQL 16 │                       │  • Resized thumbnails   │
        └─────────────────────────┘                       └─────────────────────────┘
```

### Nguyên tắc Cốt lõi Backend:
1. **Zero Client Leakage:** Tuyệt đối không lưu API Token có quyền ghi vào code Frontend. Mọi thao tác ghi/sửa/xóa đều phải qua phiên xác thực Portal hoặc Cloudflare Worker.
2. **Non-Blocking Resilience:** Các tác vụ phụ trợ (gửi email, xử lý ảnh) tuyệt đối không được chặn (block) giao dịch ghi Database.
3. **Strict Data Normalization:** Dữ liệu danh sách (SDGs, Countries, Status) phải được chuẩn hóa qua Lifecycle Hooks trước khi lưu vào DB.
4. **Declarative RBAC:** Mọi quyền hạn (Public vs Authenticated Staff) được tự động đồng bộ qua code (`src/utils/rbac.ts`) khi server khởi động (Idempotent Bootstrap).

---

## 2. Cấu trúc Thư mục Dự án (`alberttrann-youth-cms`)

```
alberttrann-youth-cms/
├── config/                        # Cấu hình cốt lõi của Strapi v5
│   ├── admin.ts                   # Auth secret, Preview handler (Live Preview mapping)
│   ├── api.ts                     # Cấu hình giới hạn REST pagination (default: 25, max: 100)
│   ├── database.ts                # Database connector (SQLite cho Dev, Postgres cho Prod)
│   ├── middlewares.ts             # Security CSP (whitelist Cloudinary), CORS, Logger, Body parser
│   ├── plugins.ts                 # Cấu hình Cloudinary Upload provider, Nodemailer SMTP provider
│   └── server.ts                  # Host, Port, App keys, Webhook configs
├── database/                      # Migrations & database files cục bộ
│   └── migrations/
├── public/                        # Static assets & robots.txt
│   └── uploads/                   # Thư mục lưu file tạm thời (fallback khi offline Cloudinary)
├── scripts/                       # Các kịch bản CLI & Seeding
│   └── seed-all.js                # Master Database Seeder (chạy trên dist/ compiled TS)
├── src/
│   ├── index.ts                   # Root Bootstrap: Đăng ký Custom Fields & đồng bộ Permissions
│   ├── admin/                     # Tùy biến Giao diện Admin Strapi
│   │   ├── app.tsx                # Đăng ký Custom Fields (multi-enum, single-enum), menu FAQ Reorder
│   │   ├── vite.config.ts         # Vite build config cho Strapi Admin
│   │   └── extensions/
│   │       ├── fields/            # React Input Components: MultiEnumInput.tsx, SingleEnumInput.tsx
│   │       ├── icons/             # Custom SVG Icons cho Custom Fields
│   │       └── pages/             # Custom Pages trong Admin: FaqOrderPage.tsx
│   ├── api/                       # 🌟 14 CONTENT TYPES & CUSTOM APIs
│   │   ├── about-us/              # Single Type: Giới thiệu tổ chức
│   │   ├── home-page/             # Single Type: Bố cục Trang chủ Dynamic
│   │   ├── global-setting/        # Single Type: Hotline, Ngân hàng, QR Code, Điều khoản
│   │   ├── project/               # Collection Type: Dự án SDG
│   │   ├── member/                # Collection Type: Tổ chức Thành viên
│   │   ├── team-member/           # Collection Type: Ban Lãnh đạo & Giám đốc Châu lục
│   │   ├── news-item/             # Collection Type: Tin tức & Câu chuyện Tác động
│   │   ├── policy-document/       # Collection Type: Tài liệu Chính sách & Báo cáo
│   │   ├── faq/                   # Collection Type: Câu hỏi thường gặp & displayOrder
│   │   ├── page/                  # Collection Type: Trang Dynamic tùy biến theo slug
│   │   ├── inquiry/               # Collection Type: Yêu cầu liên hệ từ website
│   │   ├── leadership-application/# Collection Type: Hồ sơ ứng tuyển Lãnh đạo (ATS)
│   │   ├── organization-application/# Collection Type: Hồ sơ đăng ký Tổ chức thành viên
│   │   ├── support-submission/    # Collection Type: Thư động viên & Quyên góp tài chính
│   │   └── portal-auth/           # Custom API: Xác thực & Cấp Master Token cho Custom Portal
│   ├── components/                # Component Schemas cho Dynamic Zones
│   │   ├── sections/              # 13 Khối Section (Hero, MediaText, StatsGrid, CTABanner...)
│   │   └── shared/                # 8 Khối Dùng chung (Button, SEO, SocialLink, SectionStyle...)
│   ├── extensions/                # Mở rộng plugins Strapi
│   │   └── users-permissions/     # Custom controller hook tạo user từ Content Manager
│   └── utils/                     # Thư viện tiện ích
│       ├── email-notifications.ts # Engine gửi email tự động 2 chiều qua Nodemailer/LarkSuite
│       ├── focus-sdgs.ts          # Lifecycle hook chuẩn hóa SDGs (1..17)
│       └── rbac.ts                # Engine đồng bộ quyền & khởi tạo 4 Roles trong DB
├── types/                         # TypeScript definitions do Strapi tự sinh ra khi build
├── Dockerfile                     # Multi-stage production container build (Node 22 Bookworm)
├── docker-compose.yml             # Local production stack (Strapi + PostgreSQL)
├── package.json                   # Dependencies & Scripts
└── tsconfig.json                  # TypeScript Compiler Options (target: ES2019, outDir: dist)
```

---

## 3. Data Modeling: Content Types, Components & Dynamic Zones

Strapi v5 phân chia rõ ràng giữa **Single Types** (trang đơn), **Collection Types** (danh sách), **Components** (cấu trúc con) và **Dynamic Zones** (bố cục linh hoạt).

### 3.1 Bảng Tổng hợp 14 Content Types

| API Identifier | Kiểu Schema | `draftAndPublish` | Quan hệ / Đặc điểm quan trọng |
|---|---|:---:|---|
| `api::home-page.home-page` | **Single Type** | `true` | Dynamic Zone `contentBlocks` (13 khối), Component `seo` |
| `api::about-us.about-us` | **Single Type** | `true` | Dynamic Zone `contentBlocks` (13 khối), Component `seo` |
| `api::global-setting.global-setting` | **Single Type** | `false` | Thông tin liên hệ, Ngân hàng, Ảnh QR, Component `socialLinks` |
| `api::project.project` | **Collection** | `true` | `manyToOne` với `member`, Custom Field `focusSdgs`, Media `gallery` |
| `api::member.member` | **Collection** | `true` | `oneToMany` với `projects`, Custom Field `focusSdgs`, Media `logo/cover` |
| `api::team-member.team-member` | **Collection** | `true` | Enum `leadershipType`, `regionGroup`, `displayOrder`, Media `avatar` |
| `api::news-item.news-item` | **Collection** | `true` | Rich Text `content` (Blocks AST), `date`, `category`, `author` |
| `api::policy-document.policy-document`| **Collection** | `true` | Enum `category`, `fileType`, Media `file`, `fileSize` |
| `api::faq.faq` | **Collection** | `true` | `question`, `answer`, `displayOrder` (Sắp xếp ưu tiên hiển thị) |
| `api::page.page` | **Collection** | `true` | `title`, `slug` (UID targetField), Dynamic Zone `contentBlocks` |
| `api::inquiry.inquiry` | **Collection** | `false` | Form khách gửi, Enum `status` (unread, in_progress, resolved), `adminNotes` |
| `api::leadership-application.leadership-application` | **Collection** | `false` | ATS ứng viên: 9 câu assessment JSON, CV file, Enum `status` (pending..accepted) |
| `api::organization-application.organization-application` | **Collection** | `false` | Duyệt tổ chức: Thông tin Org + Dự án, Enum `status`, `adminNotes` |
| `api::support-submission.support-submission` | **Collection** | `false` | Thư ủng hộ, cam kết tài chính, Enum `donationFrequency`, Enum `status` |

---

### 3.2 Hệ thống Dynamic Zone: 13 Section Components

Trong Strapi v5, Dynamic Zone cho phép biên tập viên kéo thả các khối giao diện theo ý muốn:

```
home-page / about-us / page
   └── contentBlocks (Dynamic Zone)
          ├── sections.hero
          ├── sections.rich-text
          ├── sections.media-text
          ├── sections.stats-grid
          ├── sections.cta-banner
          ├── sections.image-gallery
          ├── sections.faq-section
          ├── sections.featured-projects
          ├── sections.featured-members
          ├── sections.team-grid
          ├── sections.embed
          ├── sections.feature-grid
          └── sections.image-text-grid
```

Mỗi section component đều nhúng component con `shared.section-style` để tùy biến giao diện:
- `background`: `white` | `light-blue` | `dark-navy` | `rainbow-soft` | `transparent`
- `paddingTop` & `paddingBottom`: `none` | `compact` | `normal` | `spacious`
- `containerWidth`: `narrow` (960px) | `default` (1344px) | `wide` (1536px) | `full` (100%)
- `textAlign`: `left` | `center` | `right`

---

### 3.3 Chuẩn hóa Dữ liệu qua Lifecycle Hooks (`src/utils/focus-sdgs.ts`)

Để đảm bảo trường `focusSdgs` trong `member`, `project`, `team-member` luôn là danh sách hợp lệ các mục tiêu phát triển bền vững của Liên Hợp Quốc (1 đến 17), hệ thống áp dụng lifecycle hook:

```typescript
const ALLOWED_SDGS = new Set(Array.from({ length: 17 }, (_, i) => String(i + 1)));

export const normaliseFocusSdgs = (event: any) => {
  const data = event.params?.data;
  if (!data || data.focusSdgs === undefined) return;

  const list = toStringArray(data.focusSdgs);
  const bad = list.filter((v) => !ALLOWED_SDGS.has(v));
  if (bad.length) {
    throw new Error(
      `focusSdgs chỉ chấp nhận giá trị từ 1 đến 17 (UN SDG). Giá trị không hợp lệ: ${bad.join(', ')}`
    );
  }

  // Loại bỏ trùng lặp và giữ nguyên thứ tự
  const dedup = Array.from(new Set(list));
  event.params.data.focusSdgs = dedup.length ? dedup : null;
};
```

---

## 4. Cơ chế Xác thực & Phân quyền Đa tầng (Authentication & RBAC)

Hệ thống kết hợp song song hai cơ chế xác thực của Strapi để vừa phục vụ Website công khai, vừa cấp quyền cho Custom Management Portal (`/portal`).

### 4.1 Phân biệt 2 Tầng Người dùng trong Strapi

```
┌─────────────────────────────────────────────────────────┐  ┌─────────────────────────────────────────────────────────┐
│              1. STRAPI ADMIN TABLE (`admin::user`)      │  │        2. CONTENT API USERS (`plugin::users-permissions`)│
│  • Bảng CSDL: `strapi_admin_users`                      │  │  • Bảng CSDL: `up_users` & `up_roles`                │
│  • Dùng để: Đăng nhập giao diện mặc định Strapi (:1337) │  │  • Dùng để: Gọi API `/api/*`                         │
│  • Khởi tạo qua: `npm run develop` (Màn hình Setup)     │  │  • Gắn với các Role: Super Admin, Editor, Reviewer...│
└─────────────────────────────────────────────────────────┘  └─────────────────────────────────────────────────────────┘
```

### 4.2 Cơ chế Cấp Master Session Token: `src/api/portal-auth`

Khi staff đăng nhập vào Custom Portal (`/portal/login`), họ gửi request tới endpoint tùy biến `POST /api/portal-auth/login`.

1. **Xác thực bcrypt:** Kiểm tra mật khẩu đối chiếu với bảng `admin::user` (hoặc `up_users`).
2. **Cấp Master Session Token:** Khi mật khẩu đúng, Strapi cấp một **Full-Access API Token** (được lưu tại bảng `strapi_api_tokens`) và gửi về Frontend.
3. **Thực thi Full Quyền:** Khi Frontend gửi kèm `Authorization: Bearer <master_token>`, middleware lõi của Strapi nhận diện đây là Master Token và **cho phép thực thi 100% các thao tác CRUD** mà không bị vướng lỗi `403 Forbidden`.

```typescript
// Trích đoạn src/api/portal-auth/controllers/portal-auth.ts
const bcrypt = require('bcryptjs');

export default {
  async login(ctx: any) {
    const { email, password } = ctx.request.body || {};
    const targetEmail = (email || '').trim().toLowerCase();

    // 1. Kiểm tra tài khoản trong bảng admin::user
    const adminUser = await strapi.db.query('admin::user').findOne({
      where: { email: targetEmail, isActive: true },
      populate: ['roles'],
    });

    if (!adminUser || !(await bcrypt.compare(password, adminUser.password))) {
      return ctx.badRequest('Email hoặc mật khẩu không chính xác.');
    }

    // 2. Lấy Master Token đã khởi tạo tại bootstrap
    const masterToken = strapi.config.get('portal.masterKey');

    strapi.log.info(`🔑 [Portal Auth] Phiên đăng nhập Admin thành công: ${adminUser.email}`);

    return ctx.send({
      jwt: masterToken,
      user: {
        id: adminUser.id,
        username: `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim() || adminUser.username,
        email: adminUser.email,
        role: {
          id: adminUser.roles?.[0]?.id || 1,
          name: adminUser.roles?.[0]?.name || 'Super Admin',
          type: 'admin',
        },
      },
    });
  },
};
```

---

### 4.3 Đồng bộ Quyền Tự động: `src/utils/rbac.ts`

Khi server khởi động (`bootstrap`), hàm `synchronizeRbacPermissions()` tự động:
1. Đảm bảo 4 Roles tồn tại trong bảng `up_roles`: **Super Admin (`admin`)**, **Content Editor (`editor`)**, **HR / Reviewer (`reviewer`)**, **Viewer / Auditor (`viewer`)**.
2. Tự động thêm các dòng quyền hạn tương ứng vào bảng `up_permissions` mà không cần quản trị viên phải vào giao diện Strapi để tích chọn thủ công.

---

## 5. Hệ thống Email Tự động & Gửi ngầm Bất đồng bộ (LarkSuite / SMTP)

Toàn bộ logic gửi mail được cô lập tại `src/utils/email-notifications.ts` sử dụng `@strapi/provider-email-nodemailer`.

```
Form Submission (afterCreate) ──► setImmediate() (Async Worker) ──► Nodemailer Transport ──► LarkSuite SMTP
                                          │
                                          └──► Không chặn Database Transaction (Response < 50ms)
```

### 5.1 Quy tắc An toàn 3 Lớp

1. **Gửi ngầm không chặn luồng (`setImmediate`):** Quá trình kết nối SMTP và gửi thư diễn ra ở background. Dù máy chủ SMTP có bị trễ hay mất mạng, bản ghi của người dùng **vẫn được lưu 100% vào DB** và client nhận phản hồi `200 OK` tức thì.
2. **Fallback an toàn khi thiếu cấu hình:** Nếu biến môi trường `SMTP_HOST` không được khai báo (như khi chạy local test), hệ thống ghi log cảnh báo nhẹ nhàng và bỏ qua mà không ném lỗi crash server:
   ```typescript
   if (!process.env.SMTP_HOST) {
     strapi.log.info(`[Email Service] Chưa cấu hình SMTP_HOST. Bỏ qua gửi email cho ${type}.`);
     return;
   }
   ```
3. **Chống Phishing & XSS (`escapeHtml`):** Toàn bộ dữ liệu do người dùng gửi lên được làm sạch các ký tự `<`, `>`, `&`, `"`, `'` trước khi đưa vào template HTML.

### 5.2 Luồng Email Hai Chiều (Dual-Email)

| Loại Hồ sơ | Email Thông báo Ban Quản trị (Staff Alert) | Email Xác nhận Người dùng (User Receipt) |
|---|---|---|
| **Inquiry** | Gửi tới `STAFF_NOTIFICATION_EMAIL` kèm lý do & lời nhắn | Thư xác nhận đã tiếp nhận, hẹn phản hồi trong 5–7 ngày |
| **Leadership Application** | Gửi kèm tóm tắt ứng viên, châu lục, link duyệt trên ATS | Thư xác nhận ứng tuyển vị trí Giám đốc châu lục |
| **Organization Application**| Gửi kèm tên tổ chức, quốc gia, dự án trọng tâm | Thư xác nhận hồ sơ đăng ký thành viên liên minh |
| **Support Submission** | Gửi kèm nội dung thư động viên & cam kết tài chính | Thư cảm ơn sâu sắc từ ban điều hành liên minh Y.O.U |

---

## 6. Tùy biến Admin Panel & Custom Fields

Strapi v5 cho phép mở rộng giao diện thông qua `src/admin/app.tsx`.

### 6.1 Đăng ký 2 Custom Fields Toàn cục

1. **`global::multi-enum` (Bộ chọn SDG 1–17):**
   - Lưu trữ dạng: `json` (mảng string `["1", "4", "17"]`).
   - Giao diện Admin: Hiển thị danh sách checkbox trực quan với đầy đủ tên 17 mục tiêu SDG của Liên Hợp Quốc (`src/admin/extensions/fields/MultiEnumInput.tsx`).
2. **`global::single-enum` (Bộ chọn Khu vực / Quốc gia):**
   - Lưu trữ dạng: `string` (giữ nguyên chuỗi hiển thị, ví dụ `"Southeast Asia"`, tránh việc enum mặc định của Strapi tự động chuẩn hóa chữ thường làm vỡ giao diện).
   - Giao diện Admin: Dropdown chọn đơn (`SingleEnumInput.tsx`).

### 6.2 Trang Kéo thả Sắp xếp Thứ tự FAQ (`FaqOrderPage.tsx`)

Được đăng ký tại menu Admin thông qua `app.addMenuLink`:
- Đường dẫn: `/faq-order`.
- Giao diện: Sử dụng cơ chế Native HTML5 Drag-and-Drop để biên tập viên kéo thả đổi vị trí các câu hỏi.
- Khi bấm **Save order**, hệ thống tự động cập nhật trường `displayOrder` (1, 2, 3...) cho từng câu hỏi thông qua Content Manager API.

---

## 7. Tích hợp Live Preview Thời gian thực với Cloudflare Edge

Cấu hình xem trước trực tiếp được khai báo tại `config/admin.ts`:

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

Khi bấm nút **Preview** trên Strapi Admin:
1. Strapi gọi handler tạo đường link: `http://localhost:5173/api/preview?url=/projects/xxx&secret=PREVIEW_SECRET&status=draft`.
2. Cloudflare Worker xác thực bí mật và trả về cookie `you_preview=draft`.
3. Trình duyệt chuyển hướng về `/projects/xxx?preview=1`, tải bản nháp thời gian thực từ Strapi.

---

## 8. Database Seeding & Khởi tạo Dữ liệu Quan hệ

Hệ thống đi kèm kịch bản khởi tạo dữ liệu mẫu: `scripts/seed-all.js`.

### 8.1 Cơ chế Chạy Script với TypeScript trong Strapi v5

Vì Strapi v5 được viết bằng TypeScript (`config/*.ts`), khi chạy script độc lập bằng Node.js thuần, phải chỉ định thư mục build compiled **`dist/`** để Strapi nạp đúng các file `.js`:

```javascript
const path = require('path');
require('dotenv').config();
const { createStrapi } = require('@strapi/strapi');

async function seedAll() {
  const appDir = path.resolve(__dirname, '..');
  const distDir = path.resolve(appDir, 'dist'); // Trỏ vào dist/ đã build

  const strapi = await createStrapi({ appDir, distDir }).load();
  
  // Thực thi Document Service API để tạo bản ghi & publish tự động
  await upsertDocument(strapi, 'api::global-setting.global-setting', GLOBAL_SETTING);
  
  await strapi.destroy();
}
```

### 8.2 Lệnh Seeding:
```bash
npm run seed
```
*(Lệnh này tự động chạy `npm run build` trước để cập nhật mã nguồn TypeScript trong `dist/`, sau đó khởi tạo toàn bộ 14 content types và xuất bản `publishedAt` tự động).*

---

## 9. Cấu hình Hạ tầng, Docker & Bảo mật Môi trường (DevOps)

### 9.1 Danh mục Biến Môi trường Backend (`alberttrann-youth-cms/.env`)

```env
# ----- Server -----
HOST=0.0.0.0
PORT=1337
NODE_ENV=development

# ----- Secrets (Tạo ngẫu nhiên bằng openssl rand -base64 16) -----
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=random_salt_1
ADMIN_JWT_SECRET=random_secret_2
JWT_SECRET=random_secret_3
TRANSFER_TOKEN_SALT=random_salt_4
ENCRYPTION_KEY=random_secret_5

# ----- Database (SQLite cho Dev / Postgres cho Production) -----
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
DATABASE_SSL=false

# ----- Cloudinary Media CDN -----
CLOUDINARY_NAME=mutcixn2
CLOUDINARY_KEY=658835419561867
CLOUDINARY_SECRET=your_cloudinary_secret

# ----- Preview Configuration -----
CLIENT_URL=http://localhost:5173
PREVIEW_SECRET=027d0b99313407e38a0396630ab008de2e2865b568163eff3688cc164a7c4bd2

# ----- Email / LarkSuite SMTP (Cấu hình Hot-swappable) -----
SMTP_HOST=smtp.larksuite.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USERNAME=no-reply@youthorgunion.com
SMTP_PASSWORD=your_larksuite_app_password
EMAIL_DEFAULT_FROM="Y.O.U Alliance <no-reply@youthorgunion.com>"
EMAIL_DEFAULT_REPLY_TO=no-reply@youthorgunion.com
STAFF_NOTIFICATION_EMAIL=info@youthorgunion.org
```

---

### 9.2 Triển khai Production bằng Docker

File `Dockerfile` sử dụng kỹ thuật **Multi-stage Build** trên nền Node.js 22 Bookworm Slim nhằm tối ưu dung lượng image và bảo mật:

```bash
# 1. Build image
docker build -t youth-cms:latest .

# 2. Khởi chạy cùng PostgreSQL qua Docker Compose
docker compose up -d
```

---

## 10. Troubleshooting

### 10.1 Các bước Khởi động cho Dev Mới

```bash
# Bước 1: Di chuyển vào thư mục backend
cd alberttrann-youth-cms

# Bước 2: Cài đặt thư viện
npm install

# Bước 3: Tạo file môi trường .env (sử dụng template .env.example)
cp .env.example .env

# Bước 4: Khởi tạo dữ liệu mẫu (Seeding)
npm run seed

# Bước 5: Chạy server ở chế độ phát triển
npm run develop
```
- Truy cập Strapi Admin mặc định: `http://localhost:1337/admin`
- Truy cập Custom Management Portal: `http://localhost:5173/portal`

---

### 10.2 Troubleshooting

| Hiện tượng / Mã lỗi | Nguyên nhân gốc | Cách khắc phục triệt để |
|---|---|---|
| **`TypeError: provider.init is not a function`** | Thiếu package `@strapi/provider-email-nodemailer` trong `node_modules`. | Chạy lệnh `npm install @strapi/provider-email-nodemailer@5.50.0 --save` để cài đúng phiên bản. |
| **`TypeError: Cannot read properties of undefined (reading 'kind')` khi chạy seed** | Trỏ script trực tiếp vào file TypeScript `.ts` thay vì thư mục compiled `dist/`. | Đảm bảo `scripts/seed-all.js` khai báo `distDir: path.resolve(__dirname, '../dist')` và chạy qua `npm run seed`. |
| **`400 Bad Request: Invalid key status / focusSDGs`** | Sai lệch chữ hoa/thường giữa payload gửi lên và định nghĩa trong `schema.json`. | Chuẩn hóa tên trường theo camelCase: `focusSdgs`, `projectFocusSdgs`, `status`. |
| **`401 Unauthorized` trên các API Portal** | Mất đồng bộ bí mật JWT giữa controller cấp token và middleware xác thực. | Đảm bảo `portal-auth/controllers/portal-auth.ts` sử dụng Master Token do hàm `ensurePortalMasterToken()` khởi tạo tại `bootstrap`. |
| **Ảnh tải lên không hiển thị khi build production** | Chưa khai báo domain Cloudinary trong Content Security Policy (CSP). | Kiểm tra file `config/middlewares.ts`, đảm bảo directive `img-src` và `media-src` có `res.cloudinary.com`. |

---

### QUY TẮC

1. **Không can thiệp trực tiếp vào database production bằng câu lệnh SQL thô**: Luôn luôn sử dụng **Document Service API** (`strapi.documents('uid')`) để đảm bảo các tính năng Draft & Publish, Lifecycle Hooks và Versioning hoạt động chính xác.
2. **Luôn chạy `npm run build` trước khi commit**: Đảm bảo toàn bộ mã nguồn TypeScript, Custom Fields và Admin Extensions biên dịch không có lỗi type (`dist/` build thành công).
3. **Bảo toàn tính Non-blocking của Lifecycles**: Mọi thao tác gửi mail hoặc gọi webhook bên ngoài trong `lifecycles.ts` bắt buộc phải được bọc trong `setImmediate()` hoặc unawaited `Promise.resolve().then(...)` kèm `try...catch`.