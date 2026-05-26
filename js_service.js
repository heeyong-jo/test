// ==================== 예배 안내 및 시간표 ====================


// ✅ 서비스 리스트 전역 변수 선언
let serviceList = [];
let scheduleList = [];


// 1. 기본값 상수 정의
const DEFAULT_SERVICE_LIST = [
  { emoji:'⛪', name:'주일 낮예배 1부',       sub:'매주 일요일',  time:'오전 8:00   3층 예루살렘성전' },
  { emoji:'⛪', name:'주일 낮예배 2부',       sub:'매주 일요일',  time:'오전 9:30   3층 예루살렘성전' },
  { emoji:'⛪', name:'주일 낮예배 3부',       sub:'매주 일요일',  time:'오전 11:30  3층 예루살렘성전' },
  { emoji:'🙌', name:'오후찬양예배',          sub:'매주 일요일',  time:'오후 2:30   3층 예루살렘성전' },
  { emoji:'🌅', name:'새벽기도회',            sub:'월-금',        time:'새벽 5:00' },
  { emoji:'🙏', name:'수요기도회 1부',        sub:'매주 수요일',  time:'오전 10:30  3층 예루살렘성전' },
  { emoji:'🙏', name:'수요기도회 2부',        sub:'매주 수요일',  time:'저녁 7:00   3층 예루살렘성전' },
  { emoji:'🔥', name:'금요성령집회',          sub:'매주 금요일',  time:'저녁 8:30' },
  { emoji:'🐣', name:'꿈지락 (0-4세)',        sub:'매주 일요일',  time:'오전 11:30  2층 203호' },
  { emoji:'🌱', name:'꿈트리 (5-7세)',        sub:'매주 일요일',  time:'오전 11:30  2층 210호' },
  { emoji:'📚', name:'꿈마루 (8-13세)',       sub:'매주 일요일',  time:'오전 11:30  5층 드림홀' },
  { emoji:'🔥', name:'꿈하나 (14-19세)',      sub:'매주 일요일',  time:'오전 9:30   5층 드림홀' },
  { emoji:'✝️', name:'청년예배 (20세 이상)',  sub:'매주 일요일',  time:'오후 2:00   5층 드림홀' },
  { emoji:'👨‍👩‍👧', name:'아가새\n(온가족 아침기도회)', sub:'30·40 부모와 자녀 / 매분기 셋째 주 토요일', time:'오전 9:00   3층 예루살렘성전' },
];


// ✅ localStorage에서 데이터 로드하는 함수 추가
function loadServiceListFromStorage() {
  try {
    const saved = localStorage.getItem('ch2_serviceList');
    if (saved) {
      serviceList = JSON.parse(saved);
      console.log('✅ localStorage에서 serviceList 로드:', serviceList.length);
    } else {
      serviceList = JSON.parse(JSON.stringify(DEFAULT_SERVICE_LIST));
      localStorage.setItem('ch2_serviceList', JSON.stringify(serviceList));
      console.log('✅ 기본 serviceList 설정');
    }
  } catch(e) {
    console.error('serviceList 로드 실패:', e);
    serviceList = JSON.parse(JSON.stringify(DEFAULT_SERVICE_LIST));
  }
}


// 예배 안내 데이터 로드
function initServiceData() {
  console.log('initServiceData 실행');
  loadServiceListFromStorage();
  renderServiceView();
}


