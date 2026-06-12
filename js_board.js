// ==================== 게시판 기능 (js_board.js) ====================
// 최종 수정본 - 댓글 삭제 기능 추가


window.currentBoardCategory = window.currentBoardCategory || '일반성도';
window.currentPostId = window.currentPostId || null;
window.currentBoardPage = window.currentBoardPage || 1;
window.boardPostCache = window.boardPostCache || {};
window.POSTS_PER_PAGE = 10;


var currentBoardCategory = window.currentBoardCategory;
var currentPostId = window.currentPostId;
var currentBoardPage = window.currentBoardPage;
var boardPostCache = window.boardPostCache;
var POSTS_PER_PAGE = 10;


// ==================== 현재 사용자 가져오기 ====================
function getBoardCurrentUser() {
  if (typeof window.currentUser !== 'undefined' && window.currentUser) return window.currentUser;
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  return null;
}


// ==================== 이미지 리사이즈 ====================
function resizeBoardImage(file, maxW, maxH, quality) {
  maxW = maxW || 800;
  maxH = maxH || 600;
  quality = quality || 0.8;
  
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function(e) {
      var img = new Image();
      img.onerror = reject;
      img.onload = function() {
        var width = img.width;
        var height = img.height;
        if (width > maxW || height > maxH) {
          var ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
        canvas.remove();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


// ==================== 카테고리 이름 반환 ====================
function getCategoryLabel(cat) {
  var map = {
    '일반성도': '📌 일반성도',
    '꿈지락': '🐣 꿈지락 (0~4세)',
    '꿈트리': '🌱 꿈트리 (5~7세)',
    '꿈마루': '📚 꿈마루 (초등)',
    '꿈하나': '🔥 꿈하나 (청소년)',
    '새이플러스': '✝️ 새이플러스 (청년부)'
  };
  return map[cat] || cat;
}


// ==================== 게시판 초기화 ====================
function initBoard() {
  console.log('initBoard 실행');
  
  var btns = document.querySelectorAll('#board-category-list .board-cat-btn');
  console.log('카테고리 버튼 개수:', btns ? btns.length : 0);
  
  if (!btns || btns.length === 0) {
    console.warn('카테고리 버튼 없음');
    return;
  }
  
  for (var i = 0; i < btns.length; i++) {
    var btn = btns[i];
    if (btn.hasAttribute('data-bound')) continue;
    btn.setAttribute('data-bound', 'true');
    
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      var cat = this.getAttribute('data-cat');
      console.log('카테고리 클릭:', cat);
      
      var allBtns = document.querySelectorAll('#board-category-list .board-cat-btn');
      for (var j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove('active');
      }
      this.classList.add('active');
      
      window.currentBoardCategory = cat;
      currentBoardCategory = cat;
      window.currentBoardPage = 1;
      currentBoardPage = 1;
      openBoardCategory();
    });
  }
}


// ==================== 게시판 열기 ====================
function openBoardCategory() {
  console.log('openBoardCategory 실행, 카테고리:', currentBoardCategory);
  
  var list = document.getElementById('board-category-list');
  var content = document.getElementById('board-content');
  var titleEl = document.getElementById('board-category-title');
  
  if (!list || !content) {
    console.error('게시판 요소 없음');
    return;
  }
  
  list.style.display = 'none';
  content.style.display = 'block';
  
  if (titleEl) {
    titleEl.textContent = getCategoryLabel(currentBoardCategory);
  }
  
  loadPosts();
  loadBoardManager();
  updateBoardWriteBtn();
}


// ==================== 게시글 목록으로 돌아가기 ====================
function showBoardCategoryList() {
  console.log('showBoardCategoryList 실행');
  
  var list = document.getElementById('board-category-list');
  var content = document.getElementById('board-content');
  
  if (list) list.style.display = 'flex';
  if (content) content.style.display = 'none';
}


// ==================== 게시글 로드 ====================
function loadPosts() {
  console.log('loadPosts 실행, 카테고리:', currentBoardCategory);
  
  var postListDiv = document.getElementById('board-post-list');
  if (!postListDiv) {
    console.error('board-post-list 요소 없음');
    return;
  }
  
  postListDiv.innerHTML = '<div style="text-align:center;padding:40px;"><div class="splash-spinner" style="width:24px;height:24px;"></div><div>로딩 중...</div></div>';
  
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    console.warn('Firebase 미연결');
    postListDiv.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">서버 연결에 실패했습니다.</div>';
    return;
  }
  
  var postsRef = firebase.database().ref('boards/' + currentBoardCategory + '/posts');
  postsRef.once('value')
    .then(function(snap) {
      var data = snap.val();
      var filteredPosts = [];
      
      if (data) {
        var entries = Object.entries(data);
        for (var i = 0; i < entries.length; i++) {
          var key = entries[i][0];
          var value = entries[i][1];
          filteredPosts.push({
            ...value,
            firebaseKey: key
          });
        }
        filteredPosts.sort(function(a, b) {
          return (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0);
        });
        console.log('게시글 개수:', filteredPosts.length);
      }
      
      boardPostCache[currentBoardCategory] = filteredPosts;
      renderPostsPage();
    })
    .catch(function(err) {
      console.error('Firebase posts 로드 실패:', err);
      boardPostCache[currentBoardCategory] = [];
      renderPostsPage();
    });
}


// ==================== 게시글 렌더링 ====================
function renderPostsPage() {
  var cache = boardPostCache[currentBoardCategory] || [];
  var totalPages = Math.max(1, Math.ceil(cache.length / POSTS_PER_PAGE));
  var start = (currentBoardPage - 1) * POSTS_PER_PAGE;
  var pageItems = cache.slice(start, start + POSTS_PER_PAGE);
  
  var postListDiv = document.getElementById('board-post-list');
  if (!postListDiv) return;
  
  if (pageItems.length === 0) {
    postListDiv.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">📝 아직 게시글이 없습니다.<br>첫 번째 글을 작성해보세요!</div>';
    renderPagination(totalPages);
    return;
  }
  
  var html = '';
  for (var i = 0; i < pageItems.length; i++) {
    var post = pageItems[i];
    var postId = post.id || post.firebaseKey;
    var firstPhoto = post.photo || (post.photos && post.photos.length ? post.photos[0] : null);
    var authorName = post.authorName || post.author || '익명';
    var timestamp = post.createdAt || post.timestamp;
    var dateStr = timestamp ? new Date(timestamp).toLocaleString() : '날짜 없음';
    
    html += '<div class="board-post-item" onclick="openBoardDetail(\'' + postId + '\')">';
    if (firstPhoto) {
      html += '<img class="board-post-thumb" src="' + firstPhoto + '" alt="썸네일" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27 viewBox=%270 0 40 40%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27%23ddd%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 fill=%27%23999%27%3E📷%3C/text%3E%3C/svg%3E\'">';
    } else {
      html += '<div class="board-post-thumb" style="display:flex;align-items:center;justify-content:center;background:#f0f0f0;">📷</div>';
    }
    html += '<div class="board-post-info">' +
      '<div class="board-post-title">' + escapeHtml(post.title || '제목 없음') + '</div>' +
      '<div class="board-post-meta">' + escapeHtml(authorName) + ' · ' + dateStr + '</div>' +
    '</div></div>';
  }
  
  postListDiv.innerHTML = html;
  renderPagination(totalPages);
}


// ==================== 페이지네이션 ====================
function renderPagination(totalPages) {
  var pagDiv = document.getElementById('board-pagination');
  if (!pagDiv) return;
  if (totalPages <= 1) {
    pagDiv.innerHTML = '';
    return;
  }
  
  var pagHTML = '';
  for (var i = 1; i <= totalPages; i++) {
    pagHTML += '<button class="board-page-btn' + (i === currentBoardPage ? ' active' : '') + '" onclick="changeBoardPage(' + i + ')">' + i + '</button>';
  }
  pagDiv.innerHTML = pagHTML;
}


function changeBoardPage(page) {
  currentBoardPage = page;
  renderPostsPage();
}


// ==================== 담당자 정보 로드 ====================
function loadBoardManager() {
  var managerArea = document.getElementById('board-manager-area');
  var managerContent = document.getElementById('board-manager-content');
  
  if (!managerArea || !managerContent) return;
  
  if (currentBoardCategory === '일반성도') {
    managerArea.style.display = 'none';
    return;
  }
  
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    managerArea.style.display = 'none';
    return;
  }
  
  firebase.database().ref('boards/' + currentBoardCategory + '/manager').once('value')
    .then(function(snap) {
      var data = snap.val();
      if (data && data.name) {
        managerArea.style.display = 'block';
        managerContent.innerHTML = '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:50px;height:50px;border-radius:50%;overflow:hidden;background:#eee;display:flex;align-items:center;justify-content:center;font-size:24px;">' +
          (data.photo ? '<img src="' + data.photo + '" style="width:100%;height:100%;object-fit:cover;">' : '👤') +
          '</div>' +
          '<div>' +
            '<div style="font-weight:700;">' + escapeHtml(data.name) + '</div>' +
            '<div style="font-size:12px;color:var(--text2);">담당</div>' +
          '</div>' +
        '</div>';
      } else {
        managerArea.style.display = 'none';
      }
    })
    .catch(function() { managerArea.style.display = 'none'; });
}


