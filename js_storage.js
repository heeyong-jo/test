// ==================== 로컬 스토리지 및 Firebase 저장 ====================
// 최종 수정본 - Firebase 저장 안정화


if (typeof FB_KEYS === 'undefined') {
  var FB_KEYS = ['notices', 'members', 'meditations', 'pendingUsers', 'approvedUsers', 
                  'offerings', 'todayVerse', 'serviceList', 'scheduleList', 'posts', 'prayers'];
}


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
  save: function(k, v) {
    // localStorage 저장
    try {
      localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v));
      console.log('💾 LS 저장 성공:', k);
    } catch(e) {
      console.warn('LS 저장 실패:', e);
    }
    
    // Firebase 저장 시도
    if (FB_KEYS && FB_KEYS.includes(k) && window.FB_READY && typeof firebase !== 'undefined' && firebase.database) {
      try {
        firebase.database().ref(k).set(v);
        console.log('✅ Firebase 저장 완료:', k);
      } catch(e) {
        console.warn('FB 저장 실패:', k, e);
      }
    }
  },
  
  load: function(k, d) {
    try {
      var r = localStorage.getItem(STORAGE_PREFIX + k);
      return r !== null ? JSON.parse(r) : d;
    } catch(e) {
      return d;
    }
  },
  
  del: function(k) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + k);
    } catch(e) {}
    
    if (FB_KEYS && FB_KEYS.includes(k) && window.FB_READY && typeof firebase !== 'undefined') {
      try {
        firebase.database().ref(k).remove();
        console.log('🗑 Firebase 삭제 완료:', k);
      } catch(e) {}
    }
  }
};


function fbUpdateUI(key, data) {
  console.log('🔄 fbUpdateUI:', key);
  
  var arr = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    arr = Object.values(data);
  }
  
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
      window.meditations = (arr || []).sort(function(a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
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
      window.todayVerse = (Array.isArray(data) ? data[0] : data) || null;
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
    if (!window.FB_READY || typeof firebase === 'undefined' || !firebase.database) {
      console.log('⚠️ Firebase 미준비, 동기화 스킵');
      return;
    }
    
    console.log('🔄 Firebase 동기화 시작');
    
    for (var i = 0; i < FB_KEYS.length; i++) {
      var key = FB_KEYS[i];
      (function(k) {
        try {
          firebase.database().ref(k).on('value', function(snapshot) {
            var data = snapshot.val();
            if (data === null) return;
            try {
              localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(data));
            } catch(e) {}
            fbUpdateUI(k, data);
          });
          console.log('✅ 동기화 등록:', k);
        } catch(e) {
          console.warn(k + ' 동기화 오류:', e);
        }
      })(key);
    }
  }
}


if (typeof window._fbLoadAllDefined === 'undefined') {
  window._fbLoadAllDefined = true;
  
  async function fbLoadAll() {
    if (!window.FB_READY || typeof firebase === 'undefined' || !firebase.database) {
      console.log('⚠️ Firebase 미준비, 로드 스킵');
      return;
    }
    
    console.log('📡 Firebase 데이터 로드 시작');
    
    for (var i = 0; i < FB_KEYS.length; i++) {
      var key = FB_KEYS[i];
      try {
        var snap = await firebase.database().ref(key).once('value');
        var data = snap.val();
        if (data !== null) {
          fbUpdateUI(key, data);
          console.log('✅ 로드 완료:', key);
        }
      } catch(e) {
        console.warn(key + ' 로드 실패:', e);
      }
    }
    console.log('✅ Firebase 데이터 로드 완료');
  }
}


function loadFromLocalStorage() {
  console.log('📁 localStorage 데이터 로드 시작');
  
  try {
    var savedService = localStorage.getItem('ch2_serviceList');
    if (savedService) {
      window.serviceList = JSON.parse(savedService);
      serviceList = window.serviceList;
      if (typeof renderServiceView === 'function') renderServiceView();
      console.log('serviceList 로드됨:', serviceList.length);
    }
  } catch(e) {}
  
  try {
    var savedNotices = localStorage.getItem('ch2_notices');
    if (savedNotices) {
      window.notices = JSON.parse(savedNotices);
      notices = window.notices;
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
    }
  } catch(e) {}
  
  try {
    var savedPrayers = localStorage.getItem('ch2_prayers');
    if (savedPrayers) {
      window.prayers = JSON.parse(savedPrayers);
      prayers = window.prayers;
      if (typeof renderPrayers === 'function') renderPrayers();
    }
  } catch(e) {}
}


(function() {
  console.log('🚀 js_storage.js 자동 실행');
  
  loadFromLocalStorage();
  
  setTimeout(function() {
    if (window.FB_READY && typeof firebase !== 'undefined' && firebase.database) {
      fbLoadAll();
      fbSync();
      console.log('✅ Firebase 동기화 시작됨');
    } else {
      console.log('⚠️ Firebase 미준비, localStorage만 사용');
      if (typeof renderServiceView === 'function') renderServiceView();
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
    }
  }, 500);
})();


window.LS = LS;
window.fbUpdateUI = fbUpdateUI;
window.fbSync = fbSync;
window.fbLoadAll = fbLoadAll;


console.log('✅ js_storage.js 로드 완료');