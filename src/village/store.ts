// Village save (browser only for now) and the link from a finished chess game to the village.
import { VILLAGE_KEY, sanitizeVillage, settleGame } from './economy.js';

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

export function settleFinishedGame(detail: { moves: any[]; color: 'w' | 'b'; result: string; rivalId: string | null }) {
  const v = loadVillage();
  const summary = settleGame(v, detail as any);
  saveVillage(v);
  return summary;
}
