// ==================== 공지사항 관리 ====================
// 최종 수정본 - 매니저 이상만 공지 작성 가능


let notices = [];


// ==================== 현재 사용자 가져오기 ====================
function getCurrentUserForNotice() {
  if (typeof window.currentUser !== 'undefined' && window.currentUser) return window.currentUser;
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  return null;
}


// ==================== 공지 작성 모달 열기 (권한 체크 포함) ====================
function openAddNotice() {
  console.log('openAddNotice 실행');
  
  // 권한 체크 (매니저 이상만)
  const user = getCurrentUserForNotice();
  if (!user) {
    if (typeof showToast === 'function') {
      showToast('로그인이 필요합니다.');
    } else {
      alert('로그인이 필요합니다.');
    }
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  if (user.role !== 'admin' && user.role !== 'manager') {
    if (typeof showToast === 'function') {
      showToast('⚠️ 관리자 또는 매니저만 공지를 작성할 수 있습니다.');
    } else {
      alert('관리자 또는 매니저만 공지를 작성할 수 있습니다.');
    }
    return;
  }
  
  // 모달 열기
  const titleEl = document.getElementById('n-title');
  const catEl = document.getElementById('n-cat');
  const bodyEl = document.getElementById('n-body');
  const editIdEl = document.getElementById('n-edit-id');
  const modalTitleEl = document.getElementById('notice-modal-title');
  const submitBtnEl = document.getElementById('notice-submit-btn');
  const previewDiv = document.getElementById('notice-photo-preview');
  const modal = document.getElementById('modal-notice');
  
  if (!modal) {
    console.error('modal-notice 요소 없음');
    alert('모달을 찾을 수 없습니다.');
    return;
  }
  
  if (titleEl) titleEl.value = '';
  if (catEl) catEl.value = '📢 일반';
  if (bodyEl) bodyEl.value = '';
  if (editIdEl) editIdEl.value = '';
  if (modalTitleEl) modalTitleEl.textContent = '📢 공지 작성';
  if (submitBtnEl) submitBtnEl.textContent = '등록하기';
  if (previewDiv) previewDiv.innerHTML = '';
  
  window._noticeResizedPhotos = null;
  
  modal.style.display = 'flex';
  console.log('✅ 공지 작성 모달 열림 (권한 있음)');
}


// ==================== 공지사항 저장 ====================
async function saveNotice() {
  console.log('saveNotice 실행');
  
  const titleEl = document.getElementById('n-title');
  const categoryEl = document.getElementById('n-cat');
  const contentEl = document.getElementById('n-body');
  const editIdEl = document.getElementById('n-edit-id');
  
  if (!titleEl || !contentEl) {
    if (typeof showToast === 'function') showToast('폼 요소를 찾을 수 없습니다');
    return;
  }
  
  const title = titleEl.value.trim();
  const category = categoryEl ? categoryEl.value : '📢 일반';
  const content = contentEl.value.trim();
  const editId = editIdEl ? editIdEl.value : '';
  
  if (!title || !content) {
    if (typeof showToast === 'function') showToast('제목과 내용을 입력하세요');
    return;
  }
  
  // 사진 처리
  let photos = [];
  if (window._noticeResizedPhotos && window._noticeResizedPhotos.length) {
    photos = window._noticeResizedPhotos;
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
    // Firebase에 저장
    if (window.FB_READY && typeof firebase !== 'undefined' && firebase.database) {
      const noticesRef = firebase.database().ref('notices');
      
      if (editId) {
        await noticesRef.child(editId).update(noticeData);
        if (typeof showToast === 'function') showToast('✅ 공지사항이 수정되었습니다');
      } else {
        const newRef = noticesRef.push();
        noticeData.id = newRef.key;
        await newRef.set(noticeData);
        if (typeof showToast === 'function') showToast('✅ 공지사항이 등록되었습니다');
      }
      
      // 다시 로드하여 UI 갱신
      await loadNoticesFromFirebase();
    } else {
      // localStorage에만 저장
      console.warn('Firebase 연결 안됨, localStorage에만 저장');
      let localNotices = [];
      try {
        const saved = localStorage.getItem('ch2_notices');
        localNotices = saved ? JSON.parse(saved) : [];
      } catch(e) {}
      
      if (editId) {
        const index = localNotices.findIndex(n => n.id === editId);
        if (index !== -1) {
          localNotices[index] = { ...localNotices[index], ...noticeData };
        }
      } else {
        noticeData.id = Date.now().toString();
        localNotices.unshift(noticeData);
      }
      
      localStorage.setItem('ch2_notices', JSON.stringify(localNotices));
      notices = localNotices;
      if (typeof showToast === 'function') showToast('✅ 로컬에 저장되었습니다');
      
      // UI 갱신
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
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
    console.error('공지사항 저장 실패:', error);
    if (typeof showToast === 'function') showToast('❌ 저장 실패: ' + error.message);
  }
}


// ==================== Firebase에서 공지사항 로드 ====================
async function loadNoticesFromFirebase() {
  console.log('loadNoticesFromFirebase 실행');
  
  // Firebase 미준비 시 localStorage에서 로드
  if (!window.FB_READY || typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase 미준비, localStorage에서 로드');
    loadNoticesFromLocal();
    return;
  }
  
  try {
    const snapshot = await firebase.database().ref('notices').once('value');
    const data = snapshot.val();
    
    if (data) {
      const noticesArray = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value
      }));
      noticesArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      notices = noticesArray;
      localStorage.setItem('ch2_notices', JSON.stringify(notices));
      console.log('✅ 공지사항 로드 완료:', notices.length);
    } else {
      notices = [];
      console.log('📢 공지사항 없음');
    }
    
    // UI 업데이트
    if (typeof renderHomeNotices === 'function') {
      renderHomeNotices();
    }
    
  } catch (error) {
    console.error('Firebase 공지사항 로드 실패:', error);
    loadNoticesFromLocal();
  }
}


