// ==================== 기도제목 ====================


// prayers 배열을 안전하게 참조하는 함수
function getPrayers() {
  return window.prayers || [];
}


function setPrayers(newPrayers) {
  window.prayers = newPrayers;
  if (typeof LS !== 'undefined') {
    LS.save('prayers', window.prayers);
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
  
  const safePrayers = window.prayers || [];
  console.log('기도제목 개수:', safePrayers.length);
  
  if (!safePrayers.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:40px;">아직 기도제목이 없습니다. 첫 번째 기도제목을 작성해보세요!</div>';
    return;
  }
  
  const user = window.currentUser;
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
  const user = window.currentUser;
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
  const user = window.currentUser;
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
  
  if (!window.prayers) window.prayers = [];
  window.prayers.unshift(newPrayer);
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', window.prayers);
  }
  
  renderPrayers();
  closeModal('modal-prayer');
  showToast('✅ 기도제목이 등록되었습니다');
}


// 좋아요 토글
function togglePrayerLike(id) {
  if (!window.prayers) return;
  const p = window.prayers.find(p => p.id === id);
  if (!p) return;
  p.likes = (p.likes || 0) + 1;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', window.prayers);
  }
  renderPrayers();
}


// 기도하기 (댓글 수 증가)
function prayForThis(id) {
  if (!window.prayers) return;
  const p = window.prayers.find(p => p.id === id);
  if (!p) return;
  p.comments = (p.comments || 0) + 1;
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', window.prayers);
  }
  renderPrayers();
  showToast('🤲 기도해주셨습니다');
}


// 기도제목 삭제
function deletePrayer(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  
  if (!window.prayers) return;
  window.prayers = window.prayers.filter(p => p.id !== id);
  
  if (typeof LS !== 'undefined') {
    LS.save('prayers', window.prayers);
  }
  renderPrayers();
  showToast('🗑 삭제되었습니다');
}