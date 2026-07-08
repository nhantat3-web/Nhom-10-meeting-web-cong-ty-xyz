# Hệ thống đặt lịch họp XYZ 

## 1. Tài khoản demo

### Admin
- Email: `admin@xyz.com`
- Mật khẩu: `123456`

### Nhân viên 1
- Email: `nhanvien@xyz.com`
- Mật khẩu: `123456`

### Nhân viên 2
- Email: `tranthib@xyz.com`
- Mật khẩu: `123456`

## 2. Chức năng chung

- Đăng nhập
- Tạo tài khoản nhân viên
- Đăng xuất
- Phân quyền Admin / Nhân viên

## 3. Chức năng Nhân viên

- Tạo cuộc họp mới
- Chọn phòng họp
- Đặt thời gian bắt đầu / kết thúc
- Đặt mật khẩu tham gia
- Kiểm tra trùng lịch phòng họp
- Xem cuộc họp đang diễn ra / sắp diễn ra
- Xin tham gia cuộc họp bằng mật khẩu
- Chủ phòng duyệt hoặc từ chối yêu cầu tham gia

## 4. Chức năng Admin

### Dashboard
- Tổng số cuộc họp
- Số cuộc họp đang diễn ra
- Số cuộc họp sắp diễn ra
- Số yêu cầu chờ duyệt
- Tổng tài khoản
- Tổng phòng họp
- Số cuộc họp đã hoàn thành
- Số cuộc họp đã hủy
- Thống kê phòng họp được sử dụng

### Quản lý cuộc họp
- Xem toàn bộ cuộc họp
- Tìm kiếm cuộc họp
- Lọc theo trạng thái
- Thêm cuộc họp
- Sửa thông tin cuộc họp
- Xem chi tiết cuộc họp
- Xem mật khẩu cuộc họp
- Xem danh sách người tham gia
- Xem yêu cầu tham gia
- Duyệt / từ chối yêu cầu tham gia
- Xóa cuộc họp

### Duyệt yêu cầu tham gia
- Admin xem tất cả yêu cầu chờ duyệt
- Admin đồng ý hoặc từ chối yêu cầu

### Quản lý phòng họp
- Thêm phòng họp
- Sửa phòng họp
- Xóa phòng họp
- Cập nhật sức chứa
- Cập nhật thiết bị
- Cập nhật trạng thái phòng

### Quản lý tài khoản
- Tạo tài khoản mới
- Sửa thông tin tài khoản
- Đổi vai trò Admin / Nhân viên
- Khóa / mở khóa tài khoản
- Xóa tài khoản

## 5. Công nghệ sử dụng

- HTML
- CSS
- JavaScript
- LocalStorage

## 6. Cách chạy

1. Giải nén file.
2. Mở thư mục bằng Visual Studio Code.
3. Mở file `index.html`.
4. Có thể chạy trực tiếp hoặc dùng Live Server.

## 7. Ghi chú

Dữ liệu được lưu bằng LocalStorage nên phù hợp để demo bài tuần 2. Nếu muốn reset dữ liệu, có thể mở Developer Tools của trình duyệt, vào Application > LocalStorage và xóa dữ liệu của trang.
