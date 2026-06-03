// ==================== 게시판 기능 ====================


let currentBoardCategory = '일반성도';
let currentPostId = null;
let currentBoardPage = 1;
const POSTS_PER_PAGE = 10;
let boardPostCache = {};
let isSubmittingPost = false;  // 중복 제출 방지


function getCurrentUser() {
    return currentUser || window.currentUser;
}


// ✅ src 속성 안전화 함수
function sanitizeImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/[<>"']/g, '');
  }
  return '';
}


function initBoard() {
  console.log('initBoard 실행');
  const btns = document.querySelectorAll('#board-category-list .board-cat-btn');
  btns.forEach(btn => {
    if (btn.hasAttribute('data-bound')) return;
    btn.setAttribute('data-bound', 'true');
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('#board-category-list .board-cat-btn').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      currentBoardCategory = this.dataset.cat;
      currentBoardPage = 1;
      openBoardCategory();
    });
  });
}


function openBoardCategory() {
  const list = document.getElementById('board-category-list');
  const content = document.getElementById('board-content');
  const titleEl = document.getElementById('board-category-title');
  if (!list || !content) return;
  list.style.display = 'none';
  content.style.display = 'block';
  if (titleEl) titleEl.textContent = getCategoryLabel(currentBoardCategory);
  loadBoardManager();
  loadPosts();
  updateBoardWriteBtn();
}


function getCategoryLabel(cat) {
  const map = {
    '일반성도': '📌 일반성도',
    '꿈지락': '🐣 꿈지락 (0~4세)',
    '꿈트리': '🌱 꿈트리 (5~7세)',
    '꿈마루': '📚 꿈마루 (초등)',
    '꿈하나': '🔥 꿈하나 (청소년)',
    '새이플러스': '✝️ 새이플러스 (청년부)'
  };
  return map[cat] || cat;
}


function showBoardCategoryList() {
  const list = document.getElementById('board-category-list');
  const content = document.getElementById('board-content');
  if (list) list.style.display = 'flex';
  if (content) content.style.display = 'none';
}


