# UniCo Clothing Rental

Hệ thống quản lý cửa hàng cho thuê trang phục, gồm website khách hàng và khu vực vận hành cho chủ cửa hàng.

## Kiến trúc

- `fe/`: Next.js App Router, Tailwind CSS, shadcn/ui, TanStack Query, Zustand và React Hook Form.
- `be/`: NestJS, TypeORM, PostgreSQL, JWT trong HttpOnly cookie, Cloudinary và Puppeteer.
- `rules/`: đặc tả nghiệp vụ và quy ước phát triển của dự án.

Hệ thống quản lý sản phẩm theo số lượng, tiếp nhận yêu cầu thuê trực tuyến và chuyển yêu cầu được duyệt thành đơn thực tế. Chỉ đơn `PENDING` hoặc `RENTING` giữ hàng; doanh thu chỉ tính từ đơn `RETURNED`.

## Chạy cục bộ

Yêu cầu Node.js, npm và PostgreSQL.

### Backend

Tạo `be/.env` với các biến cần thiết:

```dotenv
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=clothing_rental
JWT_SECRET=change-me
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
PORT=3001
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Sau đó chạy:

```bash
cd be
npm install
npm run migration:run
npm run seed
npm run start:dev
```

### Frontend

Có thể tạo `fe/.env.local` để đổi API URL; mặc định là `http://localhost:3001/api`.

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

```bash
cd fe
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`, backend tại `http://localhost:3001/api`.

## Kiểm tra chất lượng

```bash
cd be
npm run build
npm test -- --runInBand
npx eslint "{src,test}/**/*.ts"

cd ../fe
npm run build
npm run lint
```
