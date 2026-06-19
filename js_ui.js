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


// 전역 함수 등록
window.changeUserRole = changeUserRole;
window.loadAdminPanel = loadAdminPanel;


console.log('✅ js_ui.js 로드 완료');