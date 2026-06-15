// ==================== 공지사항 관리 (단순화 버전 - 테스트용) ====================


let notices = [];


// ==================== 현재 사용자 가져오기 ====================
function getCurrentUserForNotice() {
  if (window.currentUser) return window.currentUser;
  if (currentUser) return currentUser;
  try {
    const saved = localStorage.getItem('ch2_currentUser');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return null;
}


// ==================== 공지 작성 모달 열기 (권한 체크 생략 - 테스트) ====================
function openAddNotice() {
  console.log('🔧 openAddNotice 실행');
  
  const modal = document.getElementById('modal-notice');
  if (!modal) {
    alert('모달을 찾을 수 없습니다');
    return;
  }
  
  // 입력 필드 초기화
  document.getElementById('n-title').value = '';
  document.getElementById('n-cat').value = '📢 일반';
  document.getElementById('n-body').value = '';
  document.getElementById('n-edit-id').value = '';
  document.getElementById('notice-modal-title').textContent = '📢 공지 작성';
  document.getElementById('notice-submit-btn').textContent = '등록하기';
  document.getElementById('notice-photo-preview').innerHTML = '';
  
  window._noticeResizedPhotos = null;
  
  modal.style.display = 'flex';
  console.log('✅ 공지 작성 모달 열림');
}


// ==================== 공지 저장 ====================
async function saveNotice() {
  console.log('💾 saveNotice 실행');
  
  const title = document.getElementById('n-title').value.trim();
  const category = document.getElementById('n-cat').value;
  const content = document.getElementById('n-body').value.trim();
  
  if (!title || !content) {
    alert('제목과 내용을 입력하세요');
    return;
  }
  
  const noticeData = {
    id: Date.now().toString(),
    title: title,
    category: category,
    content: content,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  // localStorage에 저장
  let localNotices = [];
  try {
    const saved = localStorage.getItem('ch2_notices');
    if (saved) localNotices = JSON.parse(saved);
  } catch(e) {}
  
  localNotices.unshift(noticeData);
  localStorage.setItem('ch2_notices', JSON.stringify(localNotices));
  notices = localNotices;
  
  alert('✅ 공지사항이 등록되었습니다');
  
  // 모달 닫기
  document.getElementById('modal-notice').style.display = 'none';
  
  // 화면 갱신
  renderHomeNotices();
}


// ==================== 공지 목록 표시 ====================
function renderHomeNotices() {
  console.log('📢 renderHomeNotices 실행');
  
  const container = document.getElementById('home-notices');
  if (!container) return;
  
  // localStorage에서 다시 로드
  try {
    const saved = localStorage.getItem('ch2_notices');
    if (saved) notices = JSON.parse(saved);
  } catch(e) { notices = []; }
  
  if (!notices || notices.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text2);">📢 등록된 공지가 없습니다</div>';
    return;
  }
  
  let html = '';
  for (let i = 0; i < Math.min(3, notices.length); i++) {
    const n = notices[i];
    html += `<div class="notice-row" onclick="viewNotice('${n.id}')" style="cursor:pointer;">
      <div class="notice-head">
        <div class="notice-title">${escapeHtml(n.title)}</div>
        <div class="notice-date">${formatDate(n.timestamp)}</div>
      </div>
      <div class="notice-body">${escapeHtml(n.content).substring(0, 80)}${n.content.length > 80 ? '...' : ''}</div>
    </div>`;
  }
  container.innerHTML = html;
}


// ==================== 공지 상세 보기 ====================
function viewNotice(id) {
  const notice = notices.find(n => n.id === id);
  if (!notice) return;
  alert(`📢 ${notice.title}\n\n${notice.content}`);
}


// ==================== 날짜 포맷 ====================
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return Math.floor(diff / 60000) + '분 전';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '시간 전';
  return (date.getMonth() + 1) + '.' + date.getDate();
}


// ==================== XSS 방지 ====================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}


// ==================== 전역 등록 ====================
window.openAddNotice = openAddNotice;
window.saveNotice = saveNotice;
window.viewNotice = viewNotice;
window.renderHomeNotices = renderHomeNotices;


// 초기 로드
renderHomeNotices();


console.log('✅ js_notices.js 로드 완료 (단순화 버전)');