function loadPosts() {
  const postListDiv = document.getElementById('board-post-list');
  if (!postListDiv) return;
  postListDiv.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner" style="width:24px;height:24px;"></div><div>로딩 중...</div></div>';
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    postListDiv.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">서버 연결에 실패했습니다.</div>';
    return;
  }
  const postsRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`);
  postsRef.once('value').then(snap => {
    const data = snap.val();
    let filteredPosts = [];
    if (data) {
      filteredPosts = Object.entries(data).map(([key, value]) => ({ ...value, firebaseKey: key }))
        .sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
      window.posts = filteredPosts;
    }
    boardPostCache[currentBoardCategory] = filteredPosts;
    renderPostsPage();
  }).catch(err => {
    console.error('Firebase posts 로드 실패:', err);
    boardPostCache[currentBoardCategory] = [];
    renderPostsPage();
  });
}


function renderPostsPage() {
  const cache = boardPostCache[currentBoardCategory] || [];
  const totalPages = Math.max(1, Math.ceil(cache.length / POSTS_PER_PAGE));
  const start = (currentBoardPage - 1) * POSTS_PER_PAGE;
  const pageItems = cache.slice(start, start + POSTS_PER_PAGE);
  const postListDiv = document.getElementById('board-post-list');
  if (!postListDiv) return;
  if (pageItems.length === 0) {
    postListDiv.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">📝 아직 게시글이 없습니다.<br>첫 번째 글을 작성해보세요!</div>';
    renderPagination(totalPages);
    return;
  }
  let html = '';
  pageItems.forEach(post => {
    const postId = post.id || post.firebaseKey;
    const firstPhoto = post.photo || (post.photos && post.photos.length ? post.photos[0] : null);
    const safePhotoUrl = sanitizeImageUrl(firstPhoto);
    const authorName = post.authorName || post.author || '익명';
    const timestamp = post.createdAt || post.timestamp;
    const dateStr = timestamp ? new Date(timestamp).toLocaleString() : '날짜 없음';
    html += `<div class="board-post-item" onclick="openBoardDetail('${postId}')">
        ${safePhotoUrl ? `<img class="board-post-thumb" src="${safePhotoUrl}" alt="썸네일" onerror="this.style.display='none'">` : '<div class="board-post-thumb" style="display:flex;align-items:center;justify-content:center;background:#f0f0f0;">📷</div>'}
        <div class="board-post-info">
          <div class="board-post-title">${escapeHtml(post.title || '제목 없음')}</div>
          <div class="board-post-meta">${escapeHtml(authorName)} · ${dateStr}</div>
        </div>
      </div>`;
  });
  postListDiv.innerHTML = html;
  renderPagination(totalPages);
}


function renderPagination(totalPages) {
  const pagDiv = document.getElementById('board-pagination');
  if (!pagDiv) return;
  if (totalPages <= 1) { pagDiv.innerHTML = ''; return; }
  let pagHTML = '';
  const maxButtons = 7;
  let startPage = Math.max(1, currentBoardPage - 3);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);
  if (startPage > 1) pagHTML += `<button class="board-page-btn" onclick="changeBoardPage(1)">1</button>${startPage > 2 ? '<span>...</span>' : ''}`;
  for (let i = startPage; i <= endPage; i++) {
    pagHTML += `<button class="board-page-btn${i === currentBoardPage ? ' active' : ''}" onclick="changeBoardPage(${i})">${i}</button>`;
  }
  if (endPage < totalPages) pagHTML += `${endPage < totalPages - 1 ? '<span>...</span>' : ''}<button class="board-page-btn" onclick="changeBoardPage(${totalPages})">${totalPages}</button>`;
  pagDiv.innerHTML = pagHTML;
}


function changeBoardPage(page) { currentBoardPage = page; renderPostsPage(); }


function loadBoardManager() {
  const managerArea = document.getElementById('board-manager-area');
  const managerContent = document.getElementById('board-manager-content');
  if (!managerArea || !managerContent) return;
  if (currentBoardCategory === '일반성도') { managerArea.style.display = 'none'; return; }
  if (typeof firebase === 'undefined') return;
  firebase.database().ref(`boards/${currentBoardCategory}/manager`).once('value').then(snap => {
    const data = snap.val();
    if (data && data.name) {
      managerArea.style.display = 'block';
      const photoHtml = data.photo ? `<img src="${sanitizeImageUrl(data.photo)}" style="width:100%;height:100%;object-fit:cover;">` : '👤';
      managerContent.innerHTML = `<div style="display:flex;align-items:center;gap:12px;"><div style="width:50px;height:50px;border-radius:50%;overflow:hidden;background:#eee;display:flex;align-items:center;justify-content:center;font-size:24px;">${photoHtml}</div><div><div style="font-weight:700;">${escapeHtml(data.name)}</div><div style="font-size:12px;color:var(--text2);">담당</div></div></div>`;
    } else managerArea.style.display = 'none';
  }).catch(() => { managerArea.style.display = 'none'; });
}


function updateBoardWriteBtn() {
  const wrap = document.getElementById('board-write-btn-wrap');
  if (!wrap) return;
  const user = getCurrentUser();
  wrap.style.display = (user && (user.role === 'admin' || user.role === 'manager')) ? 'block' : 'none';
}


function updateBoardCommentArea() {
  const inputWrap = document.getElementById('board-comment-input-wrap');
  const loginMsg = document.getElementById('board-comment-login-msg');
  if (!inputWrap || !loginMsg) return;
  const user = getCurrentUser();
  if (user) { inputWrap.style.display = 'block'; loginMsg.style.display = 'none'; }
  else { inputWrap.style.display = 'none'; loginMsg.style.display = 'block'; }
}


function openBoardDetail(postId) {
  if (typeof firebase === 'undefined') { showToast('서버 연결에 실패했습니다.'); return; }
  currentPostId = postId;
  const cache = boardPostCache[currentBoardCategory] || [];
  let post = cache.find(p => (p.id === postId) || (p.firebaseKey === postId));
  const fetchPromise = post ? Promise.resolve(post) : firebase.database().ref(`boards/${currentBoardCategory}/posts`).once('value').then(snap => {
    const data = snap.val();
    if (data) {
      const found = Object.entries(data).find(([key, val]) => val.id === postId || key === postId);
      return found ? found[1] : null;
    }
    return null;
  });
  fetchPromise.then(postData => {
    if (!postData) { showToast('게시물을 찾을 수 없습니다.'); return; }
    const titleEl = document.getElementById('board-detail-title');
    const contentEl = document.getElementById('board-detail-content');
    if (titleEl) titleEl.textContent = postData.title || '';
    const authorName = postData.authorName || postData.author || '익명';
    const timestamp = postData.createdAt || postData.timestamp;
    const dateStr = timestamp ? new Date(timestamp).toLocaleString() : '날짜 없음';
    let html = `<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">✍️ ${escapeHtml(authorName)} · ${dateStr}</div>`;
    html += `<div style="white-space:pre-wrap;margin-bottom:12px;line-height:1.6;">${escapeHtml(postData.content || '')}</div>`;
    if (postData.photos && postData.photos.length) {
      postData.photos.forEach(src => {
        const safeSrc = sanitizeImageUrl(src);
        if (safeSrc) html += `<img src="${safeSrc}" style="width:100%;border-radius:12px;margin-bottom:6px;" onerror="this.style.display='none'">`;
      });
    } else if (postData.photo) {
      const safeSrc = sanitizeImageUrl(postData.photo);
      if (safeSrc) html += `<img src="${safeSrc}" style="width:100%;border-radius:12px;margin-bottom:6px;" onerror="this.style.display='none'">`;
    }
    if (contentEl) contentEl.innerHTML = html;
    const comments = postData.comments || {};
    renderComments(comments);
    const modal = document.getElementById('board-detail-overlay');
    if (modal) modal.style.display = 'flex';
    updateBoardCommentArea();
  }).catch(err => { console.error('게시물 로드 실패:', err); showToast('게시물을 불러올 수 없습니다.'); });
}


