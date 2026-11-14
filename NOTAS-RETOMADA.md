# Neon Distrito — notas para retomar

Jogo separado, copiado do Solara Bay (com atualizações A e B: rotinas, Liga, presentes, Circuito Plasma) e retemado.
Nome original: **Neon Distrito** (megacidade 2088). Sem nomes/logos de Cyberpunk 2077 ou CD Projekt.

## Identidade
- Pasta: `/workspace/jogo-cyberpunk`
- Repo previsto: `eusoudaquintadimensao-creator/neon-distrito`
- Pages: `https://eusoudaquintadimensao-creator.github.io/neon-distrito/`
- Save: `nd-save-v1` (casa `nd-casa-v1`, corrida `nd-corrida-v1`, ruas `nd-ruas-v1`, presentes `nd-presentes-v1`, pista `nd-plasma-v1`)
- SW: `neon-dist-v1-2026-11-13`
- API de teste continua `window.MBD` (para reaproveitar test/serp.js, test/vida.js etc.)

## Tema aplicado
- Noite + chuva por padrão (21h20, weather chuva)
- HUD cyber (scanlines, cantos, cyan/magenta), logo “NEON DISTRITO / 2088”
- Anúncios holográficos originais (NEXO CORP, SINAL 2088, TORRE ÍON…)
- NPCs com viseira neon e roupas escuras
- Carros/motos voadores no trânsito (3–5, faixa a 9–16 m)
- Rádio procedural: Sinal 2088 (synthwave), Torre Industrial, Névoa FM
- Loft Prisma, Autódromo Íon, Circuito Plasma, Bar da Antena, Liga das Torres, app Sinal
- Ícones novos (skyline ND)

## Testes
- Servidor local: `python3 -m http.server 8766` em `/workspace/jogo-cyberpunk`
- `cd test && nice -n 19 node serp.js 1280 720 low d` (e iPhone 390 844, Android 844 390)
- `node vida.js` regressão
- 0 erros no console; um push após os verdes; verificar Pages ao vivo.

## Status (13/11 19:32 -03)
- Testes verdes: test/serp.js desk 1280×720, iPhone 390×844, Android paisagem 844×390 (0 erros, 0 falhas).
  test/neon-tour.js: título Neon Distrito, SW neon-dist-v1-2026-11-13, 10 hologramas, 5 carros voadores, chuva 22h, chave nd-casa-v1, 0 erros.
- Draw calls low ~68–69 no circuito. Fotos: screenshots/neon-{menu,nucleo,orla,loft}.png e serp-{d,i,al}-*.png.
- Commit 1a785c4 em https://github.com/eusoudaquintadimensao-creator/neon-distrito (público).
- Pages (main, root, workflow) ao vivo: https://eusoudaquintadimensao-creator.github.io/neon-distrito/
  verificado 19:34 -03 desk+iPhone: SW neon-dist-v1-2026-11-13, Bar da Antena, chuva 21h, 6 hologramas e 3 carros voadores no low, 0 erros, 0 HTTP 4xx.
  Fotos: screenshots/live-neon-{d,m}-{menu,nucleo,plasma}.png.

## Tarefa t328u (13/11, 21:00 -03) — direção no celular, rachas guiados, pista livre. COMMIT LOCAL, NÃO DAR PUSH (publicação não aprovada).
Feito (skills: input, game feel, UI/HUD, veículo):
- `src/driveui.js` (novo): tela CONTROLES com 3 cards originais (Tocar · Inclinar · Volante virtual), escolha salva em `nd-dirigir-v1`.
  Inclinar pede permissão no iOS (DeviceOrientationEvent.requestPermission) e calibra; zona morta radial 0.14 com reescala.
  Só vale DENTRO do veículo: deslizar ↑ = nitro, ↓ = drift. Limitador VEL (slider), Freio forte (segurar), Ré (toque liga/desliga),
  Farol alto — onde o polegar apoia. Botões de vidro semitransparentes; centro livre; HUD de direção mínimo (extras escondidos no carro).
  Abrir: 🎛️ no menu inicial, app Controles no celular, engrenagem no HUD.
