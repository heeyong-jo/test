// ==================== UI 관련 (탭, 스와이프, 시계, 토스트, 모달) ====================
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
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}


function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}


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


  afterTab(n);
}


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
  console.log('📋 게시물 탭 열림');
  
  // 게시판 초기화
  if (typeof initBoard === 'function') {
    initBoard();
  }
  
  // 카테고리 목록 표시
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
  
  // ✅ 강제로 첫 번째 카테고리 선택 (선택사항)
  setTimeout(function() {
    const firstCat = document.querySelector('#board-category-list .board-cat-btn');
    if (firstCat && !firstCat.hasAttribute('data-bound')) {
      firstCat.click();
    }
  }, 100);
}
  if (n === 3) {
    if (typeof loadBibleStatus === 'function') loadBibleStatus();
    if (typeof loadBibleHallOfFame === 'function') loadBibleHallOfFame();
  }  
  if (n === 4) {
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    
    // ✅ 섬기는 분들 데이터 로드 추가
    if (typeof loadStaff === 'function') {
      loadStaff();
      console.log('섬기는 분들 데이터 로드 요청');
    }
  }
  if (n === 5 && typeof initBible === 'function') {
    initBible();
  }
  if (n === 6) {
    if (currentUser && currentUser.role === 'admin') {
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
    }
  }
}


// ==================== 스와이프 ====================
(function() {
  const container = document.getElementById('swipe-container');
  if (!container) return;
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isSwiping = false;


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
      if (deltaX > 0 && currentTab > 0) showTab(currentTab - 1);
      else if (deltaX < 0 && currentTab < TOTAL_TABS - 1) showTab(currentTab + 1);
    }
    isSwiping = false;
  }, { passive: true });
})();


function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}


function applyRole(role) {
  const isAdmin = role === 'admin';
  const isAdminOrManager = role === 'admin' || role === 'manager';
  document.querySelectorAll('.admin-only').forEach(el => {
    if (isAdmin) { el.setAttribute('style', 'display:block !important'); }
    else { el.setAttribute('style', 'display:none !important'); }
  });
  document.querySelectorAll('.admin-manager-only').forEach(el => {
    if (isAdminOrManager) { el.setAttribute('style', 'display:block !important'); }
    else { el.setAttribute('style', 'display:none !important'); }
  });
// ==================== 말씀 등록 함수 ====================


function openVerseSelector() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) {
    modal.style.display = 'flex';
  }
}


function selectVerse() {
  const book = document.getElementById('verse-book-select').value;
  const chapter = document.getElementById('verse-chapter-input').value;
  const verse = document.getElementById('verse-verse-input').value;
  
  if (!book || !chapter || !verse) {
    showToast('모든 항목을 입력하세요');
    return;
  }
  
  // todayVerse에 저장
  todayVerse = {
    book: book,
    chapter: parseInt(chapter),
    verse: parseInt(verse),
    text: '말씀 내용'
  };
  
  if (typeof LS !== 'undefined') {
    LS.save('todayVerse', todayVerse);
  }
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('todayVerse').set(todayVerse)
      .catch(err => console.error('말씀 저장 실패:', err));
  }
  
  closeModal('modal-verse-selector');
  showToast('✅ 말씀이 등록되었습니다');
  
  if (typeof renderTodayVerse === 'function') {
    renderTodayVerse();
  }
}