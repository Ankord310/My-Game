// Пауза, пропуск кат-сцены (после первого прохождения), пропуск слайдов.
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const pg=await (await b.newContext({viewport:{width:960,height:540},hasTouch:true})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(GAME);await pg.waitForTimeout(400);
 const L=(...a)=>console.log(...a);
 // 1) пауза в этапе 1
 await pg.evaluate(()=>{OPT.tips=false;Prog.d.end={};newGame();Flow.clear();Maze.cfg={kind:'sci',diff:0};setMode(Maze)});await pg.waitForTimeout(600);
 const t0=await pg.evaluate(()=>Maze.s.t);await pg.waitForTimeout(500);const t1=await pg.evaluate(()=>Maze.s.t);
 await pg.keyboard.press('Escape');await pg.waitForTimeout(400);
 const pa=await pg.evaluate(()=>({on:Pause.on,box:!!document.querySelector('#pause')&&getComputedStyle(document.querySelector('#pause')).display}));
 const t2=await pg.evaluate(()=>Maze.s.t);await pg.waitForTimeout(600);const t3=await pg.evaluate(()=>Maze.s.t);
 L('run dt',(t1-t0).toFixed(2),'pause',JSON.stringify(pa),'frozen',t3===t2);
 await pg.screenshot({path:OUT+'ui_pause.png'});
 await pg.keyboard.press('Escape');await pg.waitForTimeout(400);const t4=await pg.evaluate(()=>Maze.s.t);await pg.waitForTimeout(400);
 L('resume advances',(await pg.evaluate(()=>Maze.s.t))>t4,'on',await pg.evaluate(()=>Pause.on));
 // кнопка паузы
 await pg.click('#pausebtn');await pg.waitForTimeout(300);L('btn pause on',await pg.evaluate(()=>Pause.on));
 await pg.click('[data-a=p_res]');await pg.waitForTimeout(300);L('btn resume',!(await pg.evaluate(()=>Pause.on)));
 // 2) кат-сцена и пропуск (не открыта)
 const cutTest=async(open)=>{
  await pg.evaluate((open)=>{Prog.d.end=open?{cure:1}:{};Maze.exit&&0;Flow.clear();newGame();Maze.cfg={kind:'sci',diff:0};setMode(Maze);const s=Maze.s;s.tasks=2;const it=s.fl[0].items.find(q=>q.task===2);s.p.x=it.x;s.p.y=it.y+10;s.god=true;Maze.cutB3()},open);
  await pg.waitForTimeout(1500);
  const v=await pg.evaluate(()=>({cut:!!Maze.s.cut,disp:getComputedStyle(document.querySelector('#cskip')).display,cine:document.querySelector('#app').classList.contains('cine')}));
  await pg.screenshot({path:OUT+`ui_cut_${open?'open':'locked'}.png`});
  return v};
 L('cut locked',JSON.stringify(await cutTest(false)));
 L('cut open',JSON.stringify(await cutTest(true)));
 await pg.click('#cskip');await pg.waitForTimeout(800);
 L('after skip',JSON.stringify(await pg.evaluate(()=>({cut:!!Maze.s.cut,leak:Maze.s.leak,cine:document.querySelector('#app').classList.contains('cine'),skipDisp:getComputedStyle(document.querySelector('#cskip')).display}))));
 await pg.waitForTimeout(2500);
 await pg.screenshot({path:OUT+'ui_after_skip.png'});
 // 3) слайд-шоу: кнопка пропуска
 for(const open of [false,true]){
  await pg.evaluate((open)=>{Prog.d.end=open?{cure:1}:{};Flow.clear();newGame();Slides.play(Story.intro(),()=>ACT.go1())},open);await pg.waitForTimeout(900);
  L('slides skip btn',open,await pg.evaluate(()=>{const e=document.querySelector('[data-a=sl_skip]');return e?getComputedStyle(e).display+'|'+e.offsetWidth:'none'}));
 }
 await pg.screenshot({path:OUT+'ui_slide_skip.png'});
 L('errs',errs.slice(0,4));await b.close()})();
