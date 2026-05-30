// js_auth.js - 전체를 이 코드로 교체
// ==================== 로그인/회원가입/비밀번호 찾기 ====================


// 전역 변수 안전하게 초기화 (모든 var 선언을 window 객체에 직접 할당)
if (typeof window.pendingUsers === 'undefined') window.pendingUsers = [];
if (typeof window.approvedUsers === 'undefined') window.approvedUsers = [];
if (typeof window.authMode === 'undefined') window.authMode = 'login';
if (typeof window.idCheckTimer === 'undefined') window.idCheckTimer = null;
if (typeof window.currentUser === 'undefined') window.currentUser = null;


// 전역 변수로 복사 (편의상)
var pendingUsers = window.pendingUsers;
var approvedUsers = window.approvedUsers;
var authMode = window.authMode;
var idCheckTimer = window.idCheckTimer;
var currentUser = window.currentUser;


// ADMIN_ACCOUNTS는 js_confige.js에서 이미 선언됨 (재선언하지 않음)


// LS가 정의되어 있을 때만 데이터 로드
if (typeof LS !== 'undefined') {
  try {
    var loadedPending = LS.load('pendingUsers', []);
    var loadedApproved = LS.load('approvedUsers', []);
    if (loadedPending && Array.isArray(loadedPending)) {
      window.pendingUsers = loadedPending;
      pendingUsers = window.pendingUsers;
    }
    if (loadedApproved && Array.isArray(loadedApproved)) {
      window.approvedUsers = loadedApproved;
      approvedUsers = window.approvedUsers;
    }
    console.log('회원 데이터 로드 완료 - 승인대기:', pendingUsers.length, '승인완료:', approvedUsers.length);
  } catch(e) {
    console.error('회원 데이터 로드 실패:', e);
  }
}


// 로그인 폼 표시
window.showLoginForm = function() {
  console.log('showLoginForm 호출됨');
  var loginForm = document.getElementById('login-form');
  var signupExtra = document.getElementById('signup-extra');
  var forgotForm = document.getElementById('forgot-form');
  var loginErr = document.getElementById('login-err');
  var pendingMsg = document.getElementById('pending-msg');
  var authTabLogin = document.getElementById('auth-tab-login');
  var authTabSignup = document.getElementById('auth-tab-signup');
  
  if (loginForm) loginForm.style.display = 'block';
  if (signupExtra) signupExtra.style.display = 'none';
  if (forgotForm) forgotForm.style.display = 'none';
  if (loginErr) loginErr.style.display = 'none';
  if (pendingMsg) pendingMsg.style.display = 'none';
  if (authTabLogin) {
    authTabLogin.style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;';
  }
  if (authTabSignup) {
    authTabSignup.style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;';
  }
  window.authMode = 'login';
  authMode = window.authMode;
};


// 비밀번호 찾기 폼 표시
window.showForgotPw = function() {
  console.log('showForgotPw 호출됨');
  var loginForm = document.getElementById('login-form');
  var signupExtra = document.getElementById('signup-extra');
  var forgotForm = document.getElementById('forgot-form');
  var loginErr = document.getElementById('login-err');
  
  if (loginForm) loginForm.style.display = 'none';
  if (signupExtra) signupExtra.style.display = 'none';
  if (forgotForm) forgotForm.style.display = 'block';
  if (loginErr) loginErr.style.display = 'none';
};


