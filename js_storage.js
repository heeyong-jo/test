// ==================== 로컬 스토리지 및 Firebase 저장 ====================
// 최종 수정본 - 전역 변수 정리, serviceList/scheduleList 추가


if (typeof FB_KEYS === 'undefined') {
  var FB_KEYS = ['notices', 'members', 'meditations', 'pendingUsers', 'approvedUsers', 
                  'offerings', 'todayVerse', 'serviceList', 'scheduleList', 'posts', 'prayers'];
}


// ✅ 전역 변수 선언 (window 사용으로 통일)
window.pendingUsers = window.pendingUsers || [];
window.approvedUsers = window.approvedUsers || [];
window.currentUser = window.currentUser || null;
window.members = window.members || [];
window.notices = window.notices || [];
window.offerings = window.offerings || [];
window.meditations = window.meditations || [];
window.prayers = window.prayers || [];
window.todayVerse = window.todayVerse || null;
window.posts = window.posts || [];
window.serviceList = window.serviceList || [];
window.scheduleList = window.scheduleList || [];


// 로컬 변수 (편의를 위해 window 참조)
var members = window.members;
var notices = window.notices;
var offerings = window.offerings;
var meditations = window.meditations;
var prayers = window.prayers;
var todayVerse = window.todayVerse;
var posts = window.posts;
var serviceList = window.serviceList;
var scheduleList = window.scheduleList;


const STORAGE_PREFIX = 'ch2_';


const LS = {
  save: (k, v) => {
    try { 
      localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v)); 
    } catch(e) { 
      console.warn('LS 저장 실패:', e); 
    }
    
    if (FB_KEYS && FB_KEYS.includes(k) && window.FB_READY && typeof firebase !== 'undefined') {
      try { 
        firebase.database().ref(k).set(v);
        console.log(`✅ Firebase ${k} 저장 완료`);
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
    
    if (FB_KEYS && FB_KEYS.includes(k) && window.FB_READY && typeof firebase !== 'undefined') {
      try { 
        firebase.database().ref(k).remove(); 
      } catch(e) {}
    }
  }
};


function fbUpdateUI(key, data) {
  let arr = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    arr = Object.values(data);
  }
  
  console.log('fbUpdateUI:', key, '데이터 개수:', arr ? arr.length : 0);
  
  switch(key) {
    case 'notices':
      window.notices = arr || [];
      notices = window.notices;
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
      break;
      
    case 'members':
      window.members = arr || [];
      members = window.members;
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
      break;
      
    case 'meditations':
      window.meditations = (arr || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      meditations = window.meditations;
      if (typeof renderMeditations === 'function') renderMeditations();
      break;
      
    case 'pendingUsers':
      window.pendingUsers = arr || [];
      pendingUsers = window.pendingUsers;
      if (typeof renderApprovalsAccord === 'function') renderApprovalsAccord();
      break;
      
    case 'approvedUsers':
      window.approvedUsers = arr || [];
      approvedUsers = window.approvedUsers;
      break;
      
    case 'offerings':
      window.offerings = arr || [];
      offerings = window.offerings;
      break;
      
    case 'todayVerse':
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        window.todayVerse = data;
      } else if (Array.isArray(data) && data.length > 0) {
        window.todayVerse = data[0];
      } else {
        window.todayVerse = null;
      }
      todayVerse = window.todayVerse;
      if (typeof renderTodayVerse === 'function') renderTodayVerse();
      break;
      
    case 'serviceList':
      window.serviceList = arr || [];
      serviceList = window.serviceList;
      if (typeof renderServiceView === 'function') renderServiceView();
      break;
      
    case 'scheduleList':
      window.scheduleList = arr || [];
      scheduleList = window.scheduleList;
      if (typeof renderScheduleView === 'function') renderScheduleView();
      break;
      
    case 'posts':
      window.posts = arr || [];
      posts = window.posts;
      if (typeof loadPosts === 'function' && window.currentBoardCategory) {
        loadPosts();
      }
      break;
      
    case 'prayers':
      window.prayers = arr || [];
      prayers = window.prayers;
      if (typeof renderPrayers === 'function') renderPrayers();
      break;
  }
}


