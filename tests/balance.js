// Бот-симулятор баланса. node balance.js <этап 2|3> <реакция,с> <точность> <прогонов> [apc — для этапа 3: бот использует БТР]. Пример: node balance.js 2 1.6 .92 8
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
// Симуляция «играющего» бота для этапов 2 и 3: python-free, прямой вызов Op.update/Mil.update
const {chromium}=require('./pw');
const stage=+process.argv[2]||2, react=+process.argv[3]||1.6, acc=+process.argv[4]||.92, N=+process.argv[5]||5;
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:960,height:540}})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));
 await pg.goto(GAME);await pg.waitForTimeout(400);if(process.argv[6]==='apc'||process.argv[5]==='apc')await pg.evaluate(()=>{window.BOT_APC=true});
 const res=await pg.evaluate(({stage,react,acc,N})=>{
  Flow.afterOp=()=>{};Flow.afterMil=()=>{};Tut.on=false;
  const out=[];
  for(let n=0;n<N;n++){
    if(stage===2){
      OPT.tips=false;newGame({foci:3,delay:60,ratio:3});Op.enter();const s=Op.s;
      let nextAct=2,idle=0,busy=0,peak=0,tt=0,maxCalls=0,calls=0,cum=[];const seen=new Set();
      const dt=.05;let coffeeAt=0;
      while(!s.end&&tt<400){
        Op.update(dt);tt+=dt;
        for(const c of s.calls)seen.add(c.id);
        if(s.calls.length===0&&s.units.length===0)idle+=dt;
        maxCalls=Math.max(maxCalls,s.calls.length);calls+=s.calls.length*dt;
        if(Math.floor(tt)%20===0&&Math.abs(tt-Math.round(tt))<dt/2){cum.push(s.foci.length+'/'+s.calls.length)}
        if(tt>=nextAct&&s.lock<=0){
          let did=false;
          const un=s.calls.filter(c=>!c.asg).sort((a,b)=>(b.age/b.ttl)-(a.age/a.ttl));
          const rdy=un.filter(c=>c.clar);
          if(s.fat>78&&!rdy.length&&Math.random()<.5){Op.coffee();nextAct=tt+react*1.5;did=true}
          else if(rdy.length){const c=rdy[0];s.sel=c;if(c.type==='fake'){Op.ignore();nextAct=tt+react;continue}let k=TYP[c.shown||c.type].svc;if(c.sp)k='amb';if(Math.random()>acc)k=['police','amb','fire'][(Math.random()*3)|0];
            if(k==='spec'&&!s.spec)k='police';
            if(s.crew[k]>0){Op.dispatch(k);nextAct=tt+react*1.2;did=true}
            else{const alt=['police','amb','fire','spec'].filter(q=>s.crew[q]>0&&(q!=='spec'||s.spec));if(alt.length){nextAct=tt+react*.5;did=true}}}
          if(!did){const q=un.find(c=>!c.clar&&c.cl<=0);if(q){s.sel=q;Op.clarify();nextAct=tt+react;did=true}}
          if(!did)nextAct=tt+.4;
        }
      }
      out.push({t:Math.round(tt),idle:Math.round(idle),foci:s.foci.length,loss:s.losses,ok:s.ok,fail:s.fail,calls:seen.size,avgPend:+(calls/tt).toFixed(1),maxPend:maxCalls,contain:G.contain2,trace:cum.join(' ')});
    }else{
      // этап 3 «Эвакуация»: бот отправляет свободную технику к самой выгодной группе (польза/время, без смертельных маршрутов); с флагом apc ставит БТР на пути толп
      OPT.tips=false;Prog.d.tut={s3:1};newGame({fociLeft:3,losses:8,support:60,ratio:3});Mil.enter();const s=Mil.s;let next=1,tt=0;
      while(!s.end&&tt<400){Mil.update(.05);tt+=.05;
        if(tt>=next){next=tt+react;
          for(const v of s.v){if(v.st!=='ready'||v.d.apc)continue;let best=null,bs=-1;
            for(const g of s.g){if(g.st!=='wait'||g.people<=0)continue;if(s.v.some(q=>q!==v&&q.tgt===g&&(q.st==='go'||q.st==='load')&&!q.d.apc))continue;
              s.sel=v.id;Mil.setTarget({k:'g',id:g.id});const pr=Mil.preview();if(!pr||pr.risk>=2)continue;
              const sc=Math.min(v.d.cap,g.people)*(g.doom<40?1.4:1)/(pr.eta+4)/(1+pr.risk*1.2);if(sc>bs){bs=sc;best=g}}
            if(best){s.sel=v.id;Mil.setTarget({k:'g',id:best.id});Mil.go()}}
          if(window.BOT_APC){for(const v of s.v){if(!v.d.apc||v.st!=='ready')continue;
              const h=s.h.find(h=>h.st==='attack'&&h.tgt&&h.tgt.k==='g'&&!s.v.some(q=>q.d.apc&&q.st!=='ready'&&q.st!=='dead'&&Math.hypot(q.x-h.x,q.y-h.y)<40));
              if(h){s.sel=v.id;Mil.setTarget({k:'n',id:Mil.nodeAt(h.x,h.y)});Mil.go()}}
            for(const v of s.v)if(v.d.apc&&v.st==='hold'&&!s.h.some(h=>Math.hypot(h.x-v.x,h.y-v.y)<45)){s.sel=v.id;Mil.recall()}}}}
      out.push({t:Math.round(tt),saved:Math.round(s.saved),killed:Math.round(s.killed),total:s.total,pct:Math.round(100*s.saved/s.total),vlost:s.vlost,lostGroups:s.g.filter(g=>g.st==='lost').length,contain:G.contain3});
    }
  }
  return out;
 },{stage,react,acc,N});
 for(const r of res)console.log(JSON.stringify(r));
 console.log('errs',errs.slice(0,3).join('\n--\n'));
 await b.close();
})();
