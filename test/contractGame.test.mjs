// 계약전 한 판(SC-1): 판정 순서, 계약을 아는 AI, 이어 하기, 전용 기록.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { contractById } from '../src/rules/contractSets.js';
import {
  CONTRACT_PLY_LIMIT, addContractResult, contractAiState, contractVerdict, emptyContractStore, sanitizeContractStore
} from '../src/rules/contractGame.js';
import { chooseMove } from '../src/rules/ai.js';
import { Referee } from '../src/rules/referee.js';
import { replayResume, resumeRecord, sanitizeResume } from '../src/rules/resume.js';

const set = contractById('p2nb');
const play = (sans) => { const g = new Chess(); return sans.map((s) => g.move(s)); };
const none = { checkmate: false, stalemate: false, threefold: false, fifty: false, kingsOnly: false };
// 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.Nf3 Bg4 5.h3 Bxf3 6.Qxf3 c6 7.Qxf7+ — 백이 비숍과 폰 둘을 채운다(13반수)
const LINE = ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'Nf3', 'Bg4', 'h3', 'Bxf3', 'Qxf3', 'c6', 'Qxf7+'];

test('계약 둘을 먼저 채우면 그 수에서 끝난다', () => {
  const before = contractVerdict(set, play(LINE.slice(0, 12)), none);
  assert.equal(before.over, false);
  assert.equal(before.pliesLeft, CONTRACT_PLY_LIMIT - 12);
  const after = contractVerdict(set, play(LINE), none);
  assert.deepEqual([after.over, after.winner, after.reason], [true, 'w', 'contract']);
});

test('판정 순서: 메이트가 계약보다, 계약이 스테일메이트·상한보다 먼저다', () => {
  const moves = play(LINE);
  // 같은 수가 메이트이기도 하면 승자는 같고 사유는 메이트
  assert.equal(contractVerdict(set, moves, { ...none, checkmate: true }).reason, 'checkmate');
  assert.equal(contractVerdict(set, moves, { ...none, checkmate: true }).winner, 'w');
  // 계약을 채운 수가 스테일메이트를 만들어도 계약 승리
  assert.equal(contractVerdict(set, moves, { ...none, stalemate: true }).reason, 'contract');
  // 상한의 마지막 수로 채워도 계약 승리가 먼저
  assert.equal(contractVerdict(set, moves, none, moves.length).reason, 'contract');
  // 킹만 남아도 방금 수의 계약 승리가 먼저
  assert.equal(contractVerdict(set, moves, { ...none, kingsOnly: true }).reason, 'contract');
});

test('계약이 안 끝난 판: 스테일메이트·반복·50수·킹만 남음은 무승부', () => {
  const moves = play(LINE.slice(0, 10));
  for (const [flag, reason] of [['stalemate', 'stalemate'], ['threefold', 'threefold'], ['fifty', 'fifty'], ['kingsOnly', 'kings']]) {
    const v = contractVerdict(set, moves, { ...none, [flag]: true });
    assert.deepEqual([v.over, v.winner, v.reason], [true, null, reason], flag);
  }
  // 스테일메이트는 계약 수가 앞서 있어도 무승부다(§3.2-1 의 예)
  const lead = contractVerdict(set, play(LINE.slice(0, 11)), { ...none, stalemate: true });
  assert.equal(lead.winner, null);
});

test('차례 상한: 48반수 뒤 채운 계약 수를 견준다 — 많으면 승리, 같으면 무승부', () => {
  const ten = play(LINE.slice(0, 10));      // 흑 1 · 백 0
  const eleven = play(LINE.slice(0, 11));   // 흑 1 · 백 1
  assert.deepEqual([contractVerdict(set, ten, none, 10).winner, contractVerdict(set, ten, none, 10).reason], ['b', 'limit']);
  assert.deepEqual([contractVerdict(set, eleven, none, 11).winner, contractVerdict(set, eleven, none, 11).reason], [null, 'limit']);
  assert.equal(contractVerdict(set, ten, none, 11).over, false);      // 아직 한 수 남았다
  assert.equal(CONTRACT_PLY_LIMIT, 48);
});

