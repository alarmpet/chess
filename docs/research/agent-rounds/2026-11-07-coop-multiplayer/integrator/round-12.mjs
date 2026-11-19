// grok·agy 가 낸 웹 페이지를 열어 인용 문장이 본문에 있는지 본다. 읽기만.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/coop-mp-20261107/';
const task = await taskSpace('coop multiplayer research');
const page = task.page('p1');
const checks = [
  ['grok', 'https://www.chess.com/terms/hand-and-brain-chess', ["But that's part of the fun.", 'on the same ground', 'the stronger player takes the brain role']],
  ['grok', 'https://en.wikipedia.org/wiki/Hand_and_brain', ['no other communication is permitted', '2021 Twitch Rivals']],
  ['grok', 'https://www.chess.com/blog/paulchuxin/the-rise-of-hand-brain-chess-a-fun-twist-on-traditional-play', ["doesn't have a dedicated Hand & Brain mode"]],
  ['grok', 'https://handbrainchess.com/play', ['Two humans, one side, against the AI.', 'Your friend takes the other role on this side.']],
  ['grok', 'https://devpost.com/software/twitch-plays-dice-chess', ['hides what happens next', 'has not yet been measured']],
  ['grok', 'https://www.chess.com/article/view/chesscom-love-story', ['blundered his own bishop in return']],
  ['agy', 'https://www.chess.com/terms/hand-and-brain', ['played in teams of two for each side']],
  ['agy', 'https://en.wikipedia.org/wiki/Sky_Team_(board_game)', ['roll their dice behind hidden screens', 'Spiel des Jahres']],
  ['agy', 'https://en.wikipedia.org/wiki/It_Takes_Two_(video_game)', ['strictly for two players', 'Game of the Year']],
  ['agy', 'https://en.wikipedia.org/wiki/Hanabi_(card_game)', ['no player can see their own hand', 'Spiel des Jahres']],
  ['agy', 'https://en.wikipedia.org/wiki/The_Crew:_The_Quest_for_Planet_Nine', ['verbal communication about hands is strictly restricted', 'Kennerspiel']],
  ['agy', 'https://en.wikipedia.org/wiki/Spirit_Island_(board_game)', ['players coordinate their moves simultaneously']],
  ['agy', 'https://en.wikipedia.org/wiki/Codenames_(board_game)', ['cannot play the game for your partner', 'Duet']],
  ['agy', 'https://en.wikipedia.org/wiki/Overcooked', ['cooperative cooking simulation video game']],
  ['agy', 'https://en.wikipedia.org/wiki/Pandemic_(board_game)', ['work together as a team of disease-fighting specialists']],
  ['agy', 'https://en.wikipedia.org/wiki/Hand_and_brain', ['communication is strictly limited']]
];
const out = [];
for (const [who, url, qs] of checks) {
  let text = '', final = url, err = null;
  try {
    await page.goto(url, { timeout: 60000 });
    await page.waitForTimeout(3500);
    final = await page.url();
    text = (await page.evaluate(() => document.body.innerText)).replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
  } catch (e) { err = String(e).slice(0, 150); }
  const low = text.toLowerCase();
  for (const q of qs) {
    const hit = low.includes(q.toLowerCase());
    out.push({ who, url, final, q, hit, err, len: text.length });
    console.log(err ? 'ERROR ' : hit ? 'FOUND ' : 'MISSING', who, url.replace('https://', '').slice(0, 60), '|', q, err ? err : '', text.length);
  }
  await fs.writeFile(DIR + 'page-' + url.replace(/[^a-z0-9]+/gi, '_').slice(8, 80) + '.txt', text.slice(0, 200000));
}
await fs.writeFile(DIR + 'web-quotes.json', JSON.stringify(out, null, 1));
