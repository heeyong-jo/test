// ==================== 게시판 관리 (댓글 삭제 기능 추가) ====================


let currentCategory = '일반성도';
let currentPostId = null;
let currentPosts = [];
let currentComments = [];


// ==================== 게시판 초기화 ====================
function initBoard() {
  console.log('initBoard 실행');
  currentCategory = '일반성도';
  showBoardCategoryList();
  loadPosts();
}


// ==================== 카테고리 목록 표시 ====================
function showBoardCategoryList() {
  document.getElementById('board-content').style.display = 'none';
  document.getElementById('board-category-list').style.display = 'flex';
  document.getElementById('board-write-btn-wrap').style.display = 'none';
}


// ==================== 카테고리 선택 ====================
function selectCategory(category) {
  console.log('카테고리 선택:', category);
  currentCategory = category;
  
  // 카테고리 버튼 활성화 스타일
  document.querySelectorAll('.board-cat-btn').forEach(btn => {
    if (btn.getAttribute('data-cat') === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // 게시판 본문 표시
  document.getElementById('board-category-list').style.display = 'none';
  document.getElementById('board-content').style.display = 'block';
  document.getElementById('board-category-title').textContent = getCategoryTitle(category);
  
  // 글쓰기 버튼 표시 (로그인 필요)
  const user = getCurrentUser();
  if (user) {
    document.getElementById('board-write-btn-wrap').style.display = 'block';
  } else {
    document.getElementById('board-write-btn-wrap').style.display = 'none';
  }
  
  loadPosts();
}


// ==================== 카테고리 제목 가져오기 ====================
function getCategoryTitle(category) {
  const titles = {
    '일반성도': '📌 일반성도',
    '꿈지락': '🐣 꿈지락 (0~4세)',
    '꿈트리': '🌱 꿈트리 (5~7세)',
    '꿈마루': '📚 꿈마루 (초등)',
    '꿈하나': '🔥 꿈하나 (청소년)',
    '새이플러스': '✝️ 새이플러스 (청년부)'
  };
  return titles[category] || category;
}


// ==================== 게시물 로드 ====================
function loadPosts() {
  console.log('loadPosts 실행, 카테고리:', currentCategory);
  
  const container = document.getElementById('board-post-list');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner"></div><div>로딩 중...</div></div>';
  
  // Firebase에서 게시물 로드
  if (typeof firebase !== 'undefined' && firebase.database && window.FB_READY) {
    firebase.database().ref('posts').once('value')
      .then(snapshot => {
        const data = snapshot.val();
        if (data) {
          currentPosts = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
          }));
          currentPosts = currentPosts.filter(post => post.category === currentCategory);
          currentPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } else {
          currentPosts = [];
        }
        renderPostList();
      })
      .catch(err => {
        console.error('게시물 로드 실패:', err);
        container.innerHTML = '<div style="text-align:center;padding:40px;color:red;">⚠️ 게시물을 불러올 수 없습니다</div>';
      });
  } else {
    // localStorage에서 로드
    try {
      const saved = localStorage.getItem('ch2_posts');
      if (saved) {
        currentPosts = JSON.parse(saved);
        currentPosts = currentPosts.filter(post => post.category === currentCategory);
        currentPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } else {
        currentPosts = [];
      }
      renderPostList();
    } catch(e) {
      currentPosts = [];
      renderPostList();
    }
  }
}


