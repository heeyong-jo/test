// ==================== 성경 초기화 (js_bible.js) ====================
// 최종 수정본 - 성경책 탭 내부 클릭 정상 작동


window.bibleReadingFontSize = window.bibleReadingFontSize || 15;
window.appendixFontSize = window.appendixFontSize || 14;
window.fontSize = window.fontSize || 15;
window.currentBook = window.currentBook || null;
window.currentBookInfo = window.currentBookInfo || null;
window.currentChapter = window.currentChapter || 1;
window.currentBibleSection = window.currentBibleSection || null;


window.hymnTitles = window.hymnTitles || {};
window.hymnTitlesLoaded = window.hymnTitlesLoaded || false;
window.currentHymnNo = window.currentHymnNo || 1;
window.currentHymnRange = window.currentHymnRange || 0;
window.hymnSearchQuery = window.hymnSearchQuery || '';


// ==================== 부록 폰트 ====================
function applyAppendixFont() {
  const ids = ['app-dokun', 'app-apostle', 'app-lords', 'app-ten'];
  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);
    if (el) el.style.fontSize = window.appendixFontSize + 'px';
  }
}


function changeAppendixFont(delta) {
  window.appendixFontSize = Math.min(22, Math.max(11, window.appendixFontSize + delta));
  applyAppendixFont();
}


// ==================== 성경/찬송가/부록 선택 ====================
function openBibleSection(section) {
  window.currentBibleSection = section;
  const bibleMain = document.getElementById('bibleMain');
  if (bibleMain) bibleMain.style.display = 'none';
  
  if (section === 'scripture') {
    const view = document.getElementById('bibleScriptureView');
    if (view) view.style.display = 'block';
    initBibleBooks();
  } else if (section === 'hymn') {
    const view = document.getElementById('bibleHymnView');
    if (view) view.style.display = 'block';
    initHymn();
  } else if (section === 'appendix') {
    const view = document.getElementById('bibleAppendixView');
    if (view) view.style.display = 'block';
  }
}


function closeBibleSection() {
  window.currentBibleSection = null;
  const views = ['bibleScriptureView', 'bibleHymnView', 'bibleAppendixView'];
  for (let i = 0; i < views.length; i++) {
    const el = document.getElementById(views[i]);
    if (el) el.style.display = 'none';
  }
  const bibleMain = document.getElementById('bibleMain');
  if (bibleMain) bibleMain.style.display = 'flex';
}


// ==================== 성경 책 목록 ====================
function initBibleBooks() {
  console.log('initBibleBooks 실행');
  
  if (typeof window.OT_BOOKS === 'undefined' || typeof window.NT_BOOKS === 'undefined') {
    console.error('OT_BOOKS 또는 NT_BOOKS가 정의되지 않음');
    return;
  }
  
  const otDiv = document.getElementById('otBooks');
  const ntDiv = document.getElementById('ntBooks');
  if (!otDiv || !ntDiv) {
    console.error('otBooks 또는 ntBooks 요소 없음');
    return;
  }
  
  if (otDiv.innerHTML && otDiv.innerHTML.includes('창')) {
    console.log('이미 성경 책 목록이 렌더링됨');
    return;
  }
  
  const otStyle = 'background:#fffaf0;border:1.5px solid #c8b896;border-radius:12px;padding:10px 4px;text-align:center;cursor:pointer;';
  const ntStyle = 'background:#fffaf0;border:1.5px solid #c8b896;border-radius:12px;padding:10px 4px;text-align:center;cursor:pointer;';
  
  let otHtml = '';
  for (let i = 0; i < window.OT_BOOKS.length; i++) {
    const b = window.OT_BOOKS[i];
    otHtml += '<div style="' + otStyle + '" onclick="selectBook(\'' + b.name + '\')">' +
      '<div style="font-size:15px;font-weight:800;color:#6b4f2e;">' + b.abbr + '</div>' +
      '<div style="font-size:9px;color:#8a6e4e;">' + b.name.slice(0,4) + '</div>' +
      '<div style="font-size:8px;color:#b8956e;">' + b.chapters + '장</div>' +
    '</div>';
  }
  otDiv.innerHTML = otHtml;
  
  let ntHtml = '';
  for (let i = 0; i < window.NT_BOOKS.length; i++) {
    const b = window.NT_BOOKS[i];
    ntHtml += '<div style="' + ntStyle + '" onclick="selectBook(\'' + b.name + '\')">' +
      '<div style="font-size:15px;font-weight:800;color:#6b4f2e;">' + b.abbr + '</div>' +
      '<div style="font-size:9px;color:#8a6e4e;">' + b.name.slice(0,4) + '</div>' +
      '<div style="font-size:8px;color:#b8956e;">' + b.chapters + '장</div>' +
    '</div>';
  }
  ntDiv.innerHTML = ntHtml;
  
  console.log('✅ 성경 책 목록 렌더링 완료');
}


