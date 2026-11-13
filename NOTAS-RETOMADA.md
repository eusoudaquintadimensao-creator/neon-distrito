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
- Repo e Pages: a criar e publicar em um único push após este ponto.
