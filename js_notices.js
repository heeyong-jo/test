// ==================== 공지사항 관리 (새로 작성 - 최소 버전) ====================
// 모든 기존 코드 삭제하고 이 코드만 사용


// 공지 데이터 저장소
let notices = [];


// ==================== 공지 작성 모달 열기 ====================
function openAddNotice() {
  console.log('🔧 공지 작성 모달 열기');
  
  // 모달 요소 찾기
  const modal = document.getElementById('modal-notice');
  if (!modal) {
    alert('오류: 공지 모달을 찾을 수 없습니다');
    return;
  }
  
  // 입력 필드 초기화
  const titleInput = document.getElementById('n-title');
  const contentInput = document.getElementById('n-body');
  const catSelect = document.getElementById('n-cat');
  const modalTitle = document.getElementById('notice-modal-title');
  const submitBtn = document.getElementById('notice-submit-btn');
  
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
  if (catSelect) catSelect.value = '📢 일반';
  if (modalTitle) modalTitle.textContent = '📢 공지 작성';
  if (submitBtn) submitBtn.textContent = '등록하기';
  
  // 사진 미리보기 초기화
  const previewDiv = document.getElementById('notice-photo-preview');
  if (previewDiv) previewDiv.innerHTML = '';
  
  // 모달 표시
  modal.style.display = 'flex';
  console.log('✅ 모달 열림');
}


// ==================== 공지 저장 ====================
function saveNotice() {
  console.log('💾 공지 저장 실행');
  
  // 입력값 가져오기
  const title = document.getElementById('n-title')?.value.trim();
  const category = document.getElementById('n-cat')?.value;
  const content = document.getElementById('n-body')?.value.trim();
  
  // 유효성 검사
  if (!title) {
    alert('제목을 입력하세요');
    return;
  }
  if (!content) {
    alert('내용을 입력하세요');
    return;
  }
  
  // 공지 데이터 생성
  const newNotice = {
    id: Date.now().toString(),
    title: title,
    category: category || '📢 일반',
    content: content,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  // localStorage에 저장
  let existingNotices = [];
  try {
    const saved = localStorage.getItem('ch2_notices');
    if (saved) existingNotices = JSON.parse(saved);
  } catch(e) {}
  
  existingNotices.unshift(newNotice);
  localStorage.setItem('ch2_notices', JSON.stringify(existingNotices));
  notices = existingNotices;
  
  // 모달 닫기
  const modal = document.getElementById('modal-notice');
  if (modal) modal.style.display = 'none';
  
  // 화면 갱신
  renderHomeNotices();
  
  alert('✅ 공지사항이 등록되었습니다');
  console.log('저장된 공지 개수:', notices.length);
}


// ==================== 홈 화면 공지 표시 ====================
function renderHomeNotices() {
  console.log('📢 홈 공지 표시 실행');
  
  const container = document.getElementById('home-notices');
  if (!container) {
    console.warn('home-notices 요소 없음');
    return;
  }
  
  // localStorage에서 데이터 읽기
  try {
    const saved = localStorage.getItem('ch2_notices');
    if (saved) {
      notices = JSON.parse(saved);
      console.log('로드된 공지 개수:', notices.length);
    } else {
      notices = [];
      console.log('저장된 공지 없음');
    }
  } catch(e) {
    notices = [];
  }
  
  // 공지가 없으면 메시지 표시
  if (notices.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--text2);">
        📢 등록된 공지가 없습니다<br>
        <span style="font-size:12px;">➕ 공지 작성 버튼을 클릭하여 공지를 등록하세요</span>
      </div>
    `;
    return;
  }
  
  // 최근 3개 공지 표시
  let html = '';
  const recentNotices = notices.slice(0, 3);
  
  for (let i = 0; i < recentNotices.length; i++) {
    const notice = recentNotices[i];
    const preview = notice.content.length > 80 ? notice.content.substring(0, 80) + '...' : notice.content;
    const date = formatDate(notice.timestamp);
    
    html += `
      <div class="notice-row" onclick="viewNotice('${notice.id}')" style="cursor:pointer;">
        <div class="notice-head">
          <div class="notice-title">${escapeHtml(notice.title)}</div>
          <div class="notice-date">${date}</div>
        </div>
        <div class="notice-body">${escapeHtml(preview)}</div>
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // 더보기 버튼
  if (notices.length > 3) {
    container.innerHTML += `
      <div style="text-align:center; padding:12px;">
        <button class="btn-secondary" onclick="showAllNotices()">📋 모든 공지 보기 (${notices.length}개)</button>
      </div>
    `;
  }
}


// ==================== 공지 상세 보기 ====================
function viewNotice(noticeId) {
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) {
    alert('공지를 찾을 수 없습니다');
    return;
  }
  
  alert(`📢 ${notice.title}\n\n${notice.content}`);
}


// ==================== 모든 공지 보기 ====================
function showAllNotices() {
  if (notices.length === 0) {
    alert('등록된 공지가 없습니다');
    return;
  }
  
  let message = '📢 전체 공지사항\n\n';
  for (let i = 0; i < notices.length; i++) {
    const n = notices[i];
    message += `${i+1}. ${n.title}\n   ${n.content.substring(0, 50)}...\n\n`;
  }
  alert(message);
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
  if (diff < 604800000) return Math.floor(diff / 86400000) + '일 전';
  return (date.getMonth() + 1) + '.' + date.getDate();
}


// ==================== HTML 이스케이프 ====================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}


// ==================== 테스트 공지 추가 (개발용) ====================
function addTestNotice() {
  const testNotice = {
    id: 'test_' + Date.now(),
    title: '📢 테스트 공지입니다',
    category: '📢 일반',
    content: '공지사항 기능이 정상 작동하고 있습니다. "➕ 공지 작성" 버튼을 클릭하여 새 공지를 등록할 수 있습니다.',
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  let existing = [];
  try {
    const saved = localStorage.getItem('ch2_notices');
    if (saved) existing = JSON.parse(saved);
  } catch(e) {}
  
  existing.unshift(testNotice);
  localStorage.setItem('ch2_notices', JSON.stringify(existing));
  notices = existing;
  renderHomeNotices();
  console.log('✅ 테스트 공지 추가됨');
}


// ==================== 전역 등록 ====================
window.openAddNotice = openAddNotice;
window.saveNotice = saveNotice;
window.viewNotice = viewNotice;
window.showAllNotices = showAllNotices;
window.renderHomeNotices = renderHomeNotices;
window.addTestNotice = addTestNotice;


// 페이지 로드 시 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderHomeNotices);
} else {
  renderHomeNotices();
}


console.log('✅ 공지사항 JS 로드 완료 (새로 작성)');