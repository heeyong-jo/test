// ==================== UI 및 스와이프 제스처 (js_ui.js) ====================
// 최종 통합본 - 중복 제거, 스크롤 위치 유지, 민감도 조절


// ==================== 전역 변수 초기화 ====================
if (typeof toastTimer === 'undefined') var toastTimer = null;
if (typeof currentBibleSection === 'undefined') var currentBibleSection = null;
if (typeof currentTab === 'undefined') var currentTab = 0;
if (typeof TOTAL_TABS === 'undefined') var TOTAL_TABS = 7;
if (typeof tabContainer === 'undefined') var tabContainer = null;
if (typeof tabScrollStartX === 'undefined') var tabScrollStartX = 0;
if (typeof tabOriginalScroll === 'undefined') var tabOriginalScroll = 0;


// ==================== 현재 사용자 가져오기 (통합) ====================
function getCurrentUser() {
  if (typeof window.currentUser !== 'undefined' && window.currentUser) return window.currentUser;
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  return null;
}


// ==================== 시계 업데이트 ====================
function tick() {
  const now = new Date();
  const el = document.getElementById('htime');
  if (el) el.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}
setInterval(tick, 1000);
tick();


// ==================== 토스트 메시지 ====================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}


// ==================== 모달 닫기 ====================
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}


// ==================== 탭 전환 ====================
function showTab(n) {
  console.log('showTab 호출:', n);
  
  n = Math.max(0, Math.min(TOTAL_TABS - 1, n));
  const needLoginTabs = [2, 3, 6];
  const user = getCurrentUser();
  
  if (!user && needLoginTabs.includes(n)) {
    console.log('로그인 필요 탭 접근:', n);
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  // 관리탭 권한 체크
  if (n === 6 && user) {
    const role = user.role;
    if (role !== 'admin' && role !== 'manager') {
      if (typeof showToast === 'function') showToast('⚠️ 관리자 또는 매니저만 접근 가능합니다');
      return;
    }
  }
  
  // 현재 스크롤 위치 저장
  const currentScroll = window.scrollY || document.documentElement.scrollTop;
  sessionStorage.setItem(`scrollPos_${currentTab}`, currentScroll);
  
  currentTab = n;
  
  document.querySelectorAll('.tab').forEach((t, i) => {
    if (i === n) t.classList.add('active');
    else t.classList.remove('active');
  });
  
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
  
  // 저장된 스크롤 위치 복원
  const savedScroll = sessionStorage.getItem(`scrollPos_${n}`);
  if (savedScroll && !isNaN(parseInt(savedScroll))) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedScroll));
    }, 50);
  }
  
  afterTab(n);
}


// ==================== 탭 전환 후 작업 ====================
function afterTab(n) {
  console.log('afterTab 실행:', n);
  
  if (n === 0) {
    if (typeof renderHomeNotices === 'function') renderHomeNotices();
  }
  else if (n === 1) {
    if (typeof renderMeditations === 'function') renderMeditations();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
  }
  else if (n === 2) {
    if (typeof renderPrayers === 'function') renderPrayers();
  }
  else if (n === 3) {
    if (typeof renderPosts === 'function') renderPosts();
  }
  else if (n === 4) {
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof loadStaff === 'function') loadStaff();
  }
  else if (n === 5) {
    if (typeof initBible === 'function') initBible();
  }
  else if (n === 6) {
    const user = getCurrentUser();
    if (user && user.role === 'admin') {
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
      if (typeof renderOfferingsAccord === 'function') renderOfferingsAccord();
    } else if (user && user.role === 'manager') {
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
    }
  }
}


// ==================== 탭 스타일 복원 ====================
function restoreTabStyles() {
  if (!tabContainer) return;
  
  const tabs = document.querySelectorAll('.tab');
  const currentTabEl = tabs[currentTab];
  if (currentTabEl) {
    const targetLeft = currentTabEl.offsetLeft - (tabContainer.clientWidth / 2) + (currentTabEl.clientWidth / 2);
    tabContainer.scrollLeft = Math.max(0, targetLeft);
  }
  
  tabs.forEach(tab => {
    tab.style.opacity = '';
    tab.style.color = '';
  });
}


