// ==================== UI 및 스와이프 제스처 (js_ui.js) ====================
// 최종 수정본 - 슬라이드 겹침 버그 완전 해결


if (typeof toastTimer === 'undefined') var toastTimer = null;
if (typeof currentBibleSection === 'undefined') var currentBibleSection = null;
if (typeof currentTab === 'undefined') var currentTab = 0;
if (typeof TOTAL_TABS === 'undefined') var TOTAL_TABS = 7;
if (typeof tabContainer === 'undefined') var tabContainer = null;
if (typeof tabScrollStartX === 'undefined') var tabScrollStartX = 0;
if (typeof tabOriginalScroll === 'undefined') var tabOriginalScroll = 0;


// ==================== 현재 사용자 가져오기 (통합) ====================
window.getCurrentUser = window.getCurrentUser || function() {
  if (typeof window.currentUser !== 'undefined' && window.currentUser) return window.currentUser;
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  return null;
};
var getCurrentUser = window.getCurrentUser;


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
  
  if (n === 6 && user) {
    const role = user.role;
    if (role !== 'admin' && role !== 'manager') {
      console.log('권한 없음 - 관리탭 접근 불가:', role);
      if (typeof showToast === 'function') showToast('⚠️ 관리자 또는 매니저만 접근 가능합니다');
      showTab(0);
      return;
    }
  }
  
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
        page.style.cssText = 'display: block !important; position: static; z-index: auto;';
        page.classList.add('show');
      } else {
        page.style.cssText = 'display: none !important; position: static; z-index: auto;';
        page.classList.remove('show');
      }
    }
  }
  
  if (n === 6 && user) {
    const role = user.role;
    if (role === 'admin' || role === 'manager') {
      document.querySelectorAll('.admin-only, .admin-manager-only').forEach(el => {
        if (role === 'admin' && el.classList.contains('admin-only')) {
          el.style.display = 'block';
        } else if (el.classList.contains('admin-manager-only')) {
          el.style.display = 'block';
        }
      });
    }
  }
  
  const savedScroll = sessionStorage.getItem(`scrollPos_${n}`);
  if (savedScroll && !isNaN(parseInt(savedScroll))) {
    setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 50);
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
    console.log('관리탭 렌더링, role:', user ? user.role : 'none');
    
    // p6 페이지 강제 표시
    const p6 = document.getElementById('p6');
    if (p6) {
      p6.style.cssText = 'display: block !important; position: static; z-index: auto;';
      p6.classList.add('show');
    }
    
    if (user && user.role === 'admin') {
      setTimeout(function() {
        if (typeof renderMembersAccord === 'function') {
          renderMembersAccord();
        } else {
          var container = document.getElementById('accord-member-list');
          if (container) container.innerHTML = '<div style="padding:20px;">관리자 모드 로딩 중...</div>';
        }
      }, 50);
    } 
    else if (user && user.role === 'manager') {
      setTimeout(function() {
        if (typeof renderApprovalsAccord === 'function') {
          renderApprovalsAccord();
        }
      }, 50);
    }
    
    var settingInfoSpan = document.getElementById('setting-user-info');
    if (settingInfoSpan && user) {
      var roleText = user.role === 'admin' ? '관리자' : (user.role === 'manager' ? '매니저' : '일반성도');
      settingInfoSpan.textContent = user.name + ' (' + roleText + ')';
    }
  }
}


// ==================== 관리탭 렌더링 함수들 ====================