// ==================== 책 선택 ====================
async function selectBook(bookName) {
  console.log('selectBook 실행:', bookName);
  
  if (typeof window.OT_BOOKS === 'undefined' || typeof window.NT_BOOKS === 'undefined') {
    console.error('성경 데이터 없음');
    if (typeof showToast === 'function') showToast('성경 데이터를 불러올 수 없습니다');
    return;
  }
  
  window.currentBookInfo = window.OT_BOOKS.find(b => b.name === bookName) || window.NT_BOOKS.find(b => b.name === bookName);
  if (!window.currentBookInfo) {
    console.error('책 정보 없음:', bookName);
    return;
  }
  
  window.currentBook = bookName;
  window.currentChapter = 1;
  
  const bibleListView = document.getElementById('bibleListView');
  const bibleChapterView = document.getElementById('bibleChapterView');
  const selectedBookTitle = document.getElementById('selectedBookTitle');
  const chapterButtons = document.getElementById('chapterButtons');
  
  if (bibleListView) bibleListView.style.display = 'none';
  if (bibleChapterView) bibleChapterView.style.display = 'block';
  if (selectedBookTitle) selectedBookTitle.innerHTML = '📖 ' + window.currentBookInfo.name;
  
  if (chapterButtons) {
    let html = '';
    for (let i = 1; i <= window.currentBookInfo.chapters; i++) {
      html += '<button onclick="loadChapter(' + i + ')" style="width:48px;height:48px;border-radius:14px;background:#f4f1f8;border:1.5px solid #ddd0f0;font-size:14px;font-weight:600;cursor:pointer;">' + i + '</button>';
    }
    chapterButtons.innerHTML = html;
  }
}


