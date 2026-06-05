// ==================== 기도제목 ====================
// 수정본 - 전역 변수 일관성 유지, 코드 중복 제거


// 전역 prayers 배열 초기화 (안전하게)
if (typeof window.prayers === 'undefined') {
  window.prayers = [];
}
// 전역 prayers 변수 동기화 (다른 파일과의 호환성)
if (typeof prayers === 'undefined') {
  var prayers = window.prayers;
} else {
  window.prayers = prayers;
}


// 현재 사용자 가져오기 (통합 함수)
function getCurrentUser() {
  return (typeof currentUser !== 'undefined' && currentUser) ? currentUser : window.currentUser;
}


function getPrayers() {
  if (!window.prayers) window.prayers = [];
  // 전역 prayers 변수와 동기화
  if (typeof prayers !== 'undefined' && prayers !== window.prayers) {
    window.prayers = prayers;
  }
  return window.prayers;
}


function setPrayers(newPrayers) {
  window.prayers = newPrayers || [];
  // 전역 prayers 변수와 동기화
  if (typeof prayers !== 'undefined') {
    prayers = window.prayers;
  }
  if (typeof LS !== 'undefined') {
    LS.save('prayers', window.prayers);
  }
}


// prayers 배열 동기화 함수
function syncPrayers() {
  if (typeof prayers !== 'undefined' && Array.isArray(prayers)) {
    window.prayers = prayers;
  } else if (window.prayers && Array.isArray(window.prayers)) {
    if (typeof prayers !== 'undefined') prayers = window.prayers;
  }
}


// 기도제목 목록 렌더링
function renderPrayers() {
  console.log('renderPrayers 호출됨');
  
  const el = document.getElementById('prayer-list');
  if (!el) {
    console.log('prayer-list 요소 없음');
    return;
  }
  
  // prayers 배열 동기화
  syncPrayers();
  
  let safePrayers = [];
  if (typeof prayers !== 'undefined' && Array.isArray(prayers) && prayers.length > 0) {
    safePrayers = prayers;
  } else if (window.prayers && Array.isArray(window.prayers) && window.prayers.length > 0) {
    safePrayers = window.prayers;
  }
  
  console.log('기도제목 개수:', safePrayers.length);
  
  if (!safePrayers.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:40px;">🙏 아직 기도제목이 없습니다.<br>첫 번째 기도제목을 작성해보세요!</div>';
    return;
  }
  
  const user = getCurrentUser();
  const canDelete = user && (user.role === 'admin' || user.role === 'manager');
  
  el.innerHTML = safePrayers.map(p => `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <div>
          <span style="font-weight:700;font-size:14px;color:var(--text);">${escapeHtml(p.author || '익명')}</span>
          <span style="font-size:10px;color:var(--text2);margin-left:8px;">${p.date || ''}</span>
          ${p.title ? `<div style="font-size:12px;font-weight:600;color:var(--purple);margin-top:4px;">${escapeHtml(p.title)}</div>` : ''}
        </div>
        ${(user && (user.name === p.author || canDelete)) ? `<button onclick="deletePrayer(${p.id})" style="background:none;border:none;color:var(--red);font-size:12px;cursor:pointer;padding:4px;">🗑</button>` : ''}
      </div>
      <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px;">${escapeHtml(p.content)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
          <button onclick="togglePrayerLike(${p.id})" style="background:none;border:none;font-size:12px;color:var(--text2);cursor:pointer;display:flex;align-items:center;gap:4px;">❤️ <span>${p.likes || 0}</span></button>
          <span style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:4px;">💬 ${p.comments || 0}</span>
        </div>
        <button onclick="prayForThis(${p.id})" style="background:var(--bg2);border:none;border-radius:30px;padding:6px 14px;font-size:11px;font-weight:600;color:var(--purple);cursor:pointer;">🤲 기도하기</button>
      </div>
    </div>
  `).join('');
}


// 기도제목 작성 모달 열기
function openAddPrayer() {
  const user = getCurrentUser();
  if (!user) { 
    if (typeof showToast === 'function') showToast('로그인이 필요합니다'); 
    const loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return; 
  }
  
  const titleInput = document.getElementById('prayer-title');
  const contentInput = document.getElementById('prayer-content');
  
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
  
  const modal = document.getElementById('modal-prayer');
  if (modal) modal.style.display = 'flex';
}


