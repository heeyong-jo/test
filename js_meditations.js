// ==================== 오늘의 말씀 렌더링 ====================


// 전역 변수 (var 사용으로 재선언 방지)
var selectedBookInfo = null;
var selectedChapter = 1;
var meditations = [];
var meditationPage = 1;
var MEDITATION_PER_PAGE = 10;


// 말씀 렌더링
function renderTodayVerse() {
  console.log('📖 renderTodayVerse 실행');
  
  var todayVerse = null;
  
  if (typeof LS !== 'undefined') {
    todayVerse = LS.load('todayVerse', null);
  }
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('todayVerse').once('value')
      .then(function(snap) {
        if (snap.exists()) {
          todayVerse = snap.val();
          if (typeof LS !== 'undefined') LS.save('todayVerse', todayVerse);
          updateVerseUI(todayVerse);
        } else if (todayVerse) {
          updateVerseUI(todayVerse);
        }
      })
      .catch(function() {
        if (todayVerse) updateVerseUI(todayVerse);
      });
  } else if (todayVerse) {
    updateVerseUI(todayVerse);
  } else {
    var textEl = document.getElementById('today-verse-text');
    var refEl = document.getElementById('today-verse-ref');
    var bodyEl = document.getElementById('today-verse-body');
    
    if (textEl) textEl.innerHTML = '"하나님은 사랑이시라"';
    if (refEl) refEl.innerHTML = '요한일서 4:16';
    if (bodyEl) bodyEl.innerHTML = '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라';
  }
}


function updateVerseUI(todayVerse) {
  if (!todayVerse || !todayVerse.text) return;
  
  var textEl = document.getElementById('today-verse-text');
  var refEl = document.getElementById('today-verse-ref');
  var bodyEl = document.getElementById('today-verse-body');
  
  if (textEl) {
    var shortText = todayVerse.text.length > 100 ? todayVerse.text.substring(0, 100) + '...' : todayVerse.text;
    textEl.innerHTML = '"' + shortText + '"';
  }
  if (refEl) refEl.innerHTML = todayVerse.ref;
  if (bodyEl) bodyEl.innerHTML = todayVerse.text;
}


// ==================== 말씀 등록 모달 (성경책 디자인) ====================


// 단계 표시
function showVerseStep(step) {
  var step1 = document.getElementById('vstep1');
  var step2 = document.getElementById('vstep2');
  var step3 = document.getElementById('vstep3');
  var bookDiv = document.getElementById('vstep-book');
  var chapterDiv = document.getElementById('vstep-chapter');
  var verseDiv = document.getElementById('vstep-verse');
  
  if (!step1 || !step2 || !step3 || !bookDiv || !chapterDiv || !verseDiv) return;
  
  step1.style.background = 'var(--bg2)';
  step1.style.color = 'var(--text2)';
  step2.style.background = 'var(--bg2)';
  step2.style.color = 'var(--text2)';
  step3.style.background = 'var(--bg2)';
  step3.style.color = 'var(--text2)';
  
  if (step === 'book') {
    step1.style.background = 'var(--purple)';
    step1.style.color = 'white';
    bookDiv.style.display = 'block';
    chapterDiv.style.display = 'none';
    verseDiv.style.display = 'none';
  } else if (step === 'chapter') {
    step2.style.background = 'var(--purple)';
    step2.style.color = 'white';
    bookDiv.style.display = 'none';
    chapterDiv.style.display = 'block';
    verseDiv.style.display = 'none';
  } else if (step === 'verse') {
    step3.style.background = 'var(--purple)';
    step3.style.color = 'white';
    bookDiv.style.display = 'none';
    chapterDiv.style.display = 'none';
    verseDiv.style.display = 'block';
  }
}


