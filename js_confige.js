// ==================== 설정 및 상수 ====================


// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDvCJT5UlKt4cxAfxH22QYUM34upH2J31k",
  authDomain: "church-room-c3b26.firebaseapp.com",
  databaseURL: "https://church-room-c3b26-default-rtdb.firebaseio.com",
  projectId: "church-room-c3b26",
  storageBucket: "church-room-c3b26.firebasestorage.app",
  messagingSenderId: "59336766877",
  appId: "1:59336766877:web:a50b074a0aa4ce7db36b74"
};


// 관리자 계정
const ADMIN_ACCOUNTS = [
  { id: 'hamkke', pw: 'hamkke123', name: '김소녕 목사', role: 'admin', email: 'pastor@hamkke.church', phone: '010-9012-9947', birth: '1955-03-29' },
  { id: 'reodrino', pw: '232735a', name: '조희용 관리자', role: 'admin', email: 'reodrino@gmail.com', phone: '010-9797-1408', birth: '1981-08-27' }
];


// Firebase 초기화
try {
  const _fbApp = firebase.initializeApp(firebaseConfig);
  const _fbDb  = firebase.database();
  window.FB = {
    db:      _fbDb,
    ref:     (path) => _fbDb.ref(path),
    onValue: (path, callback) => {
      _fbDb.ref(path).on('value', (snapshot) => {
        const data = snapshot.val();
        if (typeof fbUpdateUI === 'function') fbUpdateUI(path, data);
        localStorage.setItem('ch2_' + path, JSON.stringify(data));
        if (callback) callback(data);
      });
    },
    push:   (r, v) => r.push(v),
    set:    (r, v) => r.set(v),
    remove: (r)    => r.remove()
  };
  window.FB_READY = true;
  console.log('✅ Firebase 실시간 시스템 가동 중');
} catch(e) {
  console.error('❌ Firebase 연결 오류:', e);
  window.FB_READY = false;
}


// Firebase 동기화할 키 목록
const FB_KEYS = ['notices', 'members', 'meditations', 'pendingUsers', 'approvedUsers', 'offerings', 'todayVerse', 'serviceList', 'scheduleList', 'posts', 'prayers'];


// 성경 CDN
const BIBLE_CDN = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data';
const HYMN_CDN = 'https://cdn.jsdelivr.net/gh/heeyong-jo/bible-data@latest';


// 권한 라벨
const roleLabel = { admin: '관리자', manager: '매니저', member: '일반성도' };


// 구약 39권 (전체 목록)
const OT_BOOKS = [
  { name: "창세기", abbr: "창", chapters: 50, file: "ot01_genesis.json" },
  { name: "출애굽기", abbr: "출", chapters: 40, file: "ot02_exodus.json" },
  { name: "레위기", abbr: "레", chapters: 27, file: "ot03_leviticus.json" },
  { name: "민수기", abbr: "민", chapters: 36, file: "ot04_numbers.json" },
  { name: "신명기", abbr: "신", chapters: 34, file: "ot05_deuteronomy.json" },
  { name: "여호수아", abbr: "수", chapters: 24, file: "ot06_joshua.json" },
  { name: "사사기", abbr: "삿", chapters: 21, file: "ot07_judges.json" },
  { name: "룻기", abbr: "룻", chapters: 4, file: "ot08_ruth.json" },
  { name: "사무엘상", abbr: "삼상", chapters: 31, file: "ot09_1samuel.json" },
  { name: "사무엘하", abbr: "삼하", chapters: 24, file: "ot10_2samuel.json" },
  { name: "열왕기상", abbr: "왕상", chapters: 22, file: "ot11_1kings.json" },
  { name: "열왕기하", abbr: "왕하", chapters: 25, file: "ot12_2kings.json" },
  { name: "역대상", abbr: "대상", chapters: 29, file: "ot13_1chronicles.json" },
  { name: "역대하", abbr: "대하", chapters: 36, file: "ot14_2chronicles.json" },
  { name: "에스라", abbr: "스", chapters: 10, file: "ot15_ezra.json" },
  { name: "느헤미야", abbr: "느", chapters: 13, file: "ot16_nehemiah.json" },
  { name: "에스더", abbr: "에", chapters: 10, file: "ot17_esther.json" },
  { name: "욥기", abbr: "욥", chapters: 42, file: "ot18_job.json" },
  { name: "시편", abbr: "시", chapters: 150, file: "ot19_psalms.json" },
  { name: "잠언", abbr: "잠", chapters: 31, file: "ot20_proverbs.json" },
  { name: "전도서", abbr: "전", chapters: 12, file: "ot21_ecclesiastes.json" },
  { name: "아가", abbr: "아", chapters: 8, file: "ot22_songofsolomon.json" },
  { name: "이사야", abbr: "사", chapters: 66, file: "ot23_isaiah.json" },
  { name: "예레미야", abbr: "렘", chapters: 52, file: "ot24_jeremiah.json" },
  { name: "예레미야애가", abbr: "애", chapters: 5, file: "ot25_lamentations.json" },
  { name: "에스겔", abbr: "겔", chapters: 48, file: "ot26_ezekiel.json" },
  { name: "다니엘", abbr: "단", chapters: 12, file: "ot27_daniel.json" },
  { name: "호세아", abbr: "호", chapters: 14, file: "ot28_hosea.json" },
  { name: "요엘", abbr: "욜", chapters: 3, file: "ot29_joel.json" },
  { name: "아모스", abbr: "암", chapters: 9, file: "ot30_amos.json" },
  { name: "오바댜", abbr: "옵", chapters: 1, file: "ot31_obadiah.json" },
  { name: "요나", abbr: "욘", chapters: 4, file: "ot32_jonah.json" },
  { name: "미가", abbr: "미", chapters: 7, file: "ot33_micah.json" },
  { name: "나훔", abbr: "나", chapters: 3, file: "ot34_nahum.json" },
  { name: "하박국", abbr: "합", chapters: 3, file: "ot35_habakkuk.json" },
  { name: "스바냐", abbr: "습", chapters: 3, file: "ot36_zephaniah.json" },
  { name: "학개", abbr: "학", chapters: 2, file: "ot37_haggai.json" },
  { name: "스가랴", abbr: "슥", chapters: 14, file: "ot38_zechariah.json" },
  { name: "말라기", abbr: "말", chapters: 4, file: "ot39_malachi.json" }
];


