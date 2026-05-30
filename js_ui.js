// ==================== UI 제어 ====================
// js_ui.js 맨 위에 추가 - 로그인 상태 복원
if (typeof window.currentUser === 'undefined') window.currentUser = null;
if (typeof currentUser === 'undefined') var currentUser = null;


// localStorage에서 로그인 상태 복원 시도
(function() {
  try {
    var saved = localStorage.getItem('ch2_currentUser');
    if (saved) {
      var user = JSON.parse(saved);
      window.currentUser = user;
      currentUser = user;
      console.log('js_ui.js에서 currentUser 복원:', user.name);
    }
  } catch(e) {}
})();


if (typeof toastTimer === 'undefined') var toastTimer = null;
if (typeof currentBibleSection === 'undefined') var currentBibleSection = null;
if (typeof currentTab === 'undefined') var currentTab = 0;
if (typeof TOTAL_TABS === 'undefined') var TOTAL_TABS = 7;


function tick() {
  var now = new Date();
  var el = document.getElementById('htime');
  if (el) el.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}
setInterval(tick, 1000);
tick();


function showToast(msg) {
  var t = document.getElementById('toast');
  if (!t) {
    console.warn('Toast 요소를 찾을 수 없음:', msg);
    alert(msg);
    return;
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    if (t) t.classList.remove('show');
  }, 2200);
}


function closeModal(id) {
  var modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
  } else {
    console.warn('Modal "' + id + '"를 찾을 수 없음');
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


// ========== 탭 표시 함수 ==========
function showTab(n) {
  console.log('showTab 호출:', n, 'currentUser:', currentUser, 'window.currentUser:', window.currentUser);
  
  // ⭐ 중요: currentUser가 여러 곳에 있을 수 있으므로 통일
  var loggedInUser = window.currentUser || currentUser;
  
  // localStorage에서도 확인
  if (!loggedInUser) {
    try {
      var saved = localStorage.getItem('ch2_currentUser');
      if (saved) {
        loggedInUser = JSON.parse(saved);
        window.currentUser = loggedInUser;
        currentUser = loggedInUser;
        console.log('localStorage에서 currentUser 복원:', loggedInUser);
      }
    } catch(e) {}
  }
  
  n = Math.max(0, Math.min(TOTAL_TABS - 1, n));
  
  // 로그인 필요한 탭 체크
  var needLoginTabs = [2, 3, 5, 6];  // 게시물, 성경읽기, 성경책, 관리
  var publicTabs = [0, 1, 4];        // 홈, 말씀, 안내
  
  console.log('로그인 상태 체크 - loggedInUser:', loggedInUser ? '있음(' + loggedInUser.name + ')' : '없음');
  console.log('탭 인덱스:', n, 'needLoginTabs 포함?', needLoginTabs.includes(n));
  
  // 로그인하지 않은 상태에서 제한된 탭 접근 시도
  if (!loggedInUser && needLoginTabs.includes(n)) {
    console.log('로그인 필요한 탭 접근 시도:', n, '→ 로그인창 표시');
    var loginScreen = document.getElementById('screen-login');
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
  var tabs = document.querySelectorAll('.tab');
  for (var i = 0; i < tabs.length; i++) {
    if (i === n) {
      tabs[i].classList.add('active');
    } else {
      tabs[i].classList.remove('active');
    }
  }
  
  // 모든 페이지 숨기고, 선택된 페이지만 표시
  for (var i = 0; i < TOTAL_TABS; i++) {
    var page = document.getElementById('p' + i);
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
    var bibleViews = ['bibleScriptureView', 'bibleHymnView', 'bibleAppendixView'];
    for (var i = 0; i < bibleViews.length; i++) {
      var el = document.getElementById(bibleViews[i]);
      if (el) el.style.display = 'none';
    }
    var main = document.getElementById('bibleMain');
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
    var list = document.getElementById('board-category-list');
    var content = document.getElementById('board-content');
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
    if (window.currentUser && window.currentUser.role === 'admin') {
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
    }
  }
}


// ==================== 스와이프 (슬라이딩) ====================
(function() {
  var container = document.getElementById('swipe-container');
  if (!container) {
    console.warn('swipe-container 요소 없음');
    return;
  }
  
  var touchStartX = 0, touchStartY = 0, touchStartTime = 0, isSwiping = false;
  
  container.addEventListener('touchstart', function(e) {
    if (currentTab === 5) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isSwiping = false;
  }, { passive: true });
  
  container.addEventListener('touchmove', function(e) {
    if (currentTab === 5) return;
    var deltaX = Math.abs(e.touches[0].clientX - touchStartX);
    var deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    if (deltaX > 10 && deltaX > deltaY && !isSwiping) {
      isSwiping = true;
      var target = e.target;
      var isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      var isScrollable = target.scrollWidth > target.clientWidth;
      if (!isInput && !isScrollable) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  container.addEventListener('touchend', function(e) {
    if (currentTab === 5) return;
    if (!isSwiping) return;
    var endX = e.changedTouches[0].clientX;
    var deltaX = endX - touchStartX;
    var deltaTime = Date.now() - touchStartTime;
    if (Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0 && currentTab > 0) {
        showTab(currentTab - 1);
      } else if (deltaX < 0 && currentTab < TOTAL_TABS - 1) {
        showTab(currentTab + 1);
      }
    }
    isSwiping = false;
  }, { passive: true });
})();


// ==================== 설정 화면 함수 ====================
function openSettingView() {
  var settingInfo = document.getElementById('setting-user-info');
  if (window.currentUser && settingInfo) {
    var roleText = window.currentUser.role === 'admin' ? '관리자' : '일반성도';
    settingInfo.textContent = window.currentUser.name + ' (' + roleText + ')';
  }
}


function applyRole(role) {
  var isAdmin = role === 'admin';
  var isAdminOrManager = role === 'admin' || role === 'manager';
  var adminOnlyEls = document.querySelectorAll('.admin-only');
  for (var i = 0; i < adminOnlyEls.length; i++) {
    if (isAdmin) adminOnlyEls[i].setAttribute('style', 'display:block !important');
    else adminOnlyEls[i].setAttribute('style', 'display:none !important');
  }
  var adminManagerOnlyEls = document.querySelectorAll('.admin-manager-only');
  for (var i = 0; i < adminManagerOnlyEls.length; i++) {
    if (isAdminOrManager) adminManagerOnlyEls[i].setAttribute('style', 'display:block !important');
    else adminManagerOnlyEls[i].setAttribute('style', 'display:none !important');
  }
}


function toggleProfileDropdown() {
  var dropdown = document.getElementById('profile-dropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('show');
  setTimeout(function() {
    var closeDropdown = function(e) {
      if (!dropdown.contains(e.target) && !e.target.closest('.user-badge')) {
        dropdown.classList.remove('show');
        document.removeEventListener('click', closeDropdown);
      }
    };
    document.addEventListener('click', closeDropdown);
  }, 0);
}


console.log('✅ js_ui.js 로드 완료');