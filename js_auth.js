// ==================== 로그인/회원가입/비밀번호 찾기 ====================


// 전역 변수 선언 (필수!)
let authMode = 'login';        // ← 추가
let idCheckTimer = null;       // ← 추가


// 전역 변수 안전하게 초기화
if (typeof pendingUsers === 'undefined') {
  var pendingUsers = [];
}
if (typeof approvedUsers === 'undefined') {
  var approvedUsers = [];
}


// LS가 정의되어 있을 때만 데이터 로드
if (typeof LS !== 'undefined') {
  try {
    var loadedPending = LS.load('pendingUsers', []);
    var loadedApproved = LS.load('approvedUsers', []);
    if (loadedPending && Array.isArray(loadedPending)) pendingUsers = loadedPending;
    if (loadedApproved && Array.isArray(loadedApproved)) approvedUsers = loadedApproved;
    console.log('회원 데이터 로드 완료 - 승인대기:', pendingUsers.length, '승인완료:', approvedUsers.length);
  } catch(e) {
    console.error('회원 데이터 로드 실패:', e);
  }
}


// 로그인 폼 표시
function showLoginForm() {
  console.log('showLoginForm 호출됨');
  
  const loginForm = document.getElementById('login-form');
  const signupExtra = document.getElementById('signup-extra');
  const forgotForm = document.getElementById('forgot-form');
  const loginErr = document.getElementById('login-err');
  const pendingMsg = document.getElementById('pending-msg');
  const authTabLogin = document.getElementById('auth-tab-login');
  const authTabSignup = document.getElementById('auth-tab-signup');
  
  if (loginForm) loginForm.style.display = 'block';
  if (signupExtra) signupExtra.style.display = 'none';
  if (forgotForm) forgotForm.style.display = 'none';
  if (loginErr) loginErr.style.display = 'none';
  if (pendingMsg) pendingMsg.style.display = 'none';
  
  if (authTabLogin) {
    authTabLogin.style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;cursor:pointer;';
  }
  if (authTabSignup) {
    authTabSignup.style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;cursor:pointer;';
  }
  
  authMode = 'login';
  
// 비밀번호 찾기 폼 표시
function showForgotPw() {
  const loginForm = document.getElementById('login-form');
  const signupExtra = document.getElementById('signup-extra');
  const forgotForm = document.getElementById('forgot-form');
  const loginErr = document.getElementById('login-err');
  
  if (loginForm) loginForm.style.display = 'none';
  if (signupExtra) signupExtra.style.display = 'none';
  if (forgotForm) forgotForm.style.display = 'block';
  if (loginErr) loginErr.style.display = 'none';
}


// 로그인/회원가입 탭 전환
function switchAuthTab(mode) {
  authMode = mode;
  const isLogin = mode === 'login';
  const authTabLogin = document.getElementById('auth-tab-login');
  const authTabSignup = document.getElementById('auth-tab-signup');
  const loginForm = document.getElementById('login-form');
  const signupExtra = document.getElementById('signup-extra');
  const forgotForm = document.getElementById('forgot-form');
  const loginErr = document.getElementById('login-err');
  const pendingMsg = document.getElementById('pending-msg');
  const idCheckMsg = document.getElementById('id-check-msg');
  
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
}


// 로그인/회원가입 제출
function doAuthSubmit() {
  if (authMode === 'login') doLogin();
  else doSignup();
}


// 로그인 처리 (안전하게 수정)
function doLogin() {
  console.log('doLogin 호출됨');
  
  const id = document.getElementById('li-id').value.trim();
  const pw = document.getElementById('li-pw').value;
  const errDiv = document.getElementById('login-err');
  
  if (!id || !pw) {
    if (errDiv) {
      errDiv.textContent = '아이디와 비밀번호를 입력하세요';
      errDiv.style.display = 'block';
    }
    return;
  }
  
  if (errDiv) errDiv.style.display = 'none';
  
  // ✅ ADMIN_ACCOUNTS 안전하게 찾기
  let accounts = null;
  if (typeof ADMIN_ACCOUNTS !== 'undefined') accounts = ADMIN_ACCOUNTS;
  else if (typeof window.ADMIN_ACCOUNTS !== 'undefined') accounts = window.ADMIN_ACCOUNTS;
  
  if (!accounts) {
    // 백업 계정
    accounts = [
      { id: 'hamkke', pw: 'hamkke123', name: '김소녕 목사', role: 'admin', email: 'pastor@hamkke.church', phone: '010-9012-9947', birth: '1955-03-29' },
      { id: 'reodrino', pw: '232735a', name: '조희용 관리자', role: 'admin', email: 'reodrino@gmail.com', phone: '010-9797-1408', birth: '1981-08-27' }
    ];
    window.ADMIN_ACCOUNTS = accounts;
  }
  
  console.log('ADMIN_ACCOUNTS:', accounts);
  
  const admin = accounts.find(a => a.id === id && a.pw === pw);
  if (admin) {
    loginSuccess(admin);
    return;
  }
  
  // 일반 회원 확인
  if (typeof approvedUsers !== 'undefined') {
    const user = approvedUsers.find(u => u.id === id && u.pw === pw);
    if (user) {
      loginSuccess(user);
      return;
    }
  }
  
  // 승인 대기 확인
  if (typeof pendingUsers !== 'undefined') {
    const pending = pendingUsers.find(u => u.id === id && u.pw === pw);
    if (pending) {
      const pendingMsg = document.getElementById('pending-msg');
      if (pendingMsg) pendingMsg.style.display = 'block';
      return;
    }
  }
  
  if (errDiv) {
    errDiv.textContent = '아이디 또는 비밀번호가 일치하지 않습니다';
    errDiv.style.display = 'block';
  }
}


// 아이디 중복 확인
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
    const adminTaken = (typeof ADMIN_ACCOUNTS !== 'undefined') ? 
                       ADMIN_ACCOUNTS.find(a => a.id === val) : null;
    const taken = adminTaken || 
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


// 비밀번호 재설정
function doResetPassword() {
  const idInput = document.getElementById('forgot-id');
  const emailInput = document.getElementById('forgot-email');
  const phoneInput = document.getElementById('forgot-phone');
  const errDiv = document.getElementById('login-err');
  
  if (!idInput || !emailInput || !phoneInput || !errDiv) return;
  
  const id = idInput.value.trim();
  const email = emailInput.value.trim();
  const phoneRaw = phoneInput.value.trim();
  const phone = phoneRaw.replace(/-/g, '');
  
  errDiv.style.display = 'none';
  
  if (!id || !email || !phone) {
    errDiv.textContent = '아이디, 이메일, 전화번호를 모두 입력하세요';
    errDiv.style.display = 'block';
    return;
  }
  
  // 관리자 계정 검색
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
  
  // 일반 회원 검색
  const user = approvedUsers.find(u => u.id === id && u.email === email && (u.phone || '').replace(/-/g, '') === phone);
  if (!user) {
    errDiv.textContent = '입력한 정보와 일치하는 회원이 없습니다';
    errDiv.style.display = 'block';
    return;
  }
  
  const tmpPw = 'hamkke' + Math.floor(1000 + Math.random() * 9000);
  user.pw = tmpPw;
  if (typeof LS !== 'undefined') {
    LS.save('approvedUsers', approvedUsers);
  }
  showLoginForm();
  setTimeout(() => {
    errDiv.style.background = 'rgba(134,239,172,0.15)';
    errDiv.style.color = '#86efac';
    errDiv.textContent = '임시 비밀번호: ' + tmpPw + ' (로그인 후 변경하세요)';
    errDiv.style.display = 'block';
  }, 300);
}


// 회원가입 신청
function doSignup() {
  const suIdEl = document.getElementById('su-id');
  const suPwEl = document.getElementById('su-pw');
  const suPw2El = document.getElementById('su-pw2');
  const suNameEl = document.getElementById('su-name');
  const suPhoneEl = document.getElementById('su-phone');
  const suBirthEl = document.getElementById('su-birth');
  const suEmailEl = document.getElementById('su-email');
  const errDiv = document.getElementById('login-err');
  const msg = document.getElementById('id-check-msg');
  
  if (!suIdEl || !suPwEl || !suPw2El || !suNameEl || !errDiv) return;
  
  const signupId = suIdEl.value.trim();
  const pw = suPwEl.value;
  const pw2 = suPw2El.value;
  const name = suNameEl.value.trim();
  const phone = suPhoneEl ? suPhoneEl.value.trim() : '';
  const birth = suBirthEl ? suBirthEl.value : '';
  const email = suEmailEl ? suEmailEl.value.trim() : '';
  
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
  if (ADMIN_ACCOUNTS.find(a => a.id === signupId) || 
      pendingUsers.find(u => u.id === signupId) || 
      approvedUsers.find(u => u.id === signupId)) {
    errDiv.textContent = '이미 사용 중인 아이디입니다';
    errDiv.style.display = 'block';
    return;
  }
  
  const joinDate = new Date().toISOString().slice(0, 10);
  pendingUsers.push({
    id: signupId, pw: pw, name: name, email: email, phone: phone, birth: birth,
    role: 'member', status: 'pending', ts: Date.now(), joinDate: joinDate
  });
  
  if (typeof LS !== 'undefined') {
    LS.save('pendingUsers', pendingUsers);
  }
  
  // 입력 필드 초기화
  suIdEl.value = '';
  if (suPwEl) suPwEl.value = '';
  if (suPw2El) suPw2El.value = '';
  if (suNameEl) suNameEl.value = '';
  if (suEmailEl) suEmailEl.value = '';
  if (suPhoneEl) suPhoneEl.value = '';
  if (suBirthEl) suBirthEl.value = '';
  
  switchAuthTab('login');
  const pendingMsg = document.getElementById('pending-msg');
  if (pendingMsg) pendingMsg.style.display = 'block';
  showToast('✅ 가입 신청이 완료되었습니다');
}


// 로그인 성공 처리 (수정됨 - forceRefreshData 제거)
async function loginSuccess(acc) {
  console.log('loginSuccess 실행:', acc.name);  // 디버깅용
  
  currentUser = {
    id: acc.id, name: acc.name, role: acc.role || 'member',
    email: acc.email, phone: acc.phone, birth: acc.birth
  };
  window.currentUser = currentUser;  // ✅ 필수!
  
  LS.save('logged', {
    id: acc.id, ts: Date.now(), email: acc.email,
    phone: acc.phone, birth: acc.birth, name: acc.name
  });
  
  document.getElementById('screen-login').style.display = 'none';
  
  const roleText = roleLabel[currentUser.role] || '회원';
  document.getElementById('user-name-display').textContent = acc.name;
  document.getElementById('user-role-display').textContent = roleText;
  document.getElementById('setting-user-info').textContent = acc.name + ' (' + roleText + ')';
  
  if (typeof applyRole === 'function') {
    applyRole(currentUser.role);
  }
  
  // ✅ forceRefreshData 제거
  if(window.FB_READY && window.FB) {
    await fbLoadAll();
  }
  
  currentTab = 0;
  if (typeof showTab === 'function') {
    showTab(0);
  }
  
  if(typeof renderServiceView === 'function') renderServiceView();
  if(typeof renderScheduleView === 'function') renderScheduleView();
  if(typeof renderTodayVerse === 'function') renderTodayVerse();
  
  if(acc.role === 'manager') {
    setTimeout(() => { if(typeof renderApprovalsAccord === 'function') renderApprovalsAccord(); }, 150);
  }
  
  showToast('✅ ' + acc.name + '님 환영합니다');
}


// 로그아웃
function doLogout() {
  if(!confirm('로그아웃하시겠습니까?')) return;
  LS.del('logged');
  currentUser = null;
  window.currentUser = null;  // ✅ 추가!
  switchAuthTab('login');
  document.getElementById('screen-login').style.display = 'block';
  if (typeof showTab === 'function') {
    showTab(0);
  }
  showToast('로그아웃되었습니다');
}


// 프로필 드롭다운 토글
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


// 내 정보 보기
function openMyProfile() {
  if (!currentUser) {
    showToast('로그인이 필요합니다');
    return;
  }
  
  let userInfo = ADMIN_ACCOUNTS.find(a => a.id === currentUser.id) || 
                 approvedUsers.find(u => u.id === currentUser.id);
  
  if (!userInfo) {
    showToast('사용자 정보를 찾을 수 없습니다');
    return;
  }
  
  const nameSpan = document.getElementById('my-pv-name');
  const emailSpan = document.getElementById('my-pv-email');
  const phoneSpan = document.getElementById('my-pv-phone');
  const birthSpan = document.getElementById('my-pv-birth');
  const viewDiv = document.getElementById('my-profile-view');
  const editDiv = document.getElementById('my-profile-edit');
  const modal = document.getElementById('modal-my-profile');
  
  if (nameSpan) nameSpan.textContent = userInfo.name || currentUser.name;
  if (emailSpan) emailSpan.textContent = userInfo.email || '등록된 이메일 없음';
  if (phoneSpan) phoneSpan.textContent = userInfo.phone || '등록된 전화번호 없음';
  if (birthSpan) birthSpan.textContent = userInfo.birth || '등록된 생년월일 없음';
  if (viewDiv) viewDiv.style.display = 'block';
  if (editDiv) editDiv.style.display = 'none';
  if (modal) modal.style.display = 'flex';
}


// 내 정보 수정 모드 열기
function openEditMyProfile() {
  if (!currentUser) return;
  
  let userInfo = ADMIN_ACCOUNTS.find(a => a.id === currentUser.id) || 
                 approvedUsers.find(u => u.id === currentUser.id);
  
  if (!userInfo) return;
  
  const nameInput = document.getElementById('my-em-name');
  const phoneInput = document.getElementById('my-em-phone');
  const birthInput = document.getElementById('my-em-birth');
  const viewDiv = document.getElementById('my-profile-view');
  const editDiv = document.getElementById('my-profile-edit');
  
  if (nameInput) nameInput.value = userInfo.name || '';
  if (phoneInput) phoneInput.value = userInfo.phone || '';
  if (birthInput) birthInput.value = userInfo.birth || '';
  if (viewDiv) viewDiv.style.display = 'none';
  if (editDiv) editDiv.style.display = 'block';
}


// 내 정보 저장
function saveMyProfile() {
  if (!currentUser) return;
  
  const newName = document.getElementById('my-em-name') ? document.getElementById('my-em-name').value.trim() : '';
  const newPhone = document.getElementById('my-em-phone') ? document.getElementById('my-em-phone').value.trim() : '';
  const newBirth = document.getElementById('my-em-birth') ? document.getElementById('my-em-birth').value : '';
  
  if (!newName) {
    showToast('이름을 입력하세요');
    return;
  }
  
  const adminIdx = ADMIN_ACCOUNTS.findIndex(a => a.id === currentUser.id);
  if (adminIdx !== -1) {
    ADMIN_ACCOUNTS[adminIdx].name = newName;
    ADMIN_ACCOUNTS[adminIdx].phone = newPhone;
    ADMIN_ACCOUNTS[adminIdx].birth = newBirth;
    currentUser.name = newName;
  } else {
    const userIdx = approvedUsers.findIndex(u => u.id === currentUser.id);
    if (userIdx !== -1) {
      approvedUsers[userIdx].name = newName;
      approvedUsers[userIdx].phone = newPhone;
      approvedUsers[userIdx].birth = newBirth;
      if (typeof LS !== 'undefined') {
        LS.save('approvedUsers', approvedUsers);
      }
      currentUser.name = newName;
    }
  }
  
  // 화면 표시 업데이트
  const userNameSpan = document.getElementById('user-name-display');
  const settingInfoSpan = document.getElementById('setting-user-info');
  const roleText = currentUser.role === 'admin' ? '관리자' : '일반성도';
  
  if (userNameSpan) userNameSpan.textContent = newName;
  if (settingInfoSpan) settingInfoSpan.textContent = newName + ' (' + roleText + ')';
  
  const modal = document.getElementById('modal-my-profile');
  if (modal) modal.style.display = 'none';
  
  showToast('✅ 내 정보가 수정되었습니다');
}


// 내 정보 수정 취소
function cancelEditMyProfile() {
  const viewDiv = document.getElementById('my-profile-view');
  const editDiv = document.getElementById('my-profile-edit');
  
  if (viewDiv) viewDiv.style.display = 'block';
  if (editDiv) editDiv.style.display = 'none';
}


// 비밀번호 변경 모달 열기
function openChangePassword() {
  if (!currentUser) {
    showToast('로그인이 필요합니다');
    return;
  }
  
  const currentInput = document.getElementById('cpw-current');
  const newInput = document.getElementById('cpw-new');
  const confirmInput = document.getElementById('cpw-confirm');
  const modal = document.getElementById('modal-change-pw');
  
  if (currentInput) currentInput.value = '';
  if (newInput) newInput.value = '';
  if (confirmInput) confirmInput.value = '';
  if (modal) modal.style.display = 'flex';
}


// 비밀번호 변경
function changePassword() {
  const currentPw = document.getElementById('cpw-current') ? document.getElementById('cpw-current').value : '';
  const newPw = document.getElementById('cpw-new') ? document.getElementById('cpw-new').value : '';
  const confirmPw = document.getElementById('cpw-confirm') ? document.getElementById('cpw-confirm').value : '';
  
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
  
  // 관리자 계정 비밀번호 변경
  const admin = ADMIN_ACCOUNTS.find(a => a.id === currentUser.id && a.pw === currentPw);
  if (admin) {
    admin.pw = newPw;
    showToast('✅ 비밀번호가 변경되었습니다');
    const modal = document.getElementById('modal-change-pw');
    if (modal) modal.style.display = 'none';
    return;
  }
  
  // 일반 회원 비밀번호 변경
  const user = approvedUsers.find(u => u.id === currentUser.id && u.pw === currentPw);
  if (user) {
    user.pw = newPw;
    if (typeof LS !== 'undefined') {
      LS.save('approvedUsers', approvedUsers);
    }
    showToast('✅ 비밀번호가 변경되었습니다');
    const modal = document.getElementById('modal-change-pw');
    if (modal) modal.style.display = 'none';
    return;
  }
  
  showToast('현재 비밀번호가 일치하지 않습니다');
}