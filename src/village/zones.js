// 돔 안 네 구역 (아틀란티스 계획서 §3.4, AT-6). 칸 좌표는 그대로라 길·나무·깃발·영향권·저장이 전부 유효하다.
// 구역은 바닥 색과 이름 한 줄일 뿐 규칙이 아니다 — 어느 구역에 무엇을 지어도 똑같이 돈다(섬 계획 §12 「강제 없음」, 계획서 결정 5).
const FILES = 'abcdefgh';

export const ZONES = {
  plaza: { ko: '빛의 광장', en: 'Plaza of Light', icon: '✦', tint: 0xf4ecd8, mix: 0.6 },
  farm: { ko: '해초 농장', en: 'Kelp Farm', icon: '🌾', tint: 0x9fdc5a, mix: 0.24 },
  village: { ko: '조개 골목', en: 'Shell Lane', icon: '🏘', tint: 0xf6dfb0, mix: 0.3 },
  market: { ko: '진주 시장', en: 'Pearl Market', icon: '🧺', tint: 0x62d6d0, mix: 0.3 },
  workshop: { ko: '거품 공방', en: 'Bubble Works', icon: '⚙', tint: 0xe0a050, mix: 0.28 }
};

/** 칸 이름(a1~h8)이 속한 구역의 열쇠. 가운데 네 칸은 광장, 나머지는 판을 넷으로 나눈다. */
export function zoneOf(sq) {
  const f = FILES.indexOf(sq?.[0]);
  const r = Number(sq?.[1]);
  if (f < 0 || !(r >= 1 && r <= 8)) return null;
  if ((f === 3 || f === 4) && (r === 4 || r === 5)) return 'plaza';
  if (r <= 4) return f <= 3 ? 'farm' : 'village';
  return f <= 3 ? 'market' : 'workshop';
}