// 성경책 스타일 책 목록 로드
function loadBooksForSelector() {
  console.log('loadBooksForSelector 실행');
  
  var otDiv = document.getElementById('vs-ot-books');
  var ntDiv = document.getElementById('vs-nt-books');
  
  if (!otDiv || !ntDiv) {
    console.error('책 목록 컨테이너 없음');
    return;
  }
  
  // OT_BOOKS, NT_BOOKS 확인
  if (typeof OT_BOOKS === 'undefined') {
    console.error('OT_BOOKS 정의되지 않음');
    otDiv.innerHTML = '<div style="color:red;">데이터 로드 실패</div>';
    ntDiv.innerHTML = '<div style="color:red;">데이터 로드 실패</div>';
    return;
  }
  
  var bookBtnStyle = 'background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border:1.5px solid #c8b896;border-radius:16px;padding:12px 4px;text-align:center;cursor:pointer;margin:4px;transition:all 0.2s;';
  var bookTitleStyle = 'font-size:16px;font-weight:800;color:#6b4f2e;';
  var bookSubStyle = 'font-size:10px;color:#8a6e4e;margin-top:4px;';
  
  var otHtml = '';
  for (var i = 0; i < OT_BOOKS.length; i++) {
    var b = OT_BOOKS[i];
    otHtml += '<div style="' + bookBtnStyle + '" onclick="selectBookForVerse(\'' + b.name + '\')" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
      '<div style="' + bookTitleStyle + '">' + b.abbr + '</div>' +
      '<div style="' + bookSubStyle + '">' + b.chapters + '장</div>' +
      '</div>';
  }
  otDiv.innerHTML = otHtml;
  
  var ntHtml = '';
  for (var i = 0; i < NT_BOOKS.length; i++) {
    var b = NT_BOOKS[i];
    ntHtml += '<div style="' + bookBtnStyle + '" onclick="selectBookForVerse(\'' + b.name + '\')" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
      '<div style="' + bookTitleStyle + '">' + b.abbr + '</div>' +
      '<div style="' + bookSubStyle + '">' + b.chapters + '장</div>' +
      '</div>';
  }
  ntDiv.innerHTML = ntHtml;
  
  console.log('책 목록 로드 완료 - 구약:', OT_BOOKS.length, '신약:', NT_BOOKS.length);
}


// 책 선택
function selectBookForVerse(bookName) {
  console.log('책 선택:', bookName);
  
  selectedBookInfo = null;
  for (var i = 0; i < OT_BOOKS.length; i++) {
    if (OT_BOOKS[i].name === bookName) {
      selectedBookInfo = OT_BOOKS[i];
      break;
    }
  }
  if (!selectedBookInfo) {
    for (var i = 0; i < NT_BOOKS.length; i++) {
      if (NT_BOOKS[i].name === bookName) {
        selectedBookInfo = NT_BOOKS[i];
        break;
      }
    }
  }
  
  if (!selectedBookInfo) {
    console.error('책을 찾을 수 없음:', bookName);
    return;
  }
  
  var bookSelectedEl = document.getElementById('vs-book-selected');
  if (bookSelectedEl) {
    bookSelectedEl.innerHTML = '📖 ' + selectedBookInfo.name;
  }
  
  var container = document.getElementById('vs-chapters');
  if (container) {
    var html = '<div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">';
    for (var i = 1; i <= selectedBookInfo.chapters; i++) {
      html += '<button onclick="selectChapterForVerse(' + i + ')" style="width:60px;height:60px;background:linear-gradient(145deg,#fdf8f0,#f0e8d8);border:1.5px solid #d4b896;border-radius:16px;font-size:16px;font-weight:700;color:#6b4f2e;cursor:pointer;">' + i + '</button>';
    }
    html += '</div>';
    container.innerHTML = html;
  }
  
  showVerseStep('chapter');
}


