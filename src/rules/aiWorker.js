// AI 의 생각을 화면 밖 스레드에서 (STATUS FN-5, DR-M1 뒤 2026-11-11). 3수 탐색(7단계 사자 왕)이 1~2초 걸려
// 화면이 멈췄다(docs/qa/2026-11-10-dr-m1.md). 엔진이 { id, fen, opts } 를 보내면 같은 chooseMove 로 고른 수를 돌려준다.
// 무작위는 이 스레드의 Math.random — 같은 단계 값이면 결과 분포는 화면 스레드와 같다.
import { chooseMove } from './ai.js';

self.onmessage = (e) => {
  const { id, fen, opts } = e.data || {};
  let move = null;
  try {
    move = chooseMove(fen, opts || {});
  } catch (err) {
    move = null;
  }
  self.postMessage({ id, move });
};
