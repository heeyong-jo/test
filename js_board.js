// ==================== 게시판 기능 (수정본) ====================


let currentBoardCategory = '일반성도';
let currentPostId = null;
let currentBoardPage = 1;
const POSTS_PER_PAGE = 10;
let boardPostCache = {};


function getCurrentUser() {
    return currentUser || window.currentUser;
}


// ✅ 수정: 간단한 초기화
function initBoard() {
  console.log('initBoard 실행');
  
  // 기존 이벤트 리스너 제거 후 새로 추가
  const btns = document.querySelectorAll('#board-category-list .board-cat-btn');
  btns.forEach(btn => {
    // 기존 이벤트 제거 (clone 방식 대신)
    const newBtn = btn.cloneNode(true);
    if (btn.parentNode) {
      btn.parentNode.replaceChild(newBtn, btn);
    }
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('#board-category-list .board-cat-btn')
        .forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      currentBoardCategory = this.dataset.cat;
      currentBoardPage = 1;  // 페이지 초기화
      openBoardCategory();
    });
  });
}


// ✅ 수정: 게시판 열기
function openBoardCategory() {
  const list = document.getElementById('board-category-list');
  const content = document.getElementById('board-content');
  const titleEl = document.getElementById('board-category-title');
  
  if (!list || !content) return;
  
  list.style.display = 'none';
  content.style.display = 'block';
  content.scrollTop = 0;
  
  // 카테고리 타이틀 설정
  if (titleEl) {
    titleEl.textContent = getCategoryLabel(currentBoardCategory);
  }
  
  loadBoardManager();
  loadPosts();  // 게시글 로드
  updateBoardWriteBtn();
}


// ✅ 수정: 게시글 로드 (경로 통일)
function loadPosts() {
  console.log('loadPosts 실행, 카테고리:', currentBoardCategory);
  
  const postListDiv = document.getElementById('board-post-list');
  if (!postListDiv) return;
  
  postListDiv.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner" style="width:24px;height:24px;"></div><div>로딩 중...</div></div>';
  
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    console.warn('Firebase 미연결');
    postListDiv.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">서버 연결에 실패했습니다.</div>';
    return;
  }
  
  // ✅ 통일된 경로 사용: boards/{category}/posts
  const postsRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`);
  postsRef.once('value')
    .then(snap => {
      const data = snap.val();
      let filteredPosts = [];
      
      if (data) {
        // 객체를 배열로 변환
        filteredPosts = Object.entries(data).map(([key, value]) => ({
          ...value,
          firebaseKey: key
        })).sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
        
        window.posts = filteredPosts;
      }
      
      boardPostCache[currentBoardCategory] = filteredPosts;
      renderPostsPage();
    })
    .catch(err => {
      console.error('Firebase posts 로드 실패:', err);
      boardPostCache[currentBoardCategory] = [];
      renderPostsPage();
    });
}


// ✅ 수정: 게시글 렌더링
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
    const authorName = post.authorName || post.author || '익명';
    const timestamp = post.createdAt || post.timestamp;
    const dateStr = timestamp ? new Date(timestamp).toLocaleString() : '날짜 없음';
    
    html += `
      <div class="board-post-item" onclick="openBoardDetail('${postId}')">
        ${firstPhoto ? `<img class="board-post-thumb" src="${firstPhoto}" alt="썸네일" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27 viewBox=%270 0 40 40%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23ddd%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23999%27%3E📷%3C/text%3E%3C/svg%3E';">` : '<div class="board-post-thumb" style="display:flex;align-items:center;justify-content:center;background:#f0f0f0;">📷</div>'}
        <div class="board-post-info">
          <div class="board-post-title">${escapeHtml(post.title || '제목 없음')}</div>
          <div class="board-post-meta">${escapeHtml(authorName)} · ${dateStr}</div>
        </div>
      </div>`;
  });
  
  postListDiv.innerHTML = html;
  renderPagination(totalPages);
}


// ✅ 수정: 게시글 상세보기 (경로 통일)
function openBoardDetail(postId) {
  if (typeof firebase === 'undefined') {
    showToast('서버 연결에 실패했습니다.');
    return;
  }
  
  currentPostId = postId;
  
  // 먼저 현재 캐시에서 찾기
  let post = null;
  const cache = boardPostCache[currentBoardCategory] || [];
  post = cache.find(p => (p.id === postId) || (p.firebaseKey === postId));
  
  const fetchPromise = post ? Promise.resolve(post) : 
    firebase.database().ref(`boards/${currentBoardCategory}/posts`).once('value').then(snap => {
      const data = snap.val();
      if (data) {
        const found = Object.entries(data).find(([key, val]) => val.id === postId || key === postId);
        return found ? found[1] : null;
      }
      return null;
    });
  
  fetchPromise.then(postData => {
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
    
    let html = `<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">✍️ ${escapeHtml(authorName)} · ${dateStr}</div>`;
    html += `<div style="white-space:pre-wrap;margin-bottom:12px;line-height:1.6;">${escapeHtml(postData.content || '')}</div>`;
    
    if (postData.photos && postData.photos.length) {
      postData.photos.forEach(src => {
        if (src) html += `<img src="${src}" style="width:100%;border-radius:12px;margin-bottom:6px;" onerror="this.style.display='none'">`;
      });
    } else if (postData.photo) {
      html += `<img src="${postData.photo}" style="width:100%;border-radius:12px;margin-bottom:6px;" onerror="this.style.display='none'">`;
    }
    
    if (contentEl) contentEl.innerHTML = html;
    
    // 댓글 렌더링
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


// ✅ 수정: 댓글 등록 (경로 통일)
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
  
  // ✅ 현재 게시글의 firebaseKey 찾기
  const cache = boardPostCache[currentBoardCategory] || [];
  const post = cache.find(p => p.id === currentPostId || p.firebaseKey === currentPostId);
  
  if (!post || !post.firebaseKey) {
    showToast('게시글 정보를 찾을 수 없습니다.');
    return;
  }
  
  const comment = {
    text: text,
    author: user.name || user.id || '익명',
    authorId: user.id || user.uid,
    timestamp: Date.now()
  };
  
  firebase.database().ref(`boards/${currentBoardCategory}/posts/${post.firebaseKey}/comments`).push(comment)
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


// ✅ 추가: 페이지네이션 함수가 제대로 정의되어 있는지 확인
function renderPagination(totalPages) {
  const pagDiv = document.getElementById('board-pagination');
  if (!pagDiv) return;
  if (totalPages <= 1) {
    pagDiv.innerHTML = '';
    return;
  }
  
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