// 장 선택
function selectChapterForVerse(chapter) {
  console.log('장 선택:', chapter);
  
  selectedChapter = chapter;
  var chapterSelectedEl = document.getElementById('vs-chapter-selected');
  if (chapterSelectedEl) {
    chapterSelectedEl.innerHTML = '📖 ' + selectedBookInfo.name + ' ' + chapter + '장';
  }
  
  var fromSelect = document.getElementById('vs-from');
  var toSelect = document.getElementById('vs-to');
  
  if (fromSelect && toSelect && selectedBookInfo) {
    fromSelect.innerHTML = '<option>로딩 중...</option>';
    
    // 비동기로 최대 절 수 가져오기
    var maxVerses = 150;
    var filePath = selectedBookInfo.file;
    var fullUrl = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/' + filePath;
    
    fetch(fullUrl)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var bookData = data;
        if (data[selectedBookInfo.name] && data[selectedBookInfo.name][chapter]) {
          bookData = data[selectedBookInfo.name];
        } else if (data[selectedBookInfo.abbr] && data[selectedBookInfo.abbr][chapter]) {
          bookData = data[selectedBookInfo.abbr];
        }
        if (bookData && bookData[chapter]) {
          maxVerses = Object.keys(bookData[chapter]).length;
        }
        
        var options = '';
        for (var i = 1; i <= maxVerses; i++) {
          options += '<option value="' + i + '">' + i + '절</option>';
        }
        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;
        if (toSelect) toSelect.value = Math.min(maxVerses, 5);
        updateVersePreview();
      })
      .catch(function(err) {
        console.warn('성경 데이터 로드 실패:', err);
        var options = '';
        for (var i = 1; i <= maxVerses; i++) {
          options += '<option value="' + i + '">' + i + '절</option>';
        }
        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;
        updateVersePreview();
      });
  }
  
  if (fromSelect) fromSelect.onchange = function() { updateVersePreview(); };
  if (toSelect) toSelect.onchange = function() { updateVersePreview(); };
  
  showVerseStep('verse');
}


// 말씀 미리보기
function updateVersePreview() {
  var from = parseInt(document.getElementById('vs-from')?.value || 1);
  var to = parseInt(document.getElementById('vs-to')?.value || 1);
  var previewDiv = document.getElementById('vs-preview');
  
  if (!previewDiv || !selectedBookInfo) return;
  
  previewDiv.innerHTML = '<div style="text-align:center; padding:20px;">로딩 중...</div>';
  
  var filePath = selectedBookInfo.file;
  var fullUrl = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/' + filePath;
  
  fetch(fullUrl)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var bookData = data;
      if (data[selectedBookInfo.name] && data[selectedBookInfo.name][selectedChapter]) {
        bookData = data[selectedBookInfo.name];
      } else if (data[selectedBookInfo.abbr] && data[selectedBookInfo.abbr][selectedChapter]) {
        bookData = data[selectedBookInfo.abbr];
      }
      
      if (bookData && bookData[selectedChapter]) {
        var verses = bookData[selectedChapter];
        var text = '';
        for (var i = from; i <= to && verses[i]; i++) {
          text += verses[i] + ' ';
        }
        previewDiv.innerHTML = '<div style="background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border-radius:20px;padding:20px;border:1px solid #e8dcc8;">' +
          '<div style="font-size:14px;color:#8a6e4e;margin-bottom:12px;">📖 말씀 미리보기</div>' +
          '<div style="font-size:15px;line-height:1.8;color:#4a3a28;font-style:italic;">"' + escapeHtml(text.trim()) + '"</div>' +
          '</div>';
      } else {
        previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 말씀을 불러올 수 없습니다</div>';
      }
    })
    .catch(function(err) {
      console.error('미리보기 오류:', err);
      previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 오류가 발생했습니다</div>';
    });
}


