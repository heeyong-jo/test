// ==================== 말씀 묵상 & 오늘의 말씀 (초간단 버전) ====================


// 오늘의 말씀 렌더링
function renderTodayVerse() {
  let todayVerse = null;
  if (typeof LS !== 'undefined') todayVerse = LS.load('todayVerse', null);
  if (!todayVerse) {
    todayVerse = { text: '"하나님은 사랑이시라"', ref: '요한일서 4:16', body: '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라' };
  }
  const el_text = document.getElementById('today-verse-text');
  const el_ref = document.getElementById('today-verse-ref');
  const el_body = document.getElementById('today-verse-body');
  if (el_text) el_text.textContent = todayVerse.text;
  if (el_ref) el_ref.textContent = todayVerse.ref;
  if (el_body) el_body.textContent = todayVerse.body || todayVerse.text;
}


// 말씀 공유
function shareToday() {
  const tv = LS.load('todayVerse', null) || { text: '"하나님은 사랑이시라"', ref: '요한일서 4:16' };
  const shareText = `${tv.text} - ${tv.ref}`;
  if (navigator.share) navigator.share({ title: '오늘의 말씀', text: shareText });
  else navigator.clipboard.writeText(shareText).then(() => alert('복사됨'));
}


// ✅ 말씀 등록 (초간단)
window.openVerseSelector = function() {
  alert('🔧 openVerseSelector 실행됨');
  
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    return;
  }
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    alert('관리자만 가능합니다. 현재 권한: ' + currentUser.role);
    return;
  }
  
  const ref = prompt('말씀 출처 (예: 요한복음 3:16)', '');
  if (!ref) return;
  const text = prompt('말씀 내용', '');
  if (!text) return;
  
  const todayVerseData = { text: `"${text}"`, ref: ref, body: text };
  LS.save('todayVerse', todayVerseData);
  renderTodayVerse();
  alert('✅ 오늘의 말씀이 등록되었습니다!');
};


window.closeVerseSelector = function() { /* 모달 없음 */ };


// 묵상 기능
let meditations = [];
function loadMeditations() { meditations = LS.load('meditations', []); renderMeditations(); }
function renderMeditations() {
  const container = document.getElementById('meditation-list');
  if (!container) return;
  if (!meditations.length) { container.innerHTML = '<div style="text-align:center;padding:40px;">💬 첫 번째 말씀 나누기를 해보세요!</div>'; return; }
  container.innerHTML = meditations.map(m => `<div style="background:var(--bg);border-radius:16px;padding:16px;margin-bottom:12px;"><div><strong>${escapeHtml(m.author)}</strong> <span style="font-size:11px;">${new Date(m.createdAt).toLocaleDateString()}</span></div><div>${escapeHtml(m.text)}</div></div>`).join('');
}
function submitMeditation() {
  const input = document.getElementById('meditation-input');
  const content = input?.value.trim();
  if (!content) { alert('내용을 입력하세요'); return; }
  if (!currentUser) { alert('로그인이 필요합니다'); return; }
  meditations.unshift({ id: Date.now(), author: currentUser.name, text: content, createdAt: new Date().toISOString() });
  LS.save('meditations', meditations);
  input.value = '';
  renderMeditations();
  alert('✅ 등록됨');
}
function deleteMeditation(id) { meditations = meditations.filter(m => m.id !== id); LS.save('meditations', meditations); renderMeditations(); }


loadMeditations();
console.log('✅ 초간단 버전 로드됨');