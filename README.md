# SHOOTMATCH

ShootMatch là nền tảng kết nối giữa **Khách hàng** và **Nhiếp ảnh gia** theo hướng matching, đặt lịch và trao đổi dịch vụ chụp ảnh. Dự án được xây theo hướng Clean Architecture, tách rõ phần Domain, Application, Infrastructure và API/Mobile.

## Mục tiêu dự án
- Giúp khách hàng tìm nhiếp ảnh gia phù hợp nhanh hơn.
- Hỗ trợ đặt lịch, quản lý gói dịch vụ, theo dõi booking và chat thời gian thực.
- Chuẩn hóa luồng xác thực đa phương thức cho cả khách hàng và nhiếp ảnh gia.
- Mở đường cho AI matching dựa trên hình ảnh và portfolio.

## Tính năng chính hiện có
- Đăng nhập đa phương thức: email/mật khẩu, Google OAuth, OTP điện thoại.
- Matching bằng swipe để tìm nhiếp ảnh gia phù hợp.
- Quản lý hồ sơ nhiếp ảnh gia, portfolio, dịch vụ và giá.
- Đặt lịch, theo dõi booking, xác nhận và hoàn tất dịch vụ.
- Chat thời gian thực qua SignalR.
- Đánh giá và phản hồi sau dịch vụ.

## Cấu trúc dự án
- `ShootMatch.Domain`: thực thể, value object, logic cốt lõi.
- `ShootMatch.Application`: use case, service, interface, query handler.
- `ShootMatch.Infrastructure`: truy cập dữ liệu, repository, storage, auth, tích hợp ngoài.
- `ShootMatch.Api`: REST API, GraphQL, SignalR, Swagger.
- `ShootMatch.Mobile`: ứng dụng di động React Native/Expo cho khách hàng và nhiếp ảnh gia.

## Cách chạy nhanh
### API
```bash
dotnet build ShootMatch.sln
dotnet run --project ShootMatch.Api/ShootMatch.Api.csproj
```

### Mobile
```bash
cd ShootMatch.Mobile
npm install
npm start
```

## Tài liệu trong Vault_ShootMatch
Các ghi chú và tài liệu chi tiết được lưu trong thư mục `Vault_ShootMatch`.

### Tổng quan và kiến trúc
- [Tổng quan dự án](Vault_ShootMatch/manual/01_Project_Overview.md)
- [Hướng dẫn kỹ thuật cho developer](Vault_ShootMatch/manual/02_Developer_Technical_Guide.md)
- [Kiến trúc hệ thống xác thực](Vault_ShootMatch/manual/03_Authentication_System_Architecture.md)
- [Kiến trúc ứng dụng di động](Vault_ShootMatch/manual/04_Mobile_App_Architecture.md)
- [Hướng dẫn người dùng cuối](Vault_ShootMatch/manual/05_End_User_Guides.md)
- [Tài liệu tính năng và API đầy đủ](Vault_ShootMatch/manual/06_Full_API_and_Feature_Reference.md)
- [Hướng dẫn chức năng chi tiết](Vault_ShootMatch/manual/Detailed_Feature_Guide.md)
- [Kiến trúc API và endpoints](Vault_ShootMatch/manual/API_Architecture_and_Endpoints.md)
- [Vai trò và phân quyền](Vault_ShootMatch/manual/Roles_and_Permissions.md)
- [Tài liệu tham chiếu DB](Vault_ShootMatch/manual/Technical_Database_Reference.md)

### Ghi chú tiến trình
- [Implementation log](Vault_ShootMatch/[SHOOTMATCH]_implementation-log.md)
- [Bug log](Vault_ShootMatch/[SHOOTMATCH]_bug-log.md)
- [UI progress](Vault_ShootMatch/[SHOOTMATCH]_UI-progress.md)
- [Codebase map](Vault_ShootMatch/[SHOOTMATCH]_codebase-map.md)
- [Backlog](Vault_ShootMatch/[SHOOTMATCH]_backlog.md)
- [Context](Vault_ShootMatch/[SHOOTMATCH]_context.md)
- [Kiến trúc tổng thể](Vault_ShootMatch/[SHOOTMATCH]_architecture.md)
- [API reference](Vault_ShootMatch/[SHOOTMATCH]_API-reference.md)
- [Migration đa auth và DB](Vault_ShootMatch/[SHOOTMATCH]_multi-auth-db-migration.md)

## Trạng thái hiện tại
- Phần mobile đã có các màn hình chính cho khách hàng và nhiếp ảnh gia.
- Backend đang dùng REST cho command và GraphQL cho query.
- Swagger đã được bật để kiểm tra API dễ hơn trong môi trường phát triển.

## Ghi chú phát triển
- Một số dữ liệu mock vẫn đang dùng để demo giao diện.
- Nên đồng bộ lại các luồng update profile để tránh ghi đè dữ liệu nhạy cảm.
- Khi thêm file sinh tự động, hãy cập nhật `.gitignore` phù hợp.
