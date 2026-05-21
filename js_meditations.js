// ==================== 말씀 묵상 & 오늘의 말씀 (최종 수정 완료) ====================


// ------------------- 1. 오늘의 말씀 렌더링 -------------------
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
  if (el_text) el_text.textContent = todayVerse.text;
  if (el_ref) el_ref.textContent = todayVerse.ref;
  if (el_body) el_body.textContent = todayVerse.body || todayVerse.text.replace(/^"|"$/g, '');
}


// ------------------- 2. 말씀 공유 -------------------
function shareToday() {
  const tv = (typeof LS !== 'undefined') ? LS.load('todayVerse', null) : null;
  const defaultVerse = {
    text: '"하나님은 사랑이시라"',
    ref: '요한일서 4:16',
    body: '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라'
  };
  const todayVerse = tv || defaultVerse;
  const shareText = `${todayVerse.text} - ${todayVerse.ref}\n${todayVerse.body || todayVerse.text.replace(/^"|"$/g, '')}`;
  
  if (navigator.share) {
    navigator.share({ title: '오늘의 말씀', text: shareText });
  } else {
    navigator.clipboard.writeText(shareText).then(() => {
      if (typeof showToast === 'function') showToast('📋 복사되었습니다');
      else alert('📋 복사되었습니다');
    });
  }
}


