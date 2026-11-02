// Card collection save (browser only for now).
import { CARDS_KEY, POUCH_KEY, sanitizeCollection, sanitizePouch } from './economy.js';

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

/** This game's cards, waiting for the game to end. */
export function loadPouch(): any {
  try {
    return sanitizePouch(JSON.parse(window.localStorage.getItem(POUCH_KEY) || 'null'));
  } catch (e) {
    return null;
  }
}

export function savePouch(pouch: any) {
  try { window.localStorage.setItem(POUCH_KEY, JSON.stringify(pouch)); } catch (e) { /* the pouch then lives only in this page */ }
}

export function clearPouch() {
  try { window.localStorage.removeItem(POUCH_KEY); } catch (e) { /* nothing to clear */ }
}

const PLAYLOG_KEY = 'wildcrown.playlog.v1';
const PLAYLOG_MAX = 200;

/** A local record of how games went, for tuning the odds. It stays in this browser unless the player copies it. */
export function logGame(entry: any) {
  try {
    const log = JSON.parse(window.localStorage.getItem(PLAYLOG_KEY) || '[]');
    log.push(entry);
    window.localStorage.setItem(PLAYLOG_KEY, JSON.stringify(log.slice(-PLAYLOG_MAX)));
  } catch (e) { /* the log is optional */ }
}

export function readPlaylog(): string {
  try {
    return window.localStorage.getItem(PLAYLOG_KEY) || '[]';
  } catch (e) {
    return '[]';
  }
}
