// ==================== 로그인/회원가입/비밀번호 찾기 ====================
// 최종 수정 버전 - 아이디 찾기 기능 포함


(function() {
  console.log('🔥 js_auth.js 초기화 시작');
  
  // 전역 변수 초기화
  window.pendingUsers = window.pendingUsers || [];
  window.approvedUsers = window.approvedUsers || [];
  window.currentUser = window.currentUser || null;
  window.authMode = window.authMode || 'login';
  
  // LS 데이터 로드
  if (typeof LS !== 'undefined') {
    try {
      var loadedPending = LS.load('pendingUsers', []);
      var loadedApproved = LS.load('approvedUsers', []);
      if (loadedPending && Array.isArray(loadedPending)) window.pendingUsers = loadedPending;
      if (loadedApproved && Array.isArray(loadedApproved)) window.approvedUsers = loadedApproved;
      console.log('✅ 회원 데이터 로드 완료 - 대기:', window.pendingUsers.length, '승인:', window.approvedUsers.length);
    } catch(e) { console.error('데이터 로드 실패:', e); }
  }
  
  // ========== 로그인 폼 표시 ==========
  window.showLoginForm = function() {
    console.log('📱 showLoginForm 실행');
    var loginForm = document.getElementById('login-form');
    var signupExtra = document.getElementById('signup-extra');
    var forgotForm = document.getElementById('forgot-form');
    var findIdForm = document.getElementById('find-id-form');
    var loginErr = document.getElementById('login-err');
    var pendingMsg = document.getElementById('pending-msg');
    var authTabLogin = document.getElementById('auth-tab-login');
    var authTabSignup = document.getElementById('auth-tab-signup');
    
    if (loginForm) loginForm.style.display = 'block';
    if (signupExtra) signupExtra.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
    if (findIdForm) findIdForm.style.display = 'none';
    if (loginErr) loginErr.style.display = 'none';
    if (pendingMsg) pendingMsg.style.display = 'none';
    if (authTabLogin) {
      authTabLogin.style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:white;color:#3d0f52;font-size:13px;font-weight:700;';
    }
    if (authTabSignup) {
      authTabSignup.style.cssText = 'flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;';
    }
    window.authMode = 'login';
  };
  
  // ========== 비밀번호 찾기 폼 표시 ==========
  window.showForgotPw = function() {
    console.log('📱 showForgotPw 실행');
    var loginForm = document.getElementById('login-form');
    var signupExtra = document.getElementById('signup-extra');
    var forgotForm = document.getElementById('forgot-form');
    var findIdForm = document.getElementById('find-id-form');
    var loginErr = document.getElementById('login-err');
    
    if (loginForm) loginForm.style.display = 'none';
    if (signupExtra) signupExtra.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'block';
    if (findIdForm) findIdForm.style.display = 'none';
    if (loginErr) loginErr.style.display = 'none';
  };
  
  // ========== 아이디 찾기 폼 표시 ==========
  window.showFindId = function() {
    console.log('🔍 showFindId 실행');
    
    var loginForm = document.getElementById('login-form');
    var signupExtra = document.getElementById('signup-extra');
    var forgotForm = document.getElementById('forgot-form');
    var findIdForm = document.getElementById('find-id-form');
    var loginErr = document.getElementById('login-err');
    var pendingMsg = document.getElementById('pending-msg');
    var findIdResult = document.getElementById('find-id-result');
    var findBirth = document.getElementById('find-birth');
    var findPhone = document.getElementById('find-phone');
    
    if (loginForm) loginForm.style.display = 'none';
    if (signupExtra) signupExtra.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
    if (findIdForm) findIdForm.style.display = 'block';
    if (loginErr) loginErr.style.display = 'none';
    if (pendingMsg) pendingMsg.style.display = 'none';
    
    // 입력 필드 초기화
    if (findBirth) findBirth.value = '';
    if (findPhone) findPhone.value = '';
    if (findIdResult) {
      findIdResult.style.display = 'none';
      findIdResult.style.background = 'rgba(255,255,255,0.1)';
    }
  };
  
  // ========== 아이디 찾기 실행 ==========
  window.doFindId = function() {
    console.log('🔍 doFindId 실행');
    
    var birthInput = document.getElementById('find-birth');
    var phoneInput = document.getElementById('find-phone');
    var resultDiv = document.getElementById('find-id-result');
    var resultText = document.getElementById('find-id-result-text');
    
    if (!birthInput || !phoneInput) {
      console.error('아이디 찾기 폼 요소 없음');
      if (typeof showToast === 'function') showToast('오류: 입력 폼을 찾을 수 없습니다');
      return;
    }
    
    var birth = birthInput.value;
    var phone = phoneInput.value;
    
    if (!birth) {
      if (typeof showToast === 'function') showToast('생년월일을 입력하세요');
      return;
    }
    
    if (!phone || phone.length < 10) {
      if (typeof showToast === 'function') showToast('올바른 전화번호를 입력하세요');
      return;
    }
    
    // 생년월일 형식 변환 (YYYY-MM-DD → YYYYMMDD)
    var birthFormatted = birth.replace(/-/g, '');
    var phoneFormatted = phone.replace(/[^0-9]/g, '');
    
    console.log('검색 조건 - 생년월일:', birthFormatted, '전화번호:', phoneFormatted);
    
    // 사용자 검색
    var foundUser = null;
    
    // 1. 관리자 계정에서 검색
    if (typeof ADMIN_ACCOUNTS !== 'undefined') {
      for (var i = 0; i < ADMIN_ACCOUNTS.length; i++) {
        var user = ADMIN_ACCOUNTS[i];
        var userBirth = user.birth ? user.birth.replace(/-/g, '') : '';
        var userPhone = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
        if (userBirth === birthFormatted && userPhone === phoneFormatted) {
          foundUser = user;
          break;
        }
      }
    }
    
    // 2. 승인된 일반 회원에서 검색
    if (!foundUser && window.approvedUsers) {
      for (var i = 0; i < window.approvedUsers.length; i++) {
        var user = window.approvedUsers[i];
        var userBirth = user.birth ? user.birth.replace(/-/g, '') : '';
        var userPhone = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
        if (userBirth === birthFormatted && userPhone === phoneFormatted) {
          foundUser = user;
          break;
        }
      }
    }
    
    // 3. 승인 대기자에서 검색
    if (!foundUser && window.pendingUsers) {
      for (var i = 0; i < window.pendingUsers.length; i++) {
        var user = window.pendingUsers[i];
        var userBirth = user.birth ? user.birth.replace(/-/g, '') : '';
        var userPhone = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
        if (userBirth === birthFormatted && userPhone === phoneFormatted) {
          foundUser = user;
          break;
        }
      }
    }
    
    // 결과 표시
    if (resultDiv && resultText) {
      if (foundUser) {
        resultText.textContent = foundUser.id;
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(255,215,0,0.15)';
        if (typeof showToast === 'function') showToast('✅ 아이디를 찾았습니다');
        console.log('아이디 찾기 성공:', foundUser.id);
      } else {
        resultText.textContent = '일치하는 사용자가 없습니다';
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(255,100,100,0.15)';
        if (typeof showToast === 'function') showToast('⚠️ 일치하는 정보가 없습니다');
        console.log('아이디 찾기 실패: 일치하는 정보 없음');
      }
    }
  };
  
  // ========== 탭 전환 ==========
  window.switchAuthTab = function(mode) {
    console.log('📱 switchAuthTab 실행:', mode);
    window.authMode = mode;
    var isLogin = mode === 'login';
    var authTabLogin = document.getElementById('auth-tab-login');
    var authTabSignup = document.getElementById('auth-tab-signup');
    var loginForm = document.getElementById('login-form');
    var signupExtra = document.getElementById('signup-extra');
    var forgotForm = document.getElementById('forgot-form');
    var findIdForm = document.getElementById('find-id-form');
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
    if (findIdForm) findIdForm.style.display = 'none';
    if (loginErr) loginErr.style.display = 'none';
    if (pendingMsg) pendingMsg.style.display = 'none';
    if (idCheckMsg) idCheckMsg.textContent = '';
  };
  
  // ========== 로그인/회원가입 제출 ==========
  window.doAuthSubmit = function() {
    console.log('📱 doAuthSubmit 실행, mode:', window.authMode);
    if (window.authMode === 'login') window.doLogin();
    else window.doSignup();
  };
  
  // ========== 로그인 처리 ==========
  window.doLogin = function() {
    console.log('🔐 doLogin 실행');
    var idInput = document.getElementById('li-id');
    var pwInput = document.getElementById('li-pw');
    var errDiv = document.getElementById('login-err');
    
    if (!idInput || !pwInput) {
      console.error('로그인 폼 요소 없음');
      return;
    }
    
    var id = idInput.value.trim();
    var pw = pwInput.value;
    if (errDiv) errDiv.style.display = 'none';
    
    if (!id || !pw) {
      if (errDiv) { errDiv.textContent = '아이디와 비밀번호를 입력하세요'; errDiv.style.display = 'block'; }
      return;
    }
    
    // 관리자 계정 확인
    if (typeof ADMIN_ACCOUNTS !== 'undefined') {
      for (var i = 0; i < ADMIN_ACCOUNTS.length; i++) {
        if (ADMIN_ACCOUNTS[i].id === id && ADMIN_ACCOUNTS[i].pw === pw) {
          window.loginSuccess(ADMIN_ACCOUNTS[i]);
          return;
        }
      }
    }
    
    // 승인된 일반 회원 확인
    for (var i = 0; i < window.approvedUsers.length; i++) {
      if (window.approvedUsers[i].id === id && window.approvedUsers[i].pw === pw) {
        window.loginSuccess(window.approvedUsers[i]);
        return;
      }
    }
    
    // 승인 대기 중 확인
    for (var i = 0; i < window.pendingUsers.length; i++) {
      if (window.pendingUsers[i].id === id && window.pendingUsers[i].pw === pw) {
        var pendingMsg = document.getElementById('pending-msg');
        if (pendingMsg) pendingMsg.style.display = 'block';
        return;
      }
    }
    
    if (errDiv) { errDiv.textContent = '아이디 또는 비밀번호가 일치하지 않습니다'; errDiv.style.display = 'block'; }
  };
  
  // ========== 로그인 성공 ==========
  window.loginSuccess = function(acc) {
    console.log('✅ loginSuccess 실행:', acc.name);
    
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
        name: acc.name,
        role: acc.role || 'member'
      });
    }
    localStorage.setItem('ch2_currentUser', JSON.stringify(window.currentUser));
    
    var loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'none';
    
    var roleText = (window.currentUser.role === 'admin' ? '관리자' : (window.currentUser.role === 'manager' ? '매니저' : '일반성도'));
    var userNameSpan = document.getElementById('user-name-display');
    var userRoleSpan = document.getElementById('user-role-display');
    if (userNameSpan) userNameSpan.textContent = acc.name;
    if (userRoleSpan) userRoleSpan.textContent = roleText;
    
    var settingInfoSpan = document.getElementById('setting-user-info');
    if (settingInfoSpan) settingInfoSpan.textContent = acc.name + ' (' + roleText + ')';
    
    if (typeof applyRole === 'function') applyRole(window.currentUser.role);
    
    setTimeout(function() {
      console.log('로그인 후 홈 탭으로 이동, currentUser:', window.currentUser);
      if (typeof showTab === 'function') showTab(0);
    }, 100);
    
    if (typeof showToast === 'function') showToast('✅ ' + acc.name + '님 환영합니다');
    else alert('✅ ' + acc.name + '님 환영합니다');
    
    document.body.setAttribute('data-logged-in', 'true');
  };
  
  // ========== 회원가입 ==========
  window.doSignup = function() {
    console.log('📝 doSignup 실행');
    var suIdEl = document.getElementById('su-id');
    var suPwEl = document.getElementById('su-pw');
    var suPw2El = document.getElementById('su-pw2');
    var suNameEl = document.getElementById('su-name');
    var suPhoneEl = document.getElementById('su-phone');
    var suBirthEl = document.getElementById('su-birth');
    var suEmailEl = document.getElementById('su-email');
    var errDiv = document.getElementById('login-err');
    
    if (!suIdEl || !suPwEl || !suNameEl) return;
    
    var signupId = suIdEl.value.trim();
    var pw = suPwEl.value;
    var pw2 = suPw2El ? suPw2El.value : '';
    var name = suNameEl.value.trim();
    var phone = suPhoneEl ? suPhoneEl.value.trim() : '';
    var birth = suBirthEl ? suBirthEl.value : '';
    var email = suEmailEl ? suEmailEl.value.trim() : '';
    
    if (errDiv) errDiv.style.display = 'none';
    
    if (!signupId || !pw || !name) {
      if (errDiv) { errDiv.textContent = '아이디, 이름, 비밀번호를 모두 입력하세요'; errDiv.style.display = 'block'; }
      return;
    }
    if (signupId.length < 4) {
      if (errDiv) { errDiv.textContent = '아이디는 4자 이상이어야 합니다'; errDiv.style.display = 'block'; }
      return;
    }
    if (pw.length < 4) {
      if (errDiv) { errDiv.textContent = '비밀번호는 4자 이상이어야 합니다'; errDiv.style.display = 'block'; }
      return;
    }
    if (pw !== pw2) {
      if (errDiv) { errDiv.textContent = '비밀번호가 일치하지 않습니다'; errDiv.style.display = 'block'; }
      return;
    }
    
    // 중복 확인
    var idExists = false;
    if (typeof ADMIN_ACCOUNTS !== 'undefined') {
      for (var i = 0; i < ADMIN_ACCOUNTS.length; i++) {
        if (ADMIN_ACCOUNTS[i].id === signupId) { idExists = true; break; }
      }
    }
    if (!idExists) {
      for (var i = 0; i < window.pendingUsers.length; i++) {
        if (window.pendingUsers[i].id === signupId) { idExists = true; break; }
      }
    }
    if (!idExists) {
      for (var i = 0; i < window.approvedUsers.length; i++) {
        if (window.approvedUsers[i].id === signupId) { idExists = true; break; }
      }
    }
    
    if (idExists) {
      if (errDiv) { errDiv.textContent = '이미 사용 중인 아이디입니다'; errDiv.style.display = 'block'; }
      return;
    }
    
    var joinDate = new Date().toISOString().slice(0, 10);
    window.pendingUsers.push({
      id: signupId, pw: pw, name: name, email: email, phone: phone, birth: birth,
      role: 'member', status: 'pending', ts: Date.now(), joinDate: joinDate
    });
    
    if (typeof LS !== 'undefined') LS.save('pendingUsers', window.pendingUsers);
    
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
  
  // ========== 비밀번호 재설정 ==========
  window.doResetPassword = function() {
    console.log('🔑 doResetPassword 실행');
    alert('관리자에게 문의하세요: 032-581-4048');
    window.showLoginForm();
  };
  
  // ========== 아이디 중복 확인 ==========
  window.checkIdDuplicate = function(val) {
    var msg = document.getElementById('id-check-msg');
    if (!msg) return;
    if (!val || val.length < 4) {
      msg.textContent = val ? '아이디는 4자 이상 입력해주세요' : '';
      return;
    }
    
    var taken = false;
    if (typeof ADMIN_ACCOUNTS !== 'undefined') {
      for (var i = 0; i < ADMIN_ACCOUNTS.length; i++) {
        if (ADMIN_ACCOUNTS[i].id === val) { taken = true; break; }
      }
    }
    if (!taken) {
      for (var i = 0; i < window.pendingUsers.length; i++) {
        if (window.pendingUsers[i].id === val) { taken = true; break; }
      }
    }
    if (!taken) {
      for (var i = 0; i < window.approvedUsers.length; i++) {
        if (window.approvedUsers[i].id === val) { taken = true; break; }
      }
    }
    
    if (taken) {
      msg.style.color = '#fca5a5';
      msg.textContent = '❌ 이미 사용 중인 아이디입니다';
    } else {
      msg.style.color = '#86efac';
      msg.textContent = '✅ 사용 가능한 아이디입니다';
    }
  };
  
  // ========== 로그아웃 ==========
  window.doLogout = function() {
    if (!confirm('로그아웃하시겠습니까?')) return;
    if (typeof LS !== 'undefined') LS.del('logged');
    window.currentUser = null;
    currentUser = null;
    localStorage.removeItem('ch2_currentUser');
    if (typeof applyRole === 'function') applyRole('member');
    var loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (typeof showTab === 'function') showTab(0);
    if (typeof showToast === 'function') showToast('로그아웃되었습니다');
  };
  
  // ========== 로그인 상태 복원 ==========
  window.restoreLogin = function() {
    console.log('🔄 restoreLogin 실행');
    
    var savedLogin = null;
    if (typeof LS !== 'undefined') {
      savedLogin = LS.load('logged', null);
    }
    
    if (!savedLogin) {
      try {
        var saved = localStorage.getItem('ch2_logged');
        if (saved) savedLogin = JSON.parse(saved);
      } catch(e) {}
    }
    
    if (!savedLogin) {
      try {
        var savedUser = localStorage.getItem('ch2_currentUser');
        if (savedUser) {
          var user = JSON.parse(savedUser);
          console.log('ch2_currentUser에서 복원:', user);
          window.currentUser = user;
          currentUser = user;
          if (typeof applyRole === 'function') applyRole(user.role);
          
          var roleText = (user.role === 'admin' ? '관리자' : (user.role === 'manager' ? '매니저' : '일반성도'));
          var userNameSpan = document.getElementById('user-name-display');
          var userRoleSpan = document.getElementById('user-role-display');
          if (userNameSpan) userNameSpan.textContent = user.name;
          if (userRoleSpan) userRoleSpan.textContent = roleText;
          
          var settingInfoSpan = document.getElementById('setting-user-info');
          if (settingInfoSpan) {
            settingInfoSpan.textContent = user.name + ' (' + roleText + ')';
          }
          
          return true;
        }
      } catch(e) {}
    }
    
    if (!savedLogin || !savedLogin.id) {
      console.log('저장된 로그인 정보 없음');
      return false;
    }
    
    var user = null;
    if (typeof ADMIN_ACCOUNTS !== 'undefined') {
      for (var i = 0; i < ADMIN_ACCOUNTS.length; i++) {
        if (ADMIN_ACCOUNTS[i].id === savedLogin.id) { user = ADMIN_ACCOUNTS[i]; break; }
      }
    }
    if (!user) {
      for (var i = 0; i < window.approvedUsers.length; i++) {
        if (window.approvedUsers[i].id === savedLogin.id) { user = window.approvedUsers[i]; break; }
      }
    }
    
    if (user) {
      console.log('로그인 복원 성공:', user.name);
      window.currentUser = {
        id: user.id,
        name: user.name,
        role: user.role || 'member',
        email: user.email || '',
        phone: user.phone || '',
        birth: user.birth || ''
      };
      currentUser = window.currentUser;
      
      localStorage.setItem('ch2_currentUser', JSON.stringify(window.currentUser));
      
      var roleText = (window.currentUser.role === 'admin' ? '관리자' : (window.currentUser.role === 'manager' ? '매니저' : '일반성도'));
      var userNameSpan = document.getElementById('user-name-display');
      var userRoleSpan = document.getElementById('user-role-display');
      if (userNameSpan) userNameSpan.textContent = user.name;
      if (userRoleSpan) userRoleSpan.textContent = roleText;
      
      var settingInfoSpan = document.getElementById('setting-user-info');
      if (settingInfoSpan) {
        settingInfoSpan.textContent = user.name + ' (' + roleText + ')';
      }
      
      if (typeof applyRole === 'function') applyRole(window.currentUser.role);
      return true;
    }
    return false;
  };
  
  // ========== 내 정보 관련 함수 ==========
  window.openMyProfile = function() {
    if (!window.currentUser) {
      if (typeof showToast === 'function') showToast('로그인이 필요합니다');
      else alert('로그인이 필요합니다');
      return;
    }
    var modal = document.getElementById('modal-my-profile');
    if (modal) {
      // 내 정보 표시
      document.getElementById('my-pv-name').textContent = window.currentUser.name || '';
      document.getElementById('my-pv-email').textContent = window.currentUser.email || '';
      document.getElementById('my-pv-phone').textContent = window.currentUser.phone || '';
      document.getElementById('my-pv-birth').textContent = window.currentUser.birth || '';
      modal.style.display = 'flex';
    } else {
      alert('내 정보 기능: ' + window.currentUser.name);
    }
  };
  
  window.openChangePassword = function() {
    if (!window.currentUser) {
      if (typeof showToast === 'function') showToast('로그인이 필요합니다');
      else alert('로그인이 필요합니다');
      return;
    }
    var modal = document.getElementById('modal-change-pw');
    if (modal) modal.style.display = 'flex';
  };
  
  window.changePassword = function() {
    var currentPw = document.getElementById('cpw-current') ? document.getElementById('cpw-current').value : '';
    var newPw = document.getElementById('cpw-new') ? document.getElementById('cpw-new').value : '';
    var confirmPw = document.getElementById('cpw-confirm') ? document.getElementById('cpw-confirm').value : '';
    
    if (!currentPw || !newPw || !confirmPw) {
      if (typeof showToast === 'function') showToast('모든 항목을 입력하세요');
      return;
    }
    if (newPw.length < 4) {
      if (typeof showToast === 'function') showToast('새 비밀번호는 4자 이상이어야 합니다');
      return;
    }
    if (newPw !== confirmPw) {
      if (typeof showToast === 'function') showToast('새 비밀번호가 일치하지 않습니다');
      return;
    }
    
    var userId = window.currentUser.id;
    var changed = false;
    
    if (typeof ADMIN_ACCOUNTS !== 'undefined') {
      for (var i = 0; i < ADMIN_ACCOUNTS.length; i++) {
        if (ADMIN_ACCOUNTS[i].id === userId && ADMIN_ACCOUNTS[i].pw === currentPw) {
          ADMIN_ACCOUNTS[i].pw = newPw;
          changed = true;
          break;
        }
      }
    }
    
    if (!changed) {
      for (var i = 0; i < window.approvedUsers.length; i++) {
        if (window.approvedUsers[i].id === userId && window.approvedUsers[i].pw === currentPw) {
          window.approvedUsers[i].pw = newPw;
          changed = true;
          break;
        }
      }
    }
    
    if (changed) {
      if (typeof LS !== 'undefined') {
        LS.save('approvedUsers', window.approvedUsers);
      }
      localStorage.setItem('ch2_approvedUsers', JSON.stringify(window.approvedUsers));
      
      window.currentUser.pw = newPw;
      localStorage.setItem('ch2_currentUser', JSON.stringify(window.currentUser));
      
      if (typeof showToast === 'function') showToast('✅ 비밀번호가 변경되었습니다');
      else alert('✅ 비밀번호가 변경되었습니다');
      
      var modal = document.getElementById('modal-change-pw');
      if (modal) modal.style.display = 'none';
      document.getElementById('cpw-current').value = '';
      document.getElementById('cpw-new').value = '';
      document.getElementById('cpw-confirm').value = '';
    } else {
      if (typeof showToast === 'function') showToast('❌ 현재 비밀번호가 일치하지 않습니다');
      else alert('❌ 현재 비밀번호가 일치하지 않습니다');
    }
  };
  
  window.openEditMyProfile = function() {
    if (!window.currentUser) {
      if (typeof showToast === 'function') showToast('로그인이 필요합니다');
      return;
    }
    
    document.getElementById('my-em-name').value = window.currentUser.name || '';
    document.getElementById('my-em-phone').value = window.currentUser.phone || '';
    document.getElementById('my-em-birth').value = window.currentUser.birth || '';
    
    document.getElementById('my-profile-view').style.display = 'none';
    document.getElementById('my-profile-edit').style.display = 'block';
  };
  
  window.saveMyProfile = function() {
    if (!window.currentUser) {
      if (typeof showToast === 'function') showToast('로그인이 필요합니다');
      return;
    }
    
    var newName = document.getElementById('my-em-name').value.trim();
    var newPhone = document.getElementById('my-em-phone').value.trim();
    var newBirth = document.getElementById('my-em-birth').value;
    
    if (!newName) {
      if (typeof showToast === 'function') showToast('이름을 입력하세요');
      return;
    }
    
    var userId = window.currentUser.id;
    var updated = false;
    
    for (var i = 0; i < window.approvedUsers.length; i++) {
      if (window.approvedUsers[i].id === userId) {
        window.approvedUsers[i].name = newName;
        window.approvedUsers[i].phone = newPhone;
        window.approvedUsers[i].birth = newBirth;
        updated = true;
        break;
      }
    }
    
    if (!updated && typeof ADMIN_ACCOUNTS !== 'undefined') {
      for (var i = 0; i < ADMIN_ACCOUNTS.length; i++) {
        if (ADMIN_ACCOUNTS[i].id === userId) {
          ADMIN_ACCOUNTS[i].name = newName;
          ADMIN_ACCOUNTS[i].phone = newPhone;
          ADMIN_ACCOUNTS[i].birth = newBirth;
          updated = true;
          break;
        }
      }
    }
    
    if (updated) {
      window.currentUser.name = newName;
      window.currentUser.phone = newPhone;
      window.currentUser.birth = newBirth;
      currentUser = window.currentUser;
      
      if (typeof LS !== 'undefined') {
        LS.save('approvedUsers', window.approvedUsers);
      }
      localStorage.setItem('ch2_approvedUsers', JSON.stringify(window.approvedUsers));
      localStorage.setItem('ch2_currentUser', JSON.stringify(window.currentUser));
      
      var userNameSpan = document.getElementById('user-name-display');
      if (userNameSpan) userNameSpan.textContent = newName;
      
      var settingInfoSpan = document.getElementById('setting-user-info');
      if (settingInfoSpan) {
        var roleText = (window.currentUser.role === 'admin' ? '관리자' : (window.currentUser.role === 'manager' ? '매니저' : '일반성도'));
        settingInfoSpan.textContent = newName + ' (' + roleText + ')';
      }
      
      if (typeof showToast === 'function') showToast('✅ 내 정보가 수정되었습니다');
      
      document.getElementById('modal-my-profile').style.display = 'none';
      document.getElementById('my-profile-view').style.display = 'block';
      document.getElementById('my-profile-edit').style.display = 'none';
    } else {
      if (typeof showToast === 'function') showToast('❌ 정보 수정에 실패했습니다');
    }
  };
  
  window.cancelEditMyProfile = function() {
    document.getElementById('my-profile-view').style.display = 'block';
    document.getElementById('my-profile-edit').style.display = 'none';
  };
  
  window.toggleProfileDropdown = function() {
    var dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;
    
    if (dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    } else {
      dropdown.classList.add('show');
    }
  };
  
  document.addEventListener('click', function(e) {
    var dropdown = document.getElementById('profile-dropdown');
    var userBadge = document.querySelector('.user-badge');
    if (dropdown && dropdown.classList.contains('show') && userBadge && !userBadge.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  setTimeout(function() {
    window.restoreLogin();
  }, 200);
  
  console.log('✅ js_auth.js 로드 완료 (아이디 찾기 기능 포함)');
})();