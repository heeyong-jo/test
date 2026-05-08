// ==================== 게시판 기능 ====================
let currentBoardCategory = '일반성도';
let boardManagerCache = {};    // 카테고리별 관리자 정보
let boardPostCache = {};       // 게시물 목록 캐시
let currentPostId = null;


// ── 초기화 ──
function initBoard() {
  const postList = document.getElementById('board-post-list');
  if (!postList || postList.offsetParent === null) {
    setTimeout(initBoard, 100);
    return;
  }
  createBoardWriteUI();
  createBoardDetailModal();  
  // 기존 버튼 복제 및 이벤트 재등록
  document.querySelectorAll('.board-cat-btn').forEach(b => {
    b.replaceWith(b.cloneNode(true));
  });
  const btns = document.querySelectorAll('.board-cat-btn');
  btns.forEach(b => {
    b.addEventListener('click', function() {
      btns.forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      currentBoardCategory = this.dataset.cat;
      loadBoardManager();
      loadPosts();


      // 카테고리 클릭 시 글쓰기 버튼 권한 체크
      const writeBtnWrap = document.getElementById('board-write-btn-wrap');
      if (writeBtnWrap) {
        if (currentUser && (currentUser.role === 'manager' || currentUser.role === 'admin')) {
          writeBtnWrap.style.display = 'block';
        } else {
          writeBtnWrap.style.display = 'none';
        }
      }
    });
  });


  loadBoardManager();
  loadPosts();


  // 초기에는 글쓰기 버튼 숨김
  const writeBtnWrap = document.getElementById('board-write-btn-wrap');
  if (writeBtnWrap) writeBtnWrap.style.display = 'none';
updateBoardWriteBtn();
updateBoardCommentArea();
}


// ── 관리자 정보 표시 (일반성도 제외) ──
function loadBoardManager() {
  if (currentBoardCategory === '일반성도') {
    document.getElementById('board-manager-area').style.display = 'none';
    return;
  }
  const catRef = firebase.database().ref(`boards/${currentBoardCategory}/manager`);
  catRef.once('value', snap => {
    const data = snap.val();
    if (data) {
      boardManagerCache[currentBoardCategory] = data;
      document.getElementById('board-manager-area').style.display = 'block';
      document.getElementById('board-manager-content').innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:50px;height:50px;border-radius:50%;overflow:hidden;background:#eee;">
            ${data.photo ? `<img src="${data.photo}" style="width:100%;height:100%;object-fit:cover;">` : '👤'}
          </div>
          <div>
            <div style="font-weight:700;">${data.name}</div>
            <div style="font-size:12px;color:var(--text2);">담당</div>
          </div>
        </div>
      `;
    } else {
      document.getElementById('board-manager-area').style.display = 'none';
    }
  });
}


// ── 게시물 목록 로드 ──
function loadPosts() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;


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
   <div class="board-post-meta">${post.author} · ${new Date(post.timestamp).toLocaleString()}</div>
          </div>
        </div>`;
    });
    document.getElementById('board-post-list').innerHTML = html;
  });
}


// ── 글쓰기 열기 ──
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


function closeBoardWrite() {
  document.getElementById('board-write-overlay').style.display = 'none';
}


