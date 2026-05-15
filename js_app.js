// ==================== 앱 초기화 ====================


window.addEventListener('load', () => {
  // 1. Firebase 데이터 로드 (로컬 또는 실시간)
  setTimeout(async () => {
    if (window.FB_READY && window.FB) {
      // fbLoadAll() 함수가 없으므로 직접 데이터 로드
      try {
        // 필요한 데이터만 로드
        const scheduleSnap = await firebase.database().ref('scheduleList').once('value');
        const scheduleData = scheduleSnap.val();
        if (scheduleData) {
          scheduleList = Array.isArray(scheduleData) ? scheduleData : Object.values(scheduleData);
        }
        
        // churchInfo 로드
        const churchSnap = await firebase.database().ref('churchInfo').once('value');
        if (churchSnap.exists()) {
          const churchData = churchSnap.val();
          if (churchData.greeting) renderGreeting(churchData.greeting);
          if (churchData.history) renderHistory(churchData.history);
        }
      } catch(e) {
        console.error('Firebase 로드 오류:', e);
      }
      
      if (typeof renderServiceView === 'function') renderServiceView();
      if (typeof renderScheduleView === 'function') renderScheduleView();
      if (typeof renderHomeService === 'function') {
        renderHomeService();
      }
    } else {
      console.log('로컬 모드: localStorage 데이터만 사용합니다');
      FB_KEYS.forEach(key => {
        try {
          const data = localStorage.getItem('ch2_' + key);
          if (data) fbUpdateUI(key, JSON.parse(data));
        } catch(e) {}
      });
    }
  }, 300);
});


  // 2. 스플래시 제거 및 초기 렌더링, 자동 로그인 처리
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => { splash.style.display = 'none'; }, 500);
    }




    // 기본 UI 렌더링
    if (typeof renderTodayVerse === 'function') renderTodayVerse();
    if (typeof renderPosts === 'function') renderPosts();
    if (typeof loadStaff === 'function') loadStaff();




    // 자동 로그인 체크 (7일 이내)
    const logged = LS.load('logged', null);
    if (logged && (Date.now() - logged.ts < 86400000 * 7)) {
      const admin = ADMIN_ACCOUNTS.find(a => a.id === logged.id);
      const member = approvedUsers.find(u => u.id === logged.id);
      const acc = admin || member;
      if (acc) {
        loginSuccess(acc);
        return;
      }
    }




    // 로그인 화면 표시
    showTab(0);
  }, 1000);
});


// 글쓰기 버튼: 매니저 이상만 표시
function updateBoardWriteBtn() {
  const wrap = document.getElementById('board-write-btn-wrap');
  if (!wrap) return;
  const role = currentUser && currentUser.role;
  // admin 또는 manager만 표시
  wrap.style.display = (role === 'admin' || role === 'manager') ? 'block' : 'none';
}


// 댓글 입력창: 로그인 유저 전체 허용
function updateBoardCommentArea() {
  const inputWrap = document.getElementById('board-comment-input-wrap');
  const loginMsg  = document.getElementById('board-comment-login-msg');
  if (!inputWrap || !loginMsg) return;
  if (currentUser) {
    inputWrap.style.display = 'block';
    loginMsg.style.display  = 'none';
  } else {
    inputWrap.style.display = 'none';
    loginMsg.style.display  = 'block';
  }
}


// ── 교회 정보 (인사말/연혁) Firebase 연동 ──────────────────────
const defaultGreeting = `"인생은 만남입니다.\n\n우리는 부모와의 만남에서 인생의 지침을 배우고...\n하나님은 오늘도 당신을 기다리고 계십니다.\n하나님은 당신을 사랑하십니다."`;




const defaultHistory = [
  { year: "1972년 1월 23일", content: "가좌제일교회 창립" },
  { year: "2019년 1월", content: "새 성전으로 이전" },
  { year: "2026년 현재", content: "대한예수교 장로회 통합측 소속 교회" }
];




let currentEditMode = ''; // 'greeting' | 'history'




function loadChurchInfo() {
  firebase.database().ref('churchInfo').once('value', snap => {
    if (snap.exists()) {
      const d = snap.val();
      renderGreeting(d.greeting || defaultGreeting);
      renderHistory(d.history || defaultHistory);
    } else {
      renderGreeting(defaultGreeting);
      renderHistory(defaultHistory);
    }
    // 관리자 버튼 표시
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin') {
      document.getElementById('greeting-edit-btn').style.display = 'inline-block';
      document.getElementById('history-edit-btn').style.display = 'inline-block';
    }
  });
}




