# Hệ thống đặt lịch họp XYZ - Tuần 2

## Chức năng đã bổ sung theo yêu cầu

### 1. Đăng nhập
Hệ thống có màn hình đăng nhập riêng.

Tài khoản demo:

- Admin: `admin@xyz.com` / `123456`
- Nhân viên: `nhanvien@xyz.com` / `123456`
- Nhân viên khác: `tranthib@xyz.com` / `123456`

### 2. Tạo tài khoản
Người dùng có thể tạo tài khoản mới.  
Tài khoản tạo mới mặc định là quyền **Nhân viên**.

### 3. Phân quyền
Hệ thống chia thành 2 quyền:

#### Admin
Admin được:
- Xem toàn bộ cuộc họp.
- Sửa trạng thái cuộc họp.
- Xóa cuộc họp.
- Xem danh sách tài khoản.
- Khóa / mở khóa tài khoản nhân viên.

#### Nhân viên
Nhân viên được:
- Tạo cuộc họp mới.
- Xem các cuộc họp đang diễn ra hoặc sắp diễn ra.
- Gửi yêu cầu tham gia cuộc họp bằng mật khẩu.
- Duyệt yêu cầu tham gia đối với cuộc họp do mình tạo.

### 4. Luồng tham gia cuộc họp
1. Chủ phòng tạo cuộc họp và đặt mật khẩu tham gia.
2. Nhân viên khác chọn "Xin tham gia".
3. Nhân viên nhập mật khẩu cuộc họp.
4. Nếu mật khẩu sai, hệ thống báo lỗi.
5. Nếu mật khẩu đúng, hệ thống gửi yêu cầu chờ duyệt.
6. Chủ phòng vào mục "Duyệt yêu cầu tham gia".
7. Chủ phòng chọn "Đồng ý" hoặc "Từ chối".
8. Nếu được đồng ý, nhân viên mới được tính là đã tham gia cuộc họp.

### 5. Công nghệ sử dụng
- HTML
- CSS
- JavaScript
- LocalStorage

## Cách chạy
1. Giải nén file.
2. Mở thư mục bằng Visual Studio Code.
3. Mở file `index.html`.
4. Có thể dùng Live Server hoặc mở trực tiếp trên trình duyệt.

## File chính
- `index.html`: giao diện
- `style.css`: định dạng giao diện
- `script.js`: xử lý chức năng
- `README.md`: hướng dẫn
