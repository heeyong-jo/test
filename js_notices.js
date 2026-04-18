// ==================== 공지사항 ====================


// 홈 화면에 최근 공지 렌더링
function renderHomeNotices() {
  const el = document.getElementById('home-notices');
  if (!el) return;
  const safeNotices = Array.isArray(notices) ? notices : [];
  if (!safeNotices.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:16px;">공지가 없습니다</div>';
    return;
  }
  const isAdmin = currentUser && currentUser.role === 'admin';
  el.innerHTML = safeNotices.slice(0, 3).map(n => `
    <div class="notice-row">
      <div class="notice-head">
        <div class="notice-title">${escapeHtml(n.title)}</div>
        <div style="display:flex; gap:6px; align-items:center;">
          <span class="badge badge-new">${escapeHtml(n.cat.split(' ')[0])}</span>
          ${isAdmin ? `<button onclick="editNotice(${n.id})" style="background:#f0e8f8; border:none; border-radius:8px; color:#7c2d7e; font-size:10px; padding:3px 8px; cursor:pointer;">✏️</button>
                        <button onclick="deleteNotice(${n.id})" style="background:#fef2f2; border:none; border-radius:8px; color:#b91c1c; font-size:10px; padding:3px 8px; cursor:pointer;">🗑</button>` : ''}
        </div>
      </div>
      <div class="notice-date">${n.date}</div>
      <div class="notice-body" style="margin-top:6px;">${escapeHtml((n.body || '').substring(0, 80))}${(n.body || '').length > 80 ? '...' : ''}</div>
    </div>
  `).join('');
}


// 공지 작성 모달 열기
function openAddNotice() {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('관리자만 공지를 작성할 수 있습니다');
    return;
  }
  document.getElementById('n-edit-id').value = '';
  document.getElementById('n-title').value = '';
  document.getElementById('n-body').value = '';
  document.getElementById('n-cat').selectedIndex = 0;
  document.getElementById('notice-modal-title').textContent = '📢 공지 작성';
  document.getElementById('notice-submit-btn').textContent = '등록하기';
  document.getElementById('modal-notice').style.display = 'flex';
}


// 공지 수정
function editNotice(id) {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('관리자만 공지를 수정할 수 있습니다');
    return;
  }
  const n = notices.find(n => n.id === id);
  if (!n) return;
  document.getElementById('n-edit-id').value = id;
  document.getElementById('n-title').value = n.title;
  document.getElementById('n-body').value = n.body;
  const sel = document.getElementById('n-cat');
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === n.cat || sel.options[i].text === n.cat) {
      sel.selectedIndex = i;
      break;
    }
  }
  document.getElementById('notice-modal-title').textContent = '📢 공지 수정';
  document.getElementById('notice-submit-btn').textContent = '수정 저장';
  document.getElementById('modal-notice').style.display = 'flex';
}


// 공지 저장 (등록/수정)
function saveNotice() {
  const title = document.getElementById('n-title').value.trim();
  if (!title) { showToast('제목을 입력하세요'); return; }
  const editId = document.getElementById('n-edit-id').value;
  const cat = document.getElementById('n-cat').value;
  const body = document.getElementById('n-body').value.trim();
  if (editId) {
    const idx = notices.findIndex(n => n.id == editId);
    if (idx >= 0) {
      notices[idx] = { ...notices[idx], title, cat, body, date: new Date().toLocaleDateString('ko-KR') };
    }
  } else {
    notices.unshift({ id: Date.now(), title, cat, body, date: new Date().toISOString().slice(0, 10) });
  }
  LS.save('notices', notices);
  closeModal('modal-notice');
  renderHomeNotices();
  showToast(editId ? '✅ 수정되었습니다' : '✅ 등록되었습니다');
}


// 공지 삭제
function deleteNotice(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  notices = notices.filter(n => n.id !== id);
  LS.save('notices', notices);
  renderHomeNotices();
  showToast('🗑 삭제되었습니다');
}


// 전체 공지 목록 (필요시 사용, 현재는 별도 함수 없음)
function renderNotices() {
  // 필요시 구현 가능 (현재는 미사용)
}