// ==================== 앱 초기화 ====================


// Firebase 초기화 (전역 FB 객체는 config.js에서 이미 정의됨)
window.addEventListener('load', () => {
  // 1. Firebase 데이터 로드 (로컬 또는 실시간)
  setTimeout(async () => {
    if (window.FB_READY && window.FB) {
      await fbLoadAll();
      fbSync();
    } else {
      console.log('로컬 모드: localStorage 데이터만 사용합니다');
      FB_KEYS.forEach(key => {
        try {
          const data = localStorage.getItem('ch2_' + key);
          if (data) fbUpdateUI(key, JSON.parse(data));
        } catch(e) {}
      });
    }
  }, 300);


  // 2. 스플래시 제거 및 초기 렌더링, 자동 로그인 처리
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => { splash.style.display = 'none'; }, 500);
    }


    // 기본 UI 렌더링
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
    if (typeof renderPosts === 'function') renderPosts();


    // 자동 로그인 체크 (7일 이내)
    const logged = LS.load('logged', null);
    if (logged && (Date.now() - logged.ts < 86400000 * 7)) {
      const admin = ADMIN_ACCOUNTS.find(a => a.id === logged.id);
      const member = approvedUsers.find(u => u.id === logged.id);
      const acc = admin || member;
      if (acc) {
        loginSuccess(acc);
        return;
      }
    }


    // 로그인 화면 표시
    showTab(0);
  }, 1000);
});