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
    // ✅ 게시물 탭 - 카테고리 목록 표시
    if (typeof initBoard === 'function') initBoard();
    // 게시판 목록 화면 표시 (처음에는 카테고리 목록만)
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
      content.style.pointerEvents = 'none';
    }
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


// ==================== 말씀 나누기 (명상) 등록 함수 ====================


function submitMeditation() {
  const input = document.getElementById('meditation-input');
  const text = input.value.trim();
  
  if (!text) {
    showToast('내용을 입력하세요');
    return;
  }
  
  if (!currentUser) {
    showToast('로그인이 필요합니다');
    return;
  }
  
  const meditation = {
    id: Date.now(),
    author: currentUser.name,
    authorId: currentUser.id,
    text: text,
    date: new Date().toLocaleDateString('ko-KR'),
    time: new Date().toLocaleTimeString('ko-KR'),
    likes: 0
  };
  
  if (!Array.isArray(meditations)) meditations = [];
  meditations.unshift(meditation);
  
  if (typeof LS !== 'undefined') {
    LS.save('meditations', meditations);
  }
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('meditations').set(meditations)
      .catch(err => console.error('명상 저장 실패:', err));
  }
  
  input.value = '';
  showToast('✅ 말씀 나누기가 등록되었습니다');
  
  if (typeof renderMeditations === 'function') {
    renderMeditations();
  }
}


function renderMeditations() {
  const container = document.getElementById('meditation-list');
  if (!container) return;
  
  if (!Array.isArray(meditations) || meditations.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">아직 나눈 말씀이 없습니다</div>';
    return;
  }
  
  let html = '';
  meditations.forEach(item => {
    html += `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:14px;">${item.author}</strong>
          <span style="font-size:12px;color:var(--text2);">${item.date}</span>
        </div>
        <div style="color:var(--text);font-size:14px;line-height:1.6;margin-bottom:12px;">${escapeHtml(item.text)}</div>
        <button class="btn-secondary" style="font-size:12px;padding:6px 12px;" onclick="likeMeditation(${item.id})">❤️ ${item.likes || 0}</button>
      </div>
    `;
  });
  
  container.innerHTML = html;
}


function likeMeditation(id) {
  const meditation = meditations.find(m => m.id === id);
  if (meditation) {
    meditation.likes = (meditation.likes || 0) + 1;
    
    if (typeof LS !== 'undefined') {
      LS.save('meditations', meditations);
    }
    
    if (window.FB_READY && typeof firebase !== 'undefined') {
      firebase.database().ref('meditations').set(meditations);
    }
    
    renderMeditations();
  }
}


// ==================== 기도제목 함수 ====================


function openAddPrayer() {
  openModal('modal-prayer');
}


function submitPrayer() {
  const title = document.getElementById('prayer-title').value.trim();
  const content = document.getElementById('prayer-content').value.trim();
  
  if (!title || !content) {
    showToast('제목과 내용을 입력하세요');
    return;
  }
  
  if (!currentUser) {
    showToast('로그인이 필요합니다');
    return;
  }
  
  const prayer = {
    id: Date.now(),
    title: title,
    content: content,
    author: currentUser.name,
    authorId: currentUser.id,
    date: new Date().toLocaleDateString('ko-KR'),
    answered: false,
    answers: 0
  };
  
  if (!Array.isArray(prayers)) prayers = [];
  prayers.unshift(prayer);
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', prayers);
  }
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('prayers').set(prayers)
      .catch(err => console.error('기도제목 저장 실패:', err));
  }
  
  document.getElementById('prayer-title').value = '';
  document.getElementById('prayer-content').value = '';
  closeModal('modal-prayer');
  showToast('✅ 기도제목이 등록되었습니다');
  
  if (typeof renderPrayerList === 'function') {
    renderPrayerList();
  }
}


function renderPrayerList() {
  const container = document.getElementById('prayer-list');
  if (!container) return;
  
  if (!Array.isArray(prayers) || prayers.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">아직 등록된 기도제목이 없습니다</div>';
    return;
  }
  
  let html = '';
  prayers.forEach(item => {
    html += `
      <div class="card" style="margin-bottom:12px;border-left:4px solid var(--purple);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <strong style="font-size:14px;color:var(--purple);">${item.title}</strong>
          <span style="font-size:11px;color:var(--text2);">${item.date}</span>
        </div>
        <div style="color:var(--text);font-size:13px;line-height:1.6;margin-bottom:10px;">${escapeHtml(item.content)}</div>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2);">
          <span>✍️ ${item.author}</span>
          <button class="btn-secondary" style="padding:4px 12px;font-size:11px;" onclick="markPrayerAnswered(${item.id})">응답함 ${item.answers || 0}</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}


function markPrayerAnswered(id) {
  const prayer = prayers.find(p => p.id === id);
  if (prayer) {
    prayer.answered = !prayer.answered;
    prayer.answers = (prayer.answers || 0) + 1;
    
    if (typeof LS !== 'undefined') {
      LS.save('prayers', prayers);
    }
    
    if (window.FB_READY && typeof firebase !== 'undefined') {
      firebase.database().ref('prayers').set(prayers);
    }
    
    renderPrayerList();
    showToast('✅ 기도가 응답되었습니다');
  }
}


// 모달이 없으면 동적으로 생성
function ensureModals() {
  if (!document.getElementById('modal-verse-selector')) {
    const modal = document.createElement('div');
    modal.id = 'modal-verse-selector';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <div class="modal-title">📖 말씀등록하기</div>
          <button class="modal-close" onclick="closeModal('modal-verse-selector')">✕</button>
        </div>
        <div class="input-label">책</div>
        <select class="input-field" id="verse-book-select">
          <option>마태복음</option>
          <option>마가복음</option>
          <option>누가복음</option>
          <option>요한복음</option>
        </select>
        <div class="input-label">장</div>
        <input type="number" class="input-field" id="verse-chapter-input" min="1" placeholder="장 번호">
        <div class="input-label">절</div>
        <input type="number" class="input-field" id="verse-verse-input" min="1" placeholder="절 번호">
        <button class="btn-primary" onclick="selectVerse()" style="margin-top:20px;width:100%;">등록하기</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
}


// 페이지 로드 시 모달 확인
document.addEventListener('DOMContentLoaded', function() {
  ensureModals();
});