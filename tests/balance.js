// Бот-симулятор баланса. node balance.js <этап 2|3> <реакция,с> <точность> <прогонов>. Пример: node balance.js 2 1.6 .92 8
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
// Симуляция «играющего» бота для этапов 2 и 3: python-free, прямой вызов Op.update/Mil.update
const {chromium}=require('./pw');
const stage=+process.argv[2]||2, react=+process.argv[3]||1.6, acc=+process.argv[4]||.92, N=+process.argv[5]||5;
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:960,height:540}})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));
 await pg.goto(GAME);await pg.waitForTimeout(400);
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
      OPT.tips=false;newGame({fociLeft:3,losses:8,support:50,ratio:3});Mil.enter();const s=Mil.s;
      let nextAct=2,tt=0,idleBus=0,peakInf=0;const dt=.05;let sqT=0;const trace=[];
      while(!s.end&&tt<400){
        Mil.update(dt);tt+=dt;
        if(s.buses.length===0)idleBus+=dt;
        if(Math.floor(tt)%25===0&&Math.abs(tt-Math.round(tt))<dt/2)trace.push(Math.round(tt)+':B'+Math.round(s.n[1].inf*100)+' A'+Math.round(s.n[0].inf*100)+' C'+Math.round(s.n[2].inf*100)+' E'+Math.round(s.n[4].inf*100)+' sv'+s.saved);
        if(tt>=nextAct){
          const mode=(typeof window.BOT_MODE==='string')?window.BOT_MODE:'active';
          let did=false;
          // отряды: перераспределять каждые ~20 c
          if(mode==='active'&&tt>sqT){sqT=tt+12;for(const o of s.n)if(o.sq){s.sqPool+=o.sq;o.sq=0}
            const ds=s.n.map((o,i)=>[o,i]).filter(([o])=>o.k==='d'&&o.pop>0).sort((a,b)=>b[0].inf-a[0].inf);
            for(let q=0;q<3&&ds.length;q++){s.sel=ds[q%Math.min(2,ds.length)][1];Mil.act('sq+')}}
          // вертолёт
          if(!did&&s.heli<=0&&s.t>=30&&s.sup>=25){const c=s.n.map((o,i)=>[o,i]).filter(([o])=>o.k==='d'&&o.pop*(1-o.inf)>30).sort((a,b)=>b[0].pop*(1-b[0].inf)-a[0].pop*(1-a[0].inf))[0];if(c){s.sel=c[1];Mil.act('heli');did=true}}
          // автобус
          if(!did&&s.buses.length<3){const c=s.n.map((o,i)=>[o,i]).filter(([o])=>o.k==='d'&&!o.blk&&o.pop*(1-o.inf)>=20).sort((a,b)=>b[0].pop*(1-b[0].inf)*(.6+b[0].inf)-a[0].pop*(1-a[0].inf)*(.6+a[0].inf))[0];if(c){s.sel=c[1];Mil.act('bus');did=true}}
          nextAct=tt+(did?react:.5);
        }
      }
      let pp=0;for(const o of s.n)if(o.k==='d')pp+=o.pop;
      out.push({t:Math.round(tt),saved:s.saved,killed:s.killed,B:Math.round(s.n[1].inf*100),A:Math.round(s.n[0].inf*100),C:Math.round(s.n[2].inf*100),E:Math.round(s.n[4].inf*100),popLeft:pp,idleBus:Math.round(idleBus),sup:Math.round(s.sup),contain:G.contain3,trace:trace.join(' | ')});
    }
  }
  return out;
 },{stage,react,acc,N});
 for(const r of res)console.log(JSON.stringify(r));
 console.log('errs',errs.slice(0,3).join('\n--\n'));
 await b.close();
})();
