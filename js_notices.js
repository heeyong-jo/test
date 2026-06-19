// ==================== 공지사항 관리 (Firebase 저장 + 사진 여러장 지원) ====================


// 전역 변수
var noticeEditId = null;
var noticeResizedPhotos = [];


// 공지사항 불러오기 (Firebase에서)
function loadNotices() {
  console.log('loadNotices 실행 - Firebase에서 공지 로드');
  
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    console.warn('Firebase 미연결, localStorage 사용');
    // Firebase 없으면 localStorage에서 로드
    if (typeof LS !== 'undefined') {
      var savedNotices = LS.load('notices', []);
      if (typeof notices !== 'undefined') {
        notices = savedNotices;
        window.notices = savedNotices;
      }
      renderHomeNotices();
    }
    return;
  }
  
  firebase.database().ref('notices').once('value')
    .then(function(snap) {
      var data = snap.val();
      var noticesArray = [];
      
      if (data) {
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var notice = data[key];
          notice.firebaseKey = key;
          noticesArray.push(notice);
        }
        // 최신순 정렬
        noticesArray.sort(function(a, b) {
          return (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0);
        });
      }
      
      // 전역 변수에 저장
      if (typeof notices !== 'undefined') {
        notices = noticesArray;
        window.notices = noticesArray;
      }
      
      // localStorage에도 백업
      if (typeof LS !== 'undefined') {
        LS.save('notices', noticesArray);
      }
      
      renderHomeNotices();
      if (typeof renderAdminNotices === 'function') renderAdminNotices();
    })
    .catch(function(err) {
      console.error('공지사항 로드 실패:', err);
      // 실패시 localStorage에서 로드
      if (typeof LS !== 'undefined') {
        var savedNotices = LS.load('notices', []);
        if (typeof notices !== 'undefined') {
          notices = savedNotices;
          window.notices = savedNotices;
        }
        renderHomeNotices();
      }
    });
}


// 홈 화면 공지사항 렌더링
function renderHomeNotices() {
  var el = document.getElementById('home-notices');
  if (!el) return;
  
  var noticesArray = (typeof notices !== 'undefined') ? notices : (window.notices || []);
  
  if (!noticesArray.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px;">📢 등록된 공지가 없습니다</div>';
    return;
  }
  
  var isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
  var recentNotices = noticesArray.slice(0, 5);
  var html = '';
  
  for (var i = 0; i < recentNotices.length; i++) {
    var n = recentNotices[i];
    var date = n.date || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '');
    var catIcon = getNoticeCategoryIcon(n.category || n.cat);
    var shortBody = (n.body || n.content || '').substring(0, 80);
    if ((n.body || n.content || '').length > 80) shortBody += '...';
    
    html += `
      <div class="notice-row" style="cursor:pointer;" onclick="viewNoticeDetail('${n.firebaseKey || n.id}')">
        <div class="notice-head">
          <div class="notice-title">${escapeHtml(n.title)}</div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span class="badge badge-new">${catIcon} ${escapeHtml(n.category || n.cat || '일반')}</span>
            ${isAdmin ? `<button onclick="event.stopPropagation(); openEditNotice('${n.firebaseKey || n.id}')" style="background:#f0e8f8; border:none; border-radius:8px; color:#7c2d7e; font-size:10px; padding:3px 8px; cursor:pointer;">✏️</button>
                          <button onclick="event.stopPropagation(); deleteNotice('${n.firebaseKey || n.id}')" style="background:#fef2f2; border:none; border-radius:8px; color:#b91c1c; font-size:10px; padding:3px 8px; cursor:pointer;">🗑</button>` : ''}
          </div>
        </div>
        <div class="notice-date">${date}</div>
        <div class="notice-body" style="margin-top:6px;">${escapeHtml(shortBody)}</div>
        ${n.photos && n.photos.length ? '<div style="font-size:11px;color:var(--text2);margin-top:4px;">📷 사진 ' + n.photos.length + '장</div>' : ''}
      </div>
    `;
  }
  
  el.innerHTML = html;
}


// 카테고리 아이콘 반환
function getNoticeCategoryIcon(category) {
  if (!category) return '📢';
  if (category.includes('일반')) return '📢';
  if (category.includes('행사')) return '🎉';
  if (category.includes('주보')) return '📅';
  if (category.includes('기도')) return '🙏';
  if (category.includes('중요')) return '⚠️';
  return '📢';
}


// 공지 작성 모달 열기
function openAddNotice() {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    alert('관리자 또는 매니저만 공지사항을 작성할 수 있습니다.');
    return;
  }
  
  noticeEditId = null;
  noticeResizedPhotos = [];
  
  var titleInput = document.getElementById('n-title');
  var bodyInput = document.getElementById('n-body');
  var catSelect = document.getElementById('n-cat');
  var photoPreview = document.getElementById('notice-photo-preview');
  var modalTitle = document.getElementById('notice-modal-title');
  var submitBtn = document.getElementById('notice-submit-btn');
  var editIdInput = document.getElementById('n-edit-id');
  
  if (titleInput) titleInput.value = '';
  if (bodyInput) bodyInput.value = '';
  if (catSelect) catSelect.value = '📢 일반';
  if (photoPreview) photoPreview.innerHTML = '';
  if (modalTitle) modalTitle.textContent = '📢 공지 작성';
  if (submitBtn) submitBtn.textContent = '등록하기';
  if (editIdInput) editIdInput.value = '';
  
  var photoInput = document.getElementById('n-photo');
  if (photoInput) photoInput.value = '';
  
  var modal = document.getElementById('modal-notice');
  if (modal) modal.style.display = 'flex';
}


