// ========== 전역 변수 ==========
let notices = [];
let currentNoticeId = null;
let noticePhotoFiles = [];


// ========== 공지사항 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('📢 공지사항 모듈 초기화');
    
    // getCurrentUser는 window 객체에서 가져옴
    if (typeof window.getCurrentUser !== 'function') {
        console.warn('⚠️ getCurrentUser 함수 없음, 대체 함수 등록');
        window.getCurrentUser = function() {
            if (typeof window.currentUser !== 'undefined' && window.currentUser) return window.currentUser;
            if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
            return null;
        };
    }
    
    if (typeof loadNoticesFromFirebase === 'function') {
        loadNoticesFromFirebase();
    } else {
        loadNoticesFromLocalStorage();
    }
    
    initModalEvents();
});




// ========== 모달 이벤트 초기화 ==========
function initModalEvents() {
    const modal = document.getElementById('modal-notice');
    if (modal) {
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeNoticeModal();
            }
        };
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-notice');
            if (modal && modal.style.display === 'flex') {
                closeNoticeModal();
            }
        }
    });
}




// ========== 사진 미리보기 ==========
function noticePhotoPreview(input) {
    console.log('📷 noticePhotoPreview 실행');
    const previewContainer = document.getElementById('notice-photo-preview');
    if (!previewContainer) {
        console.warn('notice-photo-preview 컨테이너 없음');
        return;
    }
    
    previewContainer.innerHTML = '';
    noticePhotoFiles = [];
    
    if (!input || !input.files || input.files.length === 0) return;
    
    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        if (!file.type.startsWith('image/')) continue;
        
        noticePhotoFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid var(--border);flex-shrink:0;';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            wrapper.appendChild(img);
            
            const delBtn = document.createElement('button');
            delBtn.textContent = '✕';
            delBtn.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:pointer;z-index:2;';
            delBtn.onclick = function(e) {
                e.stopPropagation();
                const index = noticePhotoFiles.indexOf(file);
                if (index > -1) {
                    noticePhotoFiles.splice(index, 1);
                }
                wrapper.remove();
                const dt = new DataTransfer();
                noticePhotoFiles.forEach(f => dt.items.add(f));
                input.files = dt.files;
            };
            wrapper.appendChild(delBtn);
            previewContainer.appendChild(wrapper);
        };
        reader.readAsDataURL(file);
    }
}




// ========== 카테고리별 색상 ==========
function getCategoryColor(category) {
    if (!category) return '#6c757d';
    if (category.includes('행사')) return '#e74c3c';
    if (category.includes('주보')) return '#2ecc71';
    if (category.includes('일반')) return '#3498db';
    return '#6c757d';
}




// ========== Firebase에서 공지사항 로드 ==========
function loadNoticesFromFirebase() {
    console.log('🔄 Firebase에서 공지사항 로드 중...');
    
    if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
        console.warn('⚠️ Firebase 미연결 - localStorage에서 로드');
        loadNoticesFromLocalStorage();
        return;
    }
    
    const db = firebase.database();
    const noticesRef = db.ref('notices');
    
    noticesRef.once('value')
        .then(function(snapshot) {
            const firebaseNotices = [];
            snapshot.forEach(function(childSnapshot) {
                const notice = childSnapshot.val();
                if (notice) {
                    if (!notice.id) notice.id = childSnapshot.key;
                    firebaseNotices.push(notice);
                }
            });
            firebaseNotices.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
            console.log(`✅ Firebase에서 ${firebaseNotices.length}개 공지 로드 성공`);
            notices = firebaseNotices;
            window.notices = notices;
            localStorage.setItem('ch2_notices', JSON.stringify(firebaseNotices));
            renderHomeNotices();
            renderJuboNotices();
        })
        .catch(function(error) {
            console.error('❌ Firebase 로드 실패:', error);
            loadNoticesFromLocalStorage();
        });
    
    setupRealtimeNoticesListener();
}




// ========== 실시간 리스너 ==========
let noticesListener = null;


