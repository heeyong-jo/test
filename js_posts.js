// 게시물 목록 렌더링
function renderPosts() {
  const el = document.getElementById('posts-list');
  if (!el) return;
  const safePosts = Array.isArray(posts) ? posts : [];
  if (!safePosts.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:40px;">아직 게시물이 없습니다. 첫 번째 게시물을 작성해보세요!</div>';
    return;
  }
  el.innerHTML = safePosts.map(p => `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <div>
          <span style="font-weight:700;font-size:14px;">${escapeHtml(p.author)}</span>
          <span style="font-size:10px;color:var(--text2);margin-left:8px;">${p.date}</span>
        </div>
        ${(currentUser && (currentUser.name === p.author || currentUser.role === 'admin')) ? `<button onclick="deletePost(${p.id})" style="background:none;border:none;color:var(--red);font-size:12px;cursor:pointer;">🗑</button>` : ''}
      </div>
      <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:12px;">${escapeHtml(p.content)}</div>
      ${p.image ? `<img src="${p.image}" style="width:100%;border-radius:12px;margin-bottom:12px;max-height:300px;object-fit:cover;">` : ''}
      <div style="display:flex;gap:16px;font-size:11px;color:var(--text2);">
        <span>❤️ ${p.likes}</span>
        <span>💬 ${p.comments}</span>
      </div>
    </div>
  `).join('');
}


// 게시물 작성 모달 열기
function openAddPost() {
  if (!currentUser) { showToast('로그인이 필요합니다'); return; }
  document.getElementById('post-content').value = '';
  document.getElementById('post-image-name').textContent = '선택된 파일 없음';
  document.getElementById('post-image-preview').style.display = 'none';
  document.getElementById('post-image-input').value = '';
  currentPostImageData = null;
  document.getElementById('modal-add-post').style.display = 'flex';
}


// 사진 미리보기
function previewPostImage(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('사진 크기는 5MB 이하만 가능합니다');
    input.value = '';
    return;
  }
  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일만 첨부 가능합니다');
    input.value = '';
    return;
  }
  document.getElementById('post-image-name').textContent = file.name;
  const reader = new FileReader();
  reader.onload = function(e) {
    currentPostImageData = e.target.result;
    document.getElementById('post-preview-img').src = currentPostImageData;
    document.getElementById('post-image-preview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}


// 사진 제거
function removePostImage() {
  currentPostImageData = null;
  document.getElementById('post-image-input').value = '';
  document.getElementById('post-image-name').textContent = '선택된 파일 없음';
  document.getElementById('post-image-preview').style.display = 'none';
}


// 게시물 등록
function submitPostWithImage() {
  const content = document.getElementById('post-content').value.trim();
  if (!content) { showToast('내용을 입력하세요'); return; }
  posts.unshift({
    id: Date.now(),
    author: currentUser.name,
    content: content,
    image: currentPostImageData || '',
    likes: 0,
    comments: 0,
    date: new Date().toISOString().slice(0, 10)
  });
  LS.save('posts', posts);
  renderPosts();
  closeModal('modal-add-post');
  showToast('✅ 게시물이 등록되었습니다');
}


// 게시물 삭제
function deletePost(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  posts = posts.filter(p => p.id !== id);
  LS.save('posts', posts);
  renderPosts();
  showToast('🗑 게시물이 삭제되었습니다');
}