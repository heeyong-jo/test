let toastTimer = null;
let currentTab = 0;
const TOTAL_TABS = 7;


function tick() {
  const now = new Date();
  const el = document.getElementById('htime');
  if (el) el.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}
setInterval(tick, 1000);
tick();


function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) {
    console.warn('Toast 요소를 찾을 수 없음:', msg);
    alert(msg);
    return;
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (t) t.classList.remove('show');
  }, 2200);
}


function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
  } else {
    console.warn(`Modal "${id}"를 찾을 수 없음`);
  }
}


function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}




function showTab(n) {
  console.log('showTab 호출:', n, 'currentUser:', currentUser ? '있음' : '없음');
  
  n = Math.max(0, Math.min(TOTAL_TABS - 1, n));
  
  // 로그인 필요한 탭 체크
  const needLoginTabs = [2, 3, 5, 6];
  const publicTabs = [0, 1, 4];
  
  // 로그인하지 않은 상태에서 제한된 탭 접근 시도
  if (!currentUser && needLoginTabs.includes(n)) {
    console.log('로그인 필요한 탭 접근 시도:', n);
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  // 현재 탭과 동일하면 리렌더링하지 않음
  if (currentTab === n) {
    console.log('이미 현재 탭:', n);
    return;
  }
  
  // 탭 변경
  currentTab = n;
  
  // 모든 탭 비활성화, 선택된 탭만 활성화
  document.querySelectorAll('.tab').forEach((tab, i) => {
    if (i === n) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // 모든 페이지 숨기고, 선택된 페이지만 표시
  for (let i = 0; i < TOTAL_TABS; i++) {
    const page = document.getElementById('p' + i);
    if (page) {
      if (i === n) {
        page.classList.add('show');
        page.style.display = 'block';
        console.log('페이지 표시:', 'p' + i);
      } else {
        page.classList.remove('show');
        page.style.display = 'none';
      }
    }
  }
  
  // 성경 뷰 상태 유지
  if (n !== 5) {
    ['bibleScriptureView', 'bibleHymnView', 'bibleAppendixView'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const main = document.getElementById('bibleMain');
    if (main) main.style.display = 'flex';
  }
  
  console.log('탭 변경 완료:', n);
  afterTab(n);
}


function afterTab(n) {
  if (n === 0) {
    if (typeof renderHomeNotices === 'function') renderHomeNotices();
    if (typeof renderServiceView === 'function') renderServiceView();
  }
  if (n === 1) {
    
    if (typeof loadMeditations === 'function') {
      loadMeditations();
    } else if (typeof renderMeditations === 'function') {
      renderMeditations();
    }
    if (typeof renderTodayVerse === 'function') {
      renderTodayVerse();
    }
  }
  if (n === 2) {
    console.log('📋 게시물 탭 열림');
    if (typeof initBoard === 'function') initBoard();
    const list = document.getElementById('board-category-list');
    const content = document.getElementById('board-content');
    if (list) {
      list.style.display = 'flex';
      list.style.visibility = 'visible';
      list.style.pointerEvents = 'auto';
    }
    if (content) {
      content.style.display = 'none';
      content.style.visibility = 'hidden';
    }
  }
  if (n === 3) {
    if (typeof loadBibleStatus === 'function') loadBibleStatus();
    if (typeof loadBibleHallOfFame === 'function') loadBibleHallOfFame();
  }  
  if (n === 4) {
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof loadStaff === 'function') loadStaff();
  }
  if (n === 5 && typeof initBible === 'function') initBible();
  if (n === 6) {
    if (currentUser && currentUser.role === 'admin') {
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
    }
  }
}


// ==================== 스와이프 (슬라이딩) ====================
(function() {
  const container = document.getElementById('swipe-container');
  if (!container) {
    console.warn('swipe-container 요소 없음');
    return;
  }
  
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isSwiping = false;
  
  container.addEventListener('touchstart', function(e) {
    // 성경 탭에서는 스와이프 비활성화
    if (currentTab === 5) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = false;
    console.log('터치 시작:', touchStartX);
  }, { passive: true });
  
  container.addEventListener('touchmove', function(e) {
    if (currentTab === 5) return;
    
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    
    // 수평 이동이 수직 이동보다 크면 스와이프로 인식
    if (deltaX > 10 && deltaX > deltaY && !isSwiping) {
      isSwiping = true;
      
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const isScrollable = target.scrollWidth > target.clientWidth;
      
      // 입력 필드나 스크롤 가능한 영역이 아니면 기본 동작 방지
      if (!isInput && !isScrollable) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  container.addEventListener('touchend', function(e) {
    if (currentTab === 5) return;
    if (!isSwiping) return;
    
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartX;
    const deltaTime = Date.now() - touchStartTime;
    
    console.log('터치 끝:', 'deltaX:', deltaX, 'deltaTime:', deltaTime);
    
    // 최소 50px 이상, 300ms 이내의 빠른 슬라이드
    if (Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0 && currentTab > 0) {
        // 오른쪽으로 스와이프 -> 이전 탭
        console.log('오른쪽 스와이프, 이전 탭으로 이동');
        showTab(currentTab - 1);
      } else if (deltaX < 0 && currentTab < TOTAL_TABS - 1) {
        // 왼쪽으로 스와이프 -> 다음 탭
        console.log('왼쪽 스와이프, 다음 탭으로 이동');
        showTab(currentTab + 1);
      }
    }
    
    isSwiping = false;
  }, { passive: true });
})();
// ==================== 설정 화면 함수 ====================
function openSettingView() {
  const settingInfo = document.getElementById('setting-user-info');
  if (currentUser && settingInfo) {
    const roleText = currentUser.role === 'admin' ? '관리자' : '일반성도';
    settingInfo.textContent = currentUser.name + ' (' + roleText + ')';
  }
}
function applyRole(role) {
  const isAdmin = role === 'admin';
  const isAdminOrManager = role === 'admin' || role === 'manager';
  document.querySelectorAll('.admin-only').forEach(el => {
    if (isAdmin) el.setAttribute('style', 'display:block !important');
    else el.setAttribute('style', 'display:none !important');
  });
  document.querySelectorAll('.admin-manager-only').forEach(el => {
    if (isAdminOrManager) el.setAttribute('style', 'display:block !important');
    else el.setAttribute('style', 'display:none !important');
  });
}