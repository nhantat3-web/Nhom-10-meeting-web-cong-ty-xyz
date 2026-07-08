
const USER_KEY = "xyz_users_v3";
const ROOM_KEY = "xyz_rooms_v3";
const MEETING_KEY = "xyz_meetings_v3";
const CURRENT_USER_KEY = "xyz_current_user_v3";

let currentUser = null;

initDemoData();
loadCurrentUser();
bindEvents();

if (currentUser) {
  showApp();
} else {
  showAuth();
}

// =====================================================
// EVENTS
// =====================================================
function bindEvents() {
  document.getElementById("showLoginBtn").addEventListener("click", () => switchAuthTab("login"));
  document.getElementById("showRegisterBtn").addEventListener("click", () => switchAuthTab("register"));

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("registerForm").addEventListener("submit", handleRegister);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  document.getElementById("employeeCreateMeetingForm").addEventListener("submit", handleEmployeeCreateMeeting);
  document.getElementById("employeeResetBtn").addEventListener("click", () => document.getElementById("employeeCreateMeetingForm").reset());
  document.getElementById("employeeSearchInput").addEventListener("input", renderEmployeeMeetings);
  document.getElementById("employeeReloadBtn").addEventListener("click", renderEmployeeMeetings);

  document.getElementById("joinForm").addEventListener("submit", handleJoinRequest);
  document.getElementById("closeJoinModalBtn").addEventListener("click", closeJoinModal);

  document.getElementById("adminAddMeetingBtn").addEventListener("click", () => openMeetingModal());
  document.getElementById("adminMeetingForm").addEventListener("submit", handleAdminSaveMeeting);
  document.getElementById("closeMeetingModalBtn").addEventListener("click", closeMeetingModal);
  document.getElementById("adminMeetingSearchInput").addEventListener("input", renderAdminMeetings);
  document.getElementById("adminMeetingStatusFilter").addEventListener("change", renderAdminMeetings);
  document.getElementById("adminMeetingReloadBtn").addEventListener("click", renderAdminMeetings);

  document.getElementById("closeDetailModalBtn").addEventListener("click", closeDetailModal);

  document.getElementById("adminAddRoomBtn").addEventListener("click", () => openRoomModal());
  document.getElementById("roomForm").addEventListener("submit", handleSaveRoom);
  document.getElementById("closeRoomModalBtn").addEventListener("click", closeRoomModal);

  document.getElementById("adminAddUserBtn").addEventListener("click", () => openUserModal());
  document.getElementById("userForm").addEventListener("submit", handleSaveUser);
  document.getElementById("closeUserModalBtn").addEventListener("click", closeUserModal);
}

// =====================================================
// AUTH
// =====================================================
function switchAuthTab(tab) {
  hideAuthMessage();

  document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
  document.getElementById("registerForm").classList.toggle("hidden", tab !== "register");
  document.getElementById("showLoginBtn").classList.toggle("active", tab === "login");
  document.getElementById("showRegisterBtn").classList.toggle("active", tab === "register");
}