function closeBoardDetail() {
  const modal = document.getElementById('board-detail-overlay');
  if (modal) modal.style.display = 'none';
  currentPostId = null;
}


function renderComments(comments) {
  const commentsList = document.getElementById('board-comments-list');
  if (!commentsList) return;
  const list = Object.entries(comments).sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));
  let html = '';
  list.forEach(([cid, c]) => {
    const dateStr = c.timestamp ? new Date(c.timestamp).toLocaleString() : '';
    html += `<div style="margin-bottom:12px;padding:8px 0;border-bottom:1px solid var(--border);">
        <b style="color:var(--purple);">${escapeHtml(c.author)}</b>
        <span style="font-size:11px;color:var(--text2);margin-left:8px;">${dateStr}</span>
        <div style="margin-top:4px;font-size:13px;">${escapeHtml(c.text)}</div>
      </div>`;
  });
  commentsList.innerHTML = html || '<div style="color:var(--text2);font-size:12px;padding:12px;text-align:center;">아직 댓글이 없습니다.</div>';
}


function submitBoardComment() {
  if (typeof firebase === 'undefined') { showToast('서버 연결에 실패했습니다.'); return; }
  const user = getCurrentUser();
  if (!user) { showToast('로그인이 필요합니다.'); document.getElementById('screen-login').style.display = 'flex'; return; }
  const commentInput = document.getElementById('board-comment-input');
  const text = commentInput ? commentInput.value.trim() : '';
  if (!text) { showToast('댓글 내용을 입력하세요.'); return; }
  const cache = boardPostCache[currentBoardCategory] || [];
  const post = cache.find(p => p.id === currentPostId || p.firebaseKey === currentPostId);
  if (!post || !post.firebaseKey) { showToast('게시글 정보를 찾을 수 없습니다.'); return; }
  const comment = { text: text, author: user.name || user.id || '익명', authorId: user.id || user.uid, timestamp: Date.now() };
  firebase.database().ref(`boards/${currentBoardCategory}/posts/${post.firebaseKey}/comments`).push(comment)
    .then(() => {
      if (commentInput) commentInput.value = '';
      // ✅ 모달 닫지 않고 댓글만 갱신
      const commentsRef = firebase.database().ref(`boards/${currentBoardCategory}/posts/${post.firebaseKey}/comments`);
      commentsRef.once('value').then(snap => { renderComments(snap.val() || {}); });
      showToast('✅ 댓글이 등록되었습니다.');
    })
    .catch(err => { console.error('댓글 등록 실패:', err); showToast('댓글 등록에 실패했습니다.'); });
}