// ==================== 글쓰기 버튼 표시 ====================
function updateBoardWriteBtn() {
  var wrap = document.getElementById('board-write-btn-wrap');
  if (!wrap) return;
  
  var user = getBoardCurrentUser();
  var role = user && user.role;
  wrap.style.display = (role === 'admin' || role === 'manager') ? 'block' : 'none';
}


// ==================== 댓글 영역 표시 ====================
function updateBoardCommentArea() {
  var inputWrap = document.getElementById('board-comment-input-wrap');
  var loginMsg = document.getElementById('board-comment-login-msg');
  if (!inputWrap || !loginMsg) return;
  
  var user = getBoardCurrentUser();
  if (user) {
    inputWrap.style.display = 'block';
    loginMsg.style.display = 'none';
  } else {
    inputWrap.style.display = 'none';
    loginMsg.style.display = 'block';
  }
}


// ==================== 게시글 상세보기 ====================
function openBoardDetail(postId) {
  console.log('openBoardDetail 실행:', postId);
  
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    if (typeof showToast === 'function') showToast('서버 연결에 실패했습니다.');
    return;
  }
  
  window.currentPostId = postId;
  currentPostId = postId;
  
  var cache = boardPostCache[currentBoardCategory] || [];
  var post = null;
  for (var i = 0; i < cache.length; i++) {
    if (cache[i].id === postId || cache[i].firebaseKey === postId) {
      post = cache[i];
      break;
    }
  }
  
  var fetchPromise = post ? Promise.resolve(post) : 
    firebase.database().ref('boards/' + currentBoardCategory + '/posts').once('value').then(function(snap) {
      var data = snap.val();
      if (data) {
        var entries = Object.entries(data);
        for (var i = 0; i < entries.length; i++) {
          var key = entries[i][0];
          var val = entries[i][1];
          if (val.id === postId || key === postId) {
            return val;
          }
        }
      }
      return null;
    });
  
  fetchPromise.then(function(postData) {
    if (!postData) {
      if (typeof showToast === 'function') showToast('게시물을 찾을 수 없습니다.');
      return;
    }
    
    var titleEl = document.getElementById('board-detail-title');
    var contentEl = document.getElementById('board-detail-content');
    
    if (titleEl) titleEl.textContent = postData.title || '';
    
    var authorName = postData.authorName || postData.author || '익명';
    var timestamp = postData.createdAt || postData.timestamp;
    var dateStr = timestamp ? new Date(timestamp).toLocaleString() : '날짜 없음';
    
    var html = '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">✍️ ' + escapeHtml(authorName) + ' · ' + dateStr + '</div>';
    html += '<div style="white-space:pre-wrap;margin-bottom:12px;line-height:1.6;">' + escapeHtml(postData.content || '') + '</div>';
    
    if (postData.photos && postData.photos.length) {
      for (var i = 0; i < postData.photos.length; i++) {
        var src = postData.photos[i];
        if (src) html += '<img src="' + src + '" style="width:100%;border-radius:12px;margin-bottom:6px;" loading="lazy" onerror="this.style.display=\'none\'">';
      }
    } else if (postData.photo) {
      html += '<img src="' + postData.photo + '" style="width:100%;border-radius:12px;margin-bottom:6px;" loading="lazy" onerror="this.style.display=\'none\'">';
    }
    
    if (contentEl) contentEl.innerHTML = html;
    
    var comments = postData.comments || {};
    renderComments(comments, postData.firebaseKey || postId);
    
    var modal = document.getElementById('board-detail-overlay');
    if (modal) modal.style.display = 'flex';
    
    updateBoardCommentArea();
  }).catch(function(err) {
    console.error('게시물 로드 실패:', err);
    if (typeof showToast === 'function') showToast('게시물을 불러올 수 없습니다.');
  });
}