// ==================== XSS 방지 ====================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}


// ==================== 권한 적용 ====================
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
    if (isAdmin) showEl(el);
    else hideEl(el);
  });
  
  document.querySelectorAll('.admin-manager-only').forEach(el => {
    if (isAdminOrManager) showEl(el);
    else hideEl(el);
  });
}


// ==================== 스와이프 제스처 (수정본) ====================
(function() {
  const el = document.getElementById('swipe-container');
  if (!el) return;
  
  let startX = 0, startY = 0;
  let dragging = false;
  let locked = false;
  let dragDir = 0;
  let curEl = null;
  let nxtEl = null;
  let touchStartTime = 0;
  
  const SWIPE_THRESHOLD = 30;
  const MAX_VERTICAL_RATIO = 1.5;
  const MIN_HORIZONTAL_MOVE = 15;
  
  const W = () => window.innerWidth;
  
  function getPage(n) { 
    return document.getElementById('p' + n); 
  }
  
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
    if (!nxt) return null;
    
    const top = curEl ? curEl.getBoundingClientRect().top : 60;
    nxt.style.cssText = `
      display: block !important;
      position: fixed;
      top: ${top}px;
      left: 0;
      width: 100%;
      z-index: 10;
      transform: translateX(${dir > 0 ? W() : -W()}px);
      overflow-y: auto;
      max-height: calc(100dvh - ${top}px);
      will-change: transform;
      opacity: 1;
      background: var(--bg);
    `;
    return nxt;
  }
  
  function cleanup(finalIdx) {
    const f = getPage(finalIdx);
    if (!f) return;
    
    f.style.cssText = '';
    f.classList.add('show');
    
    for (let i = 0; i < TOTAL_TABS; i++) {
      if (i === finalIdx) continue;
      const p = getPage(i);
      if (p) {
        p.style.cssText = '';
        p.classList.remove('show');
      }
    }
    
    curEl = null;
    nxtEl = null;
    dragDir = 0;
    
    const savedScrollPos = sessionStorage.getItem(`scrollPos_${finalIdx}`);
    if (savedScrollPos && !isNaN(parseInt(savedScrollPos))) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPos));
      }, 50);
    }
    
    setTimeout(() => {
      afterTab(finalIdx);
    }, 50);
  }
  
  function saveCurrentScrollPosition() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    sessionStorage.setItem(`scrollPos_${currentTab}`, currentScroll);
  }
  
  el.addEventListener('touchstart', (e) => {
    if (currentTab === 5 && currentBibleSection) {
      locked = true;
      return;
    }
    
    saveCurrentScrollPosition();
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    touchStartTime = Date.now();
    dragging = false;
    locked = false;
    dragDir = 0;
    curEl = getPage(currentTab);
    nxtEl = null;
    
    tabContainer = document.querySelector('.tabs');
    if (tabContainer) {
      tabScrollStartX = tabContainer.scrollLeft;
      tabOriginalScroll = tabContainer.scrollLeft;
    }
  }, { passive: true });
  
  el.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    
    if (!dragging && !locked) {
      if (Math.abs(dx) < MIN_HORIZONTAL_MOVE && Math.abs(dy) < MIN_HORIZONTAL_MOVE) return;
      
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) {
        locked = true;
        curEl = null;
        return;
      }
      
      const user = getCurrentUser();
      if (currentTab === 0 && !user && dx > SWIPE_THRESHOLD) {
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
        const currentScroll = window.scrollY || document.documentElement.scrollTop;
        curEl.style.cssText = `
          display: block !important;
          position: fixed;
          top: ${r.top}px;
          left: 0;
          width: 100%;
          z-index: 9;
          transform: translateX(0);
          overflow-y: auto;
          max-height: calc(100dvh - ${r.top}px);
          will-change: transform;
          background: var(--bg);
        `;
        curEl.scrollTop = currentScroll;
      }
      nxtEl = prepareNext(dragDir);
    }
    
    if (locked || !dragging) return;
    
    e.preventDefault();
    
    let tx = dx;
    if ((dx > 0 && currentTab === 0) || (dx < 0 && getNext(1) < 0)) {
      tx = dx * 0.3;
    }
    
    if (curEl) curEl.style.transform = `translateX(${tx}px)`;
    if (nxtEl) nxtEl.style.transform = `translateX(${tx + (dragDir > 0 ? W() : -W())}px)`;
    
    if (tabContainer && dragging) {
      const ratio = Math.min(1, Math.abs(tx) / W());
      const tabWidth = tabContainer.scrollWidth - tabContainer.clientWidth;
      if (tabWidth > 0) {
        const tabMove = (dragDir > 0 ? -1 : 1) * ratio * 60;
        let newScroll = tabOriginalScroll + tabMove;
        newScroll = Math.max(0, Math.min(tabWidth, newScroll));
        tabContainer.scrollLeft = newScroll;
        
        const tabs = document.querySelectorAll('.tab');
        const targetTabIndex = currentTab + (dragDir > 0 ? -1 : 1);
        if (targetTabIndex >= 0 && targetTabIndex < TOTAL_TABS) {
          const activeOpacity = Math.max(0.4, 1 - ratio * 0.7);
          const nextOpacity = Math.min(1, 0.3 + ratio * 0.7);
          tabs[currentTab].style.opacity = activeOpacity;
          if (tabs[targetTabIndex]) {
            tabs[targetTabIndex].style.opacity = nextOpacity;
            tabs[targetTabIndex].style.color = '#d4a840';
          }
        }
      }
    }
  }, { passive: false });
  
  el.addEventListener('touchend', (e) => {
    if (locked) { 
      locked = false; 
      if (curEl) curEl.style.cssText = ''; 
      restoreTabStyles();
      return; 
    }
    
    if (!dragging) { 
      if (curEl) curEl.style.cssText = ''; 
      restoreTabStyles();
      return; 
    }
    
    const dx = e.changedTouches[0].clientX - startX;
    const duration = Date.now() - touchStartTime;
    const velocity = Math.abs(dx) / duration;
    const ratio = Math.abs(dx) / W();
    const ni = getNext(dragDir);
    const will = (velocity > 0.5 && Math.abs(dx) > 50) || (ratio >= 0.2 && nxtEl !== null && ni >= 0 && ni < TOTAL_TABS);
    
    dragging = false;
    
    if (will) {
      const tX = dragDir > 0 ? -W() : W();
      const sp = dx;
      const dur = 250;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      
      (function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const pos = sp + (tX - sp) * ease(t);
        if (curEl) curEl.style.transform = `translateX(${pos}px)`;
        if (nxtEl) nxtEl.style.transform = `translateX(${pos + (dragDir > 0 ? W() : -W())}px)`;
        
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
          const user = getCurrentUser();
          if (ni !== 0 && !user) {
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
      const dur = 300;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      
      (function frame(now) {
        const t = Math.min((now - start) / dur, 1);
        const pos = sp * (1 - ease(t));
        if (curEl) curEl.style.transform = `translateX(${pos}px)`;
        
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
          if (curEl) {
            curEl.style.cssText = '';
            const savedPos = sessionStorage.getItem(`scrollPos_${currentTab}`);
            if (savedPos && !isNaN(parseInt(savedPos))) {
              window.scrollTo(0, parseInt(savedPos));
            }
          }
          if (nxtEl) nxtEl.style.cssText = '';
          curEl = null;
          nxtEl = null;
          restoreTabStyles();
        }
      })(start);
    }
  }, { passive: true });
})();


console.log('✅ js_ui.js 로드 완료 (통합본)');