test('심판의 표준 종료 사실: 기물 부족은 킹만 남았을 때만 센다', () => {
  const ref = new Referee();
  ref.load('8/8/4k3/8/8/3NK3/8/8 w - - 0 1');          // 킹 + 나이트 대 킹: chess.js 는 기물 부족
  assert.equal(ref.gameOverReason(), 'insufficient');
  assert.equal(ref.contractStandard().kingsOnly, false);
  ref.load('8/8/4k3/8/8/4K3/8/8 w - - 0 1');
  assert.equal(ref.contractStandard().kingsOnly, true);
  ref.load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(ref.contractStandard().stalemate, true);
});

// ── 계약을 아는 AI
const steady = { level: 'normal', slip: 0, rand: () => 0.5 };
const aiState = (counts, left = 30) => ({ goals: set.goals, need: 2, counts, left });

test('AI 는 계약을 끝내는 잡기를 더 큰 말보다 먼저 고른다', () => {
  // 백: 룩이 퀸을 잡을 수 있고(d1×d8), 폰이 폰을 잡을 수 있다(e4×f5). 백은 나이트 목표를 채웠고 폰은 하나 남았다.
  const fen = '3q2k1/8/8/5p2/4P3/8/8/3R2K1 w - - 0 1';
  const plain = chooseMove(fen, steady);
  assert.deepEqual([plain.from, plain.to], ['d1', 'd8']);
  const aware = chooseMove(fen, { ...steady, contract: aiState({ w: [1, 1, 0], b: [0, 0, 0] }) });
  assert.deepEqual([aware.from, aware.to], ['e4', 'f5']);
  // 쉬움(1수 탐색)도 같다
  const easy = chooseMove(fen, { level: 'easy', slip: 0, rand: () => 0.5, contract: aiState({ w: [1, 1, 0], b: [0, 0, 0] }) });
  assert.deepEqual([easy.from, easy.to], ['e4', 'f5']);
});

test('AI 는 상대의 계약을 끝낼 표적을 내주지 않는다', () => {
  // 흑 차례. 퀸과 a1 룩이 서로 노린다. 룩을 잡으면 이득이지만, 그러면 백 폰이 c5 비숍을 잡아 계약을 끝낸다
  // (백은 폰 목표를 채웠다). 계약을 아는 AI 는 퀸을 내주더라도 비숍을 살린다 — 판을 지는 것보다 낫다.
  const fen = 'q5k1/8/8/2b5/1P6/7K/8/R7 b - - 0 1';
  const plain = chooseMove(fen, steady);
  assert.deepEqual([plain.from, plain.to], ['a8', 'a1']);
  const aware = chooseMove(fen, { ...steady, contract: aiState({ w: [2, 0, 0], b: [0, 0, 0] }) });
  // 어떤 수든 좋다(비숍을 옮기든, 체크로 한 박자를 벌든) — 다음 수에 백이 비숍을 잡을 수만 없으면 된다
  const canTakeBishop = (mv) => { const g = new Chess(fen); g.move(mv); return g.moves({ verbose: true }).some((m) => m.captured === 'b'); };
  assert.equal(canTakeBishop(plain), true);
  assert.equal(canTakeBishop(aware), false, `비숍을 내줬다: ${aware.from}${aware.to}`);
});

test('사각이 있는 단계도 계약을 끝내는 잡기는 본다', () => {
  // 흑 차례. 백 비숍 a1 이 긴 대각선으로 h8 나이트를 노린다(백은 폰 목표를 채웠다). blind=1 이면 긴 대각선을 못 보지만,
  // 판이 끝나는 잡기는 본다 — 나이트를 옮기거나 길을 막아야 한다.
  const fen = '6kn/8/8/8/8/8/8/B5K1 b - - 0 1';
  const contract = aiState({ w: [2, 0, 0], b: [0, 0, 0] });
  for (let i = 0; i < 6; i++) {
    const mv = chooseMove(fen, { level: 'normal', slip: 0, blind: 1, rand: () => (i + 0.5) / 7, contract });
    const g = new Chess(fen);
    g.move(mv);
    assert.equal(g.moves({ verbose: true }).some((m) => m.from === 'a1' && m.captured === 'n'), false, `${mv.from}${mv.to} 뒤에 비숍이 나이트를 잡는다`);
  }
});