function renderGreeting(text) {
  document.getElementById('greeting-content').innerHTML = 
    `<div style="background:linear-gradient(135deg,#f9f2f9,#f5eaf5);border-radius:16px;padding:18px;">
       <div style="font-size:14px;color:var(--text2);line-height:1.8;white-space:pre-wrap;">${text}</div>
       <div style="text-align:right;margin-top:8px;">
         <div style="font-weight:800;color:var(--purple);">김명서 목사</div>
         <div style="font-size:11px;color:var(--text2);">가좌제일교회 담임</div>
       </div>
     </div>`;
}




function renderHistory(arr) {
  let html = '';
  arr.forEach(item => {
    html += `
      <div style="border-left:3px solid var(--purple);padding-left:14px;margin-bottom:12px;">
        <div style="font-weight:800;color:var(--purple);margin-bottom:4px;">${item.year}</div>
        <div style="font-size:13px;color:var(--text2);">${item.content}</div>
      </div>`;
  });
  document.getElementById('history-content').innerHTML = html;
}




function openEditGreeting() {
  currentEditMode = 'greeting';
  document.getElementById('churchinfo-modal-title').textContent = '✏️ 인사말 수정';
  document.getElementById('greeting-edit-area').style.display = 'block';
  document.getElementById('history-edit-area').style.display = 'none';
  // 현재 인사말 텍스트 불러오기
  firebase.database().ref('churchInfo/greeting').once('value', snap => {
    document.getElementById('edit-greeting-text').value = snap.val() || defaultGreeting;
  });
  document.getElementById('modal-edit-churchinfo').style.display = 'flex';
}




function openEditHistory() {
  currentEditMode = 'history';
  document.getElementById('churchinfo-modal-title').textContent = '📜 연혁 수정';
  document.getElementById('greeting-edit-area').style.display = 'none';
  document.getElementById('history-edit-area').style.display = 'block';
  firebase.database().ref('churchInfo/history').once('value', snap => {
    let arr = snap.val() || defaultHistory;
    let text = arr.map(item => `${item.year}: ${item.content}`).join('\n');
    document.getElementById('edit-history-text').value = text;
  });
  document.getElementById('modal-edit-churchinfo').style.display = 'flex';
}




function saveChurchInfo() {
  if (currentEditMode === 'greeting') {
    const text = document.getElementById('edit-greeting-text').value.trim();
    firebase.database().ref('churchInfo/greeting').set(text)
      .then(() => {
        renderGreeting(text);
        closeModal('modal-edit-churchinfo');
        showToast('인사말이 저장되었습니다.');
      });
  } else if (currentEditMode === 'history') {
    const raw = document.getElementById('edit-history-text').value.trim();
    const arr = raw.split('\n').map(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return null;
      return {
        year: line.slice(0, idx).trim(),
        content: line.slice(idx+1).trim()
      };
    }).filter(Boolean);
    firebase.database().ref('churchInfo/history').set(arr)
      .then(() => {
        renderHistory(arr);
        closeModal('modal-edit-churchinfo');
        showToast('연혁이 저장되었습니다.');
      });
  }
}
function showPrivacyPolicy() {
  document.getElementById('modal-privacy').style.display = 'flex';
}
// ── 성경 읽기 기능 ──
const ALL_BOOKS = [...OT_BOOKS, ...NT_BOOKS];
const TOTAL_BIBLE_CHAPTERS = 1189;


let bibleReadingState = {
  bookIndex: 0,    // ALL_BOOKS 인덱스
  chapter: 1,
  todayPagesRead: 0,
  lastReadDate: ''
};


// ── 읽기 화면 열기 ──
async function openBibleReading() {
  if (!currentUser) { alert('로그인이 필요합니다.'); return; }


  // Firestore에서 사용자 데이터 불러오기
  const userRef = firebase.database().ref(`bibleReading/${currentUser.id}`);
  const snap = await userRef.once('value');
  const data = snap.val() || {};


  const today = new Date().toISOString().slice(0, 10);
  
  // 오늘 읽은 장 수
  bibleReadingState.todayPagesRead = data.history && data.history[today] ? data.history[today] : 0;
  bibleReadingState.lastReadDate = today;


  // 마지막 읽은 위치가 있으면 이어서, 없으면 창세기 1장부터
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
  document.getElementById('bible-reader-home').style.display = 'none';
  document.getElementById('bible-reader-screen').style.display = 'block';


  document.getElementById('bible-reading-today-count').textContent = 
    `오늘 ${bibleReadingState.todayPagesRead} / 10 장`;


  loadBibleChapterContent();
}


