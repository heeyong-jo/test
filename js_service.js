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


// 기본 시간표 데이터 (scheduleList가 없을 때 표시)
const DEFAULT_SCHEDULE_LIST = [
  { emoji: '⛪', name: '주일 낮예배 1부', sub: '매주 일요일', time: '오전 8:00' },
  { emoji: '⛪', name: '주일 낮예배 2부', sub: '매주 일요일', time: '오전 9:30' },
  { emoji: '⛪', name: '주일 낮예배 3부', sub: '매주 일요일', time: '오전 11:30' },
  { emoji: '🌅', name: '새벽기도회', sub: '월-금', time: '새벽 5:00' },
  { emoji: '🙏', name: '수요기도회', sub: '매주 수요일', time: '오전 10:30 / 저녁 7:00' },
  { emoji: '🔥', name: '금요성령집회', sub: '매주 금요일', time: '저녁 8:30' }
];


// 전역 변수 선언 (중복 선언 방지를 위해 window 객체 사용)
if (typeof window.serviceList === 'undefined') {
  window.serviceList = [];
}
if (typeof window.scheduleList === 'undefined') {
  window.scheduleList = [];
}
if (typeof window.prayers === 'undefined') {
  window.prayers = [];
}


// 로컬 참조용 (편의)
let serviceList = window.serviceList;
let scheduleList = window.scheduleList;
let prayers = window.prayers;


// 초기화 함수
function initServiceData() {
  console.log('initServiceData 실행');
  
  if (typeof LS === 'undefined') {
    // LS가 없으면 localStorage 직접 사용
    try {
      const saved = localStorage.getItem('ch2_serviceList');
      if (saved) {
        serviceList = JSON.parse(saved);
        console.log('localStorage에서 serviceList 로드됨:', serviceList.length);
      } else {
        serviceList = JSON.parse(JSON.stringify(DEFAULT_SERVICE_LIST));
        localStorage.setItem('ch2_serviceList', JSON.stringify(serviceList));
        console.log('serviceList 기본값 설정됨');
      }
      
      const savedSchedule = localStorage.getItem('ch2_scheduleList');
      if (savedSchedule) {
        scheduleList = JSON.parse(savedSchedule);
        console.log('localStorage에서 scheduleList 로드됨:', scheduleList.length);
      }
    } catch(e) {
      serviceList = JSON.parse(JSON.stringify(DEFAULT_SERVICE_LIST));
      console.log('serviceList 기본값 설정(예외)');
    }
    renderServiceView();
    renderScheduleView();
    return;
  }
  
  serviceList = LS.load('serviceList', DEFAULT_SERVICE_LIST);
  prayers = LS.load('prayers', []);
  scheduleList = LS.load('scheduleList', []);  // scheduleList 로드
  console.log('serviceList 로드 완료:', serviceList.length);
  console.log('scheduleList 로드 완료:', scheduleList.length);
  
  // Firebase에서 최신 데이터 가져오기
  if (window.FB_READY && typeof firebase !== 'undefined') {
    // serviceList Firebase 로드
    firebase.database().ref('serviceList').once('value')
      .then(snap => {
        const data = snap.val();
        if (data) {
          const fbData = Array.isArray(data) ? data : Object.values(data);
          if (fbData.length > 0) {
            serviceList = fbData;
            LS.save('serviceList', serviceList);
            console.log('Firebase에서 serviceList 로드됨:', serviceList.length);
            renderServiceView();
          }
        }
      })
      .catch(err => console.error('Firebase serviceList 로드 실패:', err));
    
    // scheduleList Firebase 로드
    firebase.database().ref('scheduleList').once('value')
      .then(snap => {
        const data = snap.val();
        if (data) {
          const fbData = Array.isArray(data) ? data : Object.values(data);
          if (fbData.length > 0) {
            scheduleList = fbData;
            LS.save('scheduleList', scheduleList);
            console.log('Firebase에서 scheduleList 로드됨:', scheduleList.length);
            renderScheduleView();
          }
        }
      })
      .catch(err => console.error('Firebase scheduleList 로드 실패:', err));
  }
  
  renderServiceView();
  renderScheduleView();
}


// 예배 안내 렌더링
function renderServiceView() {
  console.log('renderServiceView 호출됨');
  renderSundayService();
  renderOtherService();
}




// 주일 예배 렌더링
function renderSundayService() {
  const list = document.getElementById('sunday-service-list-view');
  if (!list) return;




  let dataToRender = serviceList;
  if (!dataToRender || dataToRender.length === 0) {
    console.log('serviceList가 비어있음, 기본값 사용');
    dataToRender = DEFAULT_SERVICE_LIST;
  }




  const sunday = dataToRender.filter(s => s.sub && s.sub.includes('일요일'));
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




// 기타 예배 렌더링
function renderOtherService() {
  const list = document.getElementById('other-service-list-view');
  if (!list) return;




  let dataToRender = serviceList;
  if (!dataToRender || dataToRender.length === 0) {
    dataToRender = DEFAULT_SERVICE_LIST;
  }




  const other = dataToRender.filter(s => !s.sub || !s.sub.includes('일요일'));
  
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
  console.log('saveSundayEdit 실행', sundayEditData);
  
  const other = serviceList.filter(s => !s.sub || !s.sub.includes('일요일'));
  const newServiceList = [...sundayEditData, ...other];
  serviceList = newServiceList;
  
  if (typeof LS !== 'undefined') {
    LS.save('serviceList', serviceList);
  }
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('serviceList').set(serviceList)
      .catch(err => console.error('Firebase 저장 실패:', err));
  }
  
  cancelSundayEdit();
  renderServiceView();
  showToast('✅ 주일 예배가 저장되었습니다');
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
  console.log('saveOtherEdit 실행', otherEditData);
  
  const sunday = serviceList.filter(s => s.sub && s.sub.includes('일요일'));
  const newServiceList = [...sunday, ...otherEditData];
  serviceList = newServiceList;
  
  if (typeof LS !== 'undefined') {
    LS.save('serviceList', serviceList);
  }
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('serviceList').set(serviceList)
      .catch(err => console.error('Firebase 저장 실패:', err));
  }
  
  cancelOtherEdit();
  renderServiceView();
  showToast('✅ 기타 예배가 저장되었습니다');
}




