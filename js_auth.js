// ==================== 로그인/회원가입/비밀번호 찾기 ====================


// 전역 변수
let authMode = 'login';
let idCheckTimer = null;


// ADMIN_ACCOUNTS 직접 정의 (독립적으로)
const ADMIN_ACCOUNTS = [
  { id: 'hamkke', pw: 'hamkke123', name: '김소녕 목사', role: 'admin', email: 'pastor@hamkke.church', phone: '010-9012-9947', birth: '1955-03-29' },
  { id: 'reodrino', pw: '232735a', name: '조희용 관리자', role: 'admin', email: 'reodrino@gmail.com', phone: '010-9797-1408', birth: '1981-08-27' }
];


// 회원 데이터
let pendingUsers = [];
let approvedUsers = [];


// 저장된 데이터 불러오기
if (typeof LS !== 'undefined') {
  try {
    pendingUsers = LS.load('pendingUsers', []);
    approvedUsers = LS.load('approvedUsers', []);
    console.log('회원 데이터 로드 완료');
  } catch(e) {}
}


// ==================== 로그인 화면 관련 함수 ====================


function showLoginForm() {
  console.log('showLoginForm');
  
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('signup-extra').style.display = 'none';
  document.getElementById('forgot-form').style.display = 'none';
  document.getElementById('login-err').style.display = 'none';
  document.getElementById('pending-msg').style.display = 'none';
  
  document.getElementById('auth-tab-login').style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;';
  document.getElementById('auth-tab-signup').style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;';
  
  authMode = 'login';
}


function showForgotPw() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-extra').style.display = 'none';
  document.getElementById('forgot-form').style.display = 'block';
  document.getElementById('login-err').style.display = 'none';
}


function switchAuthTab(mode) {
  authMode = mode;
  const isLogin = (mode === 'login');
  
  if (isLogin) {
    document.getElementById('auth-tab-login').style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;';
    document.getElementById('auth-tab-signup').style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-extra').style.display = 'none';
  } else {
    document.getElementById('auth-tab-login').style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;';
    document.getElementById('auth-tab-signup').style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-extra').style.display = 'block';
  }
  
  document.getElementById('forgot-form').style.display = 'none';
  document.getElementById('login-err').style.display = 'none';
  document.getElementById('pending-msg').style.display = 'none';
  const idmsg = document.getElementById('id-check-msg');
  if (idmsg) idmsg.textContent = '';
}


// ==================== 로그인/회원가입 제출 ====================


function doAuthSubmit() {
  console.log('doAuthSubmit 실행 - 모드:', authMode);
  
  if (authMode === 'login') {
    doLogin();
  } else {
    doSignup();
  }
}


// ==================== 로그인 처리 ====================


function doLogin() {
  console.log('doLogin 실행');
  
  const id = document.getElementById('li-id').value.trim();
  const pw = document.getElementById('li-pw').value;
  const errDiv = document.getElementById('login-err');
  
  errDiv.style.display = 'none';
  
  if (!id || !pw) {
    errDiv.textContent = '아이디와 비밀번호를 입력하세요';
    errDiv.style.display = 'block';
    return;
  }
  
  // 관리자 계정 확인
  const admin = ADMIN_ACCOUNTS.find(a => a.id === id && a.pw === pw);
  if (admin) {
    console.log('관리자 로그인 성공:', admin.name);
    loginSuccess(admin);
    return;
  }
  
  // 일반 회원 확인
  const user = approvedUsers.find(u => u.id === id && u.pw === pw);
  if (user) {
    console.log('일반 회원 로그인 성공:', user.name);
    loginSuccess(user);
    return;
  }
  
  // 승인 대기 확인
  const pending = pendingUsers.find(u => u.id === id && u.pw === pw);
  if (pending) {
    document.getElementById('pending-msg').style.display = 'block';
    return;
  }
  
  errDiv.textContent = '아이디 또는 비밀번호가 일치하지 않습니다';
  errDiv.style.display = 'block';
}


// ==================== 아이디 중복 확인 ====================


