// ==================== 말씀 묵상 & 오늘의 말씀 ====================




// 오늘의 말씀 렌더링
function renderTodayVerse() {
  const tv = todayVerse || LS.load('todayVerse', {
    text: '"하나님은 사랑이시라"',
    ref: '요한일서 4:16',
    body: '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라'
  });
  const el_text = document.getElementById('today-verse-text');
  const el_ref = document.getElementById('today-verse-ref');
  const el_body = document.getElementById('today-verse-body');
  if (el_text) el_text.textContent = tv.text;
  if (el_ref) el_ref.textContent = tv.ref;
  if (el_body) el_body.textContent = tv.body;
}


// 오늘의 말씀 공유
function shareToday() {
  const tv = LS.load('todayVerse', {
    text: '"하나님은 사랑이시라"',
    ref: '요한일서 4:16',
    body: '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라'
  });
  const shareText = tv.text + ' - ' + tv.ref + '\n' + tv.body;
  if (navigator.share) {
    navigator.share({ title: '오늘의 말씀', text: shareText });
  } else {
    navigator.clipboard.writeText(shareText).then(() => showToast('📋 복사되었습니다'));
  }
}


// 묵상 좋아요 토글
function toggleLike(id) {
  const m = meditations.find(m => m.id === id);
  if (!m) return;
  m.liked = !m.liked;
  m.likes += m.liked ? 1 : -1;
  LS.save('meditations', meditations);
  renderMeditations();
}


// 묵상 등록
function submitMeditation() {
  const text = document.getElementById('meditation-input').value.trim();
  if (!text) { showToast('묵상 내용을 입력해주세요'); return; }
  if (!currentUser) { showToast('로그인이 필요합니다'); return; }
  meditations.unshift({
    id: Date.now(),
    author: currentUser.name,
    text: text,
    time: '방금 전',
    likes: 0,
    liked: false
  });
  LS.save('meditations', meditations);
  document.getElementById('meditation-input').value = '';
  renderMeditations();
  showToast('✅ 묵상이 등록되었습니다');
}


// 묵상 목록 렌더링
function renderMeditations() {
  const el = document.getElementById('meditation-list');
  if (!el) return;
  const safeMed = Array.isArray(meditations) ? meditations : [];
  if (!safeMed.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px;font-size:13px;">아직 묵상이 없습니다. 첫 번째로 나눠주세요!</div>';
    return;
  }
  const canDeleteAll = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
  el.innerHTML = safeMed.map(m => {
    const isAuthor = currentUser && currentUser.name === m.author;
    const canEdit = isAuthor;
    const canDelete = isAuthor || canDeleteAll;
    return `
      <div class="meditation-card">
        <div class="meditation-header">
          <span class="meditation-author">${escapeHtml(m.author)}</span>
          <span class="meditation-time">${m.time}</span>
        </div>
        <div class="meditation-body">${escapeHtml(m.text)}</div>
        <div class="meditation-actions">
          <button class="meditation-like-btn${m.liked ? ' liked' : ''}" onclick="toggleLike(${m.id})">${m.liked ? '❤️' : '🤍'} ${m.likes}</button>
          ${canEdit ? `<button class="meditation-edit-btn" onclick="editMeditation(${m.id})">✏️ 수정</button>` : ''}
          ${canDelete ? `<button class="meditation-del-btn" onclick="deleteMeditation(${m.id})">🗑 삭제</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}


// 묵상 수정
function editMeditation(id) {
  const m = meditations.find(m => m.id === id);
  if (!m) return;
  const newText = prompt('수정할 내용', m.text);
  if (newText && newText.trim()) {
    m.text = newText.trim();
    LS.save('meditations', meditations);
    renderMeditations();
    showToast('✅ 수정됨');
  }
}


// 묵상 삭제
function deleteMeditation(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  meditations = meditations.filter(m => m.id !== id);
  LS.save('meditations', meditations);
  renderMeditations();
  showToast('🗑 삭제됨');
}