// 예배 안내 렌더링
function renderServiceView() {
  console.log('renderServiceView 실행');
  
  const sundayContainer = document.getElementById('sunday-service-list-view');
  const otherContainer = document.getElementById('other-service-list-view');
  
  if (!sundayContainer || !otherContainer) {
    console.warn('예배 컨테이너 없음');
    return;
  }
  
  if (!serviceList || serviceList.length === 0) {
    sundayContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">예배 정보가 없습니다.</div>';
    otherContainer.innerHTML = '';
    return;
  }
  
  // 주일 예배 필터링
  const sunday = serviceList.filter(s => s.sub && s.sub.includes('일요일'));
  // 기타 예배 필터링
  const other = serviceList.filter(s => !s.sub || !s.sub.includes('일요일'));
  
  // 주일 예배 렌더링
  if (sunday.length === 0) {
    sundayContainer.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text2);">등록된 주일 예배가 없습니다.</div>';
  } else {
    sundayContainer.innerHTML = sunday.map(s => `
      <div class="service-row">
        <div>
          <div class="service-name">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
          <div class="service-time">${escapeHtml(s.sub)}</div>
        </div>
        <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time)}</span>
      </div>
    `).join('');
  }
  
  // 기타 예배 렌더링 (아코디언 포함)
  if (other.length === 0) {
    otherContainer.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text2);">등록된 기타 예배가 없습니다.</div>';
  } else {
    otherContainer.innerHTML = `
      <div id="other-service-toggle" onclick="toggleOtherServiceBody()" style="cursor:pointer; display:flex; align-items:center; gap:6px; padding:8px 0; user-select:none;">
        <span id="other-service-arrow" style="font-size:16px; transition:transform 0.2s;">▶</span>
        <span style="font-weight:700; font-size:14px; color:var(--text);">그 외 예배 안내</span>
      </div>
      <div id="other-service-body" style="display:none;">
        ${other.map(s => `
          <div class="service-row">
            <div>
              <div class="service-name">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
              <div class="service-time">${escapeHtml(s.sub)}</div>
            </div>
            <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}


function toggleOtherServiceBody() {
  const body = document.getElementById('other-service-body');
  const arrow = document.getElementById('other-service-arrow');
  if (!body || !arrow) return;
  
  const isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  arrow.textContent = isOpen ? '▶' : '▼';
}


// 예배 시간표 렌더링
function renderScheduleView() {
  const el = document.getElementById('schedule-list-view');
  if (!el) return;
  
  if (!scheduleList || scheduleList.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">등록된 시간표가 없습니다.</div>';
    return;
  }
  
  el.innerHTML = scheduleList.map(s => `
    <div class="service-row">
      <div>
        <div class="service-name">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-time">${escapeHtml(s.sub)}</div>
      </div>
      <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time)}</span>
    </div>
  `).join('');
}


// 예배 안내 수정 관련 함수들
function toggleSundayEdit() {
  if (document.getElementById('sunday-service-edit').style.display === 'block') {
    cancelSundayEdit();
    return;
  }
  sundayEditData = JSON.parse(JSON.stringify(serviceList.filter(s => s.sub && s.sub.includes('일요일'))));
  document.getElementById('sunday-service-view').style.display = 'none';
  document.getElementById('sunday-service-edit').style.display = 'block';
  renderSundayEditList();
}


function renderSundayEditList() {
  const el = document.getElementById('sunday-service-list-edit');
  if (!el) return;
  el.innerHTML = sundayEditData.map((s, i) => `
    <div class="service-edit-row">
      <div class="service-edit-name">
        <div>${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-edit-sub">${escapeHtml(s.sub)}</div>
      </div>
      <input class="service-time-input" value="${s.time}" onchange="sundayEditData[${i}].time=this.value">
      <button class="service-del-btn" onclick="deleteSundayEditRow(${i})">삭제</button>
    </div>
  `).join('');
}


function deleteSundayEditRow(i) {
  sundayEditData.splice(i, 1);
  renderSundayEditList();
}


function addSundayServiceRow() {
  const name = prompt('예배 이름', '');
  if (!name) return;
  sundayEditData.push({ emoji: '✨', name, sub: '매주 일요일', time: '오전 11:00' });
  renderSundayEditList();
}


function saveSundayEdit() {
  const other = serviceList.filter(s => !s.sub || !s.sub.includes('일요일'));
  serviceList = [...sundayEditData, ...other];
  if (typeof LS !== 'undefined') LS.save('serviceList', serviceList);
  cancelSundayEdit();
  renderServiceView();
  showToast('✅ 주일 예배가 저장되었습니다');
}