function checkIdDuplicate(val) {
  const msg = document.getElementById('id-check-msg');
  if (!msg) return;
  if (!val) {
    msg.textContent = '';
    return;
  }
  if (val.length < 4) {
    msg.style.color = '#fca5a5';
    msg.textContent = '아이디는 4자 이상 입력해주세요';
    return;
  }
  
  clearTimeout(idCheckTimer);
  idCheckTimer = setTimeout(() => {
    const taken = ADMIN_ACCOUNTS.find(a => a.id === val) || 
                  pendingUsers.find(u => u.id === val) || 
                  approvedUsers.find(u => u.id === val);
    if (taken) {
      msg.style.color = '#fca5a5';
      msg.textContent = '❌ 이미 사용 중인 아이디입니다';
    } else {
      msg.style.color = '#86efac';
      msg.textContent = '✅ 사용 가능한 아이디입니다';
    }
  }, 400);
}


// ==================== 비밀번호 찾기 ====================


function doResetPassword() {
  const id = document.getElementById('forgot-id').value.trim();
  const email = document.getElementById('forgot-email').value.trim();
  const phoneRaw = document.getElementById('forgot-phone').value.trim();
  const phone = phoneRaw.replace(/-/g, '');
  const errDiv = document.getElementById('login-err');
  
  errDiv.style.display = 'none';
  
  if (!id || !email || !phone) {
    errDiv.textContent = '아이디, 이메일, 전화번호를 모두 입력하세요';
    errDiv.style.display = 'block';
    return;
  }
  
  // 관리자 계정 찾기
  const admin = ADMIN_ACCOUNTS.find(a => a.id === id && a.email === email && (a.phone || '').replace(/-/g, '') === phone);
  if (admin) {
    const tmpPw = 'hamkke' + Math.floor(1000 + Math.random() * 9000);
    admin.pw = tmpPw;
    showLoginForm();
    setTimeout(() => {
      errDiv.style.background = 'rgba(134,239,172,0.15)';
      errDiv.style.color = '#86efac';
      errDiv.textContent = '임시 비밀번호: ' + tmpPw + ' (로그인 후 변경하세요)';
      errDiv.style.display = 'block';
    }, 300);
    return;
  }
  
  // 일반 회원 찾기
  const user = approvedUsers.find(u => u.id === id && u.email === email && (u.phone || '').replace(/-/g, '') === phone);
  if (!user) {
    errDiv.textContent = '입력한 정보와 일치하는 회원이 없습니다';
    errDiv.style.display = 'block';
    return;
  }
  
  const tmpPw = 'hamkke' + Math.floor(1000 + Math.random() * 9000);
  user.pw = tmpPw;
  if (typeof LS !== 'undefined') LS.save('approvedUsers', approvedUsers);
  showLoginForm();
  setTimeout(() => {
    errDiv.style.background = 'rgba(134,239,172,0.15)';
    errDiv.style.color = '#86efac';
    errDiv.textContent = '임시 비밀번호: ' + tmpPw + ' (로그인 후 변경하세요)';
    errDiv.style.display = 'block';
  }, 300);
}


// ==================== 회원가입 ====================


function doSignup() {
  const signupId = document.getElementById('su-id').value.trim();
  const pw = document.getElementById('su-pw').value;
  const pw2 = document.getElementById('su-pw2').value;
  const name = document.getElementById('su-name').value.trim();
  const phone = document.getElementById('su-phone').value.trim();
  const birth = document.getElementById('su-birth').value;
  const email = document.getElementById('su-email').value.trim();
  const errDiv = document.getElementById('login-err');
  const msg = document.getElementById('id-check-msg');
  
  errDiv.style.display = 'none';
  
  if (!signupId || !pw || !name) {
    errDiv.textContent = '아이디, 이름, 비밀번호를 모두 입력하세요';
    errDiv.style.display = 'block';
    return;
  }
  if (signupId.length < 4) {
    errDiv.textContent = '아이디는 4자 이상이어야 합니다';
    errDiv.style.display = 'block';
    return;
  }
  if (pw.length < 4) {
    errDiv.textContent = '비밀번호는 4자 이상이어야 합니다';
    errDiv.style.display = 'block';
    return;
  }
  if (pw !== pw2) {
    errDiv.textContent = '비밀번호가 일치하지 않습니다';
    errDiv.style.display = 'block';
    return;
  }
  if (msg && !msg.textContent.includes('✅')) {
    errDiv.textContent = '아이디 중복 확인을 해주세요';
    errDiv.style.display = 'block';
    return;
  }
  
  // 중복 확인
  if (ADMIN_ACCOUNTS.find(a => a.id === signupId) || 
      pendingUsers.find(u => u.id === signupId) || 
      approvedUsers.find(u => u.id === signupId)) {
    errDiv.textContent = '이미 사용 중인 아이디입니다';
    errDiv.style.display = 'block';
    return;
  }
  
  // 가입 신청
  const joinDate = new Date().toISOString().slice(0, 10);
  pendingUsers.push({
    id: signupId, pw: pw, name: name, email: email, phone: phone, birth: birth,
    role: 'member', status: 'pending', ts: Date.now(), joinDate: joinDate
  });
  
  if (typeof LS !== 'undefined') LS.save('pendingUsers', pendingUsers);
  
  // 입력 필드 초기화
  document.getElementById('su-id').value = '';
  document.getElementById('su-pw').value = '';
  document.getElementById('su-pw2').value = '';
  document.getElementById('su-name').value = '';
  document.getElementById('su-email').value = '';
  document.getElementById('su-phone').value = '';
  document.getElementById('su-birth').value = '';
  
  switchAuthTab('login');
  document.getElementById('pending-msg').style.display = 'block';
  showToast('✅ 가입 신청이 완료되었습니다');
}


