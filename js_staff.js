// ==================== 섬기는 분들 (js_staff.js) ====================
// 수정본 - 전역 변수 일관성 유지, 에러 처리 개선


// 기본 스태프 데이터
const DEFAULT_STAFF = [
  {
    groupKey: "pastor", label: "담임목사",
    members: [{
      name: "김명서 담임목사", photo: "", roles: [],
      books: [
        "『새가족 양육교실』, 가좌제일출판부, 2006",
        "『예배는 생명이다(레위기 강해)』, 도서출판 해바라기",
        "『희망을 주는 교회 성장 이야기』, 쿰란출판사, 2017",
        "『하나님의 구원경영(설교집)』, 도서출판 해바라기, 2021",
        "『하나님의 구원경영(성경공부 인도자용)』, 도서출판 해바라기, 2021",
        "『하나님의 구원경영(성경공부 학습자용)』, 도서출판 해바라기, 2021",
        "『벽돌 한 장의 기적』, 비전북, 2022",
        "『우리가 꿈꾸는 교회(설교집)』, 2024",
        "『우리가 꿈꾸는 교회(성경공부 인도자용)』, 도서출판 해바라기, 2024",
        "『우리가 꿈꾸는 교회(성경공부 학습자용)』, 도서출판 해바라기, 2024"
      ]
    }]
  },
  {
    groupKey: "associate", label: "부교역자",
    members: [
      { name:"강연주 목사",    photo:"", roles:["기독교사회봉사 전담","해바라기마을복지센터","해바라기지역아동센터","해바라기청춘대학","여전도회협의회"] },
      { name:"신기한 목사",    photo:"", roles:["소망목장","행정(총괄)","관리위원회","새가족위원회","남선교회협의회","주일 3부 드리머스 워십"] },
      { name:"김기찬 목사",    photo:"", roles:["사랑목장","꿈마루(아동부)","예배위원회","교육위원회","금요성령집회 헤세드 워십"] },
      { name:"이강성 목사",    photo:"", roles:["온유목장","전도·선교위원회","행정위원회","중보기도학교"] },
      { name:"서아론 목사",    photo:"", roles:["충성목장","꿈하나(청소년부)","3040부","30, 40남선교회","갈렙남선교회","방송 및 영상 관리","주일 오후 카리스 워십"] },
      { name:"전창현 목사",    photo:"", roles:["새이플러스(청년부)","에스겔 목장","주보 담당","에녹남선교회","홈페이지 관리"] },
      { name:"황기쁨 전도사",  photo:"", roles:["믿음목장","꿈트리(유치부)","양육위원회","요게벳여전도회","방송 및 영상 관리","주일 2부 아바드 워십"] },
      { name:"이용돈 음악목사",photo:"", roles:["음악전문 사역","수요기도회 샤할루 워십","3부 시온성가대 지휘","한나여전도회"] },
      { name:"권경 교육전도사",photo:"", roles:["꿈지락(영·유아부)","가정사역 담당"] }
    ]
  },
  {
    groupKey: "missionary", label: "선교사",
    members: [
      { name:"박찬길 선교사", photo:"", roles:["필리핀 단독파송"] },
      { name:"백준호 선교사", photo:"", roles:["호주 선교사"] }
    ]
  },
  {
    groupKey: "elder_active", label: "시무장로",
    members: [
      { name:"조도형 장로", photo:"", roles:["관리위원회"] },
      { name:"길용준 장로", photo:"", roles:["행정위원회"] },
      { name:"한상운 장로", photo:"", roles:["재정위원회"] },
      { name:"현승진 장로", photo:"", roles:["새가족위원회"] },
      { name:"김기현 장로", photo:"", roles:["전도/선교위원회"] },
      { name:"박현구 장로", photo:"", roles:["교육위원회"] },
      { name:"윤원명 장로", photo:"", roles:["예배위원회 ①"] },
      { name:"김일출 장로", photo:"", roles:["사회봉사위원회 ①"] },
      { name:"이해현 장로", photo:"", roles:["해바라기마을 복지센터"] },
      { name:"우철수 장로", photo:"", roles:["양육위원회"] },
      { name:"진옥희 장로", photo:"", roles:["예배위원회 ②"] },
      { name:"구숙기 장로", photo:"", roles:["사회봉사위원회 ②"] }
    ]
  },
  { groupKey:"elder_assoc",        label:"협동장로",     members:[{name:"강하용 협동장로",photo:"",roles:[]},{name:"박청순 협동장로",photo:"",roles:[]}] },
  { groupKey:"elder_emeritus",     label:"원로장로",     members:[{name:"김소현 원로장로",photo:"",roles:[]},{name:"유종오 원로장로",photo:"",roles:[]},{name:"신현욱 원로장로",photo:"",roles:[]},{name:"엄기일 원로장로",photo:"",roles:[]}] },
  { groupKey:"elder_retired",      label:"은퇴장로",     members:[{name:"배경식 은퇴장로",photo:"",roles:[]},{name:"이현우 은퇴장로",photo:"",roles:[]},{name:"최창진 은퇴장로",photo:"",roles:[]},{name:"강완수 은퇴장로",photo:"",roles:[]},{name:"김용년 은퇴장로",photo:"",roles:[]},{name:"한상용 은퇴장로",photo:"",roles:[]}] },
  { groupKey:"elder_retired_assoc",label:"협동은퇴장로", members:[{name:"진병용 협동은퇴장로",photo:"",roles:[]},{name:"정한수 협동은퇴장로",photo:"",roles:[]},{name:"윤보환 협동은퇴장로",photo:"",roles:[]},{name:"민성옥 협동은퇴장로",photo:"",roles:[]}] },
  {
    groupKey:"welfare", label:"해바라기 지역아동센터",
    members:[{name:"강연주 시설장",photo:"",roles:[]},{name:"문성원 생활복지사",photo:"",roles:[]},{name:"이향미 생활복지사",photo:"",roles:[]},{name:"우성훈 생활복지사",photo:"",roles:[]}]
  },
  { groupKey:"admin_office", label:"행정실", members:[{name:"김은경 (행정)권사",photo:"",roles:[]}] }
];


