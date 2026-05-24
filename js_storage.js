// ==================== 로컬 스토리지 및 Firebase 저장 ====================


// FB_KEYS가 없으면 직접 정의 (안전 장치)
if (typeof FB_KEYS === 'undefined') {
  var FB_KEYS = ['notices', 'members', 'meditations', 'pendingUsers', 'approvedUsers', 
                  'offerings', 'todayVerse', 'serviceList', 'scheduleList', 'posts', 'prayers'];
}


// 전역 변수 선언
let pendingUsers = [];
let approvedUsers = [];
let currentUser = null;
let members = [];
let notices = [];
let offerings = [];
let meditations = [];
let prayers = [];
let todayVerse = null;
let posts = [];


// localStorage 접두사
const STORAGE_PREFIX = 'ch2_';


// LS 객체
const LS = {
  save: (k, v) => {
    try { localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v)); } catch(e) { console.warn('LS 저장 실패:', e); }
    if (FB_KEYS && FB_KEYS.includes(k) && window.FB_READY) {
      try { 
        firebase.database().ref(k).set(v);
      } catch(e) { console.warn('FB 저장 실패:', e); }
    }
  },
  load: (k, d) => {
    try { 
      const r = localStorage.getItem(STORAGE_PREFIX + k); 
      return r !== null ? JSON.parse(r) : d; 
    } catch(e) { return d; }
  },
  del: (k) => {
    try { localStorage.removeItem(STORAGE_PREFIX + k); } catch(e) {}
    if (FB_KEYS && FB_KEYS.includes(k) && window.FB_READY) {
      try { firebase.database().ref(k).remove(); } catch(e) {}
    }
  }
};


// Firebase 실시간 동기화
function fbSync() {
  if (!window.FB_READY) return;
  
  FB_KEYS.forEach(key => {
    try {
      firebase.database().ref(key).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data === null) return;
        
        try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); } catch(e) {}
        fbUpdateUI(key, data);
      });
    } catch(e) { console.warn(key + ' 동기화 오류:', e); }
  });
}




// Firebase 데이터로 UI 업데이트
function fbUpdateUI(key, data) {
  let arr = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) arr = Object.values(data);
  
  console.log('fbUpdateUI:', key, '데이터 개수:', arr ? arr.length : 0);
  
  switch(key) {
    case 'notices':
      notices = arr || [];
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
      break;
    case 'members':
      members = arr || [];
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
      break;
    case 'meditations':
      meditations = (arr || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
  // todayVerse는 배열이 아닌 객체로 저장됨
  todayVerse = (Array.isArray(data) ? data[0] : data) || null;
  if (typeof renderTodayVerse === 'function') renderTodayVerse(); 
  break;
    case 'serviceList':
  serviceList = arr || [];
  if (typeof renderServiceView === 'function') renderServiceView();
  break;
case 'scheduleList':
  if (typeof window.scheduleList !== 'undefined') {
    window.scheduleList = arr || [];
  }
  if (typeof renderScheduleView === 'function') renderScheduleView();
  break;
case 'posts':
  posts = arr || [];
  if (typeof renderBoardPosts === 'function') renderBoardPosts();
  break;
case 'prayers':
      prayers = arr || [];  // prayers 업데이트
      if (typeof renderPrayers === 'function') renderPrayers();
      break;
  }
}


// 모든 데이터 로드
async function fbLoadAll() {
  if (!window.FB_READY) return;
  
  console.log('Firebase 데이터 로드 시작');
  try {
    for (const key of FB_KEYS) {
      try {
        const snap = await firebase.database().ref(key).once('value');
        const data = snap.val();
        if (data) {
          fbUpdateUI(key, data);
        }
      } catch(e) {
        console.warn(key + ' 로드 실패:', e);
      }
    }
    console.log('Firebase 데이터 로드 완료');
  } catch(e) {
    console.error('fbLoadAll 오류:', e);
  }
}