// 신약 27권
const NT_BOOKS = [
  { name: "마태복음", abbr: "마", chapters: 28, file: "nt01_matthew.json" },
  { name: "마가복음", abbr: "막", chapters: 16, file: "nt02_mark.json" },
  { name: "누가복음", abbr: "눅", chapters: 24, file: "nt03_luke.json" },
  { name: "요한복음", abbr: "요", chapters: 21, file: "nt04_john.json" },
  { name: "사도행전", abbr: "행", chapters: 28, file: "nt05_acts.json" },
  { name: "로마서", abbr: "롬", chapters: 16, file: "nt06_romans.json" },
  { name: "고린도전서", abbr: "고전", chapters: 16, file: "nt07_1corinthians.json" },
  { name: "고린도후서", abbr: "고후", chapters: 13, file: "nt08_2corinthians.json" },
  { name: "갈라디아서", abbr: "갈", chapters: 6, file: "nt09_galatians.json" },
  { name: "에베소서", abbr: "엡", chapters: 6, file: "nt10_ephesians.json" },
  { name: "빌립보서", abbr: "빌", chapters: 4, file: "nt11_philippians.json" },
  { name: "골로새서", abbr: "골", chapters: 4, file: "nt12_colossians.json" },
  { name: "데살로니가전서", abbr: "살전", chapters: 5, file: "nt13_1thessalonians.json" },
  { name: "데살로니가후서", abbr: "살후", chapters: 3, file: "nt14_2thessalonians.json" },
  { name: "디모데전서", abbr: "딤전", chapters: 6, file: "nt15_1timothy.json" },
  { name: "디모데후서", abbr: "딤후", chapters: 4, file: "nt16_2timothy.json" },
  { name: "디도서", abbr: "딛", chapters: 3, file: "nt17_titus.json" },
  { name: "빌레몬서", abbr: "몬", chapters: 1, file: "nt18_philemon.json" },
  { name: "히브리서", abbr: "히", chapters: 13, file: "nt19_hebrews.json" },
  { name: "야고보서", abbr: "약", chapters: 5, file: "nt20_james.json" },
  { name: "베드로전서", abbr: "벧전", chapters: 5, file: "nt21_1peter.json" },
  { name: "베드로후서", abbr: "벧후", chapters: 3, file: "nt22_2peter.json" },
  { name: "요한일서", abbr: "요일", chapters: 5, file: "nt23_1john.json" },
  { name: "요한이서", abbr: "요이", chapters: 1, file: "nt24_2john.json" },
  { name: "요한삼서", abbr: "요삼", chapters: 1, file: "nt25_3john.json" },
  { name: "유다서", abbr: "유", chapters: 1, file: "nt26_jude.json" },
  { name: "요한계시록", abbr: "계", chapters: 22, file: "nt27_revelation.json" }
];