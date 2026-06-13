Clothing Rental Shop Management System

Hệ thống quản lý cửa hàng cho thuê trang phục, hỗ trợ quản lý sản phẩm, khách hàng, đơn thuê, thanh toán đặt cọc, hoàn cọc và thống kê kinh doanh.

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

Storage
- Cloudinary

PDF
- Puppeteer

Functional Requirements

1. Authentication
- Đăng nhập
- Đăng xuất
- Quản lý thông tin tài khoản

1.1. Shop Management
- Cập nhật tên shop
- Cập nhật hotline
- Cập nhật địa chỉ
- Cập nhật email
- Cập nhật mã số thuế
- Cập nhật thông tin ngân hàng
- Cập nhật footer mặc định cho hóa đơn/biên nhận

2. Customer Management
- Thêm khách hàng
- Cập nhật thông tin khách hàng
- Xóa khách hàng
- Tìm kiếm khách hàng
- Xem lịch sử thuê của khách hàng

Thông tin lưu trữ
- Họ tên
- Số điện thoại
- Địa chỉ
- Ghi chú

3. Product & Inventory Management

Hệ thống quản lý sản phẩm theo số lượng, không quản lý theo từng instance.

Thông tin sản phẩm
- Tên sản phẩm
- Mô tả
- Giá thuê/ngày
- Tiền đặt cọc
- Phí phạt hư hỏng chuẩn
- Tổng số lượng vật lý
- Số lượng đang hư
- Ảnh sản phẩm
- Danh mục

Ý nghĩa các trường tồn kho
- `stockQuantity`: tổng số lượng vật lý mà cửa hàng đang sở hữu
- `damagedQuantity`: số lượng đang hư hoặc chưa sẵn sàng cho thuê
- `availableQuantity`: số lượng có thể cho thuê trong một thời điểm hoặc khoảng ngày cụ thể

Công thức khả dụng
- `availableQuantity = stockQuantity - damagedQuantity - reservedInOverlap`

Trong đó:
- `reservedInOverlap` là tổng số lượng đã nằm trong các đơn `PENDING` hoặc `RENTING` có khoảng ngày giao nhau với khoảng thuê đang xét

Chức năng
- Thêm sản phẩm
- Cập nhật sản phẩm
- Xóa sản phẩm
- Upload ảnh sản phẩm
- Tìm kiếm sản phẩm
- Xem tổng kho, đang hư, khả dụng
- Khôi phục hàng hư

4. Rental Order Management

Quản lý quy trình cho thuê trang phục theo khoảng thời gian thuê.

Tạo đơn thuê
- Chọn khách hàng
- Chọn sản phẩm
- Chọn số lượng
- Chọn ngày thuê
- Chọn ngày trả
- Tính toán tự động
  - Số ngày tính tiền
  - Tiền thuê
  - Tiền đặt cọc
  - Tổng số tiền cần thanh toán

Quy tắc tính tiền thuê
- `rentalPrice` trên sản phẩm được hiểu là giá thuê/ngày
- Số ngày tính tiền = số ngày lịch từ `rentalStartDate` đến `rentalEndDate`, tính cả ngày bắt đầu và ngày kết thúc
- Thuê cùng ngày và trả cùng ngày vẫn tính là `1` ngày
- `tiền thuê dòng = rentalPricePerDay * quantity * chargeableDays`
- `tổng tiền thuê đơn = tổng tiền thuê các dòng`
- `tiền cọc = depositAmount * quantity`, không nhân theo số ngày

Trạng thái đơn
- `PENDING`: đơn đã tạo, đang giữ số lượng cho khoảng ngày thuê nhưng chưa xác nhận thanh toán
- `RENTING`: đã xác nhận thanh toán, đang cho thuê
- `RETURNED`: đã trả đồ, hoàn tất tính phạt và hoàn cọc
- `CANCELLED`: đơn đã hủy, không còn giữ số lượng

Chức năng đơn thuê
- Tạo đơn thuê
- Tìm kiếm và lọc đơn thuê
- Xem chi tiết đơn thuê
- Xác nhận thanh toán
- Trả đồ
- Hủy đơn
- Tải hóa đơn
- Tải biên nhận hoàn cọc

Chi tiết đơn thuê
- Hiển thị khách hàng, trạng thái, thanh toán, tiền thuê, tiền cọc, tiền phạt, hoàn cọc
- Hiển thị toàn bộ sản phẩm trong đơn
- Có link mở nhanh sang màn khách hàng và sản phẩm liên quan

5. Inventory Availability Control

Kiểm soát số lượng sản phẩm khả dụng trong khoảng thời gian thuê.

Chức năng
- Kiểm tra khả dụng trước khi tạo đơn
- Tính số lượng đã được giữ/thuê trong khoảng thời gian giao nhau
- Từ chối đơn nếu vượt quá số lượng khả dụng

Nguyên tắc
- Không trừ trực tiếp `stockQuantity` khi tạo đơn
- Tồn kho cho thuê được xác định theo công thức khả dụng
- Đơn `PENDING` vẫn giữ hàng cho khoảng ngày thuê
- Đơn `RETURNED` và `CANCELLED` không còn giữ số lượng

