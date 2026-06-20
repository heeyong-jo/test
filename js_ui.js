// ==================== UI 및 스와이프 제스처 (js_ui.js) ====================


if (typeof toastTimer === 'undefined') var toastTimer = null;
if (typeof currentBibleSection === 'undefined') var currentBibleSection = null;
if (typeof currentTab === 'undefined') var currentTab = 0;
if (typeof TOTAL_TABS === 'undefined') var TOTAL_TABS = 7;
if (typeof tabContainer === 'undefined') var tabContainer = null;
if (typeof tabScrollStartX === 'undefined') var tabScrollStartX = 0;
if (typeof tabOriginalScroll === 'undefined') var tabOriginalScroll = 0;




// ==================== 현재 사용자 가져오기 ====================
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
  console.log('applyRole 실행:', role);
  
  const isAdmin = role === 'admin';
  const isAdminOrManager = role === 'admin' || role === 'manager';


  function showEl(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'button') {
      el.classList.add('visible-inline');
      el.classList.remove('visible');
      el.style.cssText = 'display:inline-block !important';
    } else {
      el.classList.add('visible');
      el.classList.remove('visible-inline');
      el.style.cssText = 'display:block !important';
    }
  }
  
  function hideEl(el) {
    el.classList.remove('visible', 'visible-inline');
    el.style.cssText = 'display:none !important';
  }


  document.querySelectorAll('.admin-only').forEach(el => {
    if (isAdmin) showEl(el);
    else hideEl(el);
  });
  
  document.querySelectorAll('.admin-manager-only').forEach(el => {
    if (isAdminOrManager) showEl(el);
    else hideEl(el);
  });
  
  if (currentTab === 6 && isAdminOrManager) {
    const p6 = document.getElementById('p6');
    if (p6) {
      p6.style.display = 'block';
      p6.classList.add('show');
    }
  }
}




// ==================== 탭 전환 (index.html의 .tab, .page 사용) ====================
function showTab(n) {
  console.log('showTab 호출:', n);
  
  const totalTabs = 7;
  n = Math.max(0, Math.min(totalTabs - 1, n));
  
  const user = getCurrentUser();
  const needLoginTabs = [2, 3, 6];
  
  // 로그인 체크
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
      console.log('권한 없음 - 관리탭 접근 불가:', role);
      showToast('⚠️ 관리자 또는 매니저만 접근 가능합니다');
      showTab(0);
      return;
    }
  }
  
  currentTab = n;
  
  // 탭 버튼 활성화 (.tab 사용)
  document.querySelectorAll('.tab').forEach((t, i) => {
    if (i === n) t.classList.add('active');
    else t.classList.remove('active');
  });
  
  // 페이지 표시 (.page 사용)
  for (let i = 0; i < totalTabs; i++) {
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
  
  // 관리탭 UI 업데이트
  if (n === 6 && user) {
    const role = user.role;
    document.querySelectorAll('.admin-only, .admin-manager-only').forEach(el => {
      if (role === 'admin' && el.classList.contains('admin-only')) {
        el.style.display = 'block';
      } else if (el.classList.contains('admin-manager-only')) {
        el.style.display = 'block';
      }
    });
    
    const settingInfoSpan = document.getElementById('setting-user-info');
    if (settingInfoSpan) {
      const roleText = user.role === 'admin' ? '관리자' : (user.role === 'manager' ? '매니저' : '일반성도');
      settingInfoSpan.textContent = `${user.name} (${roleText})`;
    }
  }
  
  setTimeout(() => window.scrollTo(0, 0), 50);
  
  // 탭 전환 후 처리
  afterTab(n);
}