// 성도 관리 렌더링
window.renderMembersAccord = function() {
  console.log('renderMembersAccord 실행');
  
  var container = document.getElementById('accord-member-list');
  if (!container) {
    console.warn('accord-member-list 요소 없음, 재시도');
    setTimeout(window.renderMembersAccord, 100);
    return;
  }
  
  var user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    container.innerHTML = '<div style="padding:20px;text-align:center;">⚠️ 관리자만 접근 가능합니다.</div>';
    return;
  }
  
  container.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner"></div><div>로딩 중...</div></div>';
  
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    firebase.database().ref('members').once('value')
      .then(function(snap) {
        var data = snap.val();
        var members = data ? Object.values(data) : [];
        
        if (members.length === 0) {
          container.innerHTML = '<div style="padding:20px;text-align:center;">📋 등록된 성도가 없습니다.</div>';
          return;
        }
        
        var html = '';
        for (var i = 0; i < members.length; i++) {
          var m = members[i];
          html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--border);">' +
            '<div>' +
              '<div style="font-weight:700;">' + escapeHtml(m.name || '이름 없음') + '</div>' +
              '<div style="font-size:12px;color:var(--text2);">' + escapeHtml(m.dept || '직책 없음') + '</div>' +
            '</div>' +
            '<div style="font-size:12px;">' + escapeHtml(m.phone || '-') + '</div>' +
          '</div>';
        }
        container.innerHTML = html;
        
        var totalSpan = document.getElementById('am-total');
        if (totalSpan) totalSpan.textContent = members.length;
      })
      .catch(function(err) {
        console.error('멤버 로드 실패:', err);
        container.innerHTML = '<div style="padding:20px;color:red;">⚠️ 데이터를 불러올 수 없습니다.</div>';
      });
  } else {
    container.innerHTML = '<div style="padding:20px;color:red;">⚠️ Firebase 연결이 필요합니다.</div>';
  }
};


// 가입 승인 관리 렌더링
window.renderApprovalsAccord = function() {
  console.log('renderApprovalsAccord 실행');
  
  var container = document.getElementById('accord-approval-list');
  if (!container) {
    console.warn('accord-approval-list 요소 없음, 재시도');
    setTimeout(window.renderApprovalsAccord, 100);
    return;
  }
  
  var user = getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    container.innerHTML = '<div style="padding:20px;text-align:center;">⚠️ 관리자/매니저만 접근 가능합니다.</div>';
    return;
  }
  
  container.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner"></div><div>로딩 중...</div></div>';
  
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    firebase.database().ref('pendingUsers').once('value')
      .then(function(snap) {
        var data = snap.val();
        var pending = data ? Object.values(data) : [];
        
        var subEl = document.getElementById('ac-approval-sub');
        if (subEl) subEl.textContent = '대기 ' + pending.length + '명';
        
        if (pending.length === 0) {
          container.innerHTML = '<div style="padding:20px;text-align:center;">✅ 승인 대기자가 없습니다.</div>';
          return;
        }
        
        var html = '';
        for (var i = 0; i < pending.length; i++) {
          var p = pending[i];
          html += '<div style="padding:14px;background:rgba(255,215,0,0.1);border-radius:12px;margin-bottom:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<div>' +
                '<div style="font-weight:700;">' + escapeHtml(p.name || '이름 없음') + '</div>' +
                '<div style="font-size:12px;color:var(--text2);">아이디: ' + escapeHtml(p.id || '-') + '</div>' +
                '<div style="font-size:11px;color:var(--text2);">' + escapeHtml(p.email || '-') + ' / ' + escapeHtml(p.phone || '-') + '</div>' +
              '</div>' +
              '<div style="display:flex;gap:8px;">' +
                '<button onclick="approveUser(\'' + p.id + '\')" style="background:#10b981;border:none;border-radius:20px;padding:5px 12px;color:white;cursor:pointer;">승인</button>' +
                '<button onclick="rejectUser(\'' + p.id + '\')" style="background:#ef4444;border:none;border-radius:20px;padding:5px 12px;color:white;cursor:pointer;">거절</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }
        container.innerHTML = html;
      })
      .catch(function(err) {
        console.error('승인 대기자 로드 실패:', err);
        container.innerHTML = '<div style="padding:20px;color:red;">⚠️ 데이터를 불러올 수 없습니다.</div>';
      });
  } else {
    container.innerHTML = '<div style="padding:20px;color:red;">⚠️ Firebase 연결이 필요합니다.</div>';
  }
};


