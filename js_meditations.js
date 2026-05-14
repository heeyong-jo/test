// ==================== 오늘의 말씀 (말씀 등록) ====================


let verseStep = 'book';
let selectedBook = null;
let selectedChapter = null;
let selectedFromVerse = null;
let selectedToVerse = null;


// 말씀 선택 모달 열기
function openVerseSelector() {
  verseStep = 'book';
  selectedBook = null;
  selectedChapter = null;
  selectedFromVerse = null;
  selectedToVerse = null;
  
  document.getElementById('vstep-book').style.display = 'block';
  document.getElementById('vstep-chapter').style.display = 'none';
  document.getElementById('vstep-verse').style.display = 'none';
  
  document.getElementById('vstep1').style.background = 'var(--purple)';
  document.getElementById('vstep1').style.color = 'white';
  document.getElementById('vstep2').style.background = 'var(--bg2)';
  document.getElementById('vstep2').style.color = 'var(--text2)';
  document.getElementById('vstep3').style.background = 'var(--bg2)';
  document.getElementById('vstep3').style.color = 'var(--text2)';
  
  // 구약/신약 책 목록 렌더링
  const otDiv = document.getElementById('vs-ot-books');
  const ntDiv = document.getElementById('vs-nt-books');
  
  if (otDiv && !otDiv.innerHTML) {
    otDiv.innerHTML = OT_BOOKS.map(book => 
      `<button onclick="selectVerseBook('${book.name}')" style="padding:8px;background:#f4f1f8;border:1px solid #ddd0f0;border-radius:8px;font-size:12px;cursor:pointer;">${book.name}</button>`
    ).join('');
    ntDiv.innerHTML = NT_BOOKS.map(book => 
      `<button onclick="selectVerseBook('${book.name}')" style="padding:8px;background:#f4f1f8;border:1px solid #ddd0f0;border-radius:8px;font-size:12px;cursor:pointer;">${book.name}</button>`
    ).join('');
  }
  
  document.getElementById('modal-verse-selector').style.display = 'flex';
}


function closeVerseSelector() {
  document.getElementById('modal-verse-selector').style.display = 'none';
}


function selectVerseBook(bookName) {
  selectedBook = OT_BOOKS.find(b => b.name === bookName) || NT_BOOKS.find(b => b.name === bookName);
  if (!selectedBook) return;
  
  verseStep = 'chapter';
  document.getElementById('vstep-book').style.display = 'none';
  document.getElementById('vstep-chapter').style.display = 'block';
  document.getElementById('vs-book-selected').innerHTML = `📖 ${selectedBook.name}`;
  
  document.getElementById('vstep1').style.background = 'var(--bg2)';
  document.getElementById('vstep1').style.color = 'var(--text2)';
  document.getElementById('vstep2').style.background = 'var(--purple)';
  document.getElementById('vstep2').style.color = 'white';
  
  const chaptersDiv = document.getElementById('vs-chapters');
  let html = '';
  for (let i = 1; i <= selectedBook.chapters; i++) {
    html += `<button onclick="selectVerseChapter(${i})" style="width:50px;height:50px;border-radius:10px;background:#f4f1f8;border:1px solid #ddd0f0;font-size:14px;font-weight:600;cursor:pointer;">${i}</button>`;
  }
  chaptersDiv.innerHTML = html;
}


function selectVerseChapter(chapter) {
  selectedChapter = chapter;
  verseStep = 'verse';
  document.getElementById('vstep-chapter').style.display = 'none';
  document.getElementById('vstep-verse').style.display = 'block';
  document.getElementById('vs-chapter-selected').innerHTML = `📖 ${selectedBook.name} ${selectedChapter}장`;
  
  document.getElementById('vstep2').style.background = 'var(--bg2)';
  document.getElementById('vstep2').style.color = 'var(--text2)';
  document.getElementById('vstep3').style.background = 'var(--purple)';
  document.getElementById('vstep3').style.color = 'white';
  
  // 절 범위 선택 드롭다운 생성
  const fromSelect = document.getElementById('vs-from');
  const toSelect = document.getElementById('vs-to');
  
  // 최대 절 수 가져오기 (임시로 150으로 설정, 실제로는 API 호출 필요)
  let maxVerses = 150;
  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';
  for (let i = 1; i <= maxVerses; i++) {
    fromSelect.innerHTML += `<option value="${i}">${i}절</option>`;
    toSelect.innerHTML += `<option value="${i}">${i}절</option>`;
  }
  fromSelect.value = 1;
  toSelect.value = Math.min(10, maxVerses);
  
  fromSelect.onchange = () => updateVersePreview();
  toSelect.onchange = () => updateVersePreview();
  updateVersePreview();
}


