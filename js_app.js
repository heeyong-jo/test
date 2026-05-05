// ==================== 앱 초기화 ====================




// Firebase 초기화 (전역 FB 객체는 config.js에서 이미 정의됨)
window.addEventListener('load', () => {
  // 1. Firebase 데이터 로드 (로컬 또는 실시간)
  setTimeout(async () => {
    if (window.FB_READY && window.FB) {
      await fbLoadAll();
      fbSync();
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




  // 2. 스플래시 제거 및 초기 렌더링, 자동 로그인 처리
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => { splash.style.display = 'none'; }, 500);
    }




    // 기본 UI 렌더링
    if (typeof renderServiceView === 'function') renderServiceView();
    if (typeof renderScheduleView === 'function') renderScheduleView();
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