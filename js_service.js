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


// ==================== 예배 안내 관리 ====================


let serviceList = [];
let scheduleList = [];


// 예배 안내 데이터 로드 및 렌더링
function initServiceData() {
  console.log('initServiceData 실행');
  
  // localStorage에서 먼저 로드
  try {
    const saved = localStorage.getItem('ch2_serviceList');
    if (saved) {
      serviceList = JSON.parse(saved);
      console.log('localStorage에서 serviceList 로드:', serviceList.length);
    }
  } catch(e) {}
  
  // Firebase에서 로드 (Firebase가 준비되면)
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('serviceList').once('value')
      .then(snap => {
        const data = snap.val();
        if (data) {
          serviceList = Array.isArray(data) ? data : Object.values(data);
          console.log('Firebase에서 serviceList 로드:', serviceList.length);
          renderServiceView();
        }
      })
      .catch(err => console.error('serviceList 로드 실패:', err));
  }
  
  renderServiceView();
}


// 예배 안내 렌더링
function renderServiceView() {
  console.log('renderServiceView 실행');
  
  const container = document.getElementById('service-list');
  if (!container) {
    console.warn('service-list 요소 없음');
    return;
  }
  
  if (!serviceList || serviceList.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">예배 정보를 불러오는 중...</div>';
    return;
  }
  
  let html = '';
  serviceList.forEach(item => {
    html += `
      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <span style="font-size:24px;">${item.emoji || '⛪'}</span>
          <div style="flex:1;">
            <div style="font-size:14px;font-weight:700;color:var(--text);">${item.name || '예배'}</div>
            <div style="font-size:12px;color:var(--text2);">${item.sub || ''}</div>
          </div>
        </div>
        <div style="padding:8px;background:var(--bg2);border-radius:8px;font-size:13px;color:var(--purple);font-weight:600;text-align:center;">
          ${item.time || '시간 미지정'}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}


// 예배 시간표 불러오기
function renderScheduleView() {
  console.log('renderScheduleView 실행');
  
  const el = document.getElementById('schedule-list-view');
  if (!el) return;
  
  if (!scheduleList || scheduleList.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">시간표를 불러오는 중...</div>';
    return;
  }
  
  let html = '';
  scheduleList.forEach(item => {
    html += `
      <div style="padding:12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">
        <span style="font-size:20px;">${item.emoji || '⛪'}</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--text);">${item.name || '예배'}</div>
          <div style="font-size:12px;color:var(--text2);">${item.sub || ''}</div>
        </div>
        <div style="font-size:13px;font-weight:600;color:var(--purple);">${item.time || ''}</div>
      </div>
    `;
  });
  
  el.innerHTML = html;
}


// 예배 안내 수정 시작
function openServiceEdit() {
  console.log('openServiceEdit 실행');
  
  const viewDiv = document.getElementById('service-view');
  const editDiv = document.getElementById('service-edit');
  
  if (viewDiv) viewDiv.style.display = 'none';
  if (editDiv) editDiv.style.display = 'block';
}


// 예배 안내 저장 (Firebase + localStorage)
function saveServiceEdit() {
  console.log('saveServiceEdit 실행');
  
  // Firebase 준비 여부 확인
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('serviceList').set(serviceList)
      .then(() => console.log('serviceList Firebase 저장 성공'))
      .catch(err => console.error('serviceList Firebase 저장 실패:', err));
  }
  
  // localStorage에도 저장
  try {
    localStorage.setItem('ch2_serviceList', JSON.stringify(serviceList));
  } catch(e) {}
  
  const viewDiv = document.getElementById('service-view');
  const editDiv = document.getElementById('service-edit');
  
  if (viewDiv) viewDiv.style.display = 'block';
  if (editDiv) editDiv.style.display = 'none';
  
  renderServiceView();
  
  if (typeof showToast === 'function') {
    showToast('✅ 예배 안내가 저장되었습니다');
  }
}


// 예배 시간표 저장
function saveScheduleEdit() {
  console.log('saveScheduleEdit 실행');
  
  // Firebase 준비 여부 확인
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('scheduleList').set(scheduleList)
      .then(() => console.log('scheduleList Firebase 저장 성공'))
      .catch(err => console.error('scheduleList Firebase 저장 실패:', err));
  }
  
  // localStorage에도 저장
  try {
    localStorage.setItem('ch2_scheduleList', JSON.stringify(scheduleList));
  } catch(e) {}
  
  const viewDiv = document.getElementById('schedule-view');
  const editDiv = document.getElementById('schedule-edit');
  
  if (viewDiv) viewDiv.style.display = 'block';
  if (editDiv) editDiv.style.display = 'none';
  
  renderScheduleView();
  
  if (typeof showToast === 'function') {
    showToast('✅ 예배 시간표가 저장되었습니다');
  }
}


console.log('✅ js_service.js 로드 완료');