// ==================== 탭 전환 후 작업 ====================
function afterTab(n) {
  console.log('afterTab 실행:', n);
  
  // 관리자/매니저 버튼 표시 제어 (.tab이 아닌 일반 버튼용)
  if (n === 0) {
    const user = getCurrentUser();
    document.querySelectorAll('.admin-only, .admin-manager-only').forEach(el => {
      if (user && (user.role === 'admin' || user.role === 'manager')) {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  }
  
  if (n === 0) {
    // 홈
    if (typeof renderHomeNotices === 'function') renderHomeNotices();
    if (typeof renderServiceView === 'function') renderServiceView();
  }
  else if (n === 1) {
    // 말씀
    console.log('말씀 탭 렌더링 시작');
    if (typeof renderMeditations === 'function') renderMeditations();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
    if (typeof loadPrayers === 'function') loadPrayers();
    if (typeof renderPrayers === 'function') renderPrayers();
  }
  else if (n === 2) {
    // 게시물
    console.log('게시물 탭 렌더링 시작');
    if (typeof initBoard === 'function') initBoard();
  }
  else if (n === 3) {
    // 성경읽기
    console.log('성경읽기 탭 렌더링 시작');
    if (typeof loadBibleHallOfFame === 'function') loadBibleHallOfFame();
    if (typeof loadBibleStatus === 'function') loadBibleStatus();
  }
  else if (n === 4) {
    // 안내
    console.log('안내 탭 렌더링 시작');
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof loadStaff === 'function') loadStaff();
    if (typeof loadChurchInfo === 'function') loadChurchInfo();
  }
  else if (n === 5) {
    // 성경책
    console.log('성경책 탭 렌더링 시작');
    if (typeof initBible === 'function') initBible();
  }
  else if (n === 6) {
    // 관리
    const user = getCurrentUser();
    console.log('관리탭 렌더링, role:', user ? user.role : 'none');
    
    const p6 = document.getElementById('p6');
    if (p6) {
      p6.style.display = 'block';
      p6.classList.add('show');
    }
    
    if (user && user.role === 'admin') {
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
    } 
    else if (user && user.role === 'manager') {
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
    }
    
    const settingInfoSpan = document.getElementById('setting-user-info');
    if (settingInfoSpan && user) {
      const roleText = user.role === 'admin' ? '관리자' : (user.role === 'manager' ? '매니저' : '일반성도');
      settingInfoSpan.textContent = `${user.name} (${roleText})`;
    }
  }
  
  console.log('afterTab 완료:', n);
}




// ==================== 관리탭 렌더링 함수들 ====================


window.renderMembersAccord = function() {
  console.log('renderMembersAccord 실행');
  const container = document.getElementById('accord-member-list');
  if (!container) return;
  
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    container.innerHTML = '<div style="padding:20px;text-align:center;">⚠️ 관리자만 접근 가능합니다.</div>';
    return;
  }
  
  container.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner"></div><div>로딩 중...</div></div>';
  
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    firebase.database().ref('members').once('value')
      .then(snap => {
        const data = snap.val();
        const members = data ? Object.values(data) : [];
        
        if (members.length === 0) {
          container.innerHTML = '<div style="padding:20px;text-align:center;">📋 등록된 성도가 없습니다.</div>';
          return;
        }
        
        let html = '';
        members.forEach(m => {
          html += `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--border);">
              <div>
                <div style="font-weight:700;">${escapeHtml(m.name || '이름 없음')}</div>
                <div style="font-size:12px;color:var(--text2);">${escapeHtml(m.dept || '직책 없음')}</div>
              </div>
              <div style="font-size:12px;">${escapeHtml(m.phone || '-')}</div>
            </div>
          `;
        });
        container.innerHTML = html;
      })
      .catch(err => {
        console.error('멤버 로드 실패:', err);
        container.innerHTML = '<div style="padding:20px;color:red;">⚠️ 데이터를 불러올 수 없습니다.</div>';
      });
  } else {
    container.innerHTML = '<div style="padding:20px;color:red;">⚠️ Firebase 연결이 필요합니다.</div>';
  }
};


