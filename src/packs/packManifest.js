// Pack manifest — role→clip adapter and validator (PLAN.md §4.3, Phase 0a).
// Pure module: no DOM, no three.js, so the node test suite can import it.

export const PIECE_ROLES = ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'];

// Clip roles the engine plays today. A pack that lacks one of these is rejected.
export const REQUIRED_CLIP_ROLES = ['idle', 'move', 'attack', 'shatter'];
// Clip roles reserved for animal packs (PLAN §4.3). Optional for now.
export const OPTIONAL_CLIP_ROLES = ['charge', 'hit', 'victory', 'kneel', 'bored'];

export const RIG_KINDS = ['statue', 'animal', 'biped'];

// Appearance (PLAN §14.2 · §14.3, 2026-10-29): stages and trinkets change the look only — never a move, never a
// number. Stage 0 is the piece's own `model`; later stages come from `pieces.<role>.stages[id]`. Trinkets sit on bone
// sockets; only non-weapon slots exist (4th round verdict: weapons and shields are out).
export const ITEM_SLOTS = ['head', 'neck'];
// Display rule (PLAN §14.0, 표시광고법): stage / item names must not suggest strength.
export const FORBIDDEN_LOOK_WORDS = ['전사', '전설', '진화', '강한', '강함', '최강', 'warrior', 'legend', 'legendary', 'evolve', 'evolution', 'strong', 'power'];

// Attack timing used by the capture choreography. Manifest keys are in seconds of clip
// time (`*Sec`); the engine keeps its historical `*Clip` names internally.
const ATTACK_SYNC_KEYS = ['timeScale', 'swingStartSec', 'contactSec', 'blowSec', 'maxLunge', 'standoff'];

const DEFAULT_ATTACK_SYNC = { timeScale: 1.08, swingStartSec: 0.35, contactSec: 0.58, blowSec: 0.77, maxLunge: 0.065 };

const COLOR_RE = /^#[0-9a-f]{6}$/i;

/** `model` may be one name for both sides or `{ w, b }`. Returns the name for a colour. */
export function modelNameFor(pieceDef, color) {
  const m = pieceDef?.model;
  if (m && typeof m === 'object') return m[color] || m.w || m.b || null;
  return typeof m === 'string' ? m : null;
}