// 로그인/회원가입 탭 전환
window.switchAuthTab = function(mode) {
  console.log('switchAuthTab 호출됨:', mode);
  window.authMode = mode;
  authMode = window.authMode;
  var isLogin = mode === 'login';
  var authTabLogin = document.getElementById('auth-tab-login');
  var authTabSignup = document.getElementById('auth-tab-signup');
  var loginForm = document.getElementById('login-form');
  var signupExtra = document.getElementById('signup-extra');
  var forgotForm = document.getElementById('forgot-form');
  var loginErr = document.getElementById('login-err');
  var pendingMsg = document.getElementById('pending-msg');
  var idCheckMsg = document.getElementById('id-check-msg');
  
  if (authTabLogin) {
    authTabLogin.style.cssText = isLogin ? 
      'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;' : 
      'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;';
  }
  if (authTabSignup) {
    authTabSignup.style.cssText = isLogin ? 
      'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;' : 
      'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;';
  }
  if (loginForm) loginForm.style.display = isLogin ? 'block' : 'none';
  if (signupExtra) signupExtra.style.display = isLogin ? 'none' : 'block';
  if (forgotForm) forgotForm.style.display = 'none';
  if (loginErr) loginErr.style.display = 'none';
  if (pendingMsg) pendingMsg.style.display = 'none';
  if (idCheckMsg) idCheckMsg.textContent = '';
};


// 로그인/회원가입 제출
window.doAuthSubmit = function() {
  console.log('doAuthSubmit 호출됨, authMode:', authMode);
  if (authMode === 'login') window.doLogin();
  else window.doSignup();
};


// 로그인 처리
window.doLogin = function() {
  console.log('doLogin 호출됨');
  var idInput = document.getElementById('li-id');
  var pwInput = document.getElementById('li-pw');
  var errDiv = document.getElementById('login-err');
  
  if (!idInput || !pwInput || !errDiv) {
    console.error('로그인 폼 요소를 찾을 수 없습니다');
    return;
  }
  
  var id = idInput.value.trim();
  var pw = pwInput.value;
  errDiv.style.display = 'none';
  
  if (!id || !pw) {
    errDiv.textContent = '아이디와 비밀번호를 입력하세요';
    errDiv.style.display = 'block';
    return;
  }
  
  // ADMIN_ACCOUNTS 확인 (js_confige.js에서 선언됨)
  if (typeof ADMIN_ACCOUNTS !== 'undefined') {
    var admin = ADMIN_ACCOUNTS.find(function(a) { return a.id === id && a.pw === pw; });
    if (admin) {
      window.loginSuccess(admin);
      return;
    }
  }
  
  // 승인된 일반 회원 확인
  var user = window.approvedUsers.find(function(u) { return u.id === id && u.pw === pw; });
  if (user) {
    window.loginSuccess(user);
    return;
  }
  
  // 승인 대기 중인 회원 확인
  var pending = window.pendingUsers.find(function(u) { return u.id === id && u.pw === pw; });
  if (pending) {
    var pendingMsg = document.getElementById('pending-msg');
    if (pendingMsg) pendingMsg.style.display = 'block';
    return;
  }
  
  errDiv.textContent = '아이디 또는 비밀번호가 일치하지 않습니다';
  errDiv.style.display = 'block';
};


// 로그인 성공 처리
window.loginSuccess = function(acc) {
  console.log('loginSuccess 실행:', acc.name);
  
  window.currentUser = {
    id: acc.id,
    name: acc.name,
    role: acc.role || 'member',
    email: acc.email || '',
    phone: acc.phone || '',
    birth: acc.birth || ''
  };
  currentUser = window.currentUser;
  
  if (typeof LS !== 'undefined') {
    LS.save('logged', {
      id: acc.id,
      ts: Date.now(),
      email: acc.email || '',
      phone: acc.phone || '',
      birth: acc.birth || '',
      name: acc.name
    });
  }
  
  var loginScreen = document.getElementById('screen-login');
  if (loginScreen) loginScreen.style.display = 'none';
  
  var roleText = (typeof roleLabel !== 'undefined' && roleLabel[window.currentUser.role]) ? roleLabel[window.currentUser.role] : (window.currentUser.role === 'admin' ? '관리자' : '일반성도');
  var userNameSpan = document.getElementById('user-name-display');
  var userRoleSpan = document.getElementById('user-role-display');
  var settingInfoSpan = document.getElementById('setting-user-info');
  
  if (userNameSpan) userNameSpan.textContent = acc.name;
  if (userRoleSpan) userRoleSpan.textContent = roleText;
  if (settingInfoSpan) settingInfoSpan.textContent = acc.name + ' (' + roleText + ')';
  
  if (typeof applyRole === 'function') {
    applyRole(window.currentUser.role);
  }
  
  window.currentTab = -1;
  
  for (var i = 0; i < 7; i++) {
    var page = document.getElementById('p' + i);
    if (page) page.classList.remove('show');
  }
  
  document.querySelectorAll('.tab').forEach(function(t) { return t.classList.remove('active'); });
  
  setTimeout(function() {
    if (typeof showTab === 'function') showTab(0);
  }, 50);
  
  if (window.FB_READY && typeof fbLoadAll === 'function') {
    fbLoadAll().catch(function(e) { console.error('Firebase 데이터 로드 실패:', e); });
  }
  
  setTimeout(function() {
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
    if (typeof renderHomeNotices === 'function') renderHomeNotices();
  }, 100);
  
  if (typeof showToast === 'function') showToast('✅ ' + acc.name + '님 환영합니다');
  else alert('✅ ' + acc.name + '님 환영합니다');
};