function closeBoardDetail() {
  var modal = document.getElementById('board-detail-overlay');
  if (modal) modal.style.display = 'none';
}


// ==================== 댓글 렌더링 (삭제 버튼 포함) ====================
function renderComments(comments, postFirebaseKey) {
  var commentsList = document.getElementById('board-comments-list');
  if (!commentsList) return;
  
  var currentUser = getBoardCurrentUser();
  var list = Object.entries(comments).sort(function(a, b) {
    return (a[1].timestamp || 0) - (b[1].timestamp || 0);
  });
  var html = '';
  
  for (var i = 0; i < list.length; i++) {
    var commentKey = list[i][0];
    var comment = list[i][1];
    var isAuthor = currentUser && (currentUser.name === comment.author || currentUser.id === comment.authorId);
    
    html += '<div style="margin-bottom:12px;padding:8px 0;border-bottom:1px solid var(--border);">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div>' +
          '<b style="color:var(--purple);">' + escapeHtml(comment.author) + '</b>' +
          '<span style="font-size:11px;color:var(--text2);margin-left:8px;">' + (comment.timestamp ? new Date(comment.timestamp).toLocaleString() : '') + '</span>' +
        '</div>';
    
    // 삭제 버튼 (본인 댓글만)
    if (isAuthor) {
      html += '<button onclick="deleteBoardComment(\'' + postFirebaseKey + '\', \'' + commentKey + '\')" style="background:none;border:none;color:var(--red);font-size:11px;cursor:pointer;">🗑 삭제</button>';
    }
    
    html += '</div>' +
      '<div style="margin-top:4px;font-size:13px;">' + escapeHtml(comment.text) + '</div>' +
    '</div>';
  }
  
  commentsList.innerHTML = html || '<div style="color:var(--text2);font-size:12px;padding:12px;text-align:center;">아직 댓글이 없습니다.</div>';
}


