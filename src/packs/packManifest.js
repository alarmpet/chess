// Pack manifest — role→clip adapter and validator (PLAN.md §4.3, Phase 0a).
// Pure module: no DOM, no three.js, so the node test suite can import it.

export const PIECE_ROLES = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];

// Clip roles the engine plays today. A pack that lacks one of these is rejected.
export const REQUIRED_CLIP_ROLES = ['idle', 'move', 'attack', 'shatter'];
// Clip roles reserved for animal packs (PLAN §4.3). Optional for now.
export const OPTIONAL_CLIP_ROLES = ['charge', 'hit', 'victory', 'kneel', 'bored'];

export const RIG_KINDS = ['statue', 'animal', 'biped'];

// Attack timing used by the capture choreography. Manifest keys are in seconds of clip
// time (`*Sec`); the engine keeps its historical `*Clip` names internally.
const ATTACK_SYNC_KEYS = ['timeScale', 'swingStartSec', 'contactSec', 'blowSec', 'maxLunge'];

const DEFAULT_ATTACK_SYNC = { timeScale: 1.08, swingStartSec: 0.35, contactSec: 0.58, blowSec: 0.77, maxLunge: 0.065 };

/**
 * Validate a parsed pack manifest.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validatePackManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, errors: ['manifest is not an object'] };
  }
  if (manifest.schema !== 1) errors.push(`schema must be 1 (got ${manifest.schema})`);
  if (typeof manifest.id !== 'string' || !manifest.id) errors.push('id must be a non-empty string');
  if (!manifest.environment || typeof manifest.environment.model !== 'string') {
    errors.push('environment.model must be a string');
  }
  const pieces = manifest.pieces;
  if (!pieces || typeof pieces !== 'object') {
    errors.push('pieces must be an object');
    return { ok: false, errors };
  }
  for (const role of PIECE_ROLES) {
    const def = pieces[role];
    if (!def) {
      errors.push(`pieces.${role} is missing`);
      continue;
    }
    if (typeof def.model !== 'string' || !def.model) errors.push(`pieces.${role}.model must be a string`);
    if (def.rig !== undefined && !RIG_KINDS.includes(def.rig)) {
      errors.push(`pieces.${role}.rig must be one of ${RIG_KINDS.join('|')}`);
    }
    if (def.keepMaterials !== undefined && typeof def.keepMaterials !== 'boolean') {
      errors.push(`pieces.${role}.keepMaterials must be boolean`);
    }
    const clips = def.clips;
    if (!clips || typeof clips !== 'object') {
      errors.push(`pieces.${role}.clips must be an object`);
    } else {
      for (const clipRole of REQUIRED_CLIP_ROLES) {
        const v = clips[clipRole];
        const names = Array.isArray(v) ? v : v === undefined ? [] : [v];
        if (names.length === 0 || names.some((n) => typeof n !== 'string' || !n)) {
          errors.push(`pieces.${role}.clips.${clipRole} is required (string or string[])`);
        }
      }
      for (const key of Object.keys(clips)) {
        if (!REQUIRED_CLIP_ROLES.includes(key) && !OPTIONAL_CLIP_ROLES.includes(key)) {
          errors.push(`pieces.${role}.clips.${key} is not a known clip role`);
        }
      }
    }
    if (def.attackSync !== undefined) {
      if (typeof def.attackSync !== 'object') {
        errors.push(`pieces.${role}.attackSync must be an object`);
      } else {
        for (const k of Object.keys(def.attackSync)) {
          if (!ATTACK_SYNC_KEYS.includes(k)) errors.push(`pieces.${role}.attackSync.${k} is not a known key`);
          else if (typeof def.attackSync[k] !== 'number') errors.push(`pieces.${role}.attackSync.${k} must be a number`);
        }
        const a = def.attackSync;
        if ([a.swingStartSec, a.contactSec, a.blowSec].every((x) => typeof x === 'number') &&
            !(a.swingStartSec < a.contactSec && a.contactSec < a.blowSec)) {
          errors.push(`pieces.${role}.attackSync must satisfy swingStartSec < contactSec < blowSec`);
        }
      }
    }
    if (def.dropRate !== undefined) errors.push(`pieces.${role}.dropRate is forbidden (PLAN §12.3)`);
  }
  return { ok: errors.length === 0, errors };
}

/** Candidate clip names for a clip role, in priority order. */
export function clipCandidates(pieceDef, clipRole) {
  const v = pieceDef?.clips?.[clipRole];
  if (v === undefined) return [];
  return Array.isArray(v) ? v.slice() : [v];
}

/**
 * Resolve the clip role to an actual animation name present in `availableNames`.
 * Exact match first, then case-insensitive, then substring (legacy keyword behaviour).
 * @returns {string | null}
 */
export function resolveClipName(pieceDef, clipRole, availableNames) {
  const names = Array.from(availableNames || []);
  const candidates = clipCandidates(pieceDef, clipRole);
  for (const cand of candidates) {
    if (names.includes(cand)) return cand;
  }
  for (const cand of candidates) {
    const hit = names.find((n) => n.toLowerCase() === cand.toLowerCase());
    if (hit) return hit;
  }
  const kw = clipRole.toLowerCase();
  return names.find((n) => n.toLowerCase().includes(kw)) || null;
}

/** Build the engine's internal attack profile from a manifest `attackSync` block. */
export function toAttackProfile(attackSync) {
  const a = { ...DEFAULT_ATTACK_SYNC, ...(attackSync || {}) };
  return {
    timeScale: a.timeScale,
    swingStartClip: a.swingStartSec,
    contactClip: a.contactSec,
    blowClip: a.blowSec,
    maxLunge: a.maxLunge
  };
}

/** Normalise a promotion piece name coming from UI / PGN / network. */
export function normalizePromotion(value) {
  const map = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight', queen: 'queen', rook: 'rook', bishop: 'bishop', knight: 'knight' };
  if (typeof value !== 'string') return 'queen';
  return map[value.toLowerCase()] || 'queen';
}

/** Fetch + validate a pack manifest in the browser. Throws on failure. */
export async function fetchPackManifest(packId, base = './packs/') {
  const url = `${base}${packId}/pack.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`pack manifest fetch failed: ${url} (${res.status})`);
  const manifest = await res.json();
  const { ok, errors } = validatePackManifest(manifest);
  if (!ok) throw new Error(`pack manifest invalid (${url}):\n - ${errors.join('\n - ')}`);
  return manifest;
}
