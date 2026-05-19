// ==================== 앱 초기화 ====================


// 교회 정보 데이터
const defaultGreeting = `"인생은 만남입니다.\n\n우리는 부모와의 만남에서 인생의 지침을 배우고...\n하나님은 오늘도 당신을 기다리고 계십니다.\n하나님은 당신을 사랑하십니다."`;


const defaultHistory = [
  { year: "1972년 1월 23일", content: "가좌제일교회 창립" },
  { year: "2019년 1월", content: "새 성전으로 이전" },
  { year: "2026년 현재", content: "대한예수교 장로회 통합측 소속 교회" }
];


let currentEditMode = '';


// 교회 정보 로드
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
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin') {
      const greetingBtn = document.getElementById('greeting-edit-btn');
      const historyBtn = document.getElementById('history-edit-btn');
      if (greetingBtn) greetingBtn.style.display = 'inline-block';
      if (historyBtn) historyBtn.style.display = 'inline-block';
    }
  }).catch(err => console.error('교회 정보 로드 실패:', err));
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


// 완독자 명예의 전당
function loadBibleHallOfFame() {
  if (typeof firebase === 'undefined') return;
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
    const fameEl = document.getElementById('bible-hall-of-fame');
    if (fameEl) fameEl.innerHTML = html || '<div style="text-align:center; padding:20px;">아직 완독자가 없습니다.</div>';
  });
}


// 페이지 로드 완료 후 초기화
window.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded - 초기화 시작');
  
  // 스플래시 숨김
  setTimeout(function() {
    var splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(function() {
        if (splash) splash.style.display = 'none';
      }, 500);
    }
  }, 1500);
  
  // 교회 정보 로드
  setTimeout(function() {
    if (typeof loadChurchInfo === 'function') {
      loadChurchInfo();
      console.log('교회 정보 로드 요청됨');
    }
  }, 500);
  
  // 예배 데이터 초기화
  if (typeof initServiceData === 'function') {
    initServiceData();
  } else if (typeof renderServiceView === 'function') {
    if (typeof serviceList !== 'undefined' && (!serviceList || serviceList.length === 0)) {
      if (typeof DEFAULT_SERVICE_LIST !== 'undefined') {
        serviceList = JSON.parse(JSON.stringify(DEFAULT_SERVICE_LIST));
        console.log('serviceList 기본값 설정 완료');
      }
    }
    renderServiceView();
  }
  
  // 공지사항 렌더링
  if (typeof renderHomeNotices === 'function') {
    renderHomeNotices();
  }
  
  // 기도제목 렌더링
  setTimeout(function() {
    if (typeof renderPrayers === 'function') {
      renderPrayers();
    }
  }, 300);
  
  // 말씀 렌더링
  setTimeout(function() {
    if (typeof renderTodayVerse === 'function') {
      renderTodayVerse();
    }
    if (typeof renderMeditations === 'function') {
      renderMeditations();
    }
  }, 400);
});


console.log('✅ js_app.js 로드 완료');