'use strict';
// Этап 4 «Штаб / глава страны»: карта страны, бригады, исследования, губернаторы, фронт
const RG=[
  {id:'cap',nm:'Столичный округ',x:150,y:142},{id:'n',nm:'Север',x:146,y:70},{id:'w',nm:'Запад',x:80,y:130,lx:-14},
  {id:'e',nm:'Восток',x:232,y:112},{id:'s',nm:'Юг',x:118,y:212},{id:'c',nm:'Побережье',x:230,y:200}];
const RE=[[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[4,2],[4,5],[3,5]];
// Итоги этапа 3 → стартовые условия штаба: эвакуированные, цена жестоких приказов, обиды медиков, разрушенные мосты, удержанный город
const Link34=()=>{
  const sv=G.s3||0,k=G.s3k||0,cr=G.cruelty||0,br=G.bridges||0,ms=G.medStrikes||0,L=[];
  const pool=Math.min(2,Math.floor(sv/900)),gov=Math.round(Math.max(-20,clamp(sv/2600*12,0,12)-Math.min(20,k/15)-Math.min(10,cr*2.5))),pc=3-Math.min(2,ms),fund=3-Math.min(2,br),res=G.contain3?4:0;
  if(pool)L.push('эвакуированные пополнили резервы: +'+pool+' бр.');
  if(gov>=3)L.push('губернаторы благодарны: +'+gov+' к доверию');else if(gov<=-3)L.push('губернаторы помнят потери: '+gov+' к доверию');
  if(pc<3)L.push('медики обижены: договоров '+pc);
  if(fund<3)L.push('мосты разрушены: финансирование '+fund);
  if(res)L.push('город удержан: исследования +'+res+'%');
  return{pool,gov,pc,fund,res,L}};
const Hq={
  tut:'s4',tutAuto:false,rs:2,map:null,lt:0,
  enter(){
    Snd.play('hq');this.mkMap();
    const r=RG.map(o=>({...o,inf:.12+.25*G.cityInf,sup:60,br:0,lift:0,di:0,tk:[],pf:0}));
    r[0].inf=clamp(.5+.4*(G.epiInf||.5),.5,.95);r[0].sup=55;r.forEach(o=>o.di=o.inf);
    const LK=Link34();r.forEach((o,i)=>{o.sup=clamp(o.sup+LK.gov,5,95)});
    const s=this.s={m:1,t:0,mt:6,dur:36,r,sel:0,pool:Math.max(5,10-Math.floor(G.losses/12))+LK.pool,fr:0,front:false,res:Math.min(100,(G.research||0)+LK.res),fund:LK.fund,pc:LK.pc,nat:clamp(G.support,25,90),emer:false,head:false,offer:false,log:[],end:false,cd:{aid:0,data:0},ev:false,sig:'',fx:[],ftk:[0,0,0],clouds:[{x:40,y:70,v:4,s:1},{x:180,y:170,v:3,s:1.2},{x:290,y:40,v:5,s:.9},{x:100,y:230,v:3.5,s:1}]};
    for(const m of LK.L.slice(0,3).reverse())this.log(m);
    ctrl(false);this.ui();this.hudUpd();this.lt=performance.now();if(Coach.need('s4'))this.coach();else say('Вы — начальник штаба реагирования. Столичный округ — тяжёлый эпицентр.',5);
  },
  exit(){},
  coachUpdate(dt){const s=this.s;if(s.end)return;for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);s.hudT=(s.hudT||0)-dt;if(s.hudT<=0){s.hudT=.3;this.hudUpd();this.ui(1)}},
  coach(){const s=this.s;s.sel=3;this.ui();
    Coach.run('s4',[
      {t:'Карта страны. Нажмите на «Столицу» — это главный очаг.',pt:()=>({x:RG[0].x,y:RG[0].y-16,r:30}),wait:()=>s.sel===0},
      {t:'Бригады снижают заражение региона. Добавьте бригаду.',el:'#panel [data-a="s4_b+"]',wait:()=>s.r[0].br>0},
      {t:'Договор повышает доверие губернатора: без доверия бригады работают вдвое слабее.',el:'#panel [data-a=s4_gov]',wait:()=>s.pc<3},
      {t:'Наука приближает лекарство. Вложитесь в исследования.',el:'#panel [data-a=s4_res]',wait:()=>s.fund<3},
      {t:'Месяц длится 6 секунд. С 10-го месяца нужен фронт из 3 бригад. Не дайте заражению превысить 90%, а поддержке — упасть ниже 8%.',btn:'Войти в штаб ▶'}
    ],()=>{this.ui();say('Штаб работает!',2)})},
  mkMap(){const ex=Math.max(0,OX);if(!this.map||this.mapEx!==ex){this.map=Maps.country(RG,RE,ex,RS);this.mapEx=ex}},
  resize(){if(this.s&&this.mapEx!==Math.max(0,OX))this.mkMap()},
  log(m){const s=this.s;s.log.unshift('М'+s.m+': '+m);s.logN=(s.logN||0)+1;s.log.length=Math.min(4,s.log.length)},
  pop(x,y,t,c){this.s.fx.push({k:'txt',x,y,t:0,d:1.8,s:t,c:c||'#fff'})},
  tap(x,y){const s=this.s;if(x>MW)return;x-=OX;let b=this.map.regAt(x,y);
    if(!(b>=0&&b<RG.length)){b=-1;let bd=38;s.r.forEach((o,i)=>{const d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;b=i}})}
    if(b>=0){if(s.sel!==b){s.sel=b;beep(620,.04);vib(12)}this.ui()}},
  mean(){const s=this.s;return s.r.reduce((a,o)=>a+o.inf,0)/s.r.length},
  act(a){
    const s=this.s,o=s.r[s.sel];if(s.end)return;
    if(a==='br+'){if(s.pool>0){s.pool--;o.br++;beep(520,.05);vib(14);this.pop(o.x,o.y-26,'+1 бригада','#9fe8d6')}}
    else if(a==='br-'){if(o.br>0){o.br--;s.pool++;beep(400,.05)}}
    else if(a==='gov'){if(s.pc>0){s.pc--;o.sup=Math.min(95,o.sup+20);this.pop(o.x,o.y-26,'+20 доверия','#7dffa6');this.log('Договорённость с губернатором: '+o.nm)}}
    else if(a==='res'){if(s.fund>0){s.fund--;s.res=Math.min(100,s.res+5);beep(700,.06);this.pop(o.x,o.y-26,'+5% исследований','#9fd0e8')}}
    else if(a==='emer'){s.emer=!s.emer;this.log(s.emer?'Чрезвычайный закон введён':'Чрезвычайный закон отменён')}
    else if(a==='fr+'){if(s.pool>0&&s.front){s.pool--;s.fr++}}
    else if(a==='fr-'){if(s.fr>0){s.fr--;s.pool++}}
    else if(a==='aid'){if(s.cd.aid<=0){s.cd.aid=6;s.pool+=2;s.nat=Math.max(0,s.nat-3);this.log('Международная помощь: +2 бригады')}}
    else if(a==='data'){if(s.cd.data<=0){s.cd.data=6;s.res=Math.min(100,s.res+12);this.log('Обмен данными: +12% исследований')}}
    else if(a==='head_y'){s.head=true;s.offer=false;this.log('Вы возглавили страну');screen('');s.pause=false;}
    else if(a==='head_n'){s.offer=false;screen('');s.pause=false}
    else if(a==='ev_y'){s.ev=false;s.nat=Math.min(100,s.nat+8);s.pool=Math.max(0,s.pool-1);this.log('Фракция получила уступки');screen('');s.pause=false}
    else if(a==='ev_n'){s.ev=false;const t=s.r[1+Math.floor(Math.random()*5)];t.sup=Math.max(0,t.sup-25);t.br=Math.max(0,t.br-1);this.log('Фракция саботирует: '+t.nm);screen('');s.pause=false}
    else if(a==='raid')this.raid();
    else if(a==='prot')this.finish('protect');
    this.ui();
  },
  raidOk(){const s=this.s;return s.r[0].inf<.4&&this.mean()<.5},
  raid(){const s=this.s;if(!this.raidOk())return;s.end=true;G.role=s.head?'head':'staff';setTimeout(()=>Flow.raidIntro(s.head?12:9,G.role),200)},
  finish(k){const s=this.s;if(s.end)return;s.end=true;setTimeout(()=>Flow.ending(k),300)},
  update(dt){
    const s=this.s;if(s.end||s.pause)return;s.t+=dt;s.cd.aid=Math.max(0,s.cd.aid-dt/s.mt);s.cd.data=Math.max(0,s.cd.data-dt/s.mt);
    for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);
    if(s.t>=s.mt){s.t=0;s.m++;this.tick()}
    s.hudT=(s.hudT||0)-dt;if(s.hudT<=0){s.hudT=.3;this.hudUpd();this.ui(1)}
  },
  tick(){
    const s=this.s,rs=s.r,nx=rs.map(o=>o.inf);
    rs.forEach((o,i)=>{
      const g=.1*o.inf*(1-o.inf)*(1-s.res/230)+(i===0?.008:0);
      const eff=(o.sup>=35?1:.5)*(s.emer?1.4:1),cl=.045*o.br*eff;
      let nb=0,c=0;for(const[a,b]of RE){if(a===i){nb+=rs[b].inf;c++}if(b===i){nb+=rs[a].inf;c++}}
      const df=Math.max(0,(nb/c-o.inf))*.04;
      nx[i]=clamp(o.inf+g-cl+df,0,1);
      o.sup=clamp(o.sup+.4-(o.inf>.5?1.6:0)-(s.emer?1.2:0),0,100);
    });
    rs.forEach((o,i)=>o.inf=nx[i]);
    s.nat=clamp(s.nat+.15-(s.emer?1.6:0)-this.mean()*1.2,0,100);if(s.emer)G.cruelty+=.08;
    if(s.m%3===0)s.fund=Math.min(5,s.fund+1);if(s.m%4===0)s.pc=Math.min(3,s.pc+1);
    if(s.m===10&&!s.front){s.front=true;this.log('Внешний противник давит на границу: нужен фронт 3 бригады');say('На границе началась война. Выделите на фронт 3 бригады.',5)}
    if(s.front&&s.fr<3){s.nat=Math.max(0,s.nat-2.2);if(s.m%3===0)this.log('Фронт ослаблен: поддержка падает')}
    if(s.m===9&&s.nat>=45&&G.cruelty<3&&!s.head){s.offer=true;this.headCard()}
    if(s.m===20&&s.head&&!s.ev){s.ev=true;this.evCard()}
    if(s.m%12===0)this.log('Год '+(s.m/12)+': средняя заражённость '+Math.round(this.mean()*100)+'%');
    const mean=this.mean();
    if(s.nat<8||(G.cruelty>5&&s.nat<30)){this.finish('fall');return}
    if(mean>.9){this.finish('nuke');return}
    if(s.m>s.dur){this.endTime();return}
    this.ui();
  },
  endTime(){const s=this.s,mean=this.mean();if(s.res>=95)this.finish('protect');else if(mean<.62&&s.nat>25)this.finish('long');else this.finish('fall')},
  headCard(){this.s.pause=true;card({img:'country',k:'04 · ПОЛИТИЧЕСКАЯ ВЕТКА',t:'Руководство страной',p:['Правительство предлагает вам возглавить страну. Откроются международная карта, помощь и обмен данными — но фракции станут требовательнее, а любая рискованная операция — опаснее.'],b:[{l:'Принять пост',a:'s4_hy',c:'pri'},{l:'Остаться начальником штаба',a:'s4_hn'}]})},
  evCard(){this.s.pause=true;card({img:'siege',k:'ФРАКЦИИ',t:'Требование вооружённой фракции',p:['Организация вооружённых выживших предъявляет требования: отдать им часть бригад и контроль над складами.'],b:[{l:'Согласиться (−1 бригада, +8 поддержки)',a:'s4_ey'},{l:'Отказать (риск саботажа)',a:'s4_en',c:'red'}]})},
  hudUpd(){const s=this.s;hud(`<b>04 ${s.head?'ГЛАВА':'ШТАБ'}</b><span class="d">мес. ${s.m}/${s.dur}</span><span class="r">заражено ${Cnt.h('s4.mean',this.mean()*100,'p')}</span><span class="a">поддержка ${Cnt.h('s4.nat',Math.round(s.nat),'p')}</span><span class="g">исслед. ${Cnt.h('s4.res',Math.round(s.res),'p')}</span>`)},
  ui(soft){
    const s=this.s,o=s.r[s.sel],sig=JSON.stringify([s.sel,o.br,s.pool,s.fr,s.fund,s.pc,s.emer,s.front,s.head,Math.round(o.inf*40),Math.round(o.sup/3),this.raidOk(),s.cd.aid>0,s.cd.data>0,Math.round(s.res/5),s.log.join()]);
    if(soft&&sig===s.sig)return;s.sig=sig;
    let h=`<div class="ph"><b>${o.nm.toUpperCase()}</b><span class="chip ${o.sup<35?'r':o.sup<60?'a':''}">губернатор ${Cnt.h('s4.sup.'+o.id,Math.round(o.sup),'p')}</span></div>`;
    h+=`<div class="stat3"><div class="${o.inf>.5?'r':o.inf>.25?'a':'g'}">заражено<b>${Cnt.h('s4.inf.'+o.id,o.inf*100,'p')}</b></div><div>бригады<b>${o.br}</b></div><div>резерв<b>${Cnt.h('s4.pool',s.pool,'i')}</b></div></div>`;
    h+=`<div class="bar">${Cnt.bar('s4.bar.'+o.id,o.inf*100,'r')}</div>`;
    h+=`<div class="r2"><button class="pb" data-a="s4_b+" ${s.pool<1?'disabled':''}><span class="bd" style="--c:#6fc48a">+</span><span class="tx">Бригада</span></button><button class="pb" data-a="s4_b-" ${o.br<1?'disabled':''}><span class="bd" style="--c:#7f98a8">−</span><span class="tx">Бригада</span></button></div>`;
    h+=`<div class="r2"><button class="pb" data-a="s4_gov" ${s.pc<1?'disabled':''}><span class="bd" style="--c:#e5c53b">☎</span><span class="tx">Договор ${s.pc}</span></button><button class="pb" data-a="s4_res" ${s.fund<1?'disabled':''}><span class="bd" style="--c:#9fd0e8">⚗</span><span class="tx">Наука ${s.fund}</span></button></div>`;
    h+=`<button class="pb ${s.emer?'warn':''}" data-a="s4_emer"><span class="bd" style="--c:${s.emer?'#e5a93b':'#7f98a8'}">!</span><span class="tx">${s.emer?'Чрезвычайный закон: ВКЛ':'Чрезвычайный закон'}</span></button>`;
    if(s.front)h+=`<div class="r2"><button class="pb ${s.fr<3?'dng':''}" data-a="s4_f+" ${s.pool<1?'disabled':''}><span class="bd" style="--c:#ff6b5c">⚔</span><span class="tx">Фронт ${s.fr}/3 +</span></button><button class="pb" data-a="s4_f-" ${s.fr<1?'disabled':''}><span class="bd" style="--c:#7f98a8">−</span><span class="tx">Фронт</span></button></div>`;
    if(s.head)h+=`<div class="r2"><button class="pb" data-a="s4_aid" ${s.cd.aid>0?'disabled':''}><span class="bd" style="--c:#6fc48a">✚</span><span class="tx">Помощь</span></button><button class="pb" data-a="s4_data" ${s.cd.data>0?'disabled':''}><span class="bd" style="--c:#9fd0e8">≋</span><span class="tx">Данные</span></button></div>`;
    if(this.raidOk())h+=`<button class="pb glow" data-a="s4_raid"><span class="bd" style="--c:#4cc9c0">▶</span><span class="tx">Вернуться в «Эпицентр»</span></button>`;
    if(s.res>=95)h+=`<button class="pb glow" data-a="s4_prot"><span class="bd" style="--c:#7dffa6">★</span><span class="tx">Раздать защиту живым</span></button>`;
    h+=`<div class="log">${s.log.slice(0,2).map((x,i)=>`<div data-key="L${(s.logN||0)-i}">${x}</div>`).join('')}</div>`;panel(h);
  },
  plate(o,i,sel,t){
    const L=o.lift,x=Math.round(o.x),w=62,h=24,y=Math.round(o.y-30-L),x0=x+(o.lx||0)-(w>>1);
    cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(o.x+1,o.y+1-L*.3,8,3.5,0,0,TAU);cx.fill();
    cx.fillStyle=sel?'#fff':'rgba(140,190,210,.75)';cx.fillRect(x,y+h-2,.7,Math.max(0,Math.round(o.y-L-y-h+2)));
    cx.fillStyle=sel?'rgba(12,28,40,.95)':'rgba(6,14,22,.84)';cx.fillRect(x0,y,w,h);cx.strokeStyle=sel?'#fff':o.sup<35?'#e5a93b':'#3b8aa4';cx.lineWidth=sel?1.5:1;cx.strokeRect(x0+.5,y+.5,w-1,h-1);
    if(sel){cx.fillStyle='rgba(255,255,255,.09)';cx.fillRect(x0+1,y+1,w-2,h-2)}
    txt(o.nm.length>13?o.nm.replace('Столичный округ','Столица'):o.nm,x0+4,y+10,'#ffffff',10,'left');
    const ic=o.di>.5?'#ffb0a8':o.di>.25?'#ffd067':'#9fe8d6';txt(Math.round(o.di*100)+'%',x0+4,y+20,ic,10,'left');
    cx.fillStyle=o.sup<35?'#e0453a':o.sup<60?'#e5a93b':'#66e08a';cx.fillRect(x0+w-12,y+13,7,6);cx.fillStyle='rgba(255,255,255,.35)';cx.fillRect(x0+w-12,y+13,7,1);
    cx.fillStyle='#0b1720';cx.fillRect(x0+2,y+h-3,w-4,2);cx.fillStyle=o.di>.5?'#ff5b4d':o.di>.25?'#e5a93b':'#4cc9c0';cx.fillRect(x0+2,y+h-3,Math.round((w-4)*clamp(o.di,0,1)),2);
    if(o.id==='cap'){const b=Math.sin(this.s.t*4)*1.2;cx.fillStyle='#ff5b4d';cx.beginPath();cx.moveTo(x,y-9+b);cx.lineTo(x-4,y-2+b);cx.lineTo(x+4,y-2+b);cx.fill();cx.fillStyle='#2a0a0a';cx.fillRect(x,y-6+b,1,3)}
  },
  token(x,y,sc,col){Art3.tank(Math.round(x)+4,Math.round(y)+4,sc,col||'#2fb0a6')},
  draw(){
    const s=this.s,M=this.map,now=performance.now(),dt=Math.min(.1,(now-this.lt)/1000);this.lt=now;const tm=now/1000;
    cx.fillStyle='#06121c';cx.fillRect(0,0,W,H);cx.save();cx.translate(OX,0);cx.beginPath();cx.rect(-OX,0,MW,H);cx.clip();Maps.dimg(cx,M.cv,-M.ex,0);
    // блики на воде
    cx.fillStyle='rgba(200,240,250,.6)';M.sea.forEach((p,i)=>{if(Math.sin(tm*1.4+i*1.7)>.55)cx.fillRect(p[0],p[1],2+(i%3),1)});
    // «подъём» выбранного округа
    s.r.forEach((o,i)=>{o.lift=tw(o,'lift',i===s.sel?3:0,dt,10);const R=M.regs[i];if(!R||o.lift<.15)return;const L=o.lift;
      cx.globalAlpha=clamp(L/3,0,1)*.95;Maps.dimg(cx,R.pit,R.x0,R.y0);cx.globalAlpha=1;
      cx.globalAlpha=.25;Maps.dimg(cx,R.sl,R.x0+3,R.y0+4);cx.globalAlpha=1;
      for(let k=Math.ceil(L*RS);k>=1;k--)Maps.dimg(cx,R.sl,R.x0,R.y0-(L-k/RS));
      Maps.dimg(cx,R.cv,R.x0,R.y0-L)});
    // облака с тенями
    for(const c of s.clouds){c.x+=c.v*dt;if(c.x>W+50)c.x=-50;
      cx.fillStyle='rgba(0,0,0,.14)';for(let k=0;k<5;k++){cx.beginPath();cx.ellipse(c.x+k*9*c.s+6,c.y+Math.sin(k*2)*4+12,12*c.s,6*c.s,0,0,TAU);cx.fill()}
      cx.fillStyle='rgba(235,245,252,.12)';for(let k=0;k<5;k++){cx.beginPath();cx.ellipse(c.x+k*9*c.s,c.y+Math.sin(k*2)*4,12*c.s,7*c.s,0,0,TAU);cx.fill()}}
    // дорожные огни между округами и радар столицы
    M.roads.forEach((r,k)=>{for(let j=0;j<2;j++){const u=((tm*.045+k*.31+j*.5)%1),a=1-u,x=a*a*r.ax+2*a*u*r.cx+u*u*r.bx,y=a*a*r.ay+2*a*u*r.cy+u*u*r.by,dx=2*(a*(r.cx-r.ax)+u*(r.bx-r.cx)),dy=2*(a*(r.cy-r.ay)+u*(r.by-r.cy));
      Art3.car(x,y,dx,dy,{k:'civ',col:j?'#6b7a5a':'#9a8f6a'});Post.glow(x,y,7,'255,226,138',.18)}});
    {const c0=s.r[0],an=tm*.9;cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(90,220,200,.06)';cx.beginPath();cx.moveTo(c0.x,c0.y);cx.arc(c0.x,c0.y,190,an,an+.35);cx.fill();cx.restore()}
    // заражение
    cx.save();cx.translate(-M.ex,0);M.haze.render(cx,s.r.map(o=>o.inf),tm,{a:.62});cx.restore();
    s.r.forEach((o,i)=>{if(o.inf>.45)Post.glow(o.x,o.y,52,'255,60,45',.1*(o.inf-.2)*(1+.25*Math.sin(tm*2+i)))});
    // пожары и дым в сильно заражённых округах
    s.smk=s.smk||[];
    s.r.forEach((o,i)=>{if(o.inf<.4)return;const n=1+Math.floor((o.inf-.4)*9);for(let k=0;k<n;k++){const an=Maps.hash(i,k,3)*6.283,d=6+Maps.hash(i,k,4)*32,x=o.x+Math.cos(an)*d,y=o.y+Math.sin(an)*d*.75;if(M.regAt(x,y)!==i)continue;
      Art3.flame(x,y,.8+Maps.hash(i,k,5)*.6,tm,i*10+k);if(Math.random()<dt*.5)s.smk.push({x:x+rnd(-1,1),y:y-5,v:rnd(7,13),l:0,m:rnd(3,5)})}});
    for(const q of s.smk){q.y-=q.v*dt;q.x+=Math.sin(q.l*2+q.y*.1)*.15;q.l+=dt}s.smk=s.smk.filter(q=>q.l<q.m);
    for(const q of s.smk){const a=Math.sin(q.l/q.m*3.14)*.3,r=2.5+q.l*2.4,g=cx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);g.addColorStop(0,'rgba(36,28,30,'+a.toFixed(3)+')');g.addColorStop(1,'rgba(36,28,30,0)');cx.fillStyle=g;cx.fillRect(q.x-r,q.y-r,r*2,r*2)}
    // граница выбранного округа: «бегущие огни»
    {const R=M.regs[s.sel],L=s.r[s.sel].lift;if(R){const f=Math.floor(tm*28)*RS,u=1/RS;cx.fillStyle='rgba(255,255,255,.9)';for(let k=0;k<R.bd.length;k+=2){const q=k>>1;if(((q+f)&(16*RS-1))<8*RS)cx.fillRect(R.bd[k],R.bd[k+1]-L,u,u)}}}
    // фронт на восточной границе
    if(s.front){const bd=M.borderE,slots=[.22,.5,.78],hot=s.fr<3;
      slots.forEach((u,q)=>{const p=bd[Math.floor(bd.length*u)];if(!p)return;const x=p[0]-9,y=p[1];s.ftk[q]=tw(s.ftk,q,q<s.fr?1:0,dt,9);
        if(s.ftk[q]>.02)this.token(x,y,s.ftk[q],'#e5a93b');
        if(q>=s.fr){cx.save();cx.setLineDash([2,2]);cx.lineDashOffset=-tm*8;cx.strokeStyle='rgba(229,169,59,'+(.5+.4*Math.sin(tm*4+q)).toFixed(2)+')';cx.strokeRect(x-1.5,y-4.5,10,9);cx.restore()}});
      s.fxb=s.fxb||[];
      slots.forEach((u,q)=>{const p=bd[Math.floor(bd.length*u)];if(!p)return;cx.save();cx.translate(p[0]+17,0);cx.scale(-1,1);Art3.tank(0,p[1]+4,1,'#8a3a34');cx.restore();
        if(s.ftk[q]>.5)for(let m=0;m<3;m++)Art3.soldier(p[0]-6-m*3.5,p[1]+3+(m%2)*1.5,q*3+m+1,tm,1,hot&&Math.sin(tm*9+m*2+q)>.8)});
      if(hot&&Math.random()<dt*1.1){const p=bd[Math.floor(Math.random()*bd.length)];if(p)s.fxb.push({x:p[0]+rnd(2,14),y:p[1]+rnd(-6,6),t:0,d:1.5,seed:Math.floor(rnd(0,999))})}
      for(const f of s.fxb){f.t+=dt;Art3.boom(f.x,f.y,Math.min(.99,f.t/f.d),f.seed,.3)}s.fxb=s.fxb.filter(f=>f.t<f.d);
      const fb=bd[Math.floor(bd.length*.5)];if(fb){otx('ФРОНТ '+s.fr+'/3',fb[0]+22,fb[1]-18,s.fr>=3?'#7dffa6':'#ff8d82',11,'center')}}
    // подписи соседей
    cx.save();cx.translate(12,138);cx.rotate(-Math.PI/2);otx('СОЮЗНИК',0,0,'#8fc6e0',11,'center',.8);cx.restore();cx.save();cx.translate(322,138);cx.rotate(Math.PI/2);otx('ПРОТИВНИК',0,0,'#e08a80',11,'center',.8);cx.restore();
    // ярлыки округов, бригады
    const order=s.r.map((o,i)=>i).sort((a,b)=>s.r[a].y-s.r[b].y);
    for(const i of order){const o=s.r[i];o.di=tw(o,'di',o.inf,dt,4);
      while(o.tk.length<o.br)o.tk.push(0);o.tk.length=o.br;
      for(let q=0;q<o.br;q++){o.tk[q]=tw(o.tk,q,1,dt,8);this.token(o.x-24+q*9,o.y+7-o.lift,o.tk[q],'#2fb0a6')}}
    for(const i of order)this.plate(s.r[i],i,i===s.sel,tm);
    for(const f of s.fx){const u=f.t/f.d;otx(f.s,f.x,f.y-u*14,f.c,11,'center',clamp(1.7-u*1.7,0,1)*clamp(u*9,0,1))}
    cx.restore();
    cx.strokeStyle='#3a8f8a';cx.lineWidth=1;for(const[x,y,dx,dy]of[[2,24,1,1],[MW-3,24,-1,1],[2,H-3,1,-1],[MW-3,H-3,-1,-1]]){cx.beginPath();cx.moveTo(x,y+dy*10);cx.lineTo(x,y);cx.lineTo(x+dx*10,y);cx.stroke()}
    Post.vig(.7);
    {const nx=Math.round(SAFE.l)+16;otx('N',nx,40,'#9fb3c0',10,'center');cx.strokeStyle='#9fb3c0';cx.beginPath();cx.moveTo(nx,44);cx.lineTo(nx,58);cx.stroke();cx.fillStyle='#9fb3c0';cx.beginPath();cx.moveTo(nx,40);cx.lineTo(nx-3,46);cx.lineTo(nx+3,46);cx.fill()}
  }
};
ACT['s4_b+']=()=>Hq.act('br+');ACT['s4_b-']=()=>Hq.act('br-');ACT.s4_gov=()=>Hq.act('gov');ACT.s4_res=()=>Hq.act('res');ACT.s4_emer=()=>Hq.act('emer');
ACT['s4_f+']=()=>Hq.act('fr+');ACT['s4_f-']=()=>Hq.act('fr-');ACT.s4_aid=()=>Hq.act('aid');ACT.s4_data=()=>Hq.act('data');ACT.s4_raid=()=>Hq.act('raid');ACT.s4_prot=()=>Hq.act('prot');
ACT.s4_hy=()=>Hq.act('head_y');ACT.s4_hn=()=>Hq.act('head_n');ACT.s4_ey=()=>Hq.act('ev_y');ACT.s4_en=()=>Hq.act('ev_n');
