// ==================== 게시판 기능 ====================
let currentBoardCategory = '일반성도';
let currentPostId = null;
let currentBoardPage = 1;
const POSTS_PER_PAGE = 10;
let boardPostCache = {};


function getCurrentUser() {
    return currentUser || window.currentUser;
}


function initBoard() {
  console.log('initBoard 실행');
  
  const btns = document.querySelectorAll('#board-category-list .board-cat-btn');
  btns.forEach(b => {
    const clone = b.cloneNode(true);
    b.parentNode.replaceChild(clone, b);
  });


  document.querySelectorAll('#board-category-list .board-cat-btn').forEach(b => {
    b.addEventListener('click', function(e) {
      e.preventDefault();
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
  
  if (!list || !content) return;
  
  list.style.display = 'none';
  content.style.display = 'block';
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
  
  if (!list || !content) return;
  
  content.style.display = 'none';
  list.style.display = 'flex';
}


function loadBoardManager() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  
  const titleEl = document.getElementById('board-category-title');
  
  if (currentBoardCategory === '일반성도') {
    const managerArea = document.getElementById('board-manager-area');
    if (managerArea) managerArea.style.display = 'none';
    if (titleEl) {
      titleEl.style.display = 'block';
      titleEl.textContent = '📌 일반성도';
    }
    return;
  }
  
  if (titleEl) {
    titleEl.style.display = 'block';
    titleEl.textContent = getCategoryLabel(currentBoardCategory);
  }
  
  const catRef = firebase.database().ref(`boards/${currentBoardCategory}/manager`);
  catRef.once('value', snap => {
    const data = snap.val();
    const managerArea = document.getElementById('board-manager-area');
    const managerContent = document.getElementById('board-manager-content');
    
    if (data && managerArea && managerContent) {
      managerArea.style.display = 'block';
      managerContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:50px;height:50px;border-radius:50%;overflow:hidden;background:#eee;">
            ${data.photo ? `<img src="${data.photo}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;">👤</div>'}
          </div>
          <div>
            <div style="font-weight:700;">${escapeHtml(data.name)}</div>
            <div style="font-size:12px;color:var(--text2);">담당</div>
          </div>
        </div>`;
    } else if (managerArea) {
      managerArea.style.display = 'none';
    }
  }).catch(err => console.error('담당자 로드 실패:', err));
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
  console.log('loadPosts 실행, 카테고리:', currentBoardCategory);
  
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    console.warn('Firebase 미연결');
    return;
  }
  
  const postsRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`);
  postsRef.once('value', snap => {
    const data = snap.val();
    let filteredPosts = [];
    
    if (data) {
      const fbPosts = Object.values(data).sort((a, b) => (b.createdAt || b.timestamp) - (a.createdAt || a.timestamp));
      window.posts = fbPosts;
      filteredPosts = fbPosts;
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
  const totalPages = Math.ceil(cache.length / POSTS_PER_PAGE) || 1;
  const start = (currentBoardPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const pageItems = cache.slice(start, end);
  
  let html = '';
  pageItems.forEach(post => {
    const postId = post.id;
    const firstPhoto = post.photo || (post.photos && post.photos.length ? post.photos[0] : null);
    const authorName = post.authorName || post.author || '익명';
    const timestamp = post.createdAt || post.timestamp;
    const dateStr = timestamp ? new Date(timestamp).toLocaleString() : '날짜 없음';
    
    html += `
      <div class="board-post-item" onclick="openBoardDetail('${postId}')">
        ${firstPhoto ? `<img class="board-post-thumb" src="${firstPhoto}" alt="썸네일">` : '<div class="board-post-thumb" style="display:flex;align-items:center;justify-content:center;">📷</div>'}
        <div class="board-post-info">
          <div class="board-post-title">${escapeHtml(post.title)}</div>
          <div class="board-post-meta">${escapeHtml(authorName)} · ${dateStr}</div>
        </div>
      </div>`;
  });
  
  const postListDiv = document.getElementById('board-post-list');
  if (postListDiv) {
    postListDiv.innerHTML = html || '<div style="text-align:center;padding:20px;color:var(--text2);">등록된 게시물이 없습니다.</div>';
  }
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


function changeBoardPage(page) { 
  currentBoardPage = page; 
  renderPostsPage(); 
}


function openBoardWrite() {
  const user = getCurrentUser();
  
  if (!user) {
    showToast('로그인이 필요합니다.');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  if (user.role !== 'manager' && user.role !== 'admin') {
    showToast('게시물 작성은 매니저 이상만 가능합니다.');
    return;
  }
  
  const titleInput = document.getElementById('board-write-title');
  const contentInput = document.getElementById('board-write-content');
  const previewDiv = document.getElementById('board-photo-preview');
  
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
  if (previewDiv) previewDiv.innerHTML = '';
  
  window._boardResizedPhotos = null;
  window.currentPostImageData = null;
  
  const modal = document.getElementById('board-write-overlay');
  if (modal) modal.style.display = 'flex';
}


function closeBoardWrite() { 
  const modal = document.getElementById('board-write-overlay');
  if (modal) modal.style.display = 'none';
}


function boardPhotoPreview(input) {
  if (!input.files || input.files.length === 0) return;
  
  const previewDiv = document.getElementById('board-photo-preview');
  if (!previewDiv) return;
  
  previewDiv.innerHTML = '';
  const resizedPromises = [];
  
  for (let file of input.files) {
    if (file.size > 3 * 1024 * 1024) { 
      alert('사진은 3MB 이하로 올려주세요.'); 
      continue; 
    }
    resizedPromises.push(
      resizeStaffImage(file, 800, 600, 0.8).then(dataUrl => {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.margin = '4px';
        previewDiv.appendChild(img);
        return dataUrl;
      }).catch(err => {
        console.error('이미지 리사이즈 실패:', err);
        return null;
      })
    );
  }
  
  Promise.all(resizedPromises).then(photos => {
    window._boardResizedPhotos = photos.filter(p => p !== null);
  });
}


async function submitBoardPost() {
  console.log('submitBoardPost 시작');
  
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    showToast('서버 연결에 실패했습니다.');
    return;
  }
  
  const user = getCurrentUser();
  if (!user) {
    showToast('로그인이 필요합니다.');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  if (user.role !== 'manager' && user.role !== 'admin') {
    showToast('게시물 작성은 매니저 이상만 가능합니다.');
    return;
  }


  const titleInput = document.getElementById('board-write-title');
  const contentInput = document.getElementById('board-write-content');
  
  const title = titleInput ? titleInput.value.trim() : '';
  const content = contentInput ? contentInput.value.trim() : '';
  
  if (!title) {
    showToast('제목을 입력하세요.');
    return;
  }
  
  if (!content) {
    showToast('내용을 입력하세요.');
    return;
  }


  let photos = [];
  if (window._boardResizedPhotos && window._boardResizedPhotos.length) {
    photos = window._boardResizedPhotos;
  }


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
    comments: []
  };


  try {
    const postsRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`);
    const newPostRef = postsRef.push();
    await newPostRef.set(newPost);
    
    if (!window.posts) window.posts = [];
    window.posts.unshift(newPost);
    
    if (typeof LS !== 'undefined') {
      LS.save('posts', window.posts);
    }
    
    showToast('✅ 게시물이 등록되었습니다.');
    closeBoardWrite();
    
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    const previewDiv = document.getElementById('board-photo-preview');
    if (previewDiv) previewDiv.innerHTML = '';
    window._boardResizedPhotos = null;
    
    currentBoardPage = 1;
    loadPosts();
    
  } catch (err) {
    console.error('등록 실패:', err);
    showToast('등록 중 오류가 발생했습니다: ' + err.message);
  }
}


function openBoardDetail(postId) {
  if (typeof firebase === 'undefined') return;
  
  currentPostId = postId;
  
  let post = null;
  if (window.posts) {
    post = window.posts.find(p => p.id === postId);
  }
  
  const fetchPost = post ? Promise.resolve(post) : 
    firebase.database().ref(`posts/${postId}`).once('value').then(snap => snap.val());
  
  fetchPost.then(postData => {
    if (!postData) {
      showToast('게시물을 찾을 수 없습니다.');
      return;
    }
    
    const titleEl = document.getElementById('board-detail-title');
    const contentEl = document.getElementById('board-detail-content');
    
    if (titleEl) titleEl.textContent = postData.title || '';
    
    const authorName = postData.authorName || postData.author || '익명';
    const timestamp = postData.createdAt || postData.timestamp;
    const dateStr = timestamp ? new Date(timestamp).toLocaleString() : '날짜 없음';
    
    let html = `<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">${escapeHtml(authorName)} · ${dateStr}</div>`;
    html += `<div style="white-space:pre-wrap;margin-bottom:12px;line-height:1.6;">${escapeHtml(postData.content || '')}</div>`;
    
    if (postData.photos && postData.photos.length) {
      postData.photos.forEach(src => {
        if (src) html += `<img src="${src}" style="width:100%;border-radius:12px;margin-bottom:6px;" onerror="this.style.display='none'">`;
      });
    } else if (postData.photo) {
      html += `<img src="${postData.photo}" style="width:100%;border-radius:12px;margin-bottom:6px;" onerror="this.style.display='none'">`;
    }
    
    if (contentEl) contentEl.innerHTML = html;
    
    const comments = postData.comments || {};
    renderComments(comments);
    
    const modal = document.getElementById('board-detail-overlay');
    if (modal) modal.style.display = 'flex';
    
    updateBoardCommentArea();
  }).catch(err => {
    console.error('게시물 로드 실패:', err);
    showToast('게시물을 불러올 수 없습니다.');
  });
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
    html += `
      <div style="margin-bottom:12px;padding:8px 0;border-bottom:1px solid var(--border);">
        <b style="color:var(--purple);">${escapeHtml(c.author)}</b>
        <span style="font-size:11px;color:var(--text2);margin-left:8px;">${c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</span>
        <div style="margin-top:4px;font-size:13px;">${escapeHtml(c.text)}</div>
      </div>`;
  });
  
  commentsList.innerHTML = html || '<div style="color:var(--text2);font-size:12px;padding:12px;text-align:center;">아직 댓글이 없습니다.</div>';
}


