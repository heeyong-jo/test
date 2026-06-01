if (typeof toastTimer === 'undefined') var toastTimer = null;
if (typeof currentBibleSection === 'undefined') var currentBibleSection = null;
if (typeof currentTab === 'undefined') var currentTab = 0;
if (typeof TOTAL_TABS === 'undefined') var TOTAL_TABS = 7;
if (typeof tabContainer === 'undefined') var tabContainer = null;
if (typeof tabScrollStartX === 'undefined') var tabScrollStartX = 0;
if (typeof tabOriginalScroll === 'undefined') var tabOriginalScroll = 0;


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
  console.log('showTab 호출:', n, 'currentUser:', currentUser);
  
  n = Math.max(0, Math.min(TOTAL_TABS - 1, n));
  
  // ⭐ 수정: 로그인이 필요한 탭: 2(게시물), 3(성경읽기), 6(관리)
  // 성경책(5)은 로그인 없이 접근 가능!
  const needLoginTabs = [2, 3, 6];  // 게시물, 성경읽기, 관리
  const publicTabs = [0, 1, 4, 5];  // 홈, 말씀, 안내, 성경책
  
  // 로그인하지 않은 상태에서 로그인 필요한 탭 접근 시도
  if (!currentUser && needLoginTabs.includes(n)) {
    console.log('로그인 필요 탭 접근:', n);
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  currentTab = n;
  
  // 탭 UI 업데이트
  document.querySelectorAll('.tab').forEach((t, i) => {
    if (i === n) t.classList.add('active');
    else t.classList.remove('active');
  });
  
  // 페이지 표시 업데이트
  for (let i = 0; i < TOTAL_TABS; i++) {
    const page = document.getElementById('p' + i);
    if (page) {
      if (i === n) {
        page.classList.add('show');
        page.style.display = 'block';
      } else {
        page.classList.remove('show');
        page.style.display = 'none';
      }
    }
  }
  
  afterTab(n);
}




