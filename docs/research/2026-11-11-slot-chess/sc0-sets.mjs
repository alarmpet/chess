// 측정 스크립트들이 함께 쓰는 후보 세트(풀에 든 것과 뺀 것 모두).
export const CANDIDATES = {
  p2nb: [{ type: 'p', count: 2 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }],
  p2nr: [{ type: 'p', count: 2 }, { type: 'n', count: 1 }, { type: 'r', count: 1 }],
  p3nb: [{ type: 'p', count: 3 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }],
  p2bn2: [{ type: 'p', count: 2 }, { type: 'b', count: 1 }, { type: 'n', count: 2 }],
  pnb: [{ type: 'p', count: 1 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }],
  pnr: [{ type: 'p', count: 1 }, { type: 'n', count: 1 }, { type: 'r', count: 1 }]
};