// 승인 함수
window.approveUser = function(userId) {
  if (!confirm('이 사용자를 승인하시겠습니까?')) return;
  
  var user = getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    showToast('권한이 없습니다.');
    return;
  }
  
  firebase.database().ref('pendingUsers/' + userId).once('value')
    .then(function(snap) {
      var userData = snap.val();
      if (!userData) {
        showToast('사용자 정보를 찾을 수 없습니다.');
        return;
      }
      
      userData.approvedAt = Date.now();
      delete userData.status;
      
      firebase.database().ref('approvedUsers/' + userId).set(userData)
        .then(function() {
          firebase.database().ref('pendingUsers/' + userId).remove()
            .then(function() {
              showToast('✅ 승인 완료되었습니다.');
              if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
            });
        });
    })
    .catch(function(err) {
      console.error('승인 처리 실패:', err);
      showToast('처리 중 오류가 발생했습니다.');
    });
};


// 거절 함수
window.rejectUser = function(userId) {
  if (!confirm('이 사용자를 거절하시겠습니까?')) return;
  
  var user = getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    showToast('권한이 없습니다.');
    return;
  }
  
  firebase.database().ref('pendingUsers/' + userId).remove()
    .then(function() {
      showToast('🗑 거절 처리되었습니다.');
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
    })
    .catch(function(err) {
      console.error('거절 처리 실패:', err);
      showToast('처리 중 오류가 발생했습니다.');
    });
};


// ==================== 탭 스타일 복원 ====================
function restoreTabStyles() {
  if (!tabContainer) return;
  
  var tabs = document.querySelectorAll('.tab');
  var currentTabEl = tabs[currentTab];
  if (currentTabEl) {
    var targetLeft = currentTabEl.offsetLeft - (tabContainer.clientWidth / 2) + (currentTabEl.clientWidth / 2);
    tabContainer.scrollLeft = Math.max(0, targetLeft);
  }
  
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].style.opacity = '';
    tabs[i].style.color = '';
  }
}