// ── 상태 ──────────────────────────────────────────────────────────
let staffData = null;
let staffPendingPhoto = "";
let staffEditGroup = "";
let staffEditIdx = -1;
let staffEditAction = "";


// ── 현재 사용자 가져오기 (통합 함수) ──────────────────────────────
function getCurrentUserForStaff() {
  if (typeof window.currentUser !== 'undefined' && window.currentUser) return window.currentUser;
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  return null;
}


// ── 관리자 여부 ───────────────────────────────────────────────────
function staffIsAdmin() {
  const user = getCurrentUserForStaff();
  return user && user.role === 'admin';
}


// ── Firebase 로드 (개선) ─────────────────────────────────────────
function loadStaff() {
  console.log('📋 loadStaff 실행');
  
  const container = document.getElementById('staff-container');
  if (!container) {
    console.warn('staff-container 요소 없음');
    return;
  }
  
  container.innerHTML = '<div style="text-align:center;padding:20px;"><div class="splash-spinner" style="width:24px;height:24px;"></div><div>불러오는 중...</div></div>';
  
  // Firebase가 없으면 기본 데이터로 즉시 렌더링
  if (typeof firebase === 'undefined' || !firebase.database || !window.FB_READY) {
    console.warn('Firebase 연결 안됨, 기본 데이터 사용');
    staffData = JSON.parse(JSON.stringify(DEFAULT_STAFF));
    renderStaff();
    return;
  }
  
  // 타임아웃 추가 (5초)
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Firebase 로드 타임아웃')), 5000)
  );
  
  const loadPromise = firebase.database().ref('staff').once('value');
  
  Promise.race([loadPromise, timeoutPromise])
    .then(snap => {
      if (snap && snap.exists()) {
        const raw = snap.val();
        staffData = Array.isArray(raw) ? raw : Object.values(raw);
        console.log('✅ Firebase staff 로드 성공');
      } else {
        staffData = JSON.parse(JSON.stringify(DEFAULT_STAFF));
        console.log('📁 기본 staff 데이터 사용');
      }
      renderStaff();
    })
    .catch(err => {
      console.error('staff 로드 실패:', err);
      staffData = JSON.parse(JSON.stringify(DEFAULT_STAFF));
      renderStaff();
      if (typeof showToast === 'function') {
        showToast('⚠️ 서버 연결 실패, 기본 데이터를 표시합니다');
      }
    });
}


