// ==================== 오늘의 말씀 렌더링 ====================


// 전역 변수
let selectedBookInfo = null;
let selectedChapter = 1;


// 말씀 렌더링
function renderTodayVerse() {
  console.log('📖 renderTodayVerse 실행');
  
  let todayVerse = null;
  
  if (typeof LS !== 'undefined') {
    todayVerse = LS.load('todayVerse', null);
  }
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('todayVerse').once('value')
      .then(snap => {
        if (snap.exists()) {
          todayVerse = snap.val();
          if (typeof LS !== 'undefined') LS.save('todayVerse', todayVerse);
          updateVerseUI(todayVerse);
        } else if (todayVerse) {
          updateVerseUI(todayVerse);
        }
      })
      .catch(() => {
        if (todayVerse) updateVerseUI(todayVerse);
      });
  } else if (todayVerse) {
    updateVerseUI(todayVerse);
  } else {
    // 기본 말씀
    const textEl = document.getElementById('today-verse-text');
    const refEl = document.getElementById('today-verse-ref');
    const bodyEl = document.getElementById('today-verse-body');
    
    if (textEl) textEl.innerHTML = '"하나님은 사랑이시라"';
    if (refEl) refEl.innerHTML = '요한일서 4:16';
    if (bodyEl) bodyEl.innerHTML = '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라';
  }
}


function updateVerseUI(todayVerse) {
  if (!todayVerse || !todayVerse.text) return;
  
  const textEl = document.getElementById('today-verse-text');
  const refEl = document.getElementById('today-verse-ref');
  const bodyEl = document.getElementById('today-verse-body');
  
  if (textEl) {
    const shortText = todayVerse.text.length > 100 ? todayVerse.text.substring(0, 100) + '...' : todayVerse.text;
    textEl.innerHTML = `"${shortText}"`;
  }
  if (refEl) refEl.innerHTML = todayVerse.ref;
  if (bodyEl) bodyEl.innerHTML = todayVerse.text;
}


// ==================== 말씀 등록 모달 (성경전서 스타일) ====================


// 단계 표시
function showVerseStep(step) {
  const step1 = document.getElementById('vstep1');
  const step2 = document.getElementById('vstep2');
  const step3 = document.getElementById('vstep3');
  const bookDiv = document.getElementById('vstep-book');
  const chapterDiv = document.getElementById('vstep-chapter');
  const verseDiv = document.getElementById('vstep-verse');
  
  if (!step1 || !step2 || !step3 || !bookDiv || !chapterDiv || !verseDiv) return;
  
  [step1, step2, step3].forEach(s => {
    if (s) { s.style.background = 'var(--bg2)'; s.style.color = 'var(--text2)'; }
  });
  
  if (step === 'book') {
    if (step1) { step1.style.background = 'var(--purple)'; step1.style.color = 'white'; }
    bookDiv.style.display = 'block';
    chapterDiv.style.display = 'none';
    verseDiv.style.display = 'none';
  } else if (step === 'chapter') {
    if (step2) { step2.style.background = 'var(--purple)'; step2.style.color = 'white'; }
    bookDiv.style.display = 'none';
    chapterDiv.style.display = 'block';
    verseDiv.style.display = 'none';
  } else if (step === 'verse') {
    if (step3) { step3.style.background = 'var(--purple)'; step3.style.color = 'white'; }
    bookDiv.style.display = 'none';
    chapterDiv.style.display = 'none';
    verseDiv.style.display = 'block';
  }
}


