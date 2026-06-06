// ==================== 앱 초기화 (js_app.js) ====================
// 최종 통합본 - getAllBooks 전역 등록, bibleReadingState window 할당


window.addEventListener('load', () => {
  console.log('🚀 앱 초기화 시작');
  
  setTimeout(async () => {
    if (window.FB_READY && typeof firebase !== 'undefined') {
      if (typeof fbLoadAll === 'function') await fbLoadAll();
      if (typeof fbSync === 'function') fbSync();
      console.log('✅ Firebase 데이터 동기화 완료');
    } else {
      console.log('📁 로컬 모드: localStorage 데이터만 사용합니다');
      if (typeof FB_KEYS !== 'undefined') {
        FB_KEYS.forEach(key => {
          try {
            const data = localStorage.getItem('ch2_' + key);
            if (data && typeof fbUpdateUI === 'function') {
              fbUpdateUI(key, JSON.parse(data));
            }
          } catch(e) {}
        });
      }
    }
  }, 300);


  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => { splash.style.display = 'none'; }, 500);
    }


    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
    if (typeof loadPosts === 'function' && window.currentBoardCategory) loadPosts();


    const user = getCurrentUser();
    if (typeof LS !== 'undefined') {
      const logged = LS.load('logged', null);
      if (logged && (Date.now() - logged.ts < 86400000 * 7)) {
        let acc = null;
        if (typeof ADMIN_ACCOUNTS !== 'undefined') {
          acc = ADMIN_ACCOUNTS.find(a => a.id === logged.id);
        }
        if (!acc && typeof window.approvedUsers !== 'undefined') {
          acc = window.approvedUsers.find(u => u.id === logged.id);
        }
        if (acc && typeof loginSuccess === 'function') {
          loginSuccess(acc);
          return;
        }
      }
    }
    if (typeof showTab === 'function') showTab(0);
  }, 1000);
});


// ✅ getAllBooks 전역 함수 등록
function getAllBooks() {
  if (typeof OT_BOOKS !== 'undefined' && typeof NT_BOOKS !== 'undefined') {
    return [...OT_BOOKS, ...NT_BOOKS];
  }
  if (typeof window.OT_BOOKS !== 'undefined' && typeof window.NT_BOOKS !== 'undefined') {
    return [...window.OT_BOOKS, ...window.NT_BOOKS];
  }
  return [];
}
window.getAllBooks = getAllBooks;


const TOTAL_BIBLE_CHAPTERS = 1189;


// ✅ bibleReadingState window 할당
window.bibleReadingState = window.bibleReadingState || {
  bookIndex: 0,
  chapter: 1,
  todayPagesRead: 0,
  lastReadDate: ''
};
var bibleReadingState = window.bibleReadingState;