function setupRealtimeNoticesListener() {
    if (noticesListener) {
        noticesListener.off();
        noticesListener = null;
    }
    if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) return;
    
    const db = firebase.database();
    const noticesRef = db.ref('notices');
    
    noticesListener = noticesRef.on('value', function(snapshot) {
        const firebaseNotices = [];
        snapshot.forEach(function(childSnapshot) {
            const notice = childSnapshot.val();
            if (notice) {
                if (!notice.id) notice.id = childSnapshot.key;
                firebaseNotices.push(notice);
            }
        });
        firebaseNotices.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        notices = firebaseNotices;
        window.notices = notices;
        localStorage.setItem('ch2_notices', JSON.stringify(firebaseNotices));
        renderHomeNotices();
        renderJuboNotices();
    });
}




// ========== localStorage에서 로드 ==========
function loadNoticesFromLocalStorage() {
    try {
        const saved = localStorage.getItem('ch2_notices');
        if (saved) {
            const loadedNotices = JSON.parse(saved);
            if (Array.isArray(loadedNotices)) {
                notices = loadedNotices;
                window.notices = notices;
                console.log(`💾 localStorage에서 ${notices.length}개 공지 로드`);
                renderHomeNotices();
                renderJuboNotices();
                return;
            }
        }
        notices = [];
        window.notices = [];
        renderEmptyNotices();
        renderJuboNotices();
    } catch (error) {
        console.error('❌ localStorage 로드 실패:', error);
        notices = [];
        window.notices = [];
        renderEmptyNotices();
        renderJuboNotices();
    }
}