// ✅ 성경전서 스타일 책 목록 로드
function loadBooksForSelector() {
  const otDiv = document.getElementById('vs-ot-books');
  const ntDiv = document.getElementById('vs-nt-books');
  
  if (!otDiv || !ntDiv) return;
  
  const bookBtnStyle = `
    background: linear-gradient(145deg, #fdf8f0, #f5e8d5);
    border: 1.5px solid #c8b896;
    border-radius: 16px;
    padding: 12px 4px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  `;
  
  const bookTitleStyle = `font-size: 16px; font-weight: 800; color: #6b4f2e;`;
  const bookSubStyle = `font-size: 10px; color: #8a6e4e; margin-top: 4px;`;
  
  if (typeof OT_BOOKS !== 'undefined') {
    otDiv.innerHTML = OT_BOOKS.map(b => `
      <div style="${bookBtnStyle}" onclick="selectBookForVerse('${b.name}')" 
           onmouseover="this.style.transform='scale(1.02)';this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" 
           onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">
        <div style="${bookTitleStyle}">${b.abbr}</div>
        <div style="${bookSubStyle}">${b.chapters}장</div>
      </div>
    `).join('');
  }
  
  if (typeof NT_BOOKS !== 'undefined') {
    ntDiv.innerHTML = NT_BOOKS.map(b => `
      <div style="${bookBtnStyle}" onclick="selectBookForVerse('${b.name}')"
           onmouseover="this.style.transform='scale(1.02)';this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)';" 
           onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">
        <div style="${bookTitleStyle}">${b.abbr}</div>
        <div style="${bookSubStyle}">${b.chapters}장</div>
      </div>
    `).join('');
  }
}


// ✅ 책 선택
function selectBookForVerse(bookName) {
  if (typeof OT_BOOKS !== 'undefined') {
    selectedBookInfo = OT_BOOKS.find(b => b.name === bookName) || 
                       (typeof NT_BOOKS !== 'undefined' ? NT_BOOKS.find(b => b.name === bookName) : null);
  }
  if (!selectedBookInfo) return;
  
  const bookSelectedEl = document.getElementById('vs-book-selected');
  if (bookSelectedEl) {
    bookSelectedEl.innerHTML = `<span style="font-size:20px;">📖</span> ${selectedBookInfo.name}`;
  }
  
  const container = document.getElementById('vs-chapters');
  if (container) {
    let html = '<div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">';
    for (let i = 1; i <= selectedBookInfo.chapters; i++) {
      html += `
        <button onclick="selectChapterForVerse(${i})" 
          style="width:60px; height:60px; 
                 background:linear-gradient(145deg, #fdf8f0, #f0e8d8);
                 border:1.5px solid #d4b896;
                 border-radius:16px;
                 font-size:16px;
                 font-weight:700;
                 color:#6b4f2e;
                 cursor:pointer;
                 box-shadow:0 2px 6px rgba(0,0,0,0.08);
                 transition:all 0.2s;">
          ${i}
        </button>
      `;
    }
    html += '</div>';
    container.innerHTML = html;
  }
  
  showVerseStep('chapter');
}


// ✅ 장 선택
function selectChapterForVerse(chapter) {
  selectedChapter = chapter;
  const chapterSelectedEl = document.getElementById('vs-chapter-selected');
  if (chapterSelectedEl) {
    chapterSelectedEl.innerHTML = `<span style="font-size:18px;">📖</span> ${selectedBookInfo.name} ${chapter}장`;
  }
  
  const fromSelect = document.getElementById('vs-from');
  const toSelect = document.getElementById('vs-to');
  
  if (fromSelect && toSelect && selectedBookInfo) {
    fromSelect.innerHTML = '<option>로딩 중...</option>';
    
    (async () => {
      let maxVerses = 150;
      try {
        const BIBLE_CDN = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main';
        const res = await fetch(`${BIBLE_CDN}/${selectedBookInfo.file}`);
        const data = await res.json();
        let bookData = data;
        for (const key of [selectedBookInfo.name, selectedBookInfo.abbr]) {
          if (data[key] && data[key][chapter]) {
            bookData = data[key];
            break;
          }
        }
        if (bookData && bookData[chapter]) {
          maxVerses = Object.keys(bookData[chapter]).length;
        }
      } catch(e) {}
      
      let options = '';
      for (let i = 1; i <= maxVerses; i++) {
        options += `<option value="${i}" style="padding:8px;">${i}절</option>`;
      }
      fromSelect.innerHTML = options;
      toSelect.innerHTML = options;
      if (toSelect) toSelect.value = Math.min(maxVerses, 5);
      
      updateVersePreview();
    })();
  }
  
  if (fromSelect) fromSelect.onchange = () => updateVersePreview();
  if (toSelect) toSelect.onchange = () => updateVersePreview();
  
  showVerseStep('verse');
}


