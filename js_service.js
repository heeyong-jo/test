// ==================== 예배 안내 및 시간표 ====================


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


function initServiceData() {
  if (typeof LS === 'undefined') return;
  serviceList = LS.load('serviceList', DEFAULT_SERVICE_LIST);
  prayers = LS.load('prayers', []);
}


function renderServiceView() {
  console.log('renderServiceView 호출됨');
  renderSundayService();
  renderOtherService();
}


  function renderSundayService() {
  const list = document.getElementById('sunday-service-list-view');
  if (!list) return;


  const sunday = serviceList.filter(s => s.sub && s.sub.includes('일요일'));
  if (sunday.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text2);">등록된 주일 예배가 없습니다.</div>';
    return;
  }
  list.innerHTML = sunday.map(s => `
    <div class="service-row">
      <div>
        <div class="service-name">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-time">${escapeHtml(s.sub)}</div>
      </div>
      <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time)}</span>
    </div>
  `).join('');
}
function renderOtherService() {
  const list = document.getElementById('other-service-list-view');
  if (!list) return;


  const other = serviceList.filter(s => !s.sub || !s.sub.includes('일요일'));
  
  if (other.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text2);">등록된 기타 예배가 없습니다.</div>';
    return;
  }


  list.innerHTML = `
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


function toggleOtherServiceBody() {
  const body = document.getElementById('other-service-body');
  const arrow = document.getElementById('other-service-arrow');
  if (!body || !arrow) return;


  const isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  arrow.textContent = isOpen ? '▶' : '▼';
  arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
}


let serviceEditData = [];
let scheduleEditData = [];
let sundayEditData = [];
let otherEditData = [];
 
// 예배 안내 수정 모드 토글
function toggleSundayEdit() {
  if (document.getElementById('sunday-service-edit').style.display === 'block') {
    cancelSundayEdit();
    return;
  }
    document.getElementById('sunday-service-view').style.display = 'none';
  document.getElementById('sunday-service-edit').style.display = 'block';
  renderSundayEditList();
}


function renderSundayEditList() {
  const el = document.getElementById('sunday-service-list-edit');
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
  // 그룹='주일예배'를 자동으로 설정하는 약식 추가 (필요시 모달 대체)
  const name = prompt('예배 이름', '');
  if (!name) return;
  sundayEditData.push({ emoji: '✨', name, sub: '매주 일요일', time: '오전 11:00' });
  renderSundayEditList();
}


function saveSundayEdit() {
  // 기존 기타예배 + 편집된 주일예배 합치기
  const other = serviceList.filter(s => !s.sub || !s.sub.includes('일요일'));
  serviceList = [...sundayEditData, ...other];
  LS.save('serviceList', serviceList);
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
  document.getElementById('other-service-view').style.display = 'none';
  document.getElementById('other-service-edit').style.display = 'block';
  renderOtherEditList();
}


function renderOtherEditList() {
  const el = document.getElementById('other-service-list-edit');
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
  LS.save('serviceList', serviceList);
  cancelOtherEdit();
  renderServiceView();
  showToast('✅ 기타 예배가 저장되었습니다');
}


function cancelOtherEdit() {
  document.getElementById('other-service-view').style.display = 'block';
  document.getElementById('other-service-edit').style.display = 'none';
}


// 예배 시간표 (안내 탭)
function renderScheduleView() {
  const el = document.getElementById('schedule-list-view');
  if (!el) return;
  if (!window.FB_READY) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">시간표를 불러올 수 없습니다.</div>';
    return;
  }
  firebase.database().ref('scheduleList').once('value')
    .then(snap => {
      const raw = snap.val();
      scheduleList = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : [];
      if (!scheduleList.length) {
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
    })
    .catch(() => {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">시간표를 불러올 수 없습니다.</div>';
    });
}




function toggleScheduleEdit() {
  const isEdit = document.getElementById('schedule-edit').style.display !== 'none';
  if (isEdit) {
    cancelScheduleEdit();
    return;
  }
  scheduleEditData = JSON.parse(JSON.stringify(scheduleList));
  document.getElementById('schedule-view').style.display = 'none';
  document.getElementById('schedule-edit').style.display = 'block';
  document.getElementById('schedule-edit-btn').textContent = '✕ 취소';
  renderScheduleEditList();
}


// ==================== 예배 수정 관련 추가 함수 ====================
function deleteScheduleRow(i) {
  scheduleEditData.splice(i, 1);
  renderScheduleEditList();
}


function deleteServiceRow(i) {
  serviceEditData.splice(i, 1);
  renderServiceEditList();
}


function renderServiceEditList() {
  const el = document.getElementById('service-list-edit');
  if (!el) return;
  el.innerHTML = serviceEditData.map((s, i) => `
    <div class="service-edit-row">
      <div class="service-edit-name">
        <div>${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-edit-sub">${escapeHtml(s.sub)}</div>
      </div>
      <input class="service-time-input" value="${s.time}" onchange="serviceEditData[${i}].time=this.value">
      <button class="service-del-btn" onclick="deleteServiceRow(${i})">삭제</button>
    </div>
  `).join('');
}


function addScheduleRow() {
  document.getElementById('new-sch-emoji').value = '✨';
  document.getElementById('new-sch-name').value = '';
  document.getElementById('new-sch-sub').value = '';
  document.getElementById('new-sch-time').value = '';
  document.getElementById('modal-add-schedule').style.display = 'flex';
}


function confirmAddSchedule() {
  const emoji = document.getElementById('new-sch-emoji').value.trim() || '✨';
  const name = document.getElementById('new-sch-name').value.trim();
  const sub = document.getElementById('new-sch-sub').value.trim();
  const time = document.getElementById('new-sch-time').value.trim();
  if (!name || !time) { showToast('이름과 시간을 입력하세요'); return; }
  scheduleEditData.push({ emoji, name, sub, time });
  closeModal('modal-add-schedule');
  renderScheduleEditList();
}


function saveScheduleEdit() {
  scheduleList = JSON.parse(JSON.stringify(scheduleEditData));
  firebase.database().ref('scheduleList').set(scheduleList)
  .then(() => showToast('✅ 예배 시간표가 저장되었습니다'))
  .catch(err => { console.error('시간표 저장 실패:', err); alert('저장 오류'); });
  document.getElementById('schedule-view').style.display = 'block';
  document.getElementById('schedule-edit').style.display = 'none';
  document.getElementById('schedule-edit-btn').textContent = '✏️ 수정';
  renderScheduleView();
  showToast('✅ 예배 시간표가 저장되었습니다');
}


function cancelScheduleEdit() {
  document.getElementById('schedule-view').style.display = 'block';
  document.getElementById('schedule-edit').style.display = 'none';
  document.getElementById('schedule-edit-btn').textContent = '✏️ 수정';
}
// 홈 화면 예배 안내 렌더링
function renderHomeService() {
  const container = document.getElementById('service-list-view');
  if (!container) return;
  
  // Firebase 또는 localStorage에서 데이터 로드
  if (window.FB_READY) {
    firebase.database().ref('serviceList').once('value', snap => {
      const raw = snap.val();
      const data = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : DEFAULT_SERVICE_LIST;
      renderServiceList(container, data);
    });
  } else {
    const data = LS.load('serviceList', DEFAULT_SERVICE_LIST);
    renderServiceList(container, data);
  }
}


function renderServiceList(container, serviceList) {
  if (!serviceList || serviceList.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">등록된 예배가 없습니다.</div>';
    return;
  }
  container.innerHTML = serviceList.map(s => `
    <div class="service-row">
      <div>
        <div class="service-name">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-time">${escapeHtml(s.sub)}</div>
      </div>
      <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time)}</span>
    </div>
  `).join('');
}