importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Notification click pe uska page kholo (fallback agar fcm_options.link na chale)
self.addEventListener('notificationclick', (event) => {
  const data = (event.notification && event.notification.data) || {};
  const url = (data.FCM_MSG && data.FCM_MSG.data && data.FCM_MSG.data.url) || data.url;
  if (!url) return;
  event.notification.close();
  event.waitUntil(self.clients.openWindow(url));
});

firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
firebase.messaging();
