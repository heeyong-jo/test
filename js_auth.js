// ==================== 로그인/회원가입/비밀번호 찾기 ====================


// 초기 데이터 로드 (storage.js에 정의된 변수 사용)
pendingUsers = LS.load('pendingUsers', []);
approvedUsers = LS.load('approvedUsers', []);


function showLoginForm() {
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
  const isLogin = mode === 'login';
  document.getElementById('auth-tab-login').style.cssText = isLogin ? 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;' : 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;';
  document.getElementById('auth-tab-signup').style.cssText = isLogin ? 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;' : 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;';
  document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
  document.getElementById('signup-extra').style.display = isLogin ? 'none' : 'block';
  document.getElementById('forgot-form').style.display = 'none';
  document.getElementById('login-err').style.display = 'none';
  document.getElementById('pending-msg').style.display = 'none';
  const idmsg = document.getElementById('id-check-msg');
  if(idmsg) idmsg.textContent = '';
}


function doAuthSubmit() {
  if(authMode === 'login') doLogin();
  else doSignup();
}


function doLogin() {
  const id = document.getElementById('li-id').value.trim();
  const pw = document.getElementById('li-pw').value;
  const errDiv = document.getElementById('login-err');
  errDiv.style.display = 'none';
  if(!id || !pw) {
    errDiv.textContent = '아이디와 비밀번호를 입력하세요';
    errDiv.style.display = 'block';
    return;
  }
  const admin = ADMIN_ACCOUNTS.find(a => a.id === id && a.pw === pw);
  if(admin) {
    loginSuccess(admin);
    return;
  }
  const user = approvedUsers.find(u => u.id === id && u.pw === pw);
  if(user) {
    loginSuccess(user);
    return;
  }
  const pending = pendingUsers.find(u => u.id === id && u.pw === pw);
  if(pending) {
    document.getElementById('pending-msg').style.display = 'block';
    return;
  }
  errDiv.textContent = '아이디 또는 비밀번호가 일치하지 않습니다';
  errDiv.style.display = 'block';
}


function checkIdDuplicate(val) {
  const msg = document.getElementById('id-check-msg');
  if(!msg) return;
  if(!val) { msg.textContent = ''; return; }
  if(val.length < 4) {
    msg.style.color = '#fca5a5';
    msg.textContent = '아이디는 4자 이상 입력해주세요';
    return;
  }
  clearTimeout(idCheckTimer);
  idCheckTimer = setTimeout(() => {
    const taken = ADMIN_ACCOUNTS.find(a => a.id === val) || pendingUsers.find(u => u.id === val) || approvedUsers.find(u => u.id === val);
    if(taken) {
      msg.style.color = '#fca5a5';
      msg.textContent = '❌ 이미 사용 중인 아이디입니다';
    } else {
      msg.style.color = '#86efac';
      msg.textContent = '✅ 사용 가능한 아이디입니다';
    }
  }, 400);
}


function doResetPassword() {
  const id = document.getElementById('forgot-id').value.trim();
  const email = document.getElementById('forgot-email').value.trim();
  const phoneRaw = document.getElementById('forgot-phone').value.trim();
  const phone = phoneRaw.replace(/-/g, '');
  const err = document.getElementById('login-err');
  err.style.display = 'none';
  
  if(!id || !email || !phone) {
    err.textContent = '아이디, 이메일, 전화번호를 모두 입력하세요';
    err.style.display = 'block';
    return;
  }
  
  // 1. ADMIN_ACCOUNTS 검색
  const admin = ADMIN_ACCOUNTS.find(a => a.id === id && a.email === email && (a.phone || '').replace(/-/g, '') === phone);
  if(admin) {
    const tmpPw = 'hamkke' + Math.floor(1000 + Math.random() * 9000);
    admin.pw = tmpPw;
    showLoginForm();
    setTimeout(() => {
      const err2 = document.getElementById('login-err');
      err2.style.background = 'rgba(134,239,172,0.15)';
      err2.style.color = '#86efac';
      err2.textContent = '임시 비밀번호: ' + tmpPw + ' (로그인 후 변경하세요)';
      err2.style.display = 'block';
    }, 300);
    return;
  }
  
  // 2. approvedUsers 검색
  const user = approvedUsers.find(u => u.id === id && u.email === email && (u.phone || '').replace(/-/g, '') === phone);
  if(!user) {
    err.textContent = '입력한 정보와 일치하는 회원이 없습니다';
    err.style.display = 'block';
    return;
  }
  
  const tmpPw = 'hamkke' + Math.floor(1000 + Math.random() * 9000);
  user.pw = tmpPw;
  LS.save('approvedUsers', approvedUsers);
  showLoginForm();
  setTimeout(() => {
    const err2 = document.getElementById('login-err');
    err2.style.background = 'rgba(134,239,172,0.15)';
    err2.style.color = '#86efac';
    err2.textContent = '임시 비밀번호: ' + tmpPw + ' (로그인 후 변경하세요)';
    err2.style.display = 'block';
  }, 300);
}