// ==================== 스와이프 제스처 ====================
(function() {
  var el = document.getElementById('swipe-container');
  if (!el) return;
  
  var startX = 0, startY = 0;
  var dragging = false;
  var locked = false;
  var dragDir = 0;
  var curEl = null;
  var nxtEl = null;
  var touchStartTime = 0;
  
  var SWIPE_THRESHOLD = 30;
  var MAX_VERTICAL_RATIO = 1.5;
  var MIN_HORIZONTAL_MOVE = 15;
  
  var W = function() { return window.innerWidth; };
  
  function getPage(n) { 
    return document.getElementById('p' + n); 
  }
  
  function getNext(dir) {
    var idx = currentTab + dir;
    while (idx >= 0 && idx < TOTAL_TABS) {
      var t = document.getElementById('tab' + idx);
      if (t && t.style.display !== 'none') return idx;
      idx += dir;
    }
    return -1;
  }
  
  // ✅ 수정: position: fixed → absolute (겹침 방지)
  function prepareNext(dir) {
    var ni = getNext(dir);
    if (ni < 0) return null;
    var nxt = getPage(ni);
    if (!nxt) return null;
    
    nxt.style.cssText = 'display: block !important;' +
      'position: absolute;' +
      'top: 0;' +
      'left: 0;' +
      'right: 0;' +
      'width: 100%;' +
      'z-index: 10;' +
      'transform: translateX(' + (dir > 0 ? W() : -W()) + 'px);' +
      'overflow-y: auto;' +
      'will-change: transform;' +
      'opacity: 1;' +
      'background: var(--bg);';
    return nxt;
  }
  
  function saveCurrentScrollPosition() {
    var currentScroll = window.scrollY || document.documentElement.scrollTop;
    sessionStorage.setItem('scrollPos_' + currentTab, currentScroll);
  }
  
  // ✅ 수정: 명시적 CSS 설정 (겹침 완전 제거)
  function cleanup(finalIdx) {
    var f = getPage(finalIdx);
    if (!f) return;
    
    f.style.cssText = 'display: block !important; position: static; z-index: auto;';
    f.classList.add('show');
    
    for (var i = 0; i < TOTAL_TABS; i++) {
      if (i === finalIdx) continue;
      var p = getPage(i);
      if (p) {
        p.style.cssText = 'display: none !important; position: static; z-index: auto;';
        p.classList.remove('show');
      }
    }
    
    curEl = null;
    nxtEl = null;
    dragDir = 0;
    
    var savedScrollPos = sessionStorage.getItem('scrollPos_' + finalIdx);
    if (savedScrollPos && !isNaN(parseInt(savedScrollPos))) {
      setTimeout(function() { window.scrollTo(0, parseInt(savedScrollPos)); }, 50);
    }
    
    var user = getCurrentUser();
    if (finalIdx === 6 && user) {
      var role = user.role;
      if (role !== 'admin' && role !== 'manager') {
        setTimeout(function() {
          showTab(0);
          if (typeof showToast === 'function') showToast('⚠️ 관리자 또는 매니저만 접근 가능합니다');
        }, 50);
        return;
      }
    }
    
    // ✅ 지연 제거 (즉시 afterTab 호출)
    afterTab(finalIdx);
  }
  
  el.addEventListener('touchstart', function(e) {
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
  
  el.addEventListener('touchmove', function(e) {
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    
    if (!dragging && !locked) {
      if (Math.abs(dx) < MIN_HORIZONTAL_MOVE && Math.abs(dy) < MIN_HORIZONTAL_MOVE) return;
      
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) {
        locked = true;
        curEl = null;
        return;
      }
      
      var user = getCurrentUser();
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
        var currentScroll = window.scrollY || document.documentElement.scrollTop;
        curEl.style.cssText = 'display: block !important;' +
          'position: absolute;' +
          'top: 0;' +
          'left: 0;' +
          'right: 0;' +
          'width: 100%;' +
          'z-index: 9;' +
          'transform: translateX(0);' +
          'overflow-y: auto;' +
          'will-change: transform;' +
          'background: var(--bg);';
        curEl.scrollTop = currentScroll;
      }
      nxtEl = prepareNext(dragDir);
    }
    
    if (locked || !dragging) return;
    
    e.preventDefault();
    
    var tx = dx;
    if ((dx > 0 && currentTab === 0) || (dx < 0 && getNext(1) < 0)) {
      tx = dx * 0.3;
    }
    
    if (curEl) curEl.style.transform = 'translateX(' + tx + 'px)';
    if (nxtEl) nxtEl.style.transform = 'translateX(' + (tx + (dragDir > 0 ? W() : -W())) + 'px)';
    
    if (tabContainer && dragging) {
      var ratio = Math.min(1, Math.abs(tx) / W());
      var tabWidth = tabContainer.scrollWidth - tabContainer.clientWidth;
      if (tabWidth > 0) {
        var tabMove = (dragDir > 0 ? -1 : 1) * ratio * 60;
        var newScroll = tabOriginalScroll + tabMove;
        newScroll = Math.max(0, Math.min(tabWidth, newScroll));
        tabContainer.scrollLeft = newScroll;
        
        var tabs = document.querySelectorAll('.tab');
        var targetTabIndex = currentTab + (dragDir > 0 ? -1 : 1);
        if (targetTabIndex >= 0 && targetTabIndex < TOTAL_TABS) {
          var activeOpacity = Math.max(0.4, 1 - ratio * 0.7);
          var nextOpacity = Math.min(1, 0.3 + ratio * 0.7);
          tabs[currentTab].style.opacity = activeOpacity;
          if (tabs[targetTabIndex]) {
            tabs[targetTabIndex].style.opacity = nextOpacity;
            tabs[targetTabIndex].style.color = '#d4a840';
          }
        }
      }
    }
  }, { passive: false });
  
  el.addEventListener('touchend', function(e) {
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
    
    var dx = e.changedTouches[0].clientX - startX;
    var duration = Date.now() - touchStartTime;
    var velocity = Math.abs(dx) / duration;
    var ratio = Math.abs(dx) / W();
    var ni = getNext(dragDir);
    var will = (velocity > 0.5 && Math.abs(dx) > 50) || (ratio >= 0.2 && nxtEl !== null && ni >= 0 && ni < TOTAL_TABS);
    
    dragging = false;
    
    if (will) {
      var tX = dragDir > 0 ? -W() : W();
      var sp = dx;
      var dur = 250;
      var start = performance.now();
      var ease = function(t) { return 1 - Math.pow(1 - t, 3); };
      
      (function frame(now) {
        var t = Math.min((now - start) / dur, 1);
        var pos = sp + (tX - sp) * ease(t);
        if (curEl) curEl.style.transform = 'translateX(' + pos + 'px)';
        if (nxtEl) nxtEl.style.transform = 'translateX(' + (pos + (dragDir > 0 ? W() : -W())) + 'px)';
        
        if (tabContainer && t < 1) {
          var tabWidth = tabContainer.scrollWidth - tabContainer.clientWidth;
          if (tabWidth > 0) {
            var targetTabIndex = currentTab + (dragDir > 0 ? -1 : 1);
            if (targetTabIndex >= 0 && targetTabIndex < TOTAL_TABS) {
              var targetTab = document.querySelectorAll('.tab')[targetTabIndex];
              if (targetTab) {
                var targetLeft = targetTab.offsetLeft;
                var currentLeft = tabContainer.scrollLeft;
                var newLeft = currentLeft + (targetLeft - currentLeft) * ease(t);
                tabContainer.scrollLeft = newLeft;
              }
            }
          }
        }
        
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          var user = getCurrentUser();
          
          if (ni === 6 && user) {
            var role = user.role;
            if (role !== 'admin' && role !== 'manager') {
              cleanup(currentTab);
              if (typeof showToast === 'function') showToast('⚠️ 관리자 또는 매니저만 접근 가능합니다');
              restoreTabStyles();
              return;
            }
          }
          
          if (ni !== 0 && !user) {
            cleanup(currentTab);
            document.getElementById('screen-login').style.display = 'flex';
          } else {
            currentTab = ni;
            var tabs = document.querySelectorAll('.tab');
            for (var i = 0; i < tabs.length; i++) {
              if (i === currentTab) {
                tabs[i].classList.add('active');
              } else {
                tabs[i].classList.remove('active');
              }
              tabs[i].style.opacity = '';
              tabs[i].style.color = '';
            }
            cleanup(currentTab);
          }
          restoreTabStyles();
        }
      })(start);
    } else {
      var sp = dx;
      var dur = 300;
      var start = performance.now();
      var ease = function(t) { return 1 - Math.pow(1 - t, 3); };
      
      (function frame(now) {
        var t = Math.min((now - start) / dur, 1);
        var pos = sp * (1 - ease(t));
        if (curEl) curEl.style.transform = 'translateX(' + pos + 'px)';
        
        if (tabContainer && t < 1) {
          var newScroll = tabOriginalScroll + (tabOriginalScroll - tabContainer.scrollLeft) * (1 - ease(t));
          tabContainer.scrollLeft = newScroll;
        }
        
        if (nxtEl) {
          if (t < 0.95) {
            nxtEl.style.transform = 'translateX(' + (pos + (dragDir > 0 ? W() : -W())) + 'px)';
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
            var savedPos = sessionStorage.getItem('scrollPos_' + currentTab);
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


console.log('✅ js_ui.js 로드 완료 (최종 수정본)');