// ==================== 성경 초기화 ====================
let bibleReadingFontSize = 15;  
let appendixFontSize = 14;
let fontSize = 15;
let currentBook = null;
let currentBookInfo = null;
let currentChapter = 1;
let currentBibleSection = null;


// 찬송가 관련 변수
let hymnTitles = {};
let hymnTitlesLoaded = false;
let currentHymnNo = 1;
let currentHymnRange = 0;
let hymnSearchQuery = '';


function applyAppendixFont() {
  ['app-dokun', 'app-apostle', 'app-lords', 'app-ten'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.fontSize = appendixFontSize + 'px';
  });
}


function changeAppendixFont(delta) {
  appendixFontSize = Math.min(22, Math.max(11, appendixFontSize + delta));
  applyAppendixFont();
}


function openBibleSection(section) {
  currentBibleSection = section;
  document.getElementById('bibleMain').style.display = 'none';
  if (section === 'scripture') {
    document.getElementById('bibleScriptureView').style.display = 'block';
    initBibleBooks();
  } else if (section === 'hymn') {
    document.getElementById('bibleHymnView').style.display = 'block';
    initHymn();
  } else if (section === 'appendix') {
    document.getElementById('bibleAppendixView').style.display = 'block';
  }
}


function closeBibleSection() {
  currentBibleSection = null;
  ['bibleScriptureView', 'bibleHymnView', 'bibleAppendixView'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('bibleMain').style.display = 'flex';
}


function initBibleBooks() {
  const otDiv = document.getElementById('otBooks');
  const ntDiv = document.getElementById('ntBooks');
  if (!otDiv || otDiv.innerHTML) return;
  const otStyle = 'background:#fffaf0;border:1.5px solid #c8b896;border-radius:12px;padding:10px 4px;text-align:center;cursor:pointer;';
  const ntStyle = 'background:#fffaf0;border:1.5px solid #c8b896;border-radius:12px;padding:10px 4px;text-align:center;cursor:pointer;';
  otDiv.innerHTML = OT_BOOKS.map(b => `<div style="${otStyle}" onclick="selectBook('${b.name}')"><div style="font-size:15px;font-weight:800;color:#6b4f2e;">${b.abbr}</div><div style="font-size:9px;color:#8a6e4e;">${b.name.slice(0,4)}</div><div style="font-size:8px;color:#b8956e;">${b.chapters}장</div></div>`).join('');
  ntDiv.innerHTML = NT_BOOKS.map(b => `<div style="${ntStyle}" onclick="selectBook('${b.name}')"><div style="font-size:15px;font-weight:800;color:#6b4f2e;">${b.abbr}</div><div style="font-size:9px;color:#8a6e4e;">${b.name.slice(0,4)}</div><div style="font-size:8px;color:#b8956e;">${b.chapters}장</div></div>`).join('');
}


async function selectBook(bookName) {
  currentBookInfo = OT_BOOKS.find(b => b.name === bookName) || NT_BOOKS.find(b => b.name === bookName);
  if (!currentBookInfo) return;
  currentBook = bookName;
  currentChapter = 1;
  document.getElementById('bibleListView').style.display = 'none';
  document.getElementById('bibleChapterView').style.display = 'block';
  document.getElementById('selectedBookTitle').innerHTML = '📖 ' + currentBookInfo.name;
  const container = document.getElementById('chapterButtons');
  let html = '';
  for (let i = 1; i <= currentBookInfo.chapters; i++) {
    html += `<button onclick="loadChapter(${i})" style="width:48px;height:48px;border-radius:14px;background:#f4f1f8;border:1.5px solid #ddd0f0;font-size:14px;font-weight:600;cursor:pointer;">${i}</button>`;
  }
  container.innerHTML = html;
}


async function loadChapter(chapter) {
  if (!currentBookInfo) { showToast('책 정보가 없습니다.'); showBibleList(); return; }
  currentChapter = chapter;
  document.getElementById('bibleChapterView').style.display = 'none';
  document.getElementById('bibleVerseView').style.display = 'block';
  document.getElementById('verseTitle').innerHTML = '📖 ' + currentBookInfo.name + ' ' + currentChapter + '장';
  const vc = document.getElementById('verseContent');
  vc.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner" style="width:24px;height:24px;"></div><div style="margin-top:12px;">말씀을 불러오는 중...</div></div>';
  try {
    const res = await fetch(`${BIBLE_CDN}/${currentBookInfo.file}`);
    const data = await res.json();
    let bookData = data;
    for (const key of [currentBookInfo.name, currentBookInfo.abbr]) {
      if (data[key] && data[key][currentChapter]) { bookData = data[key]; break; }
    }
    if (bookData && bookData[currentChapter]) {
      const verses = bookData[currentChapter];
      vc.innerHTML = Object.entries(verses).map(([num, text]) => `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #eee5f8;"><div style="font-size:12px;font-weight:700;color:#7c2d7e;min-width:32px;">${num}</div><div style="font-size:${fontSize}px;line-height:1.6;flex:1;">${text}</div></div>`).join('');
    } else {
      vc.innerHTML = `<div style="text-align:center;padding:40px;color:#b91c1c;">📖 ${currentBookInfo.name} ${currentChapter}장 데이터가 없습니다</div>`;
    }
  } catch (e) {
    console.error('성경 로드 오류:', e);
    vc.innerHTML = `<div style="text-align:center;padding:40px;color:#b91c1c;">⚠️ 성경 데이터를 불러올 수 없습니다</div>`;
  }
}


function showBibleList() {
  document.getElementById('bibleListView').style.display = 'block';
  document.getElementById('bibleChapterView').style.display = 'none';
  document.getElementById('bibleVerseView').style.display = 'none';
}


function showChapterView() {
  document.getElementById('bibleChapterView').style.display = 'block';
  document.getElementById('bibleVerseView').style.display = 'none';
}


function prevChapter() { if (currentChapter > 1) loadChapter(currentChapter - 1); else showToast('첫 장입니다'); }
function nextChapter() { if (currentChapter < currentBookInfo.chapters) loadChapter(currentChapter + 1); else showToast('마지막 장입니다'); }
function changeFontSize(d) { fontSize = Math.min(24, Math.max(12, fontSize + d)); if (currentBook) loadChapter(currentChapter); }


// 찬송가 관련 함수들
async function loadHymnTitles() {
  if (hymnTitlesLoaded) return;
  try {
    const res = await fetch('https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/hymn_titles.json');
    if (res.ok) { hymnTitles = await res.json(); }
  } catch (e) { console.error('찬송가 제목 로드 실패:', e); }
  hymnTitlesLoaded = true;
  renderHymnGrid();
}


function renderHymnGrid() {
  const grid = document.getElementById('hymnGrid');
  if (!grid) return;
  let start = 1, end = 645;
  if (currentHymnRange > 0) { start = currentHymnRange; end = Math.min(currentHymnRange + 99, 645); }
  let nums = [];
  for (let i = start; i <= end; i++) nums.push(i);
  if (hymnSearchQuery) {
    const q = hymnSearchQuery.toLowerCase();
    const isNum = /^\d+$/.test(q);
    nums = Array.from({ length: 645 }, (_, i) => i + 1).filter(n => {
      if (isNum) return String(n).startsWith(q);
      return (hymnTitles[String(n)] || '').toLowerCase().includes(q);
    });
  }
  if (nums.length === 0) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:#7a6030;">검색 결과가 없습니다</div>'; return; }
  grid.innerHTML = nums.map(n => {
    const t = hymnTitles[String(n)] || '';
    return `<div class="hymn-grid-btn" onclick="openHymn(${n})"><div class="hymn-grid-num">${n}</div>${t ? `<div class="hymn-grid-title">${t.length > 6 ? t.slice(0, 6) + '…' : t}</div>` : ''}</div>`;
  }).join('');
}


function openHymn(no) {
  currentHymnNo = no;
  const title = hymnTitles[String(no)] || `${no}장`;
  const imgUrl = `https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/no${no}.jpg`;
  document.getElementById('hymnViewTitle').innerHTML = `🎵 ${no}장`;
  document.getElementById('hymnViewLoading').style.display = 'flex';
  document.getElementById('hymnViewImg').style.display = 'none';
  document.getElementById('hymnViewImg').onload = function() {
    document.getElementById('hymnViewLoading').style.display = 'none';
    document.getElementById('hymnViewImg').style.display = 'block';
  };
  document.getElementById('hymnViewImg').onerror = function() {
    document.getElementById('hymnViewLoading').innerHTML = `<div style="text-align:center;"><div style="font-size:64px;">🎵</div><div>${no}장</div><div>${title}</div></div>`;
    document.getElementById('hymnViewImg').style.display = 'none';
  };
  document.getElementById('hymnViewImg').src = imgUrl;
  document.getElementById('hymnListView').style.display = 'none';
  document.getElementById('hymnImageView').style.display = 'block';
}


function closeHymnView() {
  document.getElementById('hymnImageView').style.display = 'none';
  document.getElementById('hymnListView').style.display = 'block';
  document.getElementById('hymnViewImg').src = '';
}


function prevHymnView() { if (currentHymnNo > 1) openHymn(currentHymnNo - 1); else showToast('첫 번째 찬송가입니다'); }
function nextHymnView() { if (currentHymnNo < 645) openHymn(currentHymnNo + 1); else showToast('마지막 찬송가입니다'); }
function setHymnRange(start) { currentHymnRange = start; renderHymnGrid(); }
function filterHymns(q) { hymnSearchQuery = q.trim(); renderHymnGrid(); }
function initHymn() { hymnSearchQuery = ''; setHymnRange(0); loadHymnTitles(); document.getElementById('hymnListView').style.display = 'block'; document.getElementById('hymnImageView').style.display = 'none'; }


function toggleAppendix(key) {
  const el = document.getElementById('app-' + key);
  if (!el) return;
  const isOpen = el.style.display !== 'none';
  ['dokun', 'apostle', 'lords', 'ten'].forEach(k => {
    const e = document.getElementById('app-' + k);
    if (e) e.style.display = 'none';
  });
  if (!isOpen) { el.style.display = 'block'; applyAppendixFont(); }
}


function changeBibleReadingFontSize(delta) {
  bibleReadingFontSize = Math.min(24, Math.max(12, bibleReadingFontSize + delta));
  const content = document.getElementById('bible-reading-content');
  if (content) {
    content.style.fontSize = bibleReadingFontSize + 'px';
  }
}


console.log('✅ js_bible.js 로드 완료');


// ==================== 성경읽기(통독) 폰트 조절 ====================
function changeBibleReadingFontSize(delta) {
  bibleReadingFontSize = Math.min(24, Math.max(12, bibleReadingFontSize + delta));
  
  // 현재 렌더링된 통독 화면에 폰트 크기 적용
  const content = document.getElementById('bible-reading-content');
  if (content) {
    content.style.fontSize = bibleReadingFontSize + 'px';
  }
}
// ==================== 성경 검색 기능 ====================


let searchResults = [];
let currentSearchPage = 1;
const SEARCH_RESULTS_PER_PAGE = 20;


function openBibleSearch() {
  const searchArea = document.getElementById('bibleSearchArea');
  const bibleMain = document.getElementById('bibleMain');
  const bibleScriptureView = document.getElementById('bibleScriptureView');
  
  if (bibleMain) bibleMain.style.display = 'none';
  if (bibleScriptureView) bibleScriptureView.style.display = 'block';
  if (searchArea) {
    searchArea.style.display = 'block';
    document.getElementById('bibleSearchInput').value = '';
    document.getElementById('searchResultArea').style.display = 'none';
  }
}


function closeBibleSearch() {
  const searchArea = document.getElementById('bibleSearchArea');
  const bibleMain = document.getElementById('bibleMain');
  if (searchArea) searchArea.style.display = 'none';
  if (bibleMain) bibleMain.style.display = 'flex';
}


async function searchBible() {
  const keyword = document.getElementById('bibleSearchInput').value.trim();
  if (!keyword || keyword.length < 2) {
    alert('검색어는 2글자 이상 입력하세요');
    return;
  }
  
  const resultArea = document.getElementById('searchResultArea');
  const resultList = document.getElementById('searchResultList');
  resultArea.style.display = 'block';
  resultList.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner"></div><div>검색 중...</div></div>';
  
  searchResults = [];
  const books = getAllBooks();
  const lowerKeyword = keyword.toLowerCase();
  
  for (const book of books) {
    try {
      const bookRef = firebase.database().ref(`bible/${book.name}`);
      const snapshot = await bookRef.once('value');
      if (snapshot.exists()) {
        const chapters = snapshot.val();
        for (const [chapterNum, verses] of Object.entries(chapters)) {
          for (const [verseNum, text] of Object.entries(verses)) {
            if (text && text.toLowerCase().includes(lowerKeyword)) {
              searchResults.push({ book: book.name, chapter: chapterNum, verse: verseNum, text: text });
            }
          }
        }
      }
    } catch(e) { console.warn(book.name, e); }
  }
  
  if (searchResults.length === 0) {
    resultList.innerHTML = `<div style="text-align:center;padding:40px;">🔍 "${escapeHtml(keyword)}" 검색 결과가 없습니다.</div>`;
  } else {
    currentSearchPage = 1;
    displaySearchResults();
  }
}


function displaySearchResults() {
  const resultList = document.getElementById('searchResultList');
  const keyword = document.getElementById('bibleSearchInput').value.trim();
  const start = (currentSearchPage - 1) * SEARCH_RESULTS_PER_PAGE;
  const pageResults = searchResults.slice(start, start + SEARCH_RESULTS_PER_PAGE);
  const totalPages = Math.ceil(searchResults.length / SEARCH_RESULTS_PER_PAGE);
  
  let html = '';
  pageResults.forEach(r => {
    let text = escapeHtml(r.text);
    if (keyword) {
      const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
      text = text.replace(regex, '<mark>$1</mark>');
    }
    html += `<div onclick="goToVerse('${r.book}',${r.chapter},${r.verse})" style="background:#fdf8f0;border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer;border:1px solid #e8dcc8;">
      <div style="font-size:13px;font-weight:700;color:#d4a840;">📖 ${r.book} ${r.chapter}장 ${r.verse}절</div>
      <div style="font-size:14px;line-height:1.6;">${text}</div>
    </div>`;
  });
  
  if (totalPages > 1) {
    html += `<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button onclick="goToSearchPage(${i})" style="background:${currentSearchPage===i?'#d4a840':'#2a1a08'};border:1px solid #d4a840;border-radius:8px;padding:6px 12px;color:${currentSearchPage===i?'#2a1a08':'#d4a840'};cursor:pointer;">${i}</button>`;
    }
    html += `</div>`;
  }
  resultList.innerHTML = html;
}