// ==================== 장 로드 ====================
async function loadChapter(chapter) {
  console.log('loadChapter 실행:', chapter);
  
  if (!window.currentBookInfo) {
    if (typeof showToast === 'function') showToast('책 정보가 없습니다.');
    showBibleList();
    return;
  }
  
  window.currentChapter = chapter;
  
  const bibleChapterView = document.getElementById('bibleChapterView');
  const bibleVerseView = document.getElementById('bibleVerseView');
  const verseTitle = document.getElementById('verseTitle');
  const verseContent = document.getElementById('verseContent');
  
  if (bibleChapterView) bibleChapterView.style.display = 'none';
  if (bibleVerseView) bibleVerseView.style.display = 'block';
  if (verseTitle) verseTitle.innerHTML = '📖 ' + window.currentBookInfo.name + ' ' + window.currentChapter + '장';
  if (verseContent) {
    verseContent.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner" style="width:24px;height:24px;"></div><div style="margin-top:12px;">말씀을 불러오는 중...</div></div>';
  }
  
  try {
    const url = (window.BIBLE_CDN || 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main') + '/' + window.currentBookInfo.file;
    console.log('성경 데이터 로드:', url);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    
    const data = await res.json();
    let bookData = data;
    
    const keys = [window.currentBookInfo.name, window.currentBookInfo.abbr];
    for (let i = 0; i < keys.length; i++) {
      if (data[keys[i]] && data[keys[i]][window.currentChapter]) {
        bookData = data[keys[i]];
        break;
      }
    }
    
    if (verseContent) {
      if (bookData && bookData[window.currentChapter]) {
        const verses = bookData[window.currentChapter];
        let html = '';
        const verseNumbers = Object.keys(verses);
        for (let i = 0; i < verseNumbers.length; i++) {
          const num = verseNumbers[i];
          const text = verses[num];
          html += '<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #eee5f8;">' +
            '<div style="font-size:12px;font-weight:700;color:#7c2d7e;min-width:32px;">' + num + '</div>' +
            '<div style="font-size:' + window.fontSize + 'px;line-height:1.6;flex:1;">' + escapeHtml(text) + '</div>' +
          '</div>';
        }
        verseContent.innerHTML = html;
      } else {
        verseContent.innerHTML = '<div style="text-align:center;padding:40px;color:#b91c1c;">📖 ' + window.currentBookInfo.name + ' ' + window.currentChapter + '장 데이터가 없습니다</div>';
      }
    }
  } catch (e) {
    console.error('성경 로드 오류:', e);
    if (verseContent) {
      verseContent.innerHTML = '<div style="text-align:center;padding:40px;color:#b91c1c;">⚠️ 성경 데이터를 불러올 수 없습니다<br>' + e.message + '</div>';
    }
  }
}


function showBibleList() {
  const bibleListView = document.getElementById('bibleListView');
  const bibleChapterView = document.getElementById('bibleChapterView');
  const bibleVerseView = document.getElementById('bibleVerseView');
  
  if (bibleListView) bibleListView.style.display = 'block';
  if (bibleChapterView) bibleChapterView.style.display = 'none';
  if (bibleVerseView) bibleVerseView.style.display = 'none';
}


function showChapterView() {
  const bibleChapterView = document.getElementById('bibleChapterView');
  const bibleVerseView = document.getElementById('bibleVerseView');
  
  if (bibleChapterView) bibleChapterView.style.display = 'block';
  if (bibleVerseView) bibleVerseView.style.display = 'none';
}


function prevChapter() {
  if (window.currentChapter > 1) {
    loadChapter(window.currentChapter - 1);
  } else {
    if (typeof showToast === 'function') showToast('첫 장입니다');
  }
}


function nextChapter() {
  if (window.currentChapter < window.currentBookInfo.chapters) {
    loadChapter(window.currentChapter + 1);
  } else {
    if (typeof showToast === 'function') showToast('마지막 장입니다');
  }
}


function changeFontSize(d) {
  window.fontSize = Math.min(24, Math.max(12, window.fontSize + d));
  if (window.currentBook) loadChapter(window.currentChapter);
}


// ==================== 찬송가 관련 함수 ====================
async function loadHymnTitles() {
  if (window.hymnTitlesLoaded) return;
  
  try {
    const response = await fetch('https://raw.githubusercontent.com/heeyong-jo/bible-data/main/hymn_titles.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    window.hymnTitles = await response.json();
    window.hymnTitlesLoaded = true;
    console.log('✅ 찬송가 제목 로드 완료:', Object.keys(window.hymnTitles).length + '개');
  } catch (error) {
    console.error('❌ 찬송가 제목 로드 실패:', error.message);
    window.hymnTitlesLoaded = false;
  }
  
  renderHymnGrid();
}


function renderHymnGrid() {
  const grid = document.getElementById('hymnGrid');
  if (!grid) return;
  
  let start = 1, end = 645;
  if (window.currentHymnRange > 0) {
    start = window.currentHymnRange;
    end = Math.min(window.currentHymnRange + 99, 645);
  }
  
  let nums = [];
  for (let i = start; i <= end; i++) nums.push(i);
  
  if (window.hymnSearchQuery) {
    const q = window.hymnSearchQuery.toLowerCase();
    const isNum = /^\d+$/.test(q);
    nums = [];
    for (let i = 1; i <= 645; i++) {
      let match = false;
      if (isNum) {
        match = String(i).startsWith(q);
      } else {
        match = (window.hymnTitles[String(i)] || '').toLowerCase().includes(q);
      }
      if (match) nums.push(i);
    }
  }
  
  if (nums.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:#7a6030;">검색 결과가 없습니다</div>';
    return;
  }
  
  let html = '';
  for (let i = 0; i < nums.length; i++) {
    const n = nums[i];
    const t = window.hymnTitles[String(n)] || '';
    html += '<div class="hymn-grid-btn" onclick="openHymn(' + n + ')">' +
      '<div class="hymn-grid-num">' + n + '</div>' +
      (t ? '<div class="hymn-grid-title">' + (t.length > 6 ? t.slice(0, 6) + '…' : t) + '</div>' : '') +
    '</div>';
  }
  grid.innerHTML = html;
}


function openHymn(no) {
  window.currentHymnNo = no;
  const title = window.hymnTitles[String(no)] || no + '장';
  const imgUrl = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/no' + no + '.jpg';
  
  let modal = document.getElementById('hymn-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'hymn-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    
    const img = document.createElement('img');
    img.id = 'hymn-modal-img';
    img.style.cssText = 'max-width:90%;max-height:80%;object-fit:contain;';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ 닫기';
    closeBtn.style.cssText = 'margin-top:20px;padding:10px 20px;background:#d4a840;border:none;border-radius:30px;color:#2a1a08;font-weight:700;cursor:pointer;';
    closeBtn.onclick = function() { modal.style.display = 'none'; };
    
    const navDiv = document.createElement('div');
    navDiv.style.cssText = 'margin-top:15px;display:flex;gap:15px;';
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀ 이전';
    prevBtn.style.cssText = 'padding:8px 16px;background:#2a1a08;border:1px solid #d4a840;border-radius:30px;color:#d4a840;cursor:pointer;';
    prevBtn.onclick = function() { openHymn(window.currentHymnNo - 1); };
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '다음 ▶';
    nextBtn.style.cssText = 'padding:8px 16px;background:#2a1a08;border:1px solid #d4a840;border-radius:30px;color:#d4a840;cursor:pointer;';
    nextBtn.onclick = function() { openHymn(window.currentHymnNo + 1); };
    
    navDiv.appendChild(prevBtn);
    navDiv.appendChild(nextBtn);
    modal.appendChild(img);
    modal.appendChild(closeBtn);
    modal.appendChild(navDiv);
    document.body.appendChild(modal);
  }
  
  const modalImg = document.getElementById('hymn-modal-img');
  if (modalImg) {
    modalImg.src = imgUrl;
    modalImg.alt = no + '장 ' + title;
    modalImg.onerror = function() {
      modalImg.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27300%27%3E%3Crect width=%27200%27 height=%27300%27 fill=%27%23333%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 fill=%27%23d4a840%27%3E🎵%20' + no + '%20장%3C/text%3E%3C/svg%3E';
    };
  }
  
  modal.style.display = 'flex';
}


function closeHymnView() {
  const modal = document.getElementById('hymn-modal');
  if (modal) modal.style.display = 'none';
}


function prevHymnView() {
  if (window.currentHymnNo > 1) openHymn(window.currentHymnNo - 1);
}


function nextHymnView() {
  if (window.currentHymnNo < 645) openHymn(window.currentHymnNo + 1);
}


function setHymnRange(start) {
  window.currentHymnRange = start;
  renderHymnGrid();
}


function filterHymns(q) {
  window.hymnSearchQuery = q.trim();
  renderHymnGrid();
}


function initHymn() {
  window.hymnSearchQuery = '';
  window.currentHymnRange = 0;
  loadHymnTitles();
  
  const hymnListView = document.getElementById('hymnListView');
  if (hymnListView) hymnListView.style.display = 'block';
}


function toggleAppendix(key) {
  const el = document.getElementById('app-' + key);
  if (!el) return;
  
  const isOpen = el.style.display !== 'none';
  const keys = ['dokun', 'apostle', 'lords', 'ten'];
  for (let i = 0; i < keys.length; i++) {
    const e = document.getElementById('app-' + keys[i]);
    if (e) e.style.display = 'none';
  }
  
  if (!isOpen) {
    el.style.display = 'block';
    applyAppendixFont();
  }
}


// ==================== 성경읽기 폰트 조절 ====================
function changeBibleReadingFontSize(delta) {
  window.bibleReadingFontSize = Math.min(24, Math.max(12, window.bibleReadingFontSize + delta));
  const content = document.getElementById('bible-reading-content');
  if (content) content.style.fontSize = window.bibleReadingFontSize + 'px';
}


// ==================== 성경 검색 기능 ====================
window.searchResults = window.searchResults || [];
window.currentSearchPage = window.currentSearchPage || 1;
window.SEARCH_RESULTS_PER_PAGE = window.SEARCH_RESULTS_PER_PAGE || 20;


function openBibleSearch() {
  const searchArea = document.getElementById('bibleSearchArea');
  const bibleMain = document.getElementById('bibleMain');
  const bibleScriptureView = document.getElementById('bibleScriptureView');
  
  if (bibleMain) bibleMain.style.display = 'none';
  if (bibleScriptureView) bibleScriptureView.style.display = 'block';
  if (searchArea) {
    searchArea.style.display = 'block';
    const searchInput = document.getElementById('bibleSearchInput');
    if (searchInput) searchInput.value = '';
    const resultArea = document.getElementById('searchResultArea');
    if (resultArea) resultArea.style.display = 'none';
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
  if (resultArea) resultArea.style.display = 'block';
  if (resultList) {
    resultList.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner"></div><div>검색 중...</div></div>';
  }
  
  window.searchResults = [];
  
  const books = [];
  if (typeof window.OT_BOOKS !== 'undefined') {
    for (let i = 0; i < window.OT_BOOKS.length; i++) books.push(window.OT_BOOKS[i]);
  }
  if (typeof window.NT_BOOKS !== 'undefined') {
    for (let i = 0; i < window.NT_BOOKS.length; i++) books.push(window.NT_BOOKS[i]);
  }
  
  const lowerKeyword = keyword.toLowerCase();
  
  for (let b = 0; b < books.length; b++) {
    const book = books[b];
    try {
      const url = (window.BIBLE_CDN || 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main') + '/' + book.file;
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      const bookData = data[book.name] || data[book.abbr];
      
      if (bookData) {
        const chapters = Object.keys(bookData);
        for (let c = 0; c < chapters.length; c++) {
          const chapterNum = chapters[c];
          const verses = bookData[chapterNum];
          const verseNums = Object.keys(verses);
          for (let v = 0; v < verseNums.length; v++) {
            const verseNum = verseNums[v];
            const text = verses[verseNum];
            if (text && text.toLowerCase().includes(lowerKeyword)) {
              window.searchResults.push({
                book: book.name,
                chapter: parseInt(chapterNum),
                verse: parseInt(verseNum),
                text: text
              });
            }
          }
        }
      }
    } catch(e) {
      console.warn(book.name + ' 검색 실패:', e);
    }
  }
  
  if (resultList) {
    if (window.searchResults.length === 0) {
      resultList.innerHTML = '<div style="text-align:center;padding:40px;">🔍 "' + escapeHtml(keyword) + '" 검색 결과가 없습니다.</div>';
    } else {
      window.currentSearchPage = 1;
      displaySearchResults();
    }
  }
}


function displaySearchResults() {
  const resultList = document.getElementById('searchResultList');
  const keyword = document.getElementById('bibleSearchInput').value.trim();
  if (!resultList) return;
  
  const start = (window.currentSearchPage - 1) * window.SEARCH_RESULTS_PER_PAGE;
  const pageResults = window.searchResults.slice(start, start + window.SEARCH_RESULTS_PER_PAGE);
  const totalPages = Math.ceil(window.searchResults.length / window.SEARCH_RESULTS_PER_PAGE);
  
  let html = '';
  for (let i = 0; i < pageResults.length; i++) {
    const r = pageResults[i];
    let text = escapeHtml(r.text);
    if (keyword) {
      const regex = new RegExp('(' + escapeRegex(keyword) + ')', 'gi');
      text = text.replace(regex, '<mark>$1</mark>');
    }
    html += '<div onclick="goToVerse(\'' + r.book + '\',' + r.chapter + ',' + r.verse + ')" style="background:#fdf8f0;border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer;border:1px solid #e8dcc8;">' +
      '<div style="font-size:13px;font-weight:700;color:#d4a840;">📖 ' + r.book + ' ' + r.chapter + '장 ' + r.verse + '절</div>' +
      '<div style="font-size:14px;line-height:1.6;">' + text + '</div>' +
    '</div>';
  }
  
  if (totalPages > 1) {
    html += '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
    for (let i = 1; i <= totalPages; i++) {
      html += '<button onclick="goToSearchPage(' + i + ')" style="background:' + (window.currentSearchPage === i ? '#d4a840' : '#2a1a08') + ';border:1px solid #d4a840;border-radius:8px;padding:6px 12px;color:' + (window.currentSearchPage === i ? '#2a1a08' : '#d4a840') + ';cursor:pointer;">' + i + '</button>';
    }
    html += '</div>';
  }
  resultList.innerHTML = html;
}


function goToSearchPage(page) {
  window.currentSearchPage = page;
  displaySearchResults();
}


function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


async function goToVerse(bookName, chapter, verse) {
  if (typeof showTab === 'function') showTab(5);
  
  setTimeout(async function() {
    await selectBook(bookName);
    await loadChapter(chapter);
    setTimeout(function() {
      const els = document.querySelectorAll('#verseContent > div');
      if (els[verse - 1]) {
        els[verse - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        els[verse - 1].style.backgroundColor = '#f0d060';
        setTimeout(function() {
          if (els[verse - 1]) els[verse - 1].style.backgroundColor = '';
        }, 2000);
      }
    }, 300);
  }, 100);
  
  closeBibleSearch();
}


// ==================== 성경 탭 초기화 (가장 중요!) ====================
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
  for (let i = 0; i < views.length; i++) {
    const el = document.getElementById(views[i]);
    if (el) {
      el.style.display = 'none';
    }
  }
  
  // 성경 책 목록 초기화
  initBibleBooks();
  
  // 찬송가 제목 로드
  loadHymnTitles();
  
  console.log('✅ 성경 탭 초기화 완료');
}


// ==================== 함수 전역 등록 ====================
window.initBible = initBible;
window.openBibleSection = openBibleSection;
window.closeBibleSection = closeBibleSection;
window.initBibleBooks = initBibleBooks;
window.selectBook = selectBook;
window.loadChapter = loadChapter;
window.showBibleList = showBibleList;
window.showChapterView = showChapterView;
window.prevChapter = prevChapter;
window.nextChapter = nextChapter;
window.changeFontSize = changeFontSize;
window.changeAppendixFont = changeAppendixFont;
window.applyAppendixFont = applyAppendixFont;
window.toggleAppendix = toggleAppendix;
window.changeBibleReadingFontSize = changeBibleReadingFontSize;
window.openBibleSearch = openBibleSearch;
window.closeBibleSearch = closeBibleSearch;
window.searchBible = searchBible;
window.goToSearchPage = goToSearchPage;
window.goToVerse = goToVerse;
window.loadHymnTitles = loadHymnTitles;
window.initHymn = initHymn;
window.openHymn = openHymn;
window.closeHymnView = closeHymnView;
window.prevHymnView = prevHymnView;
window.nextHymnView = nextHymnView;
window.setHymnRange = setHymnRange;
window.filterHymns = filterHymns;
window.selectHymn = openHymn;
window.showHymnDetail = openHymn;


console.log('✅ js_bible.js 로드 완료 - 모든 함수 전역 등록됨');