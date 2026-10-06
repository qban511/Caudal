/* Caudal · service worker
   - Hace que la app funcione sin conexión y cargue al instante (sensación de app nativa).
   - Solo cachea TUS propios archivos (mismo origen). Nunca contacta con nada externo.
   - El HTML va "red primero": así las actualizaciones llegan siempre que haya conexión.
   Sube el número de versión al publicar cambios para purgar la caché antigua. */
var CACHE = 'caudal-v3';
var ASSETS = ['./','./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).catch(function(){}));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return; // nunca tocamos nada externo (no hay, pero por si acaso)

  var isHTML = req.mode === 'navigate' || (req.headers.get('accept')||'').indexOf('text/html') > -1;
  if(isHTML){
    // red primero → la última versión; caché si no hay conexión
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match('./index.html').then(function(r){ return r || caches.match('./'); });
      })
    );
    return;
  }
  // resto de recursos: caché primero, red de respaldo
  e.respondWith(
    caches.match(req).then(function(r){
      return r || fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      });
    })
  );
});