// 탭 전환 후 추가 작업
function afterTab(n) {
  if (n === 0 && typeof renderHomeNotices === 'function') renderHomeNotices();
  if (n === 1) {
    if (typeof renderMeditations === 'function') renderMeditations();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
  }
  if (n === 2 && typeof renderPrayers === 'function') renderPrayers();
  if (n === 3 && typeof renderPosts === 'function') renderPosts();
  if (n === 4) {
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
  }
  // ⭐ 수정: 성경책 탭 (n === 5) - initBible 함수 대신 성경 목록 초기화
  if (n === 5) {
    // 성경책 메인 화면 초기화
    const bibleMain = document.getElementById('bibleMain');
    const bibleScriptureView = document.getElementById('bibleScriptureView');
    const bibleHymnView = document.getElementById('bibleHymnView');
    const bibleAppendixView = document.getElementById('bibleAppendixView');
    
    if (bibleMain) bibleMain.style.display = 'flex';
    if (bibleScriptureView) bibleScriptureView.style.display = 'none';
    if (bibleHymnView) bibleHymnView.style.display = 'none';
    if (bibleAppendixView) bibleAppendixView.style.display = 'none';
    
    // 성경 목록이 아직 초기화되지 않았으면 초기화
    if (typeof initBibleBooks === 'function') {
      const otDiv = document.getElementById('otBooks');
      if (otDiv && !otDiv.innerHTML) {
        initBibleBooks();
      }
    }
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




// 스와이프 제스처 (터치 슬라이드)
(function() {
  const el = document.getElementById('swipe-container');
  if (!el) return;
  let startX = 0, startY = 0, dragging = false, locked = false, dragDir = 0;
  let curEl = null, nxtEl = null;
  const W = () => window.innerWidth;
  
  function getPage(n) { return document.getElementById('p' + n); }
  
  function getNext(dir) {
    let idx = currentTab + dir;
    while (idx >= 0 && idx < TOTAL_TABS) {
      const t = document.getElementById('tab' + idx);
      if (t && t.style.display !== 'none') return idx;
      idx += dir;
    }
    return -1;
  }
  
  function prepareNext(dir) {
  const ni = getNext(dir);
  if (ni < 0) return null;
  const nxt = getPage(ni);
  const top = curEl ? curEl.getBoundingClientRect().top : 60;
  // ⭐ 초기 위치 설정 및 보이게 처리
  nxt.style.cssText = `display:block !important;position:fixed;top:${top}px;left:0;width:100%;z-index:10;transform:translateX(${dir > 0 ? W() : -W()}px);overflow-y:hidden;max-height:calc(100dvh - ${top}px);will-change:transform;opacity:1;`;
  return nxt;
}
  
el.addEventListener('touchstart', e => {
  if (currentTab === 5 && currentBibleSection) { locked = true; return; }
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  dragging = false;
  locked = false;
  dragDir = 0;
  curEl = getPage(currentTab);
  nxtEl = null;
  
  // ⭐ 상단 탭 컨테이너 위치 저장
  tabContainer = document.querySelector('.tabs');
  if (tabContainer) {
    tabScrollStartX = tabContainer.scrollLeft;
    tabOriginalScroll = tabContainer.scrollLeft;
  }
}, { passive: true });
el.addEventListener('touchmove', e => {
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;
  if (!dragging && !locked) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    if (Math.abs(dy) > Math.abs(dx) * 1.8) { locked = true; curEl = null; return; }
    if (currentTab === 0 && !currentUser && dx > 30) {
      e.preventDefault();
      document.getElementById('screen-login').style.display = 'flex';
      dragging = false;
      locked = true;
      return;
    }
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
  
  // ⭐⭐ 추가: 상단 탭도 함께 이동 (드래그 비율에 따라)
  if (tabContainer && dragging) {
    const ratio = Math.abs(tx) / W();
    const tabWidth = tabContainer.scrollWidth - tabContainer.clientWidth;
    if (tabWidth > 0) {
      const tabMove = (dragDir > 0 ? -1 : 1) * ratio * 80;
      let newScroll = tabOriginalScroll + tabMove;
      newScroll = Math.max(0, Math.min(tabWidth, newScroll));
      tabContainer.scrollLeft = newScroll;
      
      // 드래그 중 탭 스타일 점진적 변경
      const tabs = document.querySelectorAll('.tab');
      const targetTabIndex = currentTab + (dragDir > 0 ? -1 : 1);
      if (targetTabIndex >= 0 && targetTabIndex < TOTAL_TABS) {
        const activeOpacity = 1 - ratio;
        const nextOpacity = ratio;
        tabs[currentTab].style.opacity = Math.max(0.3, activeOpacity);
        if (tabs[targetTabIndex]) {
          tabs[targetTabIndex].style.opacity = Math.min(1, nextOpacity + 0.3);
          tabs[targetTabIndex].style.color = '#d4a840';
        }
      }
    }
  }
}, { passive: false });


  function cleanup(finalIdx) {
    const f = getPage(finalIdx);
    f.style.cssText = '';
    f.classList.add('show');
    requestAnimationFrame(() => {
      for (let i = 0; i < TOTAL_TABS; i++) {
        if (i === finalIdx) continue;
        const p = getPage(i);
        p.style.cssText = '';
        p.classList.remove('show');
      }
      curEl = null;
      nxtEl = null;
      dragDir = 0;
      afterTab(finalIdx);
    });
  }
  
  el.addEventListener('touchend', e => {
  if (locked) { locked = false; return; }
  if (!dragging) { 
    if (curEl) curEl.style.cssText = ''; 
    restoreTabStyles();  // ⭐ 추가
    return; 
  }
  
  const dx = e.changedTouches[0].clientX - startX;
  const ratio = Math.abs(dx) / W();
  const ni = getNext(dragDir);
  const will = ratio >= 0.2 && nxtEl !== null && ni >= 0 && ni < TOTAL_TABS;
  
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
      
      // ⭐ 탭 스크롤 애니메이션 추가
      if (tabContainer && t < 1) {
        const tabWidth = tabContainer.scrollWidth - tabContainer.clientWidth;
        if (tabWidth > 0) {
          const targetTabIndex = currentTab + (dragDir > 0 ? -1 : 1);
          if (targetTabIndex >= 0 && targetTabIndex < TOTAL_TABS) {
            const targetTab = document.querySelectorAll('.tab')[targetTabIndex];
            if (targetTab) {
              const targetLeft = targetTab.offsetLeft;
              const currentLeft = tabContainer.scrollLeft;
              const newLeft = currentLeft + (targetLeft - currentLeft) * ease(t);
              tabContainer.scrollLeft = newLeft;
            }
          }
        }
      }
      
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        if (ni !== 0 && !currentUser) {
          cleanup(currentTab);
          document.getElementById('screen-login').style.display = 'flex';
        } else {
          currentTab = ni;
          document.querySelectorAll('.tab').forEach((tb, i) => {
            tb.classList.toggle('active', i === currentTab);
            tb.style.opacity = '';
            tb.style.color = '';
          });
          cleanup(currentTab);
        }
        restoreTabStyles();
      }
    })(start);
  } else {
    const sp = dx;
    const dur = 250;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    
    (function frame(now) {
      const t = Math.min((now - start) / dur, 1);
      const pos = sp * (1 - ease(t));
      if (curEl) curEl.style.transform = `translateX(${pos}px)`;
      
      // ⭐ 탭 스크롤 복귀 애니메이션 추가
      if (tabContainer && t < 1) {
        const newScroll = tabOriginalScroll + (tabOriginalScroll - tabContainer.scrollLeft) * (1 - ease(t));
        tabContainer.scrollLeft = newScroll;
      }
      
      if (nxtEl) {
        if (t < 0.95) {
          nxtEl.style.transform = `translateX(${pos + (dragDir > 0 ? W() : -W())}px)`;
        } else {
          nxtEl.style.display = 'none';
          nxtEl.style.transform = '';
        }
      }
      
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        if (curEl) curEl.style.cssText = '';
        if (nxtEl) nxtEl.style.cssText = '';
        curEl = null;
        nxtEl = null;
        restoreTabStyles();
      }
    })(start);
  }
}, { passive: true });


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