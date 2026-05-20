// ==================== 오늘의 말씀 렌더링 ====================


// 전역 변수 (한 번만 선언)
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


// ==================== 말씀 등록 모달 (단계 표시) ====================


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


// 책 목록 로드
function loadBooksForSelector() {
  var otDiv = document.getElementById('vs-ot-books');
  var ntDiv = document.getElementById('vs-nt-books');
  
  if (!otDiv || !ntDiv) return;
  
  if (typeof OT_BOOKS !== 'undefined') {
    var otHtml = '';
    for (var i = 0; i < OT_BOOKS.length; i++) {
      var b = OT_BOOKS[i];
      otHtml += '<div style="background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border:1.5px solid #c8b896;border-radius:16px;padding:12px 4px;text-align:center;cursor:pointer;margin:4px;" onclick="selectBookForVerse(\'' + b.name + '\')">' +
        '<div style="font-size:16px;font-weight:800;color:#6b4f2e;">' + b.abbr + '</div>' +
        '<div style="font-size:10px;color:#8a6e4e;">' + b.chapters + '장</div>' +
        '</div>';
    }
    otDiv.innerHTML = otHtml;
  }
  
  if (typeof NT_BOOKS !== 'undefined') {
    var ntHtml = '';
    for (var i = 0; i < NT_BOOKS.length; i++) {
      var b = NT_BOOKS[i];
      ntHtml += '<div style="background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border:1.5px solid #c8b896;border-radius:16px;padding:12px 4px;text-align:center;cursor:pointer;margin:4px;" onclick="selectBookForVerse(\'' + b.name + '\')">' +
        '<div style="font-size:16px;font-weight:800;color:#6b4f2e;">' + b.abbr + '</div>' +
        '<div style="font-size:10px;color:#8a6e4e;">' + b.chapters + '장</div>' +
        '</div>';
    }
    ntDiv.innerHTML = ntHtml;
  }
}


// 책 선택
function selectBookForVerse(bookName) {
  if (typeof OT_BOOKS !== 'undefined') {
    selectedBookInfo = OT_BOOKS.find(function(b) { return b.name === bookName; });
    if (!selectedBookInfo && typeof NT_BOOKS !== 'undefined') {
      selectedBookInfo = NT_BOOKS.find(function(b) { return b.name === bookName; });
    }
  }
  if (!selectedBookInfo) return;
  
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
  selectedChapter = chapter;
  var chapterSelectedEl = document.getElementById('vs-chapter-selected');
  if (chapterSelectedEl) {
    chapterSelectedEl.innerHTML = '📖 ' + selectedBookInfo.name + ' ' + chapter + '장';
  }
  
  var fromSelect = document.getElementById('vs-from');
  var toSelect = document.getElementById('vs-to');
  
  if (fromSelect && toSelect && selectedBookInfo) {
    fromSelect.innerHTML = '<option>로딩 중...</option>';
    
    (function() {
      var maxVerses = 150;
      fetch(BIBLE_CDN + '/' + selectedBookInfo.file)
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
        .catch(function(e) {
          var options = '';
          for (var i = 1; i <= maxVerses; i++) {
            options += '<option value="' + i + '">' + i + '절</option>';
          }
          fromSelect.innerHTML = options;
          toSelect.innerHTML = options;
          updateVersePreview();
        });
    })();
  }
  
  fromSelect.onchange = function() { updateVersePreview(); };
  toSelect.onchange = function() { updateVersePreview(); };
  
  showVerseStep('verse');
}


// 말씀 미리보기
function updateVersePreview() {
  var from = parseInt(document.getElementById('vs-from')?.value || 1);
  var to = parseInt(document.getElementById('vs-to')?.value || 1);
  var previewDiv = document.getElementById('vs-preview');
  
  if (!previewDiv || !selectedBookInfo) return;
  
  previewDiv.innerHTML = '<div style="text-align:center; padding:20px;">로딩 중...</div>';
  
  fetch(BIBLE_CDN + '/' + selectedBookInfo.file)
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
    .catch(function(e) {
      previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 오류가 발생했습니다</div>';
    });
}


// 오늘의 말씀으로 등록
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
  
  fetch(BIBLE_CDN + '/' + selectedBookInfo.file)
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
        alert('✅ 오늘의 말씀이 등록되었습니다!\n\n📖 ' + ref + '\n\n"' + (verseText.length > 80 ? verseText.substring(0, 80) + '…' : verseText) + '"');
      } else {
        alert('말씀을 불러올 수 없습니다');
      }
    })
    .catch(function(e) {
      console.error('말씀 등록 오류:', e);
      alert('말씀 등록 중 오류가 발생했습니다');
    });
}


function vsGoBack(step) {
  if (step === 'book') {
    showVerseStep('book');
  } else if (step === 'chapter') {
    showVerseStep('chapter');
  }
}


// ==================== 말씀 등록 모달 열기/닫기 ====================


window.openVerseSelector = function() {
  console.log('openVerseSelector 실행됨');
  
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
  
  if (step1) step1.style.background = 'var(--purple)';
  if (step1) step1.style.color = 'white';
  if (step2) step2.style.background = 'var(--bg2)';
  if (step2) step2.style.color = 'var(--text2)';
  if (step3) step3.style.background = 'var(--bg2)';
  if (step3) step3.style.color = 'var(--text2)';
  
  loadBooksForSelector();
  modal.style.display = 'flex';
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
    });
  } else {
    navigator.clipboard.writeText(shareText);
    alert('말씀이 클립보드에 복사되었습니다');
  }
};


// ==================== 말씀 나누기 (묵상) ====================


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
          if (typeof LS !== 'undefined') LS.save('meditations', meditations);
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
  
  if (window.FB_READY && typeof firebase !== 'undefined') {
    firebase.database().ref('meditations').once('value')
      .then(function(snapshot) {
        if (snapshot.exists()) {
          var data = snapshot.val();
          var keyToDelete = null;
          for (var key in data) {
            if (data[key].id === id) {
              keyToDelete = key;
              break;
            }
          }
          if (keyToDelete) {
            firebase.database().ref('meditations/' + keyToDelete).remove()
              .then(function() {
                meditations = meditations.filter(function(m) { return m.id !== id; });
                if (typeof LS !== 'undefined') LS.save('meditations', meditations);
                renderMeditations();
                alert('✅ 삭제되었습니다');
              });
          }
        }
      });
  } else {
    meditations = meditations.filter(function(m) { return m.id !== id; });
    if (typeof LS !== 'undefined') LS.save('meditations', meditations);
    renderMeditations();
    alert('✅ 삭제되었습니다');
  }
}


console.log('✅ js_meditations.js 로드 완료 (var 버전)');