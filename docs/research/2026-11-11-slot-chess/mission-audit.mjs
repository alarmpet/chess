// 조사용 후향 분석. 제품 규칙을 변경하지 않으며 AI는 새 승리 조건을 모른다.
import {Chess} from 'chess.js';
import {chooseMove,positionKey} from '../../../src/rules/ai.js';
import {writeFileSync} from 'node:fs';
const sets={pnr:['p','n','r'],bqp:['b','q','p'],pnb:['p','n','b']};
const rows=[]; const N=60; const MAX=160;
for(const level of ['easy','normal']) {
 for(let g=0;g<N;g++){
  let seed=78123+g*13;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const chess=new Chess(), history=[], counts={w:{},b:{}}, hit={};
  let ply=0;
  for(;ply<MAX&&!chess.isGameOver();ply++){
   const pick=chooseMove(chess.fen(),{level,history,rand}); if(!pick)break;
   const m=chess.move(pick);history.push(positionKey(chess.fen()));
   if(m.captured) counts[m.color][m.captured]=(counts[m.color][m.captured]||0)+1;
   for(const [id,types] of Object.entries(sets)) for(const k of [2,3]){
    const key=id+'_'+k;const done=types.filter(t=>(counts[m.color][t]||0)>=1).length;
    if(!hit[key]&&done>=k)hit[key]={ply:ply+1,color:m.color,mate:chess.isCheckmate()};
   }
  }
  rows.push({level,g,plies:ply,terminal:chess.isGameOver(),mate:chess.isCheckmate(),hit});
 }
 console.log('finished '+level);
}
const median=a=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};
const report={method:'120 deterministic standard-chess self-play trajectories; new objectives are not known by AI; 160-ply cap; post-hoc stopping only',summary:{},rows};
for(const level of ['easy','normal']){
const rs=rows.filter(r=>r.level===level);const stats={games:rs.length,baselineMedianPly:median(rs.map(r=>r.plies)),truncated:rs.filter(r=>!r.terminal).length,candidates:{}};
for(const id of Object.keys(sets)) for(const k of [2,3]){
 const key=id+'_'+k, hits=rs.filter(r=>r.hit[key]);
 stats.candidates[key]={completed:hits.length,white:hits.filter(r=>r.hit[key].color==='w').length,strictlyEarlier:hits.filter(r=>r.hit[key].ply<r.plies).length,completionMedianPly:hits.length?median(hits.map(r=>r.hit[key].ply)):null,stoppingMedianPly:median(rs.map(r=>r.hit[key]?.ply||r.plies)),averagePlySaved:rs.reduce((s,r)=>s+r.plies-(r.hit[key]?.ply||r.plies),0)/rs.length};
}
report.summary[level]=stats;
}
writeFileSync(new URL('./mission-audit.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary,null,2));
