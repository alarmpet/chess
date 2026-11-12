// Marks money cannot buy (desire plan D6, §7-2): each one is earned by play and always says how to get it.
// There is no shop item of the same shape or another colour — bought things read as taste, earned ones as a record.
import { KIND_ORDER, earnedLooks } from './economy.js';
import { albumProgress } from '../cards/economy.js';

const ROLE_KO = { king: '사자', queen: '호랑이', rook: '코뿔소', bishop: '판다', knight: '캥거루', pawn: '미어캣' };
const GOLD_HEARTS = 60;   // the starlit stage

/**
 * Every mark with its progress. `rivals` is the engine's getVillageRivals() list (owned/total trinkets per rival),
 * `v` the village, `col` the card collection, `photos` the island album. Earned marks come first.
 * @param {{ rivals?: any[], v: any, col: any, photos?: any[] }} input
 */
export function earnedMarks({ rivals = [], v, col, photos = [] }) {
  const marks = [];
  for (const r of rivals) {
    const name = r.name?.ko || r.id;
    marks.push({
      id: `sweep-${r.id}`,
      icon: '🚩',
      name: `${name} 전승 깃발`,
      earned: r.total > 0 && r.owned >= r.total,
      have: r.owned,
      need: r.total,
      how: `${name}의 소품을 모두 얻기 · 이길 때마다 하나`
    });
  }

  // Gold frame: a role whose most-loved piece reached the starlit look, on either side.
  const looks = earnedLooks(v?.hearts || {});
  const roles = Object.keys(ROLE_KO);
  const gold = roles.filter((role) => looks.w[role].stage === 'starlit' || looks.b[role].stage === 'starlit');
  const best = roles
    .filter((role) => !gold.includes(role))
    .map((role) => ({ role, hearts: Math.max(looks.w[role].hearts, looks.b[role].hearts) }))
    .sort((a, b) => b.hearts - a.hearts)[0];
  marks.push({
    id: 'gold-frame',
    icon: '🖼️',
    name: '금테',
    earned: gold.length > 0,
    have: gold.length,
    need: roles.length,
    how: best
      ? `한 말에 하트 ${GOLD_HEARTS}개 (별빛 털) · 지금 ${ROLE_KO[best.role]} ${best.hearts}/${GOLD_HEARTS}`
      : '모든 역할이 금테를 얻었어요'
  });

  const album = albumProgress(col);
  marks.push({
    id: 'album',
    icon: '📗',
    name: '도감 완성',
    earned: album.owned >= album.total,
    have: album.owned,
    need: album.total,
    how: '말을 잡고, 메이트로 이기고, 같은 카드 3장을 합성하기'
  });

  const ready = KIND_ORDER.filter((k) => v?.built?.some((b) => b.kind === k && b.ready)).length;
  marks.push({
    id: 'island-photo',
    icon: '📷',
    name: '섬 완성 사진',
    earned: photos.length > 0,
    have: photos.length > 0 ? photos.length : ready,
    need: photos.length > 0 ? photos.length : KIND_ORDER.length,
    how: photos.length > 0 ? `완성한 섬 ${photos.length}개` : `건물 ${KIND_ORDER.length}채를 모두 열고 사진 찍기 · 지금 ${ready}/${KIND_ORDER.length}`
  });

  return [...marks.filter((m) => m.earned), ...marks.filter((m) => !m.earned)];
}
