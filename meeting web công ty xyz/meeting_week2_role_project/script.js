// =====================================================
// HỆ THỐNG ĐẶT LỊCH HỌP XYZ
// Tuần 2 - Có đăng nhập, đăng ký, phân quyền Admin/Nhân viên
// Lưu dữ liệu bằng LocalStorage để dễ chạy demo
// =====================================================

const USER_KEY = "xyz_users_v2";
const MEETING_KEY = "xyz_meetings_v2";
const CURRENT_USER_KEY = "xyz_current_user_v2";

let currentUser = null;

// -------------------- KHỞI TẠO --------------------
initDemoData();
loadCurrentUser();
bindEvents();

if (currentUser) {
  showApp();
} else {
  showAuth();
}

// -------------------- BẮT SỰ KIỆN --------------------
function bindEvents() {
  // Auth tabs
  document.getElementById("showLoginBtn").addEventListener("click", () => switchAuthTab("login"));
  document.getElementById("showRegisterBtn").addEventListener("click", () => switchAuthTab("register"));

  // Auth forms
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("registerForm").addEventListener("submit", handleRegister);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  // Employee
  document.getElementById("createMeetingForm").addEventListener("submit", handleCreateMeeting);
  document.getElementById("resetMeetingBtn").addEventListener("click", () => {
    document.getElementById("createMeetingForm").reset();
  });

  document.getElementById("employeeSearchInput").addEventListener("input", renderEmployeeMeetings);
  document.getElementById("employeeReloadBtn").addEventListener("click", renderEmployeeMeetings);

  // Join request
  document.getElementById("joinForm").addEventListener("submit", handleJoinRequest);
  document.getElementById("closeJoinModalBtn").addEventListener("click", closeJoinModal);

  // Admin
  document.getElementById("adminSearchInput").addEventListener("input", renderAdminMeetings);
  document.getElementById("adminStatusFilter").addEventListener("change", renderAdminMeetings);
  document.getElementById("adminReloadBtn").addEventListener("click", renderAdminMeetings);
  document.getElementById("resetDataBtn").addEventListener("click", resetDemoData);

  document.getElementById("adminEditForm").addEventListener("submit", handleAdminEditStatus);
  document.getElementById("closeAdminEditModalBtn").addEventListener("click", closeAdminEditModal);
}

// =====================================================
// ĐĂNG NHẬP / ĐĂNG KÝ
// =====================================================
function switchAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showLoginBtn = document.getElementById("showLoginBtn");
  const showRegisterBtn = document.getElementById("showRegisterBtn");

  hideAuthMessage();

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    showLoginBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    showLoginBtn.classList.remove("active");
    showRegisterBtn.classList.add("active");
  }
}

function handleLogin(event) {
  event.preventDefault();

  const email = getValue("loginEmail").toLowerCase();
  const password = getValue("loginPassword");

  if (!email || !password) {
    showAuthMessage("Vui lòng nhập email và mật khẩu.", "error");
    return;
  }

  const users = getUsers();
  const user = users.find(item => item.email === email && item.password === password);

  if (!user) {
    showAuthMessage("Email hoặc mật khẩu không đúng.", "error");
    return;
  }

  if (user.status === "locked") {
    showAuthMessage("Tài khoản đã bị khóa. Vui lòng liên hệ admin.", "error");
    return;
  }

  currentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  showApp();
}

function handleRegister(event) {
  event.preventDefault();

  const name = getValue("registerName");
  const email = getValue("registerEmail").toLowerCase();
  const password = getValue("registerPassword");

  if (!name || !email || !password) {
    showAuthMessage("Vui lòng nhập đầy đủ thông tin.", "error");
    return;
  }

  if (password.length < 6) {
    showAuthMessage("Mật khẩu phải có ít nhất 6 ký tự.", "error");
    return;
  }

  const users = getUsers();

  if (users.some(user => user.email === email)) {
    showAuthMessage("Email này đã được đăng ký.", "error");
    return;
  }

  users.push({
    id: "U" + Date.now(),
    name,
    email,
    password,
    role: "employee",
    status: "active"
  });

  saveUsers(users);
  document.getElementById("registerForm").reset();
  showAuthMessage("Tạo tài khoản thành công. Bạn có thể đăng nhập.", "success");
  switchAuthTab("login");
}

function handleLogout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  currentUser = null;
  showAuth();
}

function loadCurrentUser() {
  currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
}

function showAuth() {
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("appScreen").classList.add("hidden");
}

function showApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");

  document.getElementById("currentUserText").textContent = `${currentUser.name} (${currentUser.email})`;
  document.getElementById("roleText").textContent =
    currentUser.role === "admin" ? "Vai trò: Administrator" : "Vai trò: Nhân viên";

  buildMenu();
}

// =====================================================
// PHÂN QUYỀN MENU
// =====================================================
function buildMenu() {
  const menu = document.getElementById("mainMenu");
  menu.innerHTML = "";

  const pages = [];

  if (currentUser.role === "admin") {
    pages.push(
      { id: "adminMeetingsPage", label: "Quản lý cuộc họp" },
      { id: "adminUsersPage", label: "Quản lý tài khoản" }
    );
  } else {
    pages.push(
      { id: "createMeetingPage", label: "Tạo cuộc họp" },
      { id: "employeeMeetingsPage", label: "Cuộc họp đang diễn ra" },
      { id: "hostRequestsPage", label: "Duyệt yêu cầu tham gia" }
    );
  }

  pages.forEach((page, index) => {
    const button = document.createElement("button");
    button.textContent = page.label;
    button.dataset.page = page.id;

    if (index === 0) button.classList.add("active");

    button.addEventListener("click", () => {
      document.querySelectorAll("#mainMenu button").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      showPage(page.id);
    });

    menu.appendChild(button);
  });

  showPage(pages[0].id);
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");

  updateMeetingStatuses();

  if (pageId === "employeeMeetingsPage") renderEmployeeMeetings();
  if (pageId === "hostRequestsPage") renderHostRequests();
  if (pageId === "adminMeetingsPage") renderAdminMeetings();
  if (pageId === "adminUsersPage") renderAdminUsers();
}

// =====================================================
// NHÂN VIÊN - TẠO CUỘC HỌP
// =====================================================
function handleCreateMeeting(event) {
  event.preventDefault();

  const meeting = {
    id: "M" + Date.now(),
    title: getValue("meetingTitle"),
    room: getValue("meetingRoom"),
    startTime: getValue("meetingStart"),
    endTime: getValue("meetingEnd"),
    pass: getValue("meetingPass"),
    capacity: Number(getValue("meetingCapacity")) || 10,
    description: getValue("meetingDescription"),
    creatorId: currentUser.id,
    creatorName: currentUser.name,
    creatorEmail: currentUser.email,
    participants: [],
    joinRequests: [],
    status: "Sắp diễn ra",
    createdAt: new Date().toISOString()
  };

  const error = validateMeeting(meeting);
  if (error) {
    showAppMessage(error, "error");
    return;
  }

  if (isRoomConflict(meeting)) {
    showAppMessage("Phòng họp đã bị trùng lịch. Vui lòng chọn thời gian hoặc phòng khác.", "error");
    return;
  }

  const meetings = getMeetings();
  meetings.push(meeting);
  saveMeetings(meetings);

  document.getElementById("createMeetingForm").reset();
  showAppMessage("Tạo cuộc họp thành công.", "success");
}

// =====================================================
// NHÂN VIÊN - XEM CUỘC HỌP VÀ GỬI YÊU CẦU THAM GIA
// =====================================================
function renderEmployeeMeetings() {
  updateMeetingStatuses();

  const keyword = getValue("employeeSearchInput").toLowerCase();
  let meetings = getMeetings().filter(meeting =>
    meeting.status === "Sắp diễn ra" || meeting.status === "Đang diễn ra"
  );

  if (keyword) {
    meetings = meetings.filter(meeting =>
      meeting.title.toLowerCase().includes(keyword) ||
      meeting.room.toLowerCase().includes(keyword)
    );
  }

  const list = document.getElementById("employeeMeetingList");

  if (meetings.length === 0) {
    list.innerHTML = `<p>Không có cuộc họp đang diễn ra hoặc sắp diễn ra.</p>`;
    return;
  }

  list.innerHTML = meetings.map(meeting => {
    const joinStatus = getMyJoinStatus(meeting);
    const isOwner = meeting.creatorId === currentUser.id;
    const approved = joinStatus === "approved";

    let buttonHtml = "";

    if (isOwner) {
      buttonHtml = `<button class="btn secondary" disabled>Bạn là chủ phòng</button>`;
    } else if (approved) {
      buttonHtml = `<button class="btn success" disabled>Đã được duyệt tham gia</button>`;
    } else if (joinStatus === "pending") {
      buttonHtml = `<button class="btn warning" disabled>Đang chờ chủ phòng duyệt</button>`;
    } else if (joinStatus === "rejected") {
      buttonHtml = `<button class="btn danger" disabled>Yêu cầu bị từ chối</button>`;
    } else {
      buttonHtml = `<button class="btn primary" onclick="openJoinModal('${meeting.id}')">Xin tham gia</button>`;
    }

    return `
      <div class="meeting-card">
        <h3>${escapeHtml(meeting.title)}</h3>
        <div class="meeting-info">
          <p><b>Phòng:</b> ${escapeHtml(meeting.room)}</p>
          <p><b>Trạng thái:</b> ${renderStatus(meeting.status)}</p>
          <p><b>Bắt đầu:</b> ${formatDateTime(meeting.startTime)}</p>
          <p><b>Kết thúc:</b> ${formatDateTime(meeting.endTime)}</p>
          <p><b>Chủ phòng:</b> ${escapeHtml(meeting.creatorName)}</p>
          <p><b>Số người đã duyệt:</b> ${meeting.participants.length}/${meeting.capacity}</p>
        </div>
        <p><b>Nội dung:</b> ${escapeHtml(meeting.description || "Không có nội dung")}</p>
        <div class="actions">${buttonHtml}</div>
      </div>
    `;
  }).join("");
}

