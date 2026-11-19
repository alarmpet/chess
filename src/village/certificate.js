// Lord's certificate (desire plan D5): one picture of the island and what was earned on it, made to be shown to someone.
// Nothing the player typed goes in — piece names stay out — so the picture carries no personal text.
import { KIND_ORDER } from './economy.js';
import { albumProgress } from '../cards/economy.js';

/** What the certificate says, as plain data. `rivals` is the engine's getVillageRivals() list. */
export function certificateLines(v, col, rivals = [], date = new Date()) {
  const album = albumProgress(col);
  const ready = KIND_ORDER.filter((k) => v.built.some((b) => b.kind === k && b.ready)).length;
  const pad = (n) => String(n).padStart(2, '0');
  return {
    title: '영주 증명서',
    island: `${v.island}번째 섬`,
    rows: [`🏠 건물 ${ready}/${KIND_ORDER.length}`, `🃏 도감 ${album.owned}/${album.total}`, `♟ ${v.games}판`],
    flags: rivals.filter((r) => r.wins > 0).map((r) => ({ name: r.name?.ko || r.id, wins: r.wins, complete: Boolean(r.complete), color: r.flag || '#f0606a' })),
    date: `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`,
    marks: /** @type {string[]} */ ([])   // earned marks, filled by the village screen (desire plan D6)
  };
}

const W = 1080;
const H = 1350;

/** Draws the certificate (browser only) and resolves with a PNG blob. `photo` is a data URL of the island. */
export async function drawCertificate(lines, photo) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff8e4';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#e0a93a';
  ctx.lineWidth = 14;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.lineWidth = 3;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  ctx.fillStyle = '#5a2d0c';
  ctx.textAlign = 'center';
  ctx.font = 'bold 76px sans-serif';
  ctx.fillText(`👑 ${lines.title}`, W / 2, 160);
  ctx.font = 'bold 44px sans-serif';
  ctx.fillStyle = '#9a5a1c';
  ctx.fillText(lines.island, W / 2, 228);

  const img = await new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = photo;
  });
  const box = { x: 90, y: 270, w: W - 180, h: 600 };
  if (img) {
    // The opening camera leaves sea around the island; a closer crop fills the frame with it.
    const s = Math.max(box.w / img.width, box.h / img.height) * 1.3;
    const sw = box.w / s;
    const sh = box.h / s;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 28);
    ctx.clip();
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, box.x, box.y, box.w, box.h);
    ctx.restore();
  }

  ctx.font = 'bold 46px sans-serif';
  ctx.fillStyle = '#5a2d0c';
  ctx.fillText(lines.rows.join('    '), W / 2, 950);

  // Rival flags: a coloured pennant per rival beaten, with its wins; a star once every trinket is won.
  const flags = lines.flags.slice(0, 3);
  ctx.font = 'bold 34px sans-serif';
  if (flags.length === 0) {
    ctx.fillStyle = '#9a7a5c';
    ctx.fillText('라이벌을 이기면 깃발이 여기에 섭니다', W / 2, 1050);
  }
  flags.forEach((f, i) => {
    const y = 1020 + i * 56;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.moveTo(250, y - 24);
    ctx.lineTo(310, y - 6);
    ctx.lineTo(250, y + 12);
    ctx.fill();
    ctx.fillStyle = '#5a2d0c';
    ctx.textAlign = 'left';
    ctx.fillText(`${f.name} ${f.wins}승${f.complete ? ' ★' : ''}`, 330, y + 6);
    ctx.textAlign = 'center';
  });

  // Earned marks (desire plan D6) in one line; only what was earned, never what is missing.
  if (lines.marks?.length) {
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#b7791f';
    ctx.fillText(lines.marks.slice(0, 4).join('   '), W / 2, 1206);
  }

  ctx.font = '30px sans-serif';
  ctx.fillStyle = '#9a7a5c';
  ctx.fillText(`WILD CROWN · ${lines.date}`, W / 2, H - 92);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
