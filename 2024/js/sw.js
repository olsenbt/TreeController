// sw.js
/*self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('your-app-cache').then((cache) => {
        return cache.addAll([
          '/', // Add the root URL
          'index.html',
          'styles.css',
          'index.js',
          'manifest.json',
          'assets/icon.png',
          // Add other resources you want to cache
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });*/
  