// ==================== 게시물 목록 렌더링 ====================
function renderPostList() {
  const container = document.getElementById('board-post-list');
  if (!container) return;
  
  if (currentPosts.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">📝 작성된 게시물이 없습니다</div>';
    return;
  }
  
  let html = '';
  for (let i = 0; i < currentPosts.length; i++) {
    const post = currentPosts[i];
    html += `
      <div class="board-post-item" onclick="viewPost('${post.id}')">
        ${post.photo ? `<img src="${post.photo}" class="board-post-thumb" onerror="this.style.display='none'">` : '<div class="board-post-thumb" style="display:flex;align-items:center;justify-content:center;font-size:24px;">📝</div>'}
        <div class="board-post-info">
          <div class="board-post-title">${escapeHtml(post.title)}</div>
          <div class="board-post-meta">${escapeHtml(post.author)} · ${formatPostDate(post.timestamp)}</div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}


// ==================== 게시물 상세 보기 ====================
function viewPost(postId) {
  console.log('viewPost 실행:', postId);
  currentPostId = postId;
  
  const post = currentPosts.find(p => p.id === postId);
  if (!post) return;
  
  document.getElementById('board-detail-title').textContent = post.title;
  
  let contentHtml = `
    <div style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border);">
      <div style="color:var(--text2); font-size:12px; margin-bottom:8px;">
        작성자: ${escapeHtml(post.author)} · ${formatPostDate(post.timestamp)}
      </div>
      <div style="line-height:1.8; color:var(--text);">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
    </div>
  `;
  
  if (post.photo) {
    contentHtml += `<div style="margin-bottom:16px;"><img src="${post.photo}" style="width:100%; border-radius:12px;" onclick="window.open(this.src)"></div>`;
  }
  
  // 수정/삭제 버튼 (작성자만)
  const user = getCurrentUser();
  if (user && user.name === post.author) {
    contentHtml += `
      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button class="btn-secondary" style="flex:1; padding:8px;" onclick="editPost('${postId}')">✏️ 수정</button>
        <button class="btn-danger" style="flex:1; padding:8px;" onclick="deletePost('${postId}')">🗑 삭제</button>
      </div>
    `;
  }
  
  document.getElementById('board-detail-content').innerHTML = contentHtml;
  
  // 댓글 로드
  loadComments(postId);
  
  document.getElementById('board-detail-overlay').style.display = 'flex';
}


// ==================== 댓글 로드 ====================
function loadComments(postId) {
  console.log('loadComments 실행:', postId);
  
  const container = document.getElementById('board-comments-list');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:20px;">로딩 중...</div>';
  
  if (typeof firebase !== 'undefined' && firebase.database && window.FB_READY) {
    firebase.database().ref(`comments/${postId}`).once('value')
      .then(snapshot => {
        const data = snapshot.val();
        if (data) {
          currentComments = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
          }));
          currentComments.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        } else {
          currentComments = [];
        }
        renderComments();
      })
      .catch(err => {
        console.error('댓글 로드 실패:', err);
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">댓글을 불러올 수 없습니다</div>';
      });
  } else {
    // localStorage에서 로드
    try {
      const saved = localStorage.getItem(`ch2_comments_${postId}`);
      if (saved) {
        currentComments = JSON.parse(saved);
        currentComments.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      } else {
        currentComments = [];
      }
      renderComments();
    } catch(e) {
      currentComments = [];
      renderComments();
    }
  }
}


// ==================== 댓글 렌더링 (삭제 버튼 포함) ====================
function renderComments() {
  const container = document.getElementById('board-comments-list');
  const user = getCurrentUser();
  
  if (!container) return;
  
  if (currentComments.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">첫 번째 댓글을 작성해보세요!</div>';
    return;
  }
  
  let html = '';
  for (let i = 0; i < currentComments.length; i++) {
    const comment = currentComments[i];
    const isAuthor = user && user.name === comment.author;
    
    html += `
      <div style="background:var(--bg); border-radius:12px; padding:12px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="font-weight:700; font-size:12px; color:var(--purple);">${escapeHtml(comment.author)}</div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="font-size:10px; color:var(--text2);">${formatPostDate(comment.timestamp)}</div>
            ${isAuthor ? `<button onclick="deleteComment('${comment.id}')" style="background:none; border:none; color:var(--red); font-size:11px; cursor:pointer;">🗑 삭제</button>` : ''}
          </div>
        </div>
        <div style="font-size:13px; color:var(--text); line-height:1.6;">${escapeHtml(comment.content).replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }
  container.innerHTML = html;
}


