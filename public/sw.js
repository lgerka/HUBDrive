// Минимальный service worker: нужен, чтобы Chrome/Android считал сайт устанавливаемым,
// и чтобы приложение открывалось с офлайн-заглушкой вместо ошибки браузера.
const CACHE = 'hubdrive-shell-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
    // Без skipWaiting: новая версия ждёт, пока пользователь нажмёт «Обновить»,
    // чтобы страница не перезагружалась у него под руками
    event.waitUntil(
        caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL, '/icons/icon-192.png']))
    );
});

// Кнопка «Обновить» просит воркер активироваться немедленно
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Только навигация: сеть в приоритете (каталог должен быть свежим), офлайн — заглушка.
self.addEventListener('fetch', (event) => {
    if (event.request.mode !== 'navigate') return;
    event.respondWith(
        fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
});
