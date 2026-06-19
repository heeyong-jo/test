// ==================== UI 및 스와이프 제스처 (js_ui.js) ====================


if (typeof toastTimer === 'undefined') var toastTimer = null;
if (typeof currentTab === 'undefined') var currentTab = 0;
if (typeof TOTAL_TABS === 'undefined') var TOTAL_TABS = 7;


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
  if (!t) {
    // 토스트 엘리먼트가 없으면 생성
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:12px 24px;border-radius:12px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(toast);
  }
  const tEl = document.getElementById('toast');
  tEl.textContent = msg;
  tEl.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { tEl.style.opacity = '0'; }, 2200);
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
    if (typeof renderHomeNotices === 'function') renderHomeNotices();
    if (typeof renderServiceView === 'function') renderServiceView();
  }
  else if (n === 1) {
    console.log('말씀 탭 렌더링 시작');
    if (typeof renderMeditations === 'function') renderMeditations();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
    if (typeof loadPrayers === 'function') loadPrayers();
    if (typeof renderPrayers === 'function') renderPrayers();
  }
  else if (n === 2) {
    console.log('게시물 탭 렌더링 시작');
    if (typeof initBoard === 'function') initBoard();
  }
  else if (n === 3) {
    console.log('성경읽기 탭 렌더링 시작');
    if (typeof loadBibleHallOfFame === 'function') loadBibleHallOfFame();
    if (typeof loadBibleStatus === 'function') loadBibleStatus();
  }
  else if (n === 4) {
    console.log('안내 탭 렌더링 시작');
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof loadStaff === 'function') loadStaff();
    if (typeof loadChurchInfo === 'function') loadChurchInfo();
  }
  else if (n === 5) {
    console.log('성경책 탭 렌더링 시작');
    if (typeof initBible === 'function') initBible();
  }
  else if (n === 6) {
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


// ==================== 권한 적용 ====================
function applyRole(role) {
  console.log('applyRole 실행:', role);
  
  const isAdmin = role === 'admin';
  const isAdminOrManager = role === 'admin' || role === 'manager';
  
  document.querySelectorAll('.admin-only').forEach(el => {
    if (isAdmin) el.style.display = 'block';
    else el.style.display = 'none';
  });
  
  document.querySelectorAll('.admin-manager-only').forEach(el => {
    if (isAdminOrManager) el.style.display = 'block';
    else el.style.display = 'none';
  });
}


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


// ==================== 스와이프 제스처 (간소화) ====================
(function() {
  const el = document.getElementById('swipe-container');
  if (!el) return;
  
  let startX = 0, startY = 0;
  let isSwiping = false;
  let currentTab = 0;
  
  el.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = false;
    currentTab = window.currentTab || 0;
  }, { passive: true });
  
  el.addEventListener('touchmove', function(e) {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    
    if (Math.abs(dy) > Math.abs(dx) * 1.2) {
      isSwiping = false;
      return;
    }
    
    isSwiping = true;
    e.preventDefault();
  }, { passive: false });
  
  el.addEventListener('touchend', function(e) {
    if (!isSwiping) return;
    
    const dx = e.changedTouches[0].clientX - startX;
    
    if (Math.abs(dx) > 50) {
      const direction = dx > 0 ? -1 : 1;
      const targetTab = currentTab + direction;
      
      if (targetTab >= 0 && targetTab < 7) {
        // 관리탭 권한 체크
        if (targetTab === 6) {
          const user = getCurrentUser();
          if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
            showToast('⚠️ 관리자 또는 매니저만 접근 가능합니다');
            return;
          }
        }
        showTab(targetTab);
      }
    }
    isSwiping = false;
  }, { passive: true });
})();


// ==================== 전역 함수 등록 ====================
window.showTab = showTab;
window.afterTab = afterTab;
window.showToast = showToast;
window.closeModal = closeModal;
window.escapeHtml = escapeHtml;
window.getCurrentUser = getCurrentUser;
window.applyRole = applyRole;
window.showPrivacyPolicy = showPrivacyPolicy;


console.log('✅ js_ui.js 로드 완료 (index.html 호환)');