// ==================== 댓글 작성 ====================
function submitBoardComment() {
  const user = getCurrentUser();
  if (!user) {
    if (typeof showToast === 'function') {
      showToast('로그인이 필요합니다.');
    } else {
      alert('로그인이 필요합니다.');
    }
    return;
  }
  
  const content = document.getElementById('board-comment-input').value.trim();
  if (!content) {
    if (typeof showToast === 'function') showToast('댓글 내용을 입력하세요');
    return;
  }
  
  const commentData = {
    id: Date.now().toString(),
    postId: currentPostId,
    author: user.name,
    content: content,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  if (typeof firebase !== 'undefined' && firebase.database && window.FB_READY) {
    firebase.database().ref(`comments/${currentPostId}`).push(commentData)
      .then(() => {
        document.getElementById('board-comment-input').value = '';
        if (typeof showToast === 'function') showToast('✅ 댓글이 등록되었습니다');
        loadComments(currentPostId);
      })
      .catch(err => {
        console.error('댓글 저장 실패:', err);
        if (typeof showToast === 'function') showToast('❌ 댓글 저장 실패');
      });
  } else {
    // localStorage 저장
    try {
      const saved = localStorage.getItem(`ch2_comments_${currentPostId}`);
      let comments = saved ? JSON.parse(saved) : [];
      comments.push(commentData);
      localStorage.setItem(`ch2_comments_${currentPostId}`, JSON.stringify(comments));
      document.getElementById('board-comment-input').value = '';
      if (typeof showToast === 'function') showToast('✅ 댓글이 등록되었습니다');
      loadComments(currentPostId);
    } catch(e) {
      console.error('댓글 저장 실패:', e);
      if (typeof showToast === 'function') showToast('❌ 댓글 저장 실패');
    }
  }
}


// ==================== 댓글 삭제 (새로운 기능) ====================
function deleteComment(commentId) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  
  const user = getCurrentUser();
  if (!user) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다.');
    return;
  }
  
  // 삭제할 댓글 찾기
  const comment = currentComments.find(c => c.id === commentId);
  if (!comment) {
    if (typeof showToast === 'function') showToast('댓글을 찾을 수 없습니다.');
    return;
  }
  
  // 작성자 본인만 삭제 가능
  if (user.name !== comment.author) {
    if (typeof showToast === 'function') showToast('⚠️ 본인이 작성한 댓글만 삭제할 수 있습니다.');
    return;
  }
  
  if (typeof firebase !== 'undefined' && firebase.database && window.FB_READY) {
    // Firebase에서 특정 댓글 찾아서 삭제
    firebase.database().ref(`comments/${currentPostId}`).once('value')
      .then(snapshot => {
        const data = snapshot.val();
        if (data) {
          let targetKey = null;
          for (const [key, value] of Object.entries(data)) {
            if (value.id === commentId) {
              targetKey = key;
              break;
            }
          }
          if (targetKey) {
            firebase.database().ref(`comments/${currentPostId}/${targetKey}`).remove()
              .then(() => {
                if (typeof showToast === 'function') showToast('🗑 댓글이 삭제되었습니다');
                loadComments(currentPostId);
              })
              .catch(err => {
                console.error('댓글 삭제 실패:', err);
                if (typeof showToast === 'function') showToast('❌ 삭제 실패');
              });
          } else {
            if (typeof showToast === 'function') showToast('댓글을 찾을 수 없습니다.');
          }
        }
      })
      .catch(err => {
        console.error('댓글 삭제 실패:', err);
        if (typeof showToast === 'function') showToast('❌ 삭제 실패');
      });
  } else {
    // localStorage에서 삭제
    try {
      const saved = localStorage.getItem(`ch2_comments_${currentPostId}`);
      let comments = saved ? JSON.parse(saved) : [];
      comments = comments.filter(c => c.id !== commentId);
      localStorage.setItem(`ch2_comments_${currentPostId}`, JSON.stringify(comments));
      if (typeof showToast === 'function') showToast('🗑 댓글이 삭제되었습니다');
      loadComments(currentPostId);
    } catch(e) {
      console.error('댓글 삭제 실패:', e);
      if (typeof showToast === 'function') showToast('❌ 삭제 실패');
    }
  }
}


