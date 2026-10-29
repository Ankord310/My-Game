// Этап 1: без телефона лестница наверх закрыта (защита от тупика).
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const pg=await (await b.newContext({viewport:{width:960,height:540},hasTouch:true})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await pg.goto(GAME);await pg.waitForTimeout(400);
 const r=await pg.evaluate(async()=>{
  const out=[];OPT.tips=false;newGame();Flow.clear();Maze.cfg={kind:'sci',diff:0};setMode(Maze);const s=Maze.s;s.god=true;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  s.leak=true;s.tasks=3;out.push('pf='+s.pf+' floors='+s.fl.length);
  // перейти этажами до этажа с телефоном (телефона не берём)
  for(let i=1;i<=s.pf;i++){Maze.go(i,true)}
  const F=Maze.F,c=F.fwd,p=s.p;p.x=cellC(c.cx);p.y=cellC(c.cy);
  await sleep(1200);Maze.update(.02);
  out.push('fi='+s.fi+' lock='+Maze.upLock()+' near='+(s.near&&s.near.lab));
  edge.E=true;Maze.update(.02);edge.E=false;await sleep(100);
  out.push('after E (no phone) fi='+s.fi+' toast='+document.querySelector('#toast').textContent);
  // красная стрелка на скриншоте
  s.phone=true;Maze.update(.02);out.push('lock with phone='+JSON.stringify(Maze.upLock()));
  edge.E=true;Maze.update(.02);edge.E=false;await sleep(100);
  out.push('after E (phone) fi='+s.fi);
  return out});
 console.log(r.join('\n'));console.log('errs',errs.slice(0,3));
 // скриншот закрытой лестницы
 await pg.evaluate(()=>{const s=Maze.s;s.phone=false;Maze.go(s.pf,false);const F=Maze.F,c=F.fwd;s.p.x=cellC(c.cx);s.p.y=cellC(c.cy)+6});
 await pg.waitForTimeout(900);await pg.screenshot({path:OUT+'lock_stair.png'});
 await b.close()})();