// 회원가입 신청
window.doSignup = function() {
  console.log('doSignup 호출됨');
  var suIdEl = document.getElementById('su-id');
  var suPwEl = document.getElementById('su-pw');
  var suPw2El = document.getElementById('su-pw2');
  var suNameEl = document.getElementById('su-name');
  var suPhoneEl = document.getElementById('su-phone');
  var suBirthEl = document.getElementById('su-birth');
  var suEmailEl = document.getElementById('su-email');
  var errDiv = document.getElementById('login-err');
  var msg = document.getElementById('id-check-msg');
  
  if (!suIdEl || !suPwEl || !suPw2El || !suNameEl || !errDiv) return;
  
  var signupId = suIdEl.value.trim();
  var pw = suPwEl.value;
  var pw2 = suPw2El.value;
  var name = suNameEl.value.trim();
  var phone = suPhoneEl ? suPhoneEl.value.trim() : '';
  var birth = suBirthEl ? suBirthEl.value : '';
  var email = suEmailEl ? suEmailEl.value.trim() : '';
  
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
  
  // ADMIN_ACCOUNTS 확인
  var idExists = false;
  if (typeof ADMIN_ACCOUNTS !== 'undefined') {
    idExists = ADMIN_ACCOUNTS.some(function(a) { return a.id === signupId; });
  }
  if (idExists || window.pendingUsers.some(function(u) { return u.id === signupId; }) || window.approvedUsers.some(function(u) { return u.id === signupId; })) {
    errDiv.textContent = '이미 사용 중인 아이디입니다';
    errDiv.style.display = 'block';
    return;
  }
  
  var joinDate = new Date().toISOString().slice(0, 10);
  window.pendingUsers.push({
    id: signupId, pw: pw, name: name, email: email, phone: phone, birth: birth,
    role: 'member', status: 'pending', ts: Date.now(), joinDate: joinDate
  });
  
  if (typeof LS !== 'undefined') {
    LS.save('pendingUsers', window.pendingUsers);
  }
  
  suIdEl.value = '';
  if (suPwEl) suPwEl.value = '';
  if (suPw2El) suPw2El.value = '';
  if (suNameEl) suNameEl.value = '';
  if (suEmailEl) suEmailEl.value = '';
  if (suPhoneEl) suPhoneEl.value = '';
  if (suBirthEl) suBirthEl.value = '';
  
  window.switchAuthTab('login');
  var pendingMsg = document.getElementById('pending-msg');
  if (pendingMsg) pendingMsg.style.display = 'block';
  if (typeof showToast === 'function') showToast('✅ 가입 신청이 완료되었습니다');
  else alert('✅ 가입 신청이 완료되었습니다');
};


