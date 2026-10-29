// Этап 2: панель вызова не пересоздаётся (не мигает), метки вызовов не накладываются.
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
(async()=>{
 const b=await chromium.launch();
 const pg=await (await b.newContext({viewport:{width:1000,height:459},hasTouch:true})).newPage();
 const errs=[];pg.on('pageerror',e=>errs.push(e.stack));pg.on('console',m=>{if(m.type()==='error'&&m.text())errs.push(m.text())});
 await pg.goto(GAME);await pg.waitForTimeout(400);
 await pg.evaluate(()=>{OPT.tips=false;newGame({foci:3,delay:60,ratio:3});Flow.clear();setMode(Op)});await pg.waitForTimeout(300);
 for(let k=0;k<10;k++){const st=await pg.evaluate(()=>Tut.on);if(st){await pg.click('[data-a=tut_next]').catch(()=>{});await pg.waitForTimeout(60)}else break}
 // промотать до звонка из дома и выбрать его
 await pg.evaluate(()=>{for(let i=0;i<320;i++)Op.update(.05)});
 await pg.evaluate(()=>{const s=Op.s;const c=s.calls.find(c=>c.sp)||s.calls[0];s.sel=c;Op.ui();
   window.__card=document.querySelector('#panel .callc');window.__btn=document.querySelector('#panel [data-a=op_cl]');window.__hud=document.querySelector('#hud .cnt');
   window.__mut=0;new MutationObserver(l=>{for(const m of l){if(m.type==='childList'&&[...m.removedNodes].some(n=>n===window.__card||(n.contains&&n.contains(window.__card))))window.__mut++}}).observe(document.querySelector('#panel'),{childList:true,subtree:true})});
 // 12 секунд реального времени: усталость, журнал, новые вызовы, счётчики
 const t0=await pg.evaluate(()=>Op.s.t);
 await pg.waitForTimeout(12000);
 const r=await pg.evaluate(()=>({t:Op.s.t,sameCard:document.querySelector('#panel .callc')===window.__card,cardConnected:window.__card.isConnected,sameBtn:document.querySelector('#panel [data-a=op_cl]')===window.__btn,removed:window.__mut,log:Op.s.log.length,calls:Op.s.calls.length,sel:Op.s.sel&&Op.s.sel.id}));
 console.log('t0',t0.toFixed(1),JSON.stringify(r));
 // уточнить — карточка должна остаться тем же элементом, сменится только текст
 await pg.click('[data-a=op_cl]');await pg.waitForTimeout(2600);
 console.log('after clarify',JSON.stringify(await pg.evaluate(()=>({same:document.querySelector('#panel .callc')===window.__card,txt:document.querySelector('#panel .callc .tt').textContent.slice(0,40)}))));
 // выбрать другой вызов — карточка должна смениться
 await pg.evaluate(()=>{const s=Op.s;const c=s.calls.find(c=>c!==s.sel&&!c.asg);if(c){s.sel=c;Op.ui()}});
 console.log('other call → new card',await pg.evaluate(()=>document.querySelector('#panel .callc')!==window.__card));
 // наложения: промотать 100 с без обработки и измерить минимальные расстояния между метками
 const ov=await pg.evaluate(()=>{const s=Op.s;for(let i=0;i<2000;i++)Op.update(.05);
   let mn=99,pairs=0;for(let i=0;i<s.calls.length;i++)for(let j=i+1;j<s.calls.length;j++){const a=s.calls[i],b=s.calls[j],d=Math.hypot(a.x-b.x,(a.y-b.y)*.85);mn=Math.min(mn,d);if(Math.abs(a.x-b.x)<18&&Math.abs(a.y-b.y)<22)pairs++}
   return{t:s.t,calls:s.calls.length,minDist:+mn.toFixed(1),overlapPairs:pairs}});
 console.log('overlap',JSON.stringify(ov));
 await pg.waitForTimeout(300);await pg.screenshot({path:OUT+'flick_s2.png'});
 console.log('errs',errs.slice(0,3).join('\n'));await b.close();
})();
