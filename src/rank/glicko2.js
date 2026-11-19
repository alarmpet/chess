// Glicko-2 레이팅 (LA-R R-2, 기획서 §12.2). Mark Glickman, "Example of the Glicko-2 system"(2012) 의 절차를 직접 옮겼다.
// 수식은 공개 논문이다. lichess(lila)는 AGPL 이라 코드를 보지도 복사하지도 않았다.
// 한 판이 끝날 때마다 그 한 판을 「평가 기간」으로 보고 바로 갱신한다(lichess 와 같은 방식이라고 알려져 있다 — 그쪽 코드로 확인하지는 않았다).
// 판 사이 쉬는 기간의 RD 증가(2단계 6)는 아직 넣지 않았다. 계획서 §6 에 「재 보지 않았다」로 남긴다.

export const START = { rating: 1500, rd: 350, vol: 0.06 };
export const TAU = 0.5;
const SCALE = 173.7178;
const EPS = 0.000001;
/** RD 아래·위 한계. 너무 작으면 실력이 바뀌어도 숫자가 안 움직이고, 350 이 처음 값이다. */
export const RD_MIN = 45;
export const RD_MAX = 350;

const g = (phi) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const E = (mu, muj, phij) => 1 / (1 + Math.exp(-g(phij) * (mu - muj)));

/**
 * 한 선수를 여러 판 결과로 갱신한다(논문 1~8단계).
 * @param {{rating:number, rd:number, vol:number}} me
 * @param {{rating:number, rd:number, score:number}[]} games  score: 이김 1 · 비김 0.5 · 짐 0
 */
export function rate(me, games, tau = TAU) {
  const mu = (me.rating - 1500) / SCALE;
  const phi = me.rd / SCALE;
  const sigma = me.vol;
  if (!games.length) {
    // 판이 없는 기간: RD 만 늘어난다(6단계).
    const phiStar = Math.sqrt(phi * phi + sigma * sigma);
    return { rating: me.rating, rd: Math.min(RD_MAX, phiStar * SCALE), vol: sigma };
  }
  const opp = games.map((o) => ({ mu: (o.rating - 1500) / SCALE, phi: o.rd / SCALE, s: o.score }));
  // 3단계: 분산 v
  let vInv = 0;
  for (const o of opp) { const e = E(mu, o.mu, o.phi); vInv += g(o.phi) ** 2 * e * (1 - e); }
  const v = 1 / vInv;
  // 4단계: 개선량 Δ
  let sum = 0;
  for (const o of opp) sum += g(o.phi) * (o.s - E(mu, o.mu, o.phi));
  const delta = v * sum;
  // 5단계: 새 변동성 σ' (일리노이 방법)
  const a = Math.log(sigma * sigma);
  const f = (x) => {
    const ex = Math.exp(x);
    return (ex * (delta * delta - phi * phi - v - ex)) / (2 * (phi * phi + v + ex) ** 2) - (x - a) / (tau * tau);
  };
  let A = a;
  let B;
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v);
  else { let k = 1; while (f(a - k * tau) < 0) k++; B = a - k * tau; }
  let fA = f(A);
  let fB = f(B);
  for (let i = 0; i < 100 && Math.abs(B - A) > EPS; i++) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; } else fA /= 2;
    B = C; fB = fC;
  }
  const vol = Math.exp(A / 2);
  // 6~8단계
  const phiStar = Math.sqrt(phi * phi + vol * vol);
  const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muNew = mu + phiNew * phiNew * sum;
  return { rating: muNew * SCALE + 1500, rd: phiNew * SCALE, vol };
}

/** 한 판(백·흑, 백 점수)으로 두 사람을 동시에 갱신한다. RD 는 [RD_MIN, RD_MAX] 로 자른다. */
export function rateGame(white, black, whiteScore) {
  const w = rate(white, [{ rating: black.rating, rd: black.rd, score: whiteScore }]);
  const b = rate(black, [{ rating: white.rating, rd: white.rd, score: 1 - whiteScore }]);
  const clip = (p) => ({ rating: p.rating, rd: Math.max(RD_MIN, Math.min(RD_MAX, p.rd)), vol: p.vol });
  return { white: clip(w), black: clip(b) };
}

/** 동물 등급 뱃지(기획서 §12.2): 새끼 → 성체 → 우두머리 → 왕관. 경계는 추정값이다(재 보지 않았다). */
export function badgeOf(rating, games) {
  if (games < 5) return 'cub';
  if (rating < 1400) return 'cub';
  if (rating < 1700) return 'adult';
  if (rating < 2000) return 'alpha';
  return 'crown';
}

const BADGE_LABEL = {
  cub: { icon: '🍼', ko: '새끼', en: 'Cub' },
  adult: { icon: '🐾', ko: '성체', en: 'Grown' },
  alpha: { icon: '⭐', ko: '우두머리', en: 'Leader' },
  crown: { icon: '👑', ko: '왕관', en: 'Crown' }
};
/** 뱃지 표시 글자. 모르는 값은 새끼. */
export function badgeLabel(badge, en = false) {
  const b = BADGE_LABEL[badge] || BADGE_LABEL.cub;
  return { icon: b.icon, name: en ? b.en : b.ko };
}
