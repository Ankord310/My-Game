'use strict';
// Режим «Лабиринт» (вид сверху, несколько этажей, случайная генерация): этап 1 «Учёный» и финальный рейд
const SZ1=[[12,6],[13,8],[14,9],[16,9]],SZR=[[16,9],[14,9],[13,8],[12,6]],AMB=104,CONE=184,CONEA=.62;
const joy={on:false,x:0,y:0,id:-1};
const angd=(a,b)=>((b-a+Math.PI*3)%(Math.PI*2))-Math.PI,turn=(a,b,m)=>a+clamp(angd(a,b),-m,m);
const tileOf=(F,x,y)=>(x<0||y<0||x>=F.TW*TL||y>=F.TH*TL)?1:F.t[((y/TL)|0)*F.TW+((x/TL)|0)];
function hitBox(F,x,y,r){return tileOf(F,x-r,y-r)||tileOf(F,x+r,y-r)||tileOf(F,x-r,y+r)||tileOf(F,x+r,y+r)}
function moveBox(F,e,dx,dy,r){
  let bx=0,by=0;
  let nx=e.x+dx;if(hitBox(F,nx,e.y,r)){nx=dx>0?Math.floor((nx+r)/TL)*TL-r-.01:(Math.floor((nx-r)/TL)+1)*TL+r+.01;if(hitBox(F,nx,e.y,r))nx=e.x;bx=1}e.x=nx;
  let ny=e.y+dy;if(hitBox(F,e.x,ny,r)){ny=dy>0?Math.floor((ny+r)/TL)*TL-r-.01:(Math.floor((ny-r)/TL)+1)*TL+r+.01;if(hitBox(F,e.x,ny,r))ny=e.y;by=1}e.y=ny;
  return bx|by<<1}
// луч по сетке тайлов; препятствие для обзора — стены и высокая мебель
function cast(F,x,y,dx,dy,max){
  let mx=Math.floor(x/TL),my=Math.floor(y/TL);const ddx=Math.abs(1/(dx||1e-9)),ddy=Math.abs(1/(dy||1e-9));let sx,sy,sdx,sdy,d=0;
  if(dx<0){sx=-1;sdx=(x/TL-mx)*ddx}else{sx=1;sdx=(mx+1-x/TL)*ddx}
  if(dy<0){sy=-1;sdy=(y/TL-my)*ddy}else{sy=1;sdy=(my+1-y/TL)*ddy}
  for(let i=0;i<80;i++){
    if(sdx<sdy){d=sdx;sdx+=ddx;mx+=sx}else{d=sdy;sdy+=ddy;my+=sy}
    if(d*TL>=max)return max;
    if(mx<0||my<0||mx>=F.TW||my>=F.TH)return d*TL;const v=F.t[my*F.TW+mx];if(v===1||v===3)return d*TL}
  return max}
function clearLine(F,x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0);if(d<1)return true;return cast(F,x0,y0,(x1-x0)/d,(y1-y0)/d,d)>=d-1.5}

// ---------------------------------------------------------------- сборка здания
function buildBuilding(kind,diff){
  const sci=kind==='sci',sizes=sci?SZ1:SZR,order=sci?[0,1,2,3]:[3,2,1,0],n=sizes.length,fl=[],base=(Math.random()*1e9)|0;
  for(let i=0;i<n;i++){const F=genFloor({seed:base+i*7919,CW:sizes[i][0],CH:sizes[i][1],th:THEMES[order[i]],thi:order[i]});F.i=i;fl.push(F)}
  const fwdUp=sci;
  for(let i=0;i<n;i++){
    const F=fl[i],R=F.R;
    if(i===0){const c=(R()*F.N)|0;F.arr={cx:c%F.CW,cy:(c/F.CW)|0,cell:c};F.entry=c}
    else{const a=fl[i-1].fwd;F.arr={cx:a.cx,cy:a.cy,cell:a.cy*F.CW+a.cx};F.back={cell:F.arr.cell,up:!fwdUp}}
    F.reserved[F.arr.cell]=1;
    const dd=cdist(F,F.arr.cell),mx=Math.max(...dd);
    if(i<n-1){
      const nx=fl[i+1],bad=[];for(let c=0;c<F.N;c++){if((c%F.CW)>=nx.CW||((c/F.CW)|0)>=nx.CH)bad.push(c)}
      let r1=pickCells(F,F.arr.cell,Math.max(6,Math.round(mx*.68)),99,1,0,bad);if(!r1.length)r1=pickCells(F,F.arr.cell,2,99,1,0,bad);const c=r1[0];
      F.fwd={cell:c,cx:c%F.CW,cy:(c/F.CW)|0,up:fwdUp};F.reserved[c]=1}
    else{let r1=pickCells(F,F.arr.cell,Math.max(6,Math.round(mx*.72)),99,1,0);if(!r1.length)r1=pickCells(F,F.arr.cell,2,99,1,0);const c=r1[0];
      F.goal={cell:c,cx:c%F.CW,cy:(c/F.CW)|0,kind:sci?'exit':'vault'};F.reserved[c]=1}
  }
  const pf=sci?1+(Math.random()<.5?1:0):-1;
  if(sci){
    const F=fl[0],cs=pickCells(F,F.arr.cell,3,99,3,4);
    ['fridge','centr','chamber'].forEach((k,i)=>{if(cs[i]!=null)addItem(F,cs[i],k,{task:i})});
    const G2=fl[pf],c=pickCells(G2,G2.arr.cell,5,99,1,0)[0];addItem(G2,c,'locker',{phone:true})}
  for(const F of fl){
    furnish(F);
    const cs=pickCells(F,F.arr.cell,3,99,sci?1+(F.i%2):2,5);
    F.meds=cs.map(c=>({x:cellC(c%F.CW),y:cellC((c/F.CW)|0),t:0}));
    F.mem=document.createElement('canvas');F.mem.width=F.TW*TL;F.mem.height=F.TH*TL;F.mg=F.mem.getContext('2d');
    F.mm=document.createElement('canvas');F.mm.width=F.TW;F.mm.height=F.TH;F.mmg=F.mm.getContext('2d');F.mmd=true;
  }
  return{fl,pf}}

// ---------------------------------------------------------------- заражённые
function mkZ(F,x,y,v,o){
  const z={x,y,a:rnd(0,6.28),v,hp:v===2?3:2,st:'p',stun:0,fr:rnd(0,6),snd:rnd(1,6),pit:rnd(74,104),pc:0,tc:0,wait:rnd(0,3),seen:0,vis:0,dead:0,bite:0,rise:0,rise0:0,frz:0,emg:null};
  z.pc=z.tc=Maze.cellOf(F,x,y);return Object.assign(z,o||{})}
function populate(F,n,v0,minD){ // расселить заражённых подальше от точки прибытия
  let cs=pickCells(F,F.arr.cell,minD||6,99,n,2);
  if(cs.length<n)cs=cs.concat(pickCells(F,F.arr.cell,3,99,n-cs.length,2,cs));
  return cs.map((c,i)=>mkZ(F,cellC(c%F.CW)+rnd(-5,5),cellC((c/F.CW)|0)+rnd(-5,5),(i+v0)%3))}