function goToSearchPage(page) { currentSearchPage = page; displaySearchResults(); }
function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }


async function goToVerse(bookName, chapter, verse) {
  showTab(5);
  setTimeout(async () => {
    await selectBook(bookName);
    await loadChapter(parseInt(chapter));
    setTimeout(() => {
      const els = document.querySelectorAll('#verseContent > div');
      if (els[verse-1]) {
        els[verse-1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        els[verse-1].style.backgroundColor = '#f0d060';
        setTimeout(() => els[verse-1].style.backgroundColor = '', 2000);
      }
    }, 300);
  }, 100);
  closeBibleSearch();
}


// ==================== 성경 탭 초기화 ====================


function initBible() {
  console.log('✅ initBible() 실행 - 성경 탭 초기화');
  
  const bibleMain = document.getElementById('bibleMain');
  if (!bibleMain) {
    console.error('❌ bibleMain 요소 없음');
    return;
  }
  
  // 초기 상태 설정
  bibleMain.style.display = 'flex';
  
  // 성경 관련 뷰 초기화
  const views = ['bibleScriptureView', 'bibleHymnView', 'bibleAppendixView'];
  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
    }
  });
  
  // 찬송가 제목 로드
  loadHymnTitles();
  
  console.log('✅ 성경 탭 초기화 완료');
}


async function loadHymnTitles() {
  if (hymnTitlesLoaded) {
    console.log('⚠️ 찬송가 제목 이미 로드됨');
    return;
  }
  
  try {
    const response = await fetch('https://raw.githubusercontent.com/heeyong-jo/bible-data/main/hymn_titles.json');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    hymnTitles = await response.json();
    hymnTitlesLoaded = true;
    console.log('✅ 찬송가 제목 로드 완료:', Object.keys(hymnTitles).length + '개');
  } catch (error) {
    console.error('❌ 찬송가 제목 로드 실패:', error.message);
    hymnTitlesLoaded = false;
  }
}


console.log('✅ js_bible.js 로드 완료 - initBible() 함수 준비됨');