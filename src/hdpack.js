// t470 fase 0: PORTÃO DO PACOTE HD. Só a infraestrutura: nada é baixado hoje (HD_PACKS vazio). Pacotes opcionais (texturas PBR, avatar herói, janelas)
// só carregam DEPOIS do jogo pronto, em nível médio/alto, rede 4g, sem "economia de dados", sem modo leve ligado e com o jogo fluido.
// Teste/forçar: ?hd=1 (ignora rede/memória, ainda exige nível médio+), ?hd=0 (nunca).
export const HD_PACKS = []; // { id, urls:[...], onLoad(blobs) } — ex.: { id: 'pbr-chao', urls: ['assets/hd/asfalto.ktx2'], onLoad(r) { ... } }

// decisão pura (testável): env = { level, saveData, type, memory, lightened, fps, ready, force, off }
export function hdDecide(e) {
  if (e.off) return { ok: false, why: 'desligado (?hd=0)' };
  if (!e.ready) return { ok: false, why: 'jogo ainda não está pronto' };
  if (e.level === 'low') return { ok: false, why: 'nível leve' };
  if (e.lightened) return { ok: false, why: 'modo leve ligado durante o jogo' };
  if (e.force) return { ok: true, why: 'forçado (?hd=1)' };
  if (e.saveData) return { ok: false, why: 'economia de dados' };
  if (e.type !== '4g') return { ok: false, why: 'rede ' + (e.type || 'desconhecida') + ' (precisa 4g)' };
  if (e.memory && e.memory < 4) return { ok: false, why: 'pouca memória (<4 GB)' };
  if (e.fps && e.fps < 45) return { ok: false, why: 'jogo ainda pesado (fps ' + Math.round(e.fps) + ')' };
  return { ok: true, why: 'ok' };
}
export function hdEnv(G, Q, fps) {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {}; const m = /[?&]hd=(0|1)/.exec(location.search);
  return { level: Q.level, saveData: !!c.saveData, type: c.effectiveType || '', memory: navigator.deviceMemory || 0, lightened: !!G.lightened, fps, ready: !!G.ready, force: !!m && m[1] === '1', off: !!m && m[1] === '0' };
}
export function setupHD(G, Q, getFps) {
  const S = { state: 'espera', why: '', loaded: [], bytes: 0, tries: 0, packs: HD_PACKS };
  G.hd = S; let t0 = null;
  async function load() {
    for (const P of HD_PACKS) {
      if (S.loaded.includes(P.id)) continue;
      try { const rs = await Promise.all(P.urls.map(u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }))); S.bytes += rs.reduce((a, b) => a + b.byteLength, 0); await P.onLoad(rs); S.loaded.push(P.id); } catch (e) { console.info('pacote HD', P.id, 'falhou:', e && e.message); }
    }
    S.state = 'carregado';
  }
  function tick() {
    if (S.state === 'carregando' || S.state === 'carregado') return;
    const d = hdDecide(hdEnv(G, Q, getFps())); S.why = d.why;
    if (!d.ok) { S.state = d.why.startsWith('desligado') ? 'desligado' : 'bloqueado'; return; }
    if (!HD_PACKS.length) { S.state = 'liberado (sem pacotes)'; return; }
    S.state = 'carregando'; load();
  }
  /* espera 4 s de ociosidade depois de pronto; reavalia a cada 10 s (rede/fps mudam), até 30 vezes */
  const ids = setInterval(() => { if (!G.ready || !G.started) return; if (t0 === null) t0 = performance.now(); if (performance.now() - t0 < 4000) return; if (++S.tries > 30 || S.state === 'carregado') { clearInterval(ids); return; } tick(); }, 10000);
  S.tick = tick; return S;
}