// ==================== localStorage에서 공지사항 로드 ====================
function loadNoticesFromLocal() {
  console.log('loadNoticesFromLocal実行');
  
  try {
    const saved = localStorage.getItem('ch2_notices');
    if (saved) {
      notices = JSON.parse(saved);
      console.log('localStorage에서 공지사항 로드:', notices.length);
    } else {
      notices = [];
      console.log('저장된 공지사항 없음');
    }
  } catch(e) {
    console.error('localStorage 로드 실패:', e);
    notices = [];
  }
  
  if (typeof renderHomeNotices === 'function') {
    renderHomeNotices();
  }
}


// ==================== 공지사항 삭제 ====================
async function deleteNotice(noticeId) {
  if (!confirm('공지사항을 삭제하시겠습니까?')) return;
  
  // 권한 체크
  const user = getCurrentUserForNotice();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    if (typeof showToast === 'function') showToast('⚠️ 관리자 또는 매니저만 삭제할 수 있습니다.');
    return;
  }
  
  try {
    if (window.FB_READY && typeof firebase !== 'undefined' && firebase.database) {
      await firebase.database().ref(`notices/${noticeId}`).remove();
      if (typeof showToast === 'function') showToast('🗑 공지사항이 삭제되었습니다');
      await loadNoticesFromFirebase();
    } else {
      notices = notices.filter(n => n.id !== noticeId);
      localStorage.setItem('ch2_notices', JSON.stringify(notices));
      if (typeof showToast === 'function') showToast('🗑 삭제되었습니다');
      if (typeof renderHomeNotices === 'function') renderHomeNotices();
    }
  } catch (error) {
    console.error('삭제 실패:', error);
    if (typeof showToast === 'function') showToast('❌ 삭제 실패: ' + error.message);
  }
}


