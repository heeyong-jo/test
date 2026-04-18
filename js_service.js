// ==================== 예배 안내 및 시간표 ====================


// 예배 안내 목록 렌더링 (홈)
function renderServiceView() {
  const el = document.getElementById('service-list-view');
  if (!el) return;
  el.innerHTML = serviceList.map(s => `
    <div class="service-row">
      <div>
        <div class="service-name">${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-time">${escapeHtml(s.sub)}</div>
      </div>
      <span style="font-weight:700;color:var(--purple);">${escapeHtml(s.time)}</span>
    </div>
  `).join('');
}


// 예배 안내 수정 모드 토글
function toggleServiceEdit() {
  const isEdit = document.getElementById('service-edit').style.display !== 'none';
  if (isEdit) {
    cancelServiceEdit();
    return;
  }
  serviceEditData = JSON.parse(JSON.stringify(serviceList));
  document.getElementById('service-view').style.display = 'none';
  document.getElementById('service-edit').style.display = 'block';
  document.getElementById('service-edit-btn').textContent = '✕ 취소';
  renderServiceEditList();
}


// 예배 안내 수정 목록 렌더링
function renderServiceEditList() {
  const el = document.getElementById('service-list-edit');
  if (!el) return;
  el.innerHTML = serviceEditData.map((s, i) => `
    <div class="service-edit-row">
      <div class="service-edit-name">
        <div>${escapeHtml(s.emoji)} ${escapeHtml(s.name)}</div>
        <div class="service-edit-sub">${escapeHtml(s.sub)}</div>
      </div>
      <input class="service-time-input" value="${s.time}" onchange="serviceEditData[${i}].time=this.value" placeholder="00:00">
      <button class="service-del-btn" onclick="deleteServiceRow(${i})">삭제</button>
    </div>
  `).join('');
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
  LS.save('serviceList', serviceList);
  document.getElementById('service-view').style.display = 'block';
  document.getElementById('service-edit').style.display = 'none';
  document.getElementById('service-edit-btn').textContent = '✏️ 수정';
  renderServiceView();
  showToast('✅ 예배 안내가 저장되었습니다');
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
  LS.save('scheduleList', scheduleList);
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