const Maze={
  cfg:{kind:'sci',diff:0},
  get F(){return this.s.fl[this.s.fi]},
  enter(){
    const k=this.cfg.kind,raid=k==='raid';this.tut=raid?'raid':'s1';this.tutAuto=raid;
    if(!joy.bound)this.bindJoy();
    const{fl,pf}=buildBuilding(k,this.cfg.diff),F=fl[0],a=F.arr;
    const p={x:cellC(a.cx),y:cellC(a.cy),a:Math.PI/2,hp:raid?8:4,inv:0,kx:0,ky:0,kt:0,fr:0,cd:0,sw:0,shot:0,stp:0,sneak:false,spd:0,trail:[],tt:0};
    const s=this.s={k,fl,pf,fi:0,t:0,leak:raid,leakT:0,pen:0,tasks:0,phone:false,hits:0,kills:0,done:false,flash:0,fade:1,cx:0,cy:0,fx:[],tr:null,near:null,hudT:0,par:60,p,field:null,ftile:-1,ft:0,trick:0,msg:0,lockMsg:0,zone:'',zt:0,
      god:false,spawn:0,sq:[{a:0,cd:rnd(.2,.8),x:p.x,y:p.y,fr:0},{a:0,cd:rnd(.2,.8),x:p.x,y:p.y,fr:2}],
      cut:null,spawnQ:[],pings:[],dust:[],shake:0,zoom:1,zf:{x:0,y:0},chb:0,hl:{i:-1,t:-9},dl:{},mmA:.9};
    s.field=new Int16Array(F.TW*F.TH);
    this.setupFloor(0,true);
    $('#app').classList.remove('cine');$('#cap').textContent='';
    if(raid){
      const n=this.cfg.diff;
      fl.forEach((f,i)=>{f.en=populate(f,Math.min(12,3+Math.ceil(n/2)+(i===3?1:0)+(i>0?1:0)),i,6);f.en.forEach(e=>{e.hp+=n>=9?1:0})});
      for(const f of fl){const g=f.goal;if(g){const it={kind:'vault',x:cellC(g.cx),y:cellC(g.cy),r:26,lab:'Забрать готовое лекарство',on:()=>true,go:()=>this.vaultTake()};f.items.push(it)}}
      say('Группа входит в верхние уровни. Вниз — по лестницам, к хранилищу на самом нижнем этаже. Свет фонарей — ваш главный ресурс.',6.5);
      Snd.play('raid');Snd.level(0);
    }else{
      const me=this,F0=fl[0],it=F0.items;
      for(const q of it){
        if(q.task===0){q.r=22;q.lab='Взять образец из холодильника';q.on=()=>s.tasks===0;q.go=()=>{s.tasks=1;beep(660,.08);me.line('t1',{t:'Образец у меня. Теперь — в центрифугу, запущу анализ.'})}}
        if(q.task===1){q.r=22;q.lab='Поставить пробу в центрифугу';q.on=()=>s.tasks===1;q.go=()=>{s.tasks=2;beep(660,.08);me.line('t2',{t:'Анализ пошёл. Осталась камера изоляции В-3… там вторую неделю падает давление.'})}}
        if(q.task===2){q.r=24;q.lab='Проверить камеру изоляции В-3';q.on=()=>s.tasks===2&&!s.leak&&!s.cut;q.go=()=>me.cutB3()}}
      const G2=fl[pf];for(const q of G2.items)if(q.phone){q.r=22;q.lab='Забрать телефон из шкафчика';q.on=()=>s.leak&&!s.phone;q.go=()=>{s.phone=true;beep(880,.1);me.line('ph',{t:'Телефон у меня! Теперь наверх, к выходу — этаж '+s.fl.length+'.'})}}
      const L=fl[fl.length-1],g=L.goal;
      L.items.push({kind:'exit',x:cellC(g.cx),y:cellC(g.cy),r:26,lab:'Выйти из комплекса',on:()=>s.leak&&s.phone,go:()=>me.exitSci()},
        {kind:'exit',info:1,x:cellC(g.cx),y:cellC(g.cy),r:26,lab:'Выход закрыт: нужен телефон',on:()=>s.leak&&!s.phone,go:()=>say('Без телефона наверху не связаться ни с кем. Он в одном из шкафчиков ниже.')});

      Snd.play('s1');Snd.level(0);
    }
    document.body.classList.add('mz');ctrl(true);$('#ctrl').classList.add('td');panel(null);$('#kX small').textContent=raid?'огонь':'удар';$('#keys').innerHTML='<b>WASD</b> / стрелки — идти · <b>E</b> — действие · <b>Пробел</b> — '+(raid?'огонь':'удар')+' · <b>Shift</b> — красться · <b>Esc</b> — пауза';
    this.cam(0,true);this.hudUpd();
  },
  exit(){document.body.classList.remove('mz');ctrl(false);$('#ctrl').classList.remove('td');$('#ctrl').classList.remove('act');$('#jb').classList.remove('on');$('#prompt').style.display='none';$('#app').classList.remove('cine');$('#cap').textContent='';joy.on=false;joy.x=joy.y=0},
  bindJoy(){ // плавающий стик: появляется под пальцем, в покое ничего не закрывает
    joy.bound=true;const zone=$('#joy'),jb=$('#jb'),k=$('#jk'),ctl=$('#ctrl');let bx=0,by=0,R=1;
    const rem=()=>parseFloat(getComputedStyle(document.documentElement).fontSize)||10;
    const set=e=>{let dx=e.clientX-bx,dy=e.clientY-by;const m=Math.hypot(dx,dy);if(m>R){dx*=R/m;dy*=R/m}
      joy.x=dx/R;joy.y=dy/R;if(Math.hypot(joy.x,joy.y)<.16){joy.x=0;joy.y=0}k.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`};
    zone.addEventListener('pointerdown',e=>{
      const u=rem();R=u*3.4;bx=e.clientX;by=e.clientY;
      jb.style.left=bx+'px';jb.style.top=by+'px';jb.classList.add('on');ctl.classList.add('act');
      joy.on=true;joy.id=e.pointerId;try{zone.setPointerCapture(e.pointerId)}catch(_){}
      k.style.transform='translate(-50%,-50%)';set(e);vib(10);e.preventDefault()});
    zone.addEventListener('pointermove',e=>{if(joy.on&&e.pointerId===joy.id)set(e)});
    const end=e=>{if(e.pointerId===joy.id){joy.on=false;joy.x=joy.y=0;jb.classList.remove('on');ctl.classList.remove('act')}};
    zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end);
  },
  setupFloor(i,first){
    const s=this.s,F=s.fl[i];s.fi=i;F.cv=F.cv||bakeFloor(F);s.field=new Int16Array(F.TW*F.TH);s.ftile=-1;s.p.trail=[];s.fx=[];
    const a=first?F.arr:null;if(a){s.p.x=cellC(a.cx);s.p.y=cellC(a.cy)}
    s.zone='';
  },
  go(i,toFwd){ // переход между этажами
    const s=this.s,p=s.p,F=s.fl[i];s.fade=1;s.fx=[];s.pings=[];
    const c=toFwd?F.arr:F.fwd;s.fi=i;F.cv=F.cv||bakeFloor(F);s.field=new Int16Array(F.TW*F.TH);s.ftile=-1;
    p.x=cellC(c.cx);p.y=cellC(c.cy);p.trail=[];p.kt=0;for(const q of s.sq){q.x=p.x;q.y=p.y}
    this.arrive(i,c.cy*F.CW+c.cx);
    this.cam(0,true);[0,.12,.24].forEach(d=>setTimeout(()=>Snd.clank(),d*1000));vib([40,30,40]);
    say('Этаж '+this.floorNo(i)+' · '+F.th.n,2.4);this.hudUpd();
    if(s.k==='sci'&&s.leak&&!s.phone&&i===s.pf)this.line('pf',{t:'Мой этаж. Шкафчик где-то рядом — стрелка подскажет.'})},
  arrive(i,cell){ // безопасное прибытие: рядом с лестницей никого нет, заражённые «выходят» вдали
    const s=this.s,F=s.fl[i];
    if(s.k==='sci'){
      if(s.leak&&!F.popd&&i>0){F.popd=true;const n=[0,5,5,6][i]||5;for(let k=0;k<n;k++)s.spawnQ.push({fl:i,at:s.leakT+1.4+k*2.3+rnd(0,1.2),v:(k+i)%3})}
    }else{
      const d=cdist(F,cell);
      for(const e of F.en){if(e.dead)continue;const cc=this.cellOf(F,e.x,e.y);
        if(d[cc]>=0&&d[cc]<5){let q=pickCells(F,cell,7,99,1,0);if(!q.length)q=pickCells(F,cell,5,99,1,0);if(q.length){const c=q[0];e.x=cellC(c%F.CW);e.y=cellC((c/F.CW)|0);e.pc=e.tc=c;e.st='p';e.wait=1}}}
    }
  },
  floorNo(i){const n=this.s.fl.length;return this.s.k==='sci'?i+1:n-i},
  // ---------------------------------------------------------------- кат-сцена у камеры В-3
  cutB3(){
    const s=this.s,F0=s.fl[0],ch=F0.items.find(q=>q.task===2),p=s.p;
    s.tasks=3;const rn=mulberry((Math.random()*1e9)|0),cr=[];
    for(let i=0;i<9;i++){let a=i*.7+rn()*.5,x=0,y=0;const seg=[];for(let k=0;k<4;k++){a+=(rn()-.5)*.9;const l=1.6+rn()*1.8;x+=Math.cos(a)*l;y+=Math.sin(a)*l;seg.push([x,y])}cr.push(seg)}
    s.cut={t:0,ch,cr,l:{},bang:0,bz:0};
    p.a=Math.atan2(ch.y-p.y,ch.x-p.x);p.spd=0;resetInput();joy.on=false;joy.x=joy.y=0;
    $('#app').classList.add('cine');ctrl(false);$('#prompt').style.display='none';$('#cskip').style.display=Prog.skipOK()?'block':'none';
    s.zf={x:ch.x,y:ch.y-3};Snd.level(0);
  },
  cap(t,red){const e=$('#cap');e.textContent=t;e.className=red?'red':'';void e.offsetWidth;e.classList.add('on')},
  cutUpdate(dt){
    const s=this.s,c=s.cut,p=s.p,F=this.F;c.t+=dt;const T=c.t,ch=c.ch;
    const once=(k,at,fn)=>{if(T>=at&&!c.l[k]){c.l[k]=1;fn()}};
    once('a',.4,()=>this.cap('Давление в камере В-3 падает…'));
    for(const at of[.9,1.8,2.7])once('b'+at,at,()=>beep(1180,.07,.05));
    once('c',2.1,()=>this.cap('Датчики показывают то, чего быть не может.'));
    once('d',3.1,()=>{Snd.crack();s.shake=.25;vib(30)});
    once('e',3.9,()=>{Snd.crack();s.shake=.3});
    once('f',4.3,()=>{this.cap('Внутри что-то двигается.');Snd.t('sawtooth',90,60,.9,.2)});
    if(T>=5.5&&!c.bang)this.cutBang();
    once('g',6.1,()=>this.cap('ТРЕВОГА. Карантин нарушен.',true));
    if(T>=7.6){this.cutEnd();return}
    // камера: подъезд к камере и возврат
    const w=T<6.4?ease(T/1.1):1-ease((T-6.4)/1.1),pt=this.camT(p.x,p.y,p.a),ct=this.camT(ch.x,ch.y-2,0);
    s.cx=lerp(pt.x,ct.x,w);s.cy=lerp(pt.y,ct.y,w);s.zoom=1+.62*w*(T<5.5?1:.85);
    this.fxUpdate(dt);this.zombies(dt);s.shake=Math.max(0,s.shake);
    // газ и свет
    if(c.bang&&Math.random()<dt*20)s.fx.push({x:ch.x+rnd(-5,5),y:ch.y+rnd(-5,3),vx:rnd(-14,14),vy:rnd(-18,2),l:1.8,c:'#4fe0a0',g:1});
    s.hudT=1;
  },
  cutBang(){
    const s=this.s,c=s.cut,ch=c.ch,p=s.p,F=this.F;c.bang=1;s.flash=1.1;s.shake=.8;
    Snd.crack();setTimeout(()=>Snd.crack(),90);Snd.siren();vib([200,60,200]);
    for(let i=0;i<34;i++){const a=rnd(0,6.28),v=rnd(30,120);s.fx.push({x:ch.x,y:ch.y-3,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(.6,1.2),c:i%3?'#d8fff2':'#7fe8cc'})}
    for(let i=0;i<46;i++){const a=rnd(0,6.28),v=rnd(8,46);s.fx.push({x:ch.x,y:ch.y-3,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:rnd(1.2,2.4),c:'#4fe0a0',g:1})}
    const d=Math.hypot(p.x-ch.x,p.y-ch.y)||1;moveBox(F,p,(p.x-ch.x)/d*13,(p.y-ch.y)/d*13,5);
    this.leakStart();
  },
  cutEnd(){
    const s=this.s,c=s.cut;if(!c)return;if(!c.bang)this.cutBang();
    s.cut=null;$('#app').classList.remove('cine');$('#cap').textContent='';ctrl(true);resetInput();this.cam(0,true);s.zoom=Math.max(1,s.zoom);this.hudUpd();
    this.line('leak',[{t:'Они… вырвались из камеры! Надо уходить, пока они не поднялись!',mood:'scared',hint:'Бегите от камеры — у вас несколько секунд.'},{t:'Без телефона я никого не вызову. Шкафчик — на этаже '+(s.pf+1)+', лестница наверх открылась.',hint:HINT('«Красться» (держать) — тише: заметят только вблизи.','Shift (держать) — красться: тише, заметят только вблизи.')}])},
  line(k,l){const s=this.s;if(s.k!=='sci'||s.dl[k])return;s.dl[k]=1;if(OPT.tips)Dlg.say(l);else{const a=Array.isArray(l)?l:[l];say(a.map(x=>x.t).join(' '),Math.min(6,2.5+a.length*1.5))}},
  cutSkip(){const s=this.s;if(!s||!s.cut)return;this.cutEnd();s.zoom=1;s.flash=0;s.shake=0},
  leakStart(){
    const s=this.s,F0=s.fl[0];s.leak=true;s.leakT=0;s.chb=1;
    const ch=s.cut?s.cut.ch:F0.items.find(q=>q.task===2),p=s.p;
    // двое «пациентов» выбираются из камеры: поднимаются медленно, у игрока есть время уйти
    const tiles=[];for(let j=0;j<2;j++)for(let i=0;i<2;i++){const tx=((ch.cell%F0.CW)*3+1)+i,ty=(((ch.cell/F0.CW)|0)*3+1)+j;if(F0.t[ty*F0.TW+tx]===0)tiles.push({x:tx*TL+8,y:ty*TL+8})}
    tiles.sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y));
    const ids=tiles.length?tiles:[{x:ch.x+10,y:ch.y}];
    for(let i=0;i<2;i++){const T=ids[i%ids.length],rs=6.2+i*.9;
      F0.en.push(mkZ(F0,ch.x,ch.y-2,i,{rise:rs,rise0:rs,emg:'chamber',st:'p',fx0:ch.x,fy0:ch.y-2,fx1:T.x,fy1:T.y,wait:99,hp:2}))}
    // остальные выходят из люков вдали — по одному, с предупреждением
    [3.5,7.5,12].forEach((at,k)=>s.spawnQ.push({fl:0,at,v:(k+1)%3}));
    F0.popd=true;
    // расчёт «идеального» времени по кратчайшему маршруту
    let px=0;const step=(F,a,b)=>{const d=tdist(F,(a.x/TL)|0,(a.y/TL)|0);const v=d[((b.y/TL)|0)*F.TW+((b.x/TL)|0)];return(v>0?v:40)*TL};
    const cc=(F,c)=>({x:cellC(c.cx),y:cellC(c.cy)});
    let cur={x:ch.x,y:ch.y};
    for(let i=0;i<s.fl.length;i++){const F=s.fl[i];
      if(i>0)cur=cc(F,F.arr);
      if(i===s.pf){const ph=F.items.find(q=>q.phone);px+=step(F,cur,ph);cur={x:ph.x,y:ph.y}}
      const tg=F.fwd?cc(F,F.fwd):cc(F,F.goal);px+=step(F,cur,tg)}
    s.par=Math.max(60,px/60*1.25);
    Snd.level(1);
  },
  ratio(){const s=this.s;return(s.leakT+s.pen)/s.par},
  exitSci(){const s=this.s;if(s.done)return;s.done=true;const r=this.ratio();G.delay=Math.round(s.leakT+s.pen);G.ratio=r;G.bites=s.hits;G.foci=clamp(1+Math.floor(r/1.5),1,6);setTimeout(()=>Flow.afterSci(),500)},
  vaultTake(){const s=this.s;if(s.done)return;s.done=true;beep(990,.3);setTimeout(()=>Flow.cure(),400)},
  hurt(e){
    const s=this.s,p=s.p;if(p.inv>0||s.god)return;p.hp--;p.inv=1.3;p.kt=.2;s.hits++;s.flash=.6;Snd.hurt();vib([50,30,70]);s.hl={i:p.hp,t:s.t};this.hudUpd();
    const d=Math.hypot(p.x-e.x,p.y-e.y)||1;p.kx=(p.x-e.x)/d*120;p.ky=(p.y-e.y)/d*120;
    if(s.k==='sci'){s.pen+=4;say('Укус! +4 с к задержке',1.8)}
    if(p.hp<=0){
      if(s.k==='sci'){const F=this.F,c=F.arr;p.x=cellC(c.cx);p.y=cellC(c.cy);p.hp=4;s.pen+=15;
        F.en.forEach(z=>{if(Math.hypot(z.x-p.x,z.y-p.y)<150){const k=(Math.random()*F.N)|0;z.x=cellC(k%F.CW);z.y=cellC((k/F.CW)|0);z.pc=z.tc=k;z.st='p';z.rise=0}});say('Вас оттащили к лестнице. +15 с к задержке',3);s.fade=1;s.hl={i:-1,t:-9}}
      else if(!s.done){s.done=true;setTimeout(()=>Flow.raidFail(),500)}}
  },
  alert(x,y,r){for(const e of this.F.en)if(!e.dead&&e.stun<=0&&e.rise<=0&&Math.hypot(e.x-x,e.y-y)<r){if(e.st!=='c')e.frz=.3;e.st='c';e.seen=0}},
  act(){ // удар / выстрел
    const s=this.s,p=s.p,F=this.F;
    if(s.k==='sci'){
      if(p.cd>0)return;p.cd=.6;p.sw=.22;let best=null,bd=1e9;
      for(const e of F.en){if(e.dead||e.stun>0||e.rise>0)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d<30&&Math.abs(angd(p.a,Math.atan2(dy,dx)))<1.35&&d<bd){best=e;bd=d}}
      if(best){p.a=Math.atan2(best.y-p.y,best.x-p.x);best.stun=3.4;best.st='s';moveBox(F,best,Math.cos(p.a)*9,Math.sin(p.a)*9,4.5);for(let i=0;i<7;i++)s.fx.push({x:best.x,y:best.y,vx:rnd(-40,40),vy:rnd(-40,40),l:.5,c:'#8a1a1a'});Snd.hit();vib(45)}
      else Snd.swing();
      this.alert(p.x,p.y,70);
    }else{
      if(p.cd>0)return;p.cd=.34;p.shot=.09;Snd.shot();let t=null,bd=1e9;
      for(const e of F.en){if(e.dead||e.rise>0)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);if(d<178&&Math.abs(angd(p.a,Math.atan2(dy,dx)))<.62&&d<bd&&clearLine(F,p.x,p.y,e.x,e.y)){t=e;bd=d}}
      let len;
      if(t){p.a=Math.atan2(t.y-p.y,t.x-p.x);len=bd;this.dmg(t,1,p.a)}
      else len=cast(F,p.x,p.y,Math.cos(p.a),Math.sin(p.a),178);
      s.tr={x:p.x+Math.cos(p.a)*10,y:p.y+Math.sin(p.a)*10,x2:p.x+Math.cos(p.a)*len,y2:p.y+Math.sin(p.a)*len,l:.09};
      this.alert(p.x,p.y,250);vib(22)}
  },
  dmg(e,d,a){const s=this.s;if(e.rise>0)return;e.hp-=d;e.st='c';e.seen=0;moveBox(this.F,e,Math.cos(a)*5,Math.sin(a)*5,4.5);Snd.hit();
    for(let i=0;i<5;i++)s.fx.push({x:e.x,y:e.y,vx:rnd(-40,40),vy:rnd(-40,40),l:.5,c:'#8a1a1a'});
    if(e.hp<=0){e.dead=.01;s.kills++;Snd.zdie(.8,e.pit);for(let i=0;i<9;i++)s.fx.push({x:e.x,y:e.y,vx:rnd(-50,50),vy:rnd(-50,50),l:.7,c:'#8a1a1a'})}},
  vec(){let x=(dn('R')?1:0)-(dn('L')?1:0),y=(dn('C')?1:0)-(dn('U')?1:0);if(joy.on){x+=joy.x;y+=joy.y}const m=Math.hypot(x,y);return m>1?{x:x/m,y:y/m,m:1}:{x,y,m}},
  cl(v,wl,vl){return wl<=vl?Math.round((wl-vl)/2):clamp(v,0,wl-vl)},
  camT(x,y,a){const F=this.F;return{x:this.cl(x+Math.cos(a)*14-W/2,F.TW*TL,W),y:this.cl(y+Math.sin(a)*10-H/2+8,F.TH*TL,H)}},
  cam(dt,snap){
    const s=this.s,p=s.p,t=this.camT(p.x,p.y,p.a);
    if(snap){s.cx=t.x;s.cy=t.y}else{const k=Math.min(1,dt*6);s.cx+=(t.x-s.cx)*k;s.cy+=(t.y-s.cy)*k}},
  fxUpdate(dt){const s=this.s;for(const f of s.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.95;f.vy*=.95;f.l-=dt}s.fx=s.fx.filter(f=>f.l>0);
    if(s.tr){s.tr.l-=dt;if(s.tr.l<=0)s.tr=null}
    for(const q of s.pings)q.l-=dt;s.pings=s.pings.filter(q=>q.l>0)},
  update(dt){
    const s=this.s,p=s.p,F=this.F;if(s.done)return;
    s.t+=dt;s.flash=Math.max(0,s.flash-dt);s.shake=Math.max(0,s.shake-dt);s.fade=Math.max(0,s.fade-dt*2.4);p.inv=Math.max(0,p.inv-dt);p.cd=Math.max(0,p.cd-dt);p.sw=Math.max(0,p.sw-dt);p.shot=Math.max(0,p.shot-dt);
    if(s.cut){this.cutUpdate(dt);return}
    if(s.zoom>1){s.zoom=Math.max(1,s.zoom-dt*1.1)}
    if(s.k==='sci'&&s.leak){s.leakT+=dt;s.trick+=dt;if(s.trick>26){s.trick=0;this.trickle()}this.procSpawns()}
    // движение
    const v=this.vec();p.sneak=!!dn('Z');p.spd=0;
    if(p.kt>0){p.kt-=dt;moveBox(F,p,p.kx*dt,p.ky*dt,5)}
    else if(v.m>.12){
      const f=clamp(v.m*1.3,.4,1),sp=(s.k==='sci'?66:62)*(p.sneak?.5:1)*f,dx=v.x/v.m*sp*dt,dy=v.y/v.m*sp*dt;
      p.a=turn(p.a,Math.atan2(v.y,v.x),dt*13);const ox=p.x,oy=p.y;moveBox(F,p,dx,dy,5);
      const mv=Math.hypot(p.x-ox,p.y-oy);p.spd=mv/dt;p.fr+=mv/6.5;p.stp+=mv;
      if(p.stp>24){p.stp=0;Snd.foot(p.sneak?.25:1)}}
    if(dn('X'))this.act();
    // след для отряда
    p.tt+=dt;if(p.tt>.05){p.tt=0;p.trail.unshift({x:p.x,y:p.y});if(p.trail.length>40)p.trail.pop()}
    // лестницы: переход по кнопке действия
    const inZ=(c)=>c&&Math.abs(p.x-cellC(c.cx))<17&&Math.abs(p.y-cellC(c.cy))<17,zf=inZ(F.fwd),zb=inZ(F.back);let st=null;
    if(zf){const lk=this.upLock(),fn=this.floorNo(s.pf);
      st={kind:'stair',lab:lk==='phone'?'Лестница закрыта: сначала телефон':lk==='wait'?'Лестница закрыта':(s.k==='sci'?'Подняться':'Спуститься')+' на этаж '+this.floorNo(s.fi+1),
        go:()=>{if(lk==='wait')say('Дверь на лестницу заблокирована: смена ещё не закончена.',2.6);else if(lk==='phone')say(s.fi===s.pf?'Без телефона наверх нельзя. Он в шкафчике на этом этаже — заберите его.':'Без телефона наверх нельзя. Вернитесь вниз: он в шкафчике на этаже '+fn+'.',3.4);else this.go(s.fi+1,true)}};
      if(lk==='phone'&&s.t-s.lockMsg>7){s.lockMsg=s.t;say(s.fi===s.pf?'Лестница закрыта: сначала заберите телефон из шкафчика на этом этаже.':'Лестница закрыта: телефон остался на этаже '+fn+'. Вернитесь за ним.',3.6);beep(220,.12,.07,'square')}}
    else if(zb)st={kind:'stair',lab:(s.k==='sci'?'Спуститься':'Подняться')+' на этаж '+this.floorNo(s.fi-1),go:()=>this.go(s.fi-1,false)};
    // аптечки и действия
    for(const m of F.meds)if(!m.t&&Math.hypot(m.x-p.x,m.y-p.y)<12&&p.hp<(s.k==='sci'?4:8)){m.t=1;p.hp++;say('Аптечка: +1 здоровье',2);beep(880,.1);vib(20);this.hudUpd()}
    s.near=null;for(const it of F.items)if(it.on()&&Math.hypot(it.x-p.x,it.y-p.y)<it.r){s.near=it;break}
    if(s.k==='sci'&&!s.leak&&s.t>.7)this.line('intro',[{t:'Так, ночная смена. Сегодня мне поручили новые испытания одного вируса.'},{t:'Сначала возьму образец из холодильника — он где-то в этом крыле.',hint:HINT('Ведите пальцем по экрану — идти. Жёлтое кольцо и стрелка показывают цель.','WASD или стрелки — идти. Жёлтое кольцо и стрелка показывают цель.')},{t:'Телефон, как всегда, оставил в шкафчике: здесь всё равно нет связи.'}]);
    if(s.near&&s.near.task===0)this.line('near',{t:'Вот и холодильник.',hint:HINT('Кнопка E — действие: взять, открыть, подняться.','Клавиша E — действие: взять, открыть, подняться.')});
    if(s.leak&&p.hp<=1)this.line('low',{t:'Ещё один укус — и мне конец… Нужна аптечка.',mood:'scared',hint:'Аптечки — белые коробки с красным крестом.'});
    if(!s.near)s.near=st;
    if(ed('E')&&s.near)s.near.go();
    // поле расстояний до игрока (для погони)
    const pt=((p.y/TL)|0)*F.TW+((p.x/TL)|0);s.ft-=dt;if(pt!==s.ftile||s.ft<=0){s.ftile=pt;s.ft=.4;tdist(F,(p.x/TL)|0,(p.y/TL)|0,s.field)}
    this.zombies(dt);
    if(s.k==='raid')this.squad(dt);
    this.fxUpdate(dt);
    // газ из камеры
    if(s.leak&&s.k==='sci'&&s.fi===0){const ch=F.items.find(q=>q.task===2);if(ch&&Math.random()<dt*9)s.fx.push({x:ch.x+rnd(-5,5),y:ch.y+rnd(-5,3),vx:rnd(-10,10),vy:rnd(-14,4),l:1.6,c:'#4fe0a0',g:1})}
    // пылинки в луче фонаря
    while(s.dust.length<34)s.dust.push({x:p.x+rnd(-110,110),y:p.y+rnd(-110,110),vx:rnd(-3,3),vy:rnd(-3,3),ph:rnd(0,6)});
    for(const d of s.dust){d.x+=d.vx*dt+Math.sin(s.t*.8+d.ph)*3*dt;d.y+=d.vy*dt+Math.cos(s.t*.7+d.ph)*3*dt;if(Math.hypot(d.x-p.x,d.y-p.y)>130){d.x=p.x+rnd(-100,100);d.y=p.y+rnd(-100,100)}}
    this.cam(dt);this.see();
    s.hudT-=dt;if(s.hudT<=0){s.hudT=.25;this.hudUpd()}
    const pr=$('#prompt');if(s.near){pr.style.display='block';const tx='E · '+s.near.lab;if(pr.textContent!==tx)pr.textContent=tx}else pr.style.display='none';
  },
  procSpawns(){
    const s=this.s;if(!s.spawnQ.length)return;
    for(let i=s.spawnQ.length-1;i>=0;i--){const q=s.spawnQ[i];if(q.fl!==s.fi||s.leakT<q.at)continue;if(this.spawnZ(q))s.spawnQ.splice(i,1);else q.at=s.leakT+1}},
  spawnZ(q){ // заражённый «выходит из люка» далеко от игрока и вне поля зрения, с предупреждением
    const s=this.s,F=this.F,p=s.p,pc=this.cellOf(F,p.x,p.y);
    const ok=(c,dm)=>{const x=cellC(c%F.CW),y=cellC((c/F.CW)|0);return Math.hypot(x-p.x,y-p.y)>dm&&!clearLine(F,p.x,p.y,x,y)};
    let cs=pickCells(F,pc,6,99,8,0).filter(c=>ok(c,160));
    if(!cs.length)cs=pickCells(F,pc,4,99,8,0).filter(c=>ok(c,120));
    if(!cs.length)return false;
    const c=cs[(Math.random()*cs.length)|0],x=cellC(c%F.CW),y=cellC((c/F.CW)|0);
    F.en.push(mkZ(F,x,y,q.v,{rise:4.4,rise0:4.4,emg:'hatch',st:'p',wait:1,snd:rnd(3,6)}));
    s.pings.push({x,y,l:3.2});this.line('hatch',{t:'Слышу скрежет решётки — оттуда кто-то лезет. Лучше обойти.',hint:'Красная стрелка у края экрана показывает, откуда шум.'});Snd.clank();setTimeout(()=>Snd.clank(),190);setTimeout(()=>Snd.groan(clamp(1-Math.hypot(x-p.x,y-p.y)/340,.14,.8),rnd(74,104)),420);
    return true},
  trickle(){const s=this.s,F=this.F;if(F.en.filter(e=>!e.dead).length>=13)return;s.spawnQ.push({fl:s.fi,at:s.leakT,v:(Math.random()*3)|0})},
  cellOf(F,x,y){return clamp(Math.round((x-32)/CP),0,F.CW-1)+clamp(Math.round((y-32)/CP),0,F.CH-1)*F.CW},
  zombies(dt){
    const s=this.s,p=s.p,F=this.F,raid=s.k==='raid',vis0=raid?112:100,spb=raid?this.cfg.diff*.8:0;
    for(const e of F.en){
      if(e.dead){e.dead+=dt;continue}
      e.bite=Math.max(0,e.bite-dt);e.snd-=dt;
      const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
      // «выход» из камеры или люка: пока идёт анимация, заражённый безвреден
      if(e.rise>0){
        e.rise-=dt;const u=1-e.rise/e.rise0;
        if(e.emg==='chamber'&&u<.45){const k=ease(u/.45);e.x=lerp(e.fx0,e.fx1,k);e.y=lerp(e.fy0,e.fy1,k)}
        if(e.rise<=0){e.rise=0;e.fr=0;if(e.emg==='chamber'){e.st='c';e.frz=.45;e.seen=0;e.wait=0;Snd.roar(clamp(1-d/260,.4,1),e.pit)}else{e.st='p';e.wait=.5;Snd.groan(clamp(1-d/300,.2,.9),e.pit)}}
        if(e.rise>0&&Math.random()<dt*12)s.fx.push({x:e.x+rnd(-5,5),y:e.y+rnd(-3,4),vx:rnd(-8,8),vy:rnd(-22,-6),l:.9,c:e.emg==='hatch'?'#8a929a':'#4fe0a0',g:1});
        continue}
      if(e.snd<=0){e.snd=rnd(2.6,5.4)*(e.st==='c'?.55:1);Snd.groan(clamp(1-d/300,0,1)*.9,e.pit)}
      if(e.stun>0){e.stun-=dt;if(e.stun<=0){e.st='c';e.seen=0;e.frz=.25}continue}
      // восприятие
      let sense=false;
      if(d<vis0*1.05){const back=Math.abs(angd(e.a,Math.atan2(dy,dx)))>1.9,vr=vis0*(back?.55:1)*(p.sneak?.45:1);if(d<vr&&clearLine(F,e.x,e.y,p.x,p.y))sense=true}
      if(!sense&&d<36&&!p.sneak&&p.spd>5)sense=true;
      if(sense){if(e.st!=='c'){e.st='c';e.frz=.6;e.a=Math.atan2(dy,dx);Snd.roar(clamp(1-d/260,.3,1),e.pit)}e.seen=0}
      else if(e.st==='c'){e.seen+=dt;if(e.seen>5.5){e.st='p';const c=this.cellOf(F,e.x,e.y);e.pc=c;e.tc=c;e.wait=1}}
      if(e.frz>0){e.frz-=dt;continue} // заметил игрока: замирает и рычит — время, чтобы отступить
      let sp,tx,ty;
      if(e.st==='c'){
        sp=([38,44,34][e.v]+spb);e.fr+=dt*8;
        if(d<30&&clearLine(F,e.x,e.y,p.x,p.y)){tx=p.x;ty=p.y}
        else{
          const TW=F.TW,fx=s.field,cx0=(e.x/TL)|0,cy0=(e.y/TL)|0,cur=fx[cy0*TW+cx0];let bn=-1,bd=cur<0?1e9:cur;
          for(let k=0;k<8;k++){const ddx=k<4?DX4[k]:(k===4||k===7?1:-1),ddy=k<4?DY4[k]:(k===4||k===5?1:-1),nx=cx0+ddx,ny=cy0+ddy;if(nx<0||ny<0||nx>=TW||ny>=F.TH)continue;
            const v=fx[ny*TW+nx];if(v<0||v>=bd)continue;if(k>=4&&(F.t[cy0*TW+nx]!==0||F.t[ny*TW+cx0]!==0))continue;bd=v;bn=ny*TW+nx}
          if(bn>=0){tx=(bn%TW)*TL+8;ty=((bn/TW)|0)*TL+8}else{tx=p.x;ty=p.y}}
      }else{
        sp=15;
        if(e.wait>0){e.wait-=dt;continue}
        const tcx=cellC(e.tc%F.CW),tcy=cellC((e.tc/F.CW)|0);
        if(Math.hypot(tcx-e.x,tcy-e.y)<3){
          const c=e.tc,opts=[];for(let k=0;k<4;k++)if(F.con[c]>>k&1){const n=((c/F.CW)|0)*F.CW+(c%F.CW)+0+DY4[k]*F.CW+DX4[k];if(n!==e.pc)opts.push(n)}
          const nx=opts.length?opts[(Math.random()*opts.length)|0]:e.pc;e.pc=c;e.tc=nx;if(Math.random()<.3)e.wait=rnd(1,3.5)}
        tx=cellC(e.tc%F.CW);ty=cellC((e.tc/F.CW)|0);e.fr+=dt*4;
      }
      const ang=Math.atan2(ty-e.y,tx-e.x);e.a=turn(e.a,ang,dt*5);
      moveBox(F,e,Math.cos(ang)*sp*dt,Math.sin(ang)*sp*dt,4.5);
      if(d<11.5&&e.bite<=0){e.bite=.9;this.hurt(e)}
    }
    // расталкивание
    const L=F.en;for(let i=0;i<L.length;i++){const a=L[i];if(a.dead||a.rise>0)continue;for(let j=i+1;j<L.length;j++){const b=L[j];if(b.dead||b.rise>0)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<9&&d>.01){const k=(9-d)*.5/d;moveBox(F,a,-dx*k,-dy*k,4.5);moveBox(F,b,dx*k,dy*k,4.5)}}}
    F.en=F.en.filter(e=>!e.dead||e.dead<1.4);
  },
  squad(dt){
    const s=this.s,p=s.p,F=this.F;
    s.sq.forEach((q,i)=>{const T=p.trail[Math.min(p.trail.length-1,7+i*7)]||p;const dx=T.x-q.x,dy=T.y-q.y,d=Math.hypot(dx,dy);
      if(d>1){q.fr+=Math.min(d,3)/6.5;q.a=turn(q.a,Math.atan2(dy,dx),dt*12)}q.x=T.x;q.y=T.y;q.cd-=dt;
      if(q.cd<=0){let t=null,bd=1e9;for(const e of F.en){if(e.dead||e.rise>0)continue;const ex=e.x-q.x,ey=e.y-q.y,dd=Math.hypot(ex,ey);if(dd<125&&dd<bd&&clearLine(F,q.x,q.y,e.x,e.y)){t=e;bd=dd}}
        if(t){q.cd=rnd(.8,1.3);q.a=Math.atan2(t.y-q.y,t.x-q.x);q.sh=.08;if(Math.random()<.65)this.dmg(t,1,q.a);Snd.n(.1,.45,'highpass',3000,900,.7);s.fx.push({x:q.x+Math.cos(q.a)*10,y:q.y+Math.sin(q.a)*10,vx:Math.cos(q.a)*400,vy:Math.sin(q.a)*400,l:.06,c:'#ffe28a',tr:1});this.alert(q.x,q.y,200)}else q.cd=.2}
      if(q.sh>0)q.sh-=dt})
  },
  see(){ // зона видимости фонаря, память карты
    const s=this.s,p=s.p,F=this.F,amb=[],cone=[],N1=96,N2=36;
    for(let i=0;i<N1;i++){const a=i/N1*Math.PI*2,d=cast(F,p.x,p.y,Math.cos(a),Math.sin(a),AMB);amb.push(d)}
    for(let i=0;i<=N2;i++){const a=p.a+(i/N2*2-1)*CONEA,d=cast(F,p.x,p.y,Math.cos(a),Math.sin(a),CONE);cone.push(d)}
    s.vis={amb,cone};
    // отметить увиденное
    const TW=F.TW,mark=(a,d,lim)=>{const c=Math.cos(a),sn=Math.sin(a),e=Math.min(lim,d+9);for(let r=0;r<=e;r+=7){const i=((p.y+sn*r)/TL|0)*TW+((p.x+c*r)/TL|0);if(F.seen[i]===0){F.seen[i]=1;F.mmd=true}}};
    for(let i=0;i<N1;i+=2)mark(i/N1*Math.PI*2,amb[i],AMB);for(let i=0;i<=N2;i++)mark(p.a+(i/N2*2-1)*CONEA,cone[i],CONE);
    // мини-карта: обновить
    if(F.mmd){F.mmd=false;const g=F.mmg,im=g.createImageData(F.TW,F.TH),d=im.data;
      for(let i=0;i<F.TW*F.TH;i++){if(!F.seen[i])continue;const t=F.t[i],c=t===1?[104,134,152]:t===0?[30,52,68]:[70,92,108];d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=235}
      g.putImageData(im,0,0)}
    // память на полотне этажа
    const mg=F.mg;mg.globalCompositeOperation='source-over';
    const fillPoly=(pts,R)=>{const gr=mg.createRadialGradient(p.x,p.y,0,p.x,p.y,R);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.75,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');mg.fillStyle=gr;mg.beginPath();mg.moveTo(p.x,p.y);pts.forEach(q=>mg.lineTo(q[0],q[1]));mg.closePath();mg.fill()};
    fillPoly(amb.map((d,i)=>{const a=i/N1*Math.PI*2,e=Math.min(AMB,d+9);return[p.x+Math.cos(a)*e,p.y+Math.sin(a)*e]}),AMB);
    fillPoly(cone.map((d,i)=>{const a=p.a+(i/N2*2-1)*CONEA,e=Math.min(CONE,d+9);return[p.x+Math.cos(a)*e,p.y+Math.sin(a)*e]}),CONE);
  },
  seeP(x,y){ // видна ли точка сейчас
    const s=this.s,p=s.p,F=this.F,dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy);if(d>CONE)return false;
    if(d<=AMB*.92)return clearLine(F,p.x,p.y,x,y);
    if(Math.abs(angd(p.a,Math.atan2(dy,dx)))>CONEA*.95)return false;return clearLine(F,p.x,p.y,x,y)},
  upLock(){const s=this.s;if(s.k!=='sci')return '';if(!s.leak)return 'wait';if(!s.phone&&s.fi>=s.pf)return 'phone';return ''},
  target(){ // куда указывает стрелка-подсказка
    const s=this.s,F=this.F;let tf,tp;
    if(s.cut)return null;
    if(s.k==='raid'){tf=s.fl.length-1;const g=s.fl[tf].goal;tp={x:cellC(g.cx),y:cellC(g.cy)}}
    else if(!s.leak){const it=s.fl[0].items.find(q=>q.task===s.tasks);tf=0;tp=it&&{x:it.x,y:it.y}}
    else if(!s.phone){tf=s.pf;const it=s.fl[tf].items.find(q=>q.phone);tp={x:it.x,y:it.y}}
    else{tf=s.fl.length-1;const g=s.fl[tf].goal;tp={x:cellC(g.cx),y:cellC(g.cy)}}
    if(!tp)return null;
    if(tf===s.fi)return{x:tp.x,y:tp.y,sure:true};
    const c=tf>s.fi?F.fwd:F.back;if(!c)return null;
    const sx=cellC(c.cx),sy=cellC(c.cy);if(!F.seen[((sy/TL)|0)*F.TW+((sx/TL)|0)])return null;return{x:sx,y:sy,sure:false}},
  hudUpd(){
    const s=this.s,fl=this.floorNo(s.fi),mx=s.k==='sci'?4:8;let o;
    const hearts='<span class="hearts">'+Array.from({length:mx},(_,i)=>`<i class="${i<s.p.hp?'':'l'}${s.hl.i===i&&s.t-s.hl.t<.8?' x':''}">♥</i>`).join('')+'</span>';
    if(s.k==='sci'){
      const ob=s.cut?'Камера изоляции В-3':!s.leak?['Возьмите образец из холодильника','Отнесите пробу в центрифугу','Проверьте камеру изоляции В-3'][s.tasks]:!s.phone?`Найдите телефон · этаж ${s.pf+1}`:`Поднимитесь к выходу · этаж ${s.fl.length}`;
      o=`<b>01 УЧЁНЫЙ</b><span class="ob">${ob}</span>`+(s.leak?`<span class="r">ТРЕВОГА ${mmss(s.leakT+s.pen)}</span>`:'<span class="d">смена</span>')+`<span>эт.${fl}</span><span>${hearts}</span>`;
    }else{
      const left=s.fl.reduce((a,f)=>a+f.en.filter(e=>!e.dead).length,0);
      o=`<b>РЕЙД</b><span class="ob">К хранилищу · этаж 1 ↓</span><span class="a">заражённых: ${Cnt.h('mz.left',left,'i')}</span><span>эт.${fl}</span><span>${hearts}</span>`}
    hud(o)},
  // ---------------------------------------------------------------- рисование
  getDark(){const D=this.dk||(this.dk=document.createElement('canvas'));if(!this.dg||D.width!==W){D.width=W;D.height=H;this.dg=D.getContext('2d')}return D},
  drawStrip(F,r,cX){cx.drawImage(F.top,cX,r*TL,W,TL,cX,r*TL,W,TL)},
  draw(){
    const s=this.s,p=s.p,F=this.F,t=s.t;
    let cX=Math.round(s.cx),cY=Math.round(s.cy);
    if(s.shake>0){cX+=Math.round((Math.random()*2-1)*s.shake*5);cY+=Math.round((Math.random()*2-1)*s.shake*5)}
    cX=this.cl(cX,F.cv.width,W);cY=this.cl(cY,F.cv.height,H);
    if(F.cv.width<W||F.cv.height<H){cx.fillStyle='#000';cx.fillRect(0,0,W,H)}
    cx.drawImage(F.cv,cX,cY,W,H,0,0,W,H);
    cx.save();cx.translate(-cX,-cY);
    // лампы тревоги / светодиоды
    for(const L of F.leds){if(L.x<cX-4||L.x>cX+W+4||L.y<cY-4||L.y>cY+H+4)continue;if(Math.sin(t*L.f+L.p)>-.2)rect(L.x,L.y,2,1,L.c)}
    if(s.leak){for(const L of F.lamps){if(!L.room||L.x<cX-90||L.x>cX+W+90||L.y<cY-90||L.y>cY+H+90)continue;const a=.07+.05*Math.sin(t*5+L.x);cx.fillStyle='rgba(255,30,20,'+a.toFixed(3)+')';cx.beginPath();cx.arc(L.x,L.y,Math.min(L.r,60),0,6.3);cx.fill()}}
    // цели: пульсирующий маркер; лестницы: стрелки
    const tg=this.target();
    if(!s.cut)for(const it of F.items){if(it.info||!it.on||!it.on())continue;const m=Math.sin(t*4)*.5+.5;cx.strokeStyle='rgba(229,169,59,'+(.5+m*.4).toFixed(2)+')';cx.lineWidth=1.5;cx.beginPath();cx.arc(it.x,it.y,12+m*3,0,6.3);cx.stroke();Post.glow(it.x,it.y,20,'229,169,59',.12+.08*m)}
    for(const c of[F.fwd,F.back]){if(!c)continue;const x=cellC(c.cx),y=cellC(c.cy);if(x<cX-30||x>cX+W+30||y<cY-30||y>cY+H+30)continue;const up=c===F.fwd?F.fwd.up:!F.back.up,b=Math.sin(t*3+x)*2;cx.fillStyle=c===F.fwd?(this.upLock()==='phone'?'rgba(255,90,80,'+(.4+.3*Math.sin(t*6)).toFixed(2)+')':'rgba(120,240,230,.55)'):'rgba(255,200,90,.45)';cx.beginPath();const ay=y+(up?-b:b);if(up){cx.moveTo(x,ay-5);cx.lineTo(x+5,ay+2);cx.lineTo(x-5,ay+2)}else{cx.moveTo(x,ay+5);cx.lineTo(x+5,ay-2);cx.lineTo(x-5,ay-2)}cx.fill()}
    // аптечки
    for(const m of F.meds){if(m.t||!F.seen[((m.y/TL)|0)*F.TW+((m.x/TL)|0)])continue;const b=Math.sin(t*3+m.x)*.8;cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(m.x+1,m.y+5,6,2.5,0,0,6.3);cx.fill();
      rect(m.x-5,m.y-4+b,10,8,'#0d1318');rect(m.x-4,m.y-5+b,10,8,'#e8f4fa');rect(m.x-1,m.y-4+b,3,6,'#e0453a');rect(m.x-3,m.y-2+b,7,2,'#e0453a');rect(m.x-4,m.y-5+b,10,1,'#fff')}
    // пыль в луче
    for(const d of s.dust){if(d.x<cX||d.x>cX+W||d.y<cY||d.y>cY+H)continue;const a=.3+.3*Math.sin(t*2+d.ph);cx.fillStyle='rgba(255,246,214,'+a.toFixed(2)+')';cx.fillRect(d.x|0,d.y|0,1,1)}
    // сущности вперемешку с верхними гранями стен (чтобы за стенами и шкафами прятаться)
    const ents=[];
    const zk=['z0','z1','z2'];
    for(const e of F.en){const see=this.seeP(e.x,e.y);if(see&&e.rise<=0&&!e.dead&&!e.met){e.met=1;if(s.leak)this.line('met',{t:'Он меня заметил! Если подойдёт вплотную — ударю и сразу бежать.',mood:'scared',hint:HINT('✊ Удар оглушает заражённого на 3 секунды.','Пробел — удар: оглушает заражённого на 3 секунды.')})}
      e.rem=!see&&e.met&&!e.dead&&!!F.seen[((e.y/TL)|0)*F.TW+((e.x/TL)|0)];e.vis+=(((see||e.rem)?1:0)-e.vis)*.35;if(e.vis<.06)continue;ents.push({y:e.y,e})}
    if(s.k==='raid')s.sq.forEach((q,i)=>ents.push({y:q.y,q,i}));
    ents.push({y:p.y,pl:1});ents.sort((a,b)=>a.y-b.y);
    // тень вытянута от фонаря игрока: объём и направление света
    const shadow=(x,y,al,big)=>{const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy)||1,k=Math.min(1,d/90),ox=dx/d*(2+3.5*k),oy=dy/d*(1.5+2.5*k)+3.5;
      cx.fillStyle='rgba(0,0,0,'+(.4*al).toFixed(2)+')';cx.beginPath();cx.ellipse(x+ox,y+oy,8+k*3*(d>2?1:0),4.6+k*1.2,Math.atan2(dy,dx)*.5,0,6.3);cx.fill()};
    const r0=Math.max(0,Math.floor(cY/TL)),r1=Math.min(F.TH-1,Math.floor((cY+H)/TL));let nr=r0;
    for(const o of ents){
      while(nr<=r1&&(nr+1)*TL<=o.y)this.drawStrip(F,nr++,cX);
      if(o.e){const e=o.e,k=zk[e.v];
        if(e.rise>0){this.riseDraw(e,k,t);continue}
        if(e.dead){shadow(e.x,e.y,Math.max(0,1-e.dead/1.4));TS.draw(cx,k,'down',e.a,0,e.x,e.y,Math.max(0,1-e.dead/1.4)*e.vis);continue}
        if(e.stun>0){shadow(e.x,e.y,e.vis);TS.draw(cx,k,'down',e.a,0,e.x,e.y,e.vis);txt('z',e.x,e.y-12,'#9fb3c0',8,'center');continue}
        shadow(e.x,e.y,e.vis);TS.draw(cx,k,'walk',e.a,e.frz>0?0:Math.floor(e.fr),e.x,e.y+(e.frz>0?-Math.abs(Math.sin(t*30))*.8:0),e.vis);
        if(e.frz>0){cx.fillStyle='rgba(255,60,40,'+(e.vis*.5).toFixed(2)+')';cx.fillRect(e.x-4,e.y-13,8,1)}
        if(e.st==='c')txt('!',e.x,e.y-15,'#ff5b4d',10,'center')}
      else if(o.q){const q=o.q;shadow(q.x,q.y,1);TS.draw(cx,'sol',q.sh>0?'shoot':'walk',q.a,Math.floor(q.fr),q.x,q.y)}
      else{const blink=p.inv>0&&Math.floor(t*14)%2;if(!blink){shadow(p.x,p.y,1);
        const mv=p.spd>5;let pose=mv?(p.sneak?'sneak':'walk'):'idle',fi=mv?Math.floor(p.fr):Math.floor(t*2);
        if(s.k==='sci'&&p.sw>0){pose='strike';fi=0}else if(s.k==='raid'&&p.shot>0){pose='shoot';fi=0}
        TS.draw(cx,s.k==='sci'?'sci':'sol',pose,p.a,fi,p.x,p.y)}}
    }
    while(nr<=r1)this.drawStrip(F,nr++,cX);
    if(s.tr){const g=cx;g.strokeStyle='rgba(255,236,160,'+(s.tr.l/.09).toFixed(2)+')';g.lineWidth=1.5;g.beginPath();g.moveTo(s.tr.x,s.tr.y);g.lineTo(s.tr.x2,s.tr.y2);g.stroke();rect(s.tr.x-2,s.tr.y-2,4,4,'#fff6c8')}
    for(const f of s.fx){cx.globalAlpha=Math.min(1,f.l*2.5);if(f.tr){rect(f.x-1,f.y-1,3,3,f.c)}else rect(f.x,f.y,f.g?3:2,f.g?3:2,f.c);cx.globalAlpha=1}
    if(s.k==='sci'&&s.fi===0)this.chamberFx(t);
    // стрелка-подсказка (в мировых координатах)
    if(tg&&!s.cut){const dx=tg.x-p.x,dy=tg.y-p.y,d=Math.hypot(dx,dy);if(d>56){const a=Math.atan2(dy,dx),r=34+Math.sin(t*5)*2,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;cx.fillStyle=tg.sure?'#e5a93b':'#4cc9c0';cx.beginPath();cx.moveTo(x+Math.cos(a)*6,y+Math.sin(a)*6);cx.lineTo(x+Math.cos(a+2.4)*5,y+Math.sin(a+2.4)*5);cx.lineTo(x+Math.cos(a-2.4)*5,y+Math.sin(a-2.4)*5);cx.fill()}}
    cx.restore();
    if(s.cut)this.cineDark(cX,cY);else this.dark(F,cX,cY);
    this.glowPass(F,cX,cY,t);if(!s.cut)this.remPass(F,cX,cY,t);this.cam0={x:cX,y:cY};
    // приближение камеры в кат-сцене
    if(s.zoom>1.004){const z=s.zoom,sx=s.zf.x-cX,sy=s.zf.y-cY,tc=this.tc||(this.tc=document.createElement('canvas'));if(tc.width!==W){tc.width=W;tc.height=H}
      tc.getContext('2d').drawImage(cv,0,0);cx.imageSmoothingEnabled=true;cx.drawImage(tc,sx-sx/z,sy-sy/z,W/z,H/z,0,0,W,H);cx.imageSmoothingEnabled=false}
    // красная тревога, укус
    if(s.leak){cx.fillStyle='rgba(200,20,20,'+(.05+.035*Math.sin(t*6)+s.flash*.25)+')';cx.fillRect(0,0,W,H)}
    else if(s.flash>0){cx.fillStyle='rgba(255,255,255,'+s.flash*.3+')';cx.fillRect(0,0,W,H)}
    if(s.cut&&s.cut.bang&&s.flash>0){cx.fillStyle='rgba(235,255,248,'+Math.min(.85,s.flash*.8)+')';cx.fillRect(0,0,W,H)}
    if(p.hp<=1){cx.fillStyle='rgba(120,0,0,'+(.1+.06*Math.sin(t*7))+')';cx.fillRect(0,0,W,H)}
    if(s.fade>0){cx.fillStyle='rgba(0,0,0,'+s.fade+')';cx.fillRect(0,0,W,H)}
    if(!s.cut)this.mini();
  },
  // «выход» зомби: люк/камера, красный свет, вставание
  riseDraw(e,k,t){
    const u=1-e.rise/e.rise0,x=e.x,y=e.y,al=e.vis;
    if(e.emg==='hatch'){ // решётка люка с красным подсветом
      const o=clamp(u*5,0,1),f=clamp((1-u)*4,0,1);
      cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(x-8,y-5,16,11);
      cx.fillStyle='#0b1015';cx.fillRect(x-7,y-6,14,11);cx.fillStyle='rgba(255,50,40,'+(.35+.25*Math.sin(t*10))*Math.min(o,f+.4)+')';cx.fillRect(x-6,y-5,12,9);
      cx.fillStyle='#3a4650';for(let i=-5;i<=5;i+=3)cx.fillRect(x+i,y-6,1,11);cx.fillRect(x-7,y-6,14,1);cx.fillRect(x-7,y+4,14,1);
    }
    if(al<.06)return;
    cx.fillStyle='rgba(0,0,0,'+(.35*al).toFixed(2)+')';cx.beginPath();cx.ellipse(x+1,y+4,8,4.6,0,0,6.3);cx.fill();
    const jx=u>.15&&u<.6?rnd(-.8,.8):0,jy=u>.15&&u<.6?rnd(-.5,.5):0;
    if(u<.55){TS.draw(cx,k,'down',e.a,0,x+jx,y+jy,al)}
    else{const f=clamp((u-.55)/.3,0,1);TS.draw(cx,k,'down',e.a,0,x,y,al*(1-f));TS.draw(cx,k,'walk',e.a,0,x,y+(1-ease(f))*4,al*f)}
    for(let q=0;q<2;q++){const r=3+((u*1.4+q*.5)%1)*16;cx.strokeStyle='rgba(255,90,70,'+(al*(1-((u*1.4+q*.5)%1))*.7).toFixed(2)+')';cx.lineWidth=1;cx.beginPath();cx.ellipse(x,y+2,r,r*.55,0,0,6.3);cx.stroke()}
    if(u>.78&&Math.floor(t*8)%2)txt('!',x,y-15,'#ff5b4d',10,'center');
  },
  // камера В-3: трещины, силуэт, разбитый купол
  chamberFx(t){
    const s=this.s,ch=s.fl[0].items.find(q=>q.task===2);if(!ch)return;const x=ch.tx*TL+8,y=ch.ty*TL+5,c=s.cut;
    if(!s.chb){
      if(!c)return;const T=c.t;
      if(T>1.2)Post.glow(x,y,26,'60,255,170',(.16+.14*Math.sin(t*22))*Math.min(1,(T-1.2)));
      const pr=clamp((T-3)/2.4,0,1);
      if(pr>0){cx.strokeStyle='rgba(236,255,250,.92)';cx.lineWidth=1;for(const seg of c.cr){const n=Math.ceil(seg.length*pr);cx.beginPath();cx.moveTo(x,y);for(let i=0;i<n;i++){const q=seg[i],f=i===n-1?(seg.length*pr-i):1;cx.lineTo(x+q[0]*Math.min(1,f),y+q[1]*Math.min(1,f)*.9)}cx.stroke()}}
      if(T>4.2){const a=clamp((T-4.2)/.8,0,1);cx.fillStyle='rgba(8,24,20,'+(.7*a).toFixed(2)+')';cx.beginPath();cx.ellipse(x+Math.sin(T*3)*1.2,y+.5,3,4,0,0,6.3);cx.fill();
        if(Math.sin(T*18)>-.3){cx.fillStyle='rgba(255,70,50,'+a+')';cx.fillRect(x-2,y-1,1,1);cx.fillRect(x+1,y-1,1,1);Post.glow(x,y-1,8,'255,60,40',.45*a)}}
    }else{
      cx.fillStyle='#06140f';cx.beginPath();for(let i=0;i<10;i++){const a=i/10*6.283,r=i%2?3.2:6.4;cx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.9)}cx.closePath();cx.fill();
      cx.strokeStyle='rgba(230,255,248,.85)';cx.lineWidth=1;cx.stroke();cx.fillStyle='rgba(230,255,248,.8)';for(const[a,b]of[[-6,-1],[6,2],[-3,6],[4,-6],[0,-7]])cx.fillRect(x+a,y+b,1,1);
      Post.glow(x,y,24,'60,255,170',.16+.08*Math.sin(t*5));
    }
  },
  // замеченные заражённые остаются видны на уже изученных участках (поверх темноты)
  remPass(F,cX,cY,t){const zk=['z0','z1','z2'];cx.save();cx.translate(-cX,-cY);
    for(const e of F.en){if(!e.rem||e.dead||e.rise>0)continue;const a=.55+.12*Math.sin(t*4+e.x);
      cx.fillStyle='rgba(255,70,50,'+(a*.5).toFixed(2)+')';cx.beginPath();cx.ellipse(e.x,e.y+4,7,3.2,0,0,6.3);cx.fill();
      TS.draw(cx,zk[e.v],e.stun>0?'down':'walk',e.a,e.stun>0?0:Math.floor(e.fr),e.x,e.y,a);
      if(e.st==='c')txt('!',e.x,e.y-15,'#ff5b4d',10,'center')}
    cx.restore()},
  // свет красных глаз и люков, видимых даже в полной темноте (предупреждение до встречи)
  glowPass(F,cX,cY,t){
    const s=this.s,p=s.p;if(s.cut)return;
    for(const e of F.en){
      if(e.dead||e.stun>0)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d>240)continue;
      const sx=e.x-cX,sy=e.y-cY;if(sx<-24||sx>W+24||sy<-24||sy>H+24)continue;
      if(!clearLine(F,p.x,p.y,e.x,e.y))continue;
      const a=clamp(1-(d-60)/200,.2,1);
      if(e.rise>0){Post.glow(sx,sy,18+8*Math.sin(t*9),'255,50,40',.55*a);continue}
      const fx=Math.cos(e.a),fy=Math.sin(e.a),ex=sx+fx*2.2,ey=sy-3.5+fy*1.6,hot=e.st==='c'?1:.7;
      cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,70,45,'+(a*hot).toFixed(2)+')';cx.fillRect(Math.round(ex-fy*1.8)-1,Math.round(ey+fx*1.2),2,1);cx.fillRect(Math.round(ex+fy*1.8),Math.round(ey-fx*1.2),2,1);cx.restore();
      Post.glow(ex,ey,7,'255,60,40',.32*a*hot)}
    // всплески «тревога»: кольцо или стрелка к источнику звука за экраном
    for(const q of s.pings){const sx=q.x-cX,sy=q.y-cY,a=Math.min(1,q.l/1.2);
      if(sx>6&&sx<W-6&&sy>26&&sy<H-6){const r=(3.2-q.l)*10;cx.strokeStyle='rgba(255,80,60,'+(a*.8).toFixed(2)+')';cx.lineWidth=1.5;cx.beginPath();cx.arc(sx,sy,6+r,0,6.3);cx.stroke()}
      else{const ang=Math.atan2(sy-H/2,sx-W/2),ex=clamp(W/2+Math.cos(ang)*220,14,W-14),ey=clamp(H/2+Math.sin(ang)*130,36,H-14),b=Math.sin(t*14)*.5+.5;
        cx.fillStyle='rgba(255,70,50,'+(a*(.55+b*.4)).toFixed(2)+')';cx.beginPath();cx.moveTo(ex+Math.cos(ang)*7,ey+Math.sin(ang)*7);cx.lineTo(ex+Math.cos(ang+2.5)*6,ey+Math.sin(ang+2.5)*6);cx.lineTo(ex+Math.cos(ang-2.5)*6,ey+Math.sin(ang-2.5)*6);cx.fill()}}
  },
  cineDark(cX,cY){
    const s=this.s,c=s.cut,D=this.getDark(),g=this.dg,sx=c.ch.x-cX,sy=c.ch.y-cY;
    g.globalCompositeOperation='source-over';g.globalAlpha=1;g.fillStyle='rgba(2,4,8,.78)';g.fillRect(0,0,W,H);g.globalCompositeOperation='destination-out';
    const R=c.bang?170:124,gr=g.createRadialGradient(sx,sy,6,sx,sy,R);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.55,'rgba(0,0,0,.72)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);
    const px=s.p.x-cX,py=s.p.y-cY,g2=g.createRadialGradient(px,py,4,px,py,56);g2.addColorStop(0,'rgba(0,0,0,.55)');g2.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=g2;g.fillRect(0,0,W,H);
    g.globalCompositeOperation='source-over';cx.drawImage(D,0,0);
    if(c.bang){cx.fillStyle='rgba(220,30,20,'+(.07+.09*Math.max(0,Math.sin(c.t*9))).toFixed(3)+')';cx.fillRect(0,0,W,H)}
    const vg=cx.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*1.0);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');cx.fillStyle=vg;cx.fillRect(0,0,W,H)},
  dark(F,cX,cY){
    const s=this.s,p=s.p;if(!s.vis)return;const D=this.getDark(),v=s.vis,px=p.x-cX,py=p.y-cY,N1=v.amb.length,N2=v.cone.length-1;
    const g=this.dg;
    g.globalCompositeOperation='source-over';g.globalAlpha=1;g.fillStyle='rgba(1,2,5,.985)';g.fillRect(0,0,W,H);
    g.globalCompositeOperation='destination-out';
    g.globalAlpha=.66;g.drawImage(F.mem,this.cl(cX,F.mem.width,W),this.cl(cY,F.mem.height,H),W,H,0,0,W,H);g.globalAlpha=1;
    // всесторонний свет
    const poly=(pts,R,stops)=>{const gr=g.createRadialGradient(px,py,0,px,py,R);stops.forEach(q=>gr.addColorStop(q[0],'rgba(0,0,0,'+q[1]+')'));g.fillStyle=gr;g.beginPath();g.moveTo(px,py);pts.forEach(q=>g.lineTo(q[0],q[1]));g.closePath();g.fill()};
    const ambPts=v.amb.map((d,i)=>{const a=i/N1*Math.PI*2,e=Math.min(AMB,d+9);return[px+Math.cos(a)*e,py+Math.sin(a)*e]});
    poly(ambPts,AMB,[[0,1],[.45,.96],[.8,.55],[1,0]]);
    for(const[k,w,al]of[[1,1,.4],[.78,.78,.35],[.55,.55,.3]]){
      const pts=[];for(let i=0;i<=N2;i++){const a0=(i/N2*2-1)*CONEA*w,a=p.a+a0,e=Math.min(CONE*k,v.cone[i]+9);pts.push([px+Math.cos(a)*e,py+Math.sin(a)*e])}
      poly(pts,CONE*k,[[0,al],[.7,al*.8],[1,0]])}
    g.globalCompositeOperation='source-over';
    cx.drawImage(D,0,0);
    // тёплый свет фонаря поверх
    cx.save();cx.globalCompositeOperation='lighter';
    const gr=cx.createRadialGradient(px+Math.cos(p.a)*40,py+Math.sin(p.a)*40,4,px+Math.cos(p.a)*40,py+Math.sin(p.a)*40,92);gr.addColorStop(0,'rgba(255,236,190,.13)');gr.addColorStop(1,'rgba(255,236,190,0)');cx.fillStyle=gr;cx.fillRect(px-130,py-130,260,260);
    const gp=cx.createRadialGradient(px,py,2,px,py,44);gp.addColorStop(0,'rgba(255,240,210,.12)');gp.addColorStop(1,'rgba(255,240,210,0)');cx.fillStyle=gp;cx.fillRect(px-50,py-50,100,100);cx.restore();
    // виньетка
    const vg=cx.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*1.05);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');cx.fillStyle=vg;cx.fillRect(0,0,W,H)},
  mini(){
    const s=this.s,F=this.F,p=s.p,sc=Math.min(1.5,Math.max(1,(W*.15)/F.TW),46/F.TH),mw=F.TW*sc,mh=F.TH*sc,mx=Math.round(W-SAFE.r-mw-6),my=30,c0=this.cam0||{x:s.cx,y:s.cy};
    const inR=(x,y)=>{const X=x-c0.x,Y=y-c0.y;return X>mx-14&&X<mx+mw+14&&Y>my-14&&Y<my+mh+22};
    let busy=inR(p.x,p.y);for(const e of F.en)if(!e.dead&&(e.vis>.3)&&inR(e.x,e.y)){busy=true;break}
    const tg0=this.target();if(tg0&&tg0.sure&&inR(tg0.x,tg0.y))busy=true;for(const it of F.items)if(it.on&&it.on()&&inR(it.x,it.y))busy=true;
    s.mmA+=((busy?.18:.82)-s.mmA)*.12;cx.globalAlpha=s.mmA;
    cx.fillStyle='rgba(7,13,19,.62)';cx.fillRect(mx-3,my-3,mw+6,mh+6);cx.strokeStyle='#2e6f6a';cx.lineWidth=1;cx.strokeRect(mx-2.5,my-2.5,mw+5,mh+5);
    cx.imageSmoothingEnabled=false;cx.drawImage(F.mm,mx,my,mw,mh);
    const dot=(x,y,c,r)=>{cx.fillStyle=c;cx.fillRect(mx+x/TL*sc-r,my+y/TL*sc-r,r*2,r*2)};
    const seenAt=(x,y)=>F.seen[((y/TL)|0)*F.TW+((x/TL)|0)];
    if(F.fwd&&seenAt(cellC(F.fwd.cx),cellC(F.fwd.cy)))dot(cellC(F.fwd.cx),cellC(F.fwd.cy),'#4cc9c0',1.6);
    if(F.back)dot(cellC(F.back.cx),cellC(F.back.cy),'#e5a93b',1.6);
    if(F.goal&&seenAt(cellC(F.goal.cx),cellC(F.goal.cy)))dot(cellC(F.goal.cx),cellC(F.goal.cy),'#66e08a',1.6);
    const tg=this.target();if(tg&&tg.sure&&seenAt(tg.x,tg.y))dot(tg.x,tg.y,'#ffd24a',1.6);
    for(const e of F.en)if(e.met&&!e.dead&&seenAt(e.x,e.y))dot(e.x,e.y,'#ff5b4d',1.1);
    for(const q of s.pings)if(Math.sin(s.t*16)>-.2)dot(q.x,q.y,'#ff5b4d',1.8);
    dot(p.x,p.y,'#fff',1.3);
    txt('ЭТАЖ '+this.floorNo(s.fi),mx,my+mh+11,'#9fb3c0',8);cx.globalAlpha=1}
};
ACT.cut_skip=()=>{if(mode&&mode.cutSkip)mode.cutSkip()};
