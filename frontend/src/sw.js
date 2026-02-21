import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

cleanupOutdatedCaches()

// self.__WB_MANIFEST is injected by vite-plugin-pwa during build
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

self.addEventListener('push', (event) => {
    let title = 'Quiz App Notification';
    let body = 'You have a new message!';
    let icon = '/vite.svg';
    let image = undefined;

    let url = '/notifications';

    if (event.data) {
        try {
            const data = event.data.json();
            title = data.title || title;
            body = data.body || body;
            icon = data.icon || icon;
            image = data.image || undefined;
            if (data.data && data.data.url) {
                url = data.data.url;
            }
        } catch (e) {
            body = event.data.text();
        }
    }

    const options = {
        body,
        icon,
        badge: icon,
        image,
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1,
            url: url
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            let matchingClient = null;

            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen) {
                    matchingClient = client;
                    break;
                }
            }

            if (matchingClient) {
                return matchingClient.focus();
            } else if (clientList.length > 0) {
                let focusedClient = clientList.find(c => c.focused);
                let clientToUse = focusedClient || clientList[0];
                return clientToUse.navigate(urlToOpen).then(client => client?.focus());
            } else {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
