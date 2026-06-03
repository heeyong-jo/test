// ==================== 공지사항 관리 ====================


// 전역 변수
let notices = [];


// 공지사항 저장 (Firebase + localStorage)
async function saveNotice() {
  const title = document.getElementById('n-title').value.trim();
  const category = document.getElementById('n-cat').value;
  const content = document.getElementById('n-body').value.trim();
  const editId = document.getElementById('n-edit-id').value;
  
  if (!title || !content) {
    showToast('제목과 내용을 입력하세요');
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
    // 1. Firebase에 저장
    if (window.FB_READY && typeof firebase !== 'undefined') {
      const noticesRef = firebase.database().ref('notices');
      
      if (editId) {
        // 수정 모드
        await noticesRef.child(editId).update(noticeData);
        showToast('✅ 공지사항이 수정되었습니다');
      } else {
        // 새 공지
        const newRef = noticesRef.push();
        noticeData.id = newRef.key;
        await newRef.set(noticeData);
        showToast('✅ 공지사항이 등록되었습니다');
      }
      
      // 2. localStorage에도 저장 (백업)
      await loadNoticesFromFirebase();
      
    } else {
      // Firebase 미연결 시 localStorage에만 저장
      console.warn('Firebase 연결 안됨, localStorage에만 저장');
      const savedNotices = localStorage.getItem('ch2_notices');
      let localNotices = savedNotices ? JSON.parse(savedNotices) : [];
      
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
      showToast('✅ 로컬에 저장되었습니다 (Firebase 미연결)');
    }
    
    // 모달 닫기 및 초기화
    closeModal('modal-notice');
    document.getElementById('n-title').value = '';
    document.getElementById('n-body').value = '';
    document.getElementById('n-edit-id').value = '';
    document.getElementById('notice-photo-preview').innerHTML = '';
    window._noticeResizedPhotos = null;
    
    // 목록 새로고침
    if (typeof renderHomeNotices === 'function') {
      renderHomeNotices();
    }
    if (typeof renderNoticeList === 'function') {
      renderNoticeList();
    }
    
  } catch (error) {
    console.error('공지사항 저장 실패:', error);
    showToast('❌ 저장 실패: ' + error.message);
  }
}


// Firebase에서 공지사항 로드
async function loadNoticesFromFirebase() {
  if (!window.FB_READY || typeof firebase === 'undefined') {
    console.warn('Firebase 미준비, localStorage에서 로드');
    loadNoticesFromLocal();
    return;
  }
  
  try {
    const snapshot = await firebase.database().ref('notices').once('value');
    const data = snapshot.val();
    
    if (data) {
      // 객체를 배열로 변환
      const noticesArray = Object.entries(data).map(([key, value]) => ({
        id: key,
        ...value
      }));
      
      // 최신순 정렬
      noticesArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      notices = noticesArray;
      
      // localStorage에도 백업
      localStorage.setItem('ch2_notices', JSON.stringify(notices));
      console.log('✅ 공지사항 로드 완료:', notices.length);
    } else {
      notices = [];
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


// localStorage에서 공지사항 로드
function loadNoticesFromLocal() {
  try {
    const saved = localStorage.getItem('ch2_notices');
    if (saved) {
      notices = JSON.parse(saved);
      console.log('localStorage에서 공지사항 로드:', notices.length);
    } else {
      notices = [];
    }
  } catch(e) {
    notices = [];
  }
  
  if (typeof renderHomeNotices === 'function') {
    renderHomeNotices();
  }
}


// 공지사항 삭제
async function deleteNotice(noticeId) {
  if (!confirm('공지사항을 삭제하시겠습니까?')) return;
  
  try {
    if (window.FB_READY && typeof firebase !== 'undefined') {
      await firebase.database().ref(`notices/${noticeId}`).remove();
      showToast('🗑 공지사항이 삭제되었습니다');
      await loadNoticesFromFirebase();
    } else {
      // localStorage에서 삭제
      notices = notices.filter(n => n.id !== noticeId);
      localStorage.setItem('ch2_notices', JSON.stringify(notices));
      showToast('🗑 로컬에서 삭제되었습니다');
      
      if (typeof renderHomeNotices === 'function') {
        renderHomeNotices();
      }
    }
  } catch (error) {
    console.error('삭제 실패:', error);
    showToast('❌ 삭제 실패: ' + error.message);
  }
}


// 공지사항 수정 모달 열기
function openEditNotice(noticeId) {
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) return;
  
  document.getElementById('n-title').value = notice.title || '';
  document.getElementById('n-cat').value = notice.category || '📢 일반';
  document.getElementById('n-body').value = notice.content || '';
  document.getElementById('n-edit-id').value = notice.id;
  document.getElementById('notice-modal-title').textContent = '✏️ 공지 수정';
  document.getElementById('notice-submit-btn').textContent = '수정하기';
  
  // 사진 미리보기 (있는 경우)
  const previewDiv = document.getElementById('notice-photo-preview');
  if (previewDiv && notice.photos && notice.photos.length) {
    previewDiv.innerHTML = '';
    notice.photos.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.margin = '4px';
      previewDiv.appendChild(img);
    });
    window._noticeResizedPhotos = notice.photos;
  }
  
  document.getElementById('modal-notice').style.display = 'flex';
}


