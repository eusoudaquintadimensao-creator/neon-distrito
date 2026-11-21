// KILL-SWITCH (21/11/2026, neon-dist-v23-2026-11-21-sem-sw): o Neon Distrito não usa mais service worker (igual ao Solara Bay).
// Motivo: o SW guardava 'index.html' no cache; na Cloudflare /neon-distrito/index.html responde 307 → /neon-distrito/,
// a resposta "redirecionada" no cache faz o Chrome recusar abrir a página (ERR_FAILED).
// Este SW: instala na hora, apaga os caches do Neon ('neon-dist-'), se desregistra e recarrega as abas abertas. Sem handler de fetch.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try { const ks = await caches.keys(); await Promise.all(ks.filter((k) => k.startsWith('neon-dist-')).map((k) => caches.delete(k))); } catch (err) { }
    try { await self.clients.claim(); } catch (err) { }
    try { await self.registration.unregister(); } catch (err) { }
    try { const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); cs.forEach((c) => { try { c.navigate(c.url); } catch (err) { } }); } catch (err) { }
  })());
});