window.renderApprovalsAccord = function() {
  console.log('renderApprovalsAccord 실행');
  const container = document.getElementById('accord-approval-list');
  if (!container) return;
  
  const user = getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    container.innerHTML = '<div style="padding:20px;text-align:center;">⚠️ 관리자/매니저만 접근 가능합니다.</div>';
    return;
  }
  
  container.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner"></div><div>로딩 중...</div></div>';
  
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    firebase.database().ref('pendingUsers').once('value')
      .then(snap => {
        const data = snap.val();
        const pending = data ? Object.values(data) : [];
        
        const subEl = document.getElementById('ac-approval-sub');
        if (subEl) subEl.textContent = `대기 ${pending.length}명`;
        
        if (pending.length === 0) {
          container.innerHTML = '<div style="padding:20px;text-align:center;">✅ 승인 대기자가 없습니다.</div>';
          return;
        }
        
        let html = '';
        pending.forEach(p => {
          html += `
            <div style="padding:14px;background:rgba(255,215,0,0.1);border-radius:12px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:700;">${escapeHtml(p.name || '이름 없음')}</div>
                  <div style="font-size:12px;color:var(--text2);">아이디: ${escapeHtml(p.id || '-')}</div>
                  <div style="font-size:11px;color:var(--text2);">${escapeHtml(p.email || '-')} / ${escapeHtml(p.phone || '-')}</div>
                </div>
                <div style="display:flex;gap:8px;">
                  <button onclick="approveUser('${p.id}')" style="background:#10b981;border:none;border-radius:20px;padding:5px 12px;color:white;cursor:pointer;">승인</button>
                  <button onclick="rejectUser('${p.id}')" style="background:#ef4444;border:none;border-radius:20px;padding:5px 12px;color:white;cursor:pointer;">거절</button>
                </div>
              </div>
            </div>
          `;
        });
        container.innerHTML = html;
      })
      .catch(err => {
        console.error('승인 대기자 로드 실패:', err);
        container.innerHTML = '<div style="padding:20px;color:red;">⚠️ 데이터를 불러올 수 없습니다.</div>';
      });
  } else {
    container.innerHTML = '<div style="padding:20px;color:red;">⚠️ Firebase 연결이 필요합니다.</div>';
  }
};


window.approveUser = function(userId) {
  if (!confirm('이 사용자를 승인하시겠습니까?')) return;
  // Firebase 승인 처리
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    const db = firebase.database();
    const pendingRef = db.ref('pendingUsers/' + userId);
    pendingRef.once('value')
      .then(snap => {
        const userData = snap.val();
        if (userData) {
          // members로 이동
          const membersRef = db.ref('members');
          membersRef.push(userData);
          // pending에서 삭제
          pendingRef.remove();
          showToast('✅ 승인 완료되었습니다.');
          renderApprovalsAccord();
          renderMembersAccord();
        }
      })
      .catch(err => {
        console.error('승인 처리 실패:', err);
        showToast('❌ 승인 처리에 실패했습니다.');
      });
  } else {
    showToast('⚠️ Firebase 연결이 필요합니다.');
  }
};


window.rejectUser = function(userId) {
  if (!confirm('이 사용자를 거절하시겠습니까?')) return;
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    firebase.database().ref('pendingUsers/' + userId).remove()
      .then(() => {
        showToast('✅ 거절 처리되었습니다.');
        renderApprovalsAccord();
      })
      .catch(err => {
        console.error('거절 처리 실패:', err);
        showToast('❌ 거절 처리에 실패했습니다.');
      });
  } else {
    showToast('⚠️ Firebase 연결이 필요합니다.');
  }
};




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