// 비밀번호 재설정
window.doResetPassword = function() {
  console.log('doResetPassword 호출됨');
  var idInput = document.getElementById('forgot-id');
  var emailInput = document.getElementById('forgot-email');
  var phoneInput = document.getElementById('forgot-phone');
  var errDiv = document.getElementById('login-err');
  
  if (!idInput || !emailInput || !phoneInput || !errDiv) return;
  
  var id = idInput.value.trim();
  var email = emailInput.value.trim();
  var phoneRaw = phoneInput.value.trim();
  var phone = phoneRaw.replace(/-/g, '');
  
  errDiv.style.display = 'none';
  
  if (!id || !email || !phone) {
    errDiv.textContent = '아이디, 이메일, 전화번호를 모두 입력하세요';
    errDiv.style.display = 'block';
    return;
  }
  
  // 관리자 계정 검색
  if (typeof ADMIN_ACCOUNTS !== 'undefined') {
    var admin = ADMIN_ACCOUNTS.find(function(a) { return a.id === id && a.email === email && (a.phone || '').replace(/-/g, '') === phone; });
    if (admin) {
      var tmpPw = 'gajwajeil' + Math.floor(1000 + Math.random() * 9000);
      admin.pw = tmpPw;
      window.showLoginForm();
      setTimeout(function() {
        errDiv.style.background = 'rgba(134,239,172,0.15)';
        errDiv.style.color = '#86efac';
        errDiv.textContent = '임시 비밀번호: ' + tmpPw + ' (로그인 후 변경하세요)';
        errDiv.style.display = 'block';
      }, 300);
      return;
    }
  }
  
  // 일반 회원 검색
  var user = window.approvedUsers.find(function(u) { return u.id === id && u.email === email && (u.phone || '').replace(/-/g, '') === phone; });
  if (!user) {
    errDiv.textContent = '입력한 정보와 일치하는 회원이 없습니다';
    errDiv.style.display = 'block';
    return;
  }
  
  var tmpPw = 'gajwajeil' + Math.floor(1000 + Math.random() * 9000);
  user.pw = tmpPw;
  if (typeof LS !== 'undefined') {
    LS.save('approvedUsers', window.approvedUsers);
  }
  window.showLoginForm();
  setTimeout(function() {
    errDiv.style.background = 'rgba(134,239,172,0.15)';
    errDiv.style.color = '#86efac';
    errDiv.textContent = '임시 비밀번호: ' + tmpPw + ' (로그인 후 변경하세요)';
    errDiv.style.display = 'block';
  }, 300);
};


// 아이디 중복 확인
window.checkIdDuplicate = function(val) {
  var msg = document.getElementById('id-check-msg');
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
  
  clearTimeout(window.idCheckTimer);
  window.idCheckTimer = setTimeout(function() {
    var taken = false;
    if (typeof ADMIN_ACCOUNTS !== 'undefined') {
      taken = ADMIN_ACCOUNTS.some(function(a) { return a.id === val; });
    }
    taken = taken || window.pendingUsers.some(function(u) { return u.id === val; }) || window.approvedUsers.some(function(u) { return u.id === val; });
    if (taken) {
      msg.style.color = '#fca5a5';
      msg.textContent = '❌ 이미 사용 중인 아이디입니다';
    } else {
      msg.style.color = '#86efac';
      msg.textContent = '✅ 사용 가능한 아이디입니다';
    }
  }, 400);
};


// 로그아웃
window.doLogout = function() {
  if (!confirm('로그아웃하시겠습니까?')) return;
  
  if (typeof LS !== 'undefined') {
    LS.del('logged');
  }
  
  window.currentUser = null;
  currentUser = null;
  
  window.switchAuthTab('login');
  
  var loginScreen = document.getElementById('screen-login');
  if (loginScreen) loginScreen.style.display = 'flex';
  
  if (typeof showTab === 'function') {
    showTab(0);
  }
  
  if (typeof showToast === 'function') showToast('로그아웃되었습니다');
  else alert('로그아웃되었습니다');
};


// 페이지 로드 시 자동 복원
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (typeof restoreLogin === 'function') restoreLogin();
      else console.log('restoreLogin 함수 없음');
    }, 100);
  });
} else {
  setTimeout(function() {
    if (typeof restoreLogin === 'function') restoreLogin();
  }, 100);
}


console.log('✅ js_auth.js 로드 완료');