Mục tiêu
- Đúng nghiệp vụ thuê theo lịch
- Không cho thuê vượt số lượng trong cùng khoảng ngày

6. Payment Management

Mô phỏng thanh toán tại quầy.

Chức năng
- Tạo đơn và hiển thị tổng tiền cần thanh toán
- Sinh mã QR thanh toán
- Xác nhận đã nhận thanh toán
- Tải/in lại hóa đơn khi đơn đã xác nhận thanh toán
- Tải/in lại hóa đơn và biên nhận sau khi khách đã trả đồ

Trạng thái thanh toán
- `UNPAID`
- `DEPOSIT_PAID`
- `REFUNDED`

Thông tin thanh toán
- Tiền thuê
- Tiền đặt cọc
- Thời gian thanh toán

Nguyên tắc hóa đơn
- Hóa đơn và biên nhận dùng thông tin từ màn cấu hình shop
- Hóa đơn không hiển thị QR tra cứu
- QR chỉ dùng cho luồng thanh toán, không phải một phần bắt buộc của hóa đơn in ra

7. Return & Deposit Refund Process

Quản lý quy trình trả đồ theo số lượng.

Khi trả đồ, mỗi sản phẩm được ghi nhận:
- Số lượng trả bình thường
- Số lượng hư hỏng
- Phụ phí khác nếu có

Nguyên tắc xử lý
- Số lượng trả bình thường tự quay lại pool khả dụng
- Số lượng hư không quay lại khả dụng ngay
- Số lượng hư được cộng vào `damagedQuantity`
- Khi đã sửa xong, nhân viên dùng chức năng `Khôi phục hàng hư` ở trang sản phẩm để giảm `damagedQuantity`

Tính phạt
- `damageFee` trên sản phẩm là mức phạt chuẩn tham chiếu
- `penaltyAmount` trên đơn là tổng mức phạt thực tế

Công thức
- `penaltyAmount = sum(damagedReturnedQuantity * damageFee) + extraPenaltyAmount`
- `refundAmount = max(0, depositAmount - penaltyAmount)`

Chức năng
- Xác nhận khách trả đồ
- Ghi nhận số lượng hư theo từng sản phẩm
- Nhập phụ phí khác nếu có
- Tính hoàn cọc
- Hoàn tất đơn hàng
- Hiển thị số tiền cần hoàn cho khách
- Xác nhận đã hoàn cọc

8. Reports & Statistics

Chức năng
- Tổng doanh thu
- Số lượng đơn thuê
- Doanh thu theo tháng
- Top sản phẩm được thuê nhiều
- Danh sách sản phẩm khả dụng thấp

Nguyên tắc thống kê doanh thu
- `Tổng doanh thu` chỉ tính từ các đơn `RETURNED`
- Doanh thu thực nhận = `rentalPrice + penaltyAmount`
- Không tính `depositAmount` vào doanh thu vì tiền cọc chỉ là khoản giữ và có thể hoàn lại
- `Doanh thu theo tháng` được nhóm theo tháng hoàn tất đơn hàng

Business Workflow

Thuê trang phục
1. Chủ shop tạo đơn thuê
2. Chọn khách hàng, sản phẩm, số lượng, ngày thuê, ngày trả
3. Hệ thống kiểm tra `availableQuantity` theo khoảng ngày
4. Hệ thống tính tiền thuê + tiền cọc
5. Sinh QR thanh toán
6. Xác nhận đã thanh toán
7. Có thể tải/in hóa đơn thanh toán kiểu bill cửa hàng
8. Đơn chuyển sang `RENTING`

Trả trang phục
1. Khách trả đồ
2. Chủ shop kiểm tra số lượng trả bình thường và số lượng hư
3. Hệ thống tính tiền phạt theo `damageFee` chuẩn và phụ phí khác
4. Hệ thống tính số tiền hoàn cọc
5. Chủ shop xác nhận đã hoàn cọc
6. Có thể tải lại hóa đơn thuê và in biên nhận hoàn cọc
7. Đơn chuyển sang `RETURNED`

Nguyên tắc trả sớm
- Trả sớm không làm giảm `tiền thuê`
- Lý do: cửa hàng đã giữ hàng cho toàn bộ khoảng ngày thuê đã chốt, nên doanh thu thuê vẫn tính theo lịch đã đặt
- Nếu chủ shop muốn hỗ trợ khách, phần giảm giá hoặc hỗ trợ riêng nên xử lý thủ công ngoài flow chuẩn

Khôi phục hàng hư
1. Nhân viên vào trang sản phẩm
2. Chọn sản phẩm có `damagedQuantity > 0`
3. Nhập số lượng đã sửa xong
4. Hệ thống giảm `damagedQuantity`
5. Số lượng vừa khôi phục quay lại `availableQuantity`

Project Objectives

Hệ thống giúp cửa hàng:
- Quản lý khách hàng
- Quản lý sản phẩm và tồn kho theo số lượng
- Quản lý đơn thuê theo khoảng ngày
- Theo dõi thanh toán đặt cọc
- Hỗ trợ hoàn cọc khi trả đồ
- Tách rõ hàng hư và hàng khả dụng
- Theo dõi doanh thu và hoạt động kinh doanh