function openJoinModal(meetingId) {
  const meeting = getMeetings().find(item => item.id === meetingId);
  if (!meeting) return;

  document.getElementById("joinMeetingId").value = meeting.id;
  document.getElementById("joinMeetingTitle").textContent = `Cuộc họp: ${meeting.title}`;
  document.getElementById("joinPasswordInput").value = "";
  document.getElementById("joinModal").classList.remove("hidden");
}

function closeJoinModal() {
  document.getElementById("joinModal").classList.add("hidden");
}

function handleJoinRequest(event) {
  event.preventDefault();

  const meetingId = getValue("joinMeetingId");
  const password = getValue("joinPasswordInput");

  const meetings = getMeetings();
  const meetingIndex = meetings.findIndex(item => item.id === meetingId);

  if (meetingIndex === -1) {
    showAppMessage("Không tìm thấy cuộc họp.", "error");
    return;
  }

  const meeting = meetings[meetingIndex];

  if (meeting.pass !== password) {
    showAppMessage("Mật khẩu tham gia không đúng.", "error");
    return;
  }

  if (meeting.participants.some(item => item.userId === currentUser.id)) {
    showAppMessage("Bạn đã được duyệt tham gia cuộc họp này.", "success");
    closeJoinModal();
    return;
  }

  const existedRequest = meeting.joinRequests.find(item => item.userId === currentUser.id);
  if (existedRequest && existedRequest.status === "pending") {
    showAppMessage("Bạn đã gửi yêu cầu. Vui lòng chờ chủ phòng duyệt.", "error");
    closeJoinModal();
    return;
  }

  if (meeting.participants.length >= meeting.capacity) {
    showAppMessage("Cuộc họp đã đủ số lượng người tham gia.", "error");
    return;
  }

  // Nếu từng bị từ chối, cho phép gửi lại yêu cầu mới
  meeting.joinRequests = meeting.joinRequests.filter(item => item.userId !== currentUser.id);

  meeting.joinRequests.push({
    requestId: "R" + Date.now(),
    userId: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    status: "pending",
    requestedAt: new Date().toISOString()
  });

  meetings[meetingIndex] = meeting;
  saveMeetings(meetings);

  closeJoinModal();
  renderEmployeeMeetings();
  showAppMessage("Mật khẩu đúng. Yêu cầu tham gia đã được gửi và đang chờ chủ phòng đồng ý.", "success");
}

function getMyJoinStatus(meeting) {
  if (meeting.participants.some(item => item.userId === currentUser.id)) return "approved";

  const request = meeting.joinRequests.find(item => item.userId === currentUser.id);
  return request ? request.status : "";
}