// ==================== 댓글 삭제 (새로운 기능) ====================
function deleteBoardComment(postFirebaseKey, commentKey) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  
  var user = getBoardCurrentUser();
  if (!user) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다.');
    return;
  }
  
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    if (typeof showToast === 'function') showToast('서버 연결에 실패했습니다.');
    return;
  }
  
  firebase.database().ref('boards/' + currentBoardCategory + '/posts/' + postFirebaseKey + '/comments/' + commentKey).remove()
    .then(function() {
      if (typeof showToast === 'function') showToast('🗑 댓글이 삭제되었습니다.');
      // 현재 게시글 다시 로드
      openBoardDetail(currentPostId);
    })
    .catch(function(err) {
      console.error('댓글 삭제 실패:', err);
      if (typeof showToast === 'function') showToast('❌ 삭제 실패');
    });
}


// ==================== 댓글 등록 ====================
function submitBoardComment() {
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    if (typeof showToast === 'function') showToast('서버 연결에 실패했습니다.');
    return;
  }
  
  var user = getBoardCurrentUser();
  if (!user) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다.');
    var loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  var commentInput = document.getElementById('board-comment-input');
  var text = commentInput ? commentInput.value.trim() : '';
  
  if (!text) {
    if (typeof showToast === 'function') showToast('댓글 내용을 입력하세요.');
    return;
  }
  
  var cache = boardPostCache[currentBoardCategory] || [];
  var post = null;
  for (var i = 0; i < cache.length; i++) {
    if (cache[i].id === currentPostId || cache[i].firebaseKey === currentPostId) {
      post = cache[i];
      break;
    }
  }
  
  if (!post || !post.firebaseKey) {
    if (typeof showToast === 'function') showToast('게시글 정보를 찾을 수 없습니다.');
    return;
  }
  
  var comment = {
    text: text,
    author: user.name || user.id || '익명',
    authorId: user.id,
    timestamp: Date.now()
  };
  
  firebase.database().ref('boards/' + currentBoardCategory + '/posts/' + post.firebaseKey + '/comments').push(comment)
    .then(function() {
      if (commentInput) commentInput.value = '';
      openBoardDetail(currentPostId);
      if (typeof showToast === 'function') showToast('✅ 댓글이 등록되었습니다.');
    })
    .catch(function(err) {
      console.error('댓글 등록 실패:', err);
      if (typeof showToast === 'function') showToast('댓글 등록에 실패했습니다.');
    });
}