// ── 현재 장 내용 로드 ──
async function loadBibleChapterContent() {
  const book = ALL_BOOKS[bibleReadingState.bookIndex];
  document.getElementById('bible-reading-title').textContent = 
    `📖 ${book.name} ${bibleReadingState.chapter}장`;


  const contentDiv = document.getElementById('bible-reading-content');
  contentDiv.innerHTML = '<div style="text-align:center; padding:40px;">불러오는 중...</div>';


  try {
    const res = await fetch(`${BIBLE_CDN}/${book.file}`);
    const data = await res.json();
    
    // 책 데이터 찾기 (name 또는 abbr로)
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
        <span>${text}</span>
      </div>`;
    });
    contentDiv.innerHTML = html;
  } catch (e) {
    contentDiv.innerHTML = '<div style="text-align:center; padding:40px; color:var(--red);">오류가 발생했습니다</div>';
  }
}


// ── 현재 장 읽기 완료 ──
async function completeCurrentChapter() {
  if (bibleReadingState.todayPagesRead >= 10) {
    alert('오늘은 이미 10장을 모두 읽으셨습니다!');
    return;
  }


  if (!currentUser) return;


  bibleReadingState.todayPagesRead++;
  const today = new Date().toISOString().slice(0, 10);


  const userRef = firebase.database().ref(`bibleReading/${currentUser.id}`);
  
  await userRef.transaction((data) => {
    if (!data) data = { 
      name: currentUser.name, 
      totalPages: 0, 
      completions: 0, 
      history: {},
      currentBookIndex: 0,
      currentChapter: 1
    };


    if (!data.history) data.history = {};
    data.history[today] = bibleReadingState.todayPagesRead;
    
    let total = 0;
    Object.values(data.history).forEach(p => total += p);
    data.totalPages = total;
    data.completions = Math.floor(total / TOTAL_BIBLE_CHAPTERS);
    
    return data;
  });


  document.getElementById('bible-reading-today-count').textContent = 
    `오늘 ${bibleReadingState.todayPagesRead} / 10 장`;


  if (bibleReadingState.todayPagesRead >= 10) {
    alert('🎉 오늘 10장을 모두 읽으셨습니다! 내일 또 도전하세요.');
    closeBibleReading();
    return;
  }


  // 다음 장으로 이동
  const book = ALL_BOOKS[bibleReadingState.bookIndex];
  if (bibleReadingState.chapter < book.chapters) {
    bibleReadingState.chapter++;
  } else {
    // 다음 책으로
    if (bibleReadingState.bookIndex < ALL_BOOKS.length - 1) {
      bibleReadingState.bookIndex++;
      bibleReadingState.chapter = 1;
    } else {
      // 완독! 다시 창세기 1장으로
      alert('🎉 성경 1독을 완료하셨습니다! 축하드립니다!');
      bibleReadingState.bookIndex = 0;
      bibleReadingState.chapter = 1;
    }
  }


  // 마지막 읽은 위치 저장
  await userRef.update({
    currentBookIndex: bibleReadingState.bookIndex,
    currentChapter: bibleReadingState.chapter
  });


  loadBibleChapterContent();
}


// ── 읽기 화면 닫기 ──
function closeBibleReading() {
  document.getElementById('bible-reader-screen').style.display = 'none';
  document.getElementById('bible-reader-home').style.display = 'block';
}


// ── 오늘 읽기 상태 로드 (p3 화면용) ──
function loadBibleStatus() {
  if (!currentUser) return;
  const today = new Date().toISOString().slice(0, 10);
  firebase.database().ref(`bibleReading/${currentUser.id}/history/${today}`).once('value', snap => {
    const pages = snap.val() || 0;
    document.getElementById('bible-reading-today-status').textContent = 
      `📌 오늘 읽은 장: ${pages} / 10`;
  });
}


// ── 완독자 명예의 전당 ──
function loadBibleHallOfFame() {
  firebase.database().ref('bibleReading').orderByChild('completions').limitToLast(10).once('value', snap => {
    const users = [];
    snap.forEach(child => users.push(child.val()));
    users.reverse();
    
    let html = '';
    users.forEach((u, i) => {
      if (u.completions > 0) {
        html += `
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
            <span>🏅 ${i+1}. ${escapeHtml(u.name)}</span>
            <span style="font-weight:bold; color:var(--purple);">${u.completions}회 완독</span>
          </div>`;
      }
    });
    document.getElementById('bible-hall-of-fame').innerHTML = html || '<div style="text-align:center; padding:20px;">아직 완독자가 없습니다.</div>';
  });
}


// js_app.js 맨 아래에 추가
window.addEventListener('load', function() {
  setTimeout(function() {
    if (typeof renderServiceView === 'function') {
      try {
        renderServiceView();
      } catch(e) {
        console.error('예배 로딩 오류:', e);
      }
    }
  }, 900);
});