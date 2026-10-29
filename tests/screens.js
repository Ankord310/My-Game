// Скриншоты всех этапов на заданном экране + проверка нажатий по карте. node screens.js <ширина> <высота> <метка>
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const vw=+process.argv[2]||1000,vh=+process.argv[3]||459,tag=process.argv[4]||'x';
 const pg=await (await b.newContext({viewport:{width:vw,height:vh},hasTouch:true})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));pg.on('console',m=>{if(m.type()==='error'&&m.text())errs.push(m.text())});
 await pg.goto(GAME);await pg.waitForTimeout(500);
 console.log(tag,'W',JSON.stringify(await pg.evaluate(()=>({W,MW,OX,app:[$('#app').offsetWidth,$('#app').offsetHeight]}))));
 const shot=async n=>pg.screenshot({path:OUT+`va_${n}_${tag}.png`});
 await shot('title');
 await pg.evaluate(()=>{OPT.tips=false;newGame();Flow.clear();Maze.cfg={kind:'sci',diff:0};setMode(Maze)});await pg.waitForTimeout(700);await shot('s1');
 await pg.evaluate(()=>{newGame({foci:3,delay:60,ratio:3});Flow.clear();setMode(Op)});await pg.waitForTimeout(500);
 // тап по вызову
 await pg.evaluate(()=>{const s=Op.s;s.t=15;});
 for(let i=0;i<40;i++){await pg.evaluate(()=>Op.update(.25))}
 const tapRes=await pg.evaluate(()=>{const s=Op.s,c=s.calls[0];if(!c)return'no calls';const r=cv.getBoundingClientRect(),sx=r.left+(c.x+OX)/W*r.width,sy=r.top+c.y/H*r.height;window.__tp=[sx,sy];return{c:[c.x,c.y],OX}});
 if(tapRes!=='no calls'){const [sx,sy]=await pg.evaluate(()=>window.__tp);await pg.mouse.click(sx,sy);await pg.waitForTimeout(300);console.log('tap2',JSON.stringify(tapRes),'sel ok',await pg.evaluate(()=>!!(Op.s.sel&&Op.s.calls[0]===Op.s.sel)))}
 await shot('s2');
 await pg.evaluate(()=>{newGame({fociLeft:3,losses:8,support:50,ratio:3});G.role='military';Flow.clear();setMode(Mil)});await pg.waitForTimeout(600);
 await pg.evaluate(()=>{for(let i=0;i<30;i++)Mil.update(.25)});await shot('s3');
 await pg.evaluate(()=>{newGame({cityInf:.4,epiInf:.6,support:50,losses:12,fociLeft:3,delay:60,ratio:3});G.role='staff';Flow.clear();setMode(Hq)});await pg.waitForTimeout(900);await shot('s4');
 await pg.evaluate(()=>{OPT.tips=true;Flow.clear();setMode(Op)});await pg.waitForTimeout(500);await shot('tut2');
 console.log('errs',errs.slice(0,4));await b.close()})();
