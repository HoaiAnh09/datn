Clothing Rental Shop Management System

He thong quan ly cua hang cho thue trang phuc, ho tro quan ly san pham, don thue, yeu cau dat thue, thanh toan dat coc, tra do, hoan coc va thong ke kinh doanh.

Technology Stack

Frontend
- Next.js
- Tailwind CSS
- shadcn/ui
- React Hook Form
- TanStack Query

Backend
- NestJS
- TypeORM
- PostgreSQL

Authentication
- JWT Authentication
- HttpOnly Cookie

Storage
- Cloudinary

PDF
- Puppeteer

Core Business Model

1. Users & Roles

He thong chi co 2 role:
- `OWNER`: chu cua hang, van hanh toan bo he thong
- `CUSTOMER`: khach hang tu dang ky tai khoan de gui yeu cau dat thue

Thong tin user
- `username`
- `password`
- `fullName`
- `phoneNumber`
- `address`
- `role`

Nguyen tac
- `OWNER` quan ly san pham, danh muc, cau hinh shop, don thue, yeu cau dat thue
- `CUSTOMER` chi duoc xem va cap nhat thong tin cua chinh minh, gui yeu cau dat thue, xem yeu cau va don cua minh
- Khach vang lai khong bat buoc co tai khoan

2. Product & Inventory Management

He thong quan ly san pham theo so luong, khong quan ly theo tung item instance.

Thong tin san pham
- Ten san pham
- Mo ta
- Gia thue/ngay
- Tien dat coc
- Phi hu hong chuan
- Tong so luong ton
- So luong dang hu
- So luong kha dung
- Anh san pham
- Danh muc

Y nghia ton kho
- `stockQuantity`: tong so luong vat ly cua shop
- `damagedQuantity`: so luong dang hu hoac chua san sang cho thue
- `availableQuantity`: so luong co the cho thue trong mot khoang ngay cu the

Cong thuc kha dung
- `availableQuantity = stockQuantity - damagedQuantity - reservedInOverlap`

Trong do:
- `reservedInOverlap` la tong so luong nam trong cac don `PENDING` hoac `RENTING` co khoang ngay giao nhau

Nguyen tac
- Yeu cau dat thue cua khach `SUBMITTED` khong giu hang
- Chi `orders` o trang thai `PENDING` va `RENTING` moi giu hang

3. Rental Request Management

Khach hang co tai khoan co the gui yeu cau dat thue tren website.

Muc tieu
- Ho tro self-service cho khach
- Khong giu hang ao truoc khi owner duyet
- Giu luong van hanh don thue tai quay don gian

Thong tin yeu cau dat thue
- Nguoi gui yeu cau (`userId`)
- Ngay thue
- Ngay tra
- Danh sach san pham va so luong
- Ghi chu
- Trang thai
- Ghi chu duyet/tu choi
- Don duoc tao sau khi duyet, neu co

Trang thai yeu cau
- `SUBMITTED`: khach vua gui, chua duyet, chua giu hang
- `APPROVED`: owner da duyet va da tao `order PENDING`
- `REJECTED`: owner tu choi
- `CANCELLED`: khach tu huy truoc khi duyet

Nguyen tac
- Owner duyet yeu cau tai thoi diem xu ly
- Khi owner duyet, he thong phai kiem tra ton thuc te theo khoang ngay
- Neu du ton, he thong tao `order` that va chuyen request sang `APPROVED`
- Neu khong du ton, owner tu choi request

4. Rental Order Management

`Order` la giao dich van hanh thuc te cua cua hang.

Nguon tao don
- `OWNER_DIRECT`: owner tao truc tiep tai quay cho khach vang lai hoac khach co san
- `CUSTOMER_REQUEST`: don sinh ra tu request duoc duyet