// ==================== 로그인 성공 처리 ====================


function loginSuccess(acc) {
  console.log('loginSuccess 실행:', acc.name);
  
  // 현재 사용자 설정


currentUser = {
  id: acc.id,
  name: acc.name,
  role: acc.role || 'member',
  email: acc.email || '',
  phone: acc.phone || '',
  birth: acc.birth || ''
};
window.currentUser = currentUser;  
 
  // 로그인 정보 저장
  if (typeof LS !== 'undefined') {
    LS.save('logged', {
      id: acc.id,
      ts: Date.now(),
      name: acc.name
    });
  }
  
  // 로그인 화면 닫기
  const loginScreen = document.getElementById('screen-login');
  if (loginScreen) loginScreen.style.display = 'none';
  
  // 사용자 정보 표시
  let roleText = '일반성도';
  if (window.currentUser.role === 'admin') roleText = '관리자';
  else if (window.currentUser.role === 'manager') roleText = '매니저';
  
  const userNameSpan = document.getElementById('user-name-display');
  const userRoleSpan = document.getElementById('user-role-display');
  const settingInfoSpan = document.getElementById('setting-user-info');
  
  if (userNameSpan) userNameSpan.textContent = acc.name;
  if (userRoleSpan) userRoleSpan.textContent = roleText;
  if (settingInfoSpan) settingInfoSpan.textContent = acc.name + ' (' + roleText + ')';
  
  // 권한 적용
  if (typeof applyRole === 'function') {
    applyRole(window.currentUser.role);
  }
  
  // 홈 탭 이동
  if (typeof showTab === 'function') {
    showTab(0);
  }
  
  showToast('✅ ' + acc.name + '님 환영합니다');
}


// ==================== 로그아웃 ====================


function doLogout() {
  if (!confirm('로그아웃하시겠습니까?')) return;
  
  if (typeof LS !== 'undefined') LS.del('logged');
  
  currentUser = null;
window.currentUser = null;  
  
  const loginScreen = document.getElementById('screen-login');
  if (loginScreen) loginScreen.style.display = 'flex';
  
  if (typeof showTab === 'function') showTab(0);
  
  showToast('로그아웃되었습니다');
}


// ==================== 프로필 드롭다운 ====================


function toggleProfileDropdown() {
  const dropdown = document.getElementById('profile-dropdown');
  if (!dropdown) return;
  
  dropdown.classList.toggle('show');
  
  setTimeout(() => {
    const closeDropdown = function(e) {
      if (!dropdown.contains(e.target) && !e.target.closest('.user-badge')) {
        dropdown.classList.remove('show');
        document.removeEventListener('click', closeDropdown);
      }
    };
    document.addEventListener('click', closeDropdown);
  }, 0);
}


// ==================== 내 정보 ====================


function openMyProfile() {
  if (!window.currentUser) {
    showToast('로그인이 필요합니다');
    return;
  }
  
  let userInfo = ADMIN_ACCOUNTS.find(a => a.id === window.currentUser.id) || 
                 approvedUsers.find(u => u.id === window.currentUser.id);
  
  if (!userInfo) {
    showToast('사용자 정보를 찾을 수 없습니다');
    return;
  }
  
  document.getElementById('my-pv-name').textContent = userInfo.name || window.currentUser.name;
  document.getElementById('my-pv-email').textContent = userInfo.email || '등록된 이메일 없음';
  document.getElementById('my-pv-phone').textContent = userInfo.phone || '등록된 전화번호 없음';
  document.getElementById('my-pv-birth').textContent = userInfo.birth || '등록된 생년월일 없음';
  document.getElementById('my-profile-view').style.display = 'block';
  document.getElementById('my-profile-edit').style.display = 'none';
  document.getElementById('modal-my-profile').style.display = 'flex';
}


