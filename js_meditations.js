// ==================== 말씀 묵상 & 오늘의 말씀 (충돌 방지 버전) ====================


// ------------------- 1. 전역 변수 (충돌 최소화) -------------------
// 기존 전역 변수들을 즉시 실행 함수로 감싸거나, 고유한 네임스페이스 사용
window.VerseManager = window.VerseManager || {};


// ------------------- 2. 오늘의 말씀 렌더링 -------------------
function renderTodayVerse() {
  let todayVerse = null;
  if (typeof LS !== 'undefined') todayVerse = LS.load('todayVerse', null);


  if (!todayVerse) {
    todayVerse = {
      text: '"하나님은 사랑이시라"',
      ref: '요한일서 4:16',
      body: '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라'
    };
  }


  const el_text = document.getElementById('today-verse-text');
  const el_ref = document.getElementById('today-verse-ref');
  const el_body = document.getElementById('today-verse-body');
  if (el_text) el_text.textContent = todayVerse.text || todayVerse.text;
  if (el_ref) el_ref.textContent = todayVerse.ref;
  if (el_body) el_body.textContent = todayVerse.body || todayVerse.text;
}


// ------------------- 3. 말씀 공유 -------------------
function shareToday() {
  const tv = LS.load('todayVerse', {
    text: '"하나님은 사랑이시라"',
    ref: '요한일서 4:16',
    body: '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라'
  });
  const shareText = `${tv.text} - ${tv.ref}\n${tv.body || tv.text}`;
  if (navigator.share) navigator.share({ title: '오늘의 말씀', text: shareText });
  else navigator.clipboard.writeText(shareText).then(() => showToast('📋 복사되었습니다'));
}