// ✅ 말씀 미리보기 (성경전서 스타일)
async function updateVersePreview() {
  const from = parseInt(document.getElementById('vs-from')?.value || 1);
  const to = parseInt(document.getElementById('vs-to')?.value || 1);
  const previewDiv = document.getElementById('vs-preview');
  
  if (!previewDiv || !selectedBookInfo) return;
  
  previewDiv.innerHTML = '<div style="text-align:center; padding:20px;"><div class="splash-spinner" style="width:24px;height:24px;margin:0 auto;"></div><div style="margin-top:12px;">말씀을 불러오는 중...</div></div>';
  
  try {
    const BIBLE_CDN = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main';
    const res = await fetch(`${BIBLE_CDN}/${selectedBookInfo.file}`);
    const data = await res.json();
    let bookData = data;
    for (const key of [selectedBookInfo.name, selectedBookInfo.abbr]) {
      if (data[key] && data[key][selectedChapter]) {
        bookData = data[key];
        break;
      }
    }
    
    if (bookData && bookData[selectedChapter]) {
      const verses = bookData[selectedChapter];
      let text = '';
      for (let i = from; i <= to && verses[i]; i++) {
        text += verses[i] + ' ';
      }
      previewDiv.innerHTML = `
        <div style="background:linear-gradient(145deg, #fdf8f0, #f5e8d5); border-radius:20px; padding:20px; border:1px solid #e8dcc8;">
          <div style="font-size:14px; color:#8a6e4e; margin-bottom:12px;">📖 말씀 미리보기</div>
          <div style="font-size:15px; line-height:1.8; color:#4a3a28; font-style:italic;">“${escapeHtml(text.trim())}”</div>
        </div>
      `;
    } else {
      previewDiv.innerHTML = '<div style="color:#b91c1c; text-align:center; padding:20px;">⚠️ 말씀을 불러올 수 없습니다</div>';
    }
  } catch(e) {
    previewDiv.innerHTML = '<div style="color:#b91c1c; text-align:center; padding:20px;">⚠️ 오류가 발생했습니다</div>';
  }
}


// ✅ 오늘의 말씀으로 등록
async function applyTodayVerse() {
  const from = parseInt(document.getElementById('vs-from')?.value || 1);
  const to = parseInt(document.getElementById('vs-to')?.value || 1);
  
  if (!selectedBookInfo || !selectedChapter) {
    alert('📖 책과 장을 선택해주세요');
    return;
  }
  
  let ref = `${selectedBookInfo.name} ${selectedChapter}장`;
  if (from === to) {
    ref += ` ${from}절`;
  } else {
    ref += ` ${from}-${to}절`;
  }
  
  let verseText = '';
  
  try {
    const BIBLE_CDN = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main';
    const res = await fetch(`${BIBLE_CDN}/${selectedBookInfo.file}`);
    const data = await res.json();
    let bookData = data;
    for (const key of [selectedBookInfo.name, selectedBookInfo.abbr]) {
      if (data[key] && data[key][selectedChapter]) {
        bookData = data[key];
        break;
      }
    }
    
    if (bookData && bookData[selectedChapter]) {
      const verses = bookData[selectedChapter];
      const texts = [];
      for (let i = from; i <= to && verses[i]; i++) {
        texts.push(verses[i]);
      }
      verseText = texts.join(' ');
    }
    
    if (!verseText) {
      alert('말씀을 불러올 수 없습니다');
      return;
    }
    
    const todayVerseData = { ref: ref, text: verseText };
    
    if (typeof LS !== 'undefined') LS.save('todayVerse', todayVerseData);
    
    if (window.FB_READY && typeof firebase !== 'undefined') {
      await firebase.database().ref('todayVerse').set(todayVerseData);
    }
    
    updateVerseUI(todayVerseData);
    closeVerseSelector();
    alert(`✅ 오늘의 말씀이 등록되었습니다!\n\n📖 ${ref}\n\n“${verseText.length > 80 ? verseText.substring(0, 80) + '…' : verseText}”`);
    
  } catch(e) {
    console.error('말씀 등록 오류:', e);
    alert('말씀 등록 중 오류가 발생했습니다: ' + e.message);
  }
}