// 공지 수정 모달 열기
function openEditNotice(noticeId) {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    alert('관리자 또는 매니저만 수정할 수 있습니다.');
    return;
  }
  
  var noticesArray = (typeof notices !== 'undefined') ? notices : (window.notices || []);
  var notice = null;
  for (var i = 0; i < noticesArray.length; i++) {
    if (noticesArray[i].firebaseKey === noticeId || noticesArray[i].id == noticeId) {
      notice = noticesArray[i];
      break;
    }
  }
  
  if (!notice) {
    alert('공지사항을 찾을 수 없습니다.');
    return;
  }
  
  noticeEditId = notice.firebaseKey || notice.id;
  noticeResizedPhotos = notice.photos ? notice.photos.slice() : [];
  
  var titleInput = document.getElementById('n-title');
  var bodyInput = document.getElementById('n-body');
  var catSelect = document.getElementById('n-cat');
  var modalTitle = document.getElementById('notice-modal-title');
  var submitBtn = document.getElementById('notice-submit-btn');
  var editIdInput = document.getElementById('n-edit-id');
  
  if (titleInput) titleInput.value = notice.title || '';
  if (bodyInput) bodyInput.value = notice.body || notice.content || '';
  if (catSelect) catSelect.value = notice.category || notice.cat || '📢 일반';
  if (modalTitle) modalTitle.textContent = '✏️ 공지 수정';
  if (submitBtn) submitBtn.textContent = '수정 저장';
  if (editIdInput) editIdInput.value = noticeEditId;
  
  // 사진 미리보기 표시
  var previewDiv = document.getElementById('notice-photo-preview');
  if (previewDiv) {
    previewDiv.innerHTML = '';
    if (notice.photos && notice.photos.length) {
      for (var j = 0; j < notice.photos.length; j++) {
        var img = document.createElement('img');
        img.src = notice.photos[j];
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.margin = '4px';
        img.style.border = '1px solid #ddd';
        img.style.cursor = 'pointer';
        img.onclick = (function(idx) {
          return function() { removeNoticePhoto(idx); };
        })(j);
        previewDiv.appendChild(img);
      }
    }
  }
  
  var modal = document.getElementById('modal-notice');
  if (modal) modal.style.display = 'flex';
}


// 공지사진 미리보기 (여러장)
function noticePhotoPreview(input) {
  if (!input.files || input.files.length === 0) return;
  
  var previewDiv = document.getElementById('notice-photo-preview');
  if (!previewDiv) return;
  
  var fileList = Array.from(input.files);
  
  for (var i = 0; i < fileList.length; i++) {
    var file = fileList[i];
    
    if (file.size > 3 * 1024 * 1024) {
      alert(file.name + '은 3MB를 초과하여 제외됩니다.');
      continue;
    }
    
    (function(f) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = document.createElement('img');
        img.src = e.target.result;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.margin = '4px';
        img.style.border = '1px solid #ddd';
        img.style.cursor = 'pointer';
        var currentIdx = noticeResizedPhotos.length;
        img.onclick = (function(idx) {
          return function() { removeNoticePhoto(idx); };
        })(currentIdx);
        previewDiv.appendChild(img);
        
        resizeNoticeImage(f, 800, 600, 0.8).then(function(dataUrl) {
          noticeResizedPhotos.push(dataUrl);
        }).catch(function(err) {
          console.error('이미지 리사이즈 실패:', err);
        });
      };
      reader.readAsDataURL(f);
    })(file);
  }
}


// 사진 제거
function removeNoticePhoto(index) {
  if (index >= 0 && index < noticeResizedPhotos.length) {
    noticeResizedPhotos.splice(index, 1);
    
    // 미리보기 다시 그리기
    var previewDiv = document.getElementById('notice-photo-preview');
    if (previewDiv) {
      var children = previewDiv.children;
      var newChildren = [];
      for (var i = 0; i < children.length; i++) {
        if (i !== index) {
          newChildren.push(children[i]);
        }
      }
      previewDiv.innerHTML = '';
      for (var j = 0; j < noticeResizedPhotos.length; j++) {
        var img = document.createElement('img');
        img.src = noticeResizedPhotos[j];
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.margin = '4px';
        img.style.border = '1px solid #ddd';
        img.style.cursor = 'pointer';
        img.onclick = (function(idx) {
          return function() { removeNoticePhoto(idx); };
        })(j);
        previewDiv.appendChild(img);
      }
    }
  }
}


