const CACHE = 'donior-v2';
const BASE  = '/app';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll([BASE+'/index.html', BASE+'/manifest.json', BASE+'/icon-192.png', BASE+'/icon-512.png'])
       .catch(()=>{})
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept Firebase / Google API calls
  if(url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic') || url.includes('cdnjs')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached ||
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
    ).catch(() => caches.match(BASE+'/index.html'))
  );
});
