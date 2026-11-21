/* Panel Apamuy: solo para recibir avisos (notificaciones). No guarda nada en caché: el panel siempre trae lo último. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// ===== Avisos (notificaciones) que manda apamuy-servidor =====
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  const m = d.data || d, fuerte = m.fuerte === "1";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    // Si la app está abierta y a la vista, el aviso se muestra adentro (la app ya suena)
    const vista = cs.filter(c => c.visibilityState === "visible");
    if (vista.length) { vista.forEach(c => c.postMessage({ tipo: "aviso", ...m })); return; }
    return self.registration.showNotification(m.titulo || "Apamuy", { body: m.cuerpo || "", icon: "img/icon-192.png", badge: "img/icon-192.png", tag: m.tag || "apamuy", renotify: true,
      requireInteraction: fuerte, vibrate: fuerte ? [600, 200, 600, 200, 600, 200, 600] : [200, 100, 200], data: { url: m.url || "./" } });
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close(); const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs[0]; if (c) { c.focus(); return c.navigate ? c.navigate(url).catch(() => {}) : null; } return self.clients.openWindow(url); }));
});
