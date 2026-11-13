const puppeteer = require('puppeteer-core');
const fs = require('fs');
const SH = '/workspace/jogo-cyberpunk/screenshots/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGE: ' + e.message));
  await page.goto('http://localhost:8766/?q=medium', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.MBD_READY === true', { timeout: 120000 });
  await page.evaluate(() => { const h = MBD.home(); if (h && h.data) h.data.intro = true; });
  await page.screenshot({ path: SH + 'neon-menu.png' });
  await page.click('#play'); await sleep(2500);
  // downtown night rain, look at towers
  await page.evaluate(() => { MBD.setHour(21.8); MBD.weather('chuva'); MBD.teleport(-420, 80, Math.PI * 0.7); MBD.sim(40, 1/30); });
  await sleep(2500);
  await page.screenshot({ path: SH + 'neon-nucleo.png' });
  // orla / avenue with holograms — Holofote is x=300
  await page.evaluate(() => { MBD.teleport(280, -40, Math.PI * 0.15); MBD.sim(40, 1/30); });
  await sleep(2200);
  await page.screenshot({ path: SH + 'neon-orla.png' });
  // loft
  await page.evaluate(() => { MBD.home().go(); MBD.setHour(22); });
  await page.evaluate(() => MBD.sim(20, 1/30));
  await sleep(2200);
  await page.screenshot({ path: SH + 'neon-loft.png' });
  const info = await page.evaluate(() => {
    const t = window.__G.traffic; const hovers = t ? t.cars.filter(c => c.hover).length : 0;
    const holos = (window.__G.world.dyn && window.__G.world.dyn.holos) ? window.__G.world.dyn.holos.length : 0;
    return { title: document.title, sw: null, hour: MBD.state.hour, weather: window.__G.env.weather, hovers, holos, draws: MBD.state.draws, key: Object.keys(localStorage) };
  });
  try { info.sw = await page.evaluate(async () => { const t = await (await fetch('./sw.js', { cache: 'no-store' })).text(); return (t.match(/neon-dist-v[0-9][^']+/)||[])[0]; }); } catch(e) { info.sw = e.message; }
  const e2 = errs.filter(e => !/favicon|ERR_FILE_NOT_FOUND|net::/.test(e));
  const R = { ok: e2.length===0 && info.holos>0, info, errs: e2 };
  fs.writeFileSync(SH+'neon-tour.json', JSON.stringify(R,1));
  console.log(JSON.stringify(R,null,1));
  await browser.close();
  process.exit(R.ok?0:1);
})().catch(e => { console.error(e); process.exit(2); });
