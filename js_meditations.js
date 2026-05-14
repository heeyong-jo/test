// ==================== 말씀 나누기 (묵상) ====================


// 전역 변수
let meditations = [];
let meditationPage = 1;
const MEDITATION_PER_PAGE = 10;


// 묵상 불러오기
async function loadMeditations() {
  try {
    if (window.FB_READY) {
      const snapshot = await firebase.database().ref('meditations').once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        meditations = Object.values(data).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        LS.save('meditations', meditations);
      } else {
        meditations = LS.load('meditations', []);
      }
    } else {
      meditations = LS.load('meditations', []);
    }
    renderMeditations();
  } catch (e) {
    console.error('묵상 로드 실패:', e);
    meditations = LS.load('meditations', []);
    renderMeditations();
  }
}


// 묵상 렌더링
function renderMeditations() {
  const container = document.getElementById('meditation-list');
  if (!container) return;
  
  if (meditations.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">💬 아직 등록된 묵상이 없습니다.<br>첫 번째로 말씀 나누기를 해보세요!</div>';
    return;
  }
  
  const start = (meditationPage - 1) * MEDITATION_PER_PAGE;
  const pageItems = meditations.slice(start, start + MEDITATION_PER_PAGE);
  
  container.innerHTML = pageItems.map(m => `
    <div style="background:var(--bg);border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7a5230,#9e6b3e);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;">
          ${m.author ? m.author.charAt(0) : '🙏'}
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;color:var(--text);">${escapeHtml(m.author || '익명')}</div>
          <div style="font-size:11px;color:var(--text2);">${formatDate(m.createdAt)}</div>
        </div>
        ${currentUser && (currentUser.role === 'admin' || currentUser.name === m.author) ? `
          <button onclick="deleteMeditation('${m.id}')" style="background:none;border:none;font-size:18px;cursor:pointer;color:#b91c1c;">🗑</button>
        ` : ''}
      </div>
      <div style="font-size:14px;color:var(--text);line-height:1.7;white-space:pre-wrap;">${escapeHtml(m.content)}</div>
      ${m.verseRef ? `
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--purple);">
          📖 ${escapeHtml(m.verseRef)}
        </div>
      ` : ''}
    </div>
  `).join('');
  
  // 페이징 버튼
  const totalPages = Math.ceil(meditations.length / MEDITATION_PER_PAGE);
  if (totalPages > 1) {
    let paginationHtml = '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap;">';
    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `<button onclick="goToMeditationPage(${i})" style="padding:6px 12px;border-radius:20px;border:1px solid var(--border);background:${meditationPage === i ? 'var(--purple)' : 'var(--bg2)'};color:${meditationPage === i ? 'white' : 'var(--text)'};cursor:pointer;">${i}</button>`;
    }
    paginationHtml += '</div>';
    container.innerHTML += paginationHtml;
  }
}


// 페이지 이동
function goToMeditationPage(page) {
  meditationPage = page;
  renderMeditations();
}


// 날짜 포맷
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}


// 묵상 등록
async function submitMeditation() {
  const input = document.getElementById('meditation-input');
  const content = input?.value.trim();
  
  if (!content) {
    showToast('말씀 나누기 내용을 입력해주세요');
    return;
  }
  
  if (!currentUser) {
    showToast('로그인이 필요합니다');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  const newMeditation = {
    id: Date.now().toString(),
    content: content,
    author: currentUser.name || currentUser.id || '익명',
    authorId: currentUser.id,
    createdAt: new Date().toISOString(),
    verseRef: document.getElementById('today-verse-ref')?.innerText || ''
  };
  
  try {
    if (window.FB_READY) {
      await firebase.database().ref('meditations').push(newMeditation);
    }
    
    meditations.unshift(newMeditation);
    LS.save('meditations', meditations);
    
    input.value = '';
    meditationPage = 1;
    renderMeditations();
    showToast('✅ 말씀 나누기가 등록되었습니다');
  } catch (e) {
    console.error('묵상 등록 실패:', e);
    showToast('등록에 실패했습니다. 다시 시도해주세요');
  }
}


// 묵상 삭제
async function deleteMeditation(id) {
  if (!confirm('이 묵상을 삭제하시겠습니까?')) return;
  
  try {
    if (window.FB_READY) {
      const snapshot = await firebase.database().ref('meditations').once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        const key = Object.keys(data).find(k => data[k].id === id);
        if (key) {
          await firebase.database().ref(`meditations/${key}`).remove();
        }
      }
    }
    
    meditations = meditations.filter(m => m.id !== id);
    LS.save('meditations', meditations);
    renderMeditations();
    showToast('✅ 삭제되었습니다');
  } catch (e) {
    console.error('삭제 실패:', e);
    showToast('삭제에 실패했습니다');
  }
}


// 실시간 묵상 구독 (Firebase)
function subscribeMeditations() {
  if (!window.FB_READY) return;
  
  firebase.database().ref('meditations').on('value', (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      meditations = Object.values(data).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      LS.save('meditations', meditations);
      renderMeditations();
    }
  });
}