// ------------------- 3. 말씀 등록 모달 (탭 방식) -------------------
const VerseTab = {
  selectedBook: null,
  selectedChapter: 1,
  selectedText: '',
  maxVerses: 150,


  ensureBibleData: function() {
    if (typeof OT_BOOKS === 'undefined' || typeof NT_BOOKS === 'undefined' ||
        OT_BOOKS.length === 0 || NT_BOOKS.length === 0) {
      if (typeof showToast === 'function') showToast('성경 데이터를 불러올 수 없습니다');
      return false;
    }
    return true;
  },


  showStep: function(step) {
    const step1 = document.getElementById('vstep1');
    const step2 = document.getElementById('vstep2');
    const step3 = document.getElementById('vstep3');
    const bookDiv = document.getElementById('vstep-book');
    const chapterDiv = document.getElementById('vstep-chapter');
    const verseDiv = document.getElementById('vstep-verse');
    
    if (!step1 || !step2 || !step3) return;
    
    step1.style.background = step === 'book' ? 'var(--purple)' : 'var(--bg2)';
    step1.style.color = step === 'book' ? 'white' : 'var(--text2)';
    step2.style.background = step === 'chapter' ? 'var(--purple)' : 'var(--bg2)';
    step2.style.color = step === 'chapter' ? 'white' : 'var(--text2)';
    step3.style.background = step === 'verse' ? 'var(--purple)' : 'var(--bg2)';
    step3.style.color = step === 'verse' ? 'white' : 'var(--text2)';
    
    if (bookDiv) bookDiv.style.display = step === 'book' ? 'block' : 'none';
    if (chapterDiv) chapterDiv.style.display = step === 'chapter' ? 'block' : 'none';
    if (verseDiv) verseDiv.style.display = step === 'verse' ? 'block' : 'none';
  },


  // ✅ 수정: JSON.stringify로 안전하게 escape
  loadBooks: function() {
    const otDiv = document.getElementById('vs-ot-books');
    const ntDiv = document.getElementById('vs-nt-books');
    if (!otDiv || !ntDiv) return;
    
    if (!this.ensureBibleData()) return;
    
    const btnStyle = 'background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border:1.5px solid #c8b896;border-radius:16px;padding:12px 4px;text-align:center;cursor:pointer;margin:4px;transition:all 0.2s;';
    const titleStyle = 'font-size:16px;font-weight:800;color:#6b4f2e;';
    const subStyle = 'font-size:10px;color:#8a6e4e;margin-top:4px;';
    
    let otHtml = '';
    for (let i = 0; i < OT_BOOKS.length; i++) {
      const b = OT_BOOKS[i];
      const safeName = JSON.stringify(b.name).slice(1, -1);
      otHtml += `<div style="${btnStyle}" onclick="VerseTab.pickBook('${safeName}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="${titleStyle}">${b.abbr}</div>
        <div style="${subStyle}">${b.chapters}장</div>
      </div>`;
    }
    otDiv.innerHTML = otHtml;
    
    let ntHtml = '';
    for (let i = 0; i < NT_BOOKS.length; i++) {
      const b = NT_BOOKS[i];
      const safeName = JSON.stringify(b.name).slice(1, -1);
      ntHtml += `<div style="${btnStyle}" onclick="VerseTab.pickBook('${safeName}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="${titleStyle}">${b.abbr}</div>
        <div style="${subStyle}">${b.chapters}장</div>
      </div>`;
    }
    ntDiv.innerHTML = ntHtml;
  },


  pickBook: function(bookName) {
    if (!this.ensureBibleData()) return;
    this.selectedBook = OT_BOOKS.find(b => b.name === bookName) || NT_BOOKS.find(b => b.name === bookName);
    if (!this.selectedBook) return;
    
    const bookSelectedEl = document.getElementById('vs-book-selected');
    if (bookSelectedEl) bookSelectedEl.innerHTML = `📖 ${this.selectedBook.name}`;
    
    const container = document.getElementById('vs-chapters');
    if (container) {
      let html = '<div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">';
      for (let i = 1; i <= this.selectedBook.chapters; i++) {
        html += `<button onclick="VerseTab.pickChapter(${i})" style="width:60px;height:60px;background:linear-gradient(145deg,#fdf8f0,#f0e8d8);border:1.5px solid #d4b896;border-radius:16px;font-size:16px;font-weight:700;color:#6b4f2e;cursor:pointer;">${i}</button>`;
      }
      html += '</div>';
      container.innerHTML = html;
    }
    this.showStep('chapter');
  },


  // ✅ 수정: fetch 완료 후 미리보기 호출
  pickChapter: function(chapter) {
    this.selectedChapter = chapter;
    const chapterSelectedEl = document.getElementById('vs-chapter-selected');
    if (chapterSelectedEl) chapterSelectedEl.innerHTML = `📖 ${this.selectedBook.name} ${chapter}장`;
    
    const fromSelect = document.getElementById('vs-from');
    const toSelect = document.getElementById('vs-to');
    if (fromSelect && toSelect) {
      fromSelect.innerHTML = '<option>로딩 중...</option>';
      toSelect.innerHTML = '<option>로딩 중...</option>';
      
      const url = `https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/${this.selectedBook.file}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          let bookData = data[this.selectedBook.name] || data[this.selectedBook.abbr];
          if (bookData && bookData[chapter]) {
            this.maxVerses = Object.keys(bookData[chapter]).length;
          } else {
            this.maxVerses = 150;
          }
          
          let options = '';
          for (let i = 1; i <= this.maxVerses; i++) {
            options += `<option value="${i}">${i}절</option>`;
          }
          fromSelect.innerHTML = options;
          toSelect.innerHTML = options;
          toSelect.value = Math.min(5, this.maxVerses);
          
          this.showStep('verse');
          this.loadVersePreview();
        })
        .catch(() => {
          let options = '';
          for (let i = 1; i <= 150; i++) {
            options += `<option value="${i}">${i}절</option>`;
          }
          fromSelect.innerHTML = options;
          toSelect.innerHTML = options;
          toSelect.value = 5;
          
          this.showStep('verse');
          this.loadVersePreview();
        });
    } else {
      this.showStep('verse');
      this.loadVersePreview();
    }
  },


  // ✅ 수정: 로딩 중 상태 체크 및 NaN 방지
  loadVersePreview: function() {
    const previewDiv = document.getElementById('vs-preview');
    if (!previewDiv || !this.selectedBook) return;
    
    const fromInput = document.getElementById('vs-from');
    const toInput = document.getElementById('vs-to');
    
    if (!fromInput || !toInput || fromInput.innerHTML === '<option>로딩 중...</option>') {
      previewDiv.innerHTML = '<div style="text-align:center;padding:20px;">절 범위를 불러오는 중...</div>';
      return;
    }
    
    const from = parseInt(fromInput.value || 1);
    const to = parseInt(toInput.value || 1);
    
    if (isNaN(from) || isNaN(to)) {
      previewDiv.innerHTML = '<div style="text-align:center;padding:20px;">절을 선택해주세요</div>';
      return;
    }
    
    const startVerse = Math.min(from, to);
    const endVerse = Math.max(from, to);
    
    previewDiv.innerHTML = '<div style="text-align:center;padding:20px;">말씀을 불러오는 중...</div>';
    
    const url = `https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/${this.selectedBook.file}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        let bookData = data[this.selectedBook.name] || data[this.selectedBook.abbr];
        if (bookData && bookData[this.selectedChapter]) {
          const verses = bookData[this.selectedChapter];
          let text = '';
          for (let i = startVerse; i <= endVerse && verses[i]; i++) {
            text += verses[i] + ' ';
          }
          this.selectedText = text.trim();
          previewDiv.innerHTML = `<div style="background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border-radius:20px;padding:20px;border:1px solid #e8dcc8;">
            <div style="font-size:14px;color:#8a6e4e;margin-bottom:12px;">📖 말씀 미리보기</div>
            <div style="font-size:15px;line-height:1.8;color:#4a3a28;font-style:italic;">"${escapeHtml(this.selectedText)}"</div>
          </div>`;
        } else {
          previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 말씀을 불러올 수 없습니다</div>';
        }
      })
      .catch(() => {
        previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 데이터 로드 오류</div>';
      });
  },


  applyTodayVerse: function() {
    if (!this.selectedBook || !this.selectedChapter) {
      if (typeof showToast === 'function') showToast('책과 장을 선택해주세요');
      else alert('책과 장을 선택해주세요');
      return;
    }
    
    const from = parseInt(document.getElementById('vs-from')?.value || 1);
    const to = parseInt(document.getElementById('vs-to')?.value || 1);
    const startVerse = Math.min(from, to);
    const endVerse = Math.max(from, to);
    
    let ref = `${this.selectedBook.name} ${this.selectedChapter}장`;
    if (startVerse === endVerse) ref += ` ${startVerse}절`;
    else ref += ` ${startVerse}-${endVerse}절`;
    
    const verseText = this.selectedText || '말씀을 불러올 수 없습니다';
    
    const todayVerseData = { text: `"${verseText}"`, ref: ref, body: verseText };
    if (typeof LS !== 'undefined') LS.save('todayVerse', todayVerseData);
    renderTodayVerse();
    closeVerseSelector();
    if (typeof showToast === 'function') showToast(`✅ 오늘의 말씀이 등록되었습니다: ${ref}`);
    else alert(`✅ 오늘의 말씀이 등록되었습니다: ${ref}`);
  },


  goBack: function(step) {
    if (step === 'book') {
      this.showStep('book');
      this.loadBooks();
    } else if (step === 'chapter') {
      this.showStep('chapter');
    }
  }
};


