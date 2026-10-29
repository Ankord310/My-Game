// Бот баланса этапа 4. node balance4.js <smart|idle> <прогонов>. smart: бригады на самые заражённые провинции, карантин столицы, деньги в науку, ответы на события.
const path=require('path'),GAME='file://'+path.resolve(__dirname,'../game/index.html');
const {chromium}=require('./pw');
const mode=process.argv[2]||'smart',N=+process.argv[3]||6;
(async()=>{const b=await chromium.launch();const pg=await (await b.newContext({viewport:{width:960,height:540}})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));
 await pg.goto(GAME);await pg.waitForTimeout(300);
 const res=await pg.evaluate(({mode,N})=>{const out=[];let end=null;Flow.ending=k=>{end=k};Flow.raidIntro=()=>{end='raid'};
  for(let n=0;n<N;n++){OPT.tips=false;Prog.d.tut={s4:1};newGame({cityInf:.4,epiInf:.6,support:50,losses:12,fociLeft:3,delay:60});end=null;Hq.enter();const s=Hq.s;let tt=0,lastM=0;
   while(!s.end&&tt<24*20+40){Hq.update(.1);tt+=.1;
    if(mode==='smart'&&s.m!==lastM){lastM=s.m;
      // бригады: столица до 3, затем самые заражённые
      const rs=[...s.r].sort((a,b)=>b.inf*b.pop-a.inf*a.pop);
      for(const o of s.r){let g=0;while(o.br>0&&o.inf<.15&&!o.rev&&g++<12){Hq.s.sel=o.i;Hq.act('br-')}}
      for(const o of rs){if(s.pool<=0)break;if(s.front&&s.fr<3){s.sel=o.i;Hq.act('fr+');continue}if(o.inf>.2&&o.br<3){s.sel=o.i;Hq.act('br+')}}
      if(s.front){let g=0;while(s.fr<3&&s.pool>0&&g++<5)Hq.act('fr+')}
      s.sel=5;if(s.r[5].q===0&&s.M>4){Hq.act('q')}
      {let g=0;while(s.M>=8&&g++<6){s.sel=5;Hq.act('res')}}
      for(const o of s.r){if(o.mood<35&&s.S>6){s.sel=o.i;Hq.act('sup')}if(o.mood<25&&s.P>=1){s.sel=o.i;Hq.act('gov')}}
      if(s.res>=95){Hq.act('prot')}
    }
    if(s.ev&&mode==='smart'){const k=s.ev.k,c={riot:s.M>=3?1:0,refugees:2,aid:1,samples:s.M>=4?1:2,leak:1,desert:s.M>=3?0:1,outbreak:s.M>=2?0:1,autonomy:1,truce:0,mutation:s.M>=5?0:1,convoy:1,offer:0}[k];Hq.evChoose(c)}
    else if(s.ev&&s.ev.t>1)Hq.evChoose(Hq.EV[s.ev.k].def)}
   out.push({m:s.m,end:end||(s.end?'?':'time'),mean:Math.round(Hq.mean()*100),cap:Math.round(s.r[5].inf*100),nat:Math.round(s.nat),res:Math.round(s.res),fp:Math.round(s.fp),M:Math.round(s.M),S:Math.round(s.S),events:s.stats.events})}
  return out},{mode,N});
 for(const r of res)console.log(JSON.stringify(r));console.log('errs',errs.length,errs[0]||'');await b.close()})();
