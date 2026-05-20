// ==================== 말씀 등록 모델 (최종 통합본) ====================


// 모든 기존 함수 제거를 위해 window에 직접 할당
window.openVerseSelector = function() {
  console.log('🔧 openVerseSelector 실행됨');
  
  // 관리자 권한 체크
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    alert('관리자 또는 매니저만 말씀을 등록할 수 있습니다.\n현재 권한: ' + (currentUser.role || '일반성도'));
    return;
  }
  
  const modal = document.getElementById('modal-verse-selector');
  if (!modal) {
    alert('말씀 선택기 모달을 찾을 수 없습니다.');
    return;
  }
  
  // 초기화
  selectedBookInfo = null;
  selectedChapter = 1;
  
  // UI 초기화
  const vstepBook = document.getElementById('vstep-book');
  const vstepChapter = document.getElementById('vstep-chapter');
  const vstepVerse = document.getElementById('vstep-verse');
  
  if (vstepBook) vstepBook.style.display = 'block';
  if (vstepChapter) vstepChapter.style.display = 'none';
  if (vstepVerse) vstepVerse.style.display = 'none';
  
  // 단계 스타일 초기화
  const step1 = document.getElementById('vstep1');
  const step2 = document.getElementById('vstep2');
  const step3 = document.getElementById('vstep3');
  
  if (step1) { step1.style.background = 'var(--purple)'; step1.style.color = 'white'; }
  if (step2) { step2.style.background = 'var(--bg2)'; step2.style.color = 'var(--text2)'; }
  if (step3) { step3.style.background = 'var(--bg2)'; step3.style.color = 'var(--text2)'; }
  
  // 책 목록 로드
  if (typeof loadBooksForSelector === 'function') {
    loadBooksForSelector();
  } else {
    console.error('loadBooksForSelector 함수 없음');
  }
  
  // 모달 표시
  modal.style.display = 'flex';
  console.log('말씀 선택기 모달 열림');
};


window.closeVerseSelector = function() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) modal.style.display = 'none';
};


window.shareToday = function() {
  console.log('📤 shareToday 실행됨');
  
  const ref = document.getElementById('today-verse-ref')?.innerText || '';
  const text = document.getElementById('today-verse-text')?.innerText || '';
  
  if (!ref && !text) {
    alert('공유할 말씀이 없습니다.');
    return;
  }
  
  const shareText = `${ref}\n\n${text}`;
  
  if (navigator.share) {
    navigator.share({
      title: '가좌제일교회 오늘의 말씀',
      text: shareText,
    }).catch(err => console.log('공유 취소:', err));
  } else {
    navigator.clipboard.writeText(shareText);
    alert('말씀이 클립보드에 복사되었습니다');
  }
};


window.submitMeditation = async function() {
  console.log('✏️ submitMeditation 실행됨');
  
  const input = document.getElementById('meditation-input');
  const content = input?.value.trim();
  
  if (!content) {
    alert('말씀 나누기 내용을 입력해주세요');
    return;
  }
  
  if (!currentUser) {
    alert('로그인이 필요합니다');
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
    if (window.FB_READY && typeof firebase !== 'undefined') {
      await firebase.database().ref('meditations').push(newMeditation);
    }
    
    if (typeof meditations !== 'undefined') {
      meditations.unshift(newMeditation);
    }
    if (typeof LS !== 'undefined') {
      LS.save('meditations', meditations);
    }
    
    input.value = '';
    if (typeof renderMeditations === 'function') renderMeditations();
    alert('✅ 말씀 나누기가 등록되었습니다');
  } catch (e) {
    console.error('묵상 등록 실패:', e);
    alert('등록에 실패했습니다: ' + e.message);
  }
};


// 함수 존재 확인 로그
console.log('✅ 말씀 관련 함수 등록 완료');
console.log('openVerseSelector:', typeof window.openVerseSelector);
console.log('shareToday:', typeof window.shareToday);
console.log('submitMeditation:', typeof window.submitMeditation);