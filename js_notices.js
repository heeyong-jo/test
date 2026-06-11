// ==================== 공지사항 관리 (수정본) ====================


let notices = [];


// ==================== 현재 사용자 가져오기 ====================
function getCurrentUserForNotice() {
  if (typeof window.currentUser !== 'undefined' && window.currentUser) return window.currentUser;
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  // localStorage에서 직접 확인
  try {
    const saved = localStorage.getItem('ch2_currentUser');
    if (saved) {
      const user = JSON.parse(saved);
      console.log('localStorage에서 사용자 복원:', user);
      return user;
    }
  } catch(e) {}
  return null;
}


// ==================== 공지 작성 모달 열기 (수정) ====================
function openAddNotice() {
  console.log('🔧 openAddNotice 실행 - 시작');
  
  // 권한 체크 (관리자 또는 매니저만)
  const user = getCurrentUserForNotice();
  console.log('현재 사용자:', user);
  
  if (!user) {
    console.log('로그인 필요');
    if (typeof showToast === 'function') {
      showToast('로그인이 필요합니다.');
    } else {
      alert('로그인이 필요합니다.');
    }
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  console.log('사용자 역할:', user.role);
  
  if (user.role !== 'admin' && user.role !== 'manager') {
    console.log('권한 없음 - 관리자/매니저 아님');
    if (typeof showToast === 'function') {
      showToast('⚠️ 관리자 또는 매니저만 공지를 작성할 수 있습니다.');
    } else {
      alert('관리자 또는 매니저만 공지를 작성할 수 있습니다.');
    }
    return;
  }
  
  console.log('✅ 권한 확인됨, 모달 열기');
  
  // 모달 요소 확인
  const modal = document.getElementById('modal-notice');
  if (!modal) {
    console.error('❌ modal-notice 요소를 찾을 수 없습니다!');
    alert('모달을 찾을 수 없습니다. 페이지를 새로고침 해보세요.');
    return;
  }
  
  // 입력 필드 초기화
  const titleEl = document.getElementById('n-title');
  const catEl = document.getElementById('n-cat');
  const bodyEl = document.getElementById('n-body');
  const editIdEl = document.getElementById('n-edit-id');
  const modalTitleEl = document.getElementById('notice-modal-title');
  const submitBtnEl = document.getElementById('notice-submit-btn');
  const previewDiv = document.getElementById('notice-photo-preview');
  
  if (titleEl) titleEl.value = '';
  if (catEl) catEl.value = '📢 일반';
  if (bodyEl) bodyEl.value = '';
  if (editIdEl) editIdEl.value = '';
  if (modalTitleEl) modalTitleEl.textContent = '📢 공지 작성';
  if (submitBtnEl) submitBtnEl.textContent = '등록하기';
  if (previewDiv) previewDiv.innerHTML = '';
  
  window._noticeResizedPhotos = null;
  
  // 모달 표시
  modal.style.display = 'flex';
  console.log('✅ 공지 작성 모달 열림');
}


// ==================== 공지사항 저장 (수정 - 더 자세한 로깅) ====================
async function saveNotice() {
  console.log('💾 saveNotice 실행 - 저장 시작');
  
  const titleEl = document.getElementById('n-title');
  const categoryEl = document.getElementById('n-cat');
  const contentEl = document.getElementById('n-body');
  const editIdEl = document.getElementById('n-edit-id');
  
  if (!titleEl || !contentEl) {
    console.error('폼 요소 없음:', { titleEl, contentEl });
    if (typeof showToast === 'function') {
      showToast('폼 요소를 찾을 수 없습니다');
    }
    return;
  }
  
  const title = titleEl.value.trim();
  const category = categoryEl ? categoryEl.value : '📢 일반';
  const content = contentEl.value.trim();
  const editId = editIdEl ? editIdEl.value : '';
  
  console.log('공지 데이터:', { title, category, contentLength: content.length, editId });
  
  if (!title || !content) {
    console.log('제목 또는 내용 없음');
    if (typeof showToast === 'function') {
      showToast('제목과 내용을 입력하세요');
    }
    return;
  }
  
  // 사진 처리
  let photos = [];
  if (window._noticeResizedPhotos && window._noticeResizedPhotos.length) {
    photos = window._noticeResizedPhotos;
    console.log('사진 개수:', photos.length);
  }
  
  const noticeData = {
    title: title,
    category: category,
    content: content,
    photos: photos,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  if (editId) {
    noticeData.id = editId;
    noticeData.updatedAt = Date.now();
  }
  
  try {
    // Firebase 저장 시도
    if (window.FB_READY && typeof firebase !== 'undefined' && firebase.database) {
      console.log('Firebase 저장 시도...');
      const noticesRef = firebase.database().ref('notices');
      
      if (editId) {
        await noticesRef.child(editId).update(noticeData);
        console.log('Firebase 수정 완료');
        if (typeof showToast === 'function') showToast('✅ 공지사항이 수정되었습니다');
      } else {
        const newRef = noticesRef.push();
        noticeData.id = newRef.key;
        await newRef.set(noticeData);
        console.log('Firebase 저장 완료, ID:', newRef.key);
        if (typeof showToast === 'function') showToast('✅ 공지사항이 등록되었습니다');
      }
      
      // 다시 로드하여 UI 갱신
      await loadNoticesFromFirebase();
    } else {
      // localStorage에만 저장 (백업)
      console.warn('Firebase 연결 안됨, localStorage에 저장');
      let localNotices = [];
      try {
        const saved = localStorage.getItem('ch2_notices');
        localNotices = saved ? JSON.parse(saved) : [];
      } catch(e) {}
      
      if (editId) {
        const index = localNotices.findIndex(n => n.id === editId);
        if (index !== -1) {
          localNotices[index] = { ...localNotices[index], ...noticeData };
          console.log('localStorage 수정 완료');
        }
      } else {
        noticeData.id = Date.now().toString();
        localNotices.unshift(noticeData);
        console.log('localStorage 저장 완료, ID:', noticeData.id);
      }
      
      localStorage.setItem('ch2_notices', JSON.stringify(localNotices));
      notices = localNotices;
      if (typeof showToast === 'function') showToast('✅ 로컬에 저장되었습니다');
      
      // UI 갱신
      if (typeof renderHomeNotices === 'function') {
        renderHomeNotices();
      } else {
        console.warn('renderHomeNotices 함수 없음');
        // 직접 호출 시도
        renderHomeNoticesDirect();
      }
    }
    
    // 모달 닫기 및 초기화
    const modal = document.getElementById('modal-notice');
    if (modal) modal.style.display = 'none';
    
    if (titleEl) titleEl.value = '';
    if (contentEl) contentEl.value = '';
    if (editIdEl) editIdEl.value = '';
    
    const previewDiv = document.getElementById('notice-photo-preview');
    if (previewDiv) previewDiv.innerHTML = '';
    window._noticeResizedPhotos = null;
    
  } catch (error) {
    console.error('❌ 공지사항 저장 실패:', error);
    if (typeof showToast === 'function') {
      showToast('❌ 저장 실패: ' + error.message);
    } else {
      alert('저장 실패: ' + error.message);
    }
  }
}


// ==================== 직접 렌더링 함수 (백업) ====================
function renderHomeNoticesDirect() {
  console.log('📢 renderHomeNoticesDirect 실행');
  
  const container = document.getElementById('home-notices');
  if (!container) {
    console.warn('home-notices 요소 없음');
    return;
  }
  
  if (!notices || notices.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text2);">📢 등록된 공지가 없습니다</div>';
    return;
  }
  
  const recentNotices = notices.slice(0, 3);
  
  let html = '';
  for (let i = 0; i < recentNotices.length; i++) {
    const notice = recentNotices[i];
    html += '<div class="notice-row" onclick="viewNotice(\'' + notice.id + '\')" style="cursor:pointer;">' +
      '<div class="notice-head">' +
        '<div class="notice-title">' + escapeHtml(notice.title) + '</div>' +
        '<div class="notice-date">' + formatNoticeDate(notice.timestamp) + '</div>' +
      '</div>' +
      '<div class="notice-body">' + escapeHtml(notice.content).substring(0, 80) + (notice.content.length > 80 ? '...' : '') + '</div>' +
    '</div>';
  }
  container.innerHTML = html;
  
  if (notices.length > 3) {
    container.innerHTML += '<div style="text-align:center;padding:12px;"><button class="btn-secondary" onclick="showAllNotices()">📋 모든 공지 보기 (' + notices.length + '개)</button></div>';
  }
}


// ==================== 전역 함수 등록 강화 ====================
window.openAddNotice = openAddNotice;
window.saveNotice = saveNotice;
window.deleteNotice = deleteNotice;
window.openEditNotice = openEditNotice;
window.viewNotice = viewNotice;
window.closeNoticeView = closeNoticeView;
window.showAllNotices = showAllNotices;
window.noticePhotoPreview = noticePhotoPreview;
window.renderHomeNotices = renderHomeNoticesDirect; // 강제 연결
window.loadNoticesFromFirebase = loadNoticesFromFirebase;


// 페이지 로드 시 공지사항 로드
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - 공지사항 초기화');
    setTimeout(() => {
      if (window.FB_READY) {
        loadNoticesFromFirebase();
      } else {
        loadNoticesFromLocal();
      }
    }, 500);
  });
} else {
  setTimeout(() => {
    if (window.FB_READY) {
      loadNoticesFromFirebase();
    } else {
      loadNoticesFromLocal();
    }
  }, 500);
}


console.log('✅ js_notices.js 로드 완료 (수정본)');