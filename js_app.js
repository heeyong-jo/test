// ==================== 앱 초기화 ====================


// ✅ Firebase 초기화 후 실행되는 함수들
async function initializeApp() {
  // Firebase 준비 대기
  const firebaseReady = await waitForFirebase();
  
  if (!firebaseReady) {
    console.warn('Firebase 연결 실패, 일부 기능 제한됨');
    showToast('서버 연결에 실패했습니다. 오프라인 모드로 실행합니다.');
  }
  
  // 나머지 초기화 진행
  setTimeout(function() {
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
    if (typeof renderMeditations === 'function') renderMeditations();
    if (typeof renderPrayers === 'function') renderPrayers();
    if (typeof renderPosts === 'function') renderPosts();
    if (typeof loadChurchInfo === 'function') loadChurchInfo();
  }, 800);
}


// ✅ 수정된 loadChurchInfo
async function loadChurchInfo() {
  const firebaseReady = await waitForFirebase();
  if (!firebaseReady) {
    console.warn('Firebase 미연결, 기본값 사용');
    renderGreeting(defaultGreeting);
    renderHistory(defaultHistory);
    return;
  }
  
  firebase.database().ref('churchInfo').once('value', snap => {
    if (snap.exists()) {
      const d = snap.val();
      if (typeof renderGreeting === 'function') renderGreeting(d.greeting || defaultGreeting);
      if (typeof renderHistory === 'function') renderHistory(d.history || defaultHistory);
    } else {
      if (typeof renderGreeting === 'function') renderGreeting(defaultGreeting);
      if (typeof renderHistory === 'function') renderHistory(defaultHistory);
    }
    if (currentUser && currentUser.role === 'admin') {
      const greetingBtn = document.getElementById('greeting-edit-btn');
      const historyBtn = document.getElementById('history-edit-btn');
      if (greetingBtn) greetingBtn.style.display = 'inline-block';
      if (historyBtn) historyBtn.style.display = 'inline-block';
    }
  }).catch(err => {
    console.error('교회 정보 로드 실패:', err);
    renderGreeting(defaultGreeting);
    renderHistory(defaultHistory);
  });
}


// window.load 이벤트 수정
window.addEventListener('load', function() {
  setTimeout(function() {
    var splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(function() { splash.style.display = 'none'; }, 500);
    }
  }, 1500);
  
  // ✅ Firebase 준비 후 초기화
  initializeApp();
});
  
  setTimeout(function() {
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
    if (typeof renderMeditations === 'function') renderMeditations();
    if (typeof renderPrayers === 'function') renderPrayers();
    if (typeof renderPosts === 'function') renderPosts();
  }, 800);
});


// ✅ 게시판 관련 함수는 js_board.js에만 정의 (여기서 제거)
// updateBoardWriteBtn, updateBoardCommentArea는 js_board.js 사용


// ── 교회 정보 (인사말/연혁) Firebase 연동 ──────────────────────
const defaultGreeting = `"인생은 만남입니다.\n\n우리는 부모와의 만남에서 인생의 지침을 배우고...\n하나님은 오늘도 당신을 기다리고 계십니다.\n하나님은 당신을 사랑하십니다."`;


const defaultHistory = [
  { year: "1972년 1월 23일", content: "가좌제일교회 창립" },
  { year: "2019년 1월", content: "새 성전으로 이전" },
  { year: "2026년 현재", content: "대한예수교 장로회 통합측 소속 교회" }
];


let currentEditMode = '';


function loadChurchInfo() {
  if (typeof firebase === 'undefined') return;
  firebase.database().ref('churchInfo').once('value', snap => {
    if (snap.exists()) {
      const d = snap.val();
      if (typeof renderGreeting === 'function') renderGreeting(d.greeting || defaultGreeting);
      if (typeof renderHistory === 'function') renderHistory(d.history || defaultHistory);
    } else {
      if (typeof renderGreeting === 'function') renderGreeting(defaultGreeting);
      if (typeof renderHistory === 'function') renderHistory(defaultHistory);
    }
    if (currentUser && currentUser.role === 'admin') {
      const greetingBtn = document.getElementById('greeting-edit-btn');
      const historyBtn = document.getElementById('history-edit-btn');
      if (greetingBtn) greetingBtn.style.display = 'inline-block';
      if (historyBtn) historyBtn.style.display = 'inline-block';
    }
  });
}