function doSignup() {
  const suIdEl = document.getElementById('su-id');
  const signupId = suIdEl ? suIdEl.value.trim() : '';
  const pw = document.getElementById('su-pw') ? document.getElementById('su-pw').value : '';
  const pw2 = document.getElementById('su-pw2') ? document.getElementById('su-pw2').value : '';
  const name = document.getElementById('su-name') ? document.getElementById('su-name').value.trim() : '';
  const phone = document.getElementById('su-phone') ? document.getElementById('su-phone').value.trim() : '';
  const birth = document.getElementById('su-birth') ? document.getElementById('su-birth').value : '';
  const email = document.getElementById('su-email') ? document.getElementById('su-email').value.trim() : '';
  const err = document.getElementById('login-err');
  err.style.display = 'none';
  
  if(!signupId || !pw || !name) {
    err.textContent = '아이디, 이름, 비밀번호를 모두 입력하세요';
    err.style.display = 'block';
    return;
  }
  if(signupId.length < 4) {
    err.textContent = '아이디는 4자 이상이어야 합니다';
    err.style.display = 'block';
    return;
  }
  if(pw.length < 4) {
    err.textContent = '비밀번호는 4자 이상이어야 합니다';
    err.style.display = 'block';
    return;
  }
  if(pw !== pw2) {
    err.textContent = '비밀번호가 일치하지 않습니다';
    err.style.display = 'block';
    return;
  }
  const msg = document.getElementById('id-check-msg');
  if(msg && !msg.textContent.includes('✅')) {
    err.textContent = '아이디 중복 확인을 해주세요';
    err.style.display = 'block';
    return;
  }
  if(ADMIN_ACCOUNTS.find(a => a.id === signupId) || pendingUsers.find(u => u.id === signupId) || approvedUsers.find(u => u.id === signupId)) {
    err.textContent = '이미 사용 중인 아이디입니다';
    err.style.display = 'block';
    return;
  }
  const joinDate = new Date().toISOString().slice(0,10);
  pendingUsers.push({
    id: signupId, pw: pw, name: name, email: email, phone: phone, birth: birth,
    role: 'member', status: 'pending', ts: Date.now(), joinDate: joinDate
  });
  LS.save('pendingUsers', pendingUsers);
  suIdEl.value = '';
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


async function loginSuccess(acc) {
  currentUser = {
    id: acc.id, name: acc.name, role: acc.role || 'member',
    email: acc.email, phone: acc.phone, birth: acc.birth
  };
  LS.save('logged', {
    id: acc.id, ts: Date.now(), email: acc.email,
    phone: acc.phone, birth: acc.birth, name: acc.name
  });
  document.getElementById('screen-login').style.display = 'none';
  const roleText = roleLabel[currentUser.role] || '회원';
  document.getElementById('user-name-display').textContent = acc.name;
  document.getElementById('user-role-display').textContent = roleText;
  document.getElementById('setting-user-info').textContent = acc.name + ' (' + roleText + ')';
  applyRole(currentUser.role);
  if(window.FB_READY && window.FB) {
    await fbLoadAll();
    await forceRefreshData();
  }
  currentTab = 0;
  showTab(0);
  if(typeof renderServiceView === 'function') renderServiceView();
  if(typeof renderScheduleView === 'function') renderScheduleView();
  if(typeof renderTodayVerse === 'function') renderTodayVerse();
  if(acc.role === 'manager') {
    setTimeout(() => { if(typeof renderApprovalsAccord === 'function') renderApprovalsAccord(); }, 150);
  }
  showToast('✅ ' + acc.name + '님 환영합니다');
}


function doLogout() {
  if(!confirm('로그아웃하시겠습니까?')) return;
  LS.del('logged');
  currentUser = null;
  switchAuthTab('login');
  document.getElementById('screen-login').style.display = 'block';
  showTab(0);
  showToast('로그아웃되었습니다');
}


function toggleProfileDropdown() {
  const dropdown = document.getElementById('profile-dropdown');
  if(!dropdown) return;
  dropdown.classList.toggle('show');
  setTimeout(() => {
    document.addEventListener('click', function closeDropdown(e) {
      if(!dropdown.contains(e.target) && !e.target.closest('.user-badge')) {
        dropdown.classList.remove('show');
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 0);
}


function openMyProfile() {
  if(!currentUser) { showToast('로그인이 필요합니다'); return; }
  let userInfo = ADMIN_ACCOUNTS.find(a => a.id === currentUser.id) || approvedUsers.find(u => u.id === currentUser.id);
  if(!userInfo) { showToast('사용자 정보를 찾을 수 없습니다'); return; }
  document.getElementById('my-pv-name').textContent = userInfo.name || currentUser.name;
  document.getElementById('my-pv-email').textContent = userInfo.email || '등록된 이메일 없음';
  document.getElementById('my-pv-phone').textContent = userInfo.phone || '등록된 전화번호 없음';
  document.getElementById('my-pv-birth').textContent = userInfo.birth || '등록된 생년월일 없음';
  document.getElementById('my-profile-view').style.display = 'block';
  document.getElementById('my-profile-edit').style.display = 'none';
  document.getElementById('modal-my-profile').style.display = 'flex';
}


function openEditMyProfile() {
  if(!currentUser) return;
  let userInfo = ADMIN_ACCOUNTS.find(a => a.id === currentUser.id) || approvedUsers.find(u => u.id === currentUser.id);
  if(!userInfo) return;
  document.getElementById('my-em-name').value = userInfo.name || '';
  document.getElementById('my-em-phone').value = userInfo.phone || '';
  document.getElementById('my-em-birth').value = userInfo.birth || '';
  document.getElementById('my-profile-view').style.display = 'none';
  document.getElementById('my-profile-edit').style.display = 'block';
}


function saveMyProfile() {
  if(!currentUser) return;
  const newName = document.getElementById('my-em-name').value.trim();
  const newPhone = document.getElementById('my-em-phone').value.trim();
  const newBirth = document.getElementById('my-em-birth').value;
  if(!newName) { showToast('이름을 입력하세요'); return; }
  const adminIdx = ADMIN_ACCOUNTS.findIndex(a => a.id === currentUser.id);
  if(adminIdx !== -1) {
    ADMIN_ACCOUNTS[adminIdx].name = newName;
    ADMIN_ACCOUNTS[adminIdx].phone = newPhone;
    ADMIN_ACCOUNTS[adminIdx].birth = newBirth;
    currentUser.name = newName;
  } else {
    const userIdx = approvedUsers.findIndex(u => u.id === currentUser.id);
    if(userIdx !== -1) {
      approvedUsers[userIdx].name = newName;
      approvedUsers[userIdx].phone = newPhone;
      approvedUsers[userIdx].birth = newBirth;
      LS.save('approvedUsers', approvedUsers);
      currentUser.name = newName;
    }
  }
  document.getElementById('user-name-display').textContent = newName;
  document.getElementById('setting-user-info').textContent = newName + ' (' + (currentUser.role === 'admin' ? '관리자' : '일반성도') + ')';
  closeModal('modal-my-profile');
  showToast('✅ 내 정보가 수정되었습니다');
}


function cancelEditMyProfile() {
  document.getElementById('my-profile-view').style.display = 'block';
  document.getElementById('my-profile-edit').style.display = 'none';
}


function openChangePassword() {
  if(!currentUser) { showToast('로그인이 필요합니다'); return; }
  document.getElementById('cpw-current').value = '';
  document.getElementById('cpw-new').value = '';
  document.getElementById('cpw-confirm').value = '';
  document.getElementById('modal-change-pw').style.display = 'flex';
}


function changePassword() {
  const currentPw = document.getElementById('cpw-current').value;
  const newPw = document.getElementById('cpw-new').value;
  const confirmPw = document.getElementById('cpw-confirm').value;
  if(!currentPw || !newPw || !confirmPw) { showToast('모든 항목을 입력하세요'); return; }
  if(newPw.length < 4) { showToast('새 비밀번호는 4자 이상이어야 합니다'); return; }
  if(newPw !== confirmPw) { showToast('새 비밀번호가 일치하지 않습니다'); return; }
  const admin = ADMIN_ACCOUNTS.find(a => a.id === currentUser.id && a.pw === currentPw);
  if(admin) {
    admin.pw = newPw;
    showToast('✅ 비밀번호가 변경되었습니다');
    closeModal('modal-change-pw');
    return;
  }
  const user = approvedUsers.find(u => u.id === currentUser.id && u.pw === currentPw);
  if(user) {
    user.pw = newPw;
    LS.save('approvedUsers', approvedUsers);
    showToast('✅ 비밀번호가 변경되었습니다');
    closeModal('modal-change-pw');
    return;
  }
  showToast('현재 비밀번호가 일치하지 않습니다');
}