function cancelSundayEdit() {
  document.getElementById('sunday-service-view').style.display = 'block';
  document.getElementById('sunday-service-edit').style.display = 'none';
}


function toggleOtherEdit() {
  if (document.getElementById('other-service-edit').style.display === 'block') {
    cancelOtherEdit();
    return;
  }
  otherEditData = JSON.parse(JSON.stringify(serviceList.filter(s => !s.sub || !s.sub.includes('일요일'))));
  document.getElementById('other-service-view').style.display = 'none';
  document.getElementById('other-service-edit').style.display = 'block';
  renderOtherEditList();
}


function renderOtherEditList() {
  const el = document.getElementById('other-service-list-edit');
  if (!el) return;
  el.innerHTML = otherEditData.map((s, i) => `
    <div class="service-edit-row">
      <div class="service-edit-name">
        <div>${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-edit-sub">${escapeHtml(s.sub)}</div>
      </div>
      <input class="service-time-input" value="${s.time}" onchange="otherEditData[${i}].time=this.value">
      <button class="service-del-btn" onclick="deleteOtherEditRow(${i})">삭제</button>
    </div>
  `).join('');
}


function deleteOtherEditRow(i) {
  otherEditData.splice(i, 1);
  renderOtherEditList();
}


function addOtherServiceRow() {
  const name = prompt('예배 이름', '');
  if (!name) return;
  otherEditData.push({ emoji: '🔥', name, sub: '매주 금요일', time: '저녁 8:00' });
  renderOtherEditList();
}


function saveOtherEdit() {
  const sunday = serviceList.filter(s => s.sub && s.sub.includes('일요일'));
  serviceList = [...sunday, ...otherEditData];
  if (typeof LS !== 'undefined') LS.save('serviceList', serviceList);
  cancelOtherEdit();
  renderServiceView();
  showToast('✅ 기타 예배가 저장되었습니다');
}


function cancelOtherEdit() {
  document.getElementById('other-service-view').style.display = 'block';
  document.getElementById('other-service-edit').style.display = 'none';
}


console.log('✅ js_service.js 로드 완료');


// ==================== 섬기는 분들 (Members) ====================


function renderMembers() {
  const container = document.getElementById('members-list');
  if (!container) return;
  
  if (!Array.isArray(members) || members.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">등록된 분들이 없습니다</div>';
    return;
  }
  
  let html = '';
  members.forEach(member => {
    html += `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <strong style="font-size:14px;">${member.name || '이름 미등록'}</strong>
            <span style="font-size:12px;color:var(--text2);margin-left:8px;">${member.role || '역할 미지정'}</span>
          </div>
        </div>
        ${member.phone ? `<div style="font-size:12px;color:var(--text2);">📱 ${member.phone}</div>` : ''}
        ${member.duty ? `<div style="font-size:12px;color:var(--purple);margin-top:8px;">💼 ${member.duty}</div>` : ''}
      </div>
    `;
  });
  
  container.innerHTML = html;
}


function addMember() {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('관리자만 추가할 수 있습니다');
    return;
  }
  
  const name = prompt('이름을 입력하세요:');
  if (!name) return;
  
  const role = prompt('역할을 입력하세요 (예: 목사, 집사, 권사):');
  const phone = prompt('전화번호를 입력하세요:');
  const duty = prompt('담당 사항을 입력하세요:');
  
  const newMember = {
    id: Date.now(),
    name: name,
    role: role || '미지정',
    phone: phone || '',
    duty: duty || '',
    addedDate: new Date().toLocaleDateString('ko-KR')
  };
  
  if (!Array.isArray(members)) members = [];
  members.push(newMember);
  
  if (typeof LS !== 'undefined') {
    LS.save('members', members);
  }
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('members').set(members)
      .catch(err => console.error('members 저장 실패:', err));
  }
  
  renderMembers();
  showToast('✅ 새로운 분이 추가되었습니다');
}