function renderGreeting(text) {
  const el = document.getElementById('greeting-content');
  if (!el) return;
  el.innerHTML = `<div style="background:linear-gradient(135deg,#f9f2f9,#f5eaf5);border-radius:16px;padding:18px;">
       <div style="font-size:14px;color:var(--text2);line-height:1.8;white-space:pre-wrap;">${escapeHtml(text)}</div>
       <div style="text-align:right;margin-top:8px;">
         <div style="font-weight:800;color:var(--purple);">김명서 목사</div>
         <div style="font-size:11px;color:var(--text2);">가좌제일교회 담임</div>
       </div>
     </div>`;
}


function renderHistory(arr) {
  const el = document.getElementById('history-content');
  if (!el) return;
  let html = '';
  arr.forEach(item => {
    html += `
      <div style="border-left:3px solid var(--purple);padding-left:14px;margin-bottom:12px;">
        <div style="font-weight:800;color:var(--purple);margin-bottom:4px;">${escapeHtml(item.year)}</div>
        <div style="font-size:13px;color:var(--text2);">${escapeHtml(item.content)}</div>
      </div>`;
  });
  el.innerHTML = html;
}


function openEditGreeting() {
  currentEditMode = 'greeting';
  const titleEl = document.getElementById('churchinfo-modal-title');
  if (titleEl) titleEl.textContent = '✏️ 인사말 수정';
  const greetingArea = document.getElementById('greeting-edit-area');
  const historyArea = document.getElementById('history-edit-area');
  if (greetingArea) greetingArea.style.display = 'block';
  if (historyArea) historyArea.style.display = 'none';
  if (typeof firebase !== 'undefined') {
    firebase.database().ref('churchInfo/greeting').once('value', snap => {
      const textarea = document.getElementById('edit-greeting-text');
      if (textarea) textarea.value = snap.val() || defaultGreeting;
    });
  }
  const modal = document.getElementById('modal-edit-churchinfo');
  if (modal) modal.style.display = 'flex';
}


function openEditHistory() {
  currentEditMode = 'history';
  const titleEl = document.getElementById('churchinfo-modal-title');
  if (titleEl) titleEl.textContent = '📜 연혁 수정';
  const greetingArea = document.getElementById('greeting-edit-area');
  const historyArea = document.getElementById('history-edit-area');
  if (greetingArea) greetingArea.style.display = 'none';
  if (historyArea) historyArea.style.display = 'block';
  if (typeof firebase !== 'undefined') {
    firebase.database().ref('churchInfo/history').once('value', snap => {
      let arr = snap.val() || defaultHistory;
      let text = arr.map(item => `${item.year}: ${item.content}`).join('\n');
      const textarea = document.getElementById('edit-history-text');
      if (textarea) textarea.value = text;
    });
  }
  const modal = document.getElementById('modal-edit-churchinfo');
  if (modal) modal.style.display = 'flex';
}


function saveChurchInfo() {
  if (currentEditMode === 'greeting') {
    const textarea = document.getElementById('edit-greeting-text');
    const text = textarea ? textarea.value.trim() : '';
    if (typeof firebase !== 'undefined') {
      firebase.database().ref('churchInfo/greeting').set(text)
        .then(() => {
          renderGreeting(text);
          closeModal('modal-edit-churchinfo');
          if (typeof showToast === 'function') showToast('인사말이 저장되었습니다.');
        })
        .catch(e => console.error('저장 오류:', e));
    }
  } else if (currentEditMode === 'history') {
    const textarea = document.getElementById('edit-history-text');
    const raw = textarea ? textarea.value.trim() : '';
    const arr = raw.split('\n').map(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return null;
      return {
        year: line.slice(0, idx).trim(),
        content: line.slice(idx+1).trim()
      };
    }).filter(Boolean);
    if (typeof firebase !== 'undefined') {
      firebase.database().ref('churchInfo/history').set(arr)
        .then(() => {
          renderHistory(arr);
          closeModal('modal-edit-churchinfo');
          if (typeof showToast === 'function') showToast('연혁이 저장되었습니다.');
        })
        .catch(e => console.error('저장 오류:', e));
    }
  }
}