// ==================== 스와이프 제스처 ====================
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
  const TOP_POSITION = 60;
  
  const W = () => window.innerWidth;
  
  function getPage(n) { 
    return document.getElementById('p' + n); 
  }
  
  function getNext(dir) {
    let idx = currentTab + dir;
    if (idx < 0 || idx >= TOTAL_TABS) return -1;
    
    while (idx >= 0 && idx < TOTAL_TABS) {
      const t = document.getElementById('tab' + idx);
      if (t && t.style.display !== 'none') return idx;
      idx += dir;
    }
    return -1;
  }
  
  function saveCurrentScrollPosition() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    sessionStorage.setItem(`scrollPos_${currentTab}`, currentScroll);
  }
  
  function prepareNext(dir) {
    const ni = getNext(dir);
    if (ni < 0) return null;
    const nxt = getPage(ni);
    if (!nxt) return null;
    
    nxt.style.cssText = `
      display: block !important;
      position: fixed;
      top: ${TOP_POSITION}px;
      left: 0;
      width: 100%;
      z-index: 5;
      transform: translateX(${dir > 0 ? W() : -W()}px);
      overflow-y: auto;
      max-height: calc(100dvh - ${TOP_POSITION}px);
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
    
    setTimeout(() => window.scrollTo(0, 0), 50);
    
    const user = getCurrentUser();
    if (finalIdx === 6 && user) {
      const role = user.role;
      if (role !== 'admin' && role !== 'manager') {
        setTimeout(() => {
          showTab(0);
          showToast('⚠️ 관리자 또는 매니저만 접근 가능합니다');
        }, 50);
        return;
      }
    }
    
    afterTab(finalIdx);
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
      
      dragging = true;
      dragDir = dx > 0 ? -1 : 1;
      
      if (curEl) {
        curEl.style.cssText = `
          display: block !important;
          position: fixed;
          top: ${TOP_POSITION}px;
          left: 0;
          width: 100%;
          z-index: 5;
          transform: translateX(0);
          overflow-y: auto;
          max-height: calc(100dvh - ${TOP_POSITION}px);
          will-change: transform;
          background: var(--bg);
        `;
      }
      nxtEl = prepareNext(dragDir);
    }
    
    if (locked || !dragging) return;
    
    e.preventDefault();
    
    let tx = dx;
    if ((dx > 0 && currentTab === 0) || (dx < 0 && getNext(-1) < 0)) {
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
    const will = (velocity > 0.3 && Math.abs(dx) > 40) || (ratio >= 0.35 && nxtEl !== null && ni >= 0 && ni < TOTAL_TABS);
    
    dragging = false;
    
    if (will && ni >= 0 && ni < TOTAL_TABS) {
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
          const needLoginTabs = [2, 3, 6];
          
          if (ni === 6 && user) {
            const role = user.role;
            if (role !== 'admin' && role !== 'manager') {
              cleanup(currentTab);
              showToast('⚠️ 관리자 또는 매니저만 접근 가능합니다');
              restoreTabStyles();
              return;
            }
          }
          
          if (ni !== 0 && !user && needLoginTabs.includes(ni)) {
            currentTab = ni;
            document.querySelectorAll('.tab').forEach((tb, i) => {
              tb.classList.toggle('active', i === currentTab);
              tb.style.opacity = '';
              tb.style.color = '';
            });
            cleanup(currentTab);
            showToast('🔐 로그인이 필요한 기능입니다');
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
            window.scrollTo(0, 0);
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




// ==================== 개인정보 처리방침 ====================


function showPrivacyPolicy() {
    const modal = document.getElementById('modal-privacy');
    if (!modal) {
        console.error('❌ modal-privacy 요소를 찾을 수 없음');
        alert('개인정보 처리방침을 불러올 수 없습니다.');
        return;
    }
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '10001';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.padding = '16px';
}




// ==================== 전역 함수 등록 ====================
window.showTab = showTab;
window.afterTab = afterTab;
window.showToast = showToast;
window.closeModal = closeModal;
window.escapeHtml = escapeHtml;
window.getCurrentUser = getCurrentUser;
window.applyRole = applyRole;
window.showPrivacyPolicy = showPrivacyPolicy;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.renderMembersAccord = renderMembersAccord;
window.renderApprovalsAccord = renderApprovalsAccord;


console.log('✅ js_ui.js 로드 완료 (index.html 완전 호환)');