// 공지 작성 모달 열기
function openAddNotice() {
  document.getElementById('n-title').value = '';
  document.getElementById('n-cat').value = '📢 일반';
  document.getElementById('n-body').value = '';
  document.getElementById('n-edit-id').value = '';
  document.getElementById('notice-photo-preview').innerHTML = '';
  document.getElementById('notice-modal-title').textContent = '📢 공지 작성';
  document.getElementById('notice-submit-btn').textContent = '등록하기';
  window._noticeResizedPhotos = null;
  document.getElementById('modal-notice').style.display = 'flex';
}


// 홈 화면 공지 렌더링
function renderHomeNotices() {
  const container = document.getElementById('home-notices');
  if (!container) return;
  
  if (!notices || notices.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text2);">📢 등록된 공지가 없습니다</div>';
    return;
  }
  
  // 최근 3개만 표시
  const recentNotices = notices.slice(0, 3);
  
  container.innerHTML = recentNotices.map(notice => `
    <div class="notice-row" onclick="viewNotice('${notice.id}')" style="cursor:pointer;">
      <div class="notice-head">
        <div class="notice-title">${escapeHtml(notice.title)}</div>
        <div class="notice-date">${formatNoticeDate(notice.timestamp)}</div>
      </div>
      <div class="notice-body">${escapeHtml(notice.content).substring(0, 80)}${notice.content.length > 80 ? '...' : ''}</div>
    </div>
  `).join('');
  
  // 더보기 버튼 (공지가 3개 이상일 때)
  if (notices.length > 3) {
    container.innerHTML += `<div style="text-align:center;padding:12px;"><button class="btn-secondary" onclick="showAllNotices()">📋 모든 공지 보기 (${notices.length}개)</button></div>`;
  }
}


// 날짜 포맷
function formatNoticeDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return Math.floor(diff / 60000) + '분 전';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '시간 전';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '일 전';
  
  return `${date.getMonth()+1}.${date.getDate()}`;
}


// 공지 상세 보기
function viewNotice(noticeId) {
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) return;
  
  document.getElementById('notice-view-title').textContent = notice.title;
  
  // 사진 표시
  const photosDiv = document.getElementById('notice-view-photos');
  if (notice.photos && notice.photos.length) {
    photosDiv.innerHTML = notice.photos.map(src => 
      `<img src="${src}" style="width:100%;border-radius:12px;margin-bottom:8px;" onclick="window.open(this.src)">`
    ).join('');
  } else {
    photosDiv.innerHTML = '';
  }
  
  document.getElementById('notice-view-content').innerHTML = notice.content.replace(/\n/g, '<br>');
  document.getElementById('notice-view-date').textContent = formatNoticeDate(notice.timestamp);
  document.getElementById('modal-notice-view').style.display = 'flex';
}


function closeNoticeView() {
  document.getElementById('modal-notice-view').style.display = 'none';
}


function showAllNotices() {
  // 모든 공지 보기 (간단히 alert로 표시)
  let msg = '📢 전체 공지사항\n\n';
  notices.forEach((n, i) => {
    msg += `${i+1}. ${n.title}\n   ${n.content.substring(0, 50)}...\n   (${formatNoticeDate(n.timestamp)})\n\n`;
  });
  alert(msg);
}


// 사진 미리보기
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
      alert(`${file.name}은 3MB를 초과하여 제외됩니다.`);
      continue;
    }
    
    try {
      const dataUrl = await resizeImage(file, 800, 600, 0.8);
      resizedPhotos.push(dataUrl);
      
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.margin = '4px';
      previewDiv.appendChild(img);
    } catch (err) {
      console.error('이미지 리사이즈 실패:', err);
    }
  }
  
  window._noticeResizedPhotos = resizedPhotos;
}


// 이미지 리사이즈 함수
function resizeImage(file, maxW, maxH, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
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
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


// 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (window.FB_READY) {
      loadNoticesFromFirebase();
    } else {
      loadNoticesFromLocal();
    }
  });
} else {
  if (window.FB_READY) {
    loadNoticesFromFirebase();
  } else {
    loadNoticesFromLocal();
  }
}


console.log('✅ js_notices.js 로드 완료');