// ==================== 게시물 작성 ====================
function openBoardWrite() {
  const user = getCurrentUser();
  if (!user) {
    if (typeof showToast === 'function') {
      showToast('로그인이 필요합니다.');
    } else {
      alert('로그인이 필요합니다.');
    }
    return;
  }
  
  document.getElementById('board-write-title').value = '';
  document.getElementById('board-write-content').value = '';
  document.getElementById('board-photo-preview').innerHTML = '';
  window._boardPhotoData = null;
  
  document.getElementById('board-write-overlay').style.display = 'flex';
}


function closeBoardWrite() {
  document.getElementById('board-write-overlay').style.display = 'none';
}


function boardPhotoPreview(input) {
  const previewDiv = document.getElementById('board-photo-preview');
  if (!previewDiv) return;
  
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewDiv.innerHTML = `<img src="${e.target.result}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;">`;
      window._boardPhotoData = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}


function submitBoardPost() {
  const user = getCurrentUser();
  if (!user) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다.');
    return;
  }
  
  const title = document.getElementById('board-write-title').value.trim();
  const content = document.getElementById('board-write-content').value.trim();
  
  if (!title || !content) {
    if (typeof showToast === 'function') showToast('제목과 내용을 입력하세요');
    return;
  }
  
  const postData = {
    id: Date.now().toString(),
    category: currentCategory,
    title: title,
    content: content,
    author: user.name,
    photo: window._boardPhotoData || null,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  if (typeof firebase !== 'undefined' && firebase.database && window.FB_READY) {
    firebase.database().ref('posts').push(postData)
      .then(() => {
        if (typeof showToast === 'function') showToast('✅ 게시물이 등록되었습니다');
        closeBoardWrite();
        loadPosts();
      })
      .catch(err => {
        console.error('게시물 저장 실패:', err);
        if (typeof showToast === 'function') showToast('❌ 저장 실패');
      });
  } else {
    try {
      const saved = localStorage.getItem('ch2_posts');
      let posts = saved ? JSON.parse(saved) : [];
      posts.unshift(postData);
      localStorage.setItem('ch2_posts', JSON.stringify(posts));
      if (typeof showToast === 'function') showToast('✅ 게시물이 등록되었습니다');
      closeBoardWrite();
      loadPosts();
    } catch(e) {
      console.error('게시물 저장 실패:', e);
      if (typeof showToast === 'function') showToast('❌ 저장 실패');
    }
  }
}


// ==================== 게시물 수정 ====================
function editPost(postId) {
  const post = currentPosts.find(p => p.id === postId);
  if (!post) return;
  
  document.getElementById('board-write-title').value = post.title;
  document.getElementById('board-write-content').value = post.content;
  if (post.photo) {
    document.getElementById('board-photo-preview').innerHTML = `<img src="${post.photo}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;">`;
    window._boardPhotoData = post.photo;
  }
  
  window._editingPostId = postId;
  document.getElementById('board-write-overlay').style.display = 'flex';
  
  // 수정 모드에서는 저장 버튼 동작 변경
  const originalSubmit = document.querySelector('#board-write-overlay .btn-primary').onclick;
  document.querySelector('#board-write-overlay .btn-primary').onclick = () => updatePost(postId);
}


