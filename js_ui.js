// ========== 전역 변수 ==========
let currentUser = null;
let currentTab = 0;
let originalAfterTab = null;


// ========== 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 UI 초기화 시작');
    
    // 기존 afterTab 함수 백업
    if (typeof window.afterTab === 'function' && !originalAfterTab) {
        originalAfterTab = window.afterTab;
    }
    
    // 탭 버튼 이벤트 리스너 등록
    initTabs();
    
    // 로그인 상태 확인
    checkLoginStatus();
    
    // 전역 함수 등록
    registerGlobalFunctions();
});


// ========== 탭 초기화 ==========
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            switchTab(index);
        });
    });
    
    console.log('✅ 탭 초기화 완료');
}


// ========== 탭 전환 ==========
function switchTab(n) {
    console.log('🔄 탭 전환:', n);
    
    // 탭 버튼 활성화
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach((btn, i) => {
        if (i === n) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 탭 콘텐츠 활성화
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach((content, i) => {
        if (i === n) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    currentTab = n;
    
    // 탭 전환 후 처리
    afterTab(n);
}


// ========== 탭 전환 후 처리 함수 (수정됨) ==========
function afterTab(n) {
    console.log('🔄 afterTab 실행 - 탭:', n);
    
    // 1. 관리자/매니저 버튼 표시 제어
    if (n === 0) {  // 홈 탭
        const user = window.currentUser;
        const adminBtns = document.querySelectorAll('.admin-only');
        const adminManagerBtns = document.querySelectorAll('.admin-manager-only');
        
        console.log('👤 현재 사용자:', user);
        console.log('📊 admin 버튼 수:', adminBtns.length);
        console.log('📊 manager 버튼 수:', adminManagerBtns.length);
        
        if (user && (user.role === 'admin' || user.role === 'manager')) {
            // 관리자/매니저: 버튼 표시
            adminBtns.forEach(btn => {
                btn.classList.add('visible');
                console.log('✅ admin 버튼 표시:', btn.className);
            });
            adminManagerBtns.forEach(btn => {
                btn.classList.add('visible');
                console.log('✅ manager 버튼 표시:', btn.className);
            });
        } else {
            // 일반 사용자: 버튼 숨김
            adminBtns.forEach(btn => btn.classList.remove('visible'));
            adminManagerBtns.forEach(btn => btn.classList.remove('visible'));
            console.log('⚠️ 일반 사용자 - 버튼 숨김');
        }
    }
    
    // 2. 공지사항 다시 로드 (홈 탭)
    if (n === 0 && typeof loadNoticesFromFirebase === 'function') {
        console.log('🔄 공지사항 다시 로드');
        loadNoticesFromFirebase();
    }
    
    // 3. 관리자 탭 로드
    if (n === 3 && typeof loadAdminPanel === 'function') {
        console.log('🔄 관리자 패널 로드');
        loadAdminPanel();
    }
    
    // 4. 기존 afterTab 로직 실행 (백업된 함수가 있으면)
    if (originalAfterTab && typeof originalAfterTab === 'function') {
        console.log('🔄 기존 afterTab 실행');
        originalAfterTab(n);
    }
}


// ========== 로그인 상태 확인 ==========
function checkLoginStatus() {
    // localStorage에서 사용자 정보 확인
    const savedUser = localStorage.getItem('ch2_currentUser');
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            window.currentUser = currentUser;
            updateUserUI();
            console.log('✅ 로그인 상태 유지:', currentUser.name);
            
            // 홈 탭 버튼 표시 업데이트
            afterTab(currentTab);
        } catch(e) {
            console.error('❌ 사용자 정보 파싱 오류:', e);
            logout();
        }
    } else {
        console.log('📭 저장된 로그인 정보 없음');
        updateUserUI(false);
    }
}


// ========== UI 업데이트 ==========
function updateUserUI(isLoggedIn = true) {
    const userInfoDiv = document.getElementById('user-info');
    const authContainer = document.getElementById('auth-container');
    const mainContent = document.getElementById('main-content');
    
    if (!userInfoDiv) return;
    
    if (isLoggedIn && currentUser) {
        // 로그인 상태 UI
        userInfoDiv.innerHTML = `
            <div class="user-details">
                <span class="user-name">👤 ${escapeHtml(currentUser.name || currentUser.email)}</span>
                <span class="user-role">${getRoleText(currentUser.role)}</span>
            </div>
            <button class="logout-btn" onclick="logout()">🚪 로그아웃</button>
        `;
        userInfoDiv.style.display = 'flex';
        
        if (authContainer) authContainer.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        
        // 홈 탭으로 이동
        switchTab(0);
    } else {
        // 로그아웃 상태 UI
        userInfoDiv.innerHTML = `
            <div class="user-details">
                <span class="user-name">🔓 로그인이 필요합니다</span>
            </div>
        `;
        userInfoDiv.style.display = 'flex';
        
        if (authContainer) authContainer.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        
        // 로그인 폼 표시
        showLoginForm();
    }
}


// ========== 역할 텍스트 변환 ==========
function getRoleText(role) {
    switch(role) {
        case 'admin': return '👑 관리자';
        case 'manager': return '📋 매니저';
        case 'user': return '👤 일반 사용자';
        default: return '👤 일반 사용자';
    }
}


// ========== HTML 이스케이프 ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// ========== 로그인 폼 표시 ==========
function showLoginForm() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;
    
    authContainer.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>📝 채널투 회원가입/로그인</h2>
                <div class="auth-subtitle">이메일로 시작하기</div>
                
                <form id="auth-form" onsubmit="handleAuth(event)">
                    <div class="form-group">
                        <label>이메일</label>
                        <input type="email" id="auth-email" required placeholder="example@email.com">
                    </div>
                    
                    <div class="form-group">
                        <label>이름 (선택)</label>
                        <input type="text" id="auth-name" placeholder="홍길동">
                    </div>
                    
                    <div class="form-group">
                        <label>비밀번호</label>
                        <input type="password" id="auth-password" required placeholder="******">
                    </div>
                    
                    <button type="submit" class="btn-primary" style="width: 100%;">로그인 / 회원가입</button>
                </form>
                
                <div class="auth-switch">
                    <a onclick="toggleAuthMode()" id="auth-mode-toggle">🔑 관리자 로그인</a>
                </div>
            </div>
        </div>
    `;
    
    // 관리자 모드 플래그 초기화
    window.isAdminMode = false;
}


// ========== 인증 모드 전환 ==========
function toggleAuthMode() {
    window.isAdminMode = !window.isAdminMode;
    const toggleBtn = document.getElementById('auth-mode-toggle');
    const emailInput = document.getElementById('auth-email');
    const nameGroup = document.querySelector('#auth-name')?.closest('.form-group');
    
    if (window.isAdminMode) {
        toggleBtn.textContent = '🔓 일반 사용자로 전환';
        if (emailInput) emailInput.placeholder = 'admin@example.com';
        if (nameGroup) nameGroup.style.display = 'none';
    } else {
        toggleBtn.textContent = '🔑 관리자 로그인';
        if (emailInput) emailInput.placeholder = 'example@email.com';
        if (nameGroup) nameGroup.style.display = 'block';
    }
}


// ========== 인증 처리 ==========
async function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('auth-email')?.value.trim();
    const password = document.getElementById('auth-password')?.value;
    const name = document.getElementById('auth-name')?.value.trim();
    
    if (!email || !password) {
        alert('이메일과 비밀번호를 입력하세요.');
        return;
    }
    
    // 관리자 모드 체크
    if (window.isAdminMode) {
        // 관리자 로그인 (하드코딩)
        if (email === 'admin@example.com' && password === 'admin123') {
            currentUser = {
                uid: 'admin_' + Date.now(),
                email: email,
                name: '관리자',
                role: 'admin'
            };
            loginSuccess(currentUser);
        } else if (email === 'manager@example.com' && password === 'manager123') {
            currentUser = {
                uid: 'manager_' + Date.now(),
                email: email,
                name: '매니저',
                role: 'manager'
            };
            loginSuccess(currentUser);
        } else {
            alert('관리자 로그인 실패!\n\nadmin@example.com / admin123\nmanager@example.com / manager123');
        }
        return;
    }
    
    // 일반 사용자 로그인/회원가입
    try {
        // Firebase Auth 사용
        if (typeof firebase !== 'undefined' && firebase.auth) {
            // 로그인 시도
            let userCredential;
            try {
                userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                console.log('✅ 로그인 성공:', userCredential.user.email);
            } catch (loginError) {
                // 계정이 없으면 회원가입
                if (loginError.code === 'auth/user-not-found') {
                    console.log('📝 신규 회원가입 진행');
                    userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    
                    // 사용자 프로필 업데이트
                    if (name && userCredential.user) {
                        await userCredential.user.updateProfile({
                            displayName: name
                        });
                    }
                    console.log('✅ 회원가입 성공');
                } else {
                    throw loginError;
                }
            }
            
            // 사용자 정보 저장
            const firebaseUser = userCredential.user;
            currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || name || firebaseUser.email.split('@')[0],
                role: 'user'  // 기본 권한
            };
            
            // Firestore에 사용자 정보 저장
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const userRef = firebase.firestore().collection('users').doc(firebaseUser.uid);
                await userRef.set({
                    email: currentUser.email,
                    name: currentUser.name,
                    role: currentUser.role,
                    lastLogin: new Date().toISOString()
                }, { merge: true });
                
                // 관리자 여부 확인
                const userDoc = await userRef.get();
                if (userDoc.exists && userDoc.data().role) {
                    currentUser.role = userDoc.data().role;
                }
            }
            
            loginSuccess(currentUser);
        } else {
            // Firebase 없을 경우 로컬 저장
            console.warn('⚠️ Firebase Auth 없음 - 로컬 모드 사용');
            currentUser = {
                uid: 'local_' + Date.now(),
                email: email,
                name: name || email.split('@')[0],
                role: 'user'
            };
            loginSuccess(currentUser);
        }
    } catch (error) {
        console.error('❌ 인증 오류:', error);
        alert('로그인 실패: ' + error.message);
    }
}


// ========== 로그인 성공 처리 ==========
function loginSuccess(user) {
    currentUser = user;
    window.currentUser = user;
    
    // localStorage에 저장
    localStorage.setItem('ch2_currentUser', JSON.stringify(user));
    
    console.log('🎉 로그인 성공:', user.name, '(' + user.role + ')');
    
    // UI 업데이트
    updateUserUI(true);
    
    // 관리자/매니저 버튼 표시
    afterTab(0);
    
    // 공지사항 로드
    if (typeof loadNoticesFromFirebase === 'function') {
        loadNoticesFromFirebase();
    }
    
    // 환영 메시지
    setTimeout(() => {
        showToast(`환영합니다, ${user.name}님!`);
    }, 500);
}


// ========== 로그아웃 ==========
function logout() {
    console.log('🚪 로그아웃 실행');
    
    // Firebase 로그아웃
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().catch(err => console.error('Firebase 로그아웃 오류:', err));
    }
    
    // localStorage 초기화
    localStorage.removeItem('ch2_currentUser');
    
    // 전역 변수 초기화
    currentUser = null;
    window.currentUser = null;
    
    // UI 업데이트
    updateUserUI(false);
    
    // 버튼 숨김
    const adminBtns = document.querySelectorAll('.admin-only, .admin-manager-only');
    adminBtns.forEach(btn => btn.classList.remove('visible'));
    
    showToast('로그아웃되었습니다.');
}


// ========== 토스트 메시지 ==========
function showToast(message, duration = 3000) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) existingToast.remove();
    
    // 새 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 자동 제거
    setTimeout(() => {
        toast.remove();
    }, duration);
}


// ========== 전역 함수 등록 ==========
function registerGlobalFunctions() {
    window.switchTab = switchTab;
    window.afterTab = afterTab;
    window.logout = logout;
    window.handleAuth = handleAuth;
    window.toggleAuthMode = toggleAuthMode;
    window.showToast = showToast;
    window.escapeHtml = escapeHtml;
    
    console.log('✅ 전역 함수 등록 완료');
}


// ========== 관리자 패널 로드 (Firebase 연동) ==========
async function loadAdminPanel() {
    const adminPanel = document.getElementById('admin-panel-content');
    if (!adminPanel) return;
    
    // 권한 체크
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
        adminPanel.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <div class="empty-state-text">관리자 권한이 필요합니다</div>
                <div class="empty-state-hint">관리자만 접근 가능한 페이지입니다.</div>
            </div>
        `;
        return;
    }
    
    adminPanel.innerHTML = '<div class="loading">로딩 중...</div>';
    
    try {
        let users = [];
        
        // Firebase에서 사용자 목록 가져오기
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const usersRef = firebase.firestore().collection('users');
            const snapshot = await usersRef.get();
            users = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } else {
            // 로컬 스토리지에서 가져오기
            const savedUsers = localStorage.getItem('ch2_users');
            if (savedUsers) {
                users = JSON.parse(savedUsers);
            }
        }
        
        // 현재 사용자 추가
        if (currentUser && !users.find(u => u.id === currentUser.uid)) {
            users.unshift({
                id: currentUser.uid,
                email: currentUser.email,
                name: currentUser.name,
                role: currentUser.role
            });
        }
        
        if (users.length === 0) {
            adminPanel.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">등록된 사용자가 없습니다</div>
                </div>
            `;
            return;
        }
        
        // 사용자 목록 표시
        adminPanel.innerHTML = `
            <h3>👥 사용자 관리</h3>
            <div class="user-list">
                ${users.map(user => `
                    <div class="user-list-item">
                        <div class="user-list-info">
                            <div class="user-list-email">${escapeHtml(user.email || user.id)}</div>
                            <div class="user-list-name">${escapeHtml(user.name || '이름 없음')}</div>
                            <span class="user-list-role">${getRoleText(user.role)}</span>
                        </div>
                        ${currentUser.role === 'admin' && user.id !== currentUser.uid ? `
                            <select class="role-select" onchange="changeUserRole('${user.id}', this.value)">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>일반 사용자</option>
                                <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>매니저</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
                            </select>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('❌ 관리자 패널 로드 실패:', error);
        adminPanel.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">로드 실패</div>
                <div class="empty-state-hint">${error.message}</div>
            </div>
        `;
    }
}


// ========== 사용자 권한 변경 ==========
async function changeUserRole(userId, newRole) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('관리자만 권한을 변경할 수 있습니다.');
        return;
    }
    
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            await firebase.firestore().collection('users').doc(userId).update({
                role: newRole,
                updatedAt: new Date().toISOString()
            });
            showToast('✅ 권한이 변경되었습니다.');
        } else {
            // 로컬 스토리지 업데이트
            const savedUsers = localStorage.getItem('ch2_users');
            if (savedUsers) {
                let users = JSON.parse(savedUsers);
                const userIndex = users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    users[userIndex].role = newRole;
                    localStorage.setItem('ch2_users', JSON.stringify(users));
                    showToast('✅ 권한이 변경되었습니다 (로컬)');
                }
            }
        }
        
        // 관리자 패널 새로고침
        await loadAdminPanel();
        
    } catch (error) {
        console.error('❌ 권한 변경 실패:', error);
        alert('권한 변경에 실패했습니다: ' + error.message);
    }
}


// ==================== 개인정보 처리방침 ====================


function showPrivacyPolicy() {
    const modal = document.getElementById('modal-privacy');
    if (!modal) {
        console.error('❌ modal-privacy 요소를 찾을 수 없음');
        return;
    }
    
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 600px; max-height: 90vh; overflow-y: auto; background: var(--bg); border-radius: 24px; width: 92%; margin: 20px auto; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div class="modal-header" style="padding: 16px 20px; background: linear-gradient(135deg, #5c3d1e, #8b6b4a); border-radius: 24px 24px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <div class="modal-title" style="color: white; font-size: 18px; font-weight: 700;">📋 개인정보 처리방침</div>
                <button class="modal-close" onclick="closeModal('modal-privacy')" style="background: rgba(255,255,255,0.15); border: none; border-radius: 50%; width: 36px; height: 36px; color: white; font-size: 20px; cursor: pointer;">✕</button>
            </div>
            <div style="padding: 24px 20px; font-size: 13px; color: var(--text); line-height: 1.9; max-height: calc(90vh - 80px); overflow-y: auto;">
                <h3 style="font-size: 15px; color: #5c3d1e; margin: 16px 0 8px 0; border-left: 4px solid #d4a840; padding-left: 12px;">제1조 (개인정보의 처리 목적)</h3>
                <p style="margin-bottom: 8px; color: var(--text2);">가좌제일교회는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
                <ul style="padding-left: 24px; margin-bottom: 12px; color: var(--text2);">
                    <li>교회 회원 관리 및 식별</li>
                    <li>예배 및 행사 안내</li>
                    <li>기도제목 및 교제 공유</li>
                    <li>교회 소식 및 공지사항 전달</li>
                    <li>성경 통독 및 묵상 기록 관리</li>
                </ul>
                <h3 style="font-size: 15px; color: #5c3d1e; margin: 16px 0 8px 0; border-left: 4px solid #d4a840; padding-left: 12px;">제2조 (처리하는 개인정보 항목)</h3>
                <ul style="padding-left: 24px; margin-bottom: 12px; color: var(--text2);">
                    <li><strong>필수항목:</strong> 이름, 아이디, 비밀번호, 생년월일</li>
                    <li><strong>선택항목:</strong> 전화번호, 이메일</li>
                </ul>
                <h3 style="font-size: 15px; color: #5c3d1e; margin: 16px 0 8px 0; border-left: 4px solid #d4a840; padding-left: 12px;">제3조 (개인정보의 보유 및 이용기간)</h3>
                <p style="margin-bottom: 8px; color: var(--text2);">회원 탈퇴 시 즉시 파기합니다. 단, 관계법령에 따라 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
                <h3 style="font-size: 15px; color: #5c3d1e; margin: 16px 0 8px 0; border-left: 4px solid #d4a840; padding-left: 12px;">제4조 (개인정보의 제3자 제공)</h3>
                <p style="margin-bottom: 8px; color: var(--text2);">가좌제일교회는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 경우는 예외로 합니다.</p>
                <h3 style="font-size: 15px; color: #5c3d1e; margin: 16px 0 8px 0; border-left: 4px solid #d4a840; padding-left: 12px;">제5조 (개인정보 보호책임자)</h3>
                <div style="background: rgba(92, 61, 30, 0.06); border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; color: var(--text2);">
                    <div><strong>담당자:</strong> 김명서 목사</div>
                    <div><strong>연락처:</strong> (032) 581-4048</div>
                    <div><strong>이메일:</strong> gajwajeil@example.com</div>
                </div>
                <h3 style="font-size: 15px; color: #5c3d1e; margin: 16px 0 8px 0; border-left: 4px solid #d4a840; padding-left: 12px;">제6조 (개인정보 자동 수집 장치의 설치·운영)</h3>
                <p style="margin-bottom: 8px; color: var(--text2);">본 앱은 쿠키를 사용하지 않으며, 로컬 스토리지에 로그인 정보를 임시 저장합니다.</p>
                <div style="font-size: 11px; color: var(--text2); opacity: 0.6; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); text-align: center;">
                    시행일: 2024년 1월 1일<br>
                    <span style="font-size: 10px;">본 방침은 2024년 1월 1일부터 시행됩니다.</span>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '10001';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.padding = '16px';
}


window.showPrivacyPolicy = showPrivacyPolicy;
// 전역 함수 등록
window.changeUserRole = changeUserRole;
window.loadAdminPanel = loadAdminPanel;


console.log('✅ js_ui.js 로드 완료');