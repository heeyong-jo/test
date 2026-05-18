// ==================== UI 관련 (탭, 스와이프, 시계, 토스트, 모달) ====================
let toastTimer = null;
let currentTab = 0;
const TOTAL_TABS = 7;


// 시계 업데이트
function tick() {
  const now = new Date();
  const el = document.getElementById('htime');
  if (el) el.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}
setInterval(tick, 1000);
tick();


// 토스트 메시지
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}


// 모달 닫기 공통 함수
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}


// 탭 전환
function showTab(n) {
  n = Math.max(0, Math.min(TOTAL_TABS - 1, n));
  if (n !== 0 && !currentUser) {
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  currentTab = n;
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === n));
  for (let i = 0; i < TOTAL_TABS; i++) {
    document.getElementById('p' + i).classList.toggle('show', i === n);
  }


  // 성경책 탭(p5)을 떠날 때 모든 하위 뷰 강제 숨김
  if (n !== 5) {
    ['bibleScriptureView', 'bibleHymnView', 'bibleAppendixView'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const main = document.getElementById('bibleMain');
    if (main) main.style.display = 'flex';
  }


  // 성경읽기(p3)를 떠날 때 읽기 화면 정리
  if (n !== 3) {
    const readerScreen = document.getElementById('bible-reader-screen');
    const readerHome = document.getElementById('bible-reader-home');
    if (readerScreen) readerScreen.style.display = 'none';
    if (readerHome) readerHome.style.display = 'block';
  }


  // 게시판(p2)를 떠날 때 게시판 본문 숨김
  if (n !== 2) {
    const boardContent = document.getElementById('board-content');
    const boardCategory = document.getElementById('board-category-list');
    if (boardContent) boardContent.style.display = 'none';
    if (boardCategory) boardCategory.style.display = 'block';
  }


  afterTab(n);
}


// 탭 전환 후 추가 작업
function afterTab(n) {
  if (n === 0) {
    if (typeof renderHomeNotices === 'function') renderHomeNotices();
    if (typeof renderServiceView === 'function') renderServiceView();
  }
  if (n === 1) {
    if (typeof renderMeditations === 'function') renderMeditations();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
  }
  if (n === 2) {
    if (typeof initBoard === 'function') initBoard();
    if (typeof renderPosts === 'function') renderPosts();
  }
  if (n === 3) {
    if (typeof loadBibleStatus === 'function') loadBibleStatus();
    if (typeof loadBibleHallOfFame === 'function') loadBibleHallOfFame();
  }
  if (n === 4) {
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
  }
  if (n === 5 && typeof initBible === 'function') {
    initBible();
  }
  if (n === 6) {
    if (currentUser && currentUser.role === 'admin') {
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
      if (typeof renderOfferingsAccord === 'function') renderOfferingsAccord();
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
    } else if (currentUser && currentUser.role === 'manager') {
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
    }
  }
}


// ==================== 스와이프 제스처 ====================
(function() {
  const container = document.getElementById('swipe-container');
  if (!container) return;


  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isSwiping = false;


  container.addEventListener('touchstart', function(e) {
    if (currentTab === 5) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = false;
  }, { passive: true });


  container.addEventListener('touchmove', function(e) {
    if (currentTab === 5) return;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    if (deltaX > 10 && deltaX > deltaY && !isSwiping) {
      isSwiping = true;
      e.preventDefault();
    }
  }, { passive: false });


  container.addEventListener('touchend', function(e) {
    if (currentTab === 5) return;
    if (!isSwiping) return;


    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - touchStartX;
    const deltaTime = Date.now() - touchStartTime;


    if (Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0 && currentTab > 0) {
        switchToTab(currentTab - 1);
      } else if (deltaX < 0 && currentTab < TOTAL_TABS - 1) {
        switchToTab(currentTab + 1);
      }
    }
    isSwiping = false;
  }, { passive: true });


  function switchToTab(newIndex) {
    if (newIndex === 6 && !currentUser && !window.currentUser) {
      const loginScreen = document.getElementById('screen-login');
      if (loginScreen) loginScreen.style.display = 'flex';
      return;
    }


    if (currentTab === 2) {
      const boardContent = document.getElementById('board-content');
      if (boardContent && boardContent.style.display === 'block') {
        showBoardCategoryList();
      }
    }


    if (currentTab === 3) {
      const readerScreen = document.getElementById('bible-reader-screen');
      const readerHome = document.getElementById('bible-reader-home');
      if (readerScreen && readerScreen.style.display === 'block') {
        if (readerScreen) readerScreen.style.display = 'none';
        if (readerHome) readerHome.style.display = 'block';
      }
    }


    showTab(newIndex);
  }
})();


// ==================== 유틸리티 함수 ====================


// XSS 방지 함수
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}


// 권한에 따라 관리자 전용 요소 표시/숨김
function applyRole(role) {
  const isAdmin = role === 'admin';
  const isAdminOrManager = role === 'admin' || role === 'manager';


  function showEl(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'button') {
      el.classList.add('visible-inline');
      el.classList.remove('visible');
      el.setAttribute('style', 'display:inline-block !important');
    } else {
      el.classList.add('visible');
      el.classList.remove('visible-inline');
      el.setAttribute('style', 'display:block !important');
    }
  }
  function hideEl(el) {
    el.classList.remove('visible', 'visible-inline');
    el.setAttribute('style', 'display:none !important');
  }


  document.querySelectorAll('.admin-only').forEach(el => {
    if (isAdmin) showEl(el); else hideEl(el);
  });
  document.querySelectorAll('.admin-manager-only').forEach(el => {
    if (isAdminOrManager) showEl(el); else hideEl(el);
  });
}