function openEditMyProfile() {
  if (!window.currentUser) return;
  
  let userInfo = ADMIN_ACCOUNTS.find(a => a.id === window.currentUser.id) || 
                 approvedUsers.find(u => u.id === window.currentUser.id);
  if (!userInfo) return;
  
  document.getElementById('my-em-name').value = userInfo.name || '';
  document.getElementById('my-em-phone').value = userInfo.phone || '';
  document.getElementById('my-em-birth').value = userInfo.birth || '';
  document.getElementById('my-profile-view').style.display = 'none';
  document.getElementById('my-profile-edit').style.display = 'block';
}


function saveMyProfile() {
  if (!window.currentUser) return;
  
  const newName = document.getElementById('my-em-name').value.trim();
  const newPhone = document.getElementById('my-em-phone').value.trim();
  const newBirth = document.getElementById('my-em-birth').value;
  
  if (!newName) {
    showToast('이름을 입력하세요');
    return;
  }
  
  const adminIdx = ADMIN_ACCOUNTS.findIndex(a => a.id === window.currentUser.id);
  if (adminIdx !== -1) {
    ADMIN_ACCOUNTS[adminIdx].name = newName;
    ADMIN_ACCOUNTS[adminIdx].phone = newPhone;
    ADMIN_ACCOUNTS[adminIdx].birth = newBirth;
    window.currentUser.name = newName;
  } else {
    const userIdx = approvedUsers.findIndex(u => u.id === window.currentUser.id);
    if (userIdx !== -1) {
      approvedUsers[userIdx].name = newName;
      approvedUsers[userIdx].phone = newPhone;
      approvedUsers[userIdx].birth = newBirth;
      if (typeof LS !== 'undefined') LS.save('approvedUsers', approvedUsers);
      window.currentUser.name = newName;
    }
  }
  
  document.getElementById('user-name-display').textContent = newName;
  let roleText = '일반성도';
  if (window.currentUser.role === 'admin') roleText = '관리자';
  document.getElementById('setting-user-info').textContent = newName + ' (' + roleText + ')';
  
  closeModal('modal-my-profile');
  showToast('✅ 내 정보가 수정되었습니다');
}


function cancelEditMyProfile() {
  document.getElementById('my-profile-view').style.display = 'block';
  document.getElementById('my-profile-edit').style.display = 'none';
}


// ==================== 비밀번호 변경 ====================


function openChangePassword() {
  if (!window.currentUser) {
    showToast('로그인이 필요합니다');
    return;
  }
  
  document.getElementById('cpw-current').value = '';
  document.getElementById('cpw-new').value = '';
  document.getElementById('cpw-confirm').value = '';
  document.getElementById('modal-change-pw').style.display = 'flex';
}


function changePassword() {
  const currentPw = document.getElementById('cpw-current').value;
  const newPw = document.getElementById('cpw-new').value;
  const confirmPw = document.getElementById('cpw-confirm').value;
  
  if (!currentPw || !newPw || !confirmPw) {
    showToast('모든 항목을 입력하세요');
    return;
  }
  if (newPw.length < 4) {
    showToast('새 비밀번호는 4자 이상이어야 합니다');
    return;
  }
  if (newPw !== confirmPw) {
    showToast('새 비밀번호가 일치하지 않습니다');
    return;
  }
  
  const admin = ADMIN_ACCOUNTS.find(a => a.id === window.currentUser.id && a.pw === currentPw);
  if (admin) {
    admin.pw = newPw;
    showToast('✅ 비밀번호가 변경되었습니다');
    closeModal('modal-change-pw');
    return;
  }
  
  const user = approvedUsers.find(u => u.id === window.currentUser.id && u.pw === currentPw);
  if (user) {
    user.pw = newPw;
    if (typeof LS !== 'undefined') LS.save('approvedUsers', approvedUsers);
    showToast('✅ 비밀번호가 변경되었습니다');
    closeModal('modal-change-pw');
    return;
  }
  
  showToast('현재 비밀번호가 일치하지 않습니다');
}


// 디버깅
console.log('js_auth.js 로드 완료');
console.log('doLogin 함수:', typeof doLogin);
console.log('doAuthSubmit 함수:', typeof doAuthSubmit);