- Botão entrar/chamar: 1 toque chama seu veículo (de qualquer lugar), 2 toques entra no mais próximo, aceita racha até ~50 m.
- Rachas de rua: setas (chevrons) no chão a cada 22 m e 3 por curva apontando a saída; bloqueios não violentos (cones, barreira,
  carro com giroflex) nas ruas erradas, com colisão; tudo removido no fim (`world.removeBox`).
- Batidas: só amassados cosméticos (dent + arranhão), o carro segue (deslize na parede mantém ≥82% da velocidade).
  Preso/fora da rota ~1 s → reaparece no trajeto com fade curto (racha, autódromo e circuito).
- Ao descer do carro, o joystick a pé volta.
- Pistas: arquibancada do autódromo agora ao lado da reta (|lat| ≥ 15,2 m > muro 11,5). Circuito: o Bar da Antena estava EM CIMA do traçado
  (s≈1040) → movido para (-530, 810), terraço olhando a curva; postes/muro de um trecho que caíam sobre outro trecho são pulados
  (`_nearOther`); fãs (ao redor do bar) agora fora da pista. `test/linecheck.js`: 0 obstáculos na linha nas duas pistas.
- Luz: exposição noturna 0.88 (antes 1.0), bloom mais contido (strength 0.26+night·0.2, threshold 2.32−night·0.62).
- Farol alto do jogador = SpotLight real; IA usa feixes falsos baratos (cone aditivo), orçamento 8/16 carros a 95 m.
- Notificação do Sinal desviada do slider VEL ao dirigir.
- SW: `neon-dist-v2-2026-11-13-dirigir`.
Testes (nice 19): `test/drive.js` PASS desk 1280×720, iPhone 390×844, iPhone paisagem 844×390, Android paisagem 915×412 — 0 erros de console.
  `test/serp.js` PASS (0 falhas, 0 erros). `test/linecheck.js` 0 hits (autódromo e circuito).
Fotos: screenshots/drv-d-{controles,hud,arrows,dent,beams,track,circuito}.png e drv-{i,il,al}-*.png (melhores: drv-d-controles, drv-il-hud,
  drv-d-arrows, drv-d-dent, drv-d-beams, drv-d-track, drv-d-circuito).
Para publicar SÓ após aprovação: git push origin main.
Neon específico: bloom do Loft Prisma corrigido (vidro 0.04+night·0.42, piscina 0.2+night·0.45, neon ×(0.55+night·0.6));
  falas de NPC que diziam "Solara"/"Ocean Drive" corrigidas (Avenida Holofote, "do Distrito"…) — 54 áudios antigos removidos,
  66 novos gerados com Kokoro (22 falas × f/m/s), assets/voz/index.json atualizado.