// ------------------- 4. 말씀 등록 모달 (충돌 방지) -------------------
// 네임스페이스 내부에서만 사용할 변수들
const VerseSelector = {
  selectedBookInfo: null,
  selectedChapter: 1,


  showStep(step) {
    const step1 = document.getElementById('vstep1');
    const step2 = document.getElementById('vstep2');
    const step3 = document.getElementById('vstep3');
    const bookDiv = document.getElementById('vstep-book');
    const chapterDiv = document.getElementById('vstep-chapter');
    const verseDiv = document.getElementById('vstep-verse');
    
    if (!step1 || !step2 || !step3) return;
    
    // 스타일 초기화
    [step1, step2, step3].forEach(s => {
      s.style.background = 'var(--bg2)';
      s.style.color = 'var(--text2)';
    });
    
    if (step === 'book') {
      step1.style.background = 'var(--purple)';
      step1.style.color = 'white';
      if (bookDiv) bookDiv.style.display = 'block';
      if (chapterDiv) chapterDiv.style.display = 'none';
      if (verseDiv) verseDiv.style.display = 'none';
    } else if (step === 'chapter') {
      step2.style.background = 'var(--purple)';
      step2.style.color = 'white';
      if (bookDiv) bookDiv.style.display = 'none';
      if (chapterDiv) chapterDiv.style.display = 'block';
      if (verseDiv) verseDiv.style.display = 'none';
    } else if (step === 'verse') {
      step3.style.background = 'var(--purple)';
      step3.style.color = 'white';
      if (bookDiv) bookDiv.style.display = 'none';
      if (chapterDiv) chapterDiv.style.display = 'none';
      if (verseDiv) verseDiv.style.display = 'block';
    }
  },


  loadBooks() {
    const otDiv = document.getElementById('vs-ot-books');
    const ntDiv = document.getElementById('vs-nt-books');
    if (!otDiv || !ntDiv || typeof OT_BOOKS === 'undefined') return;
    
    const btnStyle = 'background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border:1.5px solid #c8b896;border-radius:16px;padding:12px 4px;text-align:center;cursor:pointer;margin:4px;';
    const titleStyle = 'font-size:16px;font-weight:800;color:#6b4f2e;';
    const subStyle = 'font-size:10px;color:#8a6e4e;margin-top:4px;';
    
    otDiv.innerHTML = OT_BOOKS.map(b => `<div style="${btnStyle}" onclick="VerseSelector.selectBook('${b.name}')"><div style="${titleStyle}">${b.abbr}</div><div style="${subStyle}">${b.chapters}장</div></div>`).join('');
    ntDiv.innerHTML = NT_BOOKS.map(b => `<div style="${btnStyle}" onclick="VerseSelector.selectBook('${b.name}')"><div style="${titleStyle}">${b.abbr}</div><div style="${subStyle}">${b.chapters}장</div></div>`).join('');
  },


  selectBook(bookName) {
    if (typeof OT_BOOKS === 'undefined') return;
    this.selectedBookInfo = OT_BOOKS.find(b => b.name === bookName) || NT_BOOKS.find(b => b.name === bookName);
    if (!this.selectedBookInfo) return;
    
    const bookSelectedEl = document.getElementById('vs-book-selected');
    if (bookSelectedEl) bookSelectedEl.innerHTML = `📖 ${this.selectedBookInfo.name}`;
    
    const container = document.getElementById('vs-chapters');
    if (container) {
      let html = '<div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">';
      for (let i = 1; i <= this.selectedBookInfo.chapters; i++) {
        html += `<button onclick="VerseSelector.selectChapter(${i})" style="width:60px;height:60px;background:linear-gradient(145deg,#fdf8f0,#f0e8d8);border:1.5px solid #d4b896;border-radius:16px;font-size:16px;font-weight:700;color:#6b4f2e;cursor:pointer;">${i}</button>`;
      }
      html += '</div>';
      container.innerHTML = html;
    }
    this.showStep('chapter');
  },


  selectChapter(chapter) {
    this.selectedChapter = chapter;
    const chapterSelectedEl = document.getElementById('vs-chapter-selected');
    if (chapterSelectedEl) chapterSelectedEl.innerHTML = `📖 ${this.selectedBookInfo.name} ${chapter}장`;
    
    // 절 선택 로직 (생략 가능, 미리보기는 임시로)
    this.showStep('verse');
    this.updatePreview(); // 임시 호출
  },


  updatePreview() {
    const previewDiv = document.getElementById('vs-preview');
    if (previewDiv) {
      previewDiv.innerHTML = '<div style="background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border-radius:20px;padding:20px;"><div style="font-size:14px;color:#8a6e4e;">📖 말씀 미리보기</div><div style="font-size:15px;color:#4a3a28;">성경 말씀이 여기에 표시됩니다.</div></div>';
    }
  },


  applyTodayVerse() {
    if (!this.selectedBookInfo || !this.selectedChapter) {
      alert('책과 장을 선택해주세요');
      return;
    }
    const from = document.getElementById('vs-from')?.value || 1;
    const to = document.getElementById('vs-to')?.value || 1;
    let ref = `${this.selectedBookInfo.name} ${this.selectedChapter}장 ${from}-${to}절`;
    
    // TODO: 실제 성경 API 연동 시 여기에 구현 (현재는 템플릿)
    const todayVerseData = {
      text: `"말씀"`,
      ref: ref,
      body: `선택하신 말씀 (${ref})이 여기에 표시됩니다.`
    };
    LS.save('todayVerse', todayVerseData);
    renderTodayVerse();
    closeVerseSelector();
    showToast(`✅ 오늘의 말씀이 등록되었습니다: ${ref}`);
  },


  goBack(step) {
    if (step === 'book') this.showStep('book');
    else if (step === 'chapter') this.showStep('chapter');
  }
};


// 모달 열기/닫기 함수 (전역에 노출)
window.openVerseSelector = function() {
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    alert('관리자 또는 매니저만 말씀을 등록할 수 있습니다.');
    return;
  }
  
  const modal = document.getElementById('modal-verse-selector');
  if (!modal) {
    alert('말씀 선택기 모달을 찾을 수 없습니다.');
    return;
  }
  
  VerseSelector.selectedBookInfo = null;
  VerseSelector.selectedChapter = 1;
  VerseSelector.showStep('book');
  VerseSelector.loadBooks();
  modal.style.display = 'flex';
};


window.closeVerseSelector = function() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) modal.style.display = 'none';
};


// 뒤로가기 함수 연결
window.vsGoBack = function(step) {
  VerseSelector.goBack(step);
};
window.selectBookForVerse = function(name) { VerseSelector.selectBook(name); };
window.selectChapterForVerse = function(ch) { VerseSelector.selectChapter(ch); };
window.updateVersePreview = function() { VerseSelector.updatePreview(); };
window.applyTodayVerse = function() { VerseSelector.applyTodayVerse(); };
window.loadBooksForSelector = function() { VerseSelector.loadBooks(); };
window.showVerseStep = function(step) { VerseSelector.showStep(step); };