function openBoardWrite() {
  const user = getCurrentUser();
  if (!user) { showToast('로그인이 필요합니다.'); document.getElementById('screen-login').style.display = 'flex'; return; }
  if (user.role !== 'manager' && user.role !== 'admin') { showToast('게시물 작성은 매니저 이상만 가능합니다.'); return; }
  const titleInput = document.getElementById('board-write-title');
  const contentInput = document.getElementById('board-write-content');
  const previewDiv = document.getElementById('board-photo-preview');
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
  if (previewDiv) previewDiv.innerHTML = '';
  window._boardResizedPhotos = null;
  const modal = document.getElementById('board-write-overlay');
  if (modal) modal.style.display = 'flex';
}


function closeBoardWrite() { const modal = document.getElementById('board-write-overlay'); if (modal) modal.style.display = 'none'; }


async function submitBoardPost() {
  if (isSubmittingPost) { showToast('처리 중입니다. 잠시만 기다려주세요.'); return; }
  if (typeof firebase === 'undefined' || !firebase.apps.length) { showToast('서버 연결에 실패했습니다.'); return; }
  const user = getCurrentUser();
  if (!user) { showToast('로그인이 필요합니다.'); document.getElementById('screen-login').style.display = 'flex'; return; }
  if (user.role !== 'manager' && user.role !== 'admin') { showToast('게시물 작성은 매니저 이상만 가능합니다.'); return; }
  const titleInput = document.getElementById('board-write-title');
  const contentInput = document.getElementById('board-write-content');
  const title = titleInput ? titleInput.value.trim() : '';
  const content = contentInput ? contentInput.value.trim() : '';
  if (!title) { showToast('제목을 입력하세요.'); return; }
  if (!content) { showToast('내용을 입력하세요.'); return; }
  let photos = [];
  if (window._boardResizedPhotos && window._boardResizedPhotos.length) photos = window._boardResizedPhotos;
  const newPost = {
    id: Date.now().toString(),
    title: title,
    content: content,
    category: currentBoardCategory,
    authorId: user.id || user.uid,
    authorName: user.name || user.id || '익명',
    author: user.name || user.id || '익명',
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    photos: photos,
    photo: photos.length > 0 ? photos[0] : null,
    comments: {}
  };
  isSubmittingPost = true;
  const submitBtn = document.querySelector('#board-write-overlay .btn-primary');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '등록 중...'; }
  try {
    const postsRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`);
    const newPostRef = postsRef.push();
    await newPostRef.set(newPost);
    showToast('✅ 게시물이 등록되었습니다.');
    closeBoardWrite();
    currentBoardPage = 1;
    loadPosts();
  } catch (err) {
    console.error('등록 실패:', err);
    showToast('등록 중 오류가 발생했습니다: ' + err.message);
  } finally {
    isSubmittingPost = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '등록'; }
  }
}


function boardPhotoPreview(input) {
  if (!input.files || input.files.length === 0) return;
  const previewDiv = document.getElementById('board-photo-preview');
  if (!previewDiv) return;
  previewDiv.innerHTML = '';
  const resizedPromises = [];
  for (let file of input.files) {
    if (file.size > 3 * 1024 * 1024) { alert('사진은 3MB 이하로 올려주세요.'); continue; }
    resizedPromises.push(resizeBoardImage(file, 800, 600, 0.8).then(dataUrl => {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.margin = '4px';
      previewDiv.appendChild(img);
      return dataUrl;
    }).catch(err => { console.error('이미지 리사이즈 실패:', err); return null; }));
  }
  Promise.all(resizedPromises).then(photos => { window._boardResizedPhotos = photos.filter(p => p !== null); });
}


function resizeBoardImage(file, maxW, maxH, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW || height > maxH) { const ratio = Math.min(maxW / width, maxH / height); width = Math.round(width * ratio); height = Math.round(height * ratio); }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


console.log('✅ js_board.js 로드 완료');