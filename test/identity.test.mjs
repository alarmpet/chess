// 기기 익명 신분(LA-R R-1): 처음에 만들고, 다시 열면 같은 id, 서명은 그 공개 키로만 맞고, 저장이 막혀도 실행은 된다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDENTITY_KEY, identityIdOf, loadIdentity, verifySignature } from '../src/net/identity.js';

function memStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => m.delete(k), _m: m };
}

test('first run makes an identity and the next run reads the same one back', async () => {
  const store = memStore();
  const a = await loadIdentity(store, undefined, () => 1234);
  assert.equal(a.kept, true);
  assert.equal(a.created, 1234);
  assert.match(a.id, /^[A-Za-z0-9_-]{16}$/);
  assert.equal(a.id, await identityIdOf(a.pub));
  const saved = JSON.parse(store.getItem(IDENTITY_KEY));
  assert.equal(saved.v, 1);
  assert.deepEqual(Object.keys(saved.pub).sort(), ['crv', 'kty', 'x', 'y'], 'no private part in the public key');
  const b = await loadIdentity(store, undefined, () => 9999);
  assert.equal(b.id, a.id);
  assert.equal(b.created, 1234);
});

test('a signature checks out only with the signer’s key and the same text', async () => {
  const me = await loadIdentity(memStore());
  const other = await loadIdentity(memStore());
  assert.notEqual(me.id, other.id);
  const text = '1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0';
  const sig = await me.sign(text);
  assert.equal(await verifySignature(me.pub, text, sig), true);
  assert.equal(await verifySignature(other.pub, text, sig), false, 'someone else’s key');
  assert.equal(await verifySignature(me.pub, text.replace('1-0', '0-1'), sig), false, 'changed result');
  assert.equal(await verifySignature(me.pub, text, 'not-a-signature'), false);
  assert.equal(await verifySignature({ kty: 'RSA' }, text, sig), false);
});

test('blocked or broken storage still gives an identity for this run, marked as not kept', async () => {
  const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
  const a = await loadIdentity(blocked);
  assert.equal(a.kept, false);
  assert.match(a.id, /^[A-Za-z0-9_-]{16}$/);
  const none = await loadIdentity(null);
  assert.equal(none.kept, false);
  const junk = memStore();
  junk.setItem(IDENTITY_KEY, '{"v":1,"pub":{"kty":"EC"},"priv":5}');
  const fresh = await loadIdentity(junk);
  assert.equal(fresh.kept, true, 'a broken save is replaced');
  assert.equal(JSON.parse(junk.getItem(IDENTITY_KEY)).pub.x, fresh.pub.x);
});