test('차례 상한 직전: 비기는 수보다 계약 수에서 앞서는 잡기를 고른다', () => {
  // 백의 마지막 수(left 1). 폰을 잡으면 폰 목표가 차서 1 대 0 으로 이긴다. 퀸을 잡으면 0 대 0 무승부.
  const fen = '3q2k1/8/8/5p2/4P3/8/8/3R2K1 w - - 0 1';
  const mv = chooseMove(fen, { ...steady, contract: aiState({ w: [1, 0, 0], b: [0, 0, 0] }, 1) });
  assert.deepEqual([mv.from, mv.to], ['e4', 'f5']);
});

test('계약 없이 부르면 예전과 같다 — 계약 상태가 다음 호출로 새지 않는다', () => {
  const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
  const base = chooseMove(fen, steady);
  chooseMove(fen, { ...steady, contract: aiState({ w: [1, 1, 0], b: [1, 0, 1] }) });
  assert.deepEqual(chooseMove(fen, steady), base);
});

test('AI 에게 넘기는 계약 상태는 기보에서 센 진도와 남은 차례다', () => {
  const s = contractAiState(set, play(LINE.slice(0, 11)));
  assert.deepEqual(s.counts, { w: [1, 0, 1], b: [1, 1, 0] });
  assert.equal(s.left, CONTRACT_PLY_LIMIT - 11);
  assert.equal(s.need, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);     // 작업자 스레드로 건너갈 수 있는 평범한 데이터
});

// ── 이어 하기와 전용 기록
test('이어 하기 기록은 계약 세트 이름을 싣고, 모르는 이름은 버린다', () => {
  const history = play(LINE.slice(0, 6));
  const rec = resumeRecord({ gameId: 7, color: 'w', history, contract: 'p2nb' });
  assert.equal(rec.contract, 'p2nb');
  assert.equal(sanitizeResume(JSON.parse(JSON.stringify(rec))).contract, 'p2nb');
  assert.equal('contract' in resumeRecord({ gameId: 7, color: 'w', history }), false);            // 일반 판은 예전 모양 그대로
  assert.equal('contract' in sanitizeResume({ ...rec, contract: 'zzz' }), false);
  assert.equal('contract' in resumeRecord({ gameId: 7, color: 'w', history, contract: 'zzz' }), false);
  // 되살린 판의 진도는 수에서 다시 센다
  const back = replayResume(rec);
  assert.deepEqual(contractVerdict(set, back.before.map((s) => s.move), none).progress.w.counts, [1, 0, 0]);
});

test('전용 기록: 판 수·승패·사유가 쌓이고, 망가진 저장은 빈 기록이 된다', () => {
  let store = emptyContractStore();
  store = addContractResult(store, { set: 'p2nb', result: 'win', reason: 'contract', plies: 21 });
  store = addContractResult(store, { set: 'p3nb', result: 'loss', reason: 'checkmate', plies: 30 });
  store = addContractResult(store, { set: 'p3nb', result: 'draw', reason: 'limit', plies: 48 });
  assert.deepEqual([store.games, store.win, store.loss, store.draw], [3, 1, 1, 1]);
  assert.deepEqual(store.byReason, { contract: 1, checkmate: 1, limit: 1 });
  assert.deepEqual(store.last, { set: 'p3nb', result: 'draw', reason: 'limit', plies: 48 });
  assert.deepEqual(sanitizeContractStore(JSON.parse(JSON.stringify(store))), store);
  assert.deepEqual(sanitizeContractStore('nope'), emptyContractStore());
  assert.deepEqual(sanitizeContractStore({ v: 1, games: -3, win: 'x' }).games, 0);
  assert.equal(addContractResult(store, { set: 'p2nb', result: 'weird', reason: 'x', plies: 1 }).games, 3);
});

