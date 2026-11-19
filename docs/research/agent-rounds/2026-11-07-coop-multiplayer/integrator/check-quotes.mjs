import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync(new URL('./arctic.json', import.meta.url)));
const q = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const [id, s] of q) {
  const p = j[id];
  const hay = [p.title, p.body, p.allText].join('\n').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  console.log(hay.includes(s) ? 'FOUND  ' : 'MISSING', id, p.date, '|', s);
}
