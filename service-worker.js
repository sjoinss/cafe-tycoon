// 카페 타이쿤 PWA 서비스워커
// 정적 리소스(앱 셸)를 캐싱해 홈화면 설치 후 오프라인/즉시 실행을 지원한다.
// 게임 저장 데이터(localStorage/IndexedDB)에는 전혀 관여하지 않는다.

const CACHE_VERSION = 'v1';
const CACHE_NAME = `cafe-tycoon-${CACHE_VERSION}`;

// 서비스워커 파일 위치 기준 상대경로 — 서브경로 배포(예: GitHub Pages 프로젝트 페이지)에서도 동작
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 페이지 이동(새로고침/직접 접속)은 네트워크 우선, 실패 시 캐시된 앱 셸로 대체
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // 그 외 정적 리소스(스타일/스크립트/아이콘/폰트 등)는 캐시 우선, 없으면 네트워크에서 받아 캐시에 저장
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
