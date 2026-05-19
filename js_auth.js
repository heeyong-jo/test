// ==================== 로그인/회원가입/비밀번호 찾기 ====================


// 전역 변수
let authMode = 'login';
let idCheckTimer = null;


// ADMIN_ACCOUNTS 직접 정의
const ADMIN_ACCOUNTS = [
  { id: 'hamkke', pw: 'hamkke123', name: '김소녕 목사', role: 'admin', email: 'pastor@hamkke.church', phone: '010-9012-9947', birth: '1955-03-29' },
  { id: 'reodrino', pw: '232735a', name: '조희용 관리자', role: 'admin', email: 'reodrino@gmail.com', phone: '010-9797-1408', birth: '1981-08-27' }
];


// 저장된 데이터 불러오기
if (typeof LS !== 'undefined' && typeof LS.load === 'function') {
  try {
    var loaded_pending = LS.load('pendingUsers', []);
    var loaded_approved = LS.load('approvedUsers', []);
    if (loaded_pending && Array.isArray(loaded_pending)) {
      pendingUsers = loaded_pending;
    }
    if (loaded_approved && Array.isArray(loaded_approved)) {
      approvedUsers = loaded_approved;
    }
    console.log('회원 데이터 로드 완료 - 대기:', pendingUsers.length, '승인:', approvedUsers.length);
  } catch(e) {
    console.error('회원 데이터 로드 실패:', e);
  }
} else {
  console.warn('LS 객체 미정의 - localStorage 미사용');
}


// 로그인 폼 표시
function showLoginForm() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('signup-extra').style.display = 'none';
  document.getElementById('forgot-form').style.display = 'none';
  document.getElementById('login-err').style.display = 'none';
  document.getElementById('pending-msg').style.display = 'none';
  
  document.getElementById('auth-tab-login').style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;';
  document.getElementById('auth-tab-signup').style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;';
}


// 비밀번호 찾기 폼
function showForgotPw() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-extra').style.display = 'none';
  document.getElementById('forgot-form').style.display = 'block';
  document.getElementById('login-err').style.display = 'none';
}


// 로그인/회원가입 탭 전환
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
}


// 로그인/회원가입 제출
function doAuthSubmit() {
  if (authMode === 'login') {
    doLogin();
  } else {
    doSignup();
  }
}


// 로그인 처리
function doLogin() {
  const idEl = document.getElementById('li-id');
  const pwEl = document.getElementById('li-pw');
  const errDiv = document.getElementById('login-err');
  
  if (!idEl || !pwEl || !errDiv) {
    console.error('❌ 로그인 요소를 찾을 수 없음');
    return;
  }
  
  const id = idEl.value.trim();
  const pw = pwEl.value;
  
  errDiv.style.display = 'none';
  
  if (!id || !pw) {
    errDiv.textContent = '아이디와 비밀번호를 입력하세요';
    errDiv.style.display = 'block';
    return;
  }
  
  // 관리자 확인
  if (typeof ADMIN_ACCOUNTS === 'undefined') {
    console.error('❌ ADMIN_ACCOUNTS 정의되지 않음');
    return;
  }
  
  const admin = ADMIN_ACCOUNTS.find(a => a.id === id && a.pw === pw);
  if (admin) {
    console.log('✅ 관리자 로그인 성공:', admin.name);
    loginSuccess(admin);
    return;
  }
  
  // 일반 회원 확인
  if (!Array.isArray(approvedUsers)) {
    console.warn('⚠️ approvedUsers는 배열이 아님');
  }
  const user = approvedUsers && Array.isArray(approvedUsers) ? 
               approvedUsers.find(u => u.id === id && u.pw === pw) : null;
  if (user) {
    console.log('✅ 일반 회원 로그인 성공:', user.name);
    loginSuccess(user);
    return;
  }
  
  // 승인 대기 확인
  if (!Array.isArray(pendingUsers)) {
    console.warn('⚠️ pendingUsers는 배열이 아님');
  }
  const pending = pendingUsers && Array.isArray(pendingUsers) ? 
                  pendingUsers.find(u => u.id === id && u.pw === pw) : null;
  if (pending) {
    console.log('⏳ 승인 대기 중인 회원');
    document.getElementById('pending-msg').style.display = 'block';
    return;
  }
  
  console.error('❌ 로그인 실패 - 계정 불일치');
  errDiv.textContent = '아이디 또는 비밀번호가 일치하지 않습니다';
  errDiv.style.display = 'block';
}


// 로그인 성공 처리
function loginSuccess(acc) {
  console.log('🟢 loginSuccess 실행:', acc.name);
  
  currentUser = {
    id: acc.id,
    name: acc.name,
    role: acc.role || 'member',
    email: acc.email || '',
    phone: acc.phone || '',
    birth: acc.birth || ''
  };
  window.currentUser = currentUser;
  
  if (typeof LS !== 'undefined') {
    LS.save('logged', {
      id: acc.id,
      ts: Date.now(),
      name: acc.name
    });
  }
  
  const loginScreen = document.getElementById('screen-login');
  if (loginScreen) loginScreen.style.display = 'none';
  
  let roleText = '일반성도';
  if (window.currentUser.role === 'admin') roleText = '관리자';
  
  const userNameSpan = document.getElementById('user-name-display');
  const userRoleSpan = document.getElementById('user-role-display');
  
  if (userNameSpan) userNameSpan.textContent = acc.name;
  if (userRoleSpan) userRoleSpan.textContent = roleText;
  
  if (typeof applyRole === 'function') {
    applyRole(window.currentUser.role);
  }
  
  if (typeof showTab === 'function') {
    showTab(0);
  }
  
  if (typeof showToast === 'function') {
    showToast('✅ ' + acc.name + '님 환영합니다');
  }
}


// 로그아웃
function doLogout() {
  if (!confirm('로그아웃하시겠습니까?')) return;
  
  if (typeof LS !== 'undefined') LS.del('logged');
  
  currentUser = null;
  window.currentUser = null;
  
  const loginScreen = document.getElementById('screen-login');
  if (loginScreen) loginScreen.style.display = 'flex';
  
  if (typeof showTab === 'function') showTab(0);
  
  if (typeof showToast === 'function') {
    showToast('로그아웃되었습니다');
  }
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