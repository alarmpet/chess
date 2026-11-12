// 잡기·메이트 글자(「메이트!」·「샤악!」)는 만든 프레임부터 작은 크기로 나와야 한다.
// 2026-11-07 PT 캡처에서 첫 프레임이 기본 크기 1(화면 높이 전체)로 그려져 거대한 글자가 번쩍였다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createImpactFx } from '../src/fx/impactFx.js';

// 글자 텍스처는 캔버스로 그린다 — 노드에는 없으니 아무것도 안 하는 캔버스를 준다.
globalThis.document ||= {
  createElement: () => ({
    getContext: () => new Proxy({ measureText: () => ({ width: 300 }) }, { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true })
  })
};

test('글자는 만든 즉시 화면 높이의 작은 몫으로, 갱신 뒤에도 1.25배를 넘지 않는다', () => {
  const scene = new THREE.Scene();
  const fx = createImpactFx(scene);
  fx.label(new THREE.Vector3(0, 0, 0), '메이트!', 0.14);
  const sprite = scene.children.find((o) => o.isSprite);
  assert.ok(sprite, '글자 스프라이트');
  const screen = 2 * Math.tan((40 * Math.PI) / 360);
  // 크기 0.14 는 화면 높이의 14%. 처음은 그 0.4배.
  assert.ok(Math.abs(sprite.scale.y - 0.14 * screen * 0.4) < 1e-9, `첫 높이 ${sprite.scale.y}`);
  assert.ok(sprite.scale.y < 0.2, '첫 프레임에 화면을 덮지 않는다');
  let max = 0;
  for (let i = 0; i < 40 && sprite.parent; i++) {
    fx.update(1 / 60);
    max = Math.max(max, sprite.scale.y);
  }
  assert.ok(max <= 0.14 * screen * 1.25 + 1e-9, `최대 높이 ${max}`);
});