function handleLogin(event) {
  event.preventDefault();

  const email = getValue("loginEmail").toLowerCase();
  const password = getValue("loginPassword");

  if (!email || !password) {
    showAuthMessage("Vui lòng nhập email và mật khẩu.", "error");
    return;
  }

  const user = getUsers().find(item => item.email === email && item.password === password);

  if (!user) {
    showAuthMessage("Email hoặc mật khẩu không đúng.", "error");
    return;
  }

  if (user.status === "locked") {
    showAuthMessage("Tài khoản đã bị khóa. Vui lòng liên hệ Admin.", "error");
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

  if (users.some(item => item.email === email)) {
    showAuthMessage("Email này đã tồn tại.", "error");
    return;
  }

  users.push({
    id: createId("U"),
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
  document.getElementById("roleText").textContent = currentUser.role === "admin"
    ? "Vai trò: Administrator"
    : "Vai trò: Nhân viên";

  buildMenu();
}

// =====================================================
// MENU + PAGE
// =====================================================
function buildMenu() {
  const menu = document.getElementById("mainMenu");
  menu.innerHTML = "";

  const pages = currentUser.role === "admin"
    ? [
        { id: "adminDashboardPage", label: "Dashboard" },
        { id: "adminMeetingsPage", label: "Quản lý cuộc họp" },
        { id: "adminRequestsPage", label: "Duyệt yêu cầu" },
        { id: "adminRoomsPage", label: "Quản lý phòng họp" },
        { id: "adminUsersPage", label: "Quản lý tài khoản" }
      ]
    : [
        { id: "employeeCreatePage", label: "Tạo cuộc họp" },
        { id: "employeeMeetingsPage", label: "Cuộc họp đang diễn ra" },
        { id: "hostRequestsPage", label: "Duyệt yêu cầu tham gia" }
      ];

  pages.forEach((page, index) => {
    const btn = document.createElement("button");
    btn.textContent = page.label;
    btn.dataset.page = page.id;

    if (index === 0) btn.classList.add("active");

    btn.addEventListener("click", () => {
      document.querySelectorAll("#mainMenu button").forEach(item => item.classList.remove("active"));
      btn.classList.add("active");
      showPage(page.id);
    });

    menu.appendChild(btn);
  });

  showPage(pages[0].id);
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");

  updateMeetingStatuses();
  loadRoomOptions();

  if (pageId === "adminDashboardPage") renderDashboard();
  if (pageId === "adminMeetingsPage") renderAdminMeetings();
  if (pageId === "adminRequestsPage") renderAdminRequests();
  if (pageId === "adminRoomsPage") renderAdminRooms();
  if (pageId === "adminUsersPage") renderAdminUsers();

  if (pageId === "employeeMeetingsPage") renderEmployeeMeetings();
  if (pageId === "hostRequestsPage") renderHostRequests();
}

// =====================================================
// EMPLOYEE - CREATE MEETING
// =====================================================
function handleEmployeeCreateMeeting(event) {
  event.preventDefault();

  const roomId = getValue("empMeetingRoom");
  const room = getRooms().find(item => item.id === roomId);

  const meeting = {
    id: createId("M"),
    title: getValue("empMeetingTitle"),
    roomId,
    roomName: room ? room.name : "",
    startTime: getValue("empMeetingStart"),
    endTime: getValue("empMeetingEnd"),
    pass: getValue("empMeetingPass"),
    capacity: Number(getValue("empMeetingCapacity")) || (room ? room.capacity : 10),
    description: getValue("empMeetingDescription"),
    creatorId: currentUser.id,
    creatorName: currentUser.name,
    creatorEmail: currentUser.email,
    participants: [],
    joinRequests: [],
    status: "Sắp diễn ra",
    manualStatus: false,
    createdAt: new Date().toISOString()
  };

  const error = validateMeeting(meeting);
  if (error) {
    showAppMessage(error, "error");
    return;
  }

  if (isRoomConflict(meeting)) {
    showAppMessage("Phòng họp đã bị trùng lịch. Vui lòng chọn phòng hoặc thời gian khác.", "error");
    return;
  }

  const meetings = getMeetings();
  meetings.push(meeting);
  saveMeetings(meetings);

  document.getElementById("employeeCreateMeetingForm").reset();
  showAppMessage("Tạo cuộc họp thành công.", "success");
}

// =====================================================
// EMPLOYEE - VIEW + JOIN
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
      meeting.roomName.toLowerCase().includes(keyword)
    );
  }

  const list = document.getElementById("employeeMeetingList");

  if (meetings.length === 0) {
    list.innerHTML = `<p>Không có cuộc họp đang diễn ra hoặc sắp diễn ra.</p>`;
    return;
  }

  list.innerHTML = meetings.map(meeting => {
    const isOwner = meeting.creatorId === currentUser.id;
    const joinStatus = getMyJoinStatus(meeting);

    let buttonHtml = "";

    if (isOwner) {
      buttonHtml = `<button class="btn secondary" disabled>Bạn là chủ phòng</button>`;
    } else if (joinStatus === "approved") {
      buttonHtml = `<button class="btn success" disabled>Đã được duyệt tham gia</button>`;
    } else if (joinStatus === "pending") {
      buttonHtml = `<button class="btn warning" disabled>Đang chờ duyệt</button>`;
    } else if (joinStatus === "rejected") {
      buttonHtml = `<button class="btn danger" disabled>Yêu cầu bị từ chối</button>`;
    } else {
      buttonHtml = `<button class="btn primary" onclick="openJoinModal('${meeting.id}')">Xin tham gia</button>`;
    }

    return `
      <div class="meeting-card">
        <h3>${escapeHtml(meeting.title)}</h3>
        <div class="meeting-info">
          <p><b>Phòng:</b> ${escapeHtml(meeting.roomName)}</p>
          <p><b>Trạng thái:</b> ${renderStatus(meeting.status)}</p>
          <p><b>Bắt đầu:</b> ${formatDateTime(meeting.startTime)}</p>
          <p><b>Kết thúc:</b> ${formatDateTime(meeting.endTime)}</p>
          <p><b>Chủ phòng:</b> ${escapeHtml(meeting.creatorName)}</p>
          <p><b>Số người tham gia:</b> ${meeting.participants.length}/${meeting.capacity}</p>
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
  const meeting = meetings.find(item => item.id === meetingId);

  if (!meeting) {
    showAppMessage("Không tìm thấy cuộc họp.", "error");
    return;
  }

  if (meeting.pass !== password) {
    showAppMessage("Mật khẩu tham gia không đúng.", "error");
    return;
  }

  if (meeting.participants.some(item => item.userId === currentUser.id)) {
    showAppMessage("Bạn đã được duyệt tham gia cuộc họp này.", "success");
    closeJoinModal();
    return;
  }

  const pending = meeting.joinRequests.find(item => item.userId === currentUser.id && item.status === "pending");
  if (pending) {
    showAppMessage("Bạn đã gửi yêu cầu. Vui lòng chờ duyệt.", "error");
    closeJoinModal();
    return;
  }

  if (meeting.participants.length >= meeting.capacity) {
    showAppMessage("Cuộc họp đã đủ số lượng người tham gia.", "error");
    return;
  }

  meeting.joinRequests = meeting.joinRequests.filter(item => item.userId !== currentUser.id);

  meeting.joinRequests.push({
    requestId: createId("R"),
    userId: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    status: "pending",
    requestedAt: new Date().toISOString()
  });

  saveMeetings(meetings);

  closeJoinModal();
  renderEmployeeMeetings();
  showAppMessage("Mật khẩu đúng. Yêu cầu tham gia đã được gửi và đang chờ duyệt.", "success");
}

function getMyJoinStatus(meeting) {
  if (meeting.participants.some(item => item.userId === currentUser.id)) return "approved";
  const request = meeting.joinRequests.find(item => item.userId === currentUser.id);
  return request ? request.status : "";
}

// =====================================================
// HOST + ADMIN REQUEST APPROVAL
// =====================================================
function renderHostRequests() {
  const meetings = getMeetings().filter(item => item.creatorId === currentUser.id);
  const list = document.getElementById("hostRequestList");
  const html = buildRequestCards(meetings, false);

  list.innerHTML = html || `<p>Hiện chưa có yêu cầu tham gia nào cần duyệt.</p>`;
}

function renderAdminRequests() {
  const meetings = getMeetings();
  const list = document.getElementById("adminRequestList");
  const html = buildRequestCards(meetings, true);

  list.innerHTML = html || `<p>Hiện chưa có yêu cầu tham gia nào cần duyệt.</p>`;
}

function buildRequestCards(meetings, isAdminView) {
  const cards = [];

  meetings.forEach(meeting => {
    const pendingRequests = meeting.joinRequests.filter(req => req.status === "pending");

    pendingRequests.forEach(request => {
      cards.push(`
        <div class="meeting-card">
          <h3>${escapeHtml(meeting.title)}</h3>
          <div class="meeting-info">
            <p><b>Phòng:</b> ${escapeHtml(meeting.roomName)}</p>
            <p><b>Thời gian:</b> ${formatDateTime(meeting.startTime)} - ${formatDateTime(meeting.endTime)}</p>
            <p><b>Chủ phòng:</b> ${escapeHtml(meeting.creatorName)}</p>
            <p><b>Người xin tham gia:</b> ${escapeHtml(request.name)} (${escapeHtml(request.email)})</p>
            <p><b>Người tham gia:</b> ${meeting.participants.length}/${meeting.capacity}</p>
            <p><b>Quyền duyệt:</b> ${isAdminView ? "Admin" : "Chủ phòng"}</p>
          </div>
          <div class="row-actions">
            <button class="btn success" onclick="approveJoinRequest('${meeting.id}', '${request.requestId}', ${isAdminView})">Đồng ý</button>
            <button class="btn danger" onclick="rejectJoinRequest('${meeting.id}', '${request.requestId}', ${isAdminView})">Từ chối</button>
          </div>
        </div>
      `);
    });
  });

  return cards.join("");
}

function approveJoinRequest(meetingId, requestId, isAdminView = false) {
  const meetings = getMeetings();
  const meeting = meetings.find(item => item.id === meetingId);

  if (!meeting) return;

  if (!isAdminView && meeting.creatorId !== currentUser.id) {
    showAppMessage("Bạn không có quyền duyệt yêu cầu này.", "error");
    return;
  }

  if (meeting.participants.length >= meeting.capacity) {
    showAppMessage("Cuộc họp đã đủ số lượng người tham gia.", "error");
    return;
  }

  const request = meeting.joinRequests.find(item => item.requestId === requestId);
  if (!request) return;

  request.status = "approved";

  if (!meeting.participants.some(item => item.userId === request.userId)) {
    meeting.participants.push({
      userId: request.userId,
      name: request.name,
      email: request.email,
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser.email
    });
  }

  saveMeetings(meetings);

  if (isAdminView) renderAdminRequests();
  else renderHostRequests();

  showAppMessage("Đã đồng ý cho nhân viên tham gia cuộc họp.", "success");
}

function rejectJoinRequest(meetingId, requestId, isAdminView = false) {
  const meetings = getMeetings();
  const meeting = meetings.find(item => item.id === meetingId);

  if (!meeting) return;

  if (!isAdminView && meeting.creatorId !== currentUser.id) {
    showAppMessage("Bạn không có quyền từ chối yêu cầu này.", "error");
    return;
  }

  const request = meeting.joinRequests.find(item => item.requestId === requestId);
  if (!request) return;

  request.status = "rejected";
  saveMeetings(meetings);

  if (isAdminView) renderAdminRequests();
  else renderHostRequests();

  showAppMessage("Đã từ chối yêu cầu tham gia.", "success");
}

// =====================================================
// ADMIN DASHBOARD
// =====================================================
function renderDashboard() {
  updateMeetingStatuses();

  const users = getUsers();
  const rooms = getRooms();
  const meetings = getMeetings();

  const totalMeetings = meetings.length;
  const activeMeetings = meetings.filter(m => m.status === "Đang diễn ra").length;
  const upcomingMeetings = meetings.filter(m => m.status === "Sắp diễn ra").length;
  const pendingRequests = meetings.reduce((sum, m) => sum + m.joinRequests.filter(r => r.status === "pending").length, 0);
  const totalUsers = users.length;
  const totalRooms = rooms.length;
  const cancelledMeetings = meetings.filter(m => m.status === "Đã hủy").length;
  const finishedMeetings = meetings.filter(m => m.status === "Đã hoàn thành").length;

  document.getElementById("dashboardCards").innerHTML = `
    <div class="stat-card"><h3>${totalMeetings}</h3><p>Tổng cuộc họp</p></div>
    <div class="stat-card"><h3>${activeMeetings}</h3><p>Đang diễn ra</p></div>
    <div class="stat-card"><h3>${upcomingMeetings}</h3><p>Sắp diễn ra</p></div>
    <div class="stat-card"><h3>${pendingRequests}</h3><p>Yêu cầu chờ duyệt</p></div>
    <div class="stat-card"><h3>${totalUsers}</h3><p>Tổng tài khoản</p></div>
    <div class="stat-card"><h3>${totalRooms}</h3><p>Tổng phòng họp</p></div>
    <div class="stat-card"><h3>${finishedMeetings}</h3><p>Đã hoàn thành</p></div>
    <div class="stat-card"><h3>${cancelledMeetings}</h3><p>Đã hủy</p></div>
  `;

  const stats = rooms.map(room => ({
    roomName: room.name,
    count: meetings.filter(meeting => meeting.roomId === room.id).length
  })).sort((a, b) => b.count - a.count);

  document.getElementById("roomStatsBody").innerHTML = stats.length
    ? stats.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.roomName)}</td>
        <td>${item.count}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3" style="text-align:center;">Chưa có dữ liệu.</td></tr>`;
}

// =====================================================
// ADMIN MEETING CRUD
// =====================================================
function renderAdminMeetings() {
  updateMeetingStatuses();

  const keyword = getValue("adminMeetingSearchInput").toLowerCase();
  const statusFilter = getValue("adminMeetingStatusFilter");

  let meetings = getMeetings();

  if (keyword) {
    meetings = meetings.filter(meeting =>
      meeting.title.toLowerCase().includes(keyword) ||
      meeting.roomName.toLowerCase().includes(keyword) ||
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
      <td><b>${escapeHtml(meeting.title)}</b><br><small>Pass: ${escapeHtml(meeting.pass)}</small></td>
      <td>${escapeHtml(meeting.roomName)}</td>
      <td>${formatDateTime(meeting.startTime)}<br>đến<br>${formatDateTime(meeting.endTime)}</td>
      <td>${escapeHtml(meeting.creatorName)}<br><small>${escapeHtml(meeting.creatorEmail)}</small></td>
      <td>${meeting.participants.length}/${meeting.capacity}</td>
      <td>${renderStatus(meeting.status)}</td>
      <td>
        <div class="row-actions">
          <button class="btn secondary" onclick="openDetailModal('${meeting.id}')">Chi tiết</button>
          <button class="btn warning" onclick="openMeetingModal('${meeting.id}')">Sửa</button>
          <button class="btn danger" onclick="deleteMeeting('${meeting.id}')">Xóa</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openMeetingModal(meetingId = "") {
  loadAdminMeetingSelects();

  const title = document.getElementById("meetingModalTitle");
  const form = document.getElementById("adminMeetingForm");
  form.reset();

  document.getElementById("adminMeetingId").value = "";

  if (meetingId) {
    const meeting = getMeetings().find(item => item.id === meetingId);
    if (!meeting) return;

    title.textContent = "Sửa cuộc họp";

    document.getElementById("adminMeetingId").value = meeting.id;
    document.getElementById("adminMeetingTitle").value = meeting.title;
    document.getElementById("adminMeetingCreator").value = meeting.creatorId;
    document.getElementById("adminMeetingRoom").value = meeting.roomId;
    document.getElementById("adminMeetingPass").value = meeting.pass;
    document.getElementById("adminMeetingStart").value = meeting.startTime;
    document.getElementById("adminMeetingEnd").value = meeting.endTime;
    document.getElementById("adminMeetingCapacity").value = meeting.capacity;
    document.getElementById("adminMeetingStatus").value = meeting.status;
    document.getElementById("adminMeetingDescription").value = meeting.description || "";
  } else {
    title.textContent = "Thêm cuộc họp";
    document.getElementById("adminMeetingStatus").value = "Sắp diễn ra";
  }

  document.getElementById("meetingModal").classList.remove("hidden");
}

function closeMeetingModal() {
  document.getElementById("meetingModal").classList.add("hidden");
}

function handleAdminSaveMeeting(event) {
  event.preventDefault();

  const id = getValue("adminMeetingId");
  const users = getUsers();
  const rooms = getRooms();

  const creator = users.find(item => item.id === getValue("adminMeetingCreator"));
  const room = rooms.find(item => item.id === getValue("adminMeetingRoom"));

  const meetingData = {
    title: getValue("adminMeetingTitle"),
    creatorId: creator ? creator.id : "",
    creatorName: creator ? creator.name : "",
    creatorEmail: creator ? creator.email : "",
    roomId: room ? room.id : "",
    roomName: room ? room.name : "",
    pass: getValue("adminMeetingPass"),
    startTime: getValue("adminMeetingStart"),
    endTime: getValue("adminMeetingEnd"),
    capacity: Number(getValue("adminMeetingCapacity")) || (room ? room.capacity : 10),
    status: getValue("adminMeetingStatus"),
    description: getValue("adminMeetingDescription"),
    manualStatus: true
  };

  const error = validateMeeting(meetingData);
  if (error) {
    showAppMessage(error, "error");
    return;
  }

  if (isRoomConflict({ ...meetingData, id }, id)) {
    showAppMessage("Phòng họp đã bị trùng lịch. Vui lòng chọn phòng hoặc thời gian khác.", "error");
    return;
  }

  const meetings = getMeetings();

  if (id) {
    const index = meetings.findIndex(item => item.id === id);
    if (index === -1) return;

    meetings[index] = {
      ...meetings[index],
      ...meetingData
    };

    showAppMessage("Admin đã cập nhật cuộc họp.", "success");
  } else {
    meetings.push({
      id: createId("M"),
      ...meetingData,
      participants: [],
      joinRequests: [],
      createdAt: new Date().toISOString()
    });

    showAppMessage("Admin đã thêm cuộc họp mới.", "success");
  }

  saveMeetings(meetings);
  closeMeetingModal();
  renderAdminMeetings();
}

function deleteMeeting(meetingId) {
  const confirmDelete = confirm("Admin có chắc muốn xóa cuộc họp này không?");
  if (!confirmDelete) return;

  const meetings = getMeetings().filter(item => item.id !== meetingId);
  saveMeetings(meetings);
  renderAdminMeetings();
  showAppMessage("Admin đã xóa cuộc họp.", "success");
}

function openDetailModal(meetingId) {
  const meeting = getMeetings().find(item => item.id === meetingId);
  if (!meeting) return;

  const requestsHtml = meeting.joinRequests.length
    ? meeting.joinRequests.map(req => `
      <div class="list-box">
        <b>${escapeHtml(req.name)}</b> - ${escapeHtml(req.email)}<br>
        Trạng thái: ${renderRequestStatus(req.status)}<br>
        Ngày gửi: ${formatDateTime(req.requestedAt)}
        ${req.status === "pending" ? `
          <div class="row-actions" style="margin-top:10px;">
            <button class="btn success" onclick="approveJoinRequest('${meeting.id}', '${req.requestId}', true); openDetailModal('${meeting.id}')">Đồng ý</button>
            <button class="btn danger" onclick="rejectJoinRequest('${meeting.id}', '${req.requestId}', true); openDetailModal('${meeting.id}')">Từ chối</button>
          </div>
        ` : ""}
      </div>
    `).join("")
    : "<p>Chưa có yêu cầu tham gia.</p>";

  const participantsHtml = meeting.participants.length
    ? meeting.participants.map(p => `<li>${escapeHtml(p.name)} - ${escapeHtml(p.email)}</li>`).join("")
    : "<li>Chưa có người tham gia.</li>";

  document.getElementById("detailContent").innerHTML = `
    <div class="detail-grid">
      <b>Tiêu đề:</b><span>${escapeHtml(meeting.title)}</span>
      <b>Phòng họp:</b><span>${escapeHtml(meeting.roomName)}</span>
      <b>Thời gian:</b><span>${formatDateTime(meeting.startTime)} - ${formatDateTime(meeting.endTime)}</span>
      <b>Chủ phòng:</b><span>${escapeHtml(meeting.creatorName)} (${escapeHtml(meeting.creatorEmail)})</span>
      <b>Mật khẩu:</b><span>${escapeHtml(meeting.pass)}</span>
      <b>Số lượng:</b><span>${meeting.participants.length}/${meeting.capacity}</span>
      <b>Trạng thái:</b><span>${renderStatus(meeting.status)}</span>
      <b>Nội dung:</b><span>${escapeHtml(meeting.description || "Không có nội dung")}</span>
    </div>

    <h3>Danh sách người tham gia</h3>
    <ul>${participantsHtml}</ul>

    <h3>Yêu cầu tham gia</h3>
    ${requestsHtml}
  `;

  document.getElementById("detailModal").classList.remove("hidden");
}

function closeDetailModal() {
  document.getElementById("detailModal").classList.add("hidden");
}

function renderRequestStatus(status) {
  if (status === "pending") return `<span class="status pending">Đang chờ</span>`;
  if (status === "approved") return `<span class="status approved">Đã duyệt</span>`;
  return `<span class="status rejected">Đã từ chối</span>`;
}

// =====================================================
// ADMIN ROOMS
// =====================================================
function renderAdminRooms() {
  const rooms = getRooms();
  const body = document.getElementById("adminRoomTableBody");

  body.innerHTML = rooms.map((room, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><b>${escapeHtml(room.name)}</b></td>
      <td>${room.capacity}</td>
      <td>${escapeHtml(room.equipment || "Không có")}</td>
      <td>${renderRoomStatus(room.status)}</td>
      <td>
        <div class="row-actions">
          <button class="btn warning" onclick="openRoomModal('${room.id}')">Sửa</button>
          <button class="btn danger" onclick="deleteRoom('${room.id}')">Xóa</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openRoomModal(roomId = "") {
  const form = document.getElementById("roomForm");
  form.reset();
  document.getElementById("roomId").value = "";

  if (roomId) {
    const room = getRooms().find(item => item.id === roomId);
    if (!room) return;

    document.getElementById("roomModalTitle").textContent = "Sửa phòng họp";
    document.getElementById("roomId").value = room.id;
    document.getElementById("roomName").value = room.name;
    document.getElementById("roomCapacity").value = room.capacity;
    document.getElementById("roomEquipment").value = room.equipment || "";
    document.getElementById("roomStatus").value = room.status;
  } else {
    document.getElementById("roomModalTitle").textContent = "Thêm phòng họp";
    document.getElementById("roomStatus").value = "active";
  }

  document.getElementById("roomModal").classList.remove("hidden");
}

function closeRoomModal() {
  document.getElementById("roomModal").classList.add("hidden");
}

function handleSaveRoom(event) {
  event.preventDefault();

  const id = getValue("roomId");
  const name = getValue("roomName");
  const capacity = Number(getValue("roomCapacity"));
  const equipment = getValue("roomEquipment");
  const status = getValue("roomStatus");

  if (!name || !capacity || capacity <= 0) {
    showAppMessage("Vui lòng nhập tên phòng và sức chứa hợp lệ.", "error");
    return;
  }

  const rooms = getRooms();

  const duplicate = rooms.some(room => room.name.toLowerCase() === name.toLowerCase() && room.id !== id);
  if (duplicate) {
    showAppMessage("Tên phòng họp đã tồn tại.", "error");
    return;
  }

  if (id) {
    const index = rooms.findIndex(item => item.id === id);
    if (index === -1) return;

    const oldName = rooms[index].name;

    rooms[index] = {
      ...rooms[index],
      name,
      capacity,
      equipment,
      status
    };

    // Cập nhật tên phòng trong các cuộc họp cũ nếu đổi tên
    const meetings = getMeetings();
    meetings.forEach(meeting => {
      if (meeting.roomId === id) {
        meeting.roomName = name;
      }
    });
    saveMeetings(meetings);

    showAppMessage("Đã cập nhật phòng họp.", "success");
  } else {
    rooms.push({
      id: createId("ROOM"),
      name,
      capacity,
      equipment,
      status
    });

    showAppMessage("Đã thêm phòng họp mới.", "success");
  }

  saveRooms(rooms);
  closeRoomModal();
  renderAdminRooms();
  loadRoomOptions();
}

function deleteRoom(roomId) {
  const hasMeeting = getMeetings().some(meeting =>
    meeting.roomId === roomId &&
    meeting.status !== "Đã hủy" &&
    meeting.status !== "Đã hoàn thành"
  );

  if (hasMeeting) {
    showAppMessage("Không thể xóa phòng đang có cuộc họp sắp diễn ra hoặc đang diễn ra.", "error");
    return;
  }

  const confirmDelete = confirm("Bạn có chắc muốn xóa phòng họp này không?");
  if (!confirmDelete) return;

  const rooms = getRooms().filter(item => item.id !== roomId);
  saveRooms(rooms);
  renderAdminRooms();
  loadRoomOptions();
  showAppMessage("Đã xóa phòng họp.", "success");
}

// =====================================================
// ADMIN USERS
// =====================================================
function renderAdminUsers() {
  const users = getUsers();
  const body = document.getElementById("adminUserTableBody");

  body.innerHTML = users.map((user, index) => {
    const isCurrent = user.id === currentUser.id;

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(user.name)} ${isCurrent ? "<small>(Bạn)</small>" : ""}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${renderRole(user.role)}</td>
        <td>${renderUserStatus(user.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn warning" onclick="openUserModal('${user.id}')">Sửa</button>
            ${user.status === "active"
              ? `<button class="btn secondary" onclick="toggleUserStatus('${user.id}')" ${isCurrent ? "disabled" : ""}>Khóa</button>`
              : `<button class="btn success" onclick="toggleUserStatus('${user.id}')" ${isCurrent ? "disabled" : ""}>Mở khóa</button>`
            }
            <button class="btn danger" onclick="deleteUser('${user.id}')" ${isCurrent ? "disabled" : ""}>Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function openUserModal(userId = "") {
  const form = document.getElementById("userForm");
  form.reset();
  document.getElementById("userId").value = "";

  if (userId) {
    const user = getUsers().find(item => item.id === userId);
    if (!user) return;

    document.getElementById("userModalTitle").textContent = "Sửa tài khoản";
    document.getElementById("userId").value = user.id;
    document.getElementById("userName").value = user.name;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userPassword").value = "";
    document.getElementById("userPassword").placeholder = "Bỏ trống nếu không đổi mật khẩu";
    document.getElementById("userRole").value = user.role;
    document.getElementById("userStatus").value = user.status;
  } else {
    document.getElementById("userModalTitle").textContent = "Tạo tài khoản";
    document.getElementById("userPassword").placeholder = "Tối thiểu 6 ký tự";
    document.getElementById("userRole").value = "employee";
    document.getElementById("userStatus").value = "active";
  }

  document.getElementById("userModal").classList.remove("hidden");
}

function closeUserModal() {
  document.getElementById("userModal").classList.add("hidden");
}

function handleSaveUser(event) {
  event.preventDefault();

  const id = getValue("userId");
  const name = getValue("userName");
  const email = getValue("userEmail").toLowerCase();
  const password = getValue("userPassword");
  const role = getValue("userRole");
  const status = getValue("userStatus");

  if (!name || !email) {
    showAppMessage("Vui lòng nhập họ tên và email.", "error");
    return;
  }

  const users = getUsers();

  const duplicate = users.some(user => user.email === email && user.id !== id);
  if (duplicate) {
    showAppMessage("Email này đã tồn tại.", "error");
    return;
  }

  if (id) {
    const index = users.findIndex(item => item.id === id);
    if (index === -1) return;

    if (password && password.length < 6) {
      showAppMessage("Mật khẩu phải có ít nhất 6 ký tự.", "error");
      return;
    }

    const oldUser = users[index];

    users[index] = {
      ...oldUser,
      name,
      email,
      role,
      status,
      password: password ? password : oldUser.password
    };

    updateUserInfoInMeetings(users[index]);

    if (id === currentUser.id) {
      currentUser = {
        id: users[index].id,
        name: users[index].name,
        email: users[index].email,
        role: users[index].role
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      document.getElementById("currentUserText").textContent = `${currentUser.name} (${currentUser.email})`;
    }

    showAppMessage("Đã cập nhật tài khoản.", "success");
  } else {
    if (!password || password.length < 6) {
      showAppMessage("Mật khẩu phải có ít nhất 6 ký tự.", "error");
      return;
    }

    users.push({
      id: createId("U"),
      name,
      email,
      password,
      role,
      status
    });

    showAppMessage("Admin đã tạo tài khoản mới.", "success");
  }

  saveUsers(users);
  closeUserModal();
  renderAdminUsers();
  loadAdminMeetingSelects();
}

function toggleUserStatus(userId) {
  if (userId === currentUser.id) {
    showAppMessage("Không thể khóa tài khoản đang đăng nhập.", "error");
    return;
  }

  const users = getUsers();
  const user = users.find(item => item.id === userId);
  if (!user) return;

  user.status = user.status === "active" ? "locked" : "active";
  saveUsers(users);
  renderAdminUsers();
  showAppMessage("Đã cập nhật trạng thái tài khoản.", "success");
}

function deleteUser(userId) {
  if (userId === currentUser.id) {
    showAppMessage("Không thể xóa tài khoản đang đăng nhập.", "error");
    return;
  }

  const userHasFutureMeetings = getMeetings().some(meeting =>
    meeting.creatorId === userId &&
    meeting.status !== "Đã hủy" &&
    meeting.status !== "Đã hoàn thành"
  );

  if (userHasFutureMeetings) {
    showAppMessage("Không thể xóa tài khoản đang là chủ phòng của cuộc họp chưa kết thúc.", "error");
    return;
  }

  const confirmDelete = confirm("Bạn có chắc muốn xóa tài khoản này không?");
  if (!confirmDelete) return;

  const users = getUsers().filter(item => item.id !== userId);
  saveUsers(users);
  renderAdminUsers();
  showAppMessage("Đã xóa tài khoản.", "success");
}

function updateUserInfoInMeetings(user) {
  const meetings = getMeetings();

  meetings.forEach(meeting => {
    if (meeting.creatorId === user.id) {
      meeting.creatorName = user.name;
      meeting.creatorEmail = user.email;
    }

    meeting.participants.forEach(p => {
      if (p.userId === user.id) {
        p.name = user.name;
        p.email = user.email;
      }
    });

    meeting.joinRequests.forEach(r => {
      if (r.userId === user.id) {
        r.name = user.name;
        r.email = user.email;
      }
    });
  });

  saveMeetings(meetings);
}

// =====================================================
// VALIDATION + STATUS
// =====================================================
function validateMeeting(meeting) {
  if (!meeting.title) return "Vui lòng nhập tiêu đề cuộc họp.";
  if (!meeting.creatorId) return "Vui lòng chọn người tạo cuộc họp.";
  if (!meeting.roomId) return "Vui lòng chọn phòng họp.";
  if (!meeting.startTime) return "Vui lòng chọn thời gian bắt đầu.";
  if (!meeting.endTime) return "Vui lòng chọn thời gian kết thúc.";
  if (!meeting.pass) return "Vui lòng nhập mật khẩu tham gia.";

  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);

  if (end <= start) return "Thời gian kết thúc phải lớn hơn thời gian bắt đầu.";
  if (meeting.capacity <= 0) return "Số lượng tối đa phải lớn hơn 0.";

  const room = getRooms().find(item => item.id === meeting.roomId);
  if (room && meeting.capacity > room.capacity) {
    return "Số lượng tối đa không được vượt quá sức chứa của phòng họp.";
  }

  return "";
}

function isRoomConflict(newMeeting, ignoreId = "") {
  const meetings = getMeetings();
  const newStart = new Date(newMeeting.startTime);
  const newEnd = new Date(newMeeting.endTime);

  return meetings.some(meeting => {
    if (meeting.id === ignoreId) return false;
    if (meeting.status === "Đã hủy") return false;
    if (meeting.roomId !== newMeeting.roomId) return false;

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
    if (meeting.manualStatus) return meeting;

    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (now >= start && now <= end) return { ...meeting, status: "Đang diễn ra" };
    if (now > end) return { ...meeting, status: "Đã hoàn thành" };

    return { ...meeting, status: "Sắp diễn ra" };
  });

  saveMeetings(updated);
}

// =====================================================
// OPTIONS
// =====================================================
function loadRoomOptions() {
  const rooms = getRooms().filter(room => room.status === "active");
  const html = `<option value="">-- Chọn phòng họp --</option>` + rooms.map(room =>
    `<option value="${room.id}">${escapeHtml(room.name)} - ${room.capacity} chỗ</option>`
  ).join("");

  const employeeSelect = document.getElementById("empMeetingRoom");
  if (employeeSelect) employeeSelect.innerHTML = html;
}

function loadAdminMeetingSelects() {
  const users = getUsers().filter(user => user.status === "active");
  const rooms = getRooms().filter(room => room.status === "active");

  document.getElementById("adminMeetingCreator").innerHTML =
    `<option value="">-- Chọn người tạo --</option>` +
    users.map(user => `<option value="${user.id}">${escapeHtml(user.name)} - ${escapeHtml(user.email)}</option>`).join("");

  document.getElementById("adminMeetingRoom").innerHTML =
    `<option value="">-- Chọn phòng họp --</option>` +
    rooms.map(room => `<option value="${room.id}">${escapeHtml(room.name)} - ${room.capacity} chỗ</option>`).join("");
}

// =====================================================
// LOCAL STORAGE
// =====================================================
function getUsers() {
  return JSON.parse(localStorage.getItem(USER_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

function getRooms() {
  return JSON.parse(localStorage.getItem(ROOM_KEY)) || [];
}

function saveRooms(rooms) {
  localStorage.setItem(ROOM_KEY, JSON.stringify(rooms));
}

function getMeetings() {
  return JSON.parse(localStorage.getItem(MEETING_KEY)) || [];
}

function saveMeetings(meetings) {
  localStorage.setItem(MEETING_KEY, JSON.stringify(meetings));
}

function initDemoData() {
  if (!localStorage.getItem(USER_KEY)) {
    saveUsers([
      {
        id: "U-admin",
        name: "Administrator",
        email: "admin@xyz.com",
        password: "123456",
        role: "admin",
        status: "active"
      },
      {
        id: "U-emp-1",
        name: "Nguyễn Văn A",
        email: "nhanvien@xyz.com",
        password: "123456",
        role: "employee",
        status: "active"
      },
      {
        id: "U-emp-2",
        name: "Trần Thị B",
        email: "tranthib@xyz.com",
        password: "123456",
        role: "employee",
        status: "active"
      }
    ]);
  }

  if (!localStorage.getItem(ROOM_KEY)) {
    saveRooms([
      {
        id: "ROOM-A",
        name: "Phòng họp A",
        capacity: 20,
        equipment: "Máy chiếu, màn hình, bảng trắng",
        status: "active"
      },
      {
        id: "ROOM-B",
        name: "Phòng họp B",
        capacity: 15,
        equipment: "TV, loa, micro",
        status: "active"
      },
      {
        id: "ROOM-C",
        name: "Phòng họp C",
        capacity: 10,
        equipment: "Bảng trắng",
        status: "active"
      }
    ]);
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
    end2.setHours(15, 30, 0, 0);

    saveMeetings([
      {
        id: "M-demo-1",
        title: "Họp Sprint Planning",
        roomId: "ROOM-A",
        roomName: "Phòng họp A",
        startTime: toDateTimeLocal(start1),
        endTime: toDateTimeLocal(end1),
        pass: "1234",
        capacity: 10,
        description: "Lập kế hoạch công việc cho Sprint mới.",
        creatorId: "U-emp-1",
        creatorName: "Nguyễn Văn A",
        creatorEmail: "nhanvien@xyz.com",
        participants: [],
        joinRequests: [],
        status: "Sắp diễn ra",
        manualStatus: false,
        createdAt: new Date().toISOString()
      },
      {
        id: "M-demo-2",
        title: "Họp đánh giá tiến độ",
        roomId: "ROOM-B",
        roomName: "Phòng họp B",
        startTime: toDateTimeLocal(start2),
        endTime: toDateTimeLocal(end2),
        pass: "abcd",
        capacity: 8,
        description: "Trao đổi tiến độ thực hiện dự án.",
        creatorId: "U-emp-2",
        creatorName: "Trần Thị B",
        creatorEmail: "tranthib@xyz.com",
        participants: [],
        joinRequests: [],
        status: "Sắp diễn ra",
        manualStatus: false,
        createdAt: new Date().toISOString()
      }
    ]);
  }
}

// =====================================================
// HELPERS
// =====================================================
function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
    box.textContent = "";
    box.className = "message hidden";
  }, 3500);
}

function renderStatus(status) {
  let className = "upcoming";

  if (status === "Đang diễn ra") className = "active";
  if (status === "Đã hoàn thành") className = "done";
  if (status === "Đã hủy") className = "cancelled";

  return `<span class="status ${className}">${status}</span>`;
}

function renderRoomStatus(status) {
  return status === "active"
    ? `<span class="status available">Đang hoạt động</span>`
    : `<span class="status inactive">Tạm ngưng</span>`;
}

function renderUserStatus(status) {
  return status === "active"
    ? `<span class="status approved">Đang hoạt động</span>`
    : `<span class="status locked">Đã khóa</span>`;
}

function renderRole(role) {
  return role === "admin"
    ? `<span class="badge admin">Admin</span>`
    : `<span class="badge employee">Nhân viên</span>`;
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

// Expose dynamic functions
window.openJoinModal = openJoinModal;
window.approveJoinRequest = approveJoinRequest;
window.rejectJoinRequest = rejectJoinRequest;

window.openMeetingModal = openMeetingModal;
window.openDetailModal = openDetailModal;
window.deleteMeeting = deleteMeeting;

window.openRoomModal = openRoomModal;
window.deleteRoom = deleteRoom;

window.openUserModal = openUserModal;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
