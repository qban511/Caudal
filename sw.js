/* Caudal · kill-switch
   Este service worker ya NO cachea nada. Su única función es ELIMINAR cualquier
   service worker antiguo (y su caché) que se hubiera quedado "pegado" sirviendo una
   versión vieja de la app. Se autodestruye tras ejecutarse una vez. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.registration.unregister(); })
      .then(function(){ return self.clients.matchAll(); })
      .then(function(clients){ clients.forEach(function(c){ try{ c.navigate(c.url); }catch(e){} }); })
  );
});
