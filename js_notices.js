// ==================== 공지사항 관리 ====================
// 최종 수정본 - 전역 함수 등록 완료


let notices = [];


// 공지 작성 모달 열기
function openAddNotice() {
  console.log('openAddNotice 실행 - 관리자 모드');
  
  const modal = document.getElementById('modal-notice');
  if (!modal) {
    console.error('modal-notice 요소 없음');
    alert('모달을 찾을 수 없습니다.');
    return;
  }
  
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
  
  modal.style.display = 'flex';
  console.log('✅ 공지 작성 모달 열림');
}


// 공지사항 저장
async function saveNotice() {
  console.log('saveNotice 실행');
  
  const titleEl = document.getElementById('n-title');
  const catEl = document.getElementById('n-cat');
  const bodyEl = document.getElementById('n-body');
  const editIdEl = document.getElementById('n-edit-id');
  
  if (!titleEl || !bodyEl) {
    alert('폼 요소를 찾을 수 없습니다');
    return;
  }
  
  const title = titleEl.value.trim();
  const category = catEl ? catEl.value : '📢 일반';
  const content = bodyEl.value.trim();
  const editId = editIdEl ? editIdEl.value : '';
  
  if (!title || !content) {
    alert('제목과 내용을 입력하세요');
    return;
  }
  
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
    if (window.FB_READY && typeof firebase !== 'undefined' && firebase.database) {
      const noticesRef = firebase.database().ref('notices');
      
      if (editId) {
        await noticesRef.child(editId).update(noticeData);
        alert('✅ 공지사항이 수정되었습니다');
      } else {
        const newRef = noticesRef.push();
        noticeData.id = newRef.key;
        await newRef.set(noticeData);
        alert('✅ 공지사항이 등록되었습니다');
      }
      
      // 모달 닫기
      const modal = document.getElementById('modal-notice');
      if (modal) modal.style.display = 'none';
      
      // 입력 필드 초기화
      titleEl.value = '';
      bodyEl.value = '';
      if (editIdEl) editIdEl.value = '';
      const previewDiv = document.getElementById('notice-photo-preview');
      if (previewDiv) previewDiv.innerHTML = '';
      window._noticeResizedPhotos = null;
      
      // 목록 새로고침
      await loadNoticesFromFirebase();
      
    } else {
      alert('Firebase 연결이 필요합니다.');
    }
  } catch (error) {
    console.error('저장 실패:', error);
    alert('저장 실패: ' + error.message);
  }
}


// Firebase에서 공지사항 로드
async function loadNoticesFromFirebase() {
  console.log('loadNoticesFromFirebase 실행');
  
  if (!window.FB_READY || typeof firebase === 'undefined' || !firebase.database) {
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
    }
    
    if (typeof renderHomeNotices === 'function') renderHomeNotices();
  } catch (error) {
    console.error('Firebase 공지사항 로드 실패:', error);
    loadNoticesFromLocal();
  }
}


// localStorage에서 공지사항 로드
function loadNoticesFromLocal() {
  try {
    const saved = localStorage.getItem('ch2_notices');
    notices = saved ? JSON.parse(saved) : [];
    console.log('localStorage에서 공지사항 로드:', notices.length);
  } catch(e) {
    notices = [];
  }
  
  if (typeof renderHomeNotices === 'function') renderHomeNotices();
}


// 홈 화면 공지 렌더링
function renderHomeNotices() {
  const container = document.getElementById('home-notices');
  if (!container) return;
  
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


function viewNotice(noticeId) {
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) {
    alert('공지사항을 찾을 수 없습니다.');
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


function showAllNotices() {
  if (!notices || notices.length === 0) {
    alert('등록된 공지가 없습니다.');
    return;
  }
  
  let msg = '📢 전체 공지사항\n\n';
  for (let i = 0; i < notices.length; i++) {
    msg += (i + 1) + '. ' + notices[i].title + '\n   ' + notices[i].content.substring(0, 50) + '...\n   (' + formatNoticeDate(notices[i].timestamp) + ')\n\n';
  }
  alert(msg);
}


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
      alert(file.name + '은 3MB를 초과하여 제외됩니다.');
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


function resizeImage(file, maxW, maxH, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width, height = img.height;
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
  loadNoticesFromLocal();
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    loadNoticesFromFirebase();
  }
}


// ==================== 전역 함수 등록 (매우 중요!) ====================
window.openAddNotice = openAddNotice;
window.saveNotice = saveNotice;
window.viewNotice = viewNotice;
window.closeNoticeView = closeNoticeView;
window.showAllNotices = showAllNotices;
window.noticePhotoPreview = noticePhotoPreview;
window.deleteNotice = deleteNotice;
window.openEditNotice = openEditNotice;


// DOMContentLoaded에서 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotices);
} else {
  initNotices();
}


console.log('✅ js_notices.js 로드 완료 - 모든 함수 전역 등록됨');