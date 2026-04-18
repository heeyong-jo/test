// ==================== 헌금 관리 ====================


// 숫자 포맷팅 (천 단위 콤마)
const fmt = n => Number(n).toLocaleString();


// 헌금 입력 모달 열기
function openAddOffering() {
  document.getElementById('of-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('of-name').value = '';
  document.getElementById('of-amount').value = '';
  document.getElementById('modal-offering').style.display = 'flex';
}


// 헌금 저장
function saveOffering() {
  const name = document.getElementById('of-name').value.trim();
  const amt = Number(document.getElementById('of-amount').value);
  if (!name || !amt) {
    showToast('이름과 금액을 입력하세요');
    return;
  }
  offerings.push({
    id: Date.now(),
    name: name,
    type: document.getElementById('of-type').value,
    amount: amt,
    date: document.getElementById('of-date').value
  });
  LS.save('offerings', offerings);
  closeModal('modal-offering');
  renderOfferingsAccord();
  showToast('✅ 저장되었습니다');
}


// 헌금 삭제
function deleteOffering(id) {
  if (!confirm('삭제하시겠습니까?')) return;
  offerings = offerings.filter(o => o.id !== id);
  LS.save('offerings', offerings);
  renderOfferingsAccord();
  showToast('🗑 삭제되었습니다');
}


// 헌금 내역 렌더링 (아코디언)
function renderOfferingsAccord() {
  const ym = new Date().toISOString().slice(0, 7); // 현재 년-월
  const tm = offerings.filter(o => (o.date || '').startsWith(ym));
  const sunday = tm.filter(o => o.type === '주일헌금').reduce((s, o) => s + Number(o.amount), 0);
  const tithe = tm.filter(o => o.type === '십일조').reduce((s, o) => s + Number(o.amount), 0);
  const thanks = tm.filter(o => o.type === '감사헌금').reduce((s, o) => s + Number(o.amount), 0);
  const total = tm.reduce((s, o) => s + Number(o.amount), 0);
  
  document.getElementById('ao-sunday') && (document.getElementById('ao-sunday').textContent = fmt(sunday));
  document.getElementById('ao-tithe') && (document.getElementById('ao-tithe').textContent = fmt(tithe));
  document.getElementById('ao-thanks') && (document.getElementById('ao-thanks').textContent = fmt(thanks));
  document.getElementById('ao-total') && (document.getElementById('ao-total').textContent = fmt(total));
  document.getElementById('ac-offering-sub') && (document.getElementById('ac-offering-sub').textContent = '이달 합계 ' + fmt(total) + '원');
  
  const el = document.getElementById('accord-offering-list');
  if (!el) return;
  if (!offerings.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text2);padding:16px;">헌금 내역이 없습니다</div>';
    return;
  }
  el.innerHTML = [...offerings].reverse().map(o => `
    <div class="offering-row">
      <div>
        <div class="offering-label">${escapeHtml(o.name)} · ${escapeHtml(o.type)}</div>
        <div style="font-size:11px;color:var(--text2);">${o.date}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="offering-amount">${fmt(o.amount)}원</div>
        <button onclick="deleteOffering(${o.id})" style="background:#fef2f2;border:none;border-radius:8px;color:#b91c1c;font-size:10px;padding:3px 8px;">삭제</button>
      </div>
    </div>
  `).join('');
}