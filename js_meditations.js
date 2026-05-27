// ==================== 말씀 기능 (오늘의 말씀 등록) ====================


// ------------------- 1. 오늘의 말씀 렌더링 -------------------
function renderTodayVerse() {
  let todayVerse = null;
  if (typeof LS !== 'undefined') {
    todayVerse = LS.load('todayVerse', null);
  }
  if (!todayVerse) {
    todayVerse = {
      text: '"하나님은 사랑이시라"',
      ref: '요한일서 4:16',
      body: '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라'
    };
  }
  const el_text = document.getElementById('today-verse-text');
  const el_ref = document.getElementById('today-verse-ref');
  const el_body = document.getElementById('today-verse-body');
  if (el_text) el_text.textContent = todayVerse.text;
  if (el_ref) el_ref.textContent = todayVerse.ref;
  if (el_body) el_body.textContent = todayVerse.body || todayVerse.text;
}


// ------------------- 2. 말씀 공유 -------------------
function shareToday() {
  const tv = (typeof LS !== 'undefined') ? LS.load('todayVerse', null) : null;
  const defaultVerse = {
    text: '"하나님은 사랑이시라"',
    ref: '요한일서 4:16',
    body: '사랑 안에 거하는 자는 하나님 안에 거하고 하나님이 그 안에 거하시느니라'
  };
  const todayVerse = tv || defaultVerse;
  const shareText = `${todayVerse.text} - ${todayVerse.ref}\n${todayVerse.body || todayVerse.text}`;
  if (navigator.share) {
    navigator.share({ title: '오늘의 말씀', text: shareText });
  } else {
    navigator.clipboard.writeText(shareText).then(() => alert('📋 복사되었습니다'));
  }
}