// 기도제목 등록
function submitPrayer() {
  const user = getCurrentUser();
  if (!user) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다');
    return;
  }
  
  const content = document.getElementById('prayer-content').value.trim();
  if (!content) { 
    if (typeof showToast === 'function') showToast('기도 내용을 입력하세요'); 
    return; 
  }
  
  const newPrayer = {
    id: Date.now(),
    author: user.name || user.id || '익명',
    title: document.getElementById('prayer-title').value.trim() || '',
    content: content,
    date: new Date().toISOString().slice(0, 10),
    likes: 0,
    comments: 0,
    createdAt: Date.now()
  };
  
  // prayers 배열 가져오기
  let prayersArray = [];
  if (typeof prayers !== 'undefined' && Array.isArray(prayers)) {
    prayersArray = prayers;
  } else if (window.prayers && Array.isArray(window.prayers)) {
    prayersArray = window.prayers;
  }
  
  prayersArray.unshift(newPrayer);
  
  // 전역 변수에 저장
  if (typeof prayers !== 'undefined') {
    prayers = prayersArray;
  }
  window.prayers = prayersArray;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', prayersArray);
  }
  
  renderPrayers();
  
  if (typeof closeModal === 'function') {
    closeModal('modal-prayer');
  } else {
    const modal = document.getElementById('modal-prayer');
    if (modal) modal.style.display = 'none';
  }
  
  if (typeof showToast === 'function') showToast('✅ 기도제목이 등록되었습니다');
}


// 좋아요 토글
function togglePrayerLike(id) {
  // prayers 배열 가져오기
  let prayersArray = null;
  if (typeof prayers !== 'undefined' && Array.isArray(prayers)) {
    prayersArray = prayers;
  } else if (window.prayers && Array.isArray(window.prayers)) {
    prayersArray = window.prayers;
  }
  
  if (!prayersArray) return;
  
  const p = prayersArray.find(p => p.id === id);
  if (!p) return;
  
  p.likes = (p.likes || 0) + 1;
  
  // 저장
  if (typeof prayers !== 'undefined') {
    prayers = prayersArray;
  }
  window.prayers = prayersArray;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', prayersArray);
  }
  
  renderPrayers();
  
  if (typeof showToast === 'function') showToast('❤️ 기도제목에 공감했습니다');
}


// 기도하기 (댓글 수 증가)
function prayForThis(id) {
  // prayers 배열 가져오기
  let prayersArray = null;
  if (typeof prayers !== 'undefined' && Array.isArray(prayers)) {
    prayersArray = prayers;
  } else if (window.prayers && Array.isArray(window.prayers)) {
    prayersArray = window.prayers;
  }
  
  if (!prayersArray) return;
  
  const p = prayersArray.find(p => p.id === id);
  if (!p) return;
  
  p.comments = (p.comments || 0) + 1;
  
  // 저장
  if (typeof prayers !== 'undefined') {
    prayers = prayersArray;
  }
  window.prayers = prayersArray;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', prayersArray);
  }
  
  renderPrayers();
  
  if (typeof showToast === 'function') showToast('🤲 기도해주셨습니다');
}


// 기도제목 삭제
function deletePrayer(id) {
  if (!confirm('이 기도제목을 삭제하시겠습니까?')) return;
  
  // prayers 배열 가져오기
  let prayersArray = null;
  if (typeof prayers !== 'undefined' && Array.isArray(prayers)) {
    prayersArray = prayers;
  } else if (window.prayers && Array.isArray(window.prayers)) {
    prayersArray = window.prayers;
  }
  
  if (!prayersArray) return;
  
  const newPrayers = prayersArray.filter(p => p.id !== id);
  
  // 저장
  if (typeof prayers !== 'undefined') {
    prayers = newPrayers;
  }
  window.prayers = newPrayers;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', newPrayers);
  }
  
  renderPrayers();
  
  if (typeof showToast === 'function') showToast('🗑 기도제목이 삭제되었습니다');
}


// ==================== 초기화 ====================
// localStorage에서 prayers 로드
if (typeof LS !== 'undefined') {
  try {
    const savedPrayers = LS.load('prayers', null);
    if (savedPrayers && Array.isArray(savedPrayers)) {
      window.prayers = savedPrayers;
      if (typeof prayers !== 'undefined') prayers = savedPrayers;
      console.log('✅ 기도제목 로드 완료:', window.prayers.length);
    }
  } catch(e) {
    console.error('기도제목 로드 실패:', e);
  }
}


console.log('✅ js_prayers.js 로드 완료 (수정본)');