// ------------------- 5. 묵상 기능 (말씀 나누기) -------------------
let meditations = [];
let meditationPage = 1;
const MEDITATION_PER_PAGE = 10;


function loadMeditations() {
  meditations = LS.load('meditations', []);
  renderMeditations();
}


function renderMeditations() {
  const container = document.getElementById('meditation-list');
  if (!container) return;
  
  if (!meditations.length) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">💬 아직 등록된 묵상이 없습니다.<br>첫 번째로 말씀 나누기를 해보세요!</div>';
    return;
  }
  
  const start = (meditationPage - 1) * MEDITATION_PER_PAGE;
  const pageItems = meditations.slice(start, start + MEDITATION_PER_PAGE);
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
  
  container.innerHTML = pageItems.map(m => `
    <div class="meditation-card">
      <div class="meditation-header">
        <span class="meditation-author">${escapeHtml(m.author)}</span>
        <span class="meditation-time">${m.time || formatDate(m.createdAt)}</span>
      </div>
      <div class="meditation-body">${escapeHtml(m.text || m.content)}</div>
      <div class="meditation-actions">
        <button class="meditation-like-btn${m.liked ? ' liked' : ''}" onclick="toggleLike(${m.id})">${m.liked ? '❤️' : '🤍'} ${m.likes || 0}</button>
        ${(currentUser && (currentUser.name === m.author || isAdmin)) ? `<button class="meditation-edit-btn" onclick="editMeditation(${m.id})">✏️ 수정</button>` : ''}
        ${(currentUser && (currentUser.name === m.author || isAdmin)) ? `<button class="meditation-del-btn" onclick="deleteMeditation(${m.id})">🗑 삭제</button>` : ''}
      </div>
    </div>
  `).join('');
  
  // 페이징 버튼
  const totalPages = Math.ceil(meditations.length / MEDITATION_PER_PAGE);
  if (totalPages > 1) {
    let paginationHtml = '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `<button onclick="goToMeditationPage(${i})" class="${meditationPage === i ? 'active' : ''}">${i}</button>`;
    }
    paginationHtml += '</div>';
    container.innerHTML += paginationHtml;
  }
}


function goToMeditationPage(page) {
  meditationPage = page;
  renderMeditations();
}


function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${date.getMonth()+1}.${date.getDate()}`;
}


function submitMeditation() {
  const input = document.getElementById('meditation-input');
  const content = input?.value.trim();
  if (!content) { showToast('말씀 나누기 내용을 입력해주세요'); return; }
  if (!currentUser) { showToast('로그인이 필요합니다'); document.getElementById('screen-login').style.display = 'flex'; return; }
  
  const newMeditation = {
    id: Date.now(),
    author: currentUser.name,
    text: content,
    content: content,
    time: '방금 전',
    createdAt: new Date().toISOString(),
    likes: 0,
    liked: false
  };
  meditations.unshift(newMeditation);
  LS.save('meditations', meditations);
  input.value = '';
  meditationPage = 1;
  renderMeditations();
  showToast('✅ 말씀 나누기가 등록되었습니다');
}


function toggleLike(id) {
  const m = meditations.find(m => m.id === id);
  if (!m) return;
  m.liked = !m.liked;
  m.likes = (m.likes || 0) + (m.liked ? 1 : -1);
  LS.save('meditations', meditations);
  renderMeditations();
}


function editMeditation(id) {
  const m = meditations.find(m => m.id === id);
  if (!m) return;
  const newText = prompt('수정할 내용', m.text || m.content);
  if (newText && newText.trim()) {
    m.text = newText.trim();
    m.content = newText.trim();
    LS.save('meditations', meditations);
    renderMeditations();
    showToast('✅ 수정됨');
  }
}


function deleteMeditation(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  meditations = meditations.filter(m => m.id !== id);
  LS.save('meditations', meditations);
  renderMeditations();
  showToast('🗑 삭제됨');
}


// 초기화
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadMeditations);
else loadMeditations();


console.log('✅ js_meditations.js 로드 완료 (충돌 방지 버전)');