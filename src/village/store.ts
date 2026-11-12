// Village save (browser only for now) and the link from a finished chess game to the village.
import { VILLAGE_KEY, rollWeek, sanitizeVillage, settleGame } from './economy.js';

export function loadVillage(): any {
  try {
    return sanitizeVillage(JSON.parse(window.localStorage.getItem(VILLAGE_KEY) || 'null'));
  } catch (e) {
    return sanitizeVillage(null);
  }
}

export function saveVillage(v: any) {
  try { window.localStorage.setItem(VILLAGE_KEY, JSON.stringify(v)); } catch (e) { /* a full or blocked store only loses this save */ }
}

/** The shared mission's acorns (cards/missions.js). The card layer calls it once per game, inside its settled-game guard. */
export function payMissionAcorns(coins: number) {
  const v = loadVillage();
  v.coins += coins;
  saveVillage(v);
}

const PHOTOS_KEY = 'wildcrown.islands.v1';
const PHOTOS_MAX = 6;

export function loadIslandPhotos(): any[] {
  try {
    return JSON.parse(window.localStorage.getItem(PHOTOS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function addIslandPhoto(entry: { island: number; games: number; photo: string }) {
  try { window.localStorage.setItem(PHOTOS_KEY, JSON.stringify([...loadIslandPhotos(), entry].slice(-PHOTOS_MAX))); } catch (e) { /* the picture is a keepsake, the island goes on without it */ }
}

export function villageRivals(): any[] {
  return (window as any).wizardChess?.getVillageRivals?.() || [];
}

/** The pack's weekly list (garden-short G3). Empty when the pack has none: the week then simply never turns. */
export function villageWeekly(): any[] {
  return (window as any).wizardChess?.getVillageWeekly?.() || [];
}

export function settleFinishedGame(detail: { moves: any[]; color: 'w' | 'b'; result: string; rivalId: string | null; gameId?: number }) {
  const v = loadVillage();
  const now = Date.now();
  const summary = settleGame(v, { ...detail, now } as any);
  if (!summary) return summary;
  // A game's end is one of the two moments the island looks at the calendar; opening the island is the other.
  const week = rollWeek(v, villageWeekly(), now);
  saveVillage(v);
  return { ...summary, week };
}