// ==================== 예배 시간표 (수정된 버전) ====================
function renderScheduleView() {
  console.log('renderScheduleView 호출됨');
  
  const el = document.getElementById('schedule-list-view');
  if (!el) {
    console.log('schedule-list-view 요소 없음');
    return;
  }
  
  // scheduleList가 비어있으면 기본 데이터 사용
  let dataToRender = scheduleList;
  
  if (!dataToRender || dataToRender.length === 0) {
    // localStorage에서 먼저 확인
    try {
      const saved = localStorage.getItem('ch2_scheduleList');
      if (saved) {
        dataToRender = JSON.parse(saved);
        scheduleList = dataToRender;
        console.log('localStorage에서 scheduleList 로드됨:', dataToRender.length);
      }
    } catch(e) {}
  }
  
  // Firebase에서 데이터 가져오기 (최신 데이터 우선)
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('scheduleList').once('value')
      .then(snap => {
        const raw = snap.val();
        if (raw) {
          const fbData = Array.isArray(raw) ? raw : Object.values(raw);
          if (fbData.length > 0) {
            scheduleList = fbData;
            dataToRender = scheduleList;
            // localStorage에도 저장
            try {
              localStorage.setItem('ch2_scheduleList', JSON.stringify(scheduleList));
            } catch(e) {}
            if (typeof LS !== 'undefined') {
              LS.save('scheduleList', scheduleList);
            }
            console.log('Firebase에서 scheduleList 로드됨:', scheduleList.length);
          }
        }
        renderScheduleList(el, dataToRender);
      })
      .catch(err => {
        console.error('scheduleList Firebase 로드 실패:', err);
        renderScheduleList(el, dataToRender);
      });
  } else {
    renderScheduleList(el, dataToRender);
  }
}


// scheduleList 렌더링 헬퍼 함수
function renderScheduleList(container, list) {
  if (!container) return;
  
  let dataToRender = list;
  if (!dataToRender || dataToRender.length === 0) {
    console.log('scheduleList가 비어있음, 기본 시간표 사용');
    dataToRender = DEFAULT_SCHEDULE_LIST;
  }
  
  container.innerHTML = dataToRender.map(s => `
    <div class="service-row">
      <div>
        <div class="service-name">${escapeHtml(s.emoji || '⛪')} ${escapeHtml(s.name || '예배')}</div>
        <div class="service-time">${escapeHtml(s.sub || '')}</div>
      </div>
      <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time || '')}</span>
    </div>
  `).join('');
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
      <input class="service-time-input" value="${s.time}" onchange="scheduleEditData[${i}].time=this.value">
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
  
  // Firebase 준비 상태 확인 후 저장
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('scheduleList').set(scheduleList)
      .then(() => console.log('scheduleList 저장 성공'))
      .catch(err => { console.error('시간표 저장 실패:', err); showToast('저장 오류'); });
  }
  
  // localStorage에도 저장 (항상 저장)
  try {
    localStorage.setItem('ch2_scheduleList', JSON.stringify(scheduleList));
  } catch(e) {}
  if (typeof LS !== 'undefined') {
    LS.save('scheduleList', scheduleList);
  }
  
  document.getElementById('schedule-view').style.display = 'block';
  document.getElementById('schedule-edit').style.display = 'none';
  document.getElementById('schedule-edit-btn').textContent = '✏️ 수정';
  renderScheduleView();
  showToast('✅ 예배 시간표가 저장되었습니다');
}




// ==================== 취소 함수들 ====================
function cancelSundayEdit() {
  const viewEl = document.getElementById('sunday-service-view');
  const editEl = document.getElementById('sunday-service-edit');
  if (viewEl) viewEl.style.display = 'block';
  if (editEl) editEl.style.display = 'none';
}




function cancelOtherEdit() {
  const viewEl = document.getElementById('other-service-view');
  const editEl = document.getElementById('other-service-edit');
  if (viewEl) viewEl.style.display = 'block';
  if (editEl) editEl.style.display = 'none';
}




function cancelScheduleEdit() {
  const viewEl = document.getElementById('schedule-view');
  const editEl = document.getElementById('schedule-edit');
  const btn = document.getElementById('schedule-edit-btn');
  if (viewEl) viewEl.style.display = 'block';
  if (editEl) editEl.style.display = 'none';
  if (btn) btn.textContent = '✏️ 수정';
}




// 홈 화면 예배 안내 렌더링
function renderHomeService() {
  const container = document.getElementById('service-list-view');
  if (!container) return;
  
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