// 뒤로가기
function vsGoBack(step) {
  if (step === 'book') {
    showVerseStep('book');
  } else if (step === 'chapter') {
    showVerseStep('chapter');
  }
}


// ==================== 말씀 등록 모달 열기/닫기 ====================


window.openVerseSelector = function() {
  console.log('🔧 openVerseSelector 실행됨');
  
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    alert('관리자 또는 매니저만 말씀을 등록할 수 있습니다.\n현재 권한: ' + (currentUser.role || '일반성도'));
    return;
  }
  
  const modal = document.getElementById('modal-verse-selector');
  if (!modal) {
    alert('말씀 선택기 모달을 찾을 수 없습니다.');
    return;
  }
  
  // 초기화
  selectedBookInfo = null;
  selectedChapter = 1;
  
  // UI 초기화
  const vstepBook = document.getElementById('vstep-book');
  const vstepChapter = document.getElementById('vstep-chapter');
  const vstepVerse = document.getElementById('vstep-verse');
  
  if (vstepBook) vstepBook.style.display = 'block';
  if (vstepChapter) vstepChapter.style.display = 'none';
  if (vstepVerse) vstepVerse.style.display = 'none';
  
  const step1 = document.getElementById('vstep1');
  const step2 = document.getElementById('vstep2');
  const step3 = document.getElementById('vstep3');
  
  if (step1) { step1.style.background = 'var(--purple)'; step1.style.color = 'white'; }
  if (step2) { step2.style.background = 'var(--bg2)'; step2.style.color = 'var(--text2)'; }
  if (step3) { step3.style.background = 'var(--bg2)'; step3.style.color = 'var(--text2)'; }
  
  loadBooksForSelector();
  modal.style.display = 'flex';
};


window.closeVerseSelector = function() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) modal.style.display = 'none';
};


// ==================== 말씀 공유하기 ====================


window.shareToday = function() {
  console.log('📤 shareToday 실행됨');
  
  const ref = document.getElementById('today-verse-ref')?.innerText || '';
  const text = document.getElementById('today-verse-text')?.innerText || '';
  
  if (!ref && !text) {
    alert('공유할 말씀이 없습니다.');
    return;
  }
  
  const shareText = `${ref}\n\n${text}`;
  
  if (navigator.share) {
    navigator.share({
      title: '가좌제일교회 오늘의 말씀',
      text: shareText,
    }).catch(err => console.log('공유 취소:', err));
  } else {
    navigator.clipboard.writeText(shareText);
    alert('말씀이 클립보드에 복사되었습니다');
  }
};


// ==================== 말씀 나누기 (묵상) ====================


let meditations = [];
let meditationPage = 1;
const MEDITATION_PER_PAGE = 10;


async function loadMeditations() {
  try {
    if (window.FB_READY) {
      const snapshot = await firebase.database().ref('meditations').once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        meditations = Object.values(data).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (typeof LS !== 'undefined') LS.save('meditations', meditations);
      } else {
        meditations = typeof LS !== 'undefined' ? LS.load('meditations', []) : [];
      }
    } else {
      meditations = typeof LS !== 'undefined' ? LS.load('meditations', []) : [];
    }
    renderMeditations();
  } catch (e) {
    console.error('묵상 로드 실패:', e);
    meditations = [];
    renderMeditations();
  }
}