// =====================================================
// CHỦ PHÒNG - DUYỆT YÊU CẦU THAM GIA
// =====================================================
function renderHostRequests() {
  const meetings = getMeetings().filter(meeting => meeting.creatorId === currentUser.id);
  const list = document.getElementById("hostRequestList");

  const requestBlocks = [];

  meetings.forEach(meeting => {
    const pendingRequests = meeting.joinRequests.filter(request => request.status === "pending");

    pendingRequests.forEach(request => {
      requestBlocks.push(`
        <div class="meeting-card">
          <h3>${escapeHtml(meeting.title)}</h3>
          <div class="meeting-info">
            <p><b>Phòng:</b> ${escapeHtml(meeting.room)}</p>
            <p><b>Thời gian:</b> ${formatDateTime(meeting.startTime)} - ${formatDateTime(meeting.endTime)}</p>
            <p><b>Người xin tham gia:</b> ${escapeHtml(request.name)}</p>
            <p><b>Email:</b> ${escapeHtml(request.email)}</p>
          </div>
          <div class="row-actions">
            <button class="btn success" onclick="approveJoinRequest('${meeting.id}', '${request.requestId}')">Đồng ý</button>
            <button class="btn danger" onclick="rejectJoinRequest('${meeting.id}', '${request.requestId}')">Từ chối</button>
          </div>
        </div>
      `);
    });
  });

  list.innerHTML = requestBlocks.length > 0
    ? requestBlocks.join("")
    : `<p>Hiện chưa có yêu cầu tham gia nào cần duyệt.</p>`;
}

function approveJoinRequest(meetingId, requestId) {
  const meetings = getMeetings();
  const meeting = meetings.find(item => item.id === meetingId);
  if (!meeting) return;

  const request = meeting.joinRequests.find(item => item.requestId === requestId);
  if (!request) return;

  if (meeting.participants.length >= meeting.capacity) {
    showAppMessage("Cuộc họp đã đủ số lượng người tham gia.", "error");
    return;
  }

  request.status = "approved";

  meeting.participants.push({
    userId: request.userId,
    name: request.name,
    email: request.email,
    approvedAt: new Date().toISOString()
  });

  saveMeetings(meetings);
  renderHostRequests();
  showAppMessage("Đã đồng ý cho nhân viên tham gia cuộc họp.", "success");
}

function rejectJoinRequest(meetingId, requestId) {
  const meetings = getMeetings();
  const meeting = meetings.find(item => item.id === meetingId);
  if (!meeting) return;

  const request = meeting.joinRequests.find(item => item.requestId === requestId);
  if (!request) return;

  request.status = "rejected";

  saveMeetings(meetings);
  renderHostRequests();
  showAppMessage("Đã từ chối yêu cầu tham gia.", "success");
}

