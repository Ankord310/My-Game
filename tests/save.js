// Сохранение прогресса: достижения, концовки, пройденное обучение и настройки переживают перезапуск —
// в обычном браузере, в WebView без localStorage (только резервная копия IndexedDB) и после очистки localStorage.
const path=require('path'),OUT=path.resolve(__dirname,'out')+'/',GAME='file://'+path.resolve(__dirname,'../game/index.html'),WEB='file://'+path.resolve(__dirname,'../dist/Epicenter-web.html');
require('fs').mkdirSync(OUT,{recursive:true});
const {chromium}=require('./pw');
let bad=0;const chk=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)bad++};
const NO_LS="Object.defineProperty(window,'localStorage',{configurable:true,get(){return null}});";
const NO_IDB="Object.defineProperty(window,'indexedDB',{configurable:true,get(){return undefined}});";
(async()=>{
  const b=await chromium.launch();
  const run=async(title,url,init,steps)=>{
    console.log('== '+title);
    const ctx=await b.newContext({viewport:{width:1000,height:459}});if(init)await ctx.addInitScript(init);
    const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
    await pg.goto(url);await pg.waitForTimeout(500);
    await steps(pg,async()=>{await pg.reload();await pg.waitForTimeout(700)});
    chk(!errs.length,'нет ошибок на странице '+(errs[0]||''));await ctx.close()};
  const earn=pg=>pg.evaluate(()=>{Prog.ach('clean');Prog.ach('s2a');Prog.end('cure');Prog.d.tut.s2=1;Prog.save();OPT.vib=false;saveOpt()});
  const state=pg=>pg.evaluate(()=>({ach:Object.keys(Prog.d.ach).sort().join(','),end:Object.keys(Prog.d.end).join(','),tut:!!Prog.d.tut.s2,vib:OPT.vib,ls:Store.ls,idb:Store.idb,ok:Store.ok(),
    menu:(document.querySelector('#screen .cc')||{}).textContent||''}));
  const wipe=pg=>pg.evaluate(()=>new Promise(r=>{try{localStorage.clear()}catch(e){}try{const q=indexedDB.deleteDatabase('epicenter');q.onsuccess=q.onerror=q.onblocked=()=>r()}catch(e){r()}}));

  await run('Обычный браузер: перезапуск',GAME,null,async(pg,reload)=>{
    await wipe(pg);await reload();await earn(pg);await pg.waitForTimeout(300);await reload();const s=await state(pg);console.log('   ',JSON.stringify(s));
    chk(s.ach==='clean,s2a'&&s.end==='cure'&&s.tut&&s.vib===false,'достижения, концовка, обучение и настройки сохранились');chk(s.ls&&s.idb,'работают обе копии');
    chk(s.menu.indexOf('1/')===0,'меню показывает открытую концовку')});

  await run('localStorage очищен, резервная копия цела',GAME,null,async(pg,reload)=>{
    await wipe(pg);await reload();await earn(pg);await pg.waitForTimeout(300);await pg.evaluate(()=>localStorage.clear());await reload();const s=await state(pg);console.log('   ',JSON.stringify(s));
    chk(s.ach==='clean,s2a'&&s.end==='cure'&&s.tut,'прогресс восстановлен из IndexedDB');
    chk(await pg.evaluate(()=>!!localStorage.getItem('epi.prog')),'прогресс снова записан в localStorage');chk(s.menu.indexOf('1/')===0,'меню обновилось после восстановления')});

  await run('WebView без localStorage (старая оболочка)',GAME,NO_LS,async(pg,reload)=>{
    await pg.evaluate(()=>new Promise(r=>{const q=indexedDB.deleteDatabase('epicenter');q.onsuccess=q.onerror=q.onblocked=()=>r()}));await reload();
    await earn(pg);await pg.waitForTimeout(300);await reload();const s=await state(pg);console.log('   ',JSON.stringify(s));
    chk(!s.ls&&s.idb,'localStorage недоступен, работает IndexedDB');chk(s.ach==='clean,s2a'&&s.end==='cure'&&s.tut,'прогресс пережил перезапуск')});

  await run('Хранилище недоступно совсем',GAME,NO_LS+NO_IDB,async(pg,reload)=>{
    await pg.waitForTimeout(1600);const s=await state(pg);const toast=await pg.evaluate(()=>$('#toast').textContent);
    chk(!s.ok,'игра понимает, что сохранять некуда');chk(/сохранение недоступно/i.test(toast),'игрок предупреждён: «'+toast.slice(0,50)+'…»');
    await pg.evaluate(()=>ACT.settings());await pg.waitForTimeout(200);chk(/недоступно/.test(await pg.evaluate(()=>$('#screen').textContent)),'в настройках видно «недоступно»');
    await pg.screenshot({path:OUT+'save_unavailable.png'})});

  await run('HTML-версия (dist): перезапуск',WEB,null,async(pg,reload)=>{
    await wipe(pg);await reload();await earn(pg);await pg.waitForTimeout(300);await reload();const s=await state(pg);console.log('   ',JSON.stringify(s));
    chk(s.ach==='clean,s2a'&&s.end==='cure'&&s.tut,'прогресс сохранился');
    await pg.evaluate(()=>ACT.settings());await pg.waitForTimeout(200);await pg.screenshot({path:OUT+'save_settings.png'})});

  await b.close();console.log(bad?`\n${bad} ПРОВАЛОВ`:'\nВСЁ OK');process.exit(bad?1:0);
})();
