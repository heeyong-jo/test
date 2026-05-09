// ==================== 게시판 기능 ====================
let currentBoardCategory = '일반성도';
let currentPostId = null;


// ── 초기화 ──
function initBoard() {
  const btns = document.querySelectorAll('.board-cat-btn');
  btns.forEach(b => {
    b.addEventListener('click', function() {
      btns.forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      currentBoardCategory = this.dataset.cat;
      loadBoardManager();
      loadPosts();
      updateBoardWriteBtn();   // 카테고리 변경 시 버튼 갱신
    });
  });


  loadBoardManager();
  loadPosts();


  // 초기 글쓰기 버튼 상태
  updateBoardWriteBtn();
  updateBoardCommentArea();
}


// ── 담당자 정보 ──
function loadBoardManager() {
  if (currentBoardCategory === '일반성도') {
    document.getElementById('board-manager-area').style.display = 'none';
    return;
  }
  const catRef = firebase.database().ref(`boards/${currentBoardCategory}/manager`);
  catRef.once('value', snap => {
    const data = snap.val();
    if (data) {
      document.getElementById('board-manager-area').style.display = 'block';
      document.getElementById('board-manager-content').innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:50px;height:50px;border-radius:50%;overflow:hidden;background:#eee;">
            ${data.photo ? `<img src="${data.photo}" style="width:100%;height:100%;object-fit:cover;">` : '👤'}
          </div>
          <div>
            <div style="font-weight:700;">${escapeHtml(data.name)}</div>
            <div style="font-size:12px;color:var(--text2);">담당</div>
          </div>
        </div>`;
    } else {
      document.getElementById('board-manager-area').style.display = 'none';
    }
  });
}


// ── 게시물 목록 ──
function loadPosts() {
  const postsRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`);
  postsRef.once('value', snap => {
    const posts = snap.val() || {};
    const list = Object.entries(posts).sort((a,b) => b[1].timestamp - a[1].timestamp);
    let html = '';
    list.forEach(([id, post]) => {
      const firstPhoto = (post.photos && post.photos.length) ? post.photos[0] : null;
      html += `
        <div class="board-post-item" onclick="openBoardDetail('${id}')">
          ${firstPhoto ? `<img class="board-post-thumb" src="${firstPhoto}" alt="">` : '<div class="board-post-thumb" style="display:flex;align-items:center;justify-content:center;">📷</div>'}
          <div class="board-post-info">
            <div class="board-post-title">${escapeHtml(post.title)}</div>
            <div class="board-post-meta">${escapeHtml(post.author)} · ${new Date(post.timestamp).toLocaleString()}</div>
          </div>
        </div>`;
    });
    document.getElementById('board-post-list').innerHTML = html;
  });
}


// ── 글쓰기 열기/닫기 ──
function openBoardWrite() {
  if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) {
    alert('게시물 작성은 매니저 이상만 가능합니다.');
    return;
  }
  document.getElementById('board-write-title').value = '';
  document.getElementById('board-write-content').value = '';
  document.getElementById('board-photo-preview').innerHTML = '';
  document.getElementById('board-write-overlay').style.display = 'flex';
}
function closeBoardWrite() { document.getElementById('board-write-overlay').style.display = 'none'; }


// 사진 미리보기 + 리사이즈 (기존과 동일)
function boardPhotoPreview(input) {
  const files = input.files;
  const previewDiv = document.getElementById('board-photo-preview');
  previewDiv.innerHTML = '';
  const resizedPromises = [];
  for (let file of files) {
    if (file.size > 3 * 1024 * 1024) { alert('사진은 3MB 이하로 올려주세요.'); continue; }
    resizedPromises.push(
      resizeStaffImage(file, 400, 300, 0.85).then(dataUrl => {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = 'board-photo-thumb';
        previewDiv.appendChild(img);
        return dataUrl;
      })
    );
  }
  window._boardResizedPhotos = Promise.all(resizedPromises);
}


// ── 글쓰기 제출 ──
async function submitBoardPost() {
  const title = document.getElementById('board-write-title').value.trim();
  const content = document.getElementById('board-write-content').value.trim();
  if (!title) { alert('제목을 입력하세요.'); return; }
  if (!currentUser) { alert('로그인이 필요합니다.'); return; }
  let photos = [];
  if (window._boardResizedPhotos) photos = await window._boardResizedPhotos;
  const postRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`).push();
  await postRef.set({
    title, content, photos,
    author: currentUser.name,
    authorId: currentUser.uid,
    timestamp: Date.now(),
    comments: {}
  });
  closeBoardWrite();
  loadPosts();
}


// ── 게시물 상세 ──
function openBoardDetail(postId) {
  currentPostId = postId;
  const ref = firebase.database().ref(`boards/${currentBoardCategory}/posts/${postId}`);
  ref.once('value', snap => {
    const post = snap.val();
    document.getElementById('board-detail-title').textContent = post.title;
    let html = `<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">${escapeHtml(post.author)} · ${new Date(post.timestamp).toLocaleString()}</div>`;
    html += `<div style="white-space:pre-wrap;margin-bottom:12px;">${escapeHtml(post.content)}</div>`;
    if (post.photos) {
      post.photos.forEach(src => html += `<img src="${src}" style="width:100%;border-radius:12px;margin-bottom:6px;">`);
    }
    document.getElementById('board-detail-content').innerHTML = html;
    renderComments(post.comments || {});
    document.getElementById('board-detail-overlay').style.display = 'flex';
    updateBoardCommentArea();
  });
}
function closeBoardDetail() {
  document.getElementById('board-detail-overlay').style.display = 'none';
  currentPostId = null;
}


// ── 댓글 ──
function renderComments(comments) {
  const list = Object.entries(comments).sort((a,b) => a[1].timestamp - b[1].timestamp);
  let html = '';
  list.forEach(([cid, c]) => {
    html += `<div style="margin-bottom:8px;"><b>${escapeHtml(c.author)}</b> ${escapeHtml(c.text)} <span style="font-size:10px;color:var(--text2);">${new Date(c.timestamp).toLocaleString()}</span></div>`;
  });
  document.getElementById('board-comments-list').innerHTML = html || '<div style="color:var(--text2);font-size:12px;">아직 댓글이 없습니다.</div>';
}
function submitBoardComment() {
  if (!currentUser) { alert('로그인이 필요합니다.'); return; }
  const text = document.getElementById('board-comment-input').value.trim();
  if (!text) return;
  const ref = firebase.database().ref(`boards/${currentBoardCategory}/posts/${currentPostId}/comments`).push();
  ref.set({ text, author: currentUser.name, timestamp: Date.now() }).then(() => {
    document.getElementById('board-comment-input').value = '';
    openBoardDetail(currentPostId);
  });
}