// ------------------- 3. 말씀 등록 모달 -------------------
const VerseTab = {
  selectedBook: null,
  selectedChapter: 1,
  currentVerseText: '',
  maxVerses: 150,


  initializeBibleBooks: function() {
    window.OT_BOOKS = [
      {name: '창세기', abbr: '창', chapters: 50, file: 'ot01_Genesis_JSON'},
      {name: '출애굽기', abbr: '출', chapters: 40, file: 'ot02_Exodus_JSON'},
      {name: '레위기', abbr: '레', chapters: 27, file: 'ot03_Leviticus_JSON'},
      {name: '민수기', abbr: '민', chapters: 36, file: 'ot04_Numbers_JSON'},
      {name: '신명기', abbr: '신', chapters: 34, file: 'ot05_Deuteronomy_JSON'},
      {name: '여호수아', abbr: '수', chapters: 24, file: 'ot06_Joshua_JSON'},
      {name: '사사기', abbr: '삿', chapters: 21, file: 'ot07_Judges_JSON'},
      {name: '룻기', abbr: '룻', chapters: 4, file: 'ot08_Ruth_JSON'},
      {name: '사무엘상', abbr: '삼상', chapters: 31, file: 'ot09_1 Samuel_JSON'},
      {name: '사무엘하', abbr: '삼하', chapters: 24, file: 'ot10_2 Samuel_JSON'},
      {name: '열왕기상', abbr: '왕상', chapters: 22, file: 'ot11_1 Kings_JSON'},
      {name: '열왕기하', abbr: '왕하', chapters: 25, file: 'ot12_2 Kings_JSON'},
      {name: '역대상', abbr: '대상', chapters: 29, file: 'ot13_1 Chronicles_JSON'},
      {name: '역대하', abbr: '대하', chapters: 36, file: 'ot14_2 Chronicles_JSON'},
      {name: '에스라', abbr: '스', chapters: 10, file: 'ot15_Ezra_JSON'},
      {name: '느헤미야', abbr: '느', chapters: 13, file: 'ot16_Nehemiah_JSON'},
      {name: '에스더', abbr: '에', chapters: 10, file: 'ot17_Esther_JSON'},
      {name: '욥기', abbr: '욥', chapters: 42, file: 'ot18_Job_JSON'},
      {name: '시편', abbr: '시', chapters: 150, file: 'ot19_Psalms_JSON'},
      {name: '잠언', abbr: '잠', chapters: 31, file: 'ot20_Proverbs_JSON'},
      {name: '전도서', abbr: '전', chapters: 12, file: 'ot21_Ecclesiastes_JSON'},
      {name: '아가', abbr: '아', chapters: 8, file: 'ot22_Song of Solomon_JSON'},
      {name: '이사야', abbr: '사', chapters: 66, file: 'ot23_Isaiah_JSON'},
      {name: '예레미야', abbr: '렘', chapters: 52, file: 'ot24_Jeremiah_JSON'},
      {name: '예레미야애가', abbr: '애', chapters: 5, file: 'ot25_Lamentations_JSON'},
      {name: '에스겔', abbr: '겔', chapters: 48, file: 'ot26_Ezekiel_JSON'},
      {name: '다니엘', abbr: '단', chapters: 12, file: 'ot27_Daniel_JSON'},
      {name: '호세아', abbr: '호', chapters: 14, file: 'ot28_Hosea_JSON'},
      {name: '요엘', abbr: '욜', chapters: 3, file: 'ot29_Joel_JSON'},
      {name: '아모스', abbr: '암', chapters: 9, file: 'ot30_Amos_JSON'},
      {name: '오바댜', abbr: '옵', chapters: 1, file: 'ot31_Obadiah_JSON'},
      {name: '요나', abbr: '욘', chapters: 4, file: 'ot32_Jonah_JSON'},
      {name: '미가', abbr: '미', chapters: 7, file: 'ot33_Micah_JSON'},
      {name: '나훔', abbr: '나', chapters: 3, file: 'ot34_Nahum_JSON'},
      {name: '하박국', abbr: '합', chapters: 3, file: 'ot35_Habakkuk_JSON'},
      {name: '스바냐', abbr: '습', chapters: 3, file: 'ot36_Zephaniah_JSON'},
      {name: '학개', abbr: '학', chapters: 2, file: 'ot37_Haggai_JSON'},
      {name: '스가랴', abbr: '슥', chapters: 14, file: 'ot38_Zechariah_JSON'},
      {name: '말라기', abbr: '말', chapters: 4, file: 'ot39_Malachi_JSON'}
    ];


    window.NT_BOOKS = [
      {name: '마태복음', abbr: '마', chapters: 28, file: 'nt01_Matthew_JSON'},
      {name: '마가복음', abbr: '막', chapters: 16, file: 'nt02_Mark_JSON'},
      {name: '누가복음', abbr: '눅', chapters: 24, file: 'nt03_Luke_JSON'},
      {name: '요한복음', abbr: '요', chapters: 21, file: 'nt04_John_JSON'},
      {name: '사도행전', abbr: '행', chapters: 28, file: 'nt05_Acts_JSON'},
      {name: '로마서', abbr: '롬', chapters: 16, file: 'nt06_Romans_JSON'},
      {name: '고린도전서', abbr: '고전', chapters: 16, file: 'nt07_1 Corinthians_JSON'},
      {name: '고린도후서', abbr: '고후', chapters: 13, file: 'nt08_2 Corinthians_JSON'},
      {name: '갈라디아서', abbr: '갈', chapters: 6, file: 'nt09_Galatians_JSON'},
      {name: '에베소서', abbr: '엡', chapters: 6, file: 'nt10_Ephesians_JSON'},
      {name: '빌립보서', abbr: '빌', chapters: 4, file: 'nt11_Philippians_JSON'},
      {name: '골로새서', abbr: '골', chapters: 4, file: 'nt12_Colossians_JSON'},
      {name: '데살로니가전서', abbr: '살전', chapters: 5, file: 'nt13_1 Thessalonians_JSON'},
      {name: '데살로니가후서', abbr: '살후', chapters: 3, file: 'nt14_2 Thessalonians_JSON'},
      {name: '디모데전서', abbr: '딤전', chapters: 6, file: 'nt15_1 Timothy_JSON'},
      {name: '디모데후서', abbr: '딤후', chapters: 4, file: 'nt16_2 Timothy_JSON'},
      {name: '디도서', abbr: '딛', chapters: 3, file: 'nt17_Titus_JSON'},
      {name: '빌레몬서', abbr: '몬', chapters: 1, file: 'nt18_Philemon_JSON'},
      {name: '히브리서', abbr: '히', chapters: 13, file: 'nt19_Hebrews_JSON'},
      {name: '야고보서', abbr: '약', chapters: 5, file: 'nt20_James_JSON'},
      {name: '베드로전서', abbr: '벧전', chapters: 5, file: 'nt21_1 Peter_JSON'},
      {name: '베드로후서', abbr: '벧후', chapters: 3, file: 'nt22_2 Peter_JSON'},
      {name: '요한일서', abbr: '요일', chapters: 5, file: 'nt23_1 John_JSON'},
      {name: '요한이서', abbr: '요이', chapters: 1, file: 'nt24_2 John_JSON'},
      {name: '요한삼서', abbr: '요삼', chapters: 1, file: 'nt25_3 John_JSON'},
      {name: '유다서', abbr: '유', chapters: 1, file: 'nt26_Jude_JSON'},
      {name: '요한계시록', abbr: '계', chapters: 22, file: 'nt27_Revelation_JSON'}
    ];
  },


  showStep: function(step) {
    const step1 = document.getElementById('vstep1');
    const step2 = document.getElementById('vstep2');
    const step3 = document.getElementById('vstep3');
    const bookDiv = document.getElementById('vstep-book');
    const chapterDiv = document.getElementById('vstep-chapter');
    const verseDiv = document.getElementById('vstep-verse');
    
    if (!step1 || !step2 || !step3) return;
    
    step1.style.background = step === 'book' ? 'var(--purple)' : 'var(--bg2)';
    step1.style.color = step === 'book' ? 'white' : 'var(--text2)';
    step2.style.background = step === 'chapter' ? 'var(--purple)' : 'var(--bg2)';
    step2.style.color = step === 'chapter' ? 'white' : 'var(--text2)';
    step3.style.background = step === 'verse' ? 'var(--purple)' : 'var(--bg2)';
    step3.style.color = step === 'verse' ? 'white' : 'var(--text2)';
    
    if (bookDiv) bookDiv.style.display = step === 'book' ? 'block' : 'none';
    if (chapterDiv) chapterDiv.style.display = step === 'chapter' ? 'block' : 'none';
    if (verseDiv) verseDiv.style.display = step === 'verse' ? 'block' : 'none';
  },


  loadBooks: function() {
    const otDiv = document.getElementById('vs-ot-books');
    const ntDiv = document.getElementById('vs-nt-books');
    if (!otDiv || !ntDiv) return;
    
    if (typeof OT_BOOKS === 'undefined' || typeof NT_BOOKS === 'undefined') {
      this.initializeBibleBooks();
    }
    
    const btnStyle = 'background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border:1.5px solid #c8b896;border-radius:16px;padding:12px 4px;text-align:center;cursor:pointer;margin:4px;';
    const titleStyle = 'font-size:16px;font-weight:800;color:#6b4f2e;';
    const subStyle = 'font-size:10px;color:#8a6e4e;margin-top:4px;';
    
    let otHtml = '';
    for (let i = 0; i < OT_BOOKS.length; i++) {
      const b = OT_BOOKS[i];
      otHtml += `<div style="${btnStyle}" onclick="VerseTab.pickBook('${b.name}')">
        <div style="${titleStyle}">${b.abbr}</div>
        <div style="${subStyle}">${b.chapters}장</div>
      </div>`;
    }
    otDiv.innerHTML = otHtml;
    
    let ntHtml = '';
    for (let i = 0; i < NT_BOOKS.length; i++) {
      const b = NT_BOOKS[i];
      ntHtml += `<div style="${btnStyle}" onclick="VerseTab.pickBook('${b.name}')">
        <div style="${titleStyle}">${b.abbr}</div>
        <div style="${subStyle}">${b.chapters}장</div>
      </div>`;
    }
    ntDiv.innerHTML = ntHtml;
  },


  pickBook: function(bookName) {
    this.selectedBook = OT_BOOKS.find(b => b.name === bookName) || NT_BOOKS.find(b => b.name === bookName);
    if (!this.selectedBook) return;
    
    const bookSelectedEl = document.getElementById('vs-book-selected');
    if (bookSelectedEl) bookSelectedEl.innerHTML = `📖 ${this.selectedBook.name}`;
    
    const container = document.getElementById('vs-chapters');
    if (container) {
      let html = '<div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">';
      for (let i = 1; i <= this.selectedBook.chapters; i++) {
        html += `<button onclick="VerseTab.pickChapter(${i})" style="width:60px;height:60px;background:linear-gradient(145deg,#fdf8f0,#f0e8d8);border:1.5px solid #d4b896;border-radius:16px;font-size:16px;font-weight:700;color:#6b4f2e;cursor:pointer;">${i}</button>`;
      }
      html += '</div>';
      container.innerHTML = html;
    }
    this.showStep('chapter');
  },


  pickChapter: function(chapter) {
    this.selectedChapter = chapter;
    const chapterSelectedEl = document.getElementById('vs-chapter-selected');
    if (chapterSelectedEl) chapterSelectedEl.innerHTML = `📖 ${this.selectedBook.name} ${chapter}장`;
    
    const fromSelect = document.getElementById('vs-from');
    const toSelect = document.getElementById('vs-to');
    if (fromSelect && toSelect) {
      fromSelect.innerHTML = '<option>로딩 중...</option>';
      toSelect.innerHTML = '<option>로딩 중...</option>';
      
      const url = `https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/${this.selectedBook.file}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          let bookData = data[this.selectedBook.name] || data[this.selectedBook.abbr];
          if (bookData && bookData[chapter]) {
            this.maxVerses = Object.keys(bookData[chapter]).length;
          } else {
            this.maxVerses = 150;
          }
          
          let options = '';
          for (let i = 1; i <= this.maxVerses; i++) {
            options += `<option value="${i}">${i}절</option>`;
          }
          fromSelect.innerHTML = options;
          toSelect.innerHTML = options;
          toSelect.value = Math.min(5, this.maxVerses);
          
          this.showStep('verse');
          this.loadVersePreview();
        })
        .catch(() => {
          let options = '';
          for (let i = 1; i <= 150; i++) {
            options += `<option value="${i}">${i}절</option>`;
          }
          fromSelect.innerHTML = options;
          toSelect.innerHTML = options;
          toSelect.value = 5;
          
          this.showStep('verse');
          this.loadVersePreview();
        });
    } else {
      this.showStep('verse');
      this.loadVersePreview();
    }
  },


  loadVersePreview: function() {
    const previewDiv = document.getElementById('vs-preview');
    if (!previewDiv || !this.selectedBook) return;
    
    const fromInput = document.getElementById('vs-from');
    const toInput = document.getElementById('vs-to');
    
    if (!fromInput || !toInput || fromInput.innerHTML === '<option>로딩 중...</option>') {
      previewDiv.innerHTML = '<div style="text-align:center;padding:20px;">절 범위를 불러오는 중...</div>';
      return;
    }
    
    const from = parseInt(fromInput.value || 1);
    const to = parseInt(toInput.value || 1);
    if (isNaN(from) || isNaN(to)) {
      previewDiv.innerHTML = '<div style="text-align:center;padding:20px;">절을 선택해주세요</div>';
      return;
    }
    
    const startVerse = Math.min(from, to);
    const endVerse = Math.max(from, to);
    const url = `https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@main/${this.selectedBook.file}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        let bookData = data[this.selectedBook.name] || data[this.selectedBook.abbr];
        if (bookData && bookData[this.selectedChapter]) {
          const verses = bookData[this.selectedChapter];
          let text = '';
          for (let i = startVerse; i <= endVerse && verses[i]; i++) {
            text += verses[i] + ' ';
          }
          this.currentVerseText = text.trim();
          previewDiv.innerHTML = `<div style="background:linear-gradient(145deg,#fdf8f0,#f5e8d5);border-radius:20px;padding:20px;border:1px solid #e8dcc8;">
            <div style="font-size:14px;color:#8a6e4e;margin-bottom:12px;">📖 말씀 미리보기</div>
            <div style="font-size:15px;line-height:1.8;color:#4a3a28;font-style:italic;">"${escapeHtml(this.currentVerseText)}"</div>
          </div>`;
        } else {
          previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 말씀을 불러올 수 없습니다</div>';
        }
      })
      .catch(() => {
        previewDiv.innerHTML = '<div style="color:#b91c1c;text-align:center;padding:20px;">⚠️ 데이터 로드 오류</div>';
      });
  },


  applyTodayVerse: function() {
    if (!this.selectedBook || !this.selectedChapter) {
      alert('책과 장을 선택해주세요');
      return;
    }
    
    const from = document.getElementById('vs-from')?.value || 1;
    const to = document.getElementById('vs-to')?.value || 1;
    let ref = `${this.selectedBook.name} ${this.selectedChapter}장`;
    if (from == to) ref += ` ${from}절`;
    else ref += ` ${from}-${to}절`;
    
    const verseText = this.currentVerseText || '';
    if (!verseText) {
      alert('말씀 데이터를 불러오지 못했습니다.');
      return;
    }
    
    const todayVerseData = { text: `"${verseText}"`, ref: ref, body: verseText };
    
    if (typeof LS !== 'undefined') {
      LS.save('todayVerse', todayVerseData);
    }
    
    renderTodayVerse();
    closeVerseSelector();
    alert(`✅ 오늘의 말씀이 등록되었습니다: ${ref}`);
  },


  goBack: function(step) {
    if (step === 'book') {
      this.showStep('book');
      this.loadBooks();
    } else if (step === 'chapter') {
      this.showStep('chapter');
    }
  }
};


// 전역 함수 연결
window.openVerseSelector = function() {
  console.log('openVerseSelector 실행');
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    document.getElementById('screen-login').style.display = 'flex';
    return;
  }
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    alert('관리자 또는 매니저만 말씀을 등록할 수 있습니다.');
    return;
  }
  
  const modal = document.getElementById('modal-verse-selector');
  if (!modal) {
    alert('말씀 선택기 모달을 찾을 수 없습니다.');
    return;
  }
  
  if (typeof OT_BOOKS === 'undefined' || typeof NT_BOOKS === 'undefined') {
    VerseTab.initializeBibleBooks();
  }
  
  VerseTab.selectedBook = null;
  VerseTab.selectedChapter = 1;
  VerseTab.currentVerseText = '';
  VerseTab.showStep('book');
  VerseTab.loadBooks();
  modal.style.display = 'flex';
};


window.closeVerseSelector = function() {
  const modal = document.getElementById('modal-verse-selector');
  if (modal) modal.style.display = 'none';
};


window.vsGoBack = function(step) { VerseTab.goBack(step); };
window.applyTodayVerse = function() { VerseTab.applyTodayVerse(); };


console.log('✅ 말씀 등록 기능 로드 완료');