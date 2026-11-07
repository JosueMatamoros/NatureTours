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
  const options = {
    body: data.body || "",
    icon: "/app/icon-192.png", // logo a color (lado izquierdo de la notificación)
    badge: "/app/badge-96.png", // silueta blanca para la barra de estado (Android)
    tag: data.tag,
    renotify: Boolean(data.tag),
    timestamp: Date.now(),
    vibrate: [90, 50, 90],
    data: { url: data.url || "/asistencia", whatsapp: data.whatsapp || null },
  };
  // Android: foto del tour y botones de acción (iOS los ignora).
  if (data.image) options.image = data.image;
  if (Array.isArray(data.actions) && data.actions.length) options.actions = data.actions.slice(0, 2);

  event.waitUntil(self.registration.showNotification(title, options));
});

async function openOrFocus(url) {
  const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const w of wins) {
    if (new URL(w.url).origin === self.location.origin && "focus" in w) {
      await w.focus();
      if ("navigate" in w) return w.navigate(url);
      return;
    }
  }
  return self.clients.openWindow(url);
}

// Al tocar la notificación (o un botón): WhatsApp del cliente, o abrir la app
// en la pantalla correspondiente.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  if (event.action === "whatsapp" && data.whatsapp) {
    event.waitUntil(self.clients.openWindow(data.whatsapp));
    return;
  }
  const url = new URL(data.url || "/asistencia", self.location.origin).href;
  event.waitUntil(openOrFocus(url));
});