// ==================== 공지사항 수정 모달 ====================
function openEditNotice(noticeId) {
  const user = getCurrentUserForNotice();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    if (typeof showToast === 'function') showToast('⚠️ 관리자 또는 매니저만 수정할 수 있습니다.');
    return;
  }
  
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) {
    if (typeof showToast === 'function') showToast('공지사항을 찾을 수 없습니다');
    return;
  }
  
  const titleEl = document.getElementById('n-title');
  const catEl = document.getElementById('n-cat');
  const bodyEl = document.getElementById('n-body');
  const editIdEl = document.getElementById('n-edit-id');
  const modalTitleEl = document.getElementById('notice-modal-title');
  const submitBtnEl = document.getElementById('notice-submit-btn');
  
  if (titleEl) titleEl.value = notice.title || '';
  if (catEl) catEl.value = notice.category || '📢 일반';
  if (bodyEl) bodyEl.value = notice.content || '';
  if (editIdEl) editIdEl.value = notice.id;
  if (modalTitleEl) modalTitleEl.textContent = '✏️ 공지 수정';
  if (submitBtnEl) submitBtnEl.textContent = '수정하기';
  
  // 사진 미리보기
  const previewDiv = document.getElementById('notice-photo-preview');
  if (previewDiv) {
    previewDiv.innerHTML = '';
    if (notice.photos && notice.photos.length) {
      notice.photos.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width:80px;height:80px;object-fit:cover;border-radius:8px;margin:4px;';
        previewDiv.appendChild(img);
      });
      window._noticeResizedPhotos = notice.photos;
    }
  }
  
  const modal = document.getElementById('modal-notice');
  if (modal) modal.style.display = 'flex';
}


// ==================== 홈 화면 공지 렌더링 ====================
function renderHomeNotices() {
  console.log('renderHomeNotices 실행, notices:', notices?.length);
  
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


// ==================== 날짜 포맷 ====================
function formatNoticeDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return Math.floor(diff / 60000) + '분 전';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '시간 전';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '일 전';
  
  return (date.getMonth() + 1) + '.' + date.getDate();
}


// ==================== 공지 상세 보기 ====================
function viewNotice(noticeId) {
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) {
    if (typeof showToast === 'function') showToast('공지사항을 찾을 수 없습니다');
    return;
  }
  
  const titleEl = document.getElementById('notice-view-title');
  const photosDiv = document.getElementById('notice-view-photos');
  const contentEl = document.getElementById('notice-view-content');
  const dateEl = document.getElementById('notice-view-date');
  const modal = document.getElementById('modal-notice-view');
  
  if (titleEl) titleEl.textContent = notice.title;
  
  if (photosDiv) {
    if (notice.photos && notice.photos.length) {
      let photosHtml = '';
      for (let i = 0; i < notice.photos.length; i++) {
        photosHtml += '<img src="' + notice.photos[i] + '" style="width:100%;border-radius:12px;margin-bottom:8px;cursor:pointer;" onclick="window.open(this.src)">';
      }
      photosDiv.innerHTML = photosHtml;
    } else {
      photosDiv.innerHTML = '';
    }
  }
  
  if (contentEl) contentEl.innerHTML = (notice.content || '').replace(/\n/g, '<br>');
  if (dateEl) dateEl.textContent = formatNoticeDate(notice.timestamp);
  if (modal) modal.style.display = 'flex';
}


function closeNoticeView() {
  const modal = document.getElementById('modal-notice-view');
  if (modal) modal.style.display = 'none';
}


