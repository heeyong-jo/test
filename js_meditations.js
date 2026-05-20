// ==================== 오늘의 말씀 렌더링 ====================
function renderTodayVerse() {
  // localStorage에서 말씀 데이터 로드
  let todayVerse = null;
  
  if (typeof LS !== 'undefined') {
    todayVerse = LS.load('todayVerse', null);
  }
  
  // Firebase에서도 시도 (선택사항)
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


// ==================== 말씀 나누기 (묵상) ====================


// 전역 변수
let meditations = [];
let meditationPage = 1;
const MEDITATION_PER_PAGE = 10;


// 묵상 불러오기
async function loadMeditations() {
  try {
    if (window.FB_READY) {
      const snapshot = await firebase.database().ref('meditations').once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        meditations = Object.values(data).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        LS.save('meditations', meditations);
      } else {
        meditations = LS.load('meditations', []);
      }
    } else {
      meditations = LS.load('meditations', []);
    }
    renderMeditations();
  } catch (e) {
    console.error('묵상 로드 실패:', e);
    meditations = LS.load('meditations', []);
    renderMeditations();
  }
}


// 묵상 렌더링
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
      ${m.verseRef ? `
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--purple);">
          📖 ${escapeHtml(m.verseRef)}
        </div>
      ` : ''}
    </div>
  `).join('');
  
  // 페이징 버튼
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


// 페이지 이동
function goToMeditationPage(page) {
  meditationPage = page;
  renderMeditations();
}


// 날짜 포맷
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}


// 묵상 등록
async function submitMeditation() {
  const input = document.getElementById('meditation-input');
  const content = input?.value.trim();
  
  if (!content) {
    showToast('말씀 나누기 내용을 입력해주세요');
    return;
  }
  
  if (!currentUser) {
    showToast('로그인이 필요합니다');
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
    if (window.FB_READY) {
      await firebase.database().ref('meditations').push(newMeditation);
    }
    
    meditations.unshift(newMeditation);
    LS.save('meditations', meditations);
    
    input.value = '';
    meditationPage = 1;
    renderMeditations();
    showToast('✅ 말씀 나누기가 등록되었습니다');
  } catch (e) {
    console.error('묵상 등록 실패:', e);
    showToast('등록에 실패했습니다. 다시 시도해주세요');
  }
}


// 묵상 삭제
async function deleteMeditation(id) {
  if (!confirm('이 묵상을 삭제하시겠습니까?')) return;
  
  try {
    if (window.FB_READY) {
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
    LS.save('meditations', meditations);
    renderMeditations();
    showToast('✅ 삭제되었습니다');
  } catch (e) {
    console.error('삭제 실패:', e);
    showToast('삭제에 실패했습니다');
  }
}
// 말씀 등록 모달 열기
function openVerseSelector() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) modal.style.display = 'flex';
}


// 말씀 등록 모달 닫기
function closeVerseSelector() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) modal.style.display = 'none';
}


// 말씀 공유하기
function shareToday() {
  const ref = document.getElementById('today-verse-ref')?.innerText || '';
  const text = document.getElementById('today-verse-text')?.innerText || '';
  
  if (navigator.share) {
    navigator.share({
      title: '가좌제일교회 오늘의 말씀',
      text: `${ref}\n\n${text}`,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${ref}\n\n${text}`);
    showToast('말씀이 클립보드에 복사되었습니다');
  }
}
// 실시간 묵상 구독 (Firebase)
function subscribeMeditations() {
  if (!window.FB_READY) return;
  
  firebase.database().ref('meditations').on('value', (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      meditations = Object.values(data).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      LS.save('meditations', meditations);
      renderMeditations();
    }
  });
}
// ==================== 말씀 등록 기능 (추가) ====================


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


// 책 목록 로드
function loadBooksForSelector() {
  const otDiv = document.getElementById('vs-ot-books');
  const ntDiv = document.getElementById('vs-nt-books');
  
  if (!otDiv || !ntDiv) return;
  
  const btnStyle = 'background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:8px 4px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;';
  
  if (typeof OT_BOOKS !== 'undefined') {
    otDiv.innerHTML = OT_BOOKS.map(b => 
      `<div style="${btnStyle}" onclick="selectBookForVerse('${b.name}')">${b.abbr}<div style="font-size:9px;color:var(--text2);">${b.chapters}장</div></div>`
    ).join('');
  }
  
  if (typeof NT_BOOKS !== 'undefined') {
    ntDiv.innerHTML = NT_BOOKS.map(b => 
      `<div style="${btnStyle}" onclick="selectBookForVerse('${b.name}')">${b.abbr}<div style="font-size:9px;color:var(--text2);">${b.chapters}장</div></div>`
    ).join('');
  }
}


