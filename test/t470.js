// t470 fase 0: tone mapping do jogo, meshopt nos avatares, portão do pacote HD, resolução dinâmica com histerese. Uso: PORT=8767 node test/t470.js W H tag
const puppeteer = require('puppeteer-core'); const fs = require('fs');
const PORT = process.env.PORT || 8765, KEY = process.env.KEYP || 'mbd', GAME = process.env.GAME || 'solara', BASE = (process.env.BASE || `http://localhost:${PORT}/`).replace(/\/?$/, '/');
const [,, W = 1280, H = 720, out = 'd'] = process.argv; const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const fail = []; const ck = (n, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (info !== undefined ? ' ' + JSON.stringify(info).slice(0, 500) : '')); if (!ok) fail.push(n); };
  // 1) decisão do portão HD (função pura, sem navegador)
  const src = fs.readFileSync(__dirname + '/../src/hdpack.js', 'utf8'); fs.writeFileSync('/tmp/hdpack-t470.mjs', src);
  const { hdDecide } = await import('/tmp/hdpack-t470.mjs'); const base = { level: 'medium', saveData: false, type: '4g', memory: 4, lightened: false, fps: 60, ready: true };
  const D = (o) => hdDecide({ ...base, ...o }).ok;
  ck('portão HD: médio+4g+pronto abre', D({}) === true);
  ck('portão HD: alto abre; leve fecha', D({ level: 'high' }) === true && D({ level: 'low' }) === false);
  ck('portão HD: saveData, 3g/desconhecida, pouca memória, fps baixo, modo leve ligado, não pronto fecham', !D({ saveData: true }) && !D({ type: '3g' }) && !D({ type: '' }) && !D({ memory: 2 }) && !D({ fps: 30 }) && !D({ lightened: true }) && !D({ ready: false }));
  ck('portão HD: ?hd=1 força (menos nível leve/pronto), ?hd=0 desliga', D({ force: true, saveData: true, type: '2g' }) === true && D({ force: true, level: 'low' }) === false && D({ off: true }) === false);
  const mobile = Math.min(+W, +H) < 600;
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const run = async (query, dsf) => {
    const page = await browser.newPage(); await page.setViewport({ width: +W, height: +H, deviceScaleFactor: dsf || 1, isMobile: mobile, hasTouch: mobile });
    const errs = [], reqs = []; page.on('console', m => { if (m.type() === 'error' && !/404|favicon/.test(m.text())) errs.push(m.text()); }); page.on('pageerror', e => errs.push('PAGE: ' + e.message)); page.on('request', r => reqs.push(r.url()));
    await page.goto(BASE + query, { waitUntil: 'load', timeout: 180000 });
    await page.evaluate((K) => localStorage.setItem(K + '-casa-v1', JSON.stringify({ intro: true, visits: 1 })), KEY);
    await page.waitForFunction('window.MBD_READY === true', { timeout: 240000 });
    await page.evaluate(() => { MBD.home().data.intro = true; }); await page.click('#play'); await sleep(2500);
    return { page, errs, reqs };
  };
  // 2) meshopt nos avatares + tone mapping + portão HD ao vivo
  let R = await run('?q=medium');
  const ev = (f, ...a) => R.page.evaluate(f, ...a);
  await R.page.waitForFunction('MBD.state.avatar3d === true', { timeout: 120000, polling: 300 }).catch(() => { });
  const av = await ev(async () => { const G = window.__G; const out = {}; for (const id of ['ele', 'ela']) { const old = G.hero.rig; G.setAvatar(id); for (let i = 0; i < 80 && (G.hero.rig === old || !G.hero.rig); i++) await new Promise(r => setTimeout(r, 250)); MBD.sim(2, 1 / 30); const R = G.hero.rig; let bones = 0, skinned = 0, tris = 0; R && R.model.traverse(o => { if (o.isBone) bones++; if (o.isSkinnedMesh) { skinned++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); out[id] = { has: !!R, bones, skinned, tris: Math.round(tris), masc: !!(R && R.model.userData.masc), acts: R && R.acts ? Object.keys(R.acts).length : null }; } out.tm = G.renderer.toneMapping; out.exp = +G.renderer.toneMappingExposure.toFixed(2); out.hd = G.hd && G.hd.state; out.why = G.hd && G.hd.why; return out; });
  const glbs = R.reqs.filter(u => /avatars\/.*\.glb/.test(u)).map(u => u.split('/').pop());
  ck('avatar carrega GLB meshopt (.mo.glb) e não o GLB comum', glbs.length >= 2 && glbs.every(n => /\.mo\.glb$/.test(n)), glbs);
  ck('avatar com meshopt: Davi e Luna com esqueleto 31+ ossos, malha de pele ~1.800 triângulos; Davi com porte masculino', av.ele.has && av.ela.has && av.ele.bones >= 31 && av.ela.bones >= 31 && av.ele.tris > 1500 && av.ela.tris > 1500 && av.ele.masc && !av.ela.masc && av.ele.acts >= 7 && av.ela.acts >= 7, av);
  ck('tone mapping ativo é o escolhido (look.js)', av.tm > 0, { tm: av.tm, exp: av.exp });
  ck('portão HD existe e decidiu (sem pacotes ainda)', typeof av.hd === 'string', { hd: av.hd, why: av.why });
  const dec = await ev(() => { const G = window.__G; G.hd.tick(); return { s: G.hd.state, w: G.hd.why, p: MBD.perf().hd, packs: G.hd.packs.length, bytes: G.hd.bytes }; });
  ck('portão HD: tick sem pacotes não baixa nada', dec.packs === 0 && dec.bytes === 0, dec);
  ck('sem erros no console (meshopt/tone mapping/HD)', R.errs.length === 0, R.errs.slice(0, 3));
  await R.page.close();
  // 3) ?hd=0 desliga; nível leve bloqueia
  R = await run('?q=low&hd=0'); const lo = await R.page.evaluate(() => { const G = window.__G; G.hd.tick(); return { s: G.hd.state, w: G.hd.why }; });
  ck('?hd=0 / nível leve: portão fechado', /desligado|bloqueado/.test(lo.s), lo); await R.page.close();
  // 4) resolução dinâmica: histerese, sem sobe-e-desce
  R = await run('?q=medium&fxlock', 2); const hy = await R.page.evaluate(() => {
    const G = window.__G; G.recording = false; G.adaptReset(); const tr = []; let t = 1000; const step = (f, ms, n) => { for (let i = 0; i < n; i++) { t += 1; tr.push(G.adaptTest(f, ms, t)); } };
    const p0 = G.adaptTest(60, 16, t); step(60, 16, 20); const steady = tr[tr.length - 1];
    step(30, 33, 4); const afterDrop = tr[tr.length - 1];
    step(60, 16, 40); const afterUp1 = tr[tr.length - 1];       // espera 25 s antes de subir
    step(30, 33, 3); const afterDrop2 = tr[tr.length - 1];     // subiu e caiu de novo: sobe-e-desce
    step(60, 16, 70); const afterWait = tr[tr.length - 1];     // dentro de 90 s não passa do teto
    step(60, 16, 100); const late = tr[tr.length - 1];
    let changes = 0; for (let i = 1; i < tr.length; i++) if (tr[i] !== tr[i - 1]) changes++;
    step(60, 40, 6); const spiky = tr[tr.length - 1]; // média boa, percentil 90 ruim (engasgos) não pode subir
    G.adaptReset(); return { p0, steady, afterDrop, afterUp1, afterDrop2, afterWait, late, changes, spiky, up: MBD.perf().adUpWait };
  });
  ck('resolução: estável em 60 fps não mexe', hy.steady === hy.p0, hy);
  ck('resolução: cai com fps baixo, depois de 25 s fluidos sobe um degrau (0,05)', hy.afterDrop < hy.steady && hy.afterUp1 > hy.afterDrop && hy.afterUp1 - hy.afterDrop <= 0.101, hy);
  ck('resolução: se subir causou queda, não tenta de novo o mesmo degrau em 90 s (sem pisca)', hy.afterWait <= hy.afterDrop2 + 0.001 || hy.afterWait < hy.afterUp1, hy);
  ck('resolução: poucas trocas no total (<= 8)', hy.changes <= 8, { changes: hy.changes });
  ck('resolução: engasgos (percentil 90 ruim) com média boa não sobem', hy.spiky <= hy.late + 0.001, hy);
  ck('sem erros no console (histerese)', R.errs.length === 0, R.errs.slice(0, 3));
  await R.page.close(); await browser.close();
  console.log((fail.length ? 'FAIL ' : 'PASS ') + out + (fail.length ? ' ' + fail.join(' | ') : '')); process.exit(fail.length ? 1 : 0);
})().catch(e => { console.log('FAIL erro', e.message); process.exit(1); });
