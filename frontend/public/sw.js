// Service worker de la app interna (PWA): solo notificaciones push.
// No intercepta peticiones (sin handler de fetch), así que no cachea nada
// ni afecta al sitio público.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Nature Tours", body: event.data?.text() };
  }
  const title = data.title || "Nature Tours";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/app/icon-192.png",
      badge: "/app/icon-192.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/asistencia" },
    })
  );
});

// Al tocar la notificación: enfocar la app si ya está abierta, o abrirla.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/asistencia", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          await w.focus();
          if ("navigate" in w) return w.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })()
  );
});