// 오늘의 말씀 등록
function applyTodayVerse() {
  var from = parseInt(document.getElementById('vs-from')?.value || 1);
  var to = parseInt(document.getElementById('vs-to')?.value || 1);
  
  if (!selectedBookInfo || !selectedChapter) {
    alert('📖 책과 장을 선택해주세요');
    return;
  }
  
  var ref = selectedBookInfo.name + ' ' + selectedChapter + '장';
  if (from === to) {
    ref += ' ' + from + '절';
  } else {
    ref += ' ' + from + '-' + to + '절';
  }
  
  var filePath = selectedBookInfo.file;
  var fullUrl = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/' + filePath;
  
  fetch(fullUrl)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var bookData = data;
      if (data[selectedBookInfo.name] && data[selectedBookInfo.name][selectedChapter]) {
        bookData = data[selectedBookInfo.name];
      } else if (data[selectedBookInfo.abbr] && data[selectedBookInfo.abbr][selectedChapter]) {
        bookData = data[selectedBookInfo.abbr];
      }
      
      if (bookData && bookData[selectedChapter]) {
        var verses = bookData[selectedChapter];
        var texts = [];
        for (var i = from; i <= to && verses[i]; i++) {
          texts.push(verses[i]);
        }
        var verseText = texts.join(' ');
        
        if (!verseText) {
          alert('말씀을 불러올 수 없습니다');
          return;
        }
        
        var todayVerseData = { ref: ref, text: verseText };
        
        if (typeof LS !== 'undefined') LS.save('todayVerse', todayVerseData);
        
        if (window.FB_READY && typeof firebase !== 'undefined') {
          firebase.database().ref('todayVerse').set(todayVerseData);
        }
        
        updateVerseUI(todayVerseData);
        closeVerseSelector();
        alert('✅ 오늘의 말씀이 등록되었습니다!\n\n📖 ' + ref);
      } else {
        alert('말씀을 불러올 수 없습니다');
      }
    })
    .catch(function(err) {
      console.error('말씀 등록 오류:', err);
      alert('말씀 등록 중 오류가 발생했습니다: ' + err.message);
    });
}


function vsGoBack(step) {
  if (step === 'book') {
    showVerseStep('book');
  } else if (step === 'chapter') {
    showVerseStep('chapter');
  }
}


// ==================== 모달 열기/닫기 ====================


window.openVerseSelector = function() {
  console.log('🔧 openVerseSelector 실행됨');
  
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    alert('관리자 또는 매니저만 말씀을 등록할 수 있습니다.');
    return;
  }
  
  var modal = document.getElementById('modal-verse-selector');
  if (!modal) {
    alert('말씀 선택기 모달을 찾을 수 없습니다.');
    return;
  }
  
  // 초기화
  selectedBookInfo = null;
  selectedChapter = 1;
  
  var vstepBook = document.getElementById('vstep-book');
  var vstepChapter = document.getElementById('vstep-chapter');
  var vstepVerse = document.getElementById('vstep-verse');
  
  if (vstepBook) vstepBook.style.display = 'block';
  if (vstepChapter) vstepChapter.style.display = 'none';
  if (vstepVerse) vstepVerse.style.display = 'none';
  
  var step1 = document.getElementById('vstep1');
  var step2 = document.getElementById('vstep2');
  var step3 = document.getElementById('vstep3');
  
  if (step1) {
    step1.style.background = 'var(--purple)';
    step1.style.color = 'white';
  }
  if (step2) {
    step2.style.background = 'var(--bg2)';
    step2.style.color = 'var(--text2)';
  }
  if (step3) {
    step3.style.background = 'var(--bg2)';
    step3.style.color = 'var(--text2)';
  }
  
  loadBooksForSelector();
  modal.style.display = 'flex';
  console.log('말씀 선택기 모달 열림');
};


window.closeVerseSelector = function() {
  var modal = document.getElementById('modal-verse-selector');
  if (modal) modal.style.display = 'none';
};


// ==================== 말씀 공유하기 ====================


window.shareToday = function() {
  var ref = document.getElementById('today-verse-ref')?.innerText || '';
  var text = document.getElementById('today-verse-text')?.innerText || '';
  
  if (!ref && !text) {
    alert('공유할 말씀이 없습니다.');
    return;
  }
  
  var shareText = ref + '\n\n' + text;
  
  if (navigator.share) {
    navigator.share({
      title: '가좌제일교회 오늘의 말씀',
      text: shareText,
    }).catch(function() {});
  } else {
    navigator.clipboard.writeText(shareText);
    alert('말씀이 클립보드에 복사되었습니다');
  }
};


// ==================== 말씀 나누기 ====================