function updatePost(postId) {
  const user = getCurrentUser();
  const post = currentPosts.find(p => p.id === postId);
  
  if (!user || user.name !== post.author) {
    if (typeof showToast === 'function') showToast('⚠️ 본인이 작성한 글만 수정할 수 있습니다.');
    return;
  }
  
  const title = document.getElementById('board-write-title').value.trim();
  const content = document.getElementById('board-write-content').value.trim();
  
  if (!title || !content) {
    if (typeof showToast === 'function') showToast('제목과 내용을 입력하세요');
    return;
  }
  
  const updatedPost = {
    ...post,
    title: title,
    content: content,
    photo: window._boardPhotoData || post.photo,
    updatedAt: Date.now()
  };
  
  if (typeof firebase !== 'undefined' && firebase.database && window.FB_READY) {
    firebase.database().ref(`posts/${postId}`).update(updatedPost)
      .then(() => {
        if (typeof showToast === 'function') showToast('✅ 게시물이 수정되었습니다');
        closeBoardWrite();
        loadPosts();
        if (currentPostId === postId) viewPost(postId);
      })
      .catch(err => {
        console.error('게시물 수정 실패:', err);
        if (typeof showToast === 'function') showToast('❌ 수정 실패');
      });
  } else {
    try {
      const saved = localStorage.getItem('ch2_posts');
      let posts = saved ? JSON.parse(saved) : [];
      const index = posts.findIndex(p => p.id === postId);
      if (index !== -1) {
        posts[index] = updatedPost;
        localStorage.setItem('ch2_posts', JSON.stringify(posts));
        if (typeof showToast === 'function') showToast('✅ 게시물이 수정되었습니다');
        closeBoardWrite();
        loadPosts();
        if (currentPostId === postId) viewPost(postId);
      }
    } catch(e) {
      console.error('게시물 수정 실패:', e);
      if (typeof showToast === 'function') showToast('❌ 수정 실패');
    }
  }
  
  window._editingPostId = null;
  document.querySelector('#board-write-overlay .btn-primary').onclick = submitBoardPost;
}


// ==================== 게시물 삭제 ====================
function deletePost(postId) {
  if (!confirm('게시물을 삭제하시겠습니까? 댓글도 함께 삭제됩니다.')) return;
  
  const user = getCurrentUser();
  const post = currentPosts.find(p => p.id === postId);
  
  if (!user || user.name !== post.author) {
    if (typeof showToast === 'function') showToast('⚠️ 본인이 작성한 글만 삭제할 수 있습니다.');
    return;
  }
  
  if (typeof firebase !== 'undefined' && firebase.database && window.FB_READY) {
    Promise.all([
      firebase.database().ref(`posts/${postId}`).remove(),
      firebase.database().ref(`comments/${postId}`).remove()
    ])
      .then(() => {
        if (typeof showToast === 'function') showToast('🗑 게시물이 삭제되었습니다');
        closeBoardDetail();
        loadPosts();
      })
      .catch(err => {
        console.error('게시물 삭제 실패:', err);
        if (typeof showToast === 'function') showToast('❌ 삭제 실패');
      });
  } else {
    try {
      const saved = localStorage.getItem('ch2_posts');
      let posts = saved ? JSON.parse(saved) : [];
      posts = posts.filter(p => p.id !== postId);
      localStorage.setItem('ch2_posts', JSON.stringify(posts));
      localStorage.removeItem(`ch2_comments_${postId}`);
      if (typeof showToast === 'function') showToast('🗑 게시물이 삭제되었습니다');
      closeBoardDetail();
      loadPosts();
    } catch(e) {
      console.error('게시물 삭제 실패:', e);
      if (typeof showToast === 'function') showToast('❌ 삭제 실패');
    }
  }
}


// ==================== 모달 닫기 ====================
function closeBoardDetail() {
  document.getElementById('board-detail-overlay').style.display = 'none';
  currentPostId = null;
}


// ==================== 날짜 포맷 ====================
function formatPostDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return Math.floor(diff / 60000) + '분 전';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '시간 전';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '일 전';
  return (date.getMonth() + 1) + '.' + date.getDate();
}


// ==================== 전역 함수 등록 ====================
window.initBoard = initBoard;
window.selectCategory = selectCategory;
window.showBoardCategoryList = showBoardCategoryList;
window.viewPost = viewPost;
window.closeBoardDetail = closeBoardDetail;
window.openBoardWrite = openBoardWrite;
window.closeBoardWrite = closeBoardWrite;
window.submitBoardPost = submitBoardPost;
window.boardPhotoPreview = boardPhotoPreview;
window.editPost = editPost;
window.deletePost = deletePost;
window.submitBoardComment = submitBoardComment;
window.deleteComment = deleteComment;  // ✅ 새로 추가


console.log('✅ js_board.js 로드 완료 (댓글 삭제 기능 포함)');