// 사진 미리보기 + 리사이즈
function boardPhotoPreview(input) {
  const files = input.files;
  const previewDiv = document.getElementById('board-photo-preview');
  previewDiv.innerHTML = '';
  const resizedPromises = [];


  for (let file of files) {
    if (file.size > 3 * 1024 * 1024) {
      alert('사진은 3MB 이하로 올려주세요.');
      continue;
    }
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
  if (window._boardResizedPhotos) {
    photos = await window._boardResizedPhotos;
  }


  const postRef = firebase.database().ref(`boards/${currentBoardCategory}/posts`).push();
  const post = {
    title, content, photos,
    author: currentUser.name,
    authorId: currentUser.uid,
    timestamp: Date.now(),
    comments: {}
  };
  await postRef.set(post);
  closeBoardWrite();
  loadPosts();
  window._boardResizedPhotos = null;
}


// ── 게시물 상세 모달 ──
function openBoardDetail(postId) {
  currentPostId = postId;
  createCommentInput();   // ← 모달/입력 UI 먼저 보장
  const ref = firebase.database().ref(`boards/${currentBoardCategory}/posts/${postId}`);
  ref.once('value', snap => {
    const post = snap.val();
    if (!post) return;    // ← 삭제된 글 방어
    document.getElementById('board-detail-title').textContent = post.title;
    let html = `<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">${post.author} · ${new Date(post.timestamp).toLocaleString()}</div>`;
    html += `<div style="white-space:pre-wrap;margin-bottom:12px;">${escapeHtml(post.content)}</div>`;
    if (post.photos) {
      post.photos.forEach(src => {
        html += `<img src="${src}" style="width:100%;border-radius:12px;margin-bottom:6px;">`;
      });
    }
    document.getElementById('board-detail-content').innerHTML = html;
    renderComments(post.comments || {});
    document.getElementById('board-detail-overlay').style.display = 'flex';
  });
}


function closeBoardDetail() {
  document.getElementById('board-detail-overlay').style.display = 'none';
  currentPostId = null;
}


// ── 댓글 렌더링 ──
function renderComments(comments) {
  const list = Object.entries(comments).sort((a,b) => a[1].timestamp - b[1].timestamp);
  let html = '';
  list.forEach(([cid, c]) => {
    html += `<div style="margin-bottom:8px;"><b>${escapeHtml(c.author)}</b> ${escapeHtml(c.text)} <span style="font-size:10px;color:var(--text2);">${new Date(c.timestamp).toLocaleString()}</span></div>`;
  });
  document.getElementById('board-comments-list').innerHTML = html || '<div style="color:var(--text2);font-size:12px;">아직 댓글이 없습니다.</div>';
}


// ── 댓글 작성 ──
function submitBoardComment() {
  if (!currentUser) { alert('로그인이 필요합니다.'); return; }
  const text = document.getElementById('board-comment-input').value.trim();
  if (!text) return;
  const ref = firebase.database().ref(`boards/${currentBoardCategory}/posts/${currentPostId}/comments`).push();
  ref.set({
    text,
    author: currentUser.name,
    timestamp: Date.now()
  }).then(() => {
    document.getElementById('board-comment-input').value = '';
    openBoardDetail(currentPostId);
  });
}
function createBoardWriteUI() {
  if (document.getElementById('board-write-btn-wrap')) return;


  const postList = document.getElementById('board-post-list');
  if (!postList) {
    setTimeout(createBoardWriteUI, 100);
    return;
  }


    // 글쓰기 버튼
    const btnWrap = document.createElement('div');
  btnWrap.id = 'board-write-btn-wrap';
  btnWrap.style.cssText = 'display:none;margin-bottom:10px;';
  btnWrap.innerHTML = '<button class="btn-primary" style="width:100%;padding:10px;" onclick="openBoardWrite()">✏️ 글쓰기</button>';
  postList.parentNode.insertBefore(btnWrap, postList);


  // 글쓰기 모달
  const overlay = document.createElement('div');
  overlay.id = 'board-write-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'align-items:center;';
  overlay.innerHTML = `
    <div class="modal-box" style="border-radius:24px;max-width:600px;">
      <div class="modal-header">
        <div class="modal-title">✏️ 글쓰기</div>
        <button class="modal-close" onclick="closeBoardWrite()">✕</button>
      </div>
      <div class="input-group">
        <div class="input-label">제목</div>
        <input class="input-field" id="board-write-title" placeholder="제목">
      </div>
      <div class="input-group">
        <div class="input-label">내용</div>
        <textarea class="input-field" id="board-write-content" rows="6" placeholder="내용을 입력하세요..."></textarea>
      </div>
      <div class="input-group">
        <div class="input-label">사진 첨부</div>
        <input type="file" id="board-write-photo" accept="image/*" onchange="boardPhotoPreview(this)">
        <div id="board-photo-preview" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;"></div>
      </div>
      <button class="btn-primary" onclick="submitBoardPost()">등록</button>
    </div>
  `;
  document.body.appendChild(overlay);
}


// ── ② 글 상세보기 모달 동적 생성 ──
function createBoardDetailModal() {
  if (document.getElementById('board-detail-overlay')) return;
  if (!document.body) {
    setTimeout(createBoardDetailModal, 100);
    return;
  }
  const overlay = document.createElement('div');
  overlay.id = 'board-detail-overlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'align-items:center;';
  overlay.innerHTML = `
    <div class="modal-box" style="border-radius:24px;max-width:600px;max-height:90vh;overflow-y:auto;">
      <div class="modal-header">
        <div class="modal-title" id="board-detail-title"></div>
        <button class="modal-close" onclick="closeBoardDetail()">✕</button>
      </div>
      <div id="board-detail-content" style="margin-bottom:16px;"></div>
      <div class="board-comments-section">
        <div class="board-comments-title">💬 댓글</div>
        <div id="board-comments-list"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}


// ── ③ 댓글 입력 UI 동적 생성 ──
function createCommentInput() {
  if (document.getElementById('board-comment-input-wrap')) return;


  const commentSection = document.querySelector('.board-comments-section');
  if (!commentSection) return;


  const inputWrap = document.createElement('div');
  inputWrap.id = 'board-comment-input-wrap';
  inputWrap.className = 'input-group';
  inputWrap.style.marginTop = '12px';
  inputWrap.innerHTML = `
    <textarea id="board-comment-input" class="input-field" rows="2" placeholder="댓글을 입력하세요..."></textarea>
    <button class="btn-primary" onclick="submitBoardComment()" style="margin-top:8px;">등록</button>
  `;


  const loginMsg = document.createElement('div');
  loginMsg.id = 'board-comment-login-msg';
  loginMsg.style.cssText = 'display:none;text-align:center;padding:12px;font-size:12px;color:var(--text2);';
  loginMsg.textContent = '댓글을 작성하려면 로그인이 필요합니다.';


  commentSection.appendChild(inputWrap);
  commentSection.appendChild(loginMsg);


  // 로그인 상태에 따라 표시 전환
  if (currentUser) {
    inputWrap.style.display = 'block';
    loginMsg.style.display = 'none';
  } else {
    inputWrap.style.display = 'none';
    loginMsg.style.display = 'block';
  }
}