function showPrivacyPolicy() {
  const modal = document.getElementById('modal-privacy');
  if (modal) modal.style.display = 'flex';
}


// ── 성경 읽기 기능 ──
let bibleReadingState = {
  bookIndex: 0,
  chapter: 1,
  todayPagesRead: 0,
  lastReadDate: ''
};


async function openBibleReading() {
  if (!currentUser) { alert('로그인이 필요합니다.'); return; }
  if (typeof firebase === 'undefined') { alert('데이터베이스 연결 오류'); return; }


  const userRef = firebase.database().ref(`bibleReading/${currentUser.id}`);
  const snap = await userRef.once('value');
  const data = snap.val() || {};


  const today = new Date().toISOString().slice(0, 10);
  bibleReadingState.todayPagesRead = data.history && data.history[today] ? data.history[today] : 0;
  bibleReadingState.lastReadDate = today;


  if (data.currentBookIndex !== undefined && data.currentChapter !== undefined) {
    bibleReadingState.bookIndex = data.currentBookIndex;
    bibleReadingState.chapter = data.currentChapter;
  } else {
    bibleReadingState.bookIndex = 0;
    bibleReadingState.chapter = 1;
  }


  if (bibleReadingState.todayPagesRead >= 10) {
    alert('오늘은 이미 10장을 모두 읽으셨습니다!');
    return;
  }
  
  const readerHome = document.getElementById('bible-reader-home');
  const readerScreen = document.getElementById('bible-reader-screen');
  if (readerHome) readerHome.style.display = 'none';
  if (readerScreen) readerScreen.style.display = 'block';


  const todayCount = document.getElementById('bible-reading-today-count');
  if (todayCount) todayCount.textContent = `오늘 ${bibleReadingState.todayPagesRead} / 10 장`;


  loadBibleChapterContent();
}


async function loadBibleChapterContent() {
  const books = getAllBooks();
  if (books.length === 0) {
    console.error('성경 데이터가 없습니다. OT_BOOKS, NT_BOOKS 확인 필요');
    return;
  }
  const book = books[bibleReadingState.bookIndex];
  const titleEl = document.getElementById('bible-reading-title');
  if (titleEl) titleEl.textContent = `📖 ${book.name} ${bibleReadingState.chapter}장`;


  const contentDiv = document.getElementById('bible-reading-content');
  if (!contentDiv) return;
  contentDiv.innerHTML = '<div style="text-align:center; padding:40px;">불러오는 중...</div>';


  try {
    const res = await fetch(`${BIBLE_CDN}/${book.file}`);
    const data = await res.json();
    const bookData = data[book.name] || data[book.abbr] || Object.values(data)[0];
    const verses = bookData[bibleReadingState.chapter];
    
    if (!verses) {
      contentDiv.innerHTML = '<div style="text-align:center; padding:40px; color:var(--red);">데이터를 불러올 수 없습니다</div>';
      return;
    }


    let html = '';
    Object.entries(verses).forEach(([num, text]) => {
      html += `<div style="display:flex; gap:10px; padding:6px 0; border-bottom:1px solid var(--border);">
        <span style="font-weight:700; color:var(--purple); min-width:28px;">${num}</span>
        <span>${escapeHtml(text)}</span>
      </div>`;
    });
    contentDiv.innerHTML = html;
  } catch (e) {
    console.error('성경 로드 오류:', e);
    contentDiv.innerHTML = '<div style="text-align:center; padding:40px; color:var(--red);">오류가 발생했습니다</div>';
  }
}


