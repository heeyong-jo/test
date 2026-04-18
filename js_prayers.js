// ==================== 기도제목 ====================


// 기도제목 목록 렌더링
function renderPrayers() {
  const el = document.getElementById('prayer-list');
  if (!el) return;
  const safePrayers = Array.isArray(prayers) ? prayers : [];
  if (!safePrayers.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:40px;">아직 기도제목이 없습니다. 첫 번째 기도제목을 작성해보세요!</div>';
    return;
  }
  const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
  el.innerHTML = safePrayers.map(p => `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <div>
          <span style="font-weight:700;font-size:14px;color:var(--text);">${escapeHtml(p.author)}</span>
          <span style="font-size:10px;color:var(--text2);margin-left:8px;">${p.date}</span>
          ${p.title ? `<div style="font-size:12px;font-weight:600;color:var(--purple);margin-top:4px;">${escapeHtml(p.title)}</div>` : ''}
        </div>
        ${(currentUser && (currentUser.name === p.author || canDelete)) ? `<button onclick="deletePrayer(${p.id})" style="background:none;border:none;color:var(--red);font-size:12px;cursor:pointer;">🗑</button>` : ''}
      </div>
      <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px;">${escapeHtml(p.content)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
          <button onclick="togglePrayerLike(${p.id})" style="background:none;border:none;font-size:12px;color:var(--text2);cursor:pointer;">❤️ ${p.likes}</button>
          <span style="font-size:11px;color:var(--text2);">💬 ${p.comments}</span>
        </div>
        <button onclick="prayForThis(${p.id})" style="background:var(--bg2);border:none;border-radius:30px;padding:6px 14px;font-size:11px;font-weight:600;color:var(--purple);cursor:pointer;">🤲 기도하기</button>
      </div>
    </div>
  `).join('');
}


// 기도제목 작성 모달 열기
function openAddPrayer() {
  if (!currentUser) { showToast('로그인이 필요합니다'); return; }
  document.getElementById('prayer-title').value = '';
  document.getElementById('prayer-content').value = '';
  document.getElementById('modal-prayer').style.display = 'flex';
}


// 기도제목 등록
function submitPrayer() {
  const content = document.getElementById('prayer-content').value.trim();
  if (!content) { showToast('기도 내용을 입력하세요'); return; }
  prayers.unshift({
    id: Date.now(),
    author: currentUser.name,
    title: document.getElementById('prayer-title').value.trim(),
    content: content,
    date: new Date().toISOString().slice(0, 10),
    likes: 0,
    comments: 0
  });
  LS.save('prayers', prayers);
  renderPrayers();
  closeModal('modal-prayer');
  showToast('✅ 기도제목이 등록되었습니다');
}


// 좋아요 토글
function togglePrayerLike(id) {
  const p = prayers.find(p => p.id === id);
  if (!p) return;
  p.likes = (p.likes || 0) + 1;
  LS.save('prayers', prayers);
  renderPrayers();
}


// 기도하기 (댓글 수 증가)
function prayForThis(id) {
  const p = prayers.find(p => p.id === id);
  if (!p) return;
  p.comments = (p.comments || 0) + 1;
  LS.save('prayers', prayers);
  renderPrayers();
  showToast('🤲 기도해주셨습니다');
}


// 기도제목 삭제
function deletePrayer(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  prayers = prayers.filter(p => p.id !== id);
  LS.save('prayers', prayers);
  renderPrayers();
  showToast('🗑 삭제되었습니다');
}