function loadMeditations() {
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('meditations').once('value')
      .then(function(snapshot) {
        if (snapshot.exists()) {
          var data = snapshot.val();
          var items = [];
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              items.push(data[key]);
            }
          }
          items.sort(function(a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          meditations = items;
        } else {
          meditations = (typeof LS !== 'undefined') ? LS.load('meditations', []) : [];
        }
        renderMeditations();
      });
  } else {
    meditations = (typeof LS !== 'undefined') ? LS.load('meditations', []) : [];
    renderMeditations();
  }
}


function renderMeditations() {
  var container = document.getElementById('meditation-list');
  if (!container) return;
  
  if (meditations.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2);">💬 아직 등록된 묵상이 없습니다.</div>';
    return;
  }
  
  var start = (meditationPage - 1) * MEDITATION_PER_PAGE;
  var pageItems = meditations.slice(start, start + MEDITATION_PER_PAGE);
  var html = '';
  
  for (var i = 0; i < pageItems.length; i++) {
    var m = pageItems[i];
    html += '<div style="background:var(--bg);border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid var(--border);">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7a5230,#9e6b3e);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">' + (m.author ? m.author.charAt(0) : '🙏') + '</div>' +
      '<div style="flex:1;"><div style="font-weight:700;">' + escapeHtml(m.author || '익명') + '</div>' +
      '<div style="font-size:11px;color:var(--text2);">' + formatDate(m.createdAt) + '</div></div>' +
      (currentUser && (currentUser.role === 'admin' || currentUser.name === m.author) ? '<button onclick="deleteMeditation(\'' + m.id + '\')" style="background:none;border:none;font-size:18px;cursor:pointer;color:#b91c1c;">🗑</button>' : '') +
      '</div>' +
      '<div style="font-size:14px;line-height:1.7;">' + escapeHtml(m.content) + '</div>' +
      (m.verseRef ? '<div style="margin-top:12px;font-size:12px;color:var(--purple);">📖 ' + escapeHtml(m.verseRef) + '</div>' : '') +
      '</div>';
  }
  
  container.innerHTML = html;
}


function formatDate(dateStr) {
  if (!dateStr) return '';
  var date = new Date(dateStr);
  return date.getFullYear() + '.' + String(date.getMonth() + 1).padStart(2, '0') + '.' + String(date.getDate()).padStart(2, '0');
}


window.submitMeditation = function() {
  var input = document.getElementById('meditation-input');
  var content = input ? input.value.trim() : '';
  
  if (!content) {
    alert('말씀 나누기 내용을 입력해주세요');
    return;
  }
  
  if (!currentUser) {
    alert('로그인이 필요합니다');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  
  var newMeditation = {
    id: Date.now().toString(),
    content: content,
    author: currentUser.name || currentUser.id || '익명',
    authorId: currentUser.id,
    createdAt: new Date().toISOString(),
    verseRef: document.getElementById('today-verse-ref')?.innerText || ''
  };
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('meditations').push(newMeditation)
      .then(function() {
        meditations.unshift(newMeditation);
        if (typeof LS !== 'undefined') LS.save('meditations', meditations);
        input.value = '';
        meditationPage = 1;
        renderMeditations();
        alert('✅ 말씀 나누기가 등록되었습니다');
      })
      .catch(function(e) {
        alert('등록에 실패했습니다: ' + e.message);
      });
  } else {
    meditations.unshift(newMeditation);
    if (typeof LS !== 'undefined') LS.save('meditations', meditations);
    input.value = '';
    meditationPage = 1;
    renderMeditations();
    alert('✅ 말씀 나누기가 등록되었습니다');
  }
};


function deleteMeditation(id) {
  if (!confirm('이 묵상을 삭제하시겠습니까?')) return;
  
  meditations = meditations.filter(function(m) { return m.id !== id; });
  if (typeof LS !== 'undefined') LS.save('meditations', meditations);
  renderMeditations();
  alert('✅ 삭제되었습니다');
}


console.log('✅ js_meditations.js 로드 완료');
console.log('openVerseSelector:', typeof openVerseSelector);
console.log('shareToday:', typeof shareToday);
console.log('submitMeditation:', typeof submitMeditation);