### Publicado t328 (13/11 21:09 -03) e correções t329 (21:12–21:30 -03)
- t328 publicado após aprovação (pt329u) e verificado ao vivo: SW neon-dist-v2-2026-11-13-dirigir, 0 erros desk+iPhone, tela CONTROLES ok.
- t329 (regra: toda publicação leva as correções achadas), iPhone em pé:
  1. CONTROLES: overlay rolável e centrado com segurança (align flex-start + margin:auto), cards compactos no celular (sem min-height 200),
     cabe sem rolar em 390×844, 844×390 e 375×667; título e Pronto sempre visíveis.
  2. Dica de direção ("Segure a esquerda…") vai para a faixa de cima (entre minimapa e relógio) e some sozinha após 4,5 s; não cobre o Freio.
  3. Avisos (#toast) e notificações (#note) ao dirigir ficam na faixa de cima (retrato abaixo dos ícones; paisagem no topo), centro livre.
- SW neon-dist-v3-2026-11-13-retrato. test/drive.js ganhou checagens t329 (título/Pronto, dica aparece/some/não cobre botões, avisos fora do centro e sem cobrir HUD).
  PASS desk 1280×720, iPhone 390×844, iPhone paisagem 844×390, Android paisagem 915×412 — 0 erros.

## t331 (22:30, 13/11) — drift longo/pêndulo, nitro 8 níveis + motor, faróis/lanternas, LED nas palmeiras, lojas, botão chamar→entrar (PUBLICADO, aprovado)
- Drift por deslize p/ baixo (input.kick): janela DRIFT_WIN 2,6 s (máx 3,4) que se estende segurando acelerador + direção para dentro;
  contra-esterço >0,14 s encadeia para o outro lado (pêndulo, dChain); grip traseiro volta em 1,25 s (recSlow). HUD #driftW (tempo + ×pêndulo).
- Nitro NITRO_STAGES=8 (HUD 8 segmentos, agora visível dirigindo no celular — removido o hide em main.js), MOTOR.lvl 0–3 na garagem (+9%/nível vel. máx.).
- Faróis do jogador: baixo 150/115 m, alto 520/240 m; lanternas com brilho vermelho aditivo (setupTailGlow) em jogador e IA; orçamento de luzes agora do mais perto p/ o mais longe.
- Cidade: anéis/fitas de LED nas palmeiras (InstancedMesh), térreos com vitrines/portas/toldos/letreiros originais (acendem à noite).
- Botão: 1º toque chama o carro, que para ~5 m À FRENTE (frontSpot, caminho seguro); próximo toque entra; toque de novo sai.
- CSS: corrigido seletor órfão (body.driving.touch #bDown,) que mostrava bPhoto sobre o freio.
- Testes: test/mech.js (novo) + drive/serp/linecheck em d/i/il/al: tudo PASS, 0 erros. SW neon-dist-v4-2026-11-13-drift.


## t332 (13/11, noite) — Skyway Maré: ponte de drift sobre o mar + 5 IAs em tandem + rádio pt-BR
- src/seabridge.js: laço fechado Catmull-Rom (centripetal) de ≈11,3 km a leste da ilha (x 468–1445, z −1024–1124), tabuleiro de 18 m
  (HALF_W 9) a ~9,5 m ±3 m de altura (loopH), 4 passagens N–S em S (senoide 95 m/440 m), 3 grampos e retorno com S suaves; raio mín. ≈21 m.
  Traçado gerado por tools/ponte_design.py (comprimento, raio, folga entre trechos e estimativa). Estimativa no ritmo de drift
  (DRIFT_PACE cruzeiro 20 m/s, lateral 6 m/s²): ≈9,6 min/volta (576 s). Piloto automático em grip (teste) anda ~90 km/h → ≈7,5 min.
- Rampa (340 m) continua a Ocean Drive (x 300) no extremo sul (GATE 300,632) com pórtico neon, faixa quadriculada na largada (s=0, ≈520,700).
  Palmeiras do parque sul fora do corredor da rampa (world.js, mesma sequência do R()). Píer da praia excluído do tabuleiro (onPier).
- Física: world.js HOOKS.grounds/surfs/map (groundY consulta o tabuleiro em x>280); fora do tabuleiro = mar (age como guarda-corpo).
- Malha: trechos de 60 amostras (~180 m) construídos sob demanda (≤1 por quadro), recorte por distância (baixa 340 m / média 560 / alta 820),
  LOD distante único (buildFar), guarda-corpos com neon, postes a cada 36 m com poça de luz aditiva, pilares a cada 48 m.
- Fluxo: botão 🌉 (qPonte) / tecla O → leva à rampa (no carro) ou chama o carro no pórtico (a pé). A até 50 m do pórtico o botão de ação vira
  "🌉 Aceitar" (celular) / tecla E (desktop, aviso no placar) → sessão de 2 voltas. Entrar no laço dirigindo também inicia.
- IA: 5 pilotos (Bia Volt (rc_jdm), Tchê Circuito (rc_muscle), Duda Plasma (rc_gt), Seu Valdo (picape), Lipe Neon (classic/hatch)), fantasmas (não bloqueiam, noEnter), elástico perto do jogador
  (slots −30…44 m, troca a cada 34–48 s), desvio lateral, tandem com balanço de drift, fumaça + marcas (fx.aiTrail, G.fx.aiMarks).
- Rádio (src/radio.js + src/radiolines.js, 63 falas, 5 vozes Kokoro pf_dora/pm_alex/pm_santa com velocidade/tom diferentes, gíria gaúcha/BR,
  sem nome de lugar → iguais nos dois jogos): mp3 em assets/voz/radio/<piloto>/<fnv>.mp3 + index.json (carregados só na 1ª sessão), filtro de
  rádio (passa-alta 420, pico 1,7 kHz, passa-baixa 3,2 kHz, saturação, chiado), legenda #radioSub abaixo do placar #ponteHud.
  Eventos: largada, drift do jogador, tandem colado, muro, ultrapassagens, meia volta, faltam 2 / última volta, chegada, recorde, respawn, papo.
  Gerar de novo: /workspace/kokoro-venv/bin/python tools/gen_radio.py tools/radio_bank.json assets/voz/radio (banco exportado de radioBank()).
- Sessão: pontos (G.drift), tempo de volta, recorde de volta e de pontos em localStorage 'nd-ponte-v1' {bestLap,bestScore,runs,laps};
  respawn automático na pista (contramão parado, batida parada, centro do carro fora do tabuleiro ou parado na borda >3 s; depois de >1,1 s).
  (Bug achado no teste iPhone paisagem: carro com o centro logo além da borda ficava travado sem respawn — corrigido + teste 'edge respawn'.)
- Também: mapa redesenhado após todos os sistemas (G.ui.refreshMap) — antes as marcações de corrida/circuito/ponte não apareciam no minimapa.
- G.camOverride (só testes/fotos): câmera aérea.
- Testes: test/ponte.js (traçado 8–12 km e estimativa, chamar→entrar→aceitar ≤50 m/não aos 75 m, rampa dirigível até o laço, 5 IAs ativas
  e em drift com fumaça/marcas, elástico, rádio (todas as 63 falas com mp3, fetch 200, legenda + áudio tocado), layout sem sobreposição,
  draw calls em baixa, respawn, 2 voltas + recorde salvo, 0 erros) em desk/iPhone/iPhone paisagem/Android paisagem + desk alta.
  Fotos: screenshots/ponte-<d|i|il|al>-{overview,tandem,radio,hud}.png. SW neon-dist-v5-2026-11-13-ponte.
- Resultado: test/ponte.js PASS em desk, iPhone 390×844, iPhone paisagem 844×390, Android paisagem 915×412 (baixa) e desk alta; 0 erros.
  Regressão mech/drive (d/i/il/al), serp e linecheck: PASS nos dois jogos. Draw calls na ponte (baixa) ~100–210, ~0,22–0,27 M triângulos.
- Publicado 13/11 23:33 -03 (commit 3ae45f2) e verificado ao vivo 23:37–23:40 -03: cache neon-dist-v5-2026-11-13-ponte ativo, live-drive + live-ponte PASS desk e iPhone, 0 erros.
  Fotos ao vivo: screenshots/live-ponte-{d,i}-{overview,tandem,radio,hud}.png. (Este registro é commit local; vai junto no próximo push.)

## t335 (14/11 00:20 -03) — EM ANDAMENTO, NÃO PUBLICAR (sem aprovação ainda; só commit local)
Pedido: 1) carro gruda na borda da ponte → deslizar/empurrar para fora; 2) batida "quebra" o carro → só amassados sutis;
3) botão "Iniciar corrida" da Liga da Madrugada sumiu → voltar (raio 50 m, mesmo passando dirigindo);
4) corridas de rua estilo clube da madrugada: 5 corredores (jogador + 4 IA, elástico), contagem, posições, checkpoints, GPS no minimapa
   e no chão, setas grandes "CURVA À ESQUERDA/DIREITA", ruas laterais fechadas (cones/carros/polícia) só durante a corrida;