// ==================== 성경 장 내용 로드 ====================
async function loadBibleChapterContent() {
  console.log('loadBibleChapterContent 실행');
  
  const books = getAllBooks();
  if (books.length === 0) {
    const contentDiv = document.getElementById('bible-reading-content');
    if (contentDiv) contentDiv.innerHTML = '<div style="text-align:center;padding:40px;">⚠️ 성경 데이터를 불러올 수 없습니다</div>';
    return;
  }
  
  const book = books[bibleReadingState.bookIndex];
  if (!book) return;
  
  const titleEl = document.getElementById('bible-reading-title');
  if (titleEl) titleEl.textContent = `📖 ${book.name} ${bibleReadingState.chapter}장`;


  const contentDiv = document.getElementById('bible-reading-content');
  if (!contentDiv) return;
  
  contentDiv.innerHTML = '<div style="text-align:center; padding:40px;"><div class="splash-spinner"></div><div>불러오는 중...</div></div>';


  try {
    const res = await fetch(`${BIBLE_CDN}/${book.file}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    const bookData = data[book.name] || data[book.abbr] || Object.values(data)[0];
    const verses = bookData[bibleReadingState.chapter];
    
    if (!verses) {
      contentDiv.innerHTML = `<div style="text-align:center; padding:40px;">📖 ${book.name} ${bibleReadingState.chapter}장 데이터가 없습니다</div>`;
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
    contentDiv.innerHTML = `<div style="text-align:center; padding:40px;">⚠️ 오류가 발생했습니다</div>`;
  }
}


// ==================== 오픈 성경 읽기 ====================
async function openBibleReading() {
  console.log('openBibleReading 실행');
  
  const user = getCurrentUser();
  if (!user) { 
    if (typeof showToast === 'function') showToast('로그인이 필요합니다.');
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return; 
  }
  
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    startLocalBibleReading(user);
    return;
  }
  
  try {
    const userRef = firebase.database().ref(`bibleReading/${user.id}`);
    const snap = await userRef.once('value').catch(err => null);
    const data = snap ? (snap.val() || {}) : {};
    
    const today = new Date().toISOString().slice(0, 10);
    bibleReadingState.todayPagesRead = data.history && data.history[today] ? data.history[today] : 0;
    bibleReadingState.lastReadDate = today;
    bibleReadingState.bookIndex = data.currentBookIndex || 0;
    bibleReadingState.chapter = data.currentChapter || 1;
    
    if (bibleReadingState.todayPagesRead >= 10) {
      if (typeof showToast === 'function') showToast('오늘은 이미 10장을 모두 읽으셨습니다!');
      return;
    }
    
    document.getElementById('bible-reader-home').style.display = 'none';
    document.getElementById('bible-reader-screen').style.display = 'block';
    
    const todayCount = document.getElementById('bible-reading-today-count');
    if (todayCount) todayCount.textContent = `오늘 ${bibleReadingState.todayPagesRead} / 10 장`;
    
    loadBibleChapterContent();
  } catch (error) {
    console.error('openBibleReading 오류:', error);
    startLocalBibleReading(user);
  }
}


function startLocalBibleReading(user) {
  console.log('로컬 모드 성경 읽기 시작');
  try {
    const saved = localStorage.getItem(`bibleReading_${user.id}`);
    if (saved) {
      const data = JSON.parse(saved);
      bibleReadingState.bookIndex = data.bookIndex || 0;
      bibleReadingState.chapter = data.chapter || 1;
      bibleReadingState.todayPagesRead = data.todayPagesRead || 0;
      const today = new Date().toISOString().slice(0, 10);
      if (data.lastReadDate !== today) bibleReadingState.todayPagesRead = 0;
      bibleReadingState.lastReadDate = today;
    }
  } catch(e) {}
  
  if (bibleReadingState.todayPagesRead >= 10) {
    if (typeof showToast === 'function') showToast('오늘은 이미 10장을 모두 읽으셨습니다!');
    return;
  }
  
  document.getElementById('bible-reader-home').style.display = 'none';
  document.getElementById('bible-reader-screen').style.display = 'block';
  
  const todayCount = document.getElementById('bible-reading-today-count');
  if (todayCount) todayCount.textContent = `오늘 ${bibleReadingState.todayPagesRead} / 10 장 (로컬)`;
  
  loadBibleChapterContent();
}


// ==================== 챕터 완료 ====================
async function completeCurrentChapter() {
  console.log('completeCurrentChapter 실행');
  
  const user = getCurrentUser();
  if (bibleReadingState.todayPagesRead >= 10) {
    if (typeof showToast === 'function') showToast('오늘은 이미 10장을 모두 읽으셨습니다!');
    return;
  }
  
  const today = new Date().toISOString().slice(0, 10);
  bibleReadingState.todayPagesRead++;
  bibleReadingState.lastReadDate = today;
  
  const todayCount = document.getElementById('bible-reading-today-count');
  if (todayCount) todayCount.textContent = `오늘 ${bibleReadingState.todayPagesRead} / 10 장`;
  
  const books = getAllBooks();
  const book = books[bibleReadingState.bookIndex];
  
  if (bibleReadingState.chapter < book.chapters) {
    bibleReadingState.chapter++;
  } else if (bibleReadingState.bookIndex < books.length - 1) {
    bibleReadingState.bookIndex++;
    bibleReadingState.chapter = 1;
  } else {
    if (typeof showToast === 'function') showToast('🎉 성경 1독을 완료하셨습니다! 축하드립니다!');
    bibleReadingState.bookIndex = 0;
    bibleReadingState.chapter = 1;
  }
  
  if (user && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    try {
      await firebase.database().ref(`bibleReading/${user.id}`).update({
        currentBookIndex: bibleReadingState.bookIndex,
        currentChapter: bibleReadingState.chapter,
        [`history/${today}`]: bibleReadingState.todayPagesRead
      }).catch(e => console.warn('Firebase 저장 실패:', e));
    } catch(e) {}
  }
  
  if (user) {
    localStorage.setItem(`bibleReading_${user.id}`, JSON.stringify({
      bookIndex: bibleReadingState.bookIndex,
      chapter: bibleReadingState.chapter,
      todayPagesRead: bibleReadingState.todayPagesRead,
      lastReadDate: today
    }));
  }
  
  if (bibleReadingState.todayPagesRead >= 10) {
    if (typeof showToast === 'function') showToast('🎉 오늘 10장을 모두 읽으셨습니다!');
    closeBibleReading();
    return;
  }
  
  loadBibleChapterContent();
}


function closeBibleReading() {
  const readerScreen = document.getElementById('bible-reader-screen');
  const readerHome = document.getElementById('bible-reader-home');
  if (readerScreen) readerScreen.style.display = 'none';
  if (readerHome) readerHome.style.display = 'block';
}


function loadBibleStatus() {
  const user = getCurrentUser();
  if (!user) return;
  
  const today = new Date().toISOString().slice(0, 10);
  const statusEl = document.getElementById('bible-reading-today-status');
  
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    firebase.database().ref(`bibleReading/${user.id}/history/${today}`).once('value')
      .then(snap => {
        const pages = snap.val() || 0;
        if (statusEl) statusEl.textContent = `📌 오늘 읽은 장: ${pages} / 10`;
      })
      .catch(() => checkLocalBibleStatus(user, today, statusEl));
  } else {
    checkLocalBibleStatus(user, today, statusEl);
  }
}


function checkLocalBibleStatus(user, today, statusEl) {
  try {
    const saved = localStorage.getItem(`bibleReading_${user.id}`);
    if (saved) {
      const data = JSON.parse(saved);
      const pages = data.lastReadDate === today ? (data.todayPagesRead || 0) : 0;
      if (statusEl) statusEl.textContent = `📌 오늘 읽은 장: ${pages} / 10`;
    }
  } catch(e) {}
}


// ==================== 명예의 전당 ====================
function loadBibleHallOfFame() {
  console.log('loadBibleHallOfFame 실행');
  
  const fameEl = document.getElementById('bible-hall-of-fame');
  if (!fameEl) return;
  
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    fameEl.innerHTML = '<div style="text-align:center; padding:20px;">⚠️ 서버 연결 중...</div>';
    return;
  }
  
  firebase.database().ref('bibleReading').once('value')
    .then(snapshot => {
      const data = snapshot.val();
      if (!data) {
        fameEl.innerHTML = '<div style="text-align:center; padding:20px;">📖 아직 완독자가 없습니다.</div>';
        return;
      }
      
      const users = [];
      Object.entries(data).forEach(([userId, userData]) => {
        const completions = userData.completions || 0;
        if (completions > 0) {
          users.push({ name: userData.name || userId, completions: completions });
        }
      });
      
      users.sort((a, b) => b.completions - a.completions);
      const topUsers = users.slice(0, 10);
      
      if (topUsers.length === 0) {
        fameEl.innerHTML = '<div style="text-align:center; padding:20px;">📖 아직 완독자가 없습니다.</div>';
        return;
      }
      
      let html = '';
      topUsers.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        html += `
          <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);">
            <div style="display:flex; gap:10px; align-items:center;">
              <span>${medal}</span>
              <span>${index + 1}. ${escapeHtml(user.name)}</span>
            </div>
            <span style="color:var(--purple); font-weight:bold;">${user.completions}회</span>
          </div>`;
      });
      fameEl.innerHTML = html;
    })
    .catch(err => {
      console.error('명예의 전당 로드 실패:', err);
      fameEl.innerHTML = '<div style="text-align:center; padding:20px;">⚠️ 정보를 불러올 수 없습니다.</div>';
    });
}


// ==================== 교회 정보 함수 ====================
const defaultGreeting = `"인생은 만남입니다.\n\n우리는 부모와의 만남에서 인생의 지침을 배우고...\n하나님은 오늘도 당신을 기다리고 계십니다."`;


const defaultHistory = [
  { year: "1972년 1월 23일", content: "가좌제일교회 창립" },
  { year: "2026년 5월", content: "교회 공식 앱 론칭" }
];


let currentEditMode = '';


function loadChurchInfo() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    if (typeof renderGreeting === 'function') renderGreeting(defaultGreeting);
    if (typeof renderHistory === 'function') renderHistory(defaultHistory);
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
    html += `<div style="border-left:3px solid var(--purple);padding-left:14px;margin-bottom:12px;">
      <div style="font-weight:800;color:var(--purple);margin-bottom:4px;">${escapeHtml(item.year)}</div>
      <div style="font-size:13px;color:var(--text2);">${escapeHtml(item.content)}</div>
    </div>`;
  });
  el.innerHTML = html;
}


function openEditGreeting() {
  currentEditMode = 'greeting';
  document.getElementById('churchinfo-modal-title').textContent = '✏️ 인사말 수정';
  document.getElementById('greeting-edit-area').style.display = 'block';
  document.getElementById('history-edit-area').style.display = 'none';
  if (typeof firebase !== 'undefined') {
    firebase.database().ref('churchInfo/greeting').once('value', snap => {
      const textarea = document.getElementById('edit-greeting-text');
      if (textarea) textarea.value = snap.val() || defaultGreeting;
    });
  }
  document.getElementById('modal-edit-churchinfo').style.display = 'flex';
}


function openEditHistory() {
  currentEditMode = 'history';
  document.getElementById('churchinfo-modal-title').textContent = '📜 연혁 수정';
  document.getElementById('greeting-edit-area').style.display = 'none';
  document.getElementById('history-edit-area').style.display = 'block';
  if (typeof firebase !== 'undefined') {
    firebase.database().ref('churchInfo/history').once('value', snap => {
      let arr = snap.val() || defaultHistory;
      let text = arr.map(item => `${item.year}: ${item.content}`).join('\n');
      document.getElementById('edit-history-text').value = text;
    });
  }
  document.getElementById('modal-edit-churchinfo').style.display = 'flex';
}


function saveChurchInfo() {
  if (currentEditMode === 'greeting') {
    const text = document.getElementById('edit-greeting-text').value.trim();
    firebase.database().ref('churchInfo/greeting').set(text).then(() => {
      renderGreeting(text);
      document.getElementById('modal-edit-churchinfo').style.display = 'none';
      if (typeof showToast === 'function') showToast('인사말이 저장되었습니다.');
    });
  } else if (currentEditMode === 'history') {
    const raw = document.getElementById('edit-history-text').value.trim();
    const arr = raw.split('\n').map(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return null;
      return { year: line.slice(0, idx).trim(), content: line.slice(idx+1).trim() };
    }).filter(Boolean);
    firebase.database().ref('churchInfo/history').set(arr).then(() => {
      renderHistory(arr);
      document.getElementById('modal-edit-churchinfo').style.display = 'none';
      if (typeof showToast === 'function') showToast('연혁이 저장되었습니다.');
    });
  }
}


function showPrivacyPolicy() {
  const modal = document.getElementById('modal-privacy');
  if (modal) modal.style.display = 'flex';
}


function changeBibleReadingFontSize(delta) {
  const fontSize = Math.min(24, Math.max(12, (parseInt(localStorage.getItem('bibleFontSize') || '15') + delta)));
  localStorage.setItem('bibleFontSize', fontSize);
  const content = document.getElementById('bible-reading-content');
  if (content) content.style.fontSize = fontSize + 'px';
}


// ==================== 초기화 실행 ====================
setTimeout(() => {
  loadBibleHallOfFame();
  loadBibleStatus();
  if (typeof loadChurchInfo === 'function') loadChurchInfo();
}, 1500);


console.log('✅ js_app.js 로드 완료 (통합본)');