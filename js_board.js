// ==================== 게시판 기능 ====================
let currentBoardCategory = '일반성도';
let currentPostId = null;
let currentBoardPage = 1;
const POSTS_PER_PAGE = 3;
let boardPostCache = {};


function initBoard() {
  const btns = document.querySelectorAll('#board-category-list .board-cat-btn');
  btns.forEach(b => {
    const clone = b.cloneNode(true);
    b.parentNode.replaceChild(clone, b);
  });


  document.querySelectorAll('#board-category-list .board-cat-btn').forEach(b => {
    b.addEventListener('click', function() {
      document.querySelectorAll('#board-category-list .board-cat-btn')
        .forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      currentBoardCategory = this.dataset.cat;
      openBoardCategory();
    });
  });
}


function openBoardCategory() {
  const list = document.getElementById('board-category-list');
  const content = document.getElementById('board-content');
  list.style.display    = 'none';
  list.style.visibility = 'hidden';
  list.style.pointerEvents = 'none';


  content.style.display    = 'flex';
  content.style.flexDirection = 'column';
  content.style.visibility = 'visible';
  content.style.pointerEvents = 'auto';
  content.scrollTop = 0;
  window.scrollTo(0, 0);
  loadBoardManager();
  currentBoardPage = 1;
  loadPosts();
  updateBoardWriteBtn();
}


function showBoardCategoryList() {
  const list = document.getElementById('board-category-list');
  const content = document.getElementById('board-content');
  content.style.display    = 'none';
  content.style.visibility = 'hidden';
  content.style.pointerEvents = 'none';


  list.style.display    = 'flex';
  list.style.visibility = 'visible';
  list.style.pointerEvents = 'auto';
}


function loadBoardManager() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  const titleEl = document.getElementById('board-category-title');
  if (currentBoardCategory === '일반성도') {
    document.getElementById('board-manager-area').style.display = 'none';
    if (titleEl) { titleEl.style.display = 'block'; titleEl.textContent = '📌 일반성도'; }
    return;
  }
  if (titleEl) { titleEl.style.display = 'block'; titleEl.textContent = getCategoryLabel(currentBoardCategory); }
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


function loadPosts() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    document.getElementById('board-post-list').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">Firebase 연결 실패</div>';
    return;
  }
  const postsRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`);
  postsRef.once('value', snap => {
    const posts = snap.val() || {};
    const list = Object.entries(posts).sort((a,b) => b[1].timestamp - a[1].timestamp);
    boardPostCache[currentBoardCategory] = list;
    renderPostsPage();
  });
}


function renderPostsPage() {
  const cache = boardPostCache[currentBoardCategory] || [];
  const totalPages = Math.ceil(cache.length / POSTS_PER_PAGE);
  const start = (currentBoardPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const pageItems = cache.slice(start, end);
  let html = '';
  pageItems.forEach(([id, post]) => {
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
  document.getElementById('board-post-list').innerHTML = html || '<div style="text-align:center;padding:20px;color:var(--text2);">등록된 게시물이 없습니다.</div>';
  renderPagination(totalPages);
}


function renderPagination(totalPages) {
  const pagDiv = document.getElementById('board-pagination');
  if (!pagDiv) return;
  if (totalPages <= 1) { pagDiv.innerHTML = ''; return; }
  let pagHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    pagHTML += `<button class="board-page-btn${i === currentBoardPage ? ' active' : ''}" onclick="changeBoardPage(${i})">${i}</button>`;
  }
  pagDiv.innerHTML = pagHTML;
}


function changeBoardPage(page) { currentBoardPage = page; renderPostsPage(); }


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


async function submitBoardPost() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    alert('서버 연결에 실패했습니다.');
    return;
  }
  const user = window.currentUser || currentUser;
  if (!user) { alert('로그인이 필요합니다.'); return; }
  if (user.role !== 'manager' && user.role !== 'admin') {
    alert('게시물 작성은 매니저 이상만 가능합니다.');
    return;
  }


  const title = document.getElementById('board-write-title').value.trim();
  const content = document.getElementById('board-write-content').value.trim();
  if (!title) { alert('제목을 입력하세요.'); return; }


  let photos = [];
  if (window._boardResizedPhotos) photos = await window._boardResizedPhotos;


  try {
    const postRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`).push();
    await postRef.set({
      title,
      content,
      photos,
      author: user.name,
      authorId: user.uid || user.id || '',   // ★ uid가 없으면 id를 사용
      timestamp: Date.now(),
      comments: {}
    });
    alert('게시물이 등록되었습니다.');
    closeBoardWrite();
    currentBoardPage = 1;
    loadPosts();
  } catch (err) {
    console.error('등록 실패:', err);
    alert('등록 중 오류가 발생했습니다: ' + err.message);
  }
}


