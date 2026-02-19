// Service worker for push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "SEU Status";
    const options = {
      body: data.body || "حالة الخدمة تغيرت",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      dir: "rtl",
      lang: "ar",
      data: data.url || "/",
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error("Push notification error:", e);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(clients.openWindow(url));
});