function isHex(v) {
  return typeof v === 'string' && COLOR_RE.test(v);
}

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
  const env = manifest.environment;
  if (!env || typeof env !== 'object') {
    errors.push('environment must be an object');
  } else if (env.type === 'procedural') {
    for (const k of ['background']) {
      if (env[k] !== undefined && !isHex(env[k])) errors.push(`environment.${k} must be a #rrggbb colour`);
    }
    if (env.fog !== undefined && (!isHex(env.fog.color) || typeof env.fog.density !== 'number')) {
      errors.push('environment.fog must be { color: #rrggbb, density: number }');
    }
    if (env.ground !== undefined && !isHex(env.ground.color)) errors.push('environment.ground.color must be a #rrggbb colour');
  } else if (typeof env.model !== 'string') {
    errors.push('environment.model must be a string (or environment.type = "procedural")');
  }
  if (manifest.board !== undefined) {
    for (const k of ['light', 'dark', 'rim']) {
      if (manifest.board[k] !== undefined && !isHex(manifest.board[k])) errors.push(`board.${k} must be a #rrggbb colour`);
    }
  }
  if (manifest.teamTint !== undefined) {
    for (const k of ['w', 'b']) {
      if (manifest.teamTint[k] !== undefined && !isHex(manifest.teamTint[k])) errors.push(`teamTint.${k} must be a #rrggbb colour`);
    }
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
    if (!modelNameFor(def, 'w') || !modelNameFor(def, 'b')) {
      errors.push(`pieces.${role}.model must be a string or { w, b }`);
    }
    if (def.fitHeight !== undefined && !(typeof def.fitHeight === 'number' && def.fitHeight > 0)) {
      errors.push(`pieces.${role}.fitHeight must be a positive number (board squares)`);
    }
    if (def.yawOffset !== undefined && typeof def.yawOffset !== 'number') {
      errors.push(`pieces.${role}.yawOffset must be a number (radians)`);
    }
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
    if (def.stages !== undefined) {
      const ids = stageIds(manifest);
      if (typeof def.stages !== 'object') errors.push(`pieces.${role}.stages must be an object`);
      else for (const [id, m] of Object.entries(def.stages)) {
        if (!ids.includes(id)) errors.push(`pieces.${role}.stages.${id} is not declared in looks.stages`);
        if (!modelNameFor({ model: m }, 'w') || !modelNameFor({ model: m }, 'b')) errors.push(`pieces.${role}.stages.${id} must be a string or { w, b }`);
      }
    }
    if (def.slots !== undefined && (!Array.isArray(def.slots) || def.slots.some((x) => !ITEM_SLOTS.includes(x)))) {
      errors.push(`pieces.${role}.slots must be a subset of ${ITEM_SLOTS.join('|')}`);
    }
  }
  if (manifest.looks !== undefined) {
    const st = manifest.looks?.stages;
    if (!Array.isArray(st) || st.length === 0) errors.push('looks.stages must be a non-empty array');
    else {
      const seen = new Set();
      for (const x of st) {
        if (!x || typeof x.id !== 'string' || !x.id) { errors.push('looks.stages[].id must be a string'); continue; }
        if (seen.has(x.id)) errors.push(`looks.stages id ${x.id} is duplicated`);
        seen.add(x.id);
        if (badLookName(x.name)) errors.push(`looks.stages.${x.id}.name uses a strength word (PLAN §14.0)`);
      }
    }
  }
  if (manifest.items !== undefined) {
    if (typeof manifest.items !== 'object') errors.push('items must be an object');
    else for (const [id, it] of Object.entries(manifest.items)) {
      if (!it || typeof it.model !== 'string') errors.push(`items.${id}.model must be a string`);
      if (!ITEM_SLOTS.includes(it?.slot)) errors.push(`items.${id}.slot must be one of ${ITEM_SLOTS.join('|')}`);
      if (badLookName(it?.name)) errors.push(`items.${id}.name uses a strength word (PLAN §14.0)`);
      for (const k of ['dropRate', 'price', 'power', 'stat']) {
        if (it && it[k] !== undefined) errors.push(`items.${id}.${k} is forbidden — trinkets are looks only (PLAN §12.3 · §14.3)`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

function badLookName(name) {
  const texts = typeof name === 'string' ? [name] : name && typeof name === 'object' ? Object.values(name) : [];
  return texts.some((t) => typeof t === 'string' && FORBIDDEN_LOOK_WORDS.some((w) => t.toLowerCase().includes(w)));
}

/** Stage ids in order; the first is the base look (the piece's own `model`). */
export function stageIds(manifest) {
  const st = manifest?.looks?.stages;
  return Array.isArray(st) && st.length ? st.map((x) => x.id) : ['base'];
}

/** Model name for a piece at a stage and colour; falls back to the base model when that stage has none. */
export function stageModelFor(pieceDef, stageId, color) {
  const m = pieceDef?.stages?.[stageId];
  return (m && modelNameFor({ model: m }, color)) || modelNameFor(pieceDef, color);
}

/** Slots a role accepts (default: every slot). The king keeps his crown — PLAN §14.3. */
export function slotsFor(pieceDef) {
  return Array.isArray(pieceDef?.slots) ? pieceDef.slots.filter((x) => ITEM_SLOTS.includes(x)) : ITEM_SLOTS.slice();
}

/**
 * Clean a saved appearance choice against the pack: unknown stages fall back to the base, unknown items or items in
 * the wrong slot (or a slot the role does not have) are dropped. Shape: { w: { pawn: { stage, head?, neck? } … }, b: … }.
 */
export function sanitizeCosmetics(manifest, raw) {
  const ids = stageIds(manifest);
  const items = manifest?.items || {};
  const out = { w: {}, b: {} };
  for (const color of ['w', 'b']) {
    for (const role of PIECE_ROLES) {
      const def = manifest?.pieces?.[role];
      const src = raw?.[color]?.[role] || {};
      const stage = ids.includes(src.stage) && (src.stage === ids[0] || def?.stages?.[src.stage]) ? src.stage : ids[0];
      const entry = { stage };
      for (const slot of slotsFor(def)) {
        const id = src[slot];
        if (typeof id === 'string' && items[id] && items[id].slot === slot) entry[slot] = id;
      }
      out[color][role] = entry;
    }
  }
  return out;
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
    maxLunge: a.maxLunge,
    standoff: typeof a.standoff === 'number' ? a.standoff : undefined
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
