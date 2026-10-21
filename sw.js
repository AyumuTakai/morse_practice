// オフラインでも使えるようにするための Service Worker。
// 取得済みのファイルはキャッシュから即座に返し、通信できるときは裏で更新する
// (更新は、次に開いたときに反映される)。
const CACHE = "morse-practice-v4";
const FILES = [
  "./",
  "tree.css",
  "index.html",
  "tree.html",
  "listen.html",
  "check.html",
  "qcode.html",
  "procedure.html",
  "keisan-1.html",
  "review.html",
  "settings.html",
  "assets/common.css",
  "assets/common.js",
  "assets/tree-lib.js",
  "assets/data-qcode.js",
  "assets/data-proc.js",
  "assets/data-keisan.js",
  "manifests/index.webmanifest",
  "manifests/tree.webmanifest",
  "manifests/listen.webmanifest",
  "manifests/check.webmanifest",
  "manifests/qcode.webmanifest",
  "manifests/procedure.webmanifest",
  "manifests/keisan-1.webmanifest",
  "manifests/review.webmanifest",
  "manifests/settings.webmanifest",
  "icons/index-180.png",
  "icons/index-192.png",
  "icons/index-512.png",
  "icons/tree-180.png",
  "icons/tree-192.png",
  "icons/tree-512.png",
  "icons/listen-180.png",
  "icons/listen-192.png",
  "icons/listen-512.png",
  "icons/check-180.png",
  "icons/check-192.png",
  "icons/check-512.png",
  "icons/qcode-180.png",
  "icons/qcode-192.png",
  "icons/qcode-512.png",
  "icons/procedure-180.png",
  "icons/procedure-192.png",
  "icons/procedure-512.png",
  "icons/keisan-1-180.png",
  "icons/keisan-1-192.png",
  "icons/keisan-1-512.png",
  "icons/review-180.png",
  "icons/review-192.png",
  "icons/review-512.png",
  "icons/settings-180.png",
  "icons/settings-192.png",
  "icons/settings-512.png",
  "assets/portal.css",
  "kyu-4.html",
  "kyu-3.html",
  "kyu-2.html",
  "kyu-1.html",
  "manifests/kyu-4.webmanifest",
  "manifests/kyu-3.webmanifest",
  "manifests/kyu-2.webmanifest",
  "manifests/kyu-1.webmanifest",
  "icons/kyu-4-180.png",
  "icons/kyu-4-192.png",
  "icons/kyu-4-512.png",
  "icons/kyu-3-180.png",
  "icons/kyu-3-192.png",
  "icons/kyu-3-512.png",
  "icons/kyu-2-180.png",
  "icons/kyu-2-192.png",
  "icons/kyu-2-512.png",
  "icons/kyu-1-180.png",
  "icons/kyu-1-192.png",
  "icons/kyu-1-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