// ==================== 모든 공지 보기 ====================
function showAllNotices() {
  if (!notices || notices.length === 0) {
    if (typeof showToast === 'function') showToast('등록된 공지가 없습니다');
    return;
  }
  
  // 간단한 모달로 표시
  let modal = document.getElementById('all-notices-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'all-notices-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:20000;display:flex;align-items:center;justify-content:center;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background:white;border-radius:20px;width:90%;max-width:500px;max-height:80vh;overflow-y:auto;padding:20px;';
    
    const title = document.createElement('h3');
    title.textContent = '📢 전체 공지사항';
    title.style.cssText = 'margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #ddd;';
    
    const listDiv = document.createElement('div');
    listDiv.id = 'all-notices-list';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '닫기';
    closeBtn.style.cssText = 'margin-top:15px;padding:8px 16px;background:#7a5c38;color:white;border:none;border-radius:8px;cursor:pointer;width:100%;';
    closeBtn.onclick = () => modal.style.display = 'none';
    
    content.appendChild(title);
    content.appendChild(listDiv);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
  }
  
  const listDiv = document.getElementById('all-notices-list');
  if (listDiv) {
    let html = '';
    for (let i = 0; i < notices.length; i++) {
      const notice = notices[i];
      html += '<div style="padding:12px;border-bottom:1px solid #eee;cursor:pointer;" onclick="viewNotice(\'' + notice.id + '\'); document.getElementById(\'all-notices-modal\').style.display=\'none\';">' +
        '<div style="font-weight:700;">' + (i + 1) + '. ' + escapeHtml(notice.title) + '</div>' +
        '<div style="font-size:12px;color:#666;">' + formatNoticeDate(notice.timestamp) + '</div>' +
      '</div>';
    }
    listDiv.innerHTML = html;
  }
  
  modal.style.display = 'flex';
}


// ==================== 사진 미리보기 ====================
async function noticePhotoPreview(input) {
  if (!input.files || input.files.length === 0) return;
  
  const previewDiv = document.getElementById('notice-photo-preview');
  if (!previewDiv) return;
  
  previewDiv.innerHTML = '';
  const files = Array.from(input.files);
  const resizedPhotos = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > 3 * 1024 * 1024) {
      if (typeof showToast === 'function') {
        showToast(file.name + '은 3MB를 초과하여 제외됩니다');
      } else {
        alert(file.name + '은 3MB를 초과하여 제외됩니다.');
      }
      continue;
    }
    
    try {
      const dataUrl = await resizeImage(file, 800, 600, 0.8);
      resizedPhotos.push(dataUrl);
      
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.cssText = 'width:80px;height:80px;object-fit:cover;border-radius:8px;margin:4px;';
      previewDiv.appendChild(img);
    } catch (err) {
      console.error('이미지 리사이즈 실패:', err);
    }
  }
  
  window._noticeResizedPhotos = resizedPhotos;
}


// ==================== 이미지 리사이즈 ====================
function resizeImage(file, maxW, maxH, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
        canvas.remove();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


// ==================== 초기화 ====================
function initNotices() {
  console.log('initNotices 실행');
  
  if (window.FB_READY && typeof firebase !== 'undefined' && firebase.database) {
    loadNoticesFromFirebase();
  } else {
    loadNoticesFromLocal();
    
    if (typeof window.waitForFirebase === 'function') {
      window.waitForFirebase().then(() => {
        console.log('Firebase 준비됨, 공지사항 다시 로드');
        loadNoticesFromFirebase();
      }).catch(() => {});
    }
  }
}


// ==================== 전역 함수 강제 등록 ====================
window.openAddNotice = openAddNotice;
window.saveNotice = saveNotice;
window.deleteNotice = deleteNotice;
window.openEditNotice = openEditNotice;
window.viewNotice = viewNotice;
window.closeNoticeView = closeNoticeView;
window.showAllNotices = showAllNotices;
window.noticePhotoPreview = noticePhotoPreview;
window.renderHomeNotices = renderHomeNotices;
window.loadNoticesFromFirebase = loadNoticesFromFirebase;
window.loadNoticesFromLocal = loadNoticesFromLocal;


// DOMContentLoaded에서 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotices);
} else {
  initNotices();
}


console.log('✅ js_notices.js 로드 완료 - 공지 작성 권한: 매니저 이상');