Thong tin don
- `renterUserId`: lien ket den user neu co, co the null voi khach vang lai
- `renterFullName`
- `renterPhoneNumber`
- `renterAddress`
- `requestId`: nullable, neu don tao tu request
- `source`
- `rentalStartDate`
- `rentalEndDate`
- `items`
- `rentalPrice`
- `depositAmount`
- `penaltyAmount`
- `refundAmount`
- `paymentStatus`
- `status`
- `pickupDeadlineAt`: thoi han den lay do cho don duoc duyet tu request
- `note`

Order snapshot
- Thong tin nguoi thue duoc luu truc tiep tren `orders`
- Khong phu thuoc vao viec user co sua profile sau nay hay khong
- Du lieu in hoa don va lich su don luon dung theo thoi diem tao don

Trang thai don
- `PENDING`: da tao don that, da giu hang, chua xac nhan thanh toan/dat coc
- `RENTING`: da xac nhan thanh toan, khach da nhan do
- `RETURNED`: da tra do, da tinh phi phat va hoan coc neu co
- `CANCELLED`: don da huy, khong con giu hang

5. Payment Management

Thanh toan tai quay.

Trang thai thanh toan
- `UNPAID`
- `DEPOSIT_PAID`
- `REFUNDED`

Nguyen tac
- QR chi phuc vu thong tin thanh toan, khong bat buoc la buoc thanh toan online
- Don chi chuyen `PENDING -> RENTING` khi owner xac nhan thanh toan/dat coc
- Bao cao doanh thu khong tinh tien dat coc

6. Return & Deposit Refund Process

Khi tra do, owner ghi nhan theo tung san pham:
- So luong tra binh thuong
- So luong hu hong
- Phi phat khac neu co

Cong thuc
- `penaltyAmount = sum(damagedReturnedQuantity * damageFee) + extraPenaltyAmount`
- `refundAmount = max(0, depositAmount - penaltyAmount)`

Nguyen tac
- Hang hu duoc cong vao `damagedQuantity`
- Hang binh thuong quay lai kha dung
- Tra som khong lam giam tien thue

7. Reports & Statistics

Chi tinh tren `orders`, khong tinh tren `rental_requests`.

Chi so
- Tong doanh thu
- So luong don thue
- Don cho thanh toan
- Don dang cho thue
- Doanh thu theo thang
- Top san pham duoc thue nhieu
- Danh sach san pham ton thap

Nguyen tac doanh thu
- Chi tinh tu don `RETURNED`
- Doanh thu thuc nhan = `rentalPrice + penaltyAmount`
- Khong tinh `depositAmount` vao doanh thu

8. Functional Workflows

8.1. Customer self-service
1. Khach vao trang chu
2. Chon ngay thue, ngay tra
3. Xem san pham kha dung
4. Dang nhap hoac dang ky tai khoan
5. Gui `rental request`
6. Owner duyet hoac tu choi
7. Neu duyet, he thong tao `order PENDING`
8. Khach den quay truoc `pickupDeadlineAt`
9. Owner xac nhan thanh toan va giao do
10. Don chuyen sang `RENTING`

8.2. Walk-in order
1. Khach den cua hang
2. Owner tao don truc tiep
3. Owner nhap snapshot thong tin nguoi thue
4. He thong kiem tra ton theo khoang ngay
5. Don tao o `PENDING`
6. Owner thu tien/dat coc
7. Don chuyen sang `RENTING`

8.3. Return order
1. Khach tra do
2. Owner kiem tra tinh trang do
3. He thong tinh phi phat va tien hoan coc
4. Owner xac nhan hoan tat
5. Don chuyen sang `RETURNED`

9. Project Objectives

He thong giup cua hang:
- Ban va van hanh don cho thue tai quay
- Nhan yeu cau dat thue online tu khach
- Kiem soat ton theo lich thue
- Quan ly thanh toan dat coc va hoan coc
- Bao cao doanh thu thuc te
- Giu lich su giao dich nhat quan bang order snapshot
