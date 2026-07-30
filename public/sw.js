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

// Пуш из приложения: показываем системное уведомление на телефоне
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload = {};
    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'HUBDrive', body: event.data.text() };
    }

    const title = payload.title || 'HUBDrive';
    const options = {
        body: payload.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        image: payload.image,
        // Метка ?src=push нужна аналитике: так видно переходы именно из уведомлений
        data: { url: payload.url || '/app' },
        tag: payload.tag,
        renotify: Boolean(payload.tag),
        vibrate: [80, 40, 80],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Тап по уведомлению: открываем нужный экран, а не новую копию приложения
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = (event.notification.data && event.notification.data.url) || '/app';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(target);
                    return client.focus();
                }
            }
            return self.clients.openWindow(target);
        })
    );
});
