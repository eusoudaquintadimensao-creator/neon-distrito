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
