const CACHE = 'donior-v2';
const OFFLINE_URL = 'index.html';

// All URLs to cache on install
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install — cache everything immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(
        CACHE_URLS.map(url => 
          c.add(url).catch(err => console.log('Cache miss:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate — take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache first, then network, fallback to offline page
self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // Skip Firebase and external calls — always use network
  if(url.includes('firestore') || 
     url.includes('firebase') || 
     url.includes('googleapis') || 
     url.includes('gstatic.com') || 
     url.includes('cdnjs') ||
     url.includes('fonts.google')) {
    return;
  }

  // For navigation requests — serve cached index.html if offline
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // For everything else — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(response => {
        // Cache valid responses
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
