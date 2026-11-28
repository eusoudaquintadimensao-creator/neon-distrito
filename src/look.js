// t470 fase 0: mapeamento de tons escolhido por jogo (teste A/B: ?tm=aces|neutral|agx). O ACES do three já divide a exposição por 0,6; Neutral/AgX não, então k = 1/0,6 mantém o brilho comparável.
import * as THREE from 'three';
const TMS = { aces: [THREE.ACESFilmicToneMapping, 1], neutral: [THREE.NeutralToneMapping, 0.95 / 0.6, 0.86], agx: [THREE.AgXToneMapping, 1 / 0.6, 1.12] }; /* [modo, fator de exposição, fator de saturação do grade] */
TMS.aces.push(1);
const DEFAULT = 'neutral'; // A/B Neon (t470): Neutral = neon magenta/ciano bem separados e menos barro que o ACES; AgX nublou a noite. Saturação do grade 0,86 (Neutral já satura o neon)
const q = (/[?&]tm=(aces|neutral|agx)/.exec(location.search) || [])[1];
export const TM_NAME = q || DEFAULT;
export const TM_K = TMS[TM_NAME][1], TM_SAT = TMS[TM_NAME][2] || 1;
export function applyToneMapping(renderer) { renderer.toneMapping = TMS[TM_NAME][0]; renderer.toneMappingExposure = 0.6 * TM_K; }