let selectedBookInfo = null;
let selectedChapter = 1;


// 책 선택
function selectBookForVerse(bookName) {
  if (typeof OT_BOOKS !== 'undefined') {
    selectedBookInfo = OT_BOOKS.find(b => b.name === bookName) || 
                       (typeof NT_BOOKS !== 'undefined' ? NT_BOOKS.find(b => b.name === bookName) : null);
  }
  if (!selectedBookInfo) return;
  
  const bookSelectedEl = document.getElementById('vs-book-selected');
  if (bookSelectedEl) bookSelectedEl.innerHTML = `${selectedBookInfo.emoji || '📖'} ${selectedBookInfo.name}`;
  
  const container = document.getElementById('vs-chapters');
  if (container) {
    let html = '';
    for (let i = 1; i <= selectedBookInfo.chapters; i++) {
      html += `<button onclick="selectChapterForVerse(${i})" style="width:55px;height:55px;border-radius:12px;background:var(--bg);border:1.5px solid var(--border);font-size:14px;font-weight:600;cursor:pointer;">${i}</button>`;
    }
    container.innerHTML = html;
  }
  
  showVerseStep('chapter');
}


// 장 선택
function selectChapterForVerse(chapter) {
  selectedChapter = chapter;
  const chapterSelectedEl = document.getElementById('vs-chapter-selected');
  if (chapterSelectedEl) chapterSelectedEl.innerHTML = `${selectedBookInfo.name} ${chapter}장`;
  
  const fromSelect = document.getElementById('vs-from');
  const toSelect = document.getElementById('vs-to');
  
  if (fromSelect && toSelect && selectedBookInfo) {
    let maxVerses = 150;
    
    (async () => {
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
        options += `<option value="${i}">${i}절</option>`;
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


// 말씀 미리보기
async function updateVersePreview() {
  const from = parseInt(document.getElementById('vs-from')?.value || 1);
  const to = parseInt(document.getElementById('vs-to')?.value || 1);
  const previewDiv = document.getElementById('vs-preview');
  
  if (!previewDiv || !selectedBookInfo) return;
  
  previewDiv.innerHTML = '<div style="text-align:center;">로딩 중...</div>';
  
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
      previewDiv.innerHTML = `<div style="font-size:13px;line-height:1.7;">${escapeHtml(text.trim())}</div>`;
    } else {
      previewDiv.innerHTML = '<div style="color:red;">말씀을 불러올 수 없습니다</div>';
    }
  } catch(e) {
    previewDiv.innerHTML = '<div style="color:red;">오류가 발생했습니다</div>';
  }
}


// 오늘의 말씀으로 등록
async function applyTodayVerse() {
  const from = parseInt(document.getElementById('vs-from')?.value || 1);
  const to = parseInt(document.getElementById('vs-to')?.value || 1);
  
  if (!selectedBookInfo || !selectedChapter) {
    showToast('책과 장을 선택해주세요');
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
      showToast('말씀을 불러올 수 없습니다');
      return;
    }
    
    const todayVerseData = { ref: ref, text: verseText };
    
    if (typeof LS !== 'undefined') LS.save('todayVerse', todayVerseData);
    
    if (window.FB_READY && typeof firebase !== 'undefined') {
      await firebase.database().ref('todayVerse').set(todayVerseData);
    }
    
    updateVerseUI(todayVerseData);
    closeVerseSelector();
    showToast(`✅ 오늘의 말씀이 등록되었습니다: ${ref}`);
    
  } catch(e) {
    console.error('말씀 등록 오류:', e);
    showToast('말씀 등록 중 오류가 발생했습니다');
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


// openVerseSelector 수정 (초기화 추가)
const originalOpenVerseSelector = openVerseSelector;
window.openVerseSelector = function() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) {
    // 초기화
    selectedBookInfo = null;
    selectedChapter = 1;
    showVerseStep('book');
    loadBooksForSelector();
    modal.style.display = 'flex';
  }
};