// 전역 함수 연결
window.openVerseSelector = function() {
  console.log('openVerseSelector 실행됨');
  
  if (!currentUser) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다.');
    else alert('로그인이 필요합니다.');
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    if (typeof showToast === 'function') showToast('관리자 또는 매니저만 말씀을 등록할 수 있습니다.');
    else alert('관리자 또는 매니저만 말씀을 등록할 수 있습니다.');
    return;
  }
  
  const modal = document.getElementById('modal-verse-selector');
  if (!modal) {
    if (typeof showToast === 'function') showToast('말씀 선택기 모달을 찾을 수 없습니다.');
    else alert('말씀 선택기 모달을 찾을 수 없습니다.');
    return;
  }
  
  VerseTab.selectedBook = null;
  VerseTab.selectedChapter = 1;
  VerseTab.selectedText = '';
  VerseTab.showStep('book');
  VerseTab.loadBooks();
  modal.style.display = 'flex';
};


window.closeVerseSelector = function() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) modal.style.display = 'none';
};


window.vsGoBack = function(step) { VerseTab.goBack(step); };
window.selectBookForVerse = function(name) { VerseTab.pickBook(name); };
window.selectChapterForVerse = function(ch) { VerseTab.pickChapter(ch); };
window.updateVersePreview = function() { VerseTab.loadVersePreview(); };
window.applyTodayVerse = function() { VerseTab.applyTodayVerse(); };
window.loadBooksForSelector = function() { VerseTab.loadBooks(); };
window.showVerseStep = function(step) { VerseTab.showStep(step); };


