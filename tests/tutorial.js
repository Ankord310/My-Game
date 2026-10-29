// Проходит интерактивное обучение этапов 2–4 кликами по подсветке. node tutorial.js [ширина] [высота]
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
const vw=+process.argv[2]||1000,vh=+process.argv[3]||459;
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:vw,height:vh},hasTouch:true})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));pg.on('console',m=>{if(m.type()==='error'&&m.text())errs.push(m.text())});
 await pg.goto(GAME);await pg.waitForTimeout(400);
 for(const [nm,M,g] of [['s2','Op',{foci:3,delay:60,ratio:3}],['s3','Mil',{fociLeft:3,losses:8,support:50,ratio:3}],['s4','Hq',{cityInf:.4,epiInf:.6,support:50,losses:12,fociLeft:3,delay:60,ratio:3}]]){
  await pg.evaluate(([M,g])=>{Prog.d.tut={};OPT.tips=true;newGame(g);Flow.clear();setMode(eval(M))},[M,g]);await pg.waitForTimeout(500);
  let n=0;
  for(let step=0;step<16;step++){
   const st=await pg.evaluate(()=>Coach.on?{i:Coach.i,t:Coach.st.t,btn:!!Coach.st.btn,R:Coach.R}:null);
   if(!st)break;n++;
   if(st.i<=1||st.btn)await pg.screenshot({path:OUT+`co_${nm}_${st.i}_${vw}.png`});
   if(st.btn)await pg.click('#coach .cgo');else if(st.R)await pg.mouse.click((st.R.l+st.R.r)/2,(st.R.t+st.R.b)/2);else{console.log(nm,'step',st.i,'NO TARGET');await pg.waitForTimeout(500)}
   await pg.waitForTimeout(nm==='s2'&&(st.i===1||st.i===3)?2600:350);
   if(nm==='s2'&&st.i===3){for(let k=0;k<25;k++){if(!(await pg.evaluate(()=>Coach.i===3)))break;await pg.waitForTimeout(400)}}
  }
  const r=await pg.evaluate(M=>{const m=eval(M);return{coach:Coach.on,done:Prog.d.tut,t:m.s.t}},M);
  console.log(nm,'steps',n,JSON.stringify(r));
  await pg.waitForTimeout(1500);
  console.log(nm,'running t',await pg.evaluate(M=>eval(M).s.t.toFixed(1),M));
 }
 console.log('errs',errs.slice(0,3).join('\n'));await b.close();
})();
