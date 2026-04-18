// ── 함께하는교회 Service Worker ──
const CACHE_NAME = 'hamkke-church-v7;
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];


// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('캐시 저장 중...');
      return cache.addAll(CACHE_FILES).catch(err => {
        console.log('일부 캐시 실패 (무시):', err);
      });
    })
  );
  self.skipWaiting();
});


// 활성화: 오래된 캐시 정리
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});


// 요청 가로채기: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // 성경 CDN 요청은 네트워크 우선 (실시간 데이터)
  if(e.request.url.includes('cdn.jsdelivr.net') ||
     e.request.url.includes('open-meteo.com')){
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // 나머지는 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if(res && res.status === 200 && res.type === 'basic'){
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => caches.match('./index.html'))
  );
});