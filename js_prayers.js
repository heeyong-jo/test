// ==================== 기도제목 ====================


// prayers 배열을 안전하게 참조 (전역 변수 사용)
function getPrayers() {
  // 전역 prayers 변수 우선 사용 (js_storage.js에서 정의)
  if (typeof prayers !== 'undefined') {
    return prayers;
  }
  return window.prayers || [];
}


function setPrayers(newPrayers) {
  // 전역 prayers 변수에 저장
  if (typeof prayers !== 'undefined') {
    window.prayers = newPrayers;
    prayers = newPrayers;
  } else {
    window.prayers = newPrayers;
  }
  if (typeof LS !== 'undefined') {
    LS.save('prayers', newPrayers);
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
  
  // ✅ 전역 prayers 변수 우선 사용
  let safePrayers = [];
  if (typeof prayers !== 'undefined' && Array.isArray(prayers)) {
    safePrayers = prayers;
  } else if (window.prayers && Array.isArray(window.prayers)) {
    safePrayers = window.prayers;
  }
  
  console.log('기도제목 개수:', safePrayers.length);
  
  if (!safePrayers.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:40px;">아직 기도제목이 없습니다. 첫 번째 기도제목을 작성해보세요!</div>';
    return;
  }
  
  // ✅ currentUser는 전역 변수 사용
  const user = (typeof currentUser !== 'undefined') ? currentUser : window.currentUser;
  const canDelete = user && (user.role === 'admin' || user.role === 'manager');
  
  el.innerHTML = safePrayers.map(p => `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <div>
          <span style="font-weight:700;font-size:14px;color:var(--text);">${escapeHtml(p.author || '익명')}</span>
          <span style="font-size:10px;color:var(--text2);margin-left:8px;">${p.date || ''}</span>
          ${p.title ? `<div style="font-size:12px;font-weight:600;color:var(--purple);margin-top:4px;">${escapeHtml(p.title)}</div>` : ''}
        </div>
        ${(user && (user.name === p.author || canDelete)) ? `<button onclick="deletePrayer(${p.id})" style="background:none;border:none;color:var(--red);font-size:12px;cursor:pointer;">🗑</button>` : ''}
      </div>
      <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px;">${escapeHtml(p.content)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
          <button onclick="togglePrayerLike(${p.id})" style="background:none;border:none;font-size:12px;color:var(--text2);cursor:pointer;">❤️ ${p.likes || 0}</button>
          <span style="font-size:11px;color:var(--text2);">💬 ${p.comments || 0}</span>
        </div>
        <button onclick="prayForThis(${p.id})" style="background:var(--bg2);border:none;border-radius:30px;padding:6px 14px;font-size:11px;font-weight:600;color:var(--purple);cursor:pointer;">🤲 기도하기</button>
      </div>
    </div>
  `).join('');
}


// 기도제목 작성 모달 열기
function openAddPrayer() {
  // ✅ currentUser는 전역 변수 사용
  const user = (typeof currentUser !== 'undefined') ? currentUser : window.currentUser;
  if (!user) { 
    showToast('로그인이 필요합니다'); 
    document.getElementById('screen-login').style.display = 'flex';
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
  // ✅ currentUser는 전역 변수 사용
  const user = (typeof currentUser !== 'undefined') ? currentUser : window.currentUser;
  if (!user) {
    showToast('로그인이 필요합니다');
    return;
  }
  
  const content = document.getElementById('prayer-content').value.trim();
  if (!content) { 
    showToast('기도 내용을 입력하세요'); 
    return; 
  }
  
  const newPrayer = {
    id: Date.now(),
    author: user.name || user.id || '익명',
    title: document.getElementById('prayer-title').value.trim(),
    content: content,
    date: new Date().toISOString().slice(0, 10),
    likes: 0,
    comments: 0,
    createdAt: Date.now()
  };
  
  // ✅ 전역 prayers 변수에 저장
  if (typeof prayers === 'undefined') {
    var prayers = [];
  }
  prayers.unshift(newPrayer);
  
  // window.prayers도 동기화
  window.prayers = prayers;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', prayers);
  }
  
  renderPrayers();
  closeModal('modal-prayer');
  showToast('✅ 기도제목이 등록되었습니다');
}


// 좋아요 토글
function togglePrayerLike(id) {
  // ✅ 전역 prayers 변수 사용
  let prayersArray = (typeof prayers !== 'undefined') ? prayers : window.prayers;
  if (!prayersArray) return;
  
  const p = prayersArray.find(p => p.id === id);
  if (!p) return;
  p.likes = (p.likes || 0) + 1;
  
  if (typeof prayers !== 'undefined') {
    prayers = prayersArray;
  }
  window.prayers = prayersArray;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', prayersArray);
  }
  renderPrayers();
}


// 기도하기 (댓글 수 증가)
function prayForThis(id) {
  // ✅ 전역 prayers 변수 사용
  let prayersArray = (typeof prayers !== 'undefined') ? prayers : window.prayers;
  if (!prayersArray) return;
  
  const p = prayersArray.find(p => p.id === id);
  if (!p) return;
  p.comments = (p.comments || 0) + 1;
  
  if (typeof prayers !== 'undefined') {
    prayers = prayersArray;
  }
  window.prayers = prayersArray;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', prayersArray);
  }
  renderPrayers();
  showToast('🤲 기도해주셨습니다');
}


// 기도제목 삭제
function deletePrayer(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  
  // ✅ 전역 prayers 변수 사용
  let prayersArray = (typeof prayers !== 'undefined') ? prayers : window.prayers;
  if (!prayersArray) return;
  
  prayersArray = prayersArray.filter(p => p.id !== id);
  
  if (typeof prayers !== 'undefined') {
    prayers = prayersArray;
  }
  window.prayers = prayersArray;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', prayersArray);
  }
  renderPrayers();
  showToast('🗑 삭제되었습니다');
}