// Service worker for the "Авансы" home-screen app.
//
// The app itself works fully offline (all data lives in localStorage, not
// in this cache) — this file only controls how the app's own HTML/CSS/JS
// get fetched, so that opening the app is instant and possible without
// a connection.
//
// IMPORTANT: the page (index.html) is fetched network-first whenever the
// phone is online, so a new version uploaded to GitHub Pages is picked up
// the next time the app is opened with internet access — no manual
// reinstalling needed. If there's no connection, the last cached copy is
// served instead so the app still opens.
var CACHE = "avansy-v2";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  var isPage = req.mode === "navigate" || req.destination === "document";

  if (isPage) {
    // Network-first for the app page itself, so updates show up right away.
    event.respondWith(
      fetch(req)
        .then(function (resp) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
          return resp;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match("./index.html");
          });
        })
    );
    return;
  }

  // Cache-first for static assets (icons, manifest) — these rarely change.
  event.respondWith(
    caches.match(req).then(function (cached) {
      return (
        cached ||
        fetch(req).catch(function () {
          return caches.match("./index.html");
        })
      );
    })
  );
});
