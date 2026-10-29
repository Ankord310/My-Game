// HTML-версия для компьютера (dist/Epicenter-web.html): клавиатура, пауза, обучение мышью. Сначала: python3 tools/build_web.py
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
const vw=+process.argv[2]||1366,vh=+process.argv[3]||768;
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const pg=await (await b.newContext({viewport:{width:vw,height:vh}})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));pg.on('console',m=>{if(m.type()==='error'&&m.text())errs.push(m.text())});
 const reqs=[];pg.on('request',r=>{if(!r.url().startsWith('data:')&&!r.url().endsWith('Epicenter-web.html'))reqs.push(r.url())});
 await pg.goto(WEB);await pg.waitForTimeout(600);
 console.log('kbd class',await pg.evaluate(()=>document.documentElement.classList.contains('kbd')),'TOUCH',await pg.evaluate(()=>TOUCH));
 await pg.screenshot({path:OUT+`wd_title_${vw}.png`});
 await pg.click('text=Новая кампания');await pg.waitForTimeout(500);
 for(let i=0;i<30;i++){const o=await pg.evaluate(()=>Slides.open);if(!o)break;await pg.keyboard.press('Enter');await pg.waitForTimeout(150)}
 await pg.waitForTimeout(300);
 const m=await pg.evaluate(()=>({mode:mode===Maze?'Maze':String(mode),tut:Tut.on}));console.log('after slides',JSON.stringify(m));
 if(m.tut){await pg.keyboard.press('Enter')}
 await pg.waitForTimeout(1200);
 console.log('dlg',await pg.evaluate(()=>Dlg.on&&Dlg.cur.t));
 await pg.screenshot({path:OUT+`wd_dlg_${vw}.png`});
 for(let i=0;i<8;i++){if(!(await pg.evaluate(()=>Dlg.on)))break;await pg.keyboard.press('Space');await pg.waitForTimeout(150)}
 console.log('dlg closed',!(await pg.evaluate(()=>Dlg.on)));
 const p0=await pg.evaluate(()=>({x:Maze.s.p.x,y:Maze.s.p.y}));
 for(const k of['d','s','a','w','ArrowRight','ArrowDown']){await pg.keyboard.down(k);await pg.waitForTimeout(500);await pg.keyboard.up(k)}
 const p1=await pg.evaluate(()=>({x:Maze.s.p.x,y:Maze.s.p.y}));console.log('moved',JSON.stringify(p0),JSON.stringify(p1));
 await pg.keyboard.press('Escape');await pg.waitForTimeout(300);console.log('pause',await pg.evaluate(()=>Pause.on));await pg.screenshot({path:OUT+`wd_pause_${vw}.png`});
 await pg.keyboard.press('Escape');await pg.waitForTimeout(300);
 await pg.screenshot({path:OUT+`wd_play_${vw}.png`});
 // этап 2 мышью
 await pg.evaluate(()=>{Prog.d.tut={};newGame({foci:3,delay:60,ratio:3});Flow.clear();setMode(Op)});await pg.waitForTimeout(500);
 for(let step=0;step<14;step++){const st=await pg.evaluate(()=>Coach.on?{i:Coach.i,btn:!!Coach.st.btn,R:Coach.R}:null);if(!st)break;
   if(st.btn)await pg.keyboard.press('Enter');else if(st.R)await pg.mouse.click((st.R.l+st.R.r)/2,(st.R.t+st.R.b)/2);
   await pg.waitForTimeout(st.i===1||st.i===3?2200:350);if(st.i===3){for(let k=0;k<25;k++){if(!(await pg.evaluate(()=>Coach.i===3)))break;await pg.waitForTimeout(400)}}}
 console.log('coach done',JSON.stringify(await pg.evaluate(()=>({on:Coach.on,tut:Prog.d.tut}))));
 await pg.waitForTimeout(2500);await pg.screenshot({path:OUT+`wd_s2_${vw}.png`});
 console.log('external requests',reqs.length?reqs:'none');
 console.log('errs',errs.slice(0,3).join('\n'));await b.close();
})();
