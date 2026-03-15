self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.message,
    icon: "/crm-icon.png",
    badge: "/badge.png",
    requireInteraction: true, // ⭐ stays until user clicks
    data: {
      url: data.link || "/",
    },
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url));
});
