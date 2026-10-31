// Card collection save (browser only for now).
import { CARDS_KEY, sanitizeCollection } from './economy.js';

export function loadCollection(): any {
  try {
    return sanitizeCollection(JSON.parse(window.localStorage.getItem(CARDS_KEY) || 'null'));
  } catch (e) {
    return sanitizeCollection(null);
  }
}

export function saveCollection(col: any) {
  try { window.localStorage.setItem(CARDS_KEY, JSON.stringify(col)); } catch (e) { /* a full or blocked store loses this card only */ }
}
