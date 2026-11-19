// 링크 미리보기(HK-3, 2026-11-18): 제목 · 설명 · og:image 가 한 줄(HK-1)과 그 장면 한 장을 가리키는가.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const meta = (key) => html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1] ?? null;

test('제목과 설명이 한 줄의 네 가지(슬롯 · 잡을 말 셋 · 둘을 먼저 · 왕관)를 말한다', () => {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || '';
  assert.match(title, /^WILD CROWN/);
  assert.match(title, /슬롯/);
  const text = meta('description');
  for (const word of ['슬롯', '잡을 말 셋', '먼저 둘', '왕관']) assert.ok(text.includes(word), `설명에 「${word}」가 없다`);
  assert.ok(text.length <= 110, `설명이 길다(${text.length}자) — 미리보기에서 잘린다`);
  assert.equal(meta('og:description'), text);
  assert.equal(meta('og:title'), title);
});

test('og:image 는 절대 주소이고, 그 파일이 1200×630 JPEG 로 public 에 있다', () => {
  const url = meta('og:image');
  assert.match(url, /^https:\/\/[^/]+\/og\.jpg$/);
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.ok(meta('og:image:alt'));
  const file = readFileSync(new URL('../public/og.jpg', import.meta.url));
  assert.ok(file[0] === 0xff && file[1] === 0xd8, 'JPEG 가 아니다');
  assert.ok(file.length < 300 * 1024, `그림이 크다(${Math.round(file.length / 1024)}KB)`);
  // SOF0/SOF2 표식에서 크기를 읽는다
  let at = 2; let size = null;
  while (at < file.length - 9) {
    if (file[at] !== 0xff) { at += 1; continue; }
    const marker = file[at + 1];
    if (marker === 0xc0 || marker === 0xc2) { size = [file.readUInt16BE(at + 7), file.readUInt16BE(at + 5)]; break; }
    at += 2 + file.readUInt16BE(at + 2);
  }
  assert.deepEqual(size, [1200, 630]);
});
