// ==================== 저장소 관리 ====================


// 전역 변수 선언
let pendingUsers = [];
let approvedUsers = [];
let currentUser = null;
let members = [];
let notices = [];
let offerings = [];
let meditations = [];
let prayers = [];
let serviceList = [];
let scheduleList = [];
let todayVerse = null;
let posts = [];


// 로컬 스토리지 관리 객체 (LS)
const STORAGE_PREFIX = 'ch2_';


const LS = {
  save: (k, v) => {
    try { 
      localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v)); 
    } catch(e) { 
      console.warn('LS 저장 실패:', e); 
    }
    
    // Firebase와도 동시 저장
    if (FB_KEYS && FB_KEYS.includes(k) && window.FB_READY) {
      try { 
        firebase.database().ref(k).set(v);
      } catch(e) { 
        console.warn('FB 저장 실패:', e); 
      }
    }
  },
  load: (k, d) => {
    try { 
      const r = localStorage.getItem(STORAGE_PREFIX + k); 
      return r !== null ? JSON.parse(r) : d; 
    } catch(e) { 
      return d; 
    }
  },
  del: (k) => {
    try { 
      localStorage.removeItem(STORAGE_PREFIX + k); 
    } catch(e) {}
  }
};


// Firebase 자동 동기화
function fbSync() {
  if (!window.FB_READY) return;
  
  FB_KEYS.forEach(key => {
    firebase.database().ref(key).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data === null) return;
      
      try { 
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); 
      } catch(e) {}
      
      fbUpdateUI(key, data);
    });
  });
}


// Firebase 데이터로 변수 업데이트
function fbUpdateUI(key, data) {
  let arr = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) arr = Object.values(data);
  
  console.log('fbUpdateUI:', key, '데이터 개수:', arr ? arr.length : 0);
  
  switch(key) {
    case 'pendingUsers': pendingUsers = arr || []; break;
    case 'approvedUsers': approvedUsers = arr || []; break;
    case 'notices': notices = arr || []; if (typeof renderNotices === 'function') renderNotices(); break;
    case 'members': members = arr || []; break;
    case 'meditations': meditations = arr || []; break;
    case 'offerings': offerings = arr || []; break;
    case 'todayVerse': todayVerse = arr ? arr[0] : null; if (typeof renderTodayVerse === 'function') renderTodayVerse(); break;
    case 'serviceList': serviceList = arr || []; if (typeof renderServiceView === 'function') renderServiceView(); break;
    case 'scheduleList': scheduleList = arr || []; if (typeof renderScheduleView === 'function') renderScheduleView(); break;
    case 'posts': posts = arr || []; break;
    case 'prayers': prayers = arr || []; break;
  }
}


console.log('✅ js_storage.js 로드 완료');


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