// 잡힌 동물의 반응 5종 (docs/plans/2026-11-08-capture-matchup-plan.md CX-2).
// 지금까지는 5종이 같은 퇴장(멈춤 → 옆으로 통통 → 작아짐)이었다. 동물 무게와 성격으로 가른다.
// 순수 함수: 시간(초)을 넣으면 자세를 돌려준다. 전체 길이는 예전 퇴장과 같은 1.25초라 대국 시간은 늘지 않는다.
//
// 자세의 뜻 (길이 단위는 판 칸, 각도는 라디안):
//   back  공격 방향(공격자 → 잡힌 말)으로 밀려난 거리
//   up    떠오른 높이
//   tilt  뒤로 넘어가는 각도(머리가 공격 방향 쪽으로). 2π 면 한 바퀴 뒤로 구름
//   roll  옆으로 넘어지는 각도
//   spin  제자리 회전(세로축)
//   toStorage  보관대 쪽으로 간 비율 0~1 (퇴장 구간)
//   scale 크기 비율 (끝에 작아져 사라짐)

export const REACTION_TOTAL = 1.25;
/** 동물별 반응 구간. 이 뒤는 보관대로 가는 퇴장이다. */
export const REACT_SEC = 0.55;

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut = (u) => 1 - (1 - u) * (1 - u);
const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
const arc = (u, h) => 4 * u * (1 - u) * h;

/** 반응 구간(u = 0~1)의 동물별 자세. */
const REACT = {
  // 미어캣: 가벼워 팽이처럼 돌며 높이 튕겨 나간다.
  pawn: (u) => ({ back: 1.0 * easeOut(u), up: arc(u, 1.1), tilt: 0.45 * Math.sin(Math.PI * u), roll: 0, spin: 3 * TAU * easeOut(u) }),
  // 캥거루: 한 번 통 튀어 버티려다 엉덩방아.
  knight: (u) => {
    if (u < 0.6) {
      const v = u / 0.6;
      return { back: 0.45 * v, up: arc(v, 0.45), tilt: -0.25 * Math.sin(Math.PI * v), roll: 0, spin: 0 };
    }
    const v = (u - 0.6) / 0.4;
    return { back: 0.45 + 0.08 * v, up: 0, tilt: 0.55 * easeOut(v), roll: 0, spin: 0 };
  },
  // 판다: 바닥에서 뒤로 데굴데굴 두 바퀴.
  bishop: (u) => {
    const tilt = 2 * TAU * easeOut(u);
    return { back: 0.85 * easeOut(u), up: 0.3 * Math.abs(Math.sin(tilt / 2)), tilt, roll: 0, spin: 0 };
  },
  // 코뿔소: 무거워 한 박자 버티며 흔들리다 옆으로 쿵 넘어진다. 거의 밀리지 않는다.
  rook: (u) => {
    if (u < 0.45) {
      const v = u / 0.45;
      return { back: 0.08 * v, up: 0, tilt: 0, roll: 0.14 * Math.sin(v * 3 * Math.PI), spin: 0 };
    }
    const v = (u - 0.45) / 0.55;
    // 넘어지며 끝에 살짝 되튐
    const fall = v < 0.8 ? (v / 0.8) ** 2 : 1 - 0.08 * Math.sin(((v - 0.8) / 0.2) * Math.PI);
    return { back: 0.08 + 0.1 * v, up: 0, tilt: 0, roll: (Math.PI / 2) * fall, spin: 0 };
  },
  // 호랑이: 높이 떠서 뒤로 공중제비 한 바퀴.
  queen: (u) => ({ back: 0.6 * u, up: arc(u, 0.8), tilt: TAU * easeInOut(u), roll: 0, spin: 0 })
};

/**
 * 미어캣 반응 변형 (CX-6, docs/qa/2026-11-09-llm-human-tests.md). 미어캣이 잡히는 일이 잡기의 약 48%라
 * 「매번 똑같아 질린다」는 판정이 세 모델에서 모두 나왔다. 길이는 그대로 두고, 그 판 몇 번째인지에 따라
 * 도는 방향·높이·기울기만 바꾼다. 셋 다 「팽이처럼 돌며 튕겨 나가는 가벼운 미어캣」이라는 정체는 같다.
 */
const PAWN_VARIANTS = [
  REACT.pawn,
  // 반대로 돌며 낮게, 옆으로 비틀거리며 조금 더 멀리.
  (u) => ({ back: 1.1 * easeOut(u), up: arc(u, 0.8), tilt: 0.3 * Math.sin(Math.PI * u), roll: 0.35 * Math.sin(Math.PI * u), spin: -3 * TAU * easeOut(u) }),
  // 덜 밀리고 더 높이 퐁 떠서, 뒤로 크게 젖혀진다.
  (u) => ({ back: 0.8 * easeOut(u), up: arc(u, 1.15), tilt: 0.75 * Math.sin(Math.PI * u), roll: 0, spin: 2 * TAU * easeOut(u) })
];
export const PAWN_VARIANT_COUNT = PAWN_VARIANTS.length;

/** 퇴장 구간에서도 반응 자세를 그대로 두는 동물(넘어진 코뿔소는 누운 채 미끄러져 나간다). */
const KEEP_POSE = { rook: true };

export const REACTION_TYPES = Object.keys(REACT);

/**
 * `t`초 때 잡힌 `type` 동물의 자세. 모르는 종류(킹 등)는 폰 반응을 쓴다.
 * `variant` 는 미어캣만 쓴다(그 판에서 앞서 잡힌 미어캣 수). 다른 동물은 무시한다.
 */
export function reactionPose(type, t, variant = 0) {
  const react = type === 'pawn' ? PAWN_VARIANTS[((variant % PAWN_VARIANT_COUNT) + PAWN_VARIANT_COUNT) % PAWN_VARIANT_COUNT] : REACT[type] || REACT.pawn;
  if (t <= REACT_SEC) return { ...react(clamp01(t / REACT_SEC)), toStorage: 0, scale: 1 };
  const end = react(1);
  const k = clamp01((t - REACT_SEC) / (REACTION_TOTAL - REACT_SEC));
  // 각도는 한 바퀴 단위로 정리해, 서는 동안 거꾸로 감기지 않게 한다.
  const settle = KEEP_POSE[type] ? 1 : 1 - easeOut(clamp01(k / 0.3));
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  return {
    back: end.back,
    up: Math.abs(Math.sin(k * Math.PI * 3)) * 0.55 * (1 - k * 0.6),
    tilt: wrap(end.tilt) * settle,
    roll: wrap(end.roll) * settle,
    spin: end.spin,
    toStorage: easeInOut(k),
    scale: 1 - Math.max(0, k - 0.7) / 0.3
  };
}
