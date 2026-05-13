// ==================== 예배 안내 및 시간표 ====================
// 주일예배 & 기타예배 편집용 임시 데이터
let sundayEditData = [];
let otherEditData = [];


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


// js_service.js 상단 (수정 전 → 수정 후)


serviceList = LS.load('serviceList', DEFAULT_SERVICE_LIST);
prayers = LS.load('prayers', []);




function renderServiceView() {
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


    if (other.length > 0) {
      html += `<div style="font-weight:800; font-size:14px; color:var(--text); margin: 16px 0 8px; display:flex; align-items:center; gap:6px;">
        <span>📅</span> 기타 예배 안내
      </div>`;
      html += other.map(s => `
        <div class="service-row">
          <div>
            <div class="service-name">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
            <div class="service-time">${escapeHtml(s.sub)}</div>
          </div>
          <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time)}</span>
        </div>
      `).join('');
    }


    list.innerHTML = html;
  };


  // Firebase 연동 (기존 코드 유지)
  if (!window.FB_READY || typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    render(DEFAULT_SERVICE_LIST);
    return;
  }


  try {
    firebase.database().ref('serviceList').once('value', snap => {
      const raw = snap.val();
      const data = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : [];
      render(data);
    }, () => render(DEFAULT_SERVICE_LIST));
  } catch (e) {
    console.error('serviceList load error', e);
    render(DEFAULT_SERVICE_LIST);
  }
}


 
// 예배 안내 수정 모드 토글
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
  otherEditData = JSON.parse(JSON.stringify(serviceList.filter(s => !s.sub || !s.sub.includes('일요일'))));
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


function deleteServiceRow(i) {
  serviceEditData.splice(i, 1);
  renderServiceEditList();
}


function addServiceRow() {
  document.getElementById('new-svc-emoji').value = '✨';
  document.getElementById('new-svc-name').value = '';
  document.getElementById('new-svc-sub').value = '';
  document.getElementById('new-svc-time').value = '';
  document.getElementById('modal-add-service').style.display = 'flex';
}


function confirmAddService() {
  const emoji = document.getElementById('new-svc-emoji').value.trim() || '✨';
  const name = document.getElementById('new-svc-name').value.trim();
  const sub = document.getElementById('new-svc-sub').value.trim();
  const time = document.getElementById('new-svc-time').value.trim();
  if (!name || !time) { showToast('이름과 시간을 입력하세요'); return; }
  serviceEditData.push({ emoji, name, sub, time });
  closeModal('modal-add-service');
  renderServiceEditList();
}


function saveServiceEdit() {
  serviceList = JSON.parse(JSON.stringify(serviceEditData));
  
  // ★ Firebase에 저장 (기존 LS.save 대신)
  firebase.database().ref('serviceList').set(serviceList)
    .then(() => {
      document.getElementById('service-view').style.display = 'block';
      document.getElementById('service-edit').style.display = 'none';
      document.getElementById('service-edit-btn').textContent = '✏️ 수정';
      renderServiceView();
      showToast('✅ 예배 안내가 저장되었습니다');
    })
    .catch(err => {
      console.error('예배 저장 실패:', err);
      alert('저장 중 오류가 발생했습니다.');
    });
}


function cancelServiceEdit() {
  document.getElementById('service-view').style.display = 'block';
  document.getElementById('service-edit').style.display = 'none';
  document.getElementById('service-edit-btn').textContent = '✏️ 수정';
}


// 예배 시간표 (안내 탭)
function renderScheduleView() {
  const el = document.getElementById('schedule-list-view');
  if (!el) return;
  firebase.database().ref('scheduleList').once('value', snap => {
    const raw = snap.val();
    const data = raw
      ? (Array.isArray(raw) ? raw : Object.values(raw))
      : [];
    scheduleList = data.length > 0 ? data : [];
    if (scheduleList.length === 0) {
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
    }).catch(() => {
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


function renderScheduleEditList() {
  const el = document.getElementById('schedule-list-edit');
  if (!el) return;
  el.innerHTML = scheduleEditData.map((s, i) => `
    <div class="service-edit-row">
      <div class="service-edit-name">
        <div>${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-edit-sub">${escapeHtml(s.sub)}</div>
      </div>
      <input class="service-time-input" value="${s.time}" onchange="scheduleEditData[${i}].time=this.value" placeholder="00:00">
      <button class="service-del-btn" onclick="deleteScheduleRow(${i})">삭제</button>
    </div>
  `).join('');
}


function deleteScheduleRow(i) {
  scheduleEditData.splice(i, 1);
  renderScheduleEditList();
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