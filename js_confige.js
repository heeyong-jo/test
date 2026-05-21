// ==================== Firebase 설정 ====================
const firebaseConfig = {
  apiKey: "AIzaSyDLn693_LIAnQWyWDzpLjPukJ2joYpndPw",
  authDomain: "gajwajeil-add45.firebaseapp.com",
  databaseURL: "https://gajwajeil-add45-default-rtdb.firebaseio.com",
  projectId: "gajwajeil-add45",
  storageBucket: "gajwajeil-add45.firebasestorage.app",
  messagingSenderId: "725343965690",
  appId: "1:725343965690:web:553d8916ad406c4daed443"
};


// ✅ Promise 기반 초기화
let FB_READY = false;
let firebaseInitPromise = null;


function initFirebase() {
  if (firebaseInitPromise) return firebaseInitPromise;
  
  firebaseInitPromise = new Promise((resolve, reject) => {
    // 이미 초기화되었는지 확인
    if (FB_READY) {
      resolve();
      return;
    }
    
    try {
      if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        // 이미 초기화된 앱이 있는지 확인
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        FB_READY = true;
        console.log('✅ Firebase 연결 성공');
        resolve();
      } else {
        reject(new Error('Firebase SDK가 로드되지 않음'));
      }
    } catch(e) {
      console.error('Firebase 초기화 실패:', e);
      reject(e);
    }
  });
  
  return firebaseInitPromise;
}


// ✅ Firebase 준비 상태 확인 함수
async function waitForFirebase() {
  try {
    await initFirebase();
    return true;
  } catch(e) {
    console.error('Firebase 준비 실패:', e);
    return false;
  }
}


// 기존 전역 변수 유지 (호환성)
window.FB_READY = FB_READY;
window.initFirebase = initFirebase;
window.waitForFirebase = waitForFirebase;