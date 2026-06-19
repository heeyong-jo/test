// ========== 전역 변수 ==========
let notices = [];
let currentNoticeId = null;
let noticePhotoFiles = []; // 사진 파일 임시 저장


// ========== 현재 사용자 가져오기 (호환성) ==========
function getCurrentUser() {
    if (typeof window.currentUser !== 'undefined' && window.currentUser) return window.currentUser;
    if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
    return null;
}




// ========== 공지사항 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('📢 공지사항 모듈 초기화');
    
    if (typeof loadNoticesFromFirebase === 'function') {
        loadNoticesFromFirebase();
    } else {
        loadNoticesFromLocalStorage();
    }
    
    initModalEvents();
});




// ========== 모달 이벤트 초기화 ==========
function initModalEvents() {
    const closeModalBtn = document.querySelector('#modal-notice .close-modal');
    if (closeModalBtn) {
        closeModalBtn.onclick = function() {
            closeNoticeModal();
        };
    }
    
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
    const previewContainer = document.getElementById('notice-photo-preview');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    noticePhotoFiles = [];
    
    if (input.files && input.files.length > 0) {
        for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            if (!file.type.startsWith('image/')) continue;
            
            noticePhotoFiles.push(file);
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:2px solid var(--border);';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
                wrapper.appendChild(img);
                
                // 삭제 버튼
                const delBtn = document.createElement('button');
                delBtn.textContent = '✕';
                delBtn.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:pointer;';
                delBtn.onclick = function(e) {
                    e.stopPropagation();
                    // 파일 제거
                    const index = noticePhotoFiles.indexOf(file);
                    if (index > -1) {
                        noticePhotoFiles.splice(index, 1);
                    }
                    wrapper.remove();
                    // input 초기화
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
                    if (!notice.id) {
                        notice.id = childSnapshot.key;
                    }
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




// ========== 실시간 공지사항 리스너 ==========
let noticesListener = null;




function setupRealtimeNoticesListener() {
    if (noticesListener) {
        noticesListener.off();
        noticesListener = null;
    }
    
    if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
        return;
    }
    
    const db = firebase.database();
    const noticesRef = db.ref('notices');
    
    noticesListener = noticesRef.on('value', function(snapshot) {
        const firebaseNotices = [];
        
        snapshot.forEach(function(childSnapshot) {
            const notice = childSnapshot.val();
            if (notice) {
                if (!notice.id) {
                    notice.id = childSnapshot.key;
                }
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




// ========== localStorage에서 공지사항 로드 ==========
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
            } else {
                notices = [];
                window.notices = [];
                console.log('📭 저장된 공지 없음');
            }
        } else {
            notices = [];
            window.notices = [];
            console.log('📭 저장된 공지 없음');
            renderEmptyNotices();
            renderJuboNotices();
        }
    } catch (error) {
        console.error('❌ localStorage 로드 실패:', error);
        notices = [];
        window.notices = [];
        renderEmptyNotices();
        renderJuboNotices();
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




// ========== 홈 화면 공지사항 렌더링 ==========
function renderHomeNotices() {
    const container = document.getElementById('home-notices');
    if (!container) return;
    
    console.log('🎨 공지사항 렌더링, 총', notices.length, '개');
    
    if (!notices || notices.length === 0) {
        renderEmptyNotices(container);
        return;
    }
    
    const displayNotices = notices.slice(0, 10);
    
    container.innerHTML = `
        <div class="notices-list" style="display:flex;flex-direction:column;gap:6px;">
            ${displayNotices.map(notice => `
                <div class="notice-item" onclick="openNoticeInNewWindow('${notice.id}')" style="padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;border-radius:8px;transition:background 0.2s;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
                            <span class="notice-category" style="font-size:9px;background:${getCategoryColor(notice.category)};color:white;padding:2px 10px;border-radius:12px;white-space:nowrap;">
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
    
    console.log('📋 주보란 렌더링, 주보 공지 수:', juboNotices.length);
    
    if (juboNotices.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--text2);font-size:13px;">
                📭 등록된 주보가 없습니다
            </div>
        `;
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
                            <span style="font-weight:600;font-size:13px;color:var(--text);">
                                📖 ${escapeHtml(notice.title)}
                            </span>
                            ${notice.photos && notice.photos.length > 0 ? `<span style="font-size:10px;color:var(--text2);">(${notice.photos.length}장)</span>` : ''}
                        </div>
                        <span style="font-size:10px;color:var(--text2);">
                            ${formatDate(notice.timestamp || notice.date)}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}




// ========== 사진 데이터를 Base64로 변환 ==========
function photosToBase64(files) {
    return new Promise((resolve) => {
        if (!files || files.length === 0) {
            resolve([]);
            return;
        }
        
        const results = [];
        let completed = 0;
        
        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.onload = function(e) {
                results.push(e.target.result);
                completed++;
                if (completed === files.length) {
                    resolve(results);
                }
            };
            reader.onerror = function() {
                completed++;
                if (completed === files.length) {
                    resolve(results);
                }
            };
            reader.readAsDataURL(files[i]);
        }
        
        if (files.length === 0) {
            resolve([]);
        }
    });
}




// ========== 새 창에서 공지 열기 (사진 포함) ==========
function openNoticeInNewWindow(noticeId) {
    const notice = notices.find(n => n.id === noticeId);
    if (!notice) {
        console.error('❌ 공지를 찾을 수 없음:', noticeId);
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
    
    // 사진 갤러리 HTML 생성
    let photosHtml = '';
    if (hasPhotos) {
        photosHtml = `
            <div style="margin:16px 0;">
                <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:10px;">📷 첨부 사진 (${notice.photos.length}장)</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">
                    ${notice.photos.map((photo, idx) => `
                        <div style="border-radius:8px;overflow:hidden;border:1px solid #eee;cursor:pointer;transition:transform 0.2s;" onclick="this.querySelector('img').style.transform='scale(1.05)';">
                            <img src="${photo}" alt="사진 ${idx+1}" style="width:100%;height:150px;object-fit:cover;transition:transform 0.2s;" onclick="window.open('${photo}','_blank')">
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
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHtml(notice.title)} - 가좌제일교회</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { 
                    font-family: 'Segoe UI', sans-serif; 
                    background: #f8f5f0; 
                    padding: 16px; 
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }
                .notice-container {
                    max-width: 700px;
                    width: 100%;
                    background: white;
                    border-radius: 16px;
                    padding: 28px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    margin-top: 16px;
                }
                .notice-category-badge {
                    display: inline-block;
                    background: ${categoryColor};
                    color: white;
                    padding: 3px 14px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                .notice-title {
                    font-size: 22px;
                    font-weight: 800;
                    color: #2d1b0e;
                    margin-bottom: 10px;
                    line-height: 1.3;
                }
                .notice-meta {
                    font-size: 13px;
                    color: #888;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 12px;
                    margin-bottom: 14px;
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .notice-content {
                    font-size: 15px;
                    line-height: 1.8;
                    color: #333;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .notice-content img {
                    max-width: 100%;
                    border-radius: 8px;
                    margin: 10px 0;
                }
                .photo-gallery {
                    margin: 16px 0;
                }
                .photo-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 10px;
                }
                .photo-item {
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #eee;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .photo-item:hover {
                    transform: scale(1.02);
                }
                .photo-item img {
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                }
                .photo-item .photo-label {
                    text-align: center;
                    font-size: 10px;
                    color: #999;
                    padding: 4px;
                }
                .photo-hint {
                    font-size: 11px;
                    color: #aaa;
                    margin-top: 6px;
                }
                .close-btn {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 10px 28px;
                    background: #5c3d1e;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .close-btn:hover { background: #7a5230; }
                .footer {
                    text-align: center;
                    font-size: 11px;
                    color: #bbb;
                    margin-top: 16px;
                    padding-top: 12px;
                    border-top: 1px solid #eee;
                }
                @media (max-width: 500px) {
                    .notice-container { padding: 16px; }
                    .notice-title { font-size: 18px; }
                    .photo-grid { grid-template-columns: repeat(2, 1fr); }
                    .photo-item img { height: 120px; }
                }
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
                <div class="photo-gallery">
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
        <div class="empty-state" style="text-align:center;padding:30px;color:var(--text2);">
            <div style="font-size:36px;margin-bottom:8px;">📭</div>
            <div style="font-size:14px;font-weight:600;">등록된 공지사항이 없습니다</div>
            <div style="font-size:12px;color:var(--text2);margin-top:4px;">첫 번째 공지를 작성해보세요!</div>
        </div>
    `;
}




// ========== 공지 상세 보기 (모달 - 기존 유지) ==========
function viewNoticeDetail(noticeId) {
    const notice = notices.find(n => n.id === noticeId);
    if (!notice) {
        console.error('❌ 공지를 찾을 수 없음:', noticeId);
        alert('공지를 찾을 수 없습니다.');
        return;
    }
    
    currentNoticeId = noticeId;
    
    const modal = document.getElementById('modal-notice-detail');
    if (!modal) {
        console.error('❌ modal-notice-detail 요소를 찾을 수 없음');
        alert('상세보기 모달을 찾을 수 없습니다.');
        return;
    }
    
    const titleEl = document.getElementById('detail-title');
    const categoryEl = document.getElementById('detail-category');
    const metaEl = document.getElementById('detail-meta');
    const contentEl = document.getElementById('detail-content');
    const deleteBtn = document.getElementById('delete-notice-btn');
    const photoContainer = document.getElementById('detail-photos');
    
    if (titleEl) titleEl.textContent = notice.title;
    if (categoryEl) categoryEl.textContent = notice.category || '📢 일반';
    if (metaEl) {
        metaEl.innerHTML = `
            <span>👤 ${escapeHtml(notice.author || '관리자')}</span>
            <span>📅 ${formatDate(notice.timestamp || notice.date)}</span>
            ${notice.photos && notice.photos.length > 0 ? `<span>🖼️ ${notice.photos.length}장</span>` : ''}
        `;
    }
    if (contentEl) {
        contentEl.innerHTML = escapeHtml(notice.content).replace(/\n/g, '<br>');
    }
    
    // 사진 표시
    if (photoContainer) {
        if (notice.photos && notice.photos.length > 0) {
            photoContainer.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-top:8px;">
                    ${notice.photos.map(photo => `
                        <img src="${photo}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open('${photo}','_blank')">
                    `).join('')}
                </div>
            `;
            photoContainer.style.display = 'block';
        } else {
            photoContainer.style.display = 'none';
        }
    }
    
    const currentUser = getCurrentUser();
    if (deleteBtn && currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.onclick = function() {
            deleteNotice(noticeId);
        };
    } else if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
}




// ========== 공지 삭제 ==========
function deleteNotice(noticeId) {
    if (!confirm('⚠️ 정말로 이 공지를 삭제하시겠습니까?\n삭제된 공지는 복구할 수 없습니다.')) {
        return;
    }
    
    console.log('🗑️ 공지 삭제:', noticeId);
    
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        const db = firebase.database();
        const noticesRef = db.ref('notices');
        
        let firebaseKey = null;
        const notice = notices.find(n => n.id === noticeId);
        if (notice && notice.id && notice.id.startsWith('-')) {
            firebaseKey = notice.id;
        } else {
            noticesRef.once('value')
                .then(function(snapshot) {
                    snapshot.forEach(function(childSnapshot) {
                        const val = childSnapshot.val();
                        if (val.id === noticeId || childSnapshot.key === noticeId) {
                            firebaseKey = childSnapshot.key;
                        }
                    });
                    
                    if (firebaseKey) {
                        return noticesRef.child(firebaseKey).remove();
                    } else {
                        deleteFromLocalStorage(noticeId);
                        return Promise.resolve();
                    }
                })
                .then(function() {
                    if (firebaseKey) {
                        console.log('✅ Firebase에서 삭제됨');
                    }
                    deleteFromLocalStorage(noticeId);
                })
                .catch(function(error) {
                    console.error('❌ Firebase 삭제 실패:', error);
                    deleteFromLocalStorage(noticeId);
                });
        }
        
        if (firebaseKey) {
            noticesRef.child(firebaseKey).remove()
                .then(() => {
                    console.log('✅ Firebase에서 삭제됨');
                    deleteFromLocalStorage(noticeId);
                })
                .catch(error => {
                    console.error('❌ Firebase 삭제 실패:', error);
                    deleteFromLocalStorage(noticeId);
                });
        }
    } else {
        deleteFromLocalStorage(noticeId);
    }
}




// ========== localStorage에서 공지 삭제 ==========
function deleteFromLocalStorage(noticeId) {
    const index = notices.findIndex(n => n.id === noticeId);
    if (index !== -1) {
        notices.splice(index, 1);
        localStorage.setItem('ch2_notices', JSON.stringify(notices));
        console.log('💾 localStorage에서 삭제됨');
    }
    
    const detailModal = document.getElementById('modal-notice-detail');
    if (detailModal) detailModal.style.display = 'none';
    
    renderHomeNotices();
    renderJuboNotices();
    
    alert('✅ 공지사항이 삭제되었습니다');
}




// ========== 공지 작성 모달 열기 ==========
function openAddNotice() {
    console.log('➕ openAddNotice 실행');
    
    const user = getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        alert('⚠️ 공지사항 작성 권한이 없습니다.\n매니저 또는 관리자만 작성 가능합니다.');
        return;
    }
    
    const modal = document.getElementById('modal-notice');
    if (!modal) {
        console.error('❌ modal-notice 요소를 찾을 수 없음');
        alert('오류: 모달을 찾을 수 없습니다.');
        return;
    }
    
    const titleInput = document.getElementById('n-title');
    const contentTextarea = document.getElementById('n-body');
    const categorySelect = document.getElementById('n-cat');
    const photoInput = document.getElementById('n-photo');
    const previewContainer = document.getElementById('notice-photo-preview');
    
    if (titleInput) titleInput.value = '';
    if (contentTextarea) contentTextarea.value = '';
    if (categorySelect) categorySelect.value = '📢 일반';
    if (photoInput) photoInput.value = '';
    if (previewContainer) previewContainer.innerHTML = '';
    noticePhotoFiles = [];
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    if (titleInput) setTimeout(() => titleInput.focus(), 100);
    
    console.log('✅ 공지 작성 모달 열림');
}




// ========== 공지 저장 (Firebase + localStorage) ==========
async function saveNotice() {
    console.log('💾 [saveNotice] 공지 저장 실행 시작');
    
    const user = getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
        alert('⚠️ 공지 작성 권한이 없습니다.\n매니저 또는 관리자만 작성 가능합니다.');
        return;
    }
    
    const titleInput = document.getElementById('n-title');
    const categorySelect = document.getElementById('n-cat');
    const contentTextarea = document.getElementById('n-body');
    const photoInput = document.getElementById('n-photo');
    
    if (!titleInput || !categorySelect || !contentTextarea) {
        console.error('❌ 모달 입력 필드를 찾을 수 없음');
        alert('오류: 입력 폼을 찾을 수 없습니다.');
        return;
    }
    
    const title = titleInput.value.trim();
    const category = categorySelect.value;
    const content = contentTextarea.value.trim();
    
    if (!title) {
        alert('⚠️ 제목을 입력하세요');
        titleInput.focus();
        return;
    }
    
    if (!content) {
        alert('⚠️ 내용을 입력하세요');
        contentTextarea.focus();
        return;
    }
    
    const validCategories = ['📢 일반', '🎉 행사', '📅 주보'];
    if (!validCategories.includes(category)) {
        alert('⚠️ 카테고리는 "📢 일반", "🎉 행사", "📅 주보" 중에서 선택해주세요.');
        categorySelect.focus();
        return;
    }
    
    // 사진 Base64 변환
    let photoData = [];
    if (noticePhotoFiles && noticePhotoFiles.length > 0) {
        // 최대 10장 제한
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
            } catch (e) {
                console.error('사진 변환 실패:', e);
            }
        }
    }
    
    const timestamp = Date.now();
    const newNotice = {
        id: `notice_${timestamp}_${Math.random().toString(36).substr(2, 6)}`,
        title: title,
        category: category || '📢 일반',
        content: content,
        photos: photoData,
        timestamp: timestamp,
        date: new Date().toISOString(),
        author: user.name || user.email || '관리자',
        authorId: user.uid || user.id || 'unknown',
        authorRole: user.role || 'user'
    };
    
    console.log('📝 저장할 공지 데이터:', { ...newNotice, photos: photoData.length + '장' });
    
    // Firebase 저장
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        try {
            const db = firebase.database();
            const noticesRef = db.ref('notices');
            const snapshot = await noticesRef.push(newNotice);
            console.log('✅ Firebase 저장 성공! key:', snapshot.key);
            saveToLocalStorage(newNotice);
            closeNoticeModal();
            renderHomeNotices();
            renderJuboNotices();
            alert('✅ 공지사항이 등록되었습니다' + (photoData.length > 0 ? ` (사진 ${photoData.length}장 포함)` : ''));
        } catch (error) {
            console.error('❌ Firebase 저장 실패:', error);
            const saved = saveToLocalStorage(newNotice);
            if (saved) {
                alert('⚠️ 서버 저장 실패, 로컬에만 저장되었습니다.\n관리자에게 문의하세요.');
                closeNoticeModal();
                renderHomeNotices();
                renderJuboNotices();
            } else {
                alert('❌ 저장에 실패했습니다. 다시 시도해주세요.\n에러: ' + error.message);
            }
        }
    } else {
        console.warn('⚠️ Firebase가 초기화되지 않음 - localStorage에만 저장');
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




// ========== localStorage 저장 헬퍼 함수 ==========
function saveToLocalStorage(notice) {
    try {
        let existingNotices = [];
        const saved = localStorage.getItem('ch2_notices');
        if (saved) {
            existingNotices = JSON.parse(saved);
            if (!Array.isArray(existingNotices)) existingNotices = [];
        }
        
        existingNotices.unshift(notice);
        
        if (existingNotices.length > 100) {
            existingNotices = existingNotices.slice(0, 100);
        }
        
        localStorage.setItem('ch2_notices', JSON.stringify(existingNotices));
        
        notices = existingNotices;
        window.notices = notices;
        
        console.log('💾 localStorage 저장 완료. 총 공지 수:', notices.length);
        return true;
    } catch (error) {
        console.error('❌ localStorage 저장 실패:', error);
        return false;
    }
}




// ========== 모달 닫기 헬퍼 함수 ==========
function closeNoticeModal() {
    const modal = document.getElementById('modal-notice');
    if (modal) {
        modal.style.display = 'none';
    }
    
    const titleInput = document.getElementById('n-title');
    const contentTextarea = document.getElementById('n-body');
    const categorySelect = document.getElementById('n-cat');
    const photoInput = document.getElementById('n-photo');
    const previewContainer = document.getElementById('notice-photo-preview');
    
    if (titleInput) titleInput.value = '';
    if (contentTextarea) contentTextarea.value = '';
    if (categorySelect) categorySelect.value = '📢 일반';
    if (photoInput) photoInput.value = '';
    if (previewContainer) previewContainer.innerHTML = '';
    noticePhotoFiles = [];
}




// ========== 공지 상세 모달 닫기 ==========
function closeNoticeDetailModal() {
    const modal = document.getElementById('modal-notice-detail');
    if (modal) {
        modal.style.display = 'none';
    }
    currentNoticeId = null;
}




// ========== 유틸리티 함수 ==========
function formatDate(timestamp) {
    if (!timestamp) return '날짜 없음';
    
    let date;
    if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return '날짜 오류';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}`;
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
window.closeNoticeDetailModal = closeNoticeDetailModal;
window.loadNoticesFromFirebase = loadNoticesFromFirebase;
window.loadNoticesFromLocalStorage = loadNoticesFromLocalStorage;
window.renderHomeNotices = renderHomeNotices;
window.renderJuboNotices = renderJuboNotices;
window.openNoticeInNewWindow = openNoticeInNewWindow;
window.noticePhotoPreview = noticePhotoPreview;
window.getCurrentUser = getCurrentUser;
window.notices = notices;




console.log('✅ js_notices.js 로드 완료 (주보 사진 여러장 첨부 가능)');