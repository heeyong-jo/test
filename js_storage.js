// ==================== 로컬 스토리지 및 Firebase 저장 ====================


let pendingUsers = [];
let approvedUsers = [];
let currentUser = null;


let members = [];
let notices = [];
let offerings = [];
let meditations = [];
let posts = [];
let prayers = [];
let serviceList = [];
let scheduleList = [];
let todayVerse = null;


// 성경책 관련
let currentBook = null;
let currentBookInfo = null;
let currentChapter = 1;
let fontSize = 15;
let currentBibleSection = null;


// 찬송가 관련
let hymnTitles = {};
let hymnTitlesLoaded = false;
let currentHymnNo = 1;
let currentHymnRange = 0;
let hymnSearchQuery = '';


// 성도 관리
let currentMemberId = null;


// 게시물 이미지
let currentPostImageData = null;


// 말씀 선택기
let vsBookInfo = null;
let vsChapterData = null;


// 예배 수정
let serviceEditData = [];
let scheduleEditData = [];


// 로그인 UI
let authMode = 'login';
let idCheckTimer = null;


// 아코디언
let accordOpen = { member: false, offering: false, approval: false };


// 토스트
let toastTimer = null;


const LS = {
  save: (k, v) => {
    try { localStorage.setItem('ch2_' + k, JSON.stringify(v)); } catch(e) {}
    if (FB_KEYS.includes(k) && window.FB_READY && window.FB) {
      try { fbSave(k, v); } catch(e) { console.warn('FB 저장 실패:', e); }
    }
  },
  load: (k, d) => {
    try { const r = localStorage.getItem('ch2_' + k); return r !== null ? JSON.parse(r) : d; } catch(e) { return d; }
  },
  del: (k) => {
    try { localStorage.removeItem('ch2_' + k); } catch(e) {}
    if (FB_KEYS.includes(k) && window.FB_READY && window.FB) {
      try { fbDelete(k); } catch(e) {}
    }
  }
};


function fbSave(key, value) {
  if (!window.FB_READY || !window.FB) return;
  try { window.FB.ref('church/' + key).set(value); } catch(e) { console.warn('FB save 오류:', e); }
}


function fbDelete(key) {
  if (!window.FB_READY || !window.FB) return;
  try { window.FB.ref('church/' + key).remove(); } catch(e) { console.warn('FB delete 오류:', e); }
}


// Firebase 실시간 동기화 (읽기)
function fbSync() {
  if (!window.FB_READY || !window.FB) return;
  FB_KEYS.forEach(key => {
    try {
      window.FB.ref('church/' + key).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data === null) return;
        try { localStorage.setItem('ch2_' + key, JSON.stringify(data)); } catch(e) {}
        fbUpdateUI(key, data);
      });
    } catch(e) { console.warn(key + ' 동기화 오류:', e); }
  });
}


// Firebase 데이터로 UI 업데이트
function fbUpdateUI(key, data) {
  let arr = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) arr = Object.values(data);
  switch(key) {
    case 'notices':
      const localNotices = Array.isArray(notices) ? notices : [];
      const fbNotices = arr || [];
      const mergedNotices = [...fbNotices];
      localNotices.forEach(local => { if (!fbNotices.find(fb => fb.id === local.id)) mergedNotices.push(local); });
      notices = mergedNotices.sort((a,b) => (b.id||0) - (a.id||0));
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
      break;
    case 'members':
      const localMembers = Array.isArray(members) ? members : [];
      const fbMembers = arr || [];
      const mergedMembers = [...fbMembers];
      localMembers.forEach(local => { if (!fbMembers.find(fb => fb.id === local.id)) mergedMembers.push(local); });
      members = mergedMembers;
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
      break;
    case 'meditations':
      meditations = arr || [];
      if (typeof renderMeditations === 'function') renderMeditations();
      break;
    case 'pendingUsers':
      pendingUsers = arr || [];
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
      break;
    case 'approvedUsers':
      approvedUsers = arr || [];
      break;
    case 'offerings':
      offerings = arr || [];
      if (typeof renderOfferingsAccord === 'function') renderOfferingsAccord();
      break;
    case 'todayVerse':
      todayVerse = data;
      if (typeof renderTodayVerse === 'function') renderTodayVerse();
      break;
    case 'serviceList':
      serviceList = arr || [];
      if (typeof renderServiceView === 'function') renderServiceView();
      break;
    case 'scheduleList':
      scheduleList = arr || [];
      if (typeof renderScheduleView === 'function') renderScheduleView();
      break;
    case 'posts':
      posts = arr || [];
      if (typeof renderPosts === 'function') renderPosts();
      break;
    case 'prayers':
      prayers = arr || [];
      if (typeof renderPrayers === 'function') renderPrayers();
      break;
  }
}


// Firebase 전체 로드 (초기)
async function fbLoadAll() {
  if (!window.FB_READY || !window.FB) {
    console.log('로컬 모드: localStorage 데이터만 사용합니다');
    FB_KEYS.forEach(key => {
      try { const data = localStorage.getItem('ch2_' + key); if (data) fbUpdateUI(key, JSON.parse(data)); } catch(e) {}
    });
    return;
  }
  for (const key of FB_KEYS) {
    try {
      const snap = await window.FB.ref('church/' + key).get();
      if (snap && snap.exists && snap.exists()) {
        const data = snap.val();
        if (data !== null && data !== undefined) {
          try { localStorage.setItem('ch2_' + key, JSON.stringify(data)); } catch(e) {}
          fbUpdateUI(key, data);
        }
      }
    } catch(e) {
      console.warn('FB load 오류 (' + key + '):', e.message || e);
      try { const local = localStorage.getItem('ch2_' + key); if (local) fbUpdateUI(key, JSON.parse(local)); } catch(e2) {}
    }
  }
  console.log('✅ 데이터 로드 완료');
}


// 강제 새로고침 함수 (auth.js에서 사용)
async function forceRefreshData() {
  if (window.FB_READY && window.FB) {
    await fbLoadAll();
    console.log('✅ 데이터 강제 새로고침 완료');
  } else {
    FB_KEYS.forEach(key => {
      const data = localStorage.getItem('ch2_' + key);
      if (data) fbUpdateUI(key, JSON.parse(data));
    });
  }
  if (typeof renderMembersAccord === 'function') renderMembersAccord();
  if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
}