// ── 렌더링 ────────────────────────────────────────────────────────
function renderStaff() {
  const wrap = document.getElementById('staff-container');
  if (!wrap || !staffData) return;
  const isAdmin = staffIsAdmin();
  let html = '';


  staffData.forEach(group => {
    html += `
    <div class="sf-group">
      <div class="sf-group-header">
        <span>${escapeHtml(group.label)}</span>
        ${isAdmin ? `<button class="sf-btn-add" onclick="staffOpenAdd('${group.groupKey}')">➕ 추가</button>` : ''}
      </div>`;


    if (group.groupKey === 'pastor') {
      group.members.forEach((m, mIdx) => {
        html += `
        <div class="sf-pastor-card">
          <div class="sf-pastor-top">
            <div class="sf-photo-wrap sf-photo-wrap--lg">
              ${m.photo ? `<img src="${m.photo}" class="sf-photo" loading="lazy">` : `<div class="sf-photo-ph">👤</div>`}
              ${isAdmin ? `<label class="sf-cam-btn" title="사진 변경">📷<input type="file" accept="image/*" onchange="staffInlinePhoto(this,'${group.groupKey}',${mIdx})" style="display:none"></label>` : ''}
            </div>
            <div class="sf-pastor-info">
              <div class="sf-pastor-name">${escapeHtml(m.name)}</div>
              ${isAdmin ? `<div class="sf-actions"><button onclick="staffOpenEdit('${group.groupKey}',${mIdx})">✏️ 수정</button><button class="sf-del" onclick="staffDeleteMember('${group.groupKey}',${mIdx})">🗑 삭제</button></div>` : ''}
            </div>
          </div>
          ${(m.books && m.books.length) ? `
          <div class="sf-books-label">📚 저서</div>
          <div class="sf-books">${m.books.map(b=>`<div class="sf-book">${escapeHtml(b)}</div>`).join('')}</div>` : ''}
        </div>`;
      });
    } else {
      html += `<div class="sf-list">`;
      group.members.forEach((m, mIdx) => {
        html += `
        <div class="sf-card">
          <div class="sf-photo-wrap">
            ${m.photo ? `<img src="${m.photo}" class="sf-photo" loading="lazy">` : `<div class="sf-photo-ph">👤</div>`}
            ${isAdmin ? `<label class="sf-cam-btn" title="사진 변경">📷<input type="file" accept="image/*" onchange="staffInlinePhoto(this,'${group.groupKey}',${mIdx})" style="display:none"></label>` : ''}
          </div>
          <div class="sf-card-body">
            <div class="sf-name">${escapeHtml(m.name)}</div>
            ${(m.roles && m.roles.length) ? `<ul class="sf-roles">${m.roles.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>` : ''}
            ${isAdmin ? `<div class="sf-actions"><button onclick="staffOpenEdit('${group.groupKey}',${mIdx})">✏️ 수정</button><button class="sf-del" onclick="staffDeleteMember('${group.groupKey}',${mIdx})">🗑 삭제</button></div>` : ''}
          </div>
        </div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });


  wrap.innerHTML = html;
}


// ── 카드에서 바로 사진 교체 ──────────────────────────────────────
function staffInlinePhoto(input, groupKey, mIdx) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) {
    if (typeof showToast === 'function') {
      showToast('사진은 1.5MB 이하로 올려주세요');
    } else {
      alert('사진은 1.5MB 이하로 올려주세요.');
    }
    return;
  }
  resizeStaffImage(file).then(dataUrl => {
    const group = staffData.find(g => g.groupKey === groupKey);
    if (!group) return;
    group.members[mIdx].photo = dataUrl;
    saveStaff(() => renderStaff());
  }).catch(() => {
    if (typeof showToast === 'function') {
      showToast('사진 처리 중 오류가 발생했습니다');
    } else {
      alert('사진 처리 중 오류가 발생했습니다.');
    }
  });
}


// ── 모달 관련 함수 (추가/수정/삭제) ───────────────────────────────
function staffOpenAdd(groupKey) {
  const isAdmin = staffIsAdmin();
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('관리자만 추가할 수 있습니다');
    return;
  }
  
  staffEditGroup = groupKey;
  staffEditIdx = -1;
  staffEditAction = 'add';
  staffPendingPhoto = '';
  const isPastor = (groupKey === 'pastor');
  
  const titleEl = document.getElementById('sf-modal-title');
  const nameEl = document.getElementById('sf-input-name');
  const contentEl = document.getElementById('sf-input-content');
  const contentLabelEl = document.getElementById('sf-content-label');
  
  if (titleEl) titleEl.textContent = '➕ 인원 추가';
  if (nameEl) nameEl.value = '';
  if (contentEl) contentEl.value = '';
  if (contentLabelEl) contentLabelEl.textContent = isPastor ? '저서 (줄바꿈으로 구분)' : '담당사역 (줄바꿈으로 구분)';
  
  staffModalPhotoClear();
  
  const modal = document.getElementById('modal-staff');
  if (modal) modal.style.display = 'flex';
}


function staffOpenEdit(groupKey, mIdx) {
  const isAdmin = staffIsAdmin();
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('관리자만 수정할 수 있습니다');
    return;
  }
  
  staffEditGroup = groupKey;
  staffEditIdx = mIdx;
  staffEditAction = 'edit';
  
  const group = staffData.find(g => g.groupKey === groupKey);
  if (!group) return;
  
  const m = group.members[mIdx];
  staffPendingPhoto = m.photo || '';
  const isPastor = (groupKey === 'pastor');
  
  const titleEl = document.getElementById('sf-modal-title');
  const nameEl = document.getElementById('sf-input-name');
  const contentEl = document.getElementById('sf-input-content');
  const contentLabelEl = document.getElementById('sf-content-label');
  
  if (titleEl) titleEl.textContent = '✏️ 정보 수정';
  if (nameEl) nameEl.value = m.name;
  if (contentEl) contentEl.value = isPastor ? (m.books || []).join('\n') : (m.roles || []).join('\n');
  if (contentLabelEl) contentLabelEl.textContent = isPastor ? '저서 (줄바꿈으로 구분)' : '담당사역 (줄바꿈으로 구분)';
  
  if (m.photo) {
    const prevEl = document.getElementById('sf-modal-prev');
    const phEl = document.getElementById('sf-modal-ph');
    if (prevEl) {
      prevEl.src = m.photo;
      prevEl.style.display = 'block';
    }
    if (phEl) phEl.style.display = 'none';
  } else {
    staffModalPhotoClear();
  }
  
  const modal = document.getElementById('modal-staff');
  if (modal) modal.style.display = 'flex';
}


function staffModalPhotoChange(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) {
    if (typeof showToast === 'function') {
      showToast('사진은 1.5MB 이하로 올려주세요');
    } else {
      alert('사진은 1.5MB 이하로 올려주세요.');
    }
    return;
  }
  resizeStaffImage(file).then(dataUrl => {
    staffPendingPhoto = dataUrl;
    const prevEl = document.getElementById('sf-modal-prev');
    const phEl = document.getElementById('sf-modal-ph');
    if (prevEl) {
      prevEl.src = staffPendingPhoto;
      prevEl.style.display = 'block';
    }
    if (phEl) phEl.style.display = 'none';
  }).catch(() => {
    if (typeof showToast === 'function') {
      showToast('사진 처리 중 오류가 발생했습니다');
    } else {
      alert('사진 처리 중 오류가 발생했습니다.');
    }
  });
}


function staffModalPhotoClear() {
  const prevEl = document.getElementById('sf-modal-prev');
  const phEl = document.getElementById('sf-modal-ph');
  if (prevEl) {
    prevEl.src = '';
    prevEl.style.display = 'none';
  }
  if (phEl) phEl.style.display = 'flex';
}


function staffSave() {
  const nameEl = document.getElementById('sf-input-name');
  const contentEl = document.getElementById('sf-input-content');
  
  const name = nameEl ? nameEl.value.trim() : '';
  const content = contentEl ? contentEl.value.trim() : '';
  
  if (!name) {
    if (typeof showToast === 'function') {
      showToast('이름을 입력하세요');
    } else {
      alert('이름을 입력하세요.');
    }
    return;
  }


  const isPastor = (staffEditGroup === 'pastor');
  const lines = content ? content.split('\n').map(s => s.trim()).filter(Boolean) : [];
  const entry = {
    name,
    photo: staffPendingPhoto,
    roles: isPastor ? [] : lines,
    ...(isPastor ? { books: lines } : {})
  };


  const group = staffData.find(g => g.groupKey === staffEditGroup);
  if (!group) {
    if (typeof showToast === 'function') showToast('그룹을 찾을 수 없습니다');
    return;
  }


  if (staffEditAction === 'add') {
    group.members.push(entry);
  } else {
    group.members[staffEditIdx] = { ...group.members[staffEditIdx], ...entry };
  }


  // 저장 후 모달 닫기 (성공 시에만)
  saveStaff(() => {
    staffCloseModal();
    renderStaff();
    if (typeof showToast === 'function') {
      showToast('✅ 저장되었습니다');
    }
  });
}


function staffDeleteMember(groupKey, mIdx) {
  const isAdmin = staffIsAdmin();
  if (!isAdmin) {
    if (typeof showToast === 'function') showToast('관리자만 삭제할 수 있습니다');
    return;
  }
  
  if (!confirm('정말 삭제하시겠습니까?')) return;
  
  const group = staffData.find(g => g.groupKey === groupKey);
  if (!group) return;
  
  group.members.splice(mIdx, 1);
  saveStaff(() => {
    renderStaff();
    if (typeof showToast === 'function') {
      showToast('🗑 삭제되었습니다');
    }
  });
}


function saveStaff(cb) {
  if (typeof firebase !== 'undefined' && firebase.database && window.FB_READY) {
    firebase.database().ref('staff').set(staffData)
      .then(() => {
        if (cb) cb();
      })
      .catch(err => {
        console.error('staff 저장 실패', err);
        if (typeof showToast === 'function') {
          showToast('❌ 저장 중 오류가 발생했습니다');
        } else {
          alert('저장 중 오류가 발생했습니다.');
        }
      });
  } else {
    // localStorage에 백업 저장
    try {
      localStorage.setItem('ch2_staff', JSON.stringify(staffData));
      console.log('✅ staff 로컬 저장 완료');
    } catch(e) {
      console.error('로컬 저장 실패:', e);
    }
    if (cb) cb();
  }
}


function staffCloseModal() {
  const modal = document.getElementById('modal-staff');
  if (modal) modal.style.display = 'none';
  staffPendingPhoto = '';
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
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
        canvas.remove();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


// localStorage에서 staff 데이터 복원 시도
function loadStaffFromLocal() {
  try {
    const saved = localStorage.getItem('ch2_staff');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        staffData = parsed;
        console.log('✅ 로컬에서 staff 데이터 복원 완료');
        renderStaff();
        return true;
      }
    }
  } catch(e) {
    console.error('로컬 staff 복원 실패:', e);
  }
  return false;
}


// 초기화: 로컬 데이터 우선, Firebase는 별도 로드
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!loadStaffFromLocal()) {
      loadStaff();
    }
  });
} else {
  if (!loadStaffFromLocal()) {
    loadStaff();
  }
}


console.log('✅ js_staff.js 로드 완료 (수정본)');