// ✅ 수정: 트랜잭션 안전성 확보
async function completeCurrentChapter() {
  if (bibleReadingState.todayPagesRead >= 10) {
    alert('오늘은 이미 10장을 모두 읽으셨습니다!');
    return;
  }


  if (!currentUser || typeof firebase === 'undefined') return;


  const today = new Date().toISOString().slice(0, 10);
  const userRef = firebase.database().ref(`bibleReading/${currentUser.id}`);
  
  // ✅ 트랜잭션 결과 저장
  let transactionResult = null;
  
  await userRef.transaction((data) => {
    if (!data) data = { name: currentUser.name, totalPages: 0, completions: 0, history: {}, currentBookIndex: 0, currentChapter: 1 };
    if (!data.history) data.history = {};
    
    const todayCount = (data.history[today] || 0) + 1;
    if (todayCount > 10) return; // abort
    
    data.history[today] = todayCount;
    
    let total = 0;
    Object.values(data.history).forEach(v => total += v);
    data.totalPages = total;
    data.completions = Math.floor(total / TOTAL_BIBLE_CHAPTERS);
    
    transactionResult = { todayCount, total, completions: data.completions };
    return data;
  });
  
  // ✅ 트랜잭션이 abort되었는지 확인
  if (!transactionResult) {
    alert('오늘 10장을 모두 읽으셨습니다.');
    return;
  }
  
  // ✅ 트랜잭션 결과로 상태 업데이트
  bibleReadingState.todayPagesRead = transactionResult.todayCount;
  
  const todayCountEl = document.getElementById('bible-reading-today-count');
  if (todayCountEl) todayCountEl.textContent = `오늘 ${bibleReadingState.todayPagesRead} / 10 장`;


  if (bibleReadingState.todayPagesRead >= 10) {
    alert('🎉 오늘 10장을 모두 읽으셨습니다! 내일 또 도전하세요.');
    closeBibleReading();
    return;
  }


  const books = getAllBooks();
  const book = books[bibleReadingState.bookIndex];
  if (bibleReadingState.chapter < book.chapters) {
    bibleReadingState.chapter++;
  } else {
    if (bibleReadingState.bookIndex < books.length - 1) {
      bibleReadingState.bookIndex++;
      bibleReadingState.chapter = 1;
    } else {
      alert('🎉 성경 1독을 완료하셨습니다! 축하드립니다!');
      bibleReadingState.bookIndex = 0;
      bibleReadingState.chapter = 1;
    }
  }


  await firebase.database().ref(`bibleReading/${currentUser.id}`).update({
    currentBookIndex: bibleReadingState.bookIndex,
    currentChapter: bibleReadingState.chapter
  });


  loadBibleChapterContent();
}


function closeBibleReading() {
  const readerScreen = document.getElementById('bible-reader-screen');
  const readerHome = document.getElementById('bible-reader-home');
  if (readerScreen) readerScreen.style.display = 'none';
  if (readerHome) readerHome.style.display = 'block';
  
  // ✅ 현재 읽기 위치 DB에 저장
  if (currentUser && typeof firebase !== 'undefined') {
    firebase.database().ref(`bibleReading/${currentUser.id}`).update({
      currentBookIndex: bibleReadingState.bookIndex,
      currentChapter: bibleReadingState.chapter
    }).catch(err => console.error('위치 저장 실패:', err));
  }
}


function loadBibleStatus() {
  if (!currentUser || typeof firebase === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  firebase.database().ref(`bibleReading/${currentUser.id}/history/${today}`).once('value', snap => {
    const pages = snap.val() || 0;
    const statusEl = document.getElementById('bible-reading-today-status');
    if (statusEl) statusEl.textContent = `📌 오늘 읽은 장: ${pages} / 10`;
  });
}


// ✅ 수정: 0회 완독자 제외
function loadBibleHallOfFame() {
  if (typeof firebase === 'undefined') return;
  firebase.database().ref('bibleReading').orderByChild('completions').once('value', snap => {
    const users = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.completions > 0) users.push(val);
    });
    users.sort((a, b) => b.completions - a.completions);
    const topUsers = users.slice(0, 10);
    
    let html = '';
    topUsers.forEach((u, i) => {
      html += `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
          <span>🏅 ${i+1}. ${escapeHtml(u.name)}</span>
          <span style="font-weight:bold; color:var(--purple);">${u.completions}회 완독</span>
        </div>`;
    });
    const fameEl = document.getElementById('bible-hall-of-fame');
    if (fameEl) fameEl.innerHTML = html || '<div style="text-align:center; padding:20px;">아직 완독자가 없습니다.</div>';
  });
}