// ==================== 글쓰기 모달 ====================
function openBoardWrite() {
  var user = getBoardCurrentUser();
  
  if (!user) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다.');
    var loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  if (user.role !== 'manager' && user.role !== 'admin') {
    if (typeof showToast === 'function') showToast('게시물 작성은 매니저 이상만 가능합니다.');
    return;
  }
  
  var titleInput = document.getElementById('board-write-title');
  var contentInput = document.getElementById('board-write-content');
  var previewDiv = document.getElementById('board-photo-preview');
  
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
  if (previewDiv) previewDiv.innerHTML = '';
  
  window._boardResizedPhotos = null;
  
  var modal = document.getElementById('board-write-overlay');
  if (modal) modal.style.display = 'flex';
}


function closeBoardWrite() {
  var modal = document.getElementById('board-write-overlay');
  if (modal) modal.style.display = 'none';
}


// ==================== 게시글 저장 ====================
async function submitBoardPost() {
  console.log('submitBoardPost 시작');
  
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    console.error('Firebase 연결 안됨');
    if (typeof showToast === 'function') showToast('서버 연결에 실패했습니다.');
    return;
  }
  
  var user = getBoardCurrentUser();
  if (!user) {
    if (typeof showToast === 'function') showToast('로그인이 필요합니다.');
    var loginScreen = document.getElementById('screen-login');
    if (loginScreen) loginScreen.style.display = 'flex';
    return;
  }
  
  if (user.role !== 'manager' && user.role !== 'admin') {
    if (typeof showToast === 'function') showToast('게시물 작성은 매니저 이상만 가능합니다.');
    return;
  }
  
  var titleInput = document.getElementById('board-write-title');
  var contentInput = document.getElementById('board-write-content');
  
  var title = titleInput ? titleInput.value.trim() : '';
  var content = contentInput ? contentInput.value.trim() : '';
  
  if (!title) {
    if (typeof showToast === 'function') showToast('제목을 입력하세요.');
    return;
  }
  if (!content) {
    if (typeof showToast === 'function') showToast('내용을 입력하세요.');
    return;
  }
  
  var photos = [];
  if (window._boardResizedPhotos && window._boardResizedPhotos.length) {
    photos = window._boardResizedPhotos;
  }
  
  var newPost = {
    id: Date.now().toString(),
    title: title,
    content: content,
    category: currentBoardCategory,
    authorId: user.id,
    authorName: user.name || user.id || '익명',
    author: user.name || user.id || '익명',
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    photos: photos,
    photo: photos.length > 0 ? photos[0] : null,
    comments: {}
  };
  
  console.log('📝 저장할 데이터:', newPost);
  
  try {
    var postRef = firebase.database().ref('boards/' + currentBoardCategory + '/posts/' + newPost.id);
    await postRef.set(newPost);
    
    console.log('✅ 저장 성공!');
    if (typeof showToast === 'function') showToast('✅ 게시물이 등록되었습니다.');
    
    closeBoardWrite();
    
    boardPostCache[currentBoardCategory] = null;
    currentBoardPage = 1;
    loadPosts();
    
  } catch (err) {
    console.error('❌ 저장 실패:', err);
    if (typeof showToast === 'function') showToast('저장 중 오류가 발생했습니다.');
  }
}


// ==================== 사진 미리보기 ====================
function boardPhotoPreview(input) {
  if (!input.files || input.files.length === 0) return;
  
  var previewDiv = document.getElementById('board-photo-preview');
  if (!previewDiv) return;
  
  previewDiv.innerHTML = '';
  var resizedPromises = [];
  var files = Array.from(input.files);
  
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (file.size > 3 * 1024 * 1024) {
      if (typeof showToast === 'function') showToast('사진은 3MB 이하로 올려주세요.');
      continue;
    }
    resizedPromises.push(
      resizeBoardImage(file, 800, 600, 0.8).then(function(dataUrl) {
        var img = document.createElement('img');
        img.src = dataUrl;
        img.style.cssText = 'width:80px;height:80px;object-fit:cover;border-radius:8px;margin:4px;';
        previewDiv.appendChild(img);
        return dataUrl;
      }).catch(function(err) {
        console.error('이미지 리사이즈 실패:', err);
        return null;
      })
    );
  }
  
  Promise.all(resizedPromises).then(function(photos) {
    window._boardResizedPhotos = photos.filter(function(p) { return p !== null; });
  });
}


// ==================== 초기화 ====================
function initBoardOnLoad() {
  console.log('initBoardOnLoad 실행');
  initBoard();
}


// DOMContentLoaded에서 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBoardOnLoad);
} else {
  initBoardOnLoad();
}


console.log('✅ js_board.js 로드 완료 (댓글 삭제 기능 포함)');