// 이미지 리사이즈 함수
function resizeNoticeImage(file, maxW, maxH, quality) {
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
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


// 공지사항 저장 (Firebase에 저장!)
function saveNotice() {
  console.log('saveNotice 실행 - Firebase 저장');
  
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    alert('서버 연결에 실패했습니다. (Firebase 미연결)');
    return;
  }
  
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    alert('권한이 없습니다.');
    return;
  }
  
  var titleInput = document.getElementById('n-title');
  var bodyInput = document.getElementById('n-body');
  var catSelect = document.getElementById('n-cat');
  
  var title = titleInput ? titleInput.value.trim() : '';
  var content = bodyInput ? bodyInput.value.trim() : '';
  var category = catSelect ? catSelect.value : '📢 일반';
  
  if (!title) {
    alert('제목을 입력하세요.');
    return;
  }
  
  if (!content) {
    alert('내용을 입력하세요.');
    return;
  }
  
  var now = new Date();
  var todayStr = now.toISOString().slice(0, 10);
  var timestamp = now.getTime();
  
  var noticeData = {
    title: title,
    body: content,
    content: content,
    category: category,
    cat: category,
    date: todayStr,
    createdAt: now.toISOString(),
    timestamp: timestamp,
    updatedAt: now.toISOString(),
    author: currentUser.name || currentUser.id || '관리자',
    photos: noticeResizedPhotos || []
  };
  
  var savePromise;
  var editId = document.getElementById('n-edit-id').value;
  
  if (editId) {
    // 수정 모드
    console.log('공지 수정 모드:', editId);
    savePromise = firebase.database().ref('notices/' + editId).update(noticeData);
  } else {
    // 새 작성 모드
    console.log('새 공지 작성 모드');
    var newRef = firebase.database().ref('notices').push();
    noticeData.id = Date.now().toString();
    savePromise = newRef.set(noticeData);
  }
  
  savePromise
    .then(function() {
      console.log('✅ 공지사항 저장 성공');
      alert('공지사항이 저장되었습니다.');
      closeModal('modal-notice');
      
      // 데이터 다시 로드
      loadNotices();
      
      // 입력 필드 초기화
      if (titleInput) titleInput.value = '';
      if (bodyInput) bodyInput.value = '';
      var previewDiv = document.getElementById('notice-photo-preview');
      if (previewDiv) previewDiv.innerHTML = '';
      noticeResizedPhotos = [];
      noticeEditId = null;
      
      var photoInput = document.getElementById('n-photo');
      if (photoInput) photoInput.value = '';
    })
    .catch(function(err) {
      console.error('공지사항 저장 실패:', err);
      alert('저장 중 오류가 발생했습니다: ' + err.message);
    });
}


// 공지사항 삭제 (Firebase에서)
function deleteNotice(noticeId) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    alert('서버 연결에 실패했습니다.');
    return;
  }
  
  firebase.database().ref('notices/' + noticeId).remove()
    .then(function() {
      alert('삭제되었습니다.');
      loadNotices();
    })
    .catch(function(err) {
      console.error('삭제 실패:', err);
      alert('삭제 중 오류가 발생했습니다.');
    });
}


// 공지사항 상세보기
function viewNoticeDetail(noticeId) {
  var noticesArray = (typeof notices !== 'undefined') ? notices : (window.notices || []);
  var notice = null;
  for (var i = 0; i < noticesArray.length; i++) {
    if (noticesArray[i].firebaseKey === noticeId || noticesArray[i].id == noticeId) {
      notice = noticesArray[i];
      break;
    }
  }
  
  if (!notice) {
    alert('공지사항을 찾을 수 없습니다.');
    return;
  }
  
  var date = notice.date || (notice.createdAt ? new Date(notice.createdAt).toLocaleString() : '');
  var modal = document.getElementById('modal-notice-view');
  
  if (!modal) {
    // 모달이 없으면 alert로 표시
    alert('제목: ' + notice.title + '\n\n내용: ' + (notice.body || notice.content));
    return;
  }
  
  var titleEl = document.getElementById('notice-view-title');
  var contentEl = document.getElementById('notice-view-content');
  var dateEl = document.getElementById('notice-view-date');
  var photoContainer = document.getElementById('notice-view-photos');
  
  if (titleEl) titleEl.textContent = notice.title || '';
  if (contentEl) contentEl.innerHTML = '<div style="white-space:pre-wrap; line-height:1.6;">' + escapeHtml(notice.body || notice.content || '') + '</div>';
  if (dateEl) dateEl.textContent = date;
  
  if (photoContainer) {
    photoContainer.innerHTML = '';
    if (notice.photos && notice.photos.length) {
      for (var j = 0; j < notice.photos.length; j++) {
        var img = document.createElement('img');
        img.src = notice.photos[j];
        img.style.width = '100%';
        img.style.borderRadius = '12px';
        img.style.marginBottom = '8px';
        photoContainer.appendChild(img);
      }
    }
  }
  
  modal.style.display = 'flex';
}


function closeNoticeView() {
  var modal = document.getElementById('modal-notice-view');
  if (modal) modal.style.display = 'none';
}


// 기존 호환성을 위한 함수
function editNotice(id) {
  openEditNotice(id);
}


console.log('✅ js_notices.js 로드 완료 (Firebase 저장 + 사진 여러장 지원)');