5) ponte: moedas/dinheiro/prêmios, missões (zona de drift, radar de velocidade, tandem, quase-batida) ligadas à economia;
   cenário: cruzeiros, lanchas com esteira, balões gigantes, aviões (instanciado, barato);
6) helicóptero: modelo leve realista genérico com rotores girando, pilotagem com inércia, auto-nivelar, coletivo, guinada, toque.
Testes: d/i/il/al, 0 erros, regressão drive/mech/serp/ponte/linecheck + teste novo por item. SW pronto mas sem push.

### t335 progresso (14/11 -03)
- FEITO itens 1–4 + HUD: `_edgeSlide` (desliza/empurra na borda), pitch/roll protegidos (amostras >1,2 m ignoradas, auto-endireitar >0,6 rad por 1 s), amassados sutis (máx 12, rodas intocadas, sem encolher), rivais de rua 24 h + botão "🏁 Iniciar corrida" (toque/E até 50 m, passando), corrida com 5 (4 IA elástico + atravessa trânsito longe da vista), GPS (minimapa + faixa roxa no chão), `#turnCue` CURVA À ESQUERDA/DIREITA (top 134 px desktop / 236 touch / 130 touch-land), bloqueios só durante a corrida, 2º/3º lugar pagam. Watchdog do HUD a cada 0,5 s (`G.hudFixes`).
- Gravação: o gravador captura só o canvas → o vídeo NUNCA mostra o HUD DOM (explicar ao usuário).
- Teste: `node test/t335.js 1280 720 low d` (ONLY=edge,crash,btn,race,raceshot). PASS desktop nos dois jogos.
- FALTA: item 5 (ponte: moedas/prêmios, missões, cenário), item 6 (helicóptero), matriz i/il/al, regressões, bump SW (sem push).

