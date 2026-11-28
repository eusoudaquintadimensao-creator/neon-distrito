// t467: (1) recado da Solara não cobre o minimapa/botões; (2) fala de pedestre (dirigindo e a pé) não fica embaixo de botão; (3) avatares masculinos com porte e armadura de placas. Uso: node test/t467.js W H tag
const puppeteer = require('puppeteer-core'); const fs = require('fs');
const PORT = process.env.PORT || 8765; const KEY = process.env.KEYP || 'mbd'; const GAME = process.env.GAME || 'solara';
const [,, W = 390, H = 844, out = 'i'] = process.argv; const mobile = Math.min(+W, +H) < 600;
const SH = '/workspace/t467/'; fs.mkdirSync(SH, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage(); await page.setViewport({ width: +W, height: +H, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  if (mobile) await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36');
  const errs = []; page.on('console', m => { if (m.type() === 'error' && !/404|favicon/.test(m.text())) errs.push(m.text()); }); page.on('pageerror', e => errs.push('PAGE: ' + e.message));
  const fail = []; const ck = (n, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (info !== undefined ? ' ' + JSON.stringify(info).slice(0, 600) : '')); if (!ok) fail.push(n); };
  await page.goto(`http://localhost:${PORT}/?q=low`, { waitUntil: 'load' });
  await page.evaluate((K) => { localStorage.setItem(K + '-casa-v1', JSON.stringify({ intro: true, visits: 1 })); }, KEY);
  await page.waitForFunction('window.MBD_READY === true', { timeout: 180000 });
  await page.evaluate(() => { MBD.home().data.intro = true; }); await page.click('#play'); await sleep(1500);
  const ev = (f, ...a) => page.evaluate(f, ...a);
  await ev(() => {
    window.__vis = (el) => { if (!el || el.hidden) return null; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return null; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? r : null; };
    // controles do HUD que nada pode cobrir
    window.__hud = () => [...document.querySelectorAll('#hud button, #mapw, #eyes button, #topR, #pauseBtn, #backBtn, #eyeMenu button, [id^="b"][id$="Btn"]')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').map(e => ({ id: e.id || e.className, r: __vis(e) })).filter(o => o.r);
    window.__ov = (r, list) => list.filter(o => Math.min(r.right, o.r.right) - Math.max(r.left, o.r.left) > 2 && Math.min(r.bottom, o.r.bottom) - Math.max(r.top, o.r.top) > 2).map(o => o.id);
    window.__car = () => { const G = window.__G; if (G.player.vehicle) return G.player.vehicle; MBD.teleport(300, -150, 0); MBD.sim(3, 1 / 30); MBD.onActTap(1); for (let i = 0; i < 150 && G.carCall; i++) MBD.sim(1, 1 / 30); MBD.onActTap(1); MBD.sim(3, 1 / 30); return G.player.vehicle; };
  });
  let r;
  // 1+2) para cada estado dos olhos (fechado, 👁², 👁³): recado da Solara e fala de pedestre dirigindo não cobrem botões
  await ev(() => { window.__car(); MBD.sim(10, 1 / 30); });
  for (const eye of ['', '2', '3']) {
    for (let i = 0; i < 160; i++) { const busy = await ev(() => !!document.querySelector('.solNote') || !!window.__G.solaraHi); if (!busy) break; await sleep(250); }
    await ev((eye) => { const m = document.getElementById('eyeMenu'); if (eye) { if (!m || m.hidden || m.dataset.n !== eye) document.getElementById('bEye' + eye).click(); } else if (m && !m.hidden) { const b = document.getElementById('bEye' + (m.dataset.n || '2')); b && b.click(); } MBD.sim(3, 1 / 30); }, eye);
    await sleep(300);
    // fila de recados: espera esvaziar e manda o de teste
    for (let i = 0; i < 160; i++) { const busy = await ev(() => !!document.querySelector('.solNote') || !!window.__G.solaraHi); if (!busy) break; await sleep(250); }
    await ev(() => window.__G.solaraNote('Recado de teste da Solara para conferir o espaço do minimapa e dos botões', { ms: 12000 }));
    if (eye && +H > +W) { await sleep(1200); const w = await ev(() => ({ shown: [...document.querySelectorAll('.solNote')].some(e => e.textContent.includes('Recado de teste')), menu: !document.getElementById('eyeMenu').hidden })); ck(`1 celular em pé com menu ${eye} aberto: recado espera o menu fechar`, !w.shown || !w.menu, w); await ev(() => window.__G.eyes.close()); }
    let r; for (let i = 0; i < 200; i++) { await sleep(150); r = await ev(() => { const n = [...document.querySelectorAll('.solNote:not(.out)')].find(e => e.textContent.includes('Recado de teste')); if (!n || n.getAnimations().some(a => a.playState === 'running') || document.getAnimations().some(a => a.playState === 'running' && a.transitionProperty === 'translate')) return null; const nr = __vis(n); return { nr: [nr.left, nr.top, nr.right, nr.bottom].map(Math.round), ov: __ov(nr, __hud()).concat((() => { const m = document.getElementById('eyeMenu'); if (!m || m.hidden) return []; const L = __hud().filter(o => /^(mapw|bClean|bEye2|bEye3|topR|edgeCol)$/.test(o.id)); return [...m.children].flatMap(b => { const q = __vis(b); return q ? __ov(q, L).map(x => 'menu×' + x) : []; }); })()), menu: !document.getElementById('eyeMenu').hidden, pushed: window.__G.notePushed, dbg: ['mapw','bClean','eyes','topR'].map(id => { const e = document.getElementById(id); return e ? id + '<' + (e.parentElement && e.parentElement.id) + ' t=' + e.style.translate + ' np=' + e._np + ' top=' + Math.round(e.getBoundingClientRect().top) : id + ':none'; }), off: [n.offsetTop, n.offsetHeight, n.offsetLeft, n.offsetWidth] }; }); if (r) break; }
    ck(`1 recado da Solara (carro, olho ${eye || '1'}) não cobre minimapa nem botões`, r && !r.ov.length, r || 'sem nota');
    await page.screenshot({ path: `${SH}t467-${GAME}-${out}-recado-olho${eye || '1'}.png` });
    await ev(() => { for (const el of document.querySelectorAll('.solNote')) { el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 5, clientY: 5 })); el.dispatchEvent(new PointerEvent('pointerup', { clientX: 5, clientY: 5 })); } });
    await ev(() => { document.querySelectorAll('.solNote').forEach(e => e.remove()); const G = window.__G; G.ui.pedBubble({ x: G.player.x + 3, z: G.player.z + 3, per: 'turista' }, 'Que lindeza de carro, vivente! Tri bonito!'); MBD.sim(2, 1 / 30); G.ui.frame(0.016, MBD.cam()); });
    await sleep(300);
    r = await ev(() => { window.__G.ui.frame(0.016, MBD.cam()); const s = __vis(document.getElementById('say')); return { sr: s && [s.left, s.top, s.right, s.bottom].map(Math.round), ov: s ? __ov(s, __hud()) : ['sem fala'] }; });
    ck(`2 fala de pedestre dirigindo (olho ${eye || '1'}) não fica embaixo de botão`, !r.ov.length, r);
    await page.screenshot({ path: `${SH}t467-${GAME}-${out}-fala-olho${eye || '1'}.png` });
  }
  await ev(() => { const m = document.getElementById('eyeMenu'); if (m && !m.hidden) { const b = document.getElementById('bEye' + (m.dataset.n || '3')); b && b.click(); } MBD.sim(2, 1 / 30); });
  // 3) a pé: fala presa à cabeça também desvia dos botões (pedestre no canto de cima à esquerda)
  r = await ev(() => { const G = window.__G; const v = G.player.vehicle; if (v) { v.vx = v.vz = v.vf = 0; G.leaveCar(true); } MBD.teleport(300, -150, 0); MBD.sim(5, 1 / 30); const cam = MBD.cam(); const res = [];
    for (const [sx, sy] of [[0.12, 0.12], [0.5, 0.1], [0.9, 0.15], [0.1, 0.5]]) { const v3 = G.tmpV.set(sx * 2 - 1, 1 - sy * 2, 0.9).unproject(cam); const p = { x: v3.x, z: v3.z, per: 'turista' }; G.ui.pedBubble(p, 'Bah, que dia lindo na orla, tchê!'); G.ui._sayP = p; G.ui.frame(0.016, cam); MBD.sim(1, 1 / 30); const s = __vis(document.getElementById('say')); res.push(s ? __ov(s, __hud()) : []); }
    return { res }; });
  ck('3 fala a pé não fica embaixo de botão', r.res.every(x => !x.length), r);
  // 4) avatar masculino: porte e armadura
  r = await ev(async () => { const G = window.__G; const out = {}; for (const id of ['ele', 'solar', 'colosso']) { const old = G.hero.rig; G.setAvatar(id); for (let i = 0; i < 80 && (G.hero.rig === old || !G.hero.rig); i++) await new Promise(r => setTimeout(r, 250)); MBD.sim(2, 1 / 30); const R = G.hero.rig; let plates = 0; R && R.model.traverse(o => { if (o.isMesh && !o.isSkinnedMesh) plates += o.userData.merged || 1; }); out[id] = { masc: !!(R && R.model.userData.masc), plates }; } { const old = G.hero.rig; G.setAvatar('ela'); for (let i = 0; i < 80 && G.hero.rig === old; i++) await new Promise(r => setTimeout(r, 250)); } out.ela = { masc: !!G.hero.rig.model.userData.masc }; return out; });
  ck('4 Davi/heróis com porte masculino e armadura; Luna sem mudança', r.ele.masc && r.solar.masc && r.solar.plates >= 30 && r.colosso.plates >= 30 && !r.ela.masc, r);
  ck('sem erros no console', !errs.length, errs.slice(0, 5));
  console.log(fail.length ? `FAIL ${out} ${fail.join(' | ')}` : `PASS ${out}`); await browser.close(); process.exit(fail.length ? 1 : 0);
})().catch(e => { console.log('ERRO', e.message); process.exit(2); });