// ========== 홈 화면 공지사항 렌더링 ==========
function renderHomeNotices() {
    const container = document.getElementById('home-notices');
    if (!container) return;
    
    if (!notices || notices.length === 0) {
        renderEmptyNotices(container);
        return;
    }
    
    const displayNotices = notices.slice(0, 10);
    container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:6px;">
            ${displayNotices.map(notice => `
                <div onclick="openNoticeInNewWindow('${notice.id}')" style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;border-radius:8px;transition:background 0.2s;background:var(--bg);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
                            <span style="font-size:9px;background:${getCategoryColor(notice.category)};color:white;padding:2px 10px;border-radius:12px;white-space:nowrap;">
                                ${escapeHtml(notice.category || '📢 일반')}
                            </span>
                            ${notice.photos && notice.photos.length > 0 ? '<span style="font-size:12px;">🖼️</span>' : ''}
                            <span style="font-weight:600;font-size:14px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${escapeHtml(notice.title)}
                            </span>
                        </div>
                        <span style="font-size:10px;color:var(--text2);white-space:nowrap;margin-left:8px;">
                            ${formatDate(notice.timestamp || notice.date)}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}




// ========== 주보란 렌더링 ==========
function renderJuboNotices() {
    const container = document.getElementById('jubo-notices');
    if (!container) return;
    
    const juboNotices = notices.filter(n => n.category && n.category.includes('주보'));
    
    if (juboNotices.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text2);font-size:13px;">📭 등록된 주보가 없습니다</div>`;
        return;
    }
    
    const displayNotices = juboNotices.slice(0, 5);
    container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:6px;">
            ${displayNotices.map(notice => `
                <div onclick="openNoticeInNewWindow('${notice.id}')" style="padding:10px 14px;background:rgba(46,204,113,0.08);border-left:3px solid #2ecc71;border-radius:6px;cursor:pointer;transition:background 0.2s;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            ${notice.photos && notice.photos.length > 0 ? '<span style="font-size:14px;">🖼️</span>' : ''}
                            <span style="font-weight:600;font-size:13px;color:var(--text);">📖 ${escapeHtml(notice.title)}</span>
                            ${notice.photos && notice.photos.length > 0 ? `<span style="font-size:10px;color:var(--text2);">(${notice.photos.length}장)</span>` : ''}
                        </div>
                        <span style="font-size:10px;color:var(--text2);">${formatDate(notice.timestamp || notice.date)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}




// ========== 새 창에서 공지 열기 ==========
function openNoticeInNewWindow(noticeId) {
    const notice = notices.find(n => n.id === noticeId);
    if (!notice) {
        alert('공지를 찾을 수 없습니다.');
        return;
    }
    
    const newWindow = window.open('', '_blank', 'width=700,height=600,scrollbars=yes');
    if (!newWindow) {
        alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
        return;
    }
    
    const categoryColor = getCategoryColor(notice.category);
    const hasPhotos = notice.photos && notice.photos.length > 0;
    
    let photosHtml = '';
    if (hasPhotos) {
        photosHtml = `
            <div style="margin:16px 0;">
                <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:10px;">📷 첨부 사진 (${notice.photos.length}장)</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">
                    ${notice.photos.map((photo, idx) => `
                        <div style="border-radius:8px;overflow:hidden;border:1px solid #eee;cursor:pointer;" onclick="window.open('${photo}','_blank')">
                            <img src="${photo}" alt="사진 ${idx+1}" style="width:100%;height:150px;object-fit:cover;">
                            <div style="text-align:center;font-size:10px;color:#999;padding:4px;">#${idx+1}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="font-size:11px;color:#aaa;margin-top:6px;">※ 사진을 클릭하면 크게 볼 수 있습니다</div>
            </div>
        `;
    }
    
    newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(notice.title)} - 가좌제일교회</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:'Segoe UI',sans-serif;background:#f8f5f0;padding:16px;min-height:100vh;display:flex;justify-content:center;align-items:flex-start;}
            .notice-container{max-width:700px;width:100%;background:white;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,0.08);margin-top:16px;}
            .notice-category-badge{display:inline-block;background:${categoryColor};color:white;padding:3px 14px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:10px;}
            .notice-title{font-size:22px;font-weight:800;color:#2d1b0e;margin-bottom:10px;line-height:1.3;}
            .notice-meta{font-size:13px;color:#888;border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:14px;display:flex;gap:16px;flex-wrap:wrap;}
            .notice-content{font-size:15px;line-height:1.8;color:#333;white-space:pre-wrap;word-break:break-word;}
            .photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:10px 0;}
            .photo-item{border-radius:8px;overflow:hidden;border:1px solid #eee;cursor:pointer;}
            .photo-item img{width:100%;height:150px;object-fit:cover;}
            .photo-item .photo-label{text-align:center;font-size:10px;color:#999;padding:4px;}
            .photo-hint{font-size:11px;color:#aaa;margin-top:6px;}
            .close-btn{display:inline-block;margin-top:20px;padding:10px 28px;background:#5c3d1e;color:white;border:none;border-radius:10px;font-size:14px;cursor:pointer;font-weight:600;}
            .close-btn:hover{background:#7a5230;}
            .footer{text-align:center;font-size:11px;color:#bbb;margin-top:16px;padding-top:12px;border-top:1px solid #eee;}
            @media (max-width:500px){.notice-container{padding:16px;}.notice-title{font-size:18px;}.photo-grid{grid-template-columns:repeat(2,1fr);}.photo-item img{height:120px;}}
        </style>
        </head>
        <body>
            <div class="notice-container">
                <div class="notice-category-badge">${escapeHtml(notice.category || '📢 일반')}</div>
                <div class="notice-title">${escapeHtml(notice.title)}</div>
                <div class="notice-meta">
                    <span>👤 ${escapeHtml(notice.author || '관리자')}</span>
                    <span>📅 ${formatDate(notice.timestamp || notice.date)}</span>
                    ${hasPhotos ? `<span>🖼️ ${notice.photos.length}장 첨부</span>` : ''}
                </div>
                ${hasPhotos ? `
                <div style="margin:16px 0;">
                    <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:8px;">📷 첨부 사진</div>
                    <div class="photo-grid">
                        ${notice.photos.map((photo, idx) => `
                            <div class="photo-item" onclick="window.open('${photo}','_blank')">
                                <img src="${photo}" alt="사진 ${idx+1}" loading="lazy">
                                <div class="photo-label">#${idx+1}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="photo-hint">※ 사진을 클릭하면 새 탭에서 크게 볼 수 있습니다</div>
                </div>
                ` : ''}
                <div class="notice-content">${escapeHtml(notice.content).replace(/\n/g, '<br>')}</div>
                <button class="close-btn" onclick="window.close()">✕ 창 닫기</button>
                <div class="footer">가좌제일교회</div>
            </div>
        </body>
        </html>
    `);
    newWindow.document.close();
}




// ========== 빈 공지사항 렌더링 ==========
function renderEmptyNotices(container = null) {
    const targetContainer = container || document.getElementById('home-notices');
    if (!targetContainer) return;
    targetContainer.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--text2);">
            <div style="font-size:36px;margin-bottom:8px;">📭</div>
            <div style="font-size:14px;font-weight:600;">등록된 공지사항이 없습니다</div>
            <div style="font-size:12px;color:var(--text2);margin-top:4px;">첫 번째 공지를 작성해보세요!</div>
        </div>
    `;
}




// ========== 공지 상세 보기 (모달) ==========
function viewNoticeDetail(noticeId) {
    const notice = notices.find(n => n.id === noticeId);
    if (!notice) {
        alert('공지를 찾을 수 없습니다.');
        return;
    }
    openNoticeInNewWindow(noticeId);
}




// ========== 공지 삭제 ==========
function deleteNotice(noticeId) {
    if (!confirm('⚠️ 정말로 이 공지를 삭제하시겠습니까?')) return;
    
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        const db = firebase.database();
        const noticesRef = db.ref('notices');
        let firebaseKey = null;
        const notice = notices.find(n => n.id === noticeId);
        if (notice && notice.id && notice.id.startsWith('-')) {
            firebaseKey = notice.id;
        }
        if (firebaseKey) {
            noticesRef.child(firebaseKey).remove()
                .then(() => { deleteFromLocalStorage(noticeId); })
                .catch(() => { deleteFromLocalStorage(noticeId); });
        } else {
            deleteFromLocalStorage(noticeId);
        }
    } else {
        deleteFromLocalStorage(noticeId);
    }
}




function deleteFromLocalStorage(noticeId) {
    const index = notices.findIndex(n => n.id === noticeId);
    if (index !== -1) {
        notices.splice(index, 1);
        localStorage.setItem('ch2_notices', JSON.stringify(notices));
    }
    renderHomeNotices();
    renderJuboNotices();
    alert('✅ 공지사항이 삭제되었습니다');
}




// ========== 공지 작성 모달 열기 ==========
function openAddNotice() {
    console.log('➕ openAddNotice 실행');
    
    // window.getCurrentUser 사용
    const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        alert('⚠️ 공지사항 작성 권한이 없습니다.\n매니저 또는 관리자만 작성 가능합니다.');
        return;
    }
    
    const modal = document.getElementById('modal-notice');
    if (!modal) {
        alert('오류: 모달을 찾을 수 없습니다.');
        return;
    }
    
    document.getElementById('n-title').value = '';
    document.getElementById('n-body').value = '';
    document.getElementById('n-cat').value = '📢 일반';
    document.getElementById('n-photo').value = '';
    document.getElementById('notice-photo-preview').innerHTML = '';
    noticePhotoFiles = [];
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    setTimeout(() => document.getElementById('n-title').focus(), 100);
    console.log('✅ 공지 작성 모달 열림');
}




// ========== 공지 저장 ==========
async function saveNotice() {
    console.log('💾 saveNotice 실행');
    
    const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        alert('⚠️ 공지 작성 권한이 없습니다.');
        return;
    }
    
    const title = document.getElementById('n-title').value.trim();
    const category = document.getElementById('n-cat').value;
    const content = document.getElementById('n-body').value.trim();
    
    if (!title) { alert('⚠️ 제목을 입력하세요'); return; }
    if (!content) { alert('⚠️ 내용을 입력하세요'); return; }
    
    const validCategories = ['📢 일반', '🎉 행사', '📅 주보'];
    if (!validCategories.includes(category)) {
        alert('⚠️ 카테고리는 "📢 일반", "🎉 행사", "📅 주보" 중에서 선택해주세요.');
        return;
    }
    
    // 사진 Base64 변환
    let photoData = [];
    if (noticePhotoFiles && noticePhotoFiles.length > 0) {
        const maxPhotos = 10;
        const filesToProcess = noticePhotoFiles.slice(0, maxPhotos);
        for (const file of filesToProcess) {
            try {
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
                photoData.push(dataUrl);
            } catch (e) { console.error('사진 변환 실패:', e); }
        }
    }
    
    const timestamp = Date.now();
    const newNotice = {
        id: `notice_${timestamp}_${Math.random().toString(36).substr(2, 6)}`,
        title, category, content,
        photos: photoData,
        timestamp,
        date: new Date().toISOString(),
        author: user.name || user.email || '관리자',
        authorId: user.uid || user.id || 'unknown',
        authorRole: user.role || 'user'
    };
    
    console.log('📝 저장할 공지:', { title, category, photos: photoData.length + '장' });
    
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        try {
            const db = firebase.database();
            const noticesRef = db.ref('notices');
            await noticesRef.push(newNotice);
            console.log('✅ Firebase 저장 성공!');
            saveToLocalStorage(newNotice);
            closeNoticeModal();
            renderHomeNotices();
            renderJuboNotices();
            alert('✅ 공지사항이 등록되었습니다' + (photoData.length > 0 ? ` (사진 ${photoData.length}장 포함)` : ''));
        } catch (error) {
            console.error('❌ Firebase 저장 실패:', error);
            const saved = saveToLocalStorage(newNotice);
            if (saved) {
                alert('⚠️ 서버 저장 실패, 로컬에만 저장되었습니다.');
                closeNoticeModal();
                renderHomeNotices();
                renderJuboNotices();
            } else {
                alert('❌ 저장에 실패했습니다.');
            }
        }
    } else {
        const saved = saveToLocalStorage(newNotice);
        if (saved) {
            alert('✅ 공지사항이 로컬에 등록되었습니다 (오프라인 모드)' + (photoData.length > 0 ? ` (사진 ${photoData.length}장 포함)` : ''));
            closeNoticeModal();
            renderHomeNotices();
            renderJuboNotices();
        } else {
            alert('❌ 로컬 저장에 실패했습니다.');
        }
    }
}




function saveToLocalStorage(notice) {
    try {
        let existingNotices = [];
        const saved = localStorage.getItem('ch2_notices');
        if (saved) existingNotices = JSON.parse(saved) || [];
        existingNotices.unshift(notice);
        if (existingNotices.length > 100) existingNotices = existingNotices.slice(0, 100);
        localStorage.setItem('ch2_notices', JSON.stringify(existingNotices));
        notices = existingNotices;
        window.notices = notices;
        return true;
    } catch (error) {
        console.error('❌ localStorage 저장 실패:', error);
        return false;
    }
}




// ========== 모달 닫기 ==========
function closeNoticeModal() {
    const modal = document.getElementById('modal-notice');
    if (modal) modal.style.display = 'none';
    document.getElementById('n-title').value = '';
    document.getElementById('n-body').value = '';
    document.getElementById('n-cat').value = '📢 일반';
    document.getElementById('n-photo').value = '';
    document.getElementById('notice-photo-preview').innerHTML = '';
    noticePhotoFiles = [];
}




// ========== 유틸리티 ==========
function formatDate(timestamp) {
    if (!timestamp) return '날짜 없음';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '날짜 오류';
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}




function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}




// ========== 전역 함수 등록 ==========
window.openAddNotice = openAddNotice;
window.saveNotice = saveNotice;
window.viewNoticeDetail = viewNoticeDetail;
window.deleteNotice = deleteNotice;
window.closeNoticeModal = closeNoticeModal;
window.loadNoticesFromFirebase = loadNoticesFromFirebase;
window.loadNoticesFromLocalStorage = loadNoticesFromLocalStorage;
window.renderHomeNotices = renderHomeNotices;
window.renderJuboNotices = renderJuboNotices;
window.openNoticeInNewWindow = openNoticeInNewWindow;
window.noticePhotoPreview = noticePhotoPreview;
window.notices = notices;




console.log('✅ js_notices.js 로드 완료');