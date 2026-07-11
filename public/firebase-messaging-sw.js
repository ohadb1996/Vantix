// Vantix customer push — background notifications (app closed / in background)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyAfVREp9N4dWIe_ytAJ5CUyMlnmPH_YdgQ',
  authDomain: 'maxdeliveries.firebaseapp.com',
  databaseURL: 'https://maxdeliveries-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'maxdeliveries',
  storageBucket: 'maxdeliveries.firebasestorage.app',
  messagingSenderId: '474750510207',
  appId: '1:474750510207:web:733a03b17d5c2ed4654b4a',
  measurementId: 'G-6JLHHV27SC',
};

const GENTLE_VIBRATE = [0, 120, 80, 120];

function orderTrackingPath(orderId) {
  return orderId ? '/orders/' + orderId : '/orders';
}

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    const data = payload.data || {};
    const orderId = data.orderId || data.order_id || '';
    const title = payload.notification?.title || data.title || 'Vantix';
    const body = payload.notification?.body || data.body || 'עדכון בהזמנה שלך';

    const notificationOptions = {
      body: body,
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: orderId ? 'vantix-order-' + orderId : 'vantix-notification',
      vibrate: GENTLE_VIBRATE,
      data: {
        orderId: orderId,
        url: data.url || orderTrackingPath(orderId),
        type: data.type || '',
      },
    };

    return self.registration.showNotification(title, notificationOptions);
  });

  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const orderId = event.notification.data?.orderId;
    const path = event.notification.data?.url || orderTrackingPath(orderId);

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if ('focus' in client) {
            client.focus();
            client.postMessage({ type: 'VANTIX_PUSH_NAVIGATE', path: path });
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(path);
        }
      })
    );
  });
} catch (e) {
  console.error('[vantix-messaging-sw]', e);
}
