// 기기 익명 신분 (Play 출시 교훈 계획서 LA-R R-1, docs/plans/2026-11-09-play-launch-lessons-plan.md §4.2).
// 서버 랭크는 「누가 둔 판인가」를 알아야 한다. 로그인 없이 시작하려고, 첫 실행에 이 기기만의 서명 키 쌍(ECDSA P-256)을 만든다.
// 공개 키의 해시 앞부분이 신분 id 다. 비밀 키는 기기 밖으로 나가지 않고, R-2 에서 판 결과(PGN)에 서명할 때만 쓴다.
// 한계(계획서 §6-6): 앱을 지우거나 저장을 비우면 새 신분이 된다. 기기를 바꾸면 레이팅이 이어지지 않는다.
// 이름·이메일 같은 개인정보는 담지 않는다.

export const IDENTITY_KEY = 'wildcrown.identity.v1';
const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN = { name: 'ECDSA', hash: 'SHA-256' };

const b64url = (bytes) => {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s) => {
  const t = String(s).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const enc = (text) => new TextEncoder().encode(String(text));

/** 공개 키(JWK)만 남긴다. 다른 필드가 섞이면 같은 키가 다른 id 가 되지 않게. */
export const publicPart = (jwk) => ({ kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y });

/** 공개 키 → 신분 id(16글자). SHA-256(x.y) 앞 12바이트. */
export async function identityIdOf(pub, subtle = globalThis.crypto.subtle) {
  const digest = await subtle.digest('SHA-256', enc(`${pub.x}.${pub.y}`));
  return b64url(new Uint8Array(digest).slice(0, 12));
}

const validJwk = (j) => j && j.kty === 'EC' && j.crv === 'P-256' && typeof j.x === 'string' && typeof j.y === 'string';

/**
 * 이 기기의 신분을 읽거나 처음이면 만든다. 저장이 막힌 기기(사파리 비공개 등)는 이번 실행에만 쓰는 신분을 만들고 `kept: false` 로 알린다.
 * @param {Storage | null} storage
 */
export async function loadIdentity(storage, subtle = globalThis.crypto.subtle, now = () => Date.now()) {
  let saved = null;
  try { saved = JSON.parse(storage?.getItem(IDENTITY_KEY) || 'null'); } catch (e) { saved = null; }
  let priv = null;
  let pub = null;
  let created = 0;
  if (saved && saved.v === 1 && validJwk(saved.pub) && validJwk(saved.priv) && typeof saved.priv.d === 'string') {
    try {
      priv = await subtle.importKey('jwk', saved.priv, ALG, false, ['sign']);
      pub = publicPart(saved.pub);
      created = Number(saved.created) || 0;
    } catch (e) { priv = null; }
  }
  let kept = Boolean(priv);
  if (!priv) {
    const pair = await subtle.generateKey(ALG, true, ['sign', 'verify']);
    const privJwk = await subtle.exportKey('jwk', pair.privateKey);
    pub = publicPart(await subtle.exportKey('jwk', pair.publicKey));
    priv = pair.privateKey;
    created = now();
    try {
      storage?.setItem(IDENTITY_KEY, JSON.stringify({ v: 1, pub, priv: privJwk, created }));
      kept = Boolean(storage) && storage.getItem(IDENTITY_KEY) !== null;
    } catch (e) { kept = false; }
  }
  const id = await identityIdOf(pub, subtle);
  return {
    id,
    pub,
    created,
    kept,
    /** 글을 서명한다(R-2: 판 결과). base64url. */
    sign: async (text) => b64url(await subtle.sign(SIGN, priv, enc(text)))
  };
}

/** 다른 사람의 서명을 확인한다(공개 키 JWK · 글 · 서명). 형식이 틀리면 false. */
export async function verifySignature(pub, text, sig, subtle = globalThis.crypto.subtle) {
  try {
    if (!validJwk(pub)) return false;
    const key = await subtle.importKey('jwk', publicPart(pub), ALG, false, ['verify']);
    return await subtle.verify(SIGN, key, fromB64url(sig), enc(text));
  } catch (e) {
    return false;
  }
}

let cached = null;
/** 화면 층용: 한 실행에 한 번만 만든다. */
export function deviceIdentity() {
  if (!cached) cached = loadIdentity(typeof window === 'undefined' ? null : (() => { try { return window.localStorage; } catch (e) { return null; } })());
  return cached;
}