function submitBoardComment() {
  if (typeof firebase === 'undefined') {
    showToast('서버 연결에 실패했습니다.');
    return;
  }
  
  const user = getCurrentUser();
  if (!user) {
    showToast('로그인이 필요합니다.');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  const commentInput = document.getElementById('board-comment-input');
  const text = commentInput ? commentInput.value.trim() : '';
  
  if (!text) {
    showToast('댓글 내용을 입력하세요.');
    return;
  }
  
  const comment = {
    text: text,
    author: user.name || user.id || '익명',
    authorId: user.id || user.uid,
    timestamp: Date.now()
  };
  
  firebase.database().ref(`posts/${currentPostId}/comments`).push(comment)
    .then(() => {
      if (commentInput) commentInput.value = '';
      openBoardDetail(currentPostId);
      showToast('✅ 댓글이 등록되었습니다.');
    })
    .catch(err => {
      console.error('댓글 등록 실패:', err);
      showToast('댓글 등록에 실패했습니다.');
    });
}


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
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
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


function updateBoardWriteBtn() {
  const wrap = document.getElementById('board-write-btn-wrap');
  if (!wrap) return;
  const user = getCurrentUser();
  const role = user && user.role;
  wrap.style.display = (role === 'admin' || role === 'manager') ? 'block' : 'none';
}


function updateBoardCommentArea() {
  const inputWrap = document.getElementById('board-comment-input-wrap');
  const loginMsg = document.getElementById('board-comment-login-msg');
  if (!inputWrap || !loginMsg) return;
  
  const user = getCurrentUser();
  if (user) {
    inputWrap.style.display = 'block';
    loginMsg.style.display = 'none';
  } else {
    inputWrap.style.display = 'none';
    loginMsg.style.display = 'block';
  }
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initBoard();
    updateBoardWriteBtn();
  });
} else {
  initBoard();
  updateBoardWriteBtn();
}


if (typeof showToast !== 'function') {
  window.showToast = function(msg) {
    alert(msg);
  };
}