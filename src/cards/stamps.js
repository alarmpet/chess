// Technique stamps (objective-layer plan OL-2, 2026-11-06). The first time the player makes a named chess move, a
// stamp goes into the album and pays a few acorns. Grade A in the plan's source table: LoL Challenges and Chess.com
// achievements collect named feats outside the game's result; naming them after chess techniques is ours. Every
// stamp is a good move worth learning — none asks the player to give anything away.
// Each test reads one chess.js verbose move (it carries `before` and `after` FENs).
import { Chess } from 'chess.js';

/** One acorn reward per stamp, the first time only. */
export const STAMP_ACORNS = 5;

const FILES = 'abcdefgh';
const at = (f, r) => (f >= 0 && f < 8 && r >= 1 && r <= 8 ? FILES[f] + r : null);
const kingSquare = (chess, color) => {
  for (const row of chess.board()) for (const p of row) if (p && p.type === 'k' && p.color === color) return p.square;
  return null;
};
const KNIGHT_JUMPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const AROUND = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const isCheck = (m) => /[+#]$/.test(m.san || '');
const isMate = (m) => /#$/.test(m.san || '');

export const STAMPS = [
  { id: 'en_passant', ko: '지나가며 잡기(앙파상)', en: 'En passant', how: '두 칸 온 폰 옆에서, 지나간 칸으로 잡기', howEn: 'Take a pawn that just moved two squares, as it passes',
    hit: (m) => (m.flags || '').includes('e') },
  { id: 'underpromotion', ko: '호랑이 말고 다른 말로 승급', en: 'Underpromotion', how: '끝줄에 간 미어캣을 캥거루·판다·코뿔소로', howEn: 'Promote to a kangaroo, panda or rhino',
    hit: (m) => Boolean(m.promotion) && m.promotion !== 'q' },
  { id: 'castle_check', ko: '성 쌓으며 체크', en: 'Castle with check', how: '캐슬링한 코뿔소가 바로 체크', howEn: 'Castle so the rhino gives check',
    hit: (m) => /[kq]/.test(m.flags || '') && isCheck(m) },
  { id: 'double_check', ko: '겹 체크', en: 'Double check', how: '두 말이 한꺼번에 체크', howEn: 'Check with two pieces at once',
    hit: (m, after) => isCheck(m) && after.attackers(kingSquare(after, after.turn()), m.color).length >= 2 },
  {
    id: 'discovered_check', ko: '숨은 체크', en: 'Discovered check',
    how: '말이 비켜서 뒤의 말이 체크', howEn: 'Move a piece aside so the one behind gives check',
    hit: (m, after) => isCheck(m) && !/[kq]/.test(m.flags || '') && !after.attackers(kingSquare(after, after.turn()), m.color).includes(m.to)
  },
  {
    // A kangaroo that lands attacking two of the king, tiger and rhinos at once.
    id: 'knight_fork', ko: '캥거루 포크', en: 'Knight fork',
    how: '캥거루 하나로 사자·호랑이·코뿔소 중 둘을 노리기', howEn: 'One kangaroo attacking two of king, tiger and rhinos',
    hit: (m, after) => {
      if (m.piece !== 'n') return false;
      const f = FILES.indexOf(m.to[0]);
      const r = Number(m.to[1]);
      let big = 0;
      for (const [df, dr] of KNIGHT_JUMPS) {
        const sq = at(f + df, r + dr);
        const p = sq && after.get(sq);
        if (p && p.color !== m.color && 'kqr'.includes(p.type)) big++;
      }
      return big >= 2;
    }
  },
  {
    // Mate by a rook or tiger along the back rank of the mated king.
    id: 'back_rank_mate', ko: '뒷줄 메이트', en: 'Back-rank mate',
    how: '끝줄에 갇힌 사자를 코뿔소나 호랑이로 메이트', howEn: 'Mate a king stuck on its back rank with a rhino or tiger',
    hit: (m, after) => {
      if (!isMate(m) || !'rq'.includes(m.piece)) return false;
      const k = kingSquare(after, after.turn());
      const back = after.turn() === 'w' ? '1' : '8';
      return k?.[1] === back && m.to[1] === back;
    }
  },
  {
    // Mate by a kangaroo with every square around the king taken by its own side.
    id: 'smothered_mate', ko: '꽉 막힌 메이트', en: 'Smothered mate',
    how: '제 편에 둘러싸인 사자를 캥거루로 메이트', howEn: 'Mate a king boxed in by its own pieces with a kangaroo',
    hit: (m, after) => {
      if (!isMate(m) || m.piece !== 'n') return false;
      const k = kingSquare(after, after.turn());
      const f = FILES.indexOf(k[0]);
      const r = Number(k[1]);
      return AROUND.every(([df, dr]) => {
        const sq = at(f + df, r + dr);
        const p = sq && after.get(sq);
        return !sq || (p && p.color === after.turn());
      });
    }
  },
  { id: 'pawn_mate', ko: '미어캣 메이트', en: 'Pawn mate', how: '미어캣으로 메이트', howEn: 'Mate with a meerkat',
    hit: (m) => isMate(m) && m.piece === 'p' }
];

export const stampById = (id) => STAMPS.find((s) => s.id === id) || null;

/** The stamps one move earns (any colour; the caller keeps only the player's). */
export function stampsOf(m) {
  if (!m?.after) return [];
  const after = new Chess(m.after);
  return STAMPS.filter((s) => s.hit(m, after)).map((s) => s.id);
}
