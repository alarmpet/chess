// 잡는 동물의 공격 동작 6종 (docs/plans/2026-11-08-capture-matchup-plan.md CX-3).
// 지금까지 공격은 6종이 같은 모양이었다: 다가간 뒤 같은 앞으로 내밀기(lunge)와 각자의 Attack 클립.
// 새 클립 없이 몸 전체 자세만으로 가른다. moveStyle 과 같은 자세 필드를 쓰고, 엔진의 applyStylePose 가 입힌다.
//
// attackStyle(type, u, contact)
//   u       공격 구간(다가감이 끝난 때 → 공격이 끝난 때) 안의 진행 0~1
//   contact 그 구간에서 타격이 들어가는 지점(0~1). 이때 자세가 가장 세다
// 양 끝(u=0, u=1)에서 자세는 중립이라, 다가감·퇴장과 끊김 없이 이어진다. 시간은 바꾸지 않는다.

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => x * x * (3 - 2 * x);
const pose = (fields) => ({ lift: 0, forward: 0, pitch: 0, roll: 0, yaw: 0, stretch: 1, ...fields });
const NEUTRAL = pose({});
const mix = (a, b, k) => {
  const o = {};
  for (const key of Object.keys(NEUTRAL)) o[key] = a[key] + (b[key] - a[key]) * k;
  return o;
};

/** 판다가 구를 때 도는 중심(배 높이). moveStyle 의 ROLL_PIVOT 과 같은 값. */
const ROLL_PIVOT = 0.2;
/** 준비 동작이 공격 구간에서 차지하는 몫(타격 지점까지 중). 나머지는 내리치기. */
const WIND_SHARE = 0.7;

/**
 * 동물마다 준비(wind)·타격(strike) 두 자세와, 그 사이 덧붙는 움직임(extra)을 둔다.
 * w = 준비 진행 0~1, s = 내리치기 진행 0~1.
 */
const ATTACKS = {
  // 미어캣: 까치발로 쭉 섰다가 앞으로 박치기.
  pawn: {
    wind: (w) => pose({ stretch: 1 + 0.2 * smooth(w), lift: 0.03 * smooth(w), pitch: -0.16 * smooth(w) }),
    strike: () => pose({ stretch: 0.96, lift: 0.01, pitch: 0.5, forward: 0.03 })
  },
  // 캥거루: 몸을 웅크렸다가 꼬리로 버티고 뒤로 젖히며 두 발을 내지른다.
  knight: {
    wind: (w) => pose({ stretch: 1 - 0.16 * smooth(w), pitch: 0.12 * smooth(w) }),
    strike: () => pose({ stretch: 1.1, lift: 0.07, pitch: -0.55, forward: 0.02 })
  },
  // 판다: 그 자리에서 앞으로 한 바퀴 굴러 몸통 박치기.
  bishop: {
    roll: true,
    wind: () => NEUTRAL,
    strike: () => pose({ forward: 0.02 })
  },
  // 코뿔소: 앞발로 땅을 두 번 긁고(몸이 앞뒤로 흔들림) 머리를 숙여 들이받는다.
  rook: {
    wind: (w) => pose({ pitch: -0.12 * Math.abs(Math.sin(2 * Math.PI * w)), yaw: 0.06 * Math.sin(2 * Math.PI * w), lift: 0.01 * Math.abs(Math.sin(2 * Math.PI * w)) }),
    strike: () => pose({ pitch: 0.36, forward: 0.05, stretch: 0.94 })
  },
  // 호랑이: 뒷발로 일어섰다가 몸을 비틀며 앞발로 할퀸다.
  queen: {
    wind: (w) => pose({ pitch: -0.36 * smooth(w), lift: 0.05 * smooth(w), stretch: 1 + 0.1 * smooth(w) }),
    strike: () => pose({ pitch: 0.3, roll: 0.26, yaw: -0.18, forward: 0.025 })
  },
  // 사자: 가슴을 펴고 뒤로 젖혔다가 앞으로 포효. 갈기를 흔든다(타격 뒤 좌우 흔들림).
  king: {
    wind: (w) => pose({ pitch: -0.3 * smooth(w), stretch: 1 + 0.14 * smooth(w) }),
    strike: () => pose({ pitch: 0.16, stretch: 1.18, forward: 0.02 }),
    shake: 0.3
  }
};

export const ATTACK_TYPES = Object.keys(ATTACKS);

export function attackStyle(type, u, contact = 0.6) {
  const a = ATTACKS[type];
  if (!a) return pose({});
  const c = Math.min(0.95, Math.max(0.05, contact));
  const x = clamp01(u);
  const windEnd = c * WIND_SHARE;
  let p;
  if (x <= windEnd) {
    p = a.wind(x / windEnd);
  } else if (x <= c) {
    p = mix(a.wind(1), a.strike(), smooth((x - windEnd) / (c - windEnd)));
  } else {
    const r = (x - c) / (1 - c);
    p = mix(a.strike(), NEUTRAL, smooth(r));
    if (a.shake) p.yaw += Math.sin(Math.PI * 4 * r) * (1 - r) * a.shake;
  }
  if (a.roll) {
    // 타격 지점까지 한 바퀴 앞으로. 배를 중심으로 돌아 발끝이 땅에 박히지 않는다.
    const angle = 2 * Math.PI * smooth(clamp01(x / c));
    p = { ...p, pitch: p.pitch + angle, lift: p.lift + ROLL_PIVOT * (1 - Math.cos(angle)), forward: p.forward - ROLL_PIVOT * Math.sin(angle) };
  }
  return p;
}
