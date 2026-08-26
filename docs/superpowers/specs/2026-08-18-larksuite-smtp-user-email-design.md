# LarkSuite SMTP và email tài khoản người dùng

## Mục tiêu

- Kết nối Strapi v5 Email feature với LarkSuite SMTP.
- Hỗ trợ email reset password qua Users & Permissions.
- Khi admin tạo user, gửi email mời user đặt mật khẩu lần đầu.
- Giữ secret ngoài source code.

## Cấu hình

`config/plugins.ts` thêm provider `nodemailer`, đọc toàn bộ thông tin SMTP từ environment:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `EMAIL_DEFAULT_FROM`
- `EMAIL_DEFAULT_REPLY_TO`

Không đặt fallback cho các biến trên. SSL dùng port `465` và `SMTP_SECURE=true`; STARTTLS dùng port `587` và `SMTP_SECURE=false`. `.env.example` chỉ ghi placeholder, không ghi secret.

`SMTP_PASSWORD` là IMAP/SMTP password hoặc authorization code do LarkSuite cấp, không phải password ứng dụng được hardcode.

## Reset password

Dùng flow built-in của `@strapi/plugin-users-permissions`:

1. Client gọi `POST /api/auth/forgot-password` với email.
2. Strapi tạo reset token, lưu token tạm thời, gửi email qua Email plugin.
3. Link trong template trỏ về `CLIENT_URL` hoặc URL frontend reset password, kèm token.
4. Frontend gửi token và password mới tới `POST /api/auth/reset-password`.
5. Strapi xóa token sau khi reset thành công.

Cấu hình template, shipper email, response email và reset password URL trong Admin panel theo cơ chế Users & Permissions. Không tự viết controller reset password nếu API built-in đáp ứng yêu cầu.

## Email khi admin tạo user

Khi admin khai báo user mới, hệ thống không gửi password được admin nhập hoặc password sinh tự động qua email. Thay vào đó:

1. Tạo user ở trạng thái chưa có password dùng được hoặc đặt password tạm theo flow được hỗ trợ.
2. Gửi email mời chứa link đặt password lần đầu.
3. User đặt password qua reset flow built-in.
4. Token dùng một lần; không ghi token hoặc password vào log.

Nếu Strapi Admin không có hook/API ổn định để phát hành token mời trong phiên bản hiện tại, giai đoạn đầu dùng thao tác `forgot-password` sau khi tạo user để gửi link reset; chỉ mở rộng plugin khi flow này không đáp ứng được UX.

## Error handling và bảo mật

- Strapi log lỗi provider đủ để vận hành nhưng không log password, token, hoặc SMTP credentials.
- Cấu hình rate limit mặc định của Users & Permissions giữ nguyên.
- Email reset không tiết lộ user có tồn tại hay không qua thông báo client.
- Không thêm IMAP receiver; phạm vi chỉ outbound SMTP.

## Kiểm thử

- Build/typecheck Strapi pass khi chưa có secret thật bằng cách dùng `.env` local trong môi trường kiểm thử.
- Kiểm tra cấu hình provider được load đúng với SSL `465`.
- Kiểm tra STARTTLS bằng `SMTP_PORT=587`, `SMTP_SECURE=false`.
- Dùng Admin Email Settings gửi test email tới mailbox kiểm thử.
- Gọi forgot-password và xác nhận email chứa URL reset.
- Hoàn tất reset password, xác nhận token không dùng lại được.
- Tạo user từ Admin và xác nhận email mời/reset được gửi, không có password plaintext trong email hoặc log.
