Development Guidelines
General Rules
Luôn sử dụng phiên bản mới nhất của thư viện.
Không tự chỉ định version khi cài đặt package.
Ưu tiên code rõ ràng, dễ bảo trì.
Áp dụng TypeScript strict mode.
Tách biệt rõ ràng giữa business logic, validation và UI.
Không viết logic trực tiếp trong component nếu có thể đưa xuống hook hoặc service.
Tất cả text hiển thị cho người dùng sử dụng tiếng Việt.
Backend Guidelines
Tech Stack
NestJS
TypeORM:
TypeORM Rules

- synchronize luôn bằng false.
- Chỉ thay đổi schema bằng migration.
- Không sử dụng eager relation.
- Hạn chế cascade, không dùng cascade: true.
- Sử dụng BaseEntity chung cho tất cả entity.
- Sử dụng enum cho các trường trạng thái.
- Đánh index cho các cột tìm kiếm thường xuyên.
- Không trả Entity trực tiếp từ API.
- Repository chỉ được sử dụng trong Service.
- Sử dụng QueryBuilder cho thống kê và báo cáo.
- Sử dụng transaction cho các nghiệp vụ cập nhật nhiều bảng.
- Ưu tiên soft delete cho Product và Customer.
PostgreSQL
JWT Authentication
Cookie-based Authentication
Authentication
Yêu cầu
Sử dụng JWT Access Token.
Không sử dụng Refresh Token.
JWT được lưu trong HttpOnly Cookie.
Frontend gửi request bằng credentials.
API
Login
POST /auth/login
Xác thực tài khoản.
Set HttpOnly Cookie chứa Access Token.
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
1
Logout
POST /auth/logout
Xóa Cookie.
Get Current User
GET /auth/me
Trả về thông tin người dùng hiện tại để frontend khởi tạo trạng thái xác thực.
Ví dụ:
{
"id": 1,
"username": "admin",
"role": "OWNER"
}
Authorization
Role-Based Access Control
Sử dụng:
JwtAuthGuard
RolesGuard
@Roles()
Ví dụ:
@Roles(Role.OWNER)
@UseGuards(JwtAuthGuard, RolesGuard)
API Response Format
Tất cả API phải trả về cấu trúc thống nhất.
•
•
•
•
2
Success
{
"success": true,
"message": "Lấy dữ liệu thành công",
"data": {}
}
Error
{
"success": false,
"message": "Không tìm thấy sản phẩm"
}
Nguyên tắc
Message sử dụng tiếng Việt.
Không trả về message tiếng Anh cho người dùng cuối.
Validation
Sử dụng class-validator.
Sử dụng DTO cho toàn bộ request.
Bật ValidationPipe toàn cục.
Folder Structure
src
├── common
│ ├── decorators
│ ├── guards
│ ├── interceptors
│ ├── filters
│ ├── dto
│ ├── constants
│ └── utils
│
├── modules
│ ├── auth
│ ├── customer
•
•
•
•
•
3
│ ├── product
│ ├── order
│ ├── report
│ └── user
│
├── database
│ ├── entities
│ ├── migrations
│ └── seeds
│
└── main.ts
Frontend Guidelines
Tech Stack
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
Zustand
TanStack Query
React Hook Form
Zod
Authentication
Nguyên tắc
Không lưu thông tin người dùng trong:
localStorage
sessionStorage
Sử dụng:
HttpOnly Cookie
GET /auth/me
Flow
App khởi động
•
•
•
•
•
•
•
•
•
•
•
•
4
↓
Gọi /auth/me
↓
Lưu user vào Zustand Store
↓
Render ứng dụng
State Management
Zustand
Chỉ sử dụng cho:
Auth State
UI State
Không dùng Zustand cho server state.
Server State
Sử dụng TanStack Query.
Nguyên tắc
Không fetch trực tiếp trong component.
Luôn theo luồng:
API Layer
↓
TanStack Query
↓
Component
•
•
5
Validation
Sử dụng:
React Hook Form
Zod
Ví dụ:
Schema
↓
Form
↓
Submit
TanStack Query
Bắt buộc
Query Keys riêng
Mutation riêng
Invalidate Query sau mutation
SSR
Ưu tiên:
Prefetch Query
Hydration
trong các trang cần dữ liệu ban đầu.
Routing Guard
Auth Guard
Chỉ cho phép người dùng đã đăng nhập truy cập.
Ví dụ:
•
•
•
•
•
•
•
6
/dashboard
/products
/orders
Guest Guard
Chỉ cho phép người chưa đăng nhập.
Ví dụ:
/login
Frontend Folder Structure
src
├── app
│
├── common
│ ├── api
│ ├── components
│ ├── hooks
│ ├── lib
│ ├── types
│ ├── constants
│ ├── utils
│ └── stores
│
├── features
│ ├── auth
│ │ ├── api
│ │ ├── hooks
│ │ ├── schema
│ │ ├── types
│ │ └── components
│ │
│ ├── customer
│ │ ├── api
│ │ ├── hooks
│ │ ├── schema
7
│ │ ├── types
│ │ └── components
│ │
│ ├── product
│ │ ├── api
│ │ ├── hooks
│ │ ├── schema
│ │ ├── types
│ │ └── components
│ │
│ ├── order
│ │ ├── api
│ │ ├── hooks
│ │ ├── schema
│ │ ├── types
│ │ └── components
│ │
│ └── report
│ ├── api
│ ├── hooks
│ ├── types
│ └── components
│
└── providers
Quy tắc tổ chức mã nguồn
Đưa vào common nếu:
Được sử dụng từ 2 feature trở lên.
Không chứa business logic của riêng feature nào.
Ví dụ:
common/components
common/hooks
common/api
common/utils
common/types
Giữ trong feature nếu:
Chỉ phục vụ cho một nghiệp vụ cụ thể.
•
•
•
8
Liên quan trực tiếp đến business logic của feature đó.
Ví dụ:
```text
features/order/schema
features/order/hooks
features/order/components
features/order/api