'use strict';
// Этап 3 «Военный»: эвакуация города по районам (блокпосты, автобусы, вертолёты, мосты, артиллерия)
const MN=[
  {id:'A',nm:'Север',x:78,y:80,pop:600,k:'d'},{id:'B',nm:'Центр',x:78,y:152,pop:1000,k:'d'},{id:'C',nm:'Юг',x:78,y:224,pop:600,k:'d'},
  {id:'D',nm:'Сев-Вост',x:268,y:80,pop:500,k:'d'},{id:'E',nm:'Аэродром',x:268,y:152,pop:0,k:'s'},{id:'F',nm:'Юго-Вост',x:268,y:224,pop:500,k:'d'},
  {id:'b1',nm:'Мост-1',x:170,y:80,pop:0,k:'b'},{id:'b2',nm:'Мост-2',x:170,y:152,pop:0,k:'b'},{id:'b3',nm:'Мост-3',x:170,y:224,pop:0,k:'b'}];
const ME=[[0,1],[1,2],[0,6],[6,3],[1,7],[7,4],[2,8],[8,5],[3,4],[4,5]];
const Mil={
  tut:'s3',tutAuto:false,map:null,haze:null,br:null,lt:0,
  enter(){
    Snd.play('mil');
    if(!this.map){this.map=Maps.city3();this.br=Maps.bridge(46,8);
      const hz=this.haze=new Maps.Haze(330,270,3),ids='ABCDEF',map=this.map;
      for(const id of ids){const r=Maps.D3[id];hz.addMask((x,y)=>{const d=Math.min(x-r[0],r[2]-x,y-r[1],r[3]-y);return Maps.sstep(-8,30,d)*(map.wat[Math.min(269,y|0)*330+Math.min(329,x|0)]>0?.3:1)})}
      for(const k of[6,7,8]){const m=MN[k];hz.addMask((x,y)=>Math.max(0,1-Math.hypot(x-m.x,(y-m.y)*1.2)/20))}}
    this.mkStrip();
    const n=MN.map(o=>({...o,inf:0,sq:0,blk:0,dead:0,cap:o.pop,dp:o.pop,di:0}));
    const L=G.fociLeft||0;n[1].inf=clamp(.30+.04*L,.30,.7);n[0].inf=n[2].inf=clamp(.04+.02*L,.04,.25);
    n.forEach(o=>{if(o.k==='d'){const R=Maps.D3[o.id];o.dots=Array.from({length:26},()=>({x:rnd(R[0]+8,R[2]-8),y:rnd(R[1]+8,R[3]-8),vx:rnd(-9,9),vy:rnd(-9,9),ph:rnd(0,6)}))}});
    const s=this.s={fxs:[],shake:0,t:0,dur:200,n,sel:1,buses:[],saved:0,killed:0,sup:G.support,cruel:0,sqPool:3,heli:0,log:[],end:false,hudT:0,esc:false,uiSig:'',smoke:[],scars:[],dsaved:0,flash:[],ob:26};
    ctrl(false);this.ui();this.hudUpd();this.lt=performance.now();if(Coach.need('s3'))this.coach();else say('Вы — командир. Эвакуируйте людей и сдерживайте заражённые районы.',4.5);
  },
  exit(){},
  mkStrip(){const ex=Math.max(0,OX);this.exW=ex;this.strip=ex>2?Maps.cityStrip('c3',ex):null},
  resize(){if(this.s&&this.exW!==Math.max(0,OX))this.mkStrip()},
  nb(i){const r=[];for(const[a,b]of ME){if(a===i)r.push(b);if(b===i)r.push(a)}return r},
  path(from){ // BFS до Аэродрома (4) через незаблокированные узлы
    const s=this.s,prev={[from]:-1},q=[from];
    while(q.length){const u=q.shift();if(u===4){const p=[];for(let v=4;v!==-1;v=prev[v])p.unshift(v);return p}
      for(const v of this.nb(u)){if(v in prev)continue;const o=s.n[v];if(o.blk&&o.k!=='s')continue;prev[v]=u;q.push(v)}}
    return null},
  log(m){const s=this.s;s.log.unshift(m);s.logN=(s.logN||0)+1;s.log.length=Math.min(4,s.log.length)},
  pop(x,y,t,c,big){this.s.fxs.push({k:'txt',x,y,t:0,d:big?2.4:1.8,s:t,c:c||'#fff'})},
  tap(x,y){const s=this.s;if(x>MW)return;x-=OX;let b=-1,bd=18;
    s.n.forEach((o,i)=>{if(o.k!=='b')return;const d=Math.min(Math.hypot(o.x-x,o.y-y),Math.hypot(o.x-x,o.y-8-y));if(d<bd){bd=d;b=i}});
    if(b<0)s.n.forEach((o,i)=>{if(o.k==='b')return;const R=Maps.D3[o.id];if(x>=R[0]&&x<=R[2]&&y>=R[1]&&y<=R[3])b=i});
    if(b>=0){if(s.sel!==b){s.sel=b;beep(620,.04);vib(12)}this.ui()}},
  act(a){
    const s=this.s,o=s.n[s.sel];if(s.end)return;
    if(a==='sq+'){if(s.sqPool>0&&o.k==='d'){s.sqPool--;o.sq++;beep(520,.05);vib(14)}}
    else if(a==='sq-'){if(o.sq>0){o.sq--;s.sqPool++;beep(400,.05)}}
    else if(a==='blk'){o.blk=o.blk?0:1;this.log(o.blk?'Блокпост: '+o.nm:'Блокпост снят: '+o.nm);beep(300,.08);vib(20)}
    else if(a==='bus'){const p=this.path(s.sel);const cap=s.sup<25?35:50;
      if(!p||s.buses.length>=3||s.n[4].inf>.25||o.blk){say(!p?'Маршрут перекрыт!':s.buses.length>=3?'Все автобусы в рейсе':o.blk?'Район оцеплен: сначала снимите блокпост':'Аэродром заражён',2);return}
      const load=Math.min(cap,Math.floor(o.pop*(1-o.inf)));if(load<20){say('Здесь некого вывозить',1.8);return}
      o.pop-=load;s.buses.push({p,i:0,f:0,load,x:o.x,y:o.y,dx:1,dy:0,back:0});this.pop(o.x,o.y-22,'−'+load+' жителей','#ffd067');beep(500,.07);vib(18)}
    else if(a==='heli'){if(s.heli>0||s.sup<25||s.t<25||o.k!=='d'){say(s.t<25?'Вертолёты будут через '+Math.ceil(25-s.t)+' с':s.sup<25?'Лётчики отказались: поддержка слишком низка':'Вертолёт ещё в рейсе',2);return}
      const load=Math.min(60,Math.floor(o.pop*(1-o.inf)));if(load<=0)return;o.pop-=load;s.saved+=load;s.heli=22;s.fxs.push({k:'heli',x0:o.x,y0:o.y,x1:MN[4].x,y1:MN[4].y,t:0,d:2.8,load});this.log('Вертолёт вывез '+load+' из '+o.nm);beep(700,.1);vib(20)}
    else if(a==='art'){if(!s.esc||o.k!=='d')return;const k=Math.floor(o.pop*(1-o.inf)*.5);o.pop-=Math.floor(o.pop*.5);s.killed+=k;G.losses+=Math.ceil(k/20);o.inf*=.25;s.shake=.6;s.fxs.push({k:'boom',x:o.x,y:o.y,t:0,d:1.1});s.scars.push({x:o.x+rnd(-8,8),y:o.y+rnd(-6,6),r:15,t:0});s.sup=Math.max(0,s.sup-14);s.cruel+=1;G.cruelty+=1;this.pop(o.x,o.y-24,'погибли '+k,'#ff6b5c',1);this.log('Артудар по '+o.nm+': погибли мирные ('+k+')');say('Артиллерия: заражённых мало, но погибли и жители. Поддержка падает.',3.5);beep(90,.4,.08,'sawtooth');vib([80,40,120])}
    else if(a==='bridge'){if(o.k!=='b'||o.dead)return;o.dead=1;o.blk=1;s.shake=.6;s.fxs.push({k:'boom',x:o.x,y:o.y,t:0,d:1.1});s.sup=Math.max(0,s.sup-6);s.cruel+=.5;G.bridges++;this.log(o.nm+' взорван');say('Мост разрушен: заражение не пройдёт, но и колонны тоже.',3);beep(70,.5,.09,'sawtooth');vib([100,50,140])}
    this.ui();
  },
  update(dt){
    const s=this.s;if(s.end)return;s.t+=dt;s.heli=Math.max(0,s.heli-dt);s.shake=Math.max(0,s.shake-dt);for(const f of s.fxs)f.t+=dt;s.fxs=s.fxs.filter(f=>f.t<f.d);for(const q of s.scars)q.t+=dt;s.scars=s.scars.filter(q=>q.t<40);
    if(!s.esc&&(s.t>70||s.n[1].inf>.6)){s.esc=true;this.log('Открыта эскалация: артиллерия, мосты');say('Командование разрешило артиллерию и подрыв мостов.',4);this.ui()}
    for(const o of s.n){if(o.k==='d'&&o.pop>0)o.inf=clamp(o.inf+.031*o.inf*(1-o.inf)*dt+(o.id==='B'?.0016*dt:0)-o.sq*.006*dt,0,1);
      if(o.sq&&o.pop>0&&o.inf>0&&Math.random()<dt*.1){o.pop=Math.max(0,o.pop-Math.floor(o.pop*.005))}}
    for(const[a,b]of ME){const A=s.n[a],B=s.n[b];if(A.blk||B.blk)continue;const d=.028*(A.inf-B.inf)*dt*(A.k==='s'||B.k==='s'?.3:1);A.inf-=d;B.inf+=d;if(A.k==='b')A.inf=Math.max(0,A.inf);}
    for(const o of s.n)if(o.blk&&o.inf>.25&&Math.random()<dt*.025){const nb=this.nb(s.n.indexOf(o)).filter(i=>!s.n[i].blk);if(nb.length){const q=s.n[pick(nb)];q.inf=clamp(q.inf+.07,0,1);this.log('Скрытые носители прошли блокпост у '+o.nm);say('Скрытые носители прошли блокпост!',2.2);beep(160,.15,.05,'sawtooth')}}
    let blkPop=0;for(const o of s.n)if(o.k==='d'&&o.blk&&o.pop>0)blkPop++;s.sup=clamp(s.sup-blkPop*.04*dt,0,100);
    this.busTick(dt);
    for(const f of s.fxs)if(f.k==='heli'&&f.t+dt>=f.d&&!f.landed){f.landed=1;this.pop(MN[4].x,MN[4].y-26,'+'+f.load,'#7dffa6',1);s.fxs.push({k:'ring',x:MN[4].x,y:MN[4].y,t:0,d:1.2})}
    s.ob-=dt;if(s.ob<=0){const kk=s.t/s.dur;s.ob=rnd(.9,1.1)*(20-7*kk);let o=pick(s.n.filter(q=>q.k==='d'&&q.pop>40));if(o&&o.sq>0&&Math.random()<.5)o=pick(s.n.filter(q=>q.k==='d'&&q.pop>40));
      if(o){o.inf=clamp(o.inf+rnd(.08,.16),0,1);s.fxs.push({k:'ring',x:o.x,y:o.y,t:0,d:1.5,red:1});this.pop(o.x,o.y-32,'ВСПЫШКА','#ff6b5c',1);this.log('Вспышка заражения: '+o.nm);say('Вспышка заражения: '+o.nm+'!',2);beep(170,.2,.05,'sawtooth');vib(30)}}
    if(s.t>30&&!s.buses.length&&!s.fxs.some(f=>f.k==='heli')){let ev=0;for(const o of s.n)if(o.k==='d')ev+=Math.floor(o.pop*(1-o.inf));if(ev<20){this.log('Эвакуировать больше некого');say('Эвакуация завершена: больше некого вывозить.',3);this.finish();return}}
    s.hudT-=dt;if(s.hudT<=0){s.hudT=.3;this.hudUpd();this.ui(1)}
    if(s.t>=s.dur)this.finish();
  },
  busTick(dt){const s=this.s;
    for(const b of s.buses){const p=b.p,A=s.n[p[b.i]],B=s.n[p[b.i+1]];if(!B){b.done=1;continue}
      const L=Math.hypot(B.x-A.x,B.y-A.y)||1;b.f+=22*dt/L;if(b.f>=1){b.f=0;b.i++;if(!b.back&&B.inf>.4&&B.k!=='s'){const lost=Math.floor(b.load*.3);b.load-=lost;s.killed+=lost;this.pop(B.x,B.y-14,'−'+lost,'#ff6b5c');this.log('Колонна попала в заражённую зону: −'+lost)}}
      if(b.i>=p.length-1){
        if(!b.back){s.saved+=b.load;s.sup=Math.min(100,s.sup+2);this.pop(MN[4].x,MN[4].y-26,'+'+b.load,'#7dffa6',1);s.fxs.push({k:'ring',x:MN[4].x,y:MN[4].y,t:0,d:1.2});this.log('Автобус доставил '+b.load+' чел.');beep(740,.1);vib(24);
          b.back=1;b.p=p.slice().reverse();b.i=0;b.f=0;b.load=0}
        else b.done=1}
      else{const A2=s.n[b.p[b.i]],B2=s.n[b.p[b.i+1]],ll=Math.hypot(B2.x-A2.x,B2.y-A2.y)||1;b.dx=(B2.x-A2.x)/ll;b.dy=(B2.y-A2.y)/ll;b.x=A2.x+(B2.x-A2.x)*b.f;b.y=A2.y+(B2.y-A2.y)*b.f}}
    s.buses=s.buses.filter(b=>!b.done);
  },
  coachUpdate(dt){const s=this.s;if(s.end)return;s.ct=(s.ct||0)+dt;for(const f of s.fxs)f.t+=dt;s.fxs=s.fxs.filter(f=>f.t<f.d);this.busTick(dt);s.hudT-=dt;if(s.hudT<=0){s.hudT=.3;this.hudUpd();this.ui(1)}},
  coach(){const s=this.s;s.sel=4;this.ui();const D=Maps.D3,rcOf=id=>()=>{const R=D[id];return{x0:R[0]+2,y0:Math.max(24,R[1]+2),x1:R[2]-2,y1:R[3]-2}};
    Coach.run('s3',[
      {t:'Это ваш город. Нажмите на район «Центр» — там эпицентр заражения.',rc:rcOf('B'),wait:()=>s.sel===1},
      {t:'Отряды сдерживают заражение. Добавьте отряд в Центр.',el:'#panel [data-a="m_sq+"]',wait:()=>s.n[1].sq>0},
      {t:'Автобус вывозит здоровых на аэродром. Отправьте автобус.',el:'#panel [data-a=m_bus]',wait:()=>s.buses.length>0},
      {t:'Автобус едет через мост к аэродрому и вернётся за новыми людьми. Всего автобусов три.',pt:()=>{const b=s.buses[0];return b?{x:b.x,y:b.y,r:15}:null},btn:'Понятно ▶'},
      {t:'Блокпост не пропускает заражение — но и автобусы. Поставьте блокпост.',el:'#panel [data-a=m_blk]',wait:()=>!!s.n[1].blk},
      {t:'Теперь снимите его: людей ещё нужно вывозить.',el:'#panel [data-a=m_blk]',wait:()=>!s.n[1].blk},
      {t:'Цель: вывезти больше людей и удержать центр (<36%) и аэродром (<24%). Вертолёт откроется через 25 с.',btn:'Принять командование ▶'}
    ],()=>{this.ui();say('Командование принято!',2)})},
  finish(){const s=this.s;s.end=true;G.saved+=s.saved;G.support=Math.round(s.sup);
    let pp=0,pi=0;for(const o of s.n)if(o.k==='d'){pp+=o.pop;pi+=o.pop*o.inf}G.cityInf=pp>0?pi/pp:.2;G.epiInf=s.n[1].inf;
    G.contain3=s.n[1].inf<.36&&s.n[0].inf<.42&&s.n[2].inf<.42&&s.n[4].inf<.24;G.s3=s.saved;G.s3k=s.killed;setTimeout(()=>Flow.afterMil(),400)},
  hudUpd(){const s=this.s;hud(`<b>03 ВОЕННЫЙ</b><span class="g">спасено ${Cnt.h('s3.saved',s.saved,'n')}</span><span class="a">поддержка ${Cnt.h('s3.sup',Math.round(s.sup),'p')}</span><span class="r">погибло ${Cnt.h('s3.kill',s.killed,'n')}</span><span>${mmss(s.dur-s.t)}</span>`)},
  ui(soft){
    const s=this.s,o=s.n[s.sel],sig=JSON.stringify([s.sel,o.sq,o.blk,o.dead,s.sqPool,s.buses.length,s.esc,s.heli>0,Math.round(o.inf*50),Math.round(o.pop/10),s.log.join()]);
    if(soft&&sig===this.uiSig)return;this.uiSig=sig;
    const tag=o.k==='d'?(o.blk?'оцеплен':'район'):o.k==='b'?(o.dead?'разрушен':o.blk?'оцеплен':'мост'):'аэродром';
    let h=`<div class="ph"><b>${o.nm.toUpperCase()}</b><span class="chip ${o.k==='d'&&o.inf>.5?'r':o.blk?'a':''}">${tag}</span></div>`;
    if(o.k==='d'){
      h+=`<div class="stat3"><div>жителей<b>${Cnt.h('s3.pop.'+o.id,o.pop,'n')}</b></div><div class="${o.inf>.5?'r':o.inf>.25?'a':'g'}">заражено<b>${Cnt.h('s3.inf.'+o.id,o.inf*100,'p')}</b></div><div>отряды<b>${o.sq}<small style="font-size:.95rem;color:#7f98a8"> / ${s.sqPool}</small></b></div></div>`;
      h+=`<div class="bar">${Cnt.bar('s3.bar.'+o.id,o.inf*100,'r')}</div>`;
      h+=`<div class="r2"><button class="pb" data-a="m_sq+" ${s.sqPool<1?'disabled':''}><span class="bd" style="--c:#6fc48a">+</span><span class="tx">Отряд</span></button><button class="pb" data-a="m_sq-" ${o.sq<1?'disabled':''}><span class="bd" style="--c:#7f98a8">−</span><span class="tx">Отряд</span></button></div>`;
      h+=`<div class="r2"><button class="pb ${o.blk?'warn':''}" data-a="m_blk"><span class="bd" style="--c:#e5c53b">▮</span><span class="tx">${o.blk?'Снять пост':'Блокпост'}</span></button><button class="pb" data-a="m_heli" ${s.heli>0||s.t<25?'disabled':''}><span class="bd" style="--c:#9fd0e8">✚</span><span class="tx">Вертолёт${s.heli>0?' '+Math.ceil(s.heli)+' с':''}</span></button></div>`;
      h+=`<button class="pb glow" data-a="m_bus" ${s.buses.length>=3?'disabled':''}><span class="bd" style="--c:#ffd067">➜</span><span class="tx">Автобус на аэродром<small>рейсов в пути: ${s.buses.length} из 3</small></span></button>`;
      if(s.esc)h+=`<button class="pb dng" data-a="m_art"><span class="bd" style="--c:#ff6b5c">✹</span><span class="tx">Артиллерия<small>жестоко: погибнут и мирные</small></span></button>`}
    else if(o.k==='b'){h+=`<div class="m" style="margin:.2rem 0 .5rem">${o.dead?'Мост разрушен. Заражение не пройдёт — но и колонны тоже.':'Мост через реку. Заражение и колонны проходят здесь.'}</div><button class="pb ${o.blk?'warn':''}" data-a="m_blk" ${o.dead?'disabled':''}><span class="bd" style="--c:#e5c53b">▮</span><span class="tx">${o.blk?'Снять блокпост':'Блокпост'}</span></button>`;
      if(s.esc)h+=`<button class="pb dng" data-a="m_bridge" ${o.dead?'disabled':''}><span class="bd" style="--c:#ff6b5c">✹</span><span class="tx">Взорвать мост<small>необратимо</small></span></button>`}
    else h+=`<div class="stat3"><div class="g">принято<b>${Cnt.h('s3.saved2',s.saved,'n')}</b></div><div class="${o.inf>.25?'r':''}">заражение<b>${Cnt.h('s3.inf.E',o.inf*100,'p')}</b></div></div><div class="m" style="margin:.2rem 0 .4rem">Безопасная зона. Сюда идут автобусы. Если заражение выше 25% — приём остановится.</div><div class="bar">${Cnt.bar('s3.bar.E',clamp(o.inf*300,0,100),'r')}</div>`;
    h+=`<div class="log">${s.log.map((x,i)=>`<div data-key="L${(s.logN||0)-i}">${x}</div>`).join('')}</div>`;panel(h);
  },
  // ---------------------------------------------------------------- рисование
  plate(o,i,t,sel,dt){
    const s=this.s;let px=o.x,py=o.y-37,w=80,h=34;
    cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(o.x+1,o.y+1,9,4,0,0,TAU);cx.fill();
    if(o.k==='b'){w=54;h=16;py=o.y-21;
      const col=o.dead?'#ff5b4d':o.blk?'#e5c53b':'#6fb8d8';cx.strokeStyle=col;cx.lineWidth=1.2;cx.beginPath();cx.ellipse(o.x,o.y,9,4,0,0,TAU);cx.stroke()}
    else{const col=o.blk?'#e5c53b':'#4cc9c0';cx.strokeStyle=col;cx.lineWidth=1.2;cx.globalAlpha=.5+.3*Math.sin(t*3+i);cx.beginPath();cx.ellipse(o.x,o.y,12,5.5,0,0,TAU);cx.stroke();cx.globalAlpha=1}
    const x0=Math.round(px-w/2),y0=Math.round(py);
    cx.fillStyle=sel?'#fff':'rgba(140,190,210,.8)';cx.fillRect(Math.round(px),y0+h,1,Math.max(0,Math.round(o.y-y0-h-4)));
    cx.fillStyle=sel?'rgba(12,28,40,.97)':'rgba(6,14,22,.9)';cx.fillRect(x0,y0,w,h);cx.strokeStyle=sel?'#fff':o.blk?'#e5a93b':'#3b8aa4';cx.lineWidth=sel?1.5:1;cx.strokeRect(x0+.5,y0+.5,w-1,h-1);
    if(sel){cx.fillStyle='rgba(255,255,255,.09)';cx.fillRect(x0+1,y0+1,w-2,h-2)}
    if(o.k==='b'){txt(o.nm,px,y0+12,o.dead?'#ff8d82':'#eaf5fa',10,'center');return}
    txt(o.nm,px,y0+13,'#ffffff',11,'center');
    if(o.k==='s'){txt('▲ '+Math.round(s.dsaved),px,y0+27,'#7dffa6',11,'center');return}
    o.dp=tw(o,'dp',o.pop,dt,5);o.di=tw(o,'di',o.inf,dt,4);
    cx.fillStyle='#9fb3c0';cx.fillRect(x0+5,y0+18,3,3);cx.fillRect(x0+4,y0+21,5,5);txt(Math.round(o.dp),x0+12,y0+27,'#cfe0ea',10,'left');
    const ic=o.di>.5?'#ffb0a8':o.di>.25?'#ffd067':'#9fe8d6';txt(Math.round(o.di*100)+'%',x0+w-5,y0+27,ic,11,'right');
    cx.fillStyle='#0b1720';cx.fillRect(x0+2,y0+h-4,w-4,3);cx.fillStyle=o.di>.5?'#ff5b4d':o.di>.25?'#e5a93b':'#4cc9c0';cx.fillRect(x0+2,y0+h-4,Math.round((w-4)*clamp(o.di,0,1)),3);
  },
  bus(b,t){
    const hz=Math.abs(b.dx)>=Math.abs(b.dy),w=hz?13:6,h=hz?6:13,x=Math.round(b.x-w/2),y=Math.round(b.y-h/2);
    cx.fillStyle='rgba(0,0,0,.4)';cx.fillRect(x+1,y+3,w,h);
    cx.fillStyle='#8a6a1a';cx.fillRect(x,y+1,w,h);cx.fillStyle='#f0c53b';cx.fillRect(x,y,w,h);cx.fillStyle='#fff2a8';cx.fillRect(x,y,w,1);cx.fillRect(x,y,1,h);
    cx.fillStyle='#14202a';if(hz){for(let k=1;k<w-2;k+=3)cx.fillRect(x+k,y+1,2,2)}else{for(let k=1;k<h-2;k+=3)cx.fillRect(x+1,y+k,2,2)}
    cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,236,160,.16)';if(hz)cx.fillRect(b.dx>0?x+w:x-12,y+1,12,h-2);else cx.fillRect(x+1,b.dy>0?y+h:y-12,w-2,12);cx.restore();
    Post.glow(b.x,b.y,15,'255,210,90',.2);if(b.load>0)otx(String(b.load),b.x,y-3,'#ffd067',9,'center')},
  draw(){
    const s=this.s,tm=s.t,now=performance.now(),dt=Math.min(.1,(now-this.lt)/1000);this.lt=now;
    s.dsaved=tw(s,'dsaved',s.saved,dt,4);
    cx.fillStyle='#070c11';cx.fillRect(0,0,W,H);
    cx.save();if(s.shake>0)cx.translate((Math.random()*5-2.5)|0,(Math.random()*5-2.5)|0);
    cx.save();cx.translate(OX,0);cx.beginPath();cx.rect(-OX,0,MW,H);cx.clip();
    Maps.blit(cx,this.map,this.strip);
    if(this.strip)for(const L of this.strip.lamps){const fl=.7+.3*Math.sin(tm*1.3+L.x*.7+L.y);Post.glow(L.x,L.y+1,13,'255,214,140',.1*fl)}
    // вода и огни
    const wt=this.map.water;cx.fillStyle='rgba(190,235,250,.5)';
    for(let i=0;i<70;i++){const y=22+((i*53+tm*(5+(i%4)*1.5))%(H-22)),x=(i*37+Math.sin(tm*.4+i)*2)%330;if(wt(x,y)&&Math.sin(tm*1.7+i)>-.1)cx.fillRect(x|0,y|0,2+(i%3),1)}
    for(const L of this.map.lamps){const fl=.7+.3*Math.sin(tm*1.3+L.x*.7+L.y);Post.glow(L.x,L.y+1,13,'255,214,140',.1*fl)}
    for(const L of this.map.lights){
      if(L.k==='r'){if((Math.floor(tm*9)+L.i)%12<2){cx.fillStyle='#fff6c0';cx.fillRect(L.x,L.y,1,1);Post.glow(L.x,L.y,5,'255,240,170',.4)}else{cx.fillStyle='rgba(255,226,140,.5)';cx.fillRect(L.x,L.y,1,1)}}
      else if(L.k==='b'){if(Math.floor(tm*1.5+L.x)%2){cx.fillStyle=L.c;cx.fillRect(L.x,L.y,2,2);Post.glow(L.x,L.y,6,L.c==='#e0453a'?'255,60,50':'76,201,192',.4)}}
      else if(Math.floor(tm*1.2+L.x)%2===0){cx.fillStyle='#ff4a3d';cx.fillRect(L.x,L.y,1,1);Post.glow(L.x,L.y,5,'255,60,50',.35)}}
    { // маяк аэродрома
      const a=tm*2.2,bx=313,by=120;cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<4;k++){cx.strokeStyle='rgba(120,240,230,'+(.2-k*.04)+')';cx.beginPath();cx.moveTo(bx,by);cx.lineTo(bx+Math.cos(a-k*.07)*46,by+Math.sin(a-k*.07)*30);cx.stroke()}cx.restore()}
    // мосты
    s.n.forEach(o=>{if(o.k!=='b')return;const X=o.x-23,Y=Math.round(o.y-4);
      if(!o.dead)cx.drawImage(this.br,X-4,Y-6);
      else{cx.drawImage(this.br,0,0,18,this.br.height,X-4,Y-6,18,this.br.height);cx.drawImage(this.br,this.br.width-18,0,18,this.br.height,X+46-14,Y-6,18,this.br.height);
        cx.fillStyle='rgba(255,255,255,.5)';for(let k=0;k<8;k++){const u=(tm*.8+k/8)%1;cx.fillRect(o.x-6+Math.sin(k*2+tm)*6,o.y+3-u*6,2,1)}
        for(let k=0;k<5;k++){const u=(tm*.5+k/5)%1;cx.fillStyle='rgba(40,30,34,'+(.3*(1-u)).toFixed(2)+')';cx.beginPath();cx.arc(o.x-5+k*3,o.y-5-u*16,2+u*3,0,TAU);cx.fill()}
        Post.glow(o.x,o.y-1,14,'255,120,50',.2+.08*Math.sin(tm*8))}
      if(o.blk&&!o.dead){Maps.barrier(cx,X+2,o.y+1,6,tm);Maps.barrier(cx,X+38,o.y+1,6,tm+.5)}});
    // блокпосты на дорогах: полосатые заграждения и мешки
    for(const[a,b]of ME){const A=s.n[a],B=s.n[b];for(const[P,Q]of[[A,B],[B,A]]){if(!P.blk||P.k==='b')continue;const dx=Q.x-P.x,dy=Q.y-P.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,d=Q.k==='b'?30:34,bx=P.x+ux*d,by=P.y+uy*d;
      if(Math.abs(ux)>Math.abs(uy)){cx.save();cx.translate(Math.round(bx),Math.round(by)-4);cx.rotate(Math.PI/2);Maps.barrier(cx,0,0,8,tm);cx.restore()}else Maps.barrier(cx,bx-4,by,8,tm)}}
    // заражение: мягкая дымка по районам
    this.haze.render(cx,s.n.map(o=>o.k==='s'?Math.min(1,o.inf*3):o.inf),tm,{a:.6});
    // выжженные места
    for(const q of s.scars){const a=clamp(1-q.t/40,0,1)*.55;cx.fillStyle='rgba(8,6,6,'+a+')';cx.beginPath();cx.ellipse(q.x,q.y,q.r,q.r*.7,0,0,TAU);cx.fill();if(q.t<14){cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<7;k++)if(Math.sin(tm*6+k*2.3+q.x)>.2){cx.fillStyle='rgba(255,120,40,.55)';cx.fillRect(q.x+Math.cos(k*2.1)*q.r*.6,q.y+Math.sin(k*2.1)*q.r*.4,1,1)}cx.restore()}}
    // заражённые на улицах и отряды
    for(const o of s.n){
      if(o.k==='d'&&o.dots){const R=Maps.D3[o.id],n=Math.floor(o.inf*24);
        for(let q=0;q<o.dots.length;q++){const d=o.dots[q];d.x+=d.vx*dt*(q<n?1:0);d.y+=d.vy*dt*(q<n?1:0);if(d.x<R[0]+6||d.x>R[2]-6)d.vx*=-1;if(d.y<R[1]+6||d.y>R[3]-6)d.vy*=-1;d.x=clamp(d.x,R[0]+6,R[2]-6);d.y=clamp(d.y,R[1]+6,R[3]-6);
          if(q>=n)continue;const b=Math.sin(tm*5+d.ph)>.7?-1:0,x=Math.round(d.x),y=Math.round(d.y);cx.fillStyle='rgba(0,0,0,.4)';cx.fillRect(x,y+2,3,1);cx.fillStyle='#43604a';cx.fillRect(x,y-1+b,2,3);cx.fillStyle='#8ca887';cx.fillRect(x,y-2+b,2,1);cx.fillStyle='#ff3b2f';cx.fillRect(x+1,y-2+b,1,1)}}
      if(o.k==='d')for(let q=0;q<o.sq;q++){const sx=o.x-14+q*14,sy=o.y+18;
        cx.fillStyle='rgba(0,0,0,.4)';cx.fillRect(sx+1,sy+3,10,5);cx.fillStyle='#2c4a34';cx.fillRect(sx,sy+1,10,5);cx.fillStyle='#4a7a52';cx.fillRect(sx,sy,10,5);cx.fillStyle='#7aa884';cx.fillRect(sx,sy,10,1);cx.fillStyle='#16202a';cx.fillRect(sx+7,sy+1,2,3);
        for(let k=0;k<3;k++){cx.fillStyle='#1f2a22';cx.fillRect(sx+1+k*2,sy-2,1,2);cx.fillStyle='#d8c8a0';cx.fillRect(sx+1+k*2,sy-3,1,1)}
        if(o.inf>.08&&Math.floor(tm*7+q*3)%4===0){cx.save();cx.globalCompositeOperation='lighter';cx.strokeStyle='rgba(255,230,140,.85)';cx.beginPath();cx.moveTo(sx+10,sy+2);cx.lineTo(sx+10+(q%2?9:-30),sy+2-4+(q%3)*3);cx.stroke();cx.restore()}}}
    // автобусы, вертолёты, взрывы
    for(const b of s.buses)this.bus(b,tm);
    for(const f of s.fxs){
      if(f.k==='heli'){const u=f.t/f.d,x=f.x0+(f.x1-f.x0)*u,y=f.y0+(f.y1-f.y0)*u,h=16*Math.sin(Math.min(1,u)*Math.PI)+3;
        cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(x+h*.3,y+2,8,3,0,0,TAU);cx.fill();Maps.heli(cx,x,y-h,tm);Post.glow(x,y-h,12,'200,230,255',.15)}
      else if(f.k==='boom'){const u=f.t/f.d;
        cx.strokeStyle='rgba(255,'+Math.floor(200-u*120)+',60,'+(1-u).toFixed(2)+')';cx.lineWidth=3;cx.beginPath();cx.ellipse(f.x,f.y,6+u*30,(6+u*30)*.7,0,0,TAU);cx.stroke();
        const g=cx.createRadialGradient(f.x,f.y-4,1,f.x,f.y-4,14*(1-u*.5)+4);g.addColorStop(0,'rgba(255,240,190,'+(1-u).toFixed(2)+')');g.addColorStop(.5,'rgba(255,150,50,'+((1-u)*.7).toFixed(2)+')');g.addColorStop(1,'rgba(255,80,30,0)');cx.fillStyle=g;cx.fillRect(f.x-24,f.y-30,48,48);
        for(let k=0;k<12;k++){const a=k*.52+f.x,r=u*36,hh=Math.sin(u*Math.PI)*14;cx.fillStyle=k%2?'#ffb040':'#666';cx.fillRect(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.7-hh*(k%3)*.3,2,2)}}
      else if(f.k==='ring'){const u=f.t/f.d;cx.strokeStyle=(f.red?'rgba(255,96,80,':'rgba(125,255,166,')+(1-u).toFixed(2)+')';cx.lineWidth=2;cx.beginPath();cx.ellipse(f.x,f.y,6+u*26,(6+u*26)*.55,0,0,TAU);cx.stroke()}}
    // дым над заражёнными районами
    for(const o of s.n)if(o.k==='d'&&o.inf>.3&&Math.random()<.12*o.inf)s.smoke.push({x:o.x+rnd(-26,26),y:o.y+rnd(-14,16),v:rnd(8,16),l:0,m:rnd(2.5,4.5)});
    for(const q of s.smoke){q.y-=q.v*dt;q.x+=Math.sin(q.l*2+q.y*.1)*.12;q.l+=dt}s.smoke=s.smoke.filter(q=>q.l<q.m);
    for(const q of s.smoke){const a=Math.sin(q.l/q.m*3.14)*.3;cx.fillStyle='rgba(38,28,32,'+a.toFixed(3)+')';cx.beginPath();cx.arc(q.x,q.y,2+q.l*2.6,0,TAU);cx.fill()}
    for(const o of s.n)if(o.k==='d'&&o.inf>.25)Post.glow(o.x,o.y,46,'255,70,50',.07*o.inf*(1+.3*Math.sin(tm*3+o.x)));
    // выбранный район: «голографический» барьер
    {const o=s.n[s.sel];if(o.k!=='b'){const R=Maps.D3[o.id],p=.5+.5*Math.sin(tm*3),hh=8,x0=R[0]+2,y0=R[1]+Math.max(0,22-R[1]),x1=R[2]-2,y1=R[3]-2;
      const g=cx.createLinearGradient(0,y1-hh,0,y1);g.addColorStop(0,'rgba(120,235,225,.0)');g.addColorStop(1,'rgba(120,235,225,.28)');cx.fillStyle=g;cx.fillRect(x0,y1-hh,x1-x0,hh);
      const g2=cx.createLinearGradient(x0,0,x0+hh*.4,0);g2.addColorStop(0,'rgba(120,235,225,.25)');g2.addColorStop(1,'rgba(120,235,225,0)');cx.fillStyle=g2;cx.fillRect(x0,y0-hh,hh*.4,y1-y0);
      cx.fillStyle='rgba(120,235,225,.05)';cx.fillRect(x0,y0,x1-x0,y1-y0);
      cx.strokeStyle='rgba(255,255,255,'+(.6+.3*p).toFixed(2)+')';cx.lineWidth=1.2;cx.strokeRect(x0,y1-hh,x1-x0,hh+0);cx.save();cx.setLineDash([4,3]);cx.lineDashOffset=-tm*10;cx.strokeStyle='rgba(120,235,225,.8)';cx.strokeRect(x0+.5,y0+.5,x1-x0-1,y1-y0-1);cx.restore();
      for(const[px,py]of[[x0,y1],[x1,y1]]){cx.strokeStyle='rgba(255,255,255,.7)';cx.beginPath();cx.moveTo(px,py);cx.lineTo(px,py-hh);cx.stroke()}
      for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const px=sx<0?x0:x1,py=sy<0?y0:y1;cx.strokeStyle='#fff';cx.lineWidth=2;cx.beginPath();cx.moveTo(px,py-sy*8);cx.lineTo(px,py);cx.lineTo(px-sx*8,py);cx.stroke()}}
      else{cx.strokeStyle='#fff';cx.lineWidth=1;for(let k=0;k<4;k++){const a=tm*1.4+k*1.571;cx.beginPath();cx.arc(o.x,o.y,12,a,a+.9);cx.stroke()}}}
    // ярлыки районов
    s.n.forEach((o,i)=>this.plate(o,i,tm,i===s.sel,dt));
    // «число» над районами (всплывающие тексты)
    for(const f of s.fxs)if(f.k==='txt'){const u=f.t/f.d;otx(f.s,f.x,f.y-u*14,f.c,11,'center',clamp(1.7-u*1.7,0,1)*clamp(u*9,0,1))}
    cx.restore();
    Post.vig(.75);
    if(s.esc&&Math.floor(tm)%2===0)otx('ЭСКАЛАЦИЯ',MW/2,36,'#e5a93b',11,'center');
    cx.strokeStyle='#3a8f8a';cx.lineWidth=1;for(const[x,y,dx,dy]of[[2,24,1,1],[MW-3,24,-1,1],[2,H-3,1,-1],[MW-3,H-3,-1,-1]]){cx.beginPath();cx.moveTo(x,y+dy*10);cx.lineTo(x,y);cx.lineTo(x+dx*10,y);cx.stroke()}
    cx.restore();
  }
};
ACT.m_sq_p=()=>Mil.act('sq+');ACT['m_sq+']=()=>Mil.act('sq+');ACT['m_sq-']=()=>Mil.act('sq-');ACT.m_blk=()=>Mil.act('blk');ACT.m_bus=()=>Mil.act('bus');ACT.m_heli=()=>Mil.act('heli');ACT.m_art=()=>Mil.act('art');ACT.m_bridge=()=>Mil.act('bridge');
