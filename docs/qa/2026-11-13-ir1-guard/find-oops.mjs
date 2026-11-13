import { Chess } from 'chess.js';
import { contractById, contractProgress } from '../../../src/rules/contractSets.js';
import { oopsCheck, finishers, dangerSquares } from '../../../src/rules/contractGuard.js';
const set = contractById('p2nb');
const lines = {
  quiet: 'Nc3 d5 Nb5 Bd7 Nd4 e5 Nb3 Ba4 d3 Bxb3',
  quiet2: 'Nc3 d5 Nb5 Bd7 Nd4 e5 Nb3 Ba4 d3 Bxb3 axb3 Bb4+',
  it: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 d3 Bg4'
};
for (const [name, line] of Object.entries(lines)) {
  const g = new Chess(); for (const s of line.split(' ')) g.move(s);
  const hist = g.history({ verbose: true });
  const prog = contractProgress(set, hist);
  const after = (m) => contractProgress(set, [...hist, m]);
  const hits = g.moves({ verbose: true }).map((m) => ({ m, c: oopsCheck(g.fen(), set, m, after) })).filter((x) => x.c.oops && x.c.avoidable);
  console.log(name, g.turn(), JSON.stringify({ w: prog.w.counts, b: prog.b.counts }), 'fin', finishers(g, set, prog).map((m) => m.san).join(','), 'danger', dangerSquares(g.fen(), set, prog).join(','), 'oops', hits.map((x) => `${x.m.san}→${x.c.threats.map((t) => t.san).join('/')}`).join(' ; '));
}