### t335 itens 5–6 (14/11 -03)
- Item 5 `src/bridgefun.js` (BridgeFun, `G.ponte.fun`, atualizado no fim de `SeaBridge.update`): moedas $5 (InstancedMesh), maços $50, 6 caixas-prêmio ($150–400 ou nitro cheio), reaparecem (120/240/420 s); zonas de drift (4×300 m, meta 1200 pts, paga pts/15), radares (4, ≥120 km/h paga (km/h−100)×1,5, recorde), corrente de tandem (+$20×elo a cada 2,5 s, máx $100), quase-batida (+$15). Pop `#bfPop`, barra `#bfZone`, rádio reaproveita eventos (playerDrift/record/tandemClose). Cenário instanciado: navios (1/2/3), lanchas com esteira (3/5/8), balões gigantes (3/5/7), aviões (1/2/2). 14 meshes no total. Dados em `<PONTE.key>-fun`.
- Item 6 `src/heli.js`: modelo genérico mesclado por material (≤24 meshes incl. luzes), rotor de 3 pás + cauda de 2 (discos de borrão), cíclico por atitude com inércia/arrasto, auto-nivelar + flare até pairar, curva coordenada, coletivo com trava de altitude + efeito solo, limites pitch/roll. `body.heli` deixa joystick/⤒/⤓ transparentes; `#heliHud` (horizonte, ALT, km/h, V/S).
- SW: solara-v14-2026-11-14-t335 / neon-dist-v6-2026-11-14-t335 (NÃO publicado). Ao publicar: atualizar `/workspace/miami-test/live-drive.js` (sw v14/v6).
- Teste: `node test/t335.js W H low tag` (ONLY=edge,crash,btn,race,raceshot,fun,heli). Matriz d/i/il/al PASS nos dois jogos.
- Final t335 (14/11 ~01:45 -03): t335 d/i/il/al PASS; ponte d/dh/i/il/al PASS (teste de borda agora aceita "respawn OU sai andando livre"); mech/drive d/i/il/al PASS; serp PASS; linecheck 0 hits. 0 erros de console. Commits locais, NADA publicado (aguardando aprovação). Notas locais t332 (e8ebc1d/16351aa) vão junto no próximo push aprovado.

## Publicado (14/11/2026, ~01:50 Brasília)
- Lote t335 + correção do SW publicado no GitHub Pages. O SW agora só apaga caches da própria família (prefixo antes de "v"), porque o domínio é compartilhado (github.io com o Mestre Solar; site novo com os dois jogos). Conferido no ar desktop e iPhone (`/workspace/miami-test/live-drive.js`): 0 erros.
- Os dois jogos também estão no site **MIAMI DRIVE SOLARA 2088**: https://miami-drive-solara-2088.conhecimento-solar.workers.dev (`/solara-bay/` e `/neon-distrito/`). O projeto do site fica em `/workspace/miami-drive-site` (ver NOTAS.md lá). Depois de mudar o jogo: push aqui + `build.sh` e publicar o site de novo.
- Os testes `live-drive.js` aceitam `SITE=<url do site>` para testar a cópia do site.
