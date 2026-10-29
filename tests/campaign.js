// Сквозной прогон кампании: этап 1 (бот), этап 2, рейд, концовка. Проверяет переходы между этапами и ошибки консоли.
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const pg=await (await b.newContext({viewport:{width:900,height:405},hasTouch:true})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(GAME);await pg.waitForTimeout(300);
 await pg.evaluate(()=>{window.runBot=(maxSec)=>{const s=Maze.s;s.god=true;let steps=0;const DT=1/60;let key='',fld=null;
   const goal=()=>{let tfl,tp;
     if(s.k==='raid'){tfl=s.fl.length-1;const g=s.fl[tfl].goal;tp={x:cellC(g.cx),y:cellC(g.cy)}}
     else if(!s.leak){const it=s.fl[0].items.find(q=>q.task===s.tasks);tfl=0;tp={x:it.x,y:it.y}}
     else if(!s.phone){tfl=s.pf;const it=s.fl[tfl].items.find(q=>q.phone);tp={x:it.x,y:it.y}}
     else{tfl=s.fl.length-1;const g=s.fl[tfl].goal;tp={x:cellC(g.cx),y:cellC(g.cy)}}
     if(tfl===s.fi)return tp;const F=Maze.F,c=tfl>s.fi?F.fwd:F.back;return{x:cellC(c.cx),y:cellC(c.cy)}};
   while(!s.done&&steps<maxSec*60){if(s.cut){joy.on=false;joy.x=joy.y=0;Maze.update(DT);steps++;continue}const F=Maze.F,p=s.p,TW=F.TW,g=goal(),k=s.fi+':'+g.x+','+g.y;if(k!==key){key=k;fld=tdist(F,(g.x/TL)|0,(g.y/TL)|0)}
     const cx0=(p.x/TL)|0,cy0=(p.y/TL)|0;let best=-1,bd=fld[cy0*TW+cx0];
     for(let kk=0;kk<8;kk++){const dx=kk<4?DX4[kk]:(kk===4||kk===7?1:-1),dy=kk<4?DY4[kk]:(kk===4||kk===5?1:-1),nx=cx0+dx,ny=cy0+dy;const v=fld[ny*TW+nx];if(v>=0&&v<bd&&(kk<4||(F.t[cy0*TW+nx]===0&&F.t[ny*TW+cx0]===0))){bd=v;best=ny*TW+nx}}
     let tx=g.x,ty=g.y;if(best>=0){tx=(best%TW)*TL+8;ty=((best/TW)|0)*TL+8}
     const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1;joy.on=true;joy.x=dx/d;joy.y=dy/d;
     if(s.near&&s.near.kind!=='stair')edge.E=true;if(Math.hypot(g.x-p.x,g.y-p.y)<8)edge.E=true;
     Maze.update(DT);steps++}
   joy.on=false;joy.x=joy.y=0;return{done:s.done,t:steps/60,delay:G.delay,ratio:G.ratio,foci:G.foci}}});
 const pass=async(choice=0,max=60)=>{const seen=[];await pg.waitForFunction(()=>Slides.open||Tut.on,null,{timeout:3000}).catch(()=>{});for(let k=0;k<max;k++){
   const st=await pg.evaluate(()=>({sl:Slides.open,tut:Tut.on,last:Slides.open&&Slides.i===Slides.L.length-1,ch:Slides.open&&!!Slides.L[Slides.i].choices,res:Slides.open&&!!Slides.L[Slides.i].res}));
   if(st.tut){seen.push('tut');await pg.click('[data-a=tut_next]');await pg.waitForTimeout(80);continue}
   if(st.sl){await pg.evaluate(()=>{Slides.typed=999});await pg.waitForTimeout(60);
     if(st.last&&st.ch){seen.push('choice');await pg.click(`[data-a=sl_pick][data-d="${choice}"]`)}else{if(st.res)seen.push('result');await pg.click('[data-a=sl_next]')}
     await pg.waitForTimeout(120);continue}
   break}return seen.join(',')};
 const mname=()=>pg.evaluate(()=>mode===Maze?'Maze:'+Maze.cfg.kind:mode===Op?'Op':mode===Mil?'Mil':mode===Hq?'Hq':mode===Title?'Title':String(mode));
 console.log('menu mode',await mname());
 await pg.click('text=Новая кампания');
 console.log('intro ->',await pass(),await mname());
 console.log('stage1',JSON.stringify(await pg.evaluate(()=>runBot(900))));await pg.waitForTimeout(700);
 console.log('state',JSON.stringify(await pg.evaluate(()=>({slOpen:Slides.open,mode:String(mode&&mode.tut),done:Maze.s&&Maze.s.done,err:window.__err||''}))),errs.slice(0,3));
 console.log('after stage1 ->',await pass(),await mname());
 console.log('stage2',JSON.stringify(await pg.evaluate(()=>{const s=Op.s;for(let i=0;i<5000&&!s.end;i++){Op.update(.05);for(const c of s.calls){if(c.asg||c.cl>0)continue;if(!c.clar){s.sel=c;Op.clarify();continue}s.sel=c;const k=TYP[c.shown||c.type].svc;if(!k){Op.ignore();continue}if(s.crew[k]>0)Op.dispatch(k);else if(c.type==='dead'&&s.crew.police>0)Op.dispatch('police')}}return{end:s.end,t:s.t,losses:s.losses,foci:s.foci.length,contain:G.contain2}})));await pg.waitForTimeout(700);
 console.log('after stage2 (raid offered? choose raid) ->',await pass(0),await mname());
 if((await mname())==='Maze:raid'){
   console.log('raid',JSON.stringify(await pg.evaluate(()=>runBot(900))));await pg.waitForTimeout(700);console.log('ending ->',await pass(1),await mname());
 }
 console.log('PROG',await pg.evaluate(()=>JSON.stringify(Prog.d)));console.log('errs',errs.slice(0,5),await pg.evaluate(()=>window.__err||''));
 await b.close();
})();
