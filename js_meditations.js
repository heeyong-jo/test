// ==================== 말씀 묵상 & 오늘의 말씀 (탭 방식, 충돌 방지) ====================


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
  if (el_body) el_body.textContent = todayVerse.body || todayVerse.text;
}


// ------------------- 2. 말씀 공유 -------------------
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


// ------------------- 3. 말씀 등록 모달 (탭 방식, 전역 변수 사용 최소화) -------------------
// 독립적인 네임스페이스 사용
const VerseTab = {
  selectedBook: null,
  selectedChapter: 1,
  bibleData: {},


  // 단계 표시
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


  // 책 목록 로드
  loadBooks: function() {
    const otDiv = document.getElementById('vs-ot-books');
    const ntDiv = document.getElementById('vs-nt-books');
    if (!otDiv || !ntDiv) return;
    
    if (typeof OT_BOOKS === 'undefined') {
      otDiv.innerHTML = '<div style="color:red;">데이터 로드 실패</div>';
      ntDiv.innerHTML = '<div style="color:red;">데이터 로드 실패</div>';
      return;
    }
    
    const btnStyle = 'background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border:1.5px solid #c8b896;border-radius:16px;padding:12px 4px;text-align:center;cursor:pointer;margin:4px;transition:all 0.2s;';
    const titleStyle = 'font-size:16px;font-weight:800;color:#6b4f2e;';
    const subStyle = 'font-size:10px;color:#8a6e4e;margin-top:4px;';
    
    let otHtml = '';
    for (let i = 0; i < OT_BOOKS.length; i++) {
      const b = OT_BOOKS[i];
      otHtml += `<div style="${btnStyle}" onclick="VerseTab.pickBook('${b.name}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="${titleStyle}">${b.abbr}</div>
        <div style="${subStyle}">${b.chapters}장</div>
      </div>`;
    }
    otDiv.innerHTML = otHtml;
    
    let ntHtml = '';
    for (let i = 0; i < NT_BOOKS.length; i++) {
      const b = NT_BOOKS[i];
      ntHtml += `<div style="${btnStyle}" onclick="VerseTab.pickBook('${b.name}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="${titleStyle}">${b.abbr}</div>
        <div style="${subStyle}">${b.chapters}장</div>
      </div>`;
    }
    ntDiv.innerHTML = ntHtml;
  },


  // 책 선택
  pickBook: function(bookName) {
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


  // 장 선택
  pickChapter: function(chapter) {
    this.selectedChapter = chapter;
    const chapterSelectedEl = document.getElementById('vs-chapter-selected');
    if (chapterSelectedEl) chapterSelectedEl.innerHTML = `📖 ${this.selectedBook.name} ${chapter}장`;
    
    // 절 범위 기본값 설정
    const fromSelect = document.getElementById('vs-from');
    const toSelect = document.getElementById('vs-to');
    if (fromSelect && toSelect) {
      let options = '';
      for (let i = 1; i <= 150; i++) {
        options += `<option value="${i}">${i}절</option>`;
      }
      fromSelect.innerHTML = options;
      toSelect.innerHTML = options;
      toSelect.value = 5;
    }
    
    this.showStep('verse');
    this.loadVersePreview();
  },


  // 말씀 미리보기 로드
  loadVersePreview: function() {
    const previewDiv = document.getElementById('vs-preview');
    if (!previewDiv || !this.selectedBook) return;
    
    previewDiv.innerHTML = '<div style="text-align:center;padding:20px;">말씀을 불러오는 중...</div>';
    
    const filePath = this.selectedBook.file;
    const url = `https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/${filePath}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        let bookData = data[this.selectedBook.name] || data[this.selectedBook.abbr];
        if (bookData && bookData[this.selectedChapter]) {
          const verses = bookData[this.selectedChapter];
          const from = parseInt(document.getElementById('vs-from')?.value || 1);
          const to = parseInt(document.getElementById('vs-to')?.value || 1);
          let text = '';
          for (let i = from; i <= to && verses[i]; i++) {
            text += verses[i] + ' ';
          }
          previewDiv.innerHTML = `<div style="background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border-radius:20px;padding:20px;border:1px solid #e8dcc8;">
            <div style="font-size:14px;color:#8a6e4e;margin-bottom:12px;">📖 말씀 미리보기</div>
            <div style="font-size:15px;line-height:1.8;color:#4a3a28;font-style:italic;">"${escapeHtml(text.trim())}"</div>
          </div>`;
        } else {
          previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 말씀을 불러올 수 없습니다</div>';
        }
      })
      .catch(() => {
        previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 데이터 로드 오류</div>';
      });
  },


  // 오늘의 말씀으로 등록
  applyTodayVerse: function() {
    if (!this.selectedBook || !this.selectedChapter) {
      alert('책과 장을 선택해주세요');
      return;
    }
    
    const from = document.getElementById('vs-from')?.value || 1;
    const to = document.getElementById('vs-to')?.value || 1;
    let ref = `${this.selectedBook.name} ${this.selectedChapter}장`;
    if (from == to) ref += ` ${from}절`;
    else ref += ` ${from}-${to}절`;
    
    // 미리보기에서 말씀 텍스트 가져오기
    const previewDiv = document.getElementById('vs-preview');
    let verseText = '';
    if (previewDiv) {
      const textMatch = previewDiv.innerText.match(/"([^"]+)"/);
      if (textMatch) verseText = textMatch[1];
    }
    if (!verseText) verseText = `말씀을 불러올 수 없습니다 (${ref})`;
    
    const todayVerseData = { text: `"${verseText}"`, ref: ref, body: verseText };
    LS.save('todayVerse', todayVerseData);
    renderTodayVerse();
    closeVerseSelector();
    showToast(`✅ 오늘의 말씀이 등록되었습니다: ${ref}`);
  },


  // 뒤로가기
  goBack: function(step) {
    if (step === 'book') {
      this.showStep('book');
      this.loadBooks();
    } else if (step === 'chapter') {
      this.showStep('chapter');
    }
  }
};


// 전역 함수 연결 (충돌 방지를 위해 VerseTab 객체로 위임)
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
  
  VerseTab.selectedBook = null;
  VerseTab.selectedChapter = 1;
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


// ------------------- 4. 묵상 기능 (말씀 나누기) -------------------
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
    <div style="background:var(--bg);border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7a5230,#9e6b3e);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">${m.author ? m.author.charAt(0) : '🙏'}</div>
        <div style="flex:1;"><div style="font-weight:700;">${escapeHtml(m.author)}</div><div style="font-size:11px;color:var(--text2);">${m.time || formatDate(m.createdAt)}</div></div>
        ${(currentUser && (currentUser.name === m.author || isAdmin)) ? `<button onclick="deleteMeditation(${m.id})" style="background:none;border:none;font-size:18px;cursor:pointer;color:#b91c1c;">🗑</button>` : ''}
      </div>
      <div style="font-size:14px;line-height:1.7;">${escapeHtml(m.text || m.content)}</div>
    </div>
  `).join('');
  
  const totalPages = Math.ceil(meditations.length / MEDITATION_PER_PAGE);
  if (totalPages > 1) {
    let paginationHtml = '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
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
    likes: 0
  };
  meditations.unshift(newMeditation);
  LS.save('meditations', meditations);
  input.value = '';
  meditationPage = 1;
  renderMeditations();
  showToast('✅ 말씀 나누기가 등록되었습니다');
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


console.log('✅ js_meditations.js 로드 완료 (탭 방식, 성경읽기 충돌 없음)');