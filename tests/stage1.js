// Этап 1: диалоги учёного и «память» о встреченных заражённых. node stage1.js [ширина] [высота]
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
(async()=>{
 const b=await chromium.launch();
 const vw=+process.argv[2]||1000,vh=+process.argv[3]||459;
 const pg=await (await b.newContext({viewport:{width:vw,height:vh},hasTouch:true})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));pg.on('console',m=>{if(m.type()==='error'&&m.text())errs.push(m.text())});
 await pg.goto(GAME);await pg.waitForTimeout(400);
 await pg.evaluate(()=>{newGame();Flow.clear();Maze.cfg={kind:'sci',diff:0};setMode(Maze)});await pg.waitForTimeout(1200);
 console.log('tut card shown?',await pg.evaluate(()=>Tut.on),'dlg',await pg.evaluate(()=>Dlg.on));
 await pg.screenshot({path:OUT+`s1d_intro_${vw}.png`});
 for(let i=0;i<6;i++){const on=await pg.evaluate(()=>Dlg.on);if(!on)break;await pg.mouse.click(vw/2,vh*.85);await pg.waitForTimeout(250);await pg.mouse.click(vw/2,vh*.85);await pg.waitForTimeout(250)}
 await pg.waitForTimeout(400);await pg.screenshot({path:OUT+`s1d_play_${vw}.png`});
 // авария
 await pg.evaluate(()=>{const s=Maze.s;s.tasks=2;Maze.cutB3();Maze.cutSkip()});await pg.waitForTimeout(500);
 console.log('leak dlg',await pg.evaluate(()=>Dlg.on&&Dlg.cur.t));
 await pg.screenshot({path:OUT+`s1d_leak_${vw}.png`});
 while(await pg.evaluate(()=>Dlg.on)){await pg.mouse.click(vw/2,vh*.85);await pg.waitForTimeout(200)}
 await pg.evaluate(()=>{const s=Maze.s,F=Maze.F,p=s.p;s.god=true;const e=F.en[0];e.rise=0;e.x=p.x+Math.cos(p.a)*30;e.y=p.y+Math.sin(p.a)*30;e.stun=0;e.frz=0});
 await pg.waitForTimeout(400);
 console.log('met?',await pg.evaluate(()=>{const e=Maze.F.en[0];return{met:!!e.met,vis:e.vis}}),'dlg',await pg.evaluate(()=>Dlg.on&&Dlg.cur.t));
 await pg.screenshot({path:OUT+`s1d_met_${vw}.png`});
 while(await pg.evaluate(()=>Dlg.on)){await pg.mouse.click(vw/2,vh*.85);await pg.waitForTimeout(200)}
 // зомби остаётся в изученной зоне, игрок отворачивается
 await pg.evaluate(()=>{const s=Maze.s,F=Maze.F,p=s.p,e=F.en[0];e.stun=99;let best=null;for(let i=0;i<F.TW*F.TH;i++){if(!F.seen[i]||F.t[i]!==0)continue;const x=(i%F.TW)*TL+8,y=((i/F.TW)|0)*TL+8,d=Math.hypot(x-p.x,y-p.y);if(d>120&&d<200&&!Maze.seeP(x,y)){best={x,y};break}}if(best){e.x=best.x;e.y=best.y}window.__b=best});
 await pg.waitForTimeout(700);
 console.log('after move',JSON.stringify(await pg.evaluate(()=>{const e=Maze.F.en[0],s=Maze.s;return{best:window.__b,rem:!!e.rem,vis:+e.vis.toFixed(2),see:Maze.seeP(e.x,e.y),scr:[Math.round(e.x-Maze.cam0.x),Math.round(e.y-Maze.cam0.y)]}})));
 await pg.screenshot({path:OUT+`s1d_rem_${vw}.png`});
 console.log('errs',errs.slice(0,3).join('\n'));await b.close();
})();