// ------------------- 4. 묵상 기능 -------------------
let meditations = [];
let meditationPage = 1;
const MEDITATION_PER_PAGE = 10;


function loadMeditations() {
  meditations = (typeof LS !== 'undefined') ? LS.load('meditations', []) : [];
  renderMeditations();
}


// ✅ 수정: 날짜 표기 개선 (어제/그저께 추가)
function formatDisplayTime(createdAt) {
  if (!createdAt) return '방금 전';
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMs / 1000 / 60 / 60);
  const diffDays = Math.floor(diffMs / 1000 / 60 / 60 / 24);
  
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return '어제';
  if (diffDays === 2) return '그저께';
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return `${date.getMonth()+1}.${date.getDate()}`;
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
  
  container.innerHTML = pageItems.map(m => {
    const firstChar = m.author ? escapeHtml(m.author.charAt(0)) : '🙏';
    return `
    <div style="background:var(--bg);border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7a5230,#9e6b3e);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">${firstChar}</div>
        <div style="flex:1;"><div style="font-weight:700;">${escapeHtml(m.author)}</div><div style="font-size:11px;color:var(--text2);">${formatDisplayTime(m.createdAt)}</div></div>
        ${(currentUser && (currentUser.name === m.author || isAdmin)) ? `<button onclick="deleteMeditation(${m.id})" style="background:none;border:none;font-size:18px;cursor:pointer;color:#b91c1c;">🗑</button>` : ''}
      </div>
      <div style="font-size:14px;line-height:1.7;">${escapeHtml(m.text || m.content)}</div>
    </div>`;
  }).join('');
  
  const totalPages = Math.ceil(meditations.length / MEDITATION_PER_PAGE);
  if (totalPages > 1) {
    let paginationHtml = '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap;">';
    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `<button onclick="goToMeditationPage(${i})" style="padding:6px 12px;border-radius:20px;background:${meditationPage === i ? 'var(--purple)' : 'var(--bg2)'};color:${meditationPage === i ? 'white' : 'var(--text)'};">${i}</button>`;
    }
    paginationHtml += '</div>';
    container.innerHTML += paginationHtml;
  }
}


function goToMeditationPage(page) {
  meditationPage = page;
  renderMeditations();
}


function submitMeditation() {
  const input = document.getElementById('meditation-input');
  const content = input?.value.trim();
  if (!content) {
    if (typeof showToast === 'function') showToast('말씀 나누기 내용을 입력해주세요');
    else alert('말씀 나누기 내용을 입력해주세요');
    return;
  }
  if (!currentUser) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다');
    else alert('로그인이 필요합니다');
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  const newMeditation = {
    id: Date.now(),
    author: currentUser.name,
    text: content,
    content: content,
    createdAt: new Date().toISOString(),
    likes: 0
  };
  meditations.unshift(newMeditation);
  if (typeof LS !== 'undefined') LS.save('meditations', meditations);
  if (input) input.value = '';
  meditationPage = 1;
  renderMeditations();
  if (typeof showToast === 'function') showToast('✅ 말씀 나누기가 등록되었습니다');
  else alert('✅ 말씀 나누기가 등록되었습니다');
}


function deleteMeditation(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  meditations = meditations.filter(m => m.id !== id);
  if (typeof LS !== 'undefined') LS.save('meditations', meditations);
  renderMeditations();
  if (typeof showToast === 'function') showToast('🗑 삭제됨');
  else alert('🗑 삭제됨');
}


// 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadMeditations);
} else {
  loadMeditations();
}


console.log('✅ js_meditations.js 로드 완료');