function openBoardDetail(postId) {
  if (typeof firebase === 'undefined') return;
  currentPostId = postId;
  const ref = firebase.database().ref(`boards/${currentBoardCategory}/posts/${postId}`);
  ref.once('value', snap => {
    const post = snap.val();
    document.getElementById('board-detail-title').textContent = post.title;
    let html = `<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">${escapeHtml(post.author)} · ${new Date(post.timestamp).toLocaleString()}</div>`;
    html += `<div style="white-space:pre-wrap;margin-bottom:12px;">${escapeHtml(post.content)}</div>`;
    if (post.photos) post.photos.forEach(src => html += `<img src="${src}" style="width:100%;border-radius:12px;margin-bottom:6px;">`);
    document.getElementById('board-detail-content').innerHTML = html;
    renderComments(post.comments || {});
    document.getElementById('board-detail-overlay').style.display = 'flex';
    updateBoardCommentArea();
  });
}
function closeBoardDetail() { document.getElementById('board-detail-overlay').style.display = 'none'; currentPostId = null; }


function renderComments(comments) {
  const list = Object.entries(comments).sort((a,b) => a[1].timestamp - b[1].timestamp);
  let html = '';
  list.forEach(([cid, c]) => html += `<div style="margin-bottom:8px;"><b>${escapeHtml(c.author)}</b> ${escapeHtml(c.text)} <span style="font-size:10px;color:var(--text2);">${new Date(c.timestamp).toLocaleString()}</span></div>`);
  document.getElementById('board-comments-list').innerHTML = html || '<div style="color:var(--text2);font-size:12px;">아직 댓글이 없습니다.</div>';
}
function submitBoardComment() {
  if (typeof firebase === 'undefined') return;
  if (!currentUser) { alert('로그인이 필요합니다.'); return; }
  const text = document.getElementById('board-comment-input').value.trim();
  if (!text) return;
  const ref = firebase.database().ref(`boards/${currentBoardCategory}/posts/${currentPostId}/comments`).push();
  ref.set({ text, author: currentUser.name, timestamp: Date.now() }).then(() => {
    document.getElementById('board-comment-input').value = '';
    openBoardDetail(currentPostId);
  });
}


// resizeStaffImage 함수 (만약 js_staff.js에 없을 경우 대비)
function resizeStaffImage(file, maxW = 400, maxH = 480, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width  = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
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


// ── 글쓰기 버튼 표시 (매니저 이상만) ──────────────────────────────
function updateBoardWriteBtn() {
  const wrap = document.getElementById('board-write-btn-wrap');
  if (!wrap) return;
  const role = currentUser && currentUser.role;
  wrap.style.display = (role === 'admin' || role === 'manager') ? 'block' : 'none';
}


// ── 댓글 입력창 표시 (로그인 유저 전체) ──────────────────────────
function updateBoardCommentArea() {
  const inputWrap = document.getElementById('board-comment-input-wrap');
  const loginMsg  = document.getElementById('board-comment-login-msg');
  if (!inputWrap || !loginMsg) return;
  if (currentUser) {
    inputWrap.style.display = 'block';
    loginMsg.style.display  = 'none';
  } else {
    inputWrap.style.display = 'none';
    loginMsg.style.display  = 'block';
  }
}


// ── DOMContentLoaded: initBoard 등록 ─────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBoard);
} else {
  initBoard();
}