function renderMeditations() {
  const container = document.getElementById('meditation-list');
  if (!container) return;
  
  if (meditations.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">💬 아직 등록된 묵상이 없습니다.<br>첫 번째로 말씀 나누기를 해보세요!</div>';
    return;
  }
  
  const start = (meditationPage - 1) * MEDITATION_PER_PAGE;
  const pageItems = meditations.slice(start, start + MEDITATION_PER_PAGE);
  
  container.innerHTML = pageItems.map(m => `
    <div style="background:var(--bg);border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7a5230,#9e6b3e);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;">
          ${m.author ? m.author.charAt(0) : '🙏'}
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;color:var(--text);">${escapeHtml(m.author || '익명')}</div>
          <div style="font-size:11px;color:var(--text2);">${formatDate(m.createdAt)}</div>
        </div>
        ${currentUser && (currentUser.role === 'admin' || currentUser.name === m.author) ? `
          <button onclick="deleteMeditation('${m.id}')" style="background:none;border:none;font-size:18px;cursor:pointer;color:#b91c1c;">🗑</button>
        ` : ''}
      </div>
      <div style="font-size:14px;color:var(--text);line-height:1.7;white-space:pre-wrap;">${escapeHtml(m.content)}</div>
      ${m.verseRef ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--purple);">📖 ${escapeHtml(m.verseRef)}</div>` : ''}
    </div>
  `).join('');
  
  const totalPages = Math.ceil(meditations.length / MEDITATION_PER_PAGE);
  if (totalPages > 1) {
    let paginationHtml = '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap;">';
    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `<button onclick="goToMeditationPage(${i})" style="padding:6px 12px;border-radius:20px;border:1px solid var(--border);background:${meditationPage === i ? 'var(--purple)' : 'var(--bg2)'};color:${meditationPage === i ? 'white' : 'var(--text)'};cursor:pointer;">${i}</button>`;
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
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}


window.submitMeditation = async function() {
  console.log('✏️ submitMeditation 실행됨');
  
  const input = document.getElementById('meditation-input');
  const content = input?.value.trim();
  
  if (!content) {
    alert('말씀 나누기 내용을 입력해주세요');
    return;
  }
  
  if (!currentUser) {
    alert('로그인이 필요합니다');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  const newMeditation = {
    id: Date.now().toString(),
    content: content,
    author: currentUser.name || currentUser.id || '익명',
    authorId: currentUser.id,
    createdAt: new Date().toISOString(),
    verseRef: document.getElementById('today-verse-ref')?.innerText || ''
  };
  
  try {
    if (window.FB_READY && typeof firebase !== 'undefined') {
      await firebase.database().ref('meditations').push(newMeditation);
    }
    
    meditations.unshift(newMeditation);
    if (typeof LS !== 'undefined') LS.save('meditations', meditations);
    
    input.value = '';
    meditationPage = 1;
    renderMeditations();
    alert('✅ 말씀 나누기가 등록되었습니다');
  } catch (e) {
    console.error('묵상 등록 실패:', e);
    alert('등록에 실패했습니다: ' + e.message);
  }
};


async function deleteMeditation(id) {
  if (!confirm('이 묵상을 삭제하시겠습니까?')) return;
  
  try {
    if (window.FB_READY && typeof firebase !== 'undefined') {
      const snapshot = await firebase.database().ref('meditations').once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        const key = Object.keys(data).find(k => data[k].id === id);
        if (key) {
          await firebase.database().ref(`meditations/${key}`).remove();
        }
      }
    }
    
    meditations = meditations.filter(m => m.id !== id);
    if (typeof LS !== 'undefined') LS.save('meditations', meditations);
    renderMeditations();
    alert('✅ 삭제되었습니다');
  } catch (e) {
    console.error('삭제 실패:', e);
    alert('삭제에 실패했습니다');
  }
}


function subscribeMeditations() {
  if (!window.FB_READY) return;
  
  firebase.database().ref('meditations').on('value', (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      meditations = Object.values(data).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (typeof LS !== 'undefined') LS.save('meditations', meditations);
      renderMeditations();
    }
  });
}


console.log('✅ js_meditations.js 로드 완료');
console.log('openVerseSelector:', typeof openVerseSelector);
console.log('shareToday:', typeof shareToday);
console.log('submitMeditation:', typeof submitMeditation);