if (typeof window._fbSyncDefined === 'undefined') {
  window._fbSyncDefined = true;
  
  function fbSync() {
    if (!window.FB_READY || typeof firebase === 'undefined') return;
    
    console.log('🔄 Firebase 동기화 시작');
    
    FB_KEYS.forEach(key => {
      try {
        firebase.database().ref(key).on('value', (snapshot) => {
          const data = snapshot.val();
          if (data === null) return;
          
          try { 
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data)); 
          } catch(e) {}
          
          fbUpdateUI(key, data);
        });
      } catch(e) { 
        console.warn(key + ' 동기화 오류:', e); 
      }
    });
  }
}


if (typeof window._fbLoadAllDefined === 'undefined') {
  window._fbLoadAllDefined = true;
  
  async function fbLoadAll() {
    if (!window.FB_READY || typeof firebase === 'undefined') {
      console.log('Firebase 미준비, fbLoadAll 건너뜀');
      return;
    }
    
    console.log('📡 Firebase 데이터 로드 시작');
    
    try {
      for (const key of FB_KEYS) {
        try {
          const snap = await firebase.database().ref(key).once('value');
          const data = snap.val();
          if (data !== null) {
            fbUpdateUI(key, data);
            console.log(`✅ ${key} 로드 완료`);
          }
        } catch(e) {
          console.warn(key + ' 로드 실패:', e);
        }
      }
      console.log('✅ Firebase 데이터 로드 완료');
    } catch(e) {
      console.error('fbLoadAll 오류:', e);
    }
  }
}


function loadFromLocalStorage() {
  console.log('📁 localStorage 데이터 로드 시작');
  
  try {
    const savedNotices = localStorage.getItem('ch2_notices');
    if (savedNotices) {
      window.notices = JSON.parse(savedNotices);
      notices = window.notices;
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
    }
  } catch(e) {}
  
  try {
    const savedService = localStorage.getItem('ch2_serviceList');
    if (savedService) {
      window.serviceList = JSON.parse(savedService);
      serviceList = window.serviceList;
      if (typeof renderServiceView === 'function') renderServiceView();
    }
  } catch(e) {}
  
  try {
    const savedSchedule = localStorage.getItem('ch2_scheduleList');
    if (savedSchedule) {
      window.scheduleList = JSON.parse(savedSchedule);
      scheduleList = window.scheduleList;
      if (typeof renderScheduleView === 'function') renderScheduleView();
    }
  } catch(e) {}
  
  try {
    const savedPrayers = localStorage.getItem('ch2_prayers');
    if (savedPrayers) {
      window.prayers = JSON.parse(savedPrayers);
      prayers = window.prayers;
      if (typeof renderPrayers === 'function') renderPrayers();
    }
  } catch(e) {}
  
  try {
    const savedMembers = localStorage.getItem('ch2_members');
    if (savedMembers) {
      window.members = JSON.parse(savedMembers);
      members = window.members;
      if (typeof renderMembersAccord === 'function') renderMembersAccord();
    }
  } catch(e) {}
  
  try {
    const savedMeditations = localStorage.getItem('ch2_meditations');
    if (savedMeditations) {
      window.meditations = JSON.parse(savedMeditations);
      meditations = window.meditations;
      if (typeof renderMeditations === 'function') renderMeditations();
    }
  } catch(e) {}
  
  try {
    const savedTodayVerse = localStorage.getItem('ch2_todayVerse');
    if (savedTodayVerse) {
      window.todayVerse = JSON.parse(savedTodayVerse);
      todayVerse = window.todayVerse;
      if (typeof renderTodayVerse === 'function') renderTodayVerse();
    }
  } catch(e) {}
}


(function() {
  console.log('🚀 js_storage.js 자동 실행');
  
  loadFromLocalStorage();
  
  setTimeout(function() {
    if (typeof window.FB_READY !== 'undefined' && window.FB_READY && typeof firebase !== 'undefined') {
      fbLoadAll();
      fbSync();
      console.log('✅ Firebase 동기화 시작됨');
    } else {
      console.log('⚠️ Firebase 미준비, localStorage만 사용');
      // Firebase 없을 때도 UI 업데이트
      if (typeof renderServiceView === 'function') renderServiceView();
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
      if (typeof renderMeditations === 'function') renderMeditations();
      if (typeof renderPrayers === 'function') renderPrayers();
    }
  }, 200);
})();


window.LS = LS;
window.fbUpdateUI = fbUpdateUI;
window.fbSync = fbSync;
window.fbLoadAll = fbLoadAll;
window.loadFromLocalStorage = loadFromLocalStorage;


console.log('✅ js_storage.js 로드 완료 (수정본)');