async function updateVersePreview() {
  const from = parseInt(document.getElementById('vs-from').value);
  const to = parseInt(document.getElementById('vs-to').value);
  selectedFromVerse = from;
  selectedToVerse = to;
  
  const previewDiv = document.getElementById('vs-preview');
  previewDiv.innerHTML = '<div style="text-align:center;">말씀을 불러오는 중...</div>';
  
  try {
    const res = await fetch(`${BIBLE_CDN}/${selectedBook.file}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    let bookData = data;
    for (const key of [selectedBook.name, selectedBook.abbr]) {
      if (data[key] && data[key][selectedChapter]) { bookData = data[key]; break; }
    }
    
    if (bookData && bookData[selectedChapter]) {
      const verses = bookData[selectedChapter];
      let html = '';
      for (let i = from; i <= to; i++) {
        if (verses[i]) {
          html += `<div style="margin-bottom:8px;"><span style="color:var(--purple);font-weight:700;">${i}</span> ${verses[i]}</div>`;
        }
      }
      previewDiv.innerHTML = html || '<div>해당 절의 데이터가 없습니다</div>';
    } else {
      previewDiv.innerHTML = '<div>데이터를 불러올 수 없습니다</div>';
    }
  } catch(e) {
    previewDiv.innerHTML = '<div>미리보기를 불러올 수 없습니다</div>';
  }
}


function vsGoBack(step) {
  if (step === 'book') {
    verseStep = 'book';
    document.getElementById('vstep-chapter').style.display = 'none';
    document.getElementById('vstep-book').style.display = 'block';
    document.getElementById('vstep1').style.background = 'var(--purple)';
    document.getElementById('vstep1').style.color = 'white';
    document.getElementById('vstep2').style.background = 'var(--bg2)';
    document.getElementById('vstep2').style.color = 'var(--text2)';
  } else if (step === 'chapter') {
    verseStep = 'chapter';
    document.getElementById('vstep-verse').style.display = 'none';
    document.getElementById('vstep-chapter').style.display = 'block';
    document.getElementById('vstep2').style.background = 'var(--purple)';
    document.getElementById('vstep2').style.color = 'white';
    document.getElementById('vstep3').style.background = 'var(--bg2)';
    document.getElementById('vstep3').style.color = 'var(--text2)';
  }
}


async function applyTodayVerse() {
  const from = selectedFromVerse || parseInt(document.getElementById('vs-from').value);
  const to = selectedToVerse || parseInt(document.getElementById('vs-to').value);
  
  if (!selectedBook || !selectedChapter) {
    showToast('책과 장을 선택해주세요');
    return;
  }
  
  showToast('말씀을 등록 중입니다...');
  
  try {
    const res = await fetch(`${BIBLE_CDN}/${selectedBook.file}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    let bookData = data;
    for (const key of [selectedBook.name, selectedBook.abbr]) {
      if (data[key] && data[key][selectedChapter]) { bookData = data[key]; break; }
    }
    
    let verseText = '';
    if (bookData && bookData[selectedChapter]) {
      const verses = bookData[selectedChapter];
      const verseParts = [];
      for (let i = from; i <= to; i++) {
        if (verses[i]) verseParts.push(verses[i]);
      }
      verseText = verseParts.join(' ');
    }
    
    const verseRef = `${selectedBook.name} ${selectedChapter}:${from}${from !== to ? '-' + to : ''}`;
    
    // Firebase에 저장
    const todayVerse = {
      text: verseText,
      ref: verseRef,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || '관리자'
    };
    
    if (window.FB_READY) {
      await firebase.database().ref('todayVerse').set(todayVerse);
    }
    
    // 로컬 저장
    LS.save('todayVerse', todayVerse);
    
    // 화면 업데이트
    document.getElementById('today-verse-text').innerHTML = `"${verseText.substring(0, 100)}${verseText.length > 100 ? '...' : ''}"`;
    document.getElementById('today-verse-ref').innerHTML = verseRef;
    document.getElementById('today-verse-body').innerHTML = verseText;
    
    closeVerseSelector();
    showToast('✅ 오늘의 말씀이 등록되었습니다');
  } catch(e) {
    console.error('말씀 등록 실패:', e);
    showToast('말씀 등록에 실패했습니다');
  }
}


// 말씀 공유하기
function shareToday() {
  const text = document.getElementById('today-verse-text')?.innerText || '';
  const ref = document.getElementById('today-verse-ref')?.innerText || '';
  const body = document.getElementById('today-verse-body')?.innerText || '';
  
  if (navigator.share) {
    navigator.share({
      title: '가좌제일교회 오늘의 말씀',
      text: `${ref}\n\n"${text}"\n\n${body}`,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${ref}\n\n"${text}"\n\n${body}`);
    showToast('말씀이 클립보드에 복사되었습니다');
  }
}


// 오늘의 말씀 불러오기
async function renderTodayVerse() {
  try {
    let todayVerse = LS.load('todayVerse');
    
    if (window.FB_READY) {
      const snapshot = await firebase.database().ref('todayVerse').once('value');
      if (snapshot.exists()) {
        todayVerse = snapshot.val();
        LS.save('todayVerse', todayVerse);
      }
    }
    
    if (todayVerse && todayVerse.text) {
      document.getElementById('today-verse-text').innerHTML = `"${todayVerse.text.substring(0, 100)}${todayVerse.text.length > 100 ? '...' : ''}"`;
      document.getElementById('today-verse-ref').innerHTML = todayVerse.ref;
      document.getElementById('today-verse-body').innerHTML = todayVerse.text;
    }
  } catch(e) {
    console.error('말씀 로드 실패:', e);
  }
}