// ── IR-0: 끝난 까닭 한 문장(종료 배너 안)
test('끝난 까닭은 내 쪽에서 본 한 문장이고, 실제로 채운 목표를 적는다', async () => {
  const { resultLine } = await import('../src/fx/contractHud.js');
  const set = contractById('p2nb');
  const side = (counts) => ({ counts, done: counts.filter((n, i) => n >= set.goals[i].count).length });
  const line = (reason, result, mine, theirs) => resultLine(set, { reason, result, mine: side(mine), theirs: side(theirs) });
  assert.equal(line('contract', 'win', [2, 1, 0], [1, 0, 1]), '미어캣 ×2 · 캥거루 목표를 먼저 채워 이겼어요.');
  assert.equal(line('contract', 'loss', [1, 0, 1], [0, 1, 1]), '상대가 캥거루 · 판다 목표를 먼저 채웠어요.');
  assert.equal(line('checkmate', 'win', [0, 0, 0], [0, 1, 0]), '상대 왕을 제압해 이겼어요.');
  assert.equal(line('checkmate', 'loss', [2, 0, 0], [0, 0, 0]), '내 왕이 제압당했어요.');
  assert.equal(line('limit', 'win', [2, 0, 0], [1, 0, 0]), '24차례가 끝났어요. 채운 목표 1 대 0으로 이겼어요.');
  assert.equal(line('limit', 'loss', [0, 0, 0], [0, 1, 0]), '24차례가 끝났어요. 채운 목표 0 대 1로 졌어요.');
  assert.equal(line('limit', 'draw', [0, 1, 0], [0, 0, 1]), '24차례가 끝났어요. 채운 목표 1 대 1로 같아 비겼어요.');
  assert.equal(line('resign', 'loss', [0, 0, 0], [0, 0, 0]), '기권했어요.');
  for (const reason of ['kings', 'stalemate', 'threefold', 'fifty', 'other']) assert.match(line(reason, 'draw', [0, 0, 0], [0, 0, 0]), /비겼어요\.$/);
});

// ── IR-1: 상대가 함께 자란다(사다리) · 지기 전에 보인다(결정타·위험·아차)
test('사다리: 이기면 한 칸 오르고, 두 판을 내리 지면 한 칸 내려온다', async () => {
  const { nextRung, RUNG_NOVICE, RUNG_ATTACK, RUNG_FULL, emptyContractStore } = await import('../src/rules/contractGame.js');
  assert.deepEqual(nextRung(RUNG_NOVICE, 0, 'win'), { rung: RUNG_ATTACK, lossRun: 0 });
  assert.deepEqual(nextRung(RUNG_FULL, 1, 'win'), { rung: RUNG_FULL, lossRun: 0 });
  assert.deepEqual(nextRung(RUNG_ATTACK, 0, 'loss'), { rung: RUNG_ATTACK, lossRun: 1 });
  assert.deepEqual(nextRung(RUNG_ATTACK, 1, 'loss'), { rung: RUNG_NOVICE, lossRun: 0 });
  assert.deepEqual(nextRung(RUNG_NOVICE, 1, 'loss'), { rung: RUNG_NOVICE, lossRun: 0 });
  assert.deepEqual(nextRung(RUNG_ATTACK, 1, 'draw'), { rung: RUNG_ATTACK, lossRun: 1 });
  // 기록: 새 기록은 입문에서 시작하고, 옛 기록(단계 없음)도 입문으로 읽힌다
  let store = emptyContractStore();
  assert.equal(store.rung, RUNG_NOVICE);
  store = addContractResult(store, { set: 'p2nb', result: 'win', reason: 'contract', plies: 20 });
  store = addContractResult(store, { set: 'p2nb', result: 'win', reason: 'contract', plies: 20 });
  assert.equal(store.rung, RUNG_FULL);
  store = addContractResult(store, { set: 'p2nb', result: 'loss', reason: 'contract', plies: 20 });
  store = addContractResult(store, { set: 'p2nb', result: 'loss', reason: 'resign', plies: 20 });
  assert.equal(store.rung, RUNG_ATTACK);
  assert.equal(sanitizeContractStore({ v: 1, games: 3, win: 1, loss: 2, draw: 0 }).rung, RUNG_NOVICE);
  assert.equal(sanitizeContractStore({ v: 1, rung: 9, lossRun: 9 }).rung, RUNG_FULL);
});

test('AI 에게 넘기는 계약: 입문은 없음, 초급은 제 색만, 정식은 전부', async () => {
  const { RUNG_NOVICE, RUNG_ATTACK, RUNG_FULL } = await import('../src/rules/contractGame.js');
  const set = contractById('p2nb');
  assert.equal(contractAiState(set, [], undefined, RUNG_NOVICE, 'b'), undefined);
  assert.equal(contractAiState(set, [], undefined, RUNG_ATTACK, 'b').only, 'b');
  assert.equal(contractAiState(set, [], undefined, RUNG_FULL, 'b').only, undefined);
  assert.equal(contractAiState(set, []).left, 48);   // 예전 부름 그대로
});

