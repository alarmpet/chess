// The island's whole loop in three steps, always in the same place (garden-short plan G1): plant, play one game, harvest.
// The step to do now is lit; the chess game is the only way from planting to harvest.
import { BUILDINGS, buildBlocked, loopStep } from './economy.js';

type Props = { village: any; summary: any | null; hasCards: boolean; onPlay: () => void };

/** Everything one finished game brought: its own acorns and hearts plus what the buildings made. */
export const gainText = (summary: any) => {
  const h = summary.harvest || {};
  const coins = summary.coins + (h.coins || 0);
  const hearts = summary.hearts + (h.hearts || 0);
  return [`🌰 +${coins}`, h.grain && `🌾 +${h.grain}`, h.bread && `🥖 +${h.bread}`, `💗 +${hearts}`].filter(Boolean).join(' · ');
};

export default function LoopStrip({ village, summary, hasCards, onPlay }: Props) {
  if (!village) return null;
  const s = loopStep(village);
  const canBuild = Object.keys(BUILDINGS).some((k) => !buildBlocked(village, k, ''));
  const plant =
    s.next === 'build' ? (canBuild ? '건물을 지어요' : '도토리를 모아요')
      : s.next === 'resident' ? (hasCards ? `주민을 들여요 (${s.empty}곳)` : '말을 잡으면 주민이 생겨요')
        : [s.working && `일하는 곳 ${s.working}`, s.waiting && `짓는 중 ${s.waiting}`].filter(Boolean).join(' · ');
  // Without a building or a resident to place, the game itself is still the next step: it brings acorns and cards.
  const playNow = s.next === 'play' || (s.next === 'build' && !canBuild) || (s.next === 'resident' && !hasCards);
  return (
    <ol className="village-loop" id="village-loop" data-next={playNow ? 'play' : s.next}>
      <li className={playNow ? 'done' : 'now'}>
        <b>🌱 심기</b>
        <span>{plant}</span>
      </li>
      <li className={playNow ? 'now' : ''}>
        <b>♟ 한 판</b>
        {playNow ? <button type="button" className="village-loop-go" onClick={onPlay}>두러 가기</button> : <span>심은 뒤에</span>}
      </li>
      <li className={summary ? 'done' : ''}>
        <b>🧺 거두기</b>
        <span>{summary ? gainText(summary) : '판이 끝나면'}</span>
      </li>
    </ol>
  );
}
