// ==================== 성경 초기화 ====================
function initBible() {
  const bibleMain = document.getElementById('bibleMain');
  if (bibleMain) bibleMain.style.display = 'flex';
  ['bibleScriptureView', 'bibleHymnView', 'bibleAppendixView'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}


// 성경/찬송가/부록 선택
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


// ==================== 성경책 (구약/신약) ====================
function initBibleBooks() {
  const otDiv = document.getElementById('otBooks');
  const ntDiv = document.getElementById('ntBooks');
  if (!otDiv || otDiv.innerHTML) return;
  const otStyle = 'background:#f0e0c4;border:1.5px solid #c8a060;border-radius:12px;padding:10px 4px;text-align:center;cursor:pointer;';
  const ntStyle = 'background:#f0ddd0;border:1.5px solid #c89080;border-radius:12px;padding:10px 4px;text-align:center;cursor:pointer;';
  otDiv.innerHTML = OT_BOOKS.map(b => `<div style="${otStyle}" onclick="selectBook('${b.name}')"><div style="font-size:15px;font-weight:800;color:#7a4010;">${b.abbr}</div><div style="font-size:9px;color:#8a5a2a;">${b.name.slice(0,4)}</div><div style="font-size:8px;color:#b89060;">${b.chapters}장</div></div>`).join('');
  ntDiv.innerHTML = NT_BOOKS.map(b => `<div style="${ntStyle}" onclick="selectBook('${b.name}')"><div style="font-size:15px;font-weight:800;color:#8a2a10;">${b.abbr}</div><div style="font-size:9px;color:#8a5a2a;">${b.name.slice(0,4)}</div><div style="font-size:8px;color:#b89060;">${b.chapters}장</div></div>`).join('');
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
  if (!currentBookInfo) {
    showToast('책 정보가 없습니다. 다시 선택해주세요.');
    showBibleList();
    return;
  }
  currentChapter = chapter;
  document.getElementById('bibleChapterView').style.display = 'none';
  document.getElementById('bibleVerseView').style.display = 'block';
  document.getElementById('verseTitle').innerHTML = '📖 ' + currentBookInfo.name + ' ' + currentChapter + '장';
  const vc = document.getElementById('verseContent');
  vc.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner" style="width:24px;height:24px;"></div><div style="margin-top:12px;">말씀을 불러오는 중...</div></div>';
  try {
    const res = await fetch(`${BIBLE_CDN}/${currentBookInfo.file}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
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
    console.error('성경 데이터 로드 실패:', e);
    vc.innerHTML = `<div style="text-align:center;padding:40px;color:#b91c1c;">⚠️ 성경 데이터를 불러올 수 없습니다<br><span style="font-size:12px;">네트워크 연결을 확인해주세요</span><div style="margin-top:20px;"><button onclick="showChapterView()" style="padding:8px 16px;background:#f5e8d0;border:1px solid #c8a060;border-radius:20px;cursor:pointer;">← 돌아가기</button></div></div>`;
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


function prevChapter() {
  if (currentChapter > 1) loadChapter(currentChapter - 1);
  else showToast('첫 장입니다');
}


function nextChapter() {
  if (currentChapter < currentBookInfo.chapters) loadChapter(currentChapter + 1);
  else showToast('마지막 장입니다');
}


function changeFontSize(d) {
  fontSize = Math.min(24, Math.max(12, fontSize + d));
  if (currentBook) loadChapter(currentChapter);
}


// ==================== 찬송가 ====================
async function loadHymnTitles() {
  if (hymnTitlesLoaded) return;
  try {
    const res = await fetch('https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data/hymn_titles.json');
    if (res.ok) {
      hymnTitles = await res.json();
      console.log('찬송가 제목 로드 성공');
    }
  } catch (e) {
    console.error('찬송가 제목 로드 실패:', e);
  }
  hymnTitlesLoaded = true;
  renderHymnGrid();
}


function renderHymnGrid() {
  const grid = document.getElementById('hymnGrid');
  if (!grid) return;
  let start = 1, end = 645;
  if (currentHymnRange > 0) {
    start = currentHymnRange;
    end = Math.min(currentHymnRange + 99, 645);
  }
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
  if (nums.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:#7a6030;">검색 결과가 없습니다</div>';
    return;
  }
  grid.innerHTML = nums.map(n => {
    const t = hymnTitles[String(n)] || '';
    const st = t.length > 6 ? t.slice(0, 6) + '…' : t;
    return `<div class="hymn-grid-btn" onclick="openHymn(${n})">
      <div class="hymn-grid-num">${n}</div>
      ${st ? `<div class="hymn-grid-title">${st}</div>` : ''}
    </div>`;
  }).join('');
}


function openHymn(no) {
  try {
    currentHymnNo = no;
    const title = hymnTitles[String(no)] || `${no}장`;
    const imgUrl = `https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data/no${no}.jpg`;
    const viewTitle = document.getElementById('hymnViewTitle');
    const imgElement = document.getElementById('hymnViewImg');
    const loadingDiv = document.getElementById('hymnViewLoading');
    const hymnImageView = document.getElementById('hymnImageView');
    const hymnListView = document.getElementById('hymnListView');
    if (!viewTitle || !imgElement || !loadingDiv || !hymnImageView || !hymnListView) {
      showToast('뷰어 초기화 실패');
      return;
    }
    viewTitle.innerHTML = `🎵 ${no}장`;
    loadingDiv.style.display = 'flex';
    loadingDiv.innerHTML = `<div class="splash-spinner" style="width:48px;height:48px;margin:0 auto 20px;"></div><div>이미지를 불러오는 중입니다...</div><div style="font-size:12px; margin-top:10px;">${no}장 ${title}</div>`;
    imgElement.style.display = 'none';
    imgElement.onload = function() {
      loadingDiv.style.display = 'none';
      imgElement.style.display = 'block';
    };
    imgElement.onerror = function() {
      loadingDiv.innerHTML = `<div style="text-align:center;"><div style="font-size:64px; margin-bottom:20px;">🎵</div><div style="font-size:24px; font-weight:700; margin-bottom:10px;">${no}장</div><div style="font-size:16px; margin-bottom:15px;">${title}</div><div style="font-size:14px; color:#a08040;">이미지를 불러올 수 없습니다</div><div style="font-size:11px; margin-top:10px;">※ 이미지 파일이 없는 찬송가입니다</div><div style="font-size:10px; margin-top:8px;">URL: ${imgUrl}</div></div>`;
      imgElement.style.display = 'none';
    };
    imgElement.src = imgUrl;
    updateHymnNavButtons();
    hymnListView.style.display = 'none';
    hymnImageView.style.display = 'block';
  } catch (e) {
    console.error('openHymn 오류:', e);
    showToast('찬송가를 여는 중 오류 발생');
  }
}


function prevHymnView() {
  if (currentHymnNo > 1) openHymn(currentHymnNo - 1);
  else showToast('첫 번째 찬송가입니다');
}


function nextHymnView() {
  if (currentHymnNo < 645) openHymn(currentHymnNo + 1);
  else showToast('마지막 찬송가입니다 (645장)');
}


function updateHymnNavButtons() {
  const prevBtn = document.getElementById('hymnPrevBtn');
  const nextBtn = document.getElementById('hymnNextBtn');
  if (prevBtn) {
    prevBtn.style.opacity = currentHymnNo <= 1 ? '0.4' : '1';
    prevBtn.disabled = currentHymnNo <= 1;
  }
  if (nextBtn) {
    nextBtn.style.opacity = currentHymnNo >= 645 ? '0.4' : '1';
    nextBtn.disabled = currentHymnNo >= 645;
  }
}


function closeHymnView() {
  const hymnImageView = document.getElementById('hymnImageView');
  const hymnListView = document.getElementById('hymnListView');
  const imgElement = document.getElementById('hymnViewImg');
  if (hymnImageView) hymnImageView.style.display = 'none';
  if (hymnListView) hymnListView.style.display = 'block';
  if (imgElement) imgElement.src = '';
}


function setHymnRange(start, doRender) {
  currentHymnRange = start;
  const tabs = document.querySelectorAll('.hymn-range-tab');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    tab.style.background = '#d4a840';
    tab.style.color = '#2a1a08';
  });
  let activeTabId = 'hymnTab0';
  if (start === 1) activeTabId = 'hymnTab1';
  else if (start === 101) activeTabId = 'hymnTab101';
  else if (start === 201) activeTabId = 'hymnTab201';
  else if (start === 301) activeTabId = 'hymnTab301';
  else if (start === 401) activeTabId = 'hymnTab401';
  else if (start === 501) activeTabId = 'hymnTab501';
  else if (start === 601) activeTabId = 'hymnTab601';
  const activeTab = document.getElementById(activeTabId);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.style.background = '#f0d060';
    activeTab.style.color = '#1a1008';
  }
  if (doRender !== false) renderHymnGrid();
}


function filterHymns(q) {
  hymnSearchQuery = q.trim();
  renderHymnGrid();
}


function initHymn() {
  hymnSearchQuery = '';
  const searchInput = document.getElementById('hymnSearchInput');
  if (searchInput) searchInput.value = '';
  setHymnRange(0, false);
  renderHymnGrid();
  loadHymnTitles();
  const hymnListView = document.getElementById('hymnListView');
  const hymnImageView = document.getElementById('hymnImageView');
  if (hymnListView) hymnListView.style.display = 'block';
  if (hymnImageView) hymnImageView.style.display = 'none';
}


// ==================== 부록 (교독문, 사도신경, 주기도문, 십계명) ====================
function toggleAppendix(key) {
  const el = document.getElementById('app-' + key);
  if (!el) return;
  const isOpen = el.style.display !== 'none';
  ['dokun', 'apostle', 'lords', 'ten'].forEach(k => {
    const e = document.getElementById('app-' + k);
    if (e) e.style.display = 'none';
  });
  if (!isOpen) el.style.display = 'block';
  applyAppendixFont();
}


function changeAppendixFont(d) {
  appendixFontSize = Math.min(22, Math.max(11, appendixFontSize + d));
  applyAppendixFont();
}


function applyAppendixFont() {
  ['app-dokun', 'app-apostle', 'app-lords', 'app-ten'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const inner = el.querySelector('div');
    if (inner) inner.style.fontSize = appendixFontSize + 'px';
  });
}