test('정식 AI 는 내 결정타를 막고, 초급 AI 도 제 결정타는 둔다', async () => {
  const set = contractById('p2nb');
  // 흑 차례. 백은 폰×2 를 채웠고 b5 비숍이 c6 나이트를 노린다 — Bxc6 이 백의 결정타다. 정식 상대는 그 길을 막는다.
  const fen = 'r1bqkb1r/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1';
  const counts = { w: [2, 0, 0], b: [0, 1, 0] };
  const base = { goals: set.goals, need: 2, counts, left: 30 };
  const rand = () => 0.5;
  const safeAfter = (pick) => { const g = new Chess(fen); g.move(pick); return !g.moves({ verbose: true }).some((m) => m.captured === 'n' || m.captured === 'b'); };
  const full = chooseMove(fen, { level: 'normal', rand, slip: 0, contract: base });
  assert.equal(safeAfter(full), true, `정식은 막는다: ${JSON.stringify(full)}`);
  // 초급도 제 결정타는 둔다: 흑이 나이트를 채웠고 Nxc2 로 비숍을 잡으면 끝난다
  const fen3 = '4k3/8/8/8/3n4/8/2B5/4K3 b - - 0 1';   // Nxc2 = 비숍 잡기
  const attack = chooseMove(fen3, { level: 'easy', rand, slip: 0, contract: { goals: set.goals, need: 2, counts: { w: [0, 0, 0], b: [0, 1, 0] }, left: 30, only: 'b' } });
  assert.deepEqual([attack.from, attack.to], ['d4', 'c2']);
});

test('결정타 · 위험 · 아차: 심판이 센 합법 수로만', async () => {
  const { finishers, dangerSquares, oopsCheck } = await import('../src/rules/contractGuard.js');
  const { contractProgress } = await import('../src/rules/contractSets.js');
  const set = contractById('p2nb');
  const play = (sans) => { const g = new Chess(); for (const s of sans) g.move(s); return g; };
  // 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.Nf3 Bg4 5.h3 Bxf3 6.Qxf3 c6 — 백 [1,0,1] · 흑 [1,1,0], 백 차례
  const g = play(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'Nf3', 'Bg4', 'h3', 'Bxf3', 'Qxf3', 'c6']);
  const hist = g.history({ verbose: true });
  const prog = contractProgress(set, hist);
  const fin = finishers(g, set, prog);
  assert.ok(fin.some((m) => m.san === 'Qxf7+' && m.target === 'f7'), '폰 둘째(Qxf7+)가 결정타');
  assert.ok(fin.every((m) => m.captured === 'p' || m.captured === 'n'), '백에게 남은 목표는 폰 하나·나이트뿐');
  // 위험: 흑이 지금 둔다면 a2 폰(Qxa2)이나 c3… 폰 둘째·비숍이 결정타다
  const danger = dangerSquares(g.fen(), set, prog);
  assert.ok(danger.includes('a2'), `a2 폰이 위험: ${danger}`);
  // 끝난 판에는 결정타가 없다
  g.move('Qxf7+');
  assert.deepEqual(finishers(g, set, contractProgress(set, g.history({ verbose: true }))), []);

  // 아차: 흑이 나이트를 채운 뒤(매치 포인트) 백이 a 폰을 지키던 말을 치우면 Qxa2 가 결정타가 된다
  const q = play(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'Nf3', 'Bg4', 'h3', 'Bxf3']);   // 흑 [1,1,0] — 폰 하나만 더
  const qh = q.history({ verbose: true });
  const after = (m) => contractProgress(set, [...qh, m]);
  const bad = oopsCheck(q.fen(), set, { from: 'd1', to: 'f3' }, after);    // 6.Qxf3 — 그 뒤 흑 Qxa2 가 계약 완성
  assert.equal(bad.oops, true);
  assert.ok(bad.threats.some((t) => t.san === 'Qxa2'));
  assert.equal(typeof bad.avoidable, 'boolean');
  // 내가 그 수로 이기면 아차가 아니다
  const win = oopsCheck(g.fen(), set, { from: 'e1', to: 'e2' }, () => ({ winner: 'w' }));
  assert.equal(win.oops, false);
  // 둘 수 없는 수는 조용히 넘어간다
  assert.equal(oopsCheck(q.fen(), set, { from: 'a1', to: 'a8' }, after).oops, false);
});
