// ==================== UI 관련 (탭, 스와이프, 시계, 토스트, 모달) ====================
let toastTimer = null;
// 전역 변수 (필요시 초기화)
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


  // 🔥 성경책 탭(p5)을 떠날 때 모든 하위 뷰 강제 숨김
  if (n !== 5) {
    ['bibleScriptureView', 'bibleHymnView', 'bibleAppendixView'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const main = document.getElementById('bibleMain');
    if (main) main.style.display = 'flex';
  }


  // 🔥 성경읽기(p3)를 떠날 때 읽기 화면 정리
  if (n !== 3) {
    const readerScreen = document.getElementById('bible-reader-screen');
    const readerHome = document.getElementById('bible-reader-home');
    if (readerScreen) readerScreen.style.display = 'none';
    if (readerHome) readerHome.style.display = 'block';
  }


  // 🔥 게시판(p2)를 떠날 때 게시판 본문 숨김
  if (n !== 2) {
    const boardContent = document.getElementById('board-content');
    const boardCategory = document.getElementById('board-category-list');
    if (boardContent) boardContent.style.display = 'none';
    if (boardCategory) boardCategory.style.display = 'block';
  }


  afterTab(n);
}


// 탭 전환 후 추가 작업 (수정)
function afterTab(n) {
  console.log('afterTab:', n);
  
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
    // 성경 읽기 - 함수가 없으면 조용히 넘어감
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


// ==================== 스와이프 제스처 (간소화된 버전) ====================
(function() {
  const container = document.getElementById('swipe-container');
  if (!container) return;
  
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isSwiping = false;
  
  container.addEventListener('touchstart', function(e) {
    // 성경책 탭(p5)에서는 스와이프 비활성화
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
    
    // 수평 스와이프 감지 시 기본 스크롤 방지
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
    
    // 빠른 스와이프: 50px 이상, 300ms 이내
    if (Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0 && currentTab > 0) {
        // 오른쪽으로 스와이프 = 이전 탭
        switchToTab(currentTab - 1);
      } else if (deltaX < 0 && currentTab < TOTAL_TABS - 1) {
        // 왼쪽으로 스와이프 = 다음 탭
        switchToTab(currentTab + 1);
      }
    }
    
    isSwiping = false;
  }, { passive: true });
  
  // 탭 전환 함수 (애니메이션 없이 즉시 전환)
  function switchToTab(newIndex) {
    // 관리자 탭 접근 제한
    if (newIndex === 6 && !currentUser && !window.currentUser) {
      const loginScreen = document.getElementById('screen-login');
      if (loginScreen) loginScreen.style.display = 'flex';
      return;
    }
    
    // 현재 탭에서 벗어날 때 게시판/성경읽기 화면 정리
    if (currentTab === 2) {
      // 게시판 화면 정리
      const boardContent = document.getElementById('board-content');
      if (boardContent && boardContent.style.display === 'block') {
        showBoardCategoryList();
      }
    }
    
    if (currentTab === 3) {
      // 성경읽기 화면 정리
      const readerScreen = document.getElementById('bible-reader-screen');
      const readerHome = document.getElementById('bible-reader-home');
      if (readerScreen && readerScreen.style.display === 'block') {
        if (readerScreen) readerScreen.style.display = 'none';
        if (readerHome) readerHome.style.display = 'block';
      }
    }
    
    // 탭 전환
    showTab(newIndex);
  }
})();
  
  el.addEventListener('touchstart', e => {
    if (currentTab === 5 && currentBibleSection) { locked = true; return; }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = false;
    locked = false;
    dragDir = 0;
    curEl = getPage(currentTab);
    nxtEl = null;
  }, { passive: true });
  
  el.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (!dragging && !locked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.8) { locked = true; curEl = null; return; }
            dragging = true;
      dragDir = dx > 0 ? -1 : 1;
      if (curEl) {
        const r = curEl.getBoundingClientRect();
        curEl.style.cssText = `display:block !important;position:fixed;top:${r.top}px;left:0;width:100%;z-index:9;transform:translateX(0);overflow-y:hidden;max-height:calc(100dvh - ${r.top}px);will-change:transform;`;
      }
      nxtEl = prepareNext(dragDir);
    }
    if (locked || !dragging) return;
    let tx = dx;
    if ((dx > 0 && currentTab === 0) || (dx < 0 && getNext(1) < 0)) tx = dx * 0.18;
    if (curEl) curEl.style.transform = `translateX(${tx}px)`;
    if (nxtEl) nxtEl.style.transform = `translateX(${tx + (dragDir > 0 ? W() : -W())}px)`;
  }, { passive: false });
  
  el.addEventListener('touchend', e => {
    if (locked) { locked = false; return; }
    if (!dragging) { if (curEl) curEl.style.cssText = ''; return; }
    const dx = e.changedTouches[0].clientX - startX;
    const ratio = Math.abs(dx) / W();
    const ni = getNext(dragDir);
    const will = ratio >= 0.3 && nxtEl !== null && ni >= 0 && ni < TOTAL_TABS;
    dragging = false;
    if (will) {
      const tX = dragDir > 0 ? -W() : W();
      const sp = dx;
      const dur = 220;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      (function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const pos = sp + (tX - sp) * ease(t);
        if (curEl) curEl.style.transform = `translateX(${pos}px)`;
        if (nxtEl) nxtEl.style.transform = `translateX(${pos + (dragDir > 0 ? W() : -W())}px)`;
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          if (ni !== 0 && !currentUser) {
            cleanup(currentTab);
            document.getElementById('screen-login').style.display = 'flex';
          } else {
            currentTab = ni;
            document.querySelectorAll('.tab').forEach((tb, i) => tb.classList.toggle('active', i === currentTab));
            cleanup(currentTab);
          }
        }
      })(start);
    } else {
      const sp = dx;
      const dur = 180;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      (function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const pos = sp * (1 - ease(t));
        if (curEl) curEl.style.transform = `translateX(${pos}px)`;
        if (nxtEl) nxtEl.style.transform = `translateX(${pos + (dragDir > 0 ? W() : -W())}px)`;
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          cleanup(currentTab);
        }
      })(start);
    }
  }, { passive: true });
})();


// XSS 방지 함수 (간단한 이스케이프)
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