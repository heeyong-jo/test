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


// serviceList 초기화 (전역 변수 사용)
if (typeof LS !== 'undefined') {
  if (typeof window.serviceList !== 'undefined') {
    window.serviceList = LS.load('serviceList', DEFAULT_SERVICE_LIST);
  }
  if (typeof window.prayers !== 'undefined') {
    window.prayers = LS.load('prayers', []);
  }
}


function renderServiceView() {
  renderSundayService();
  renderOtherService();
}


function renderSundayService() {
  const list = document.getElementById('sunday-service-list-view');
  if (!list) return;


  // serviceList가 없으면 기본값 사용
  let dataToRender = serviceList;
  if (!dataToRender || dataToRender.length === 0) {
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
  const other = serviceList.filter(s => !s.sub || !s.sub.includes('일요일'));
  serviceList = [...sundayEditData, ...other];
  
  // 🔥 Firebase에 직접 저장하고 완료 후 UI 갱신
  if (window.FB_READY && window.FB) {
    firebase.database().ref('serviceList').set(serviceList)
      .then(() => {
        LS.save('serviceList', serviceList);
        cancelSundayEdit();
        renderServiceView();
        showToast('✅ 주일 예배가 저장되었습니다');
      })
      .catch(err => {
        console.error('저장 실패:', err);
        showToast('❌ 저장 실패. 다시 시도해주세요.');
      });
  } else {
    LS.save('serviceList', serviceList);
    cancelSundayEdit();
    renderServiceView();
    showToast('✅ 주일 예배가 저장되었습니다');
  }
}


function saveOtherEdit() {
  const sunday = serviceList.filter(s => s.sub && s.sub.includes('일요일'));
  serviceList = [...sunday, ...otherEditData];
  
  // 🔥 Firebase에 직접 저장하고 완료 후 UI 갱신
  if (window.FB_READY && window.FB) {
    firebase.database().ref('serviceList').set(serviceList)
      .then(() => {
        LS.save('serviceList', serviceList);
        cancelOtherEdit();
        renderServiceView();
        showToast('✅ 기타 예배가 저장되었습니다');
      })
      .catch(err => {
        console.error('저장 실패:', err);
        showToast('❌ 저장 실패. 다시 시도해주세요.');
      });
  } else {
    LS.save('serviceList', serviceList);
    cancelOtherEdit();
    renderServiceView();
    showToast('✅ 기타 예배가 저장되었습니다');
  }
}


function cancelOtherEdit() {
  document.getElementById('other-service-view').style.display = 'block';
  document.getElementById('other-service-edit').style.display = 'none';
}


// 예배 시간표 (안내 탭)
function renderScheduleView() {
  const el = document.getElementById('schedule-list-view');
  if (!el) return;
  
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">시간표를 불러올 수 없습니다.</div>';
    return;
  }
  
  firebase.database().ref('scheduleList').once('value')
    .then(snap => {
      const raw = snap.val();
      const data = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : [];
      if (typeof scheduleList !== 'undefined') {
        scheduleList = data.length > 0 ? data : [];
      }
      if (data.length === 0) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">등록된 시간표가 없습니다.</div>';
        return;
      }
      el.innerHTML = data.map(s => `
        <div class="service-row">
          <div>
            <div class="service-name">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
            <div class="service-time">${escapeHtml(s.sub)}</div>
          </div>
          <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time)}</span>
        </div>
      `).join('');
    })
    .catch(err => {
      console.error('scheduleList 로드 실패:', err);
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2);">시간표를 불러올 수 없습니다.</div>';
    });
}


function toggleScheduleEdit() {
  const isEdit = document.getElementById('schedule-edit').style.display !== 'none';
  if (isEdit) {
    cancelScheduleEdit();
    return;
  }
  if (typeof scheduleEditData === 'undefined') var scheduleEditData = [];
  scheduleEditData = JSON.parse(JSON.stringify(scheduleList || []));
  document.getElementById('schedule-view').style.display = 'none';
  document.getElementById('schedule-edit').style.display = 'block';
  const btn = document.getElementById('schedule-edit-btn');
  if (btn) btn.textContent = '✕ 취소';
  renderScheduleEditList();
}


function renderScheduleEditList() {
  const el = document.getElementById('schedule-list-edit');
  if (!el) return;
  if (typeof scheduleEditData === 'undefined') return;
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
  if (typeof scheduleEditData !== 'undefined') {
    scheduleEditData.splice(i, 1);
    renderScheduleEditList();
  }
}


function addScheduleRow() {
  const emojiInput = document.getElementById('new-sch-emoji');
  const nameInput = document.getElementById('new-sch-name');
  const subInput = document.getElementById('new-sch-sub');
  const timeInput = document.getElementById('new-sch-time');
  if (emojiInput) emojiInput.value = '✨';
  if (nameInput) nameInput.value = '';
  if (subInput) subInput.value = '';
  if (timeInput) timeInput.value = '';
  const modal = document.getElementById('modal-add-schedule');
  if (modal) modal.style.display = 'flex';
}


function confirmAddSchedule() {
  const emoji = document.getElementById('new-sch-emoji')?.value.trim() || '✨';
  const name = document.getElementById('new-sch-name')?.value.trim();
  const sub = document.getElementById('new-sch-sub')?.value.trim();
  const time = document.getElementById('new-sch-time')?.value.trim();
  if (!name || !time) { showToast('이름과 시간을 입력하세요'); return; }
  if (typeof scheduleEditData === 'undefined') var scheduleEditData = [];
  scheduleEditData.push({ emoji, name, sub, time });
  closeModal('modal-add-schedule');
  renderScheduleEditList();
}


function saveScheduleEdit() {
  if (typeof scheduleList !== 'undefined') {
    scheduleList = JSON.parse(JSON.stringify(scheduleEditData || []));
  }
  if (typeof firebase !== 'undefined' && firebase.apps.length) {
    firebase.database().ref('scheduleList').set(scheduleList || [])
      .then(() => console.log('scheduleList 저장 성공'))
      .catch(err => { console.error('시간표 저장 실패:', err); showToast('저장 오류'); });
  }
  try {
    localStorage.setItem('ch2_scheduleList', JSON.stringify(scheduleList || []));
  } catch(e) {}
  if (typeof LS !== 'undefined') {
    LS.save('scheduleList', scheduleList || []);
  }
  document.getElementById('schedule-view').style.display = 'block';
  document.getElementById('schedule-edit').style.display = 'none';
  const btn = document.getElementById('schedule-edit-btn');
  if (btn) btn.textContent = '✏️ 수정';
  renderScheduleView();
  showToast('✅ 예배 시간표가 저장되었습니다');
}


function cancelScheduleEdit() {
  document.getElementById('schedule-view').style.display = 'block';
  document.getElementById('schedule-edit').style.display = 'none';
  const btn = document.getElementById('schedule-edit-btn');
  if (btn) btn.textContent = '✏️ 수정';
}