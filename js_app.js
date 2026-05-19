// ==================== 앱 초기화 ====================


console.log('js_app.js 로드 시작');


// 앱 초기화
function initApp() {
  console.log('initApp 실행');
  
  // Firebase 동기화 시작
  if (typeof fbSync === 'function') {
    console.log('fbSync 실행');
    fbSync();
  }
  
  // 예배 안내 데이터 초기화
  if (typeof initServiceData === 'function') {
    console.log('initServiceData 실행');
    initServiceData();
  }
  
  // 로그인 상태 확인
  checkLoginStatus();
  
  // 탭 초기화
  showTab(0);
  
  console.log('✅ 앱 초기화 완료');
}


// 로그인 상태 확인
function checkLoginStatus() {
  console.log('checkLoginStatus 실행');
  
  if (typeof LS === 'undefined') {
    console.warn('LS 객체 미정의');
    return;
  }
  
  const logged = LS.load('logged', null);
  
  if (logged && logged.id) {
    console.log('저장된 로그인 정보 발견:', logged.id);
    
    // 관리자 계정 확인
    if (typeof ADMIN_ACCOUNTS !== 'undefined') {
      const admin = ADMIN_ACCOUNTS.find(a => a.id === logged.id);
      if (admin) {
        console.log('관리자로 자동 로그인:', admin.name);
        loginSuccess(admin);
        return;
      }
    }
    
    // 일반 회원 확인
    if (Array.isArray(approvedUsers)) {
      const user = approvedUsers.find(u => u.id === logged.id);
      if (user) {
        console.log('회원으로 자동 로그인:', user.name);
        loginSuccess(user);
        return;
      }
    }
  }
  
  // 로그인 화면 표시
  const loginScreen = document.getElementById('screen-login');
  if (loginScreen) {
    loginScreen.style.display = 'flex';
  }
}


// 탭 표시
function showTab(tabIndex) {
  console.log('showTab 실행 - 탭 인덱스:', tabIndex);
  
  // 모든 탭 숨기기
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    page.style.display = 'none';
  });
  
  // 해당 탭 표시
  const pageIds = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'];
  if (pageIds[tabIndex]) {
    const page = document.getElementById(pageIds[tabIndex]);
    if (page) {
      page.style.display = 'block';
      console.log('탭 ' + tabIndex + ' 표시됨');
      
      // 탭별 초기화 로직
      switch(tabIndex) {
        case 0: // 홈
          if (typeof renderServiceView === 'function') {
            renderServiceView();
          }
          break;
        case 2: // 말씀
          if (typeof renderTodayVerse === 'function') {
            renderTodayVerse();
          }
          break;
        case 3: // 성경 읽기
          console.log('성경 읽기 탭 진입');
          break;
        case 4: // 기도
          if (typeof renderPrayerList === 'function') {
            renderPrayerList();
          }
          break;
      }
    }
  }
  
  // 활성 탭 버튼 스타일 업데이트
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab, index) => {
    if (index === tabIndex) {
      tab.style.background = 'rgba(255,255,255,0.15)';
      tab.style.color = 'white';
    } else {
      tab.style.background = 'transparent';
      tab.style.color = 'rgba(255,255,255,0.6)';
    }
  });
}


// 토스트 메시지 (이미 js_ui.js에 정의되어 있음)
// 여기서는 참고만


// 모달 열기
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    console.log('모달 열기:', modalId);
  }
}


// 모달 닫기
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    console.log('모달 닫기:', modalId);
  }
}


// 모달 배경 클릭 시 닫기
document.addEventListener('click', function(event) {
  if (event.target.classList && event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
});


// 페이지 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded 이벤트 발생');
  
  // 약간의 지연을 둔 후 초기화 (모든 스크립트가 로드되도록)
  setTimeout(() => {
    initApp();
  }, 500);
});


// 또는 window load 이벤트로도 처리
window.addEventListener('load', function() {
  console.log('window load 이벤트 발생');
  
  // 앱이 이미 초기화되었으면 스킵
  if (typeof appInitialized === 'undefined') {
    initApp();
    window.appInitialized = true;
  }
});


console.log('✅ js_app.js 로드 완료');