// =====================================================
// ADMIN - QUẢN LÝ CUỘC HỌP
// =====================================================
function renderAdminMeetings() {
  updateMeetingStatuses();

  const keyword = getValue("adminSearchInput").toLowerCase();
  const statusFilter = getValue("adminStatusFilter");

  let meetings = getMeetings();

  if (keyword) {
    meetings = meetings.filter(meeting =>
      meeting.title.toLowerCase().includes(keyword) ||
      meeting.room.toLowerCase().includes(keyword) ||
      meeting.creatorEmail.toLowerCase().includes(keyword)
    );
  }

  if (statusFilter) {
    meetings = meetings.filter(meeting => meeting.status === statusFilter);
  }

  const body = document.getElementById("adminMeetingTableBody");

  if (meetings.length === 0) {
    body.innerHTML = `<tr><td colspan="8" style="text-align:center;">Không có cuộc họp nào.</td></tr>`;
    return;
  }

  body.innerHTML = meetings.map((meeting, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <b>${escapeHtml(meeting.title)}</b><br>
        <small>Pass: ${escapeHtml(meeting.pass)}</small>
      </td>
      <td>${escapeHtml(meeting.room)}</td>
      <td>${formatDateTime(meeting.startTime)}<br>đến<br>${formatDateTime(meeting.endTime)}</td>
      <td>${escapeHtml(meeting.creatorName)}<br><small>${escapeHtml(meeting.creatorEmail)}</small></td>
      <td>
        ${meeting.participants.length}/${meeting.capacity}
        <br>
        <small>${meeting.participants.map(p => escapeHtml(p.name)).join(", ") || "Chưa có"}</small>
      </td>
      <td>${renderStatus(meeting.status)}</td>
      <td>
        <div class="row-actions">
          <button class="btn secondary" onclick="openAdminEditModal('${meeting.id}')">Sửa trạng thái</button>
          <button class="btn danger" onclick="adminDeleteMeeting('${meeting.id}')">Xóa</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openAdminEditModal(meetingId) {
  const meeting = getMeetings().find(item => item.id === meetingId);
  if (!meeting) return;

  document.getElementById("adminEditMeetingId").value = meeting.id;
  document.getElementById("adminEditStatus").value = meeting.status;
  document.getElementById("adminEditModal").classList.remove("hidden");
}

function closeAdminEditModal() {
  document.getElementById("adminEditModal").classList.add("hidden");
}

function handleAdminEditStatus(event) {
  event.preventDefault();

  const meetingId = getValue("adminEditMeetingId");
  const status = getValue("adminEditStatus");

  const meetings = getMeetings();
  const meeting = meetings.find(item => item.id === meetingId);

  if (!meeting) {
    showAppMessage("Không tìm thấy cuộc họp.", "error");
    return;
  }

  meeting.status = status;
  saveMeetings(meetings);

  closeAdminEditModal();
  renderAdminMeetings();
  showAppMessage("Admin đã cập nhật trạng thái cuộc họp.", "success");
}

function adminDeleteMeeting(meetingId) {
  const confirmDelete = confirm("Admin có chắc muốn xóa cuộc họp này không?");
  if (!confirmDelete) return;

  const meetings = getMeetings().filter(item => item.id !== meetingId);
  saveMeetings(meetings);

  renderAdminMeetings();
  showAppMessage("Admin đã xóa cuộc họp.", "success");
}

// =====================================================
// ADMIN - QUẢN LÝ TÀI KHOẢN
// =====================================================
function renderAdminUsers() {
  const users = getUsers();
  const body = document.getElementById("adminUserTableBody");

  body.innerHTML = users.map((user, index) => {
    const isAdmin = user.role === "admin";
    const roleBadge = isAdmin
      ? `<span class="badge admin">Admin</span>`
      : `<span class="badge employee">Nhân viên</span>`;

    const statusText = user.status === "active" ? "Đang hoạt động" : "Đã khóa";

    let action = "";
    if (isAdmin) {
      action = `<button class="btn secondary" disabled>Không thao tác</button>`;
    } else if (user.status === "active") {
      action = `<button class="btn danger" onclick="toggleUserStatus('${user.id}')">Khóa</button>`;
    } else {
      action = `<button class="btn success" onclick="toggleUserStatus('${user.id}')">Mở khóa</button>`;
    }

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${roleBadge}</td>
        <td>${statusText}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join("");
}

function toggleUserStatus(userId) {
  const users = getUsers();
  const user = users.find(item => item.id === userId);

  if (!user || user.role === "admin") return;

  user.status = user.status === "active" ? "locked" : "active";
  saveUsers(users);

  renderAdminUsers();
  showAppMessage("Đã cập nhật trạng thái tài khoản.", "success");
}

// =====================================================
// KIỂM TRA DỮ LIỆU CUỘC HỌP
// =====================================================
function validateMeeting(meeting) {
  if (!meeting.title) return "Vui lòng nhập tiêu đề cuộc họp.";
  if (!meeting.room) return "Vui lòng chọn phòng họp.";
  if (!meeting.startTime) return "Vui lòng chọn thời gian bắt đầu.";
  if (!meeting.endTime) return "Vui lòng chọn thời gian kết thúc.";
  if (!meeting.pass) return "Vui lòng nhập mật khẩu tham gia cuộc họp.";

  const now = new Date();
  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);

  if (start < now) return "Thời gian bắt đầu không được nhỏ hơn thời gian hiện tại.";
  if (end <= start) return "Thời gian kết thúc phải lớn hơn thời gian bắt đầu.";

  if (meeting.capacity <= 0) return "Số lượng tối đa phải lớn hơn 0.";

  return "";
}

// 2 lịch bị trùng nếu cùng phòng và khoảng thời gian giao nhau
function isRoomConflict(newMeeting) {
  const meetings = getMeetings();

  const newStart = new Date(newMeeting.startTime);
  const newEnd = new Date(newMeeting.endTime);

  return meetings.some(meeting => {
    if (meeting.status === "Đã hủy") return false;
    if (meeting.room !== newMeeting.room) return false;

    const oldStart = new Date(meeting.startTime);
    const oldEnd = new Date(meeting.endTime);

    return newStart < oldEnd && newEnd > oldStart;
  });
}

function updateMeetingStatuses() {
  const meetings = getMeetings();
  const now = new Date();

  const updated = meetings.map(meeting => {
    if (meeting.status === "Đã hủy") return meeting;

    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (now >= start && now <= end) {
      return { ...meeting, status: "Đang diễn ra" };
    }

    if (now > end) {
      return { ...meeting, status: "Đã hoàn thành" };
    }

    return { ...meeting, status: "Sắp diễn ra" };
  });

  saveMeetings(updated);
}

// =====================================================
// LOCALSTORAGE
// =====================================================
function getUsers() {
  return JSON.parse(localStorage.getItem(USER_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

function getMeetings() {
  return JSON.parse(localStorage.getItem(MEETING_KEY)) || [];
}

function saveMeetings(meetings) {
  localStorage.setItem(MEETING_KEY, JSON.stringify(meetings));
}

function initDemoData() {
  if (!localStorage.getItem(USER_KEY)) {
    const users = [
      {
        id: "U-admin",
        name: "Administrator",
        email: "admin@xyz.com",
        password: "123456",
        role: "admin",
        status: "active"
      },
      {
        id: "U-employee-1",
        name: "Nguyễn Văn A",
        email: "nhanvien@xyz.com",
        password: "123456",
        role: "employee",
        status: "active"
      },
      {
        id: "U-employee-2",
        name: "Trần Thị B",
        email: "tranthib@xyz.com",
        password: "123456",
        role: "employee",
        status: "active"
      }
    ];

    saveUsers(users);
  }

  if (!localStorage.getItem(MEETING_KEY)) {
    const now = new Date();

    const start1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    start1.setHours(9, 0, 0, 0);

    const end1 = new Date(start1);
    end1.setHours(10, 0, 0, 0);

    const start2 = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    start2.setHours(14, 0, 0, 0);

    const end2 = new Date(start2);
    end2.setHours(15, 0, 0, 0);

    const meetings = [
      {
        id: "M-demo-1",
        title: "Họp Sprint Planning",
        room: "Phòng họp A",
        startTime: toDateTimeLocal(start1),
        endTime: toDateTimeLocal(end1),
        pass: "1234",
        capacity: 10,
        description: "Lập kế hoạch công việc cho Sprint mới.",
        creatorId: "U-employee-1",
        creatorName: "Nguyễn Văn A",
        creatorEmail: "nhanvien@xyz.com",
        participants: [],
        joinRequests: [],
        status: "Sắp diễn ra",
        createdAt: new Date().toISOString()
      },
      {
        id: "M-demo-2",
        title: "Họp đánh giá tiến độ",
        room: "Phòng họp B",
        startTime: toDateTimeLocal(start2),
        endTime: toDateTimeLocal(end2),
        pass: "abcd",
        capacity: 8,
        description: "Trao đổi tiến độ thực hiện dự án.",
        creatorId: "U-employee-2",
        creatorName: "Trần Thị B",
        creatorEmail: "tranthib@xyz.com",
        participants: [],
        joinRequests: [],
        status: "Sắp diễn ra",
        createdAt: new Date().toISOString()
      }
    ];

    saveMeetings(meetings);
  }
}

function resetDemoData() {
  const confirmReset = confirm("Bạn có chắc muốn reset toàn bộ dữ liệu demo không?");
  if (!confirmReset) return;

  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(MEETING_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);

  currentUser = null;
  initDemoData();
  showAuth();
  showAuthMessage("Đã reset dữ liệu demo. Vui lòng đăng nhập lại.", "success");
}

// =====================================================
// HÀM PHỤ
// =====================================================
function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function showAuthMessage(text, type) {
  const box = document.getElementById("authMessage");
  box.textContent = text;
  box.className = `message ${type}`;
}

function hideAuthMessage() {
  const box = document.getElementById("authMessage");
  box.textContent = "";
  box.className = "message hidden";
}

function showAppMessage(text, type) {
  const box = document.getElementById("appMessage");
  box.textContent = text;
  box.className = `message ${type}`;

  setTimeout(() => {
    box.className = "message hidden";
    box.textContent = "";
  }, 3500);
}

function renderStatus(status) {
  let className = "upcoming";

  if (status === "Đang diễn ra") className = "active";
  if (status === "Đã hoàn thành") className = "done";
  if (status === "Đã hủy") className = "cancelled";
  if (status === "pending") className = "pending";
  if (status === "approved") className = "approved";
  if (status === "rejected") className = "rejected";

  return `<span class="status ${className}">${status}</span>`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function toDateTimeLocal(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Cho phép gọi hàm từ onclick trong HTML render động
window.openJoinModal = openJoinModal;
window.approveJoinRequest = approveJoinRequest;
window.rejectJoinRequest = rejectJoinRequest;
window.openAdminEditModal = openAdminEditModal;
window.adminDeleteMeeting = adminDeleteMeeting;
window.toggleUserStatus = toggleUserStatus;
