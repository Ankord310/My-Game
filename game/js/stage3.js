'use strict';
// Этап 3 «Эвакуация»: город, группы выживших, парк техники. Вы выбираете машину и группу — она едет по улицам,
// грузит людей и везёт на аэродром. Заражённые толпами идут по тем же улицам; броня отвлекает их, вертолёт летит напрямик.
const RX=[12,40,78,116,142,198,228,268,300,326],RY=[44,80,116,152,188,224,252],BRY=[80,152,224],LZ=[7,3];
// парк техники: вместимость, скорость, прочность, скорость погрузки (чел/с)
const VT={
  bus:{n:'Автобус',cap:50,v:20,hp:4,ld:8,ic:'🚌',d:'быстрая, 50 мест'},
  truck:{n:'Грузовик',cap:100,v:13,hp:6,ld:10,ic:'🚚',d:'медленный, 100 мест'},
  jeep:{n:'Джип',cap:12,v:30,hp:2,ld:6,ic:'🚙',d:'очень быстрый, 12 мест'},
  heli:{n:'Вертолёт',cap:30,v:34,hp:3,ld:6,ic:'✈',d:'летит напрямик, 30 мест',fly:1},
  apc:{n:'БТР',cap:0,v:18,hp:10,ld:0,ic:'⛨',d:'отвлекает заражённых',apc:1}
};
const FL=[['bus1','bus'],['bus2','bus'],['trk','truck'],['jeep1','jeep'],['jeep2','jeep'],['heli','heli'],['apc1','apc'],['apc2','apc']];
// группы выживших: колонка и ряд перекрёстка, численность, название
const GRP=[[0,1,60,'Дом'],[1,0,45,'Школа'],[2,0,90,'Рынок'],[3,1,70,'Офисы'],[1,2,50,'Детсад'],[3,2,120,'Больница'],[0,3,55,'Общага'],[2,3,100,'Стадион'],[4,3,40,'Вокзал'],
  [1,4,65,'Склады'],[3,4,80,'ТЦ'],[2,5,75,'Завод'],[0,6,40,'Гаражи'],[5,0,35,'Парк'],[8,5,45,'Посёлок'],[0,0,45,'Бараки'],[4,1,60,'Клиника'],[1,3,70,'Мэрия'],[3,5,90,'Депо'],[6,1,40,'Отель'],[7,5,50,'Склад']];
const Mil={
  tut:'s3',tutAuto:false,rs:2,map:null,br:null,lt:0,
  enter(){
    Snd.play('mil');
    if(!this.map){this.map=Maps.city3(RS);this.br=Maps.bridge(46,8,RS)}
    this.mkStrip();this.mkGraph();
    const N=this.N,gs=GRP.map((a,i)=>{const nd=N[this.nid[a[1]*RX.length+a[0]]];return{id:i,node:nd.i,x:nd.x,y:nd.y,n:a[2],people:a[2],nm:a[3],doom:rnd(110,250)*(.8+.2*Math.min(1,i/6)),doom0:0,st:'wait',ld:0}});
    gs.forEach(g=>g.doom0=g.doom);
    const lz=N[this.nid[LZ[1]*RX.length+LZ[0]]],vs=FL.map(([id,t],i)=>({id,t,d:VT[t],x:lz.x+(i%4)*0,y:lz.y,node:lz.i,st:'ready',hp:VT[t].hp,cargo:0,pts:null,pi:0,dx:1,dy:0,tgt:null,k:0}));
    const total=gs.reduce((a,g)=>a+g.n,0);
    const s=this.s={t:0,dur:210,hold:false,g:gs,h:[],v:vs,total,saved:0,killed:0,vlost:0,sel:'bus1',tg:null,hid:1,hT:12,sirT:4,panT:2,fx:[],ruins:[],log:[],end:false,hudT:0,uiSig:'',shake:0,smoke:[]};
    this.spawnH(8);
    ctrl(false);this.ui();this.hudUpd();this.lt=performance.now();
    if(Coach.need('s3'))this.coach();else say('Выберите технику, затем нажмите на группу выживших.',4.5);
  },
  exit(){},
  mkStrip(){const ex=Math.max(0,OX);this.exW=ex;this.strip=ex>2?Maps.cityStrip('c3',ex,RS):null},
  resize(){if(this.s&&this.exW!==Math.max(0,OX))this.mkStrip()},
  // ---------------------------------------------------------------- дорожный граф
  mkGraph(){
    if(this.N)return;const M=this.map,N=[],nid={},wat=(x,y)=>M.water(x,y);
    RY.forEach((y,ri)=>RX.forEach((x,ci)=>{if(wat(x,y)){nid[ri*RX.length+ci]=-1;return}nid[ri*RX.length+ci]=N.length;N.push({i:N.length,x,y,e:[],ci,ri})}));
    const clear=(A,B)=>{for(let k=1;k<9;k++){const u=k/9;if(wat(A.x+(B.x-A.x)*u,A.y+(B.y-A.y)*u))return false}return true};
    const link=(a,b)=>{if(a<0||b<0)return;const A=N[a],B=N[b];if(clear(A,B)){A.e.push(b);B.e.push(a)}};
    for(let ri=0;ri<RY.length;ri++){for(let ci=0;ci<RX.length-1;ci++){const a=nid[ri*RX.length+ci],b=nid[ri*RX.length+ci+1];
        if(ci===4){if(BRY.includes(RY[ri])&&a>=0&&b>=0){N[a].e.push(b);N[b].e.push(a)}}else link(a,b)}}
    for(let ci=0;ci<RX.length;ci++)for(let ri=0;ri<RY.length-1;ri++)link(nid[ri*RX.length+ci],nid[(ri+1)*RX.length+ci]);
    this.N=N;this.nid=nid;this.lzN=nid[LZ[1]*RX.length+LZ[0]];
  },
  nodeAt(x,y,r){let b=-1,bd=r||1e9;for(const n of this.N){const d=Math.hypot(n.x-x,n.y-y);if(d<bd){bd=d;b=n.i}}return b},
  dij(src){const N=this.N,d=N.map(()=>1e9),pv=N.map(()=>-1),dn=N.map(()=>0);d[src]=0;
    for(;;){let u=-1,bd=1e9;for(let i=0;i<N.length;i++)if(!dn[i]&&d[i]<bd){bd=d[i];u=i}if(u<0)break;dn[u]=1;
      for(const v of N[u].e){const w=Math.hypot(N[u].x-N[v].x,N[u].y-N[v].y);if(d[u]+w<d[v]){d[v]=d[u]+w;pv[v]=u}}}return{d,pv}},
  route(a,b){if(a===b)return[a];const{pv}=this.dij(a),p=[];for(let v=b;v!==-1;v=pv[v])p.unshift(v);return p[0]===a?p:null},
  // точки маршрута для техники: от текущей позиции (на узле или на ребре) до узла dest
  pointsTo(v,dest){
    const N=this.N;if(v.d.fly)return[[v.x,v.y],[N[dest].x,N[dest].y]];
    let start=v.node,pre=null;
    if(v.edge){const A=N[v.edge[0]],B=N[v.edge[1]],da=this.dij(A.i).d[dest]+Math.hypot(v.x-A.x,v.y-A.y),db=this.dij(B.i).d[dest]+Math.hypot(v.x-B.x,v.y-B.y);start=da<=db?A.i:B.i;pre=[v.x,v.y]}
    const r=this.route(start,dest);if(!r)return null;const pts=r.map(i=>[N[i].x,N[i].y]);if(pre)pts.unshift(pre);return pts},
  plen(p){let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return L},
  // оценка опасности маршрута: сколько толп рядом с линией пути
  risk(p){let n=0;const s=this.s;for(const h of s.h){let near=false;for(let i=1;i<p.length&&!near;i++){const A=p[i-1],B=p[i],L=Math.hypot(B[0]-A[0],B[1]-A[1])||1;
        for(let u=0;u<=L;u+=5){const x=A[0]+(B[0]-A[0])*u/L,y=A[1]+(B[1]-A[1])*u/L;if(Math.hypot(x-h.x,y-h.y)<14){near=true;break}}}if(near)n++}return n},
  // ---------------------------------------------------------------- время суток
  clock(){const s=this.s;return(6+s.t/s.dur*24)%24},
  nk(){const h=this.clock(),sun=Math.sin((h-6)/24*TAU);return clamp(.5-sun*.9,0,1)},
  log(m){const s=this.s;s.log.unshift(m);s.logN=(s.logN||0)+1;s.log.length=Math.min(4,s.log.length)},
  pop(x,y,t,c,big){this.s.fx.push({k:'txt',x,y,t:0,d:big?2.4:1.8,s:t,c:c||'#fff'})},
  // ---------------------------------------------------------------- заражённые
  spawnH(n,nodeId,tgt){const N=this.N,s=this.s;let id=nodeId;
    if(id==null||id<0){const far=N.filter(o=>o.x<150&&Math.hypot(o.x-N[this.lzN].x,o.y-N[this.lzN].y)>90);id=pick(far).i}
    const o=N[id],h={id:s.hid++,x:o.x,y:o.y,node:id,n,path:null,pi:0,f:0,st:'idle',tgt:tgt||null,ph:rnd(0,6)};s.h.push(h);
    s.fx.push({k:'ring',x:o.x,y:o.y,t:0,d:1.4,red:1});return h},
  retarget(h){
    const s=this.s,N=this.N;let tgt=null,node=-1;
    for(const v of s.v){if(v.d.apc&&v.st!=='dead'&&v.st!=='ready'&&Math.hypot(v.x-h.x,v.y-h.y)<38){tgt={k:'v',v};node=this.nodeAt(v.x,v.y);break}}
    if(!tgt){let bd=1e9;for(const g of s.g){if(g.st!=='wait'||g.people<=0)continue;let d=Math.hypot(g.x-h.x,g.y-h.y);if(s.v.some(v=>v.st==='load'&&v.tgt===g))d*=.45;if(d<bd){bd=d;tgt={k:'g',g};node=g.node}}}
    if(!tgt){h.tgt=null;node=pick(N.filter(o=>o.x<150)).i}
    h.tgt=tgt;const r=h.node===node?[node]:this.route(h.node,node);h.path=r;h.pi=0;h.f=0;h.st=r&&r.length>1?'move':(tgt?'attack':'idle')},
  // ---------------------------------------------------------------- приказы
  vById(id){return this.s.v.find(v=>v.id===id)},
  gById(id){return this.s.g[id]},
  // цель выбранной техники: группа (id) или узел (броня)
  setTarget(t){const s=this.s,v=this.vById(s.sel);if(!v||v.st==='dead')return;s.tg=t;this.ui()},
  preview(){
    const s=this.s,v=this.vById(s.sel),t=s.tg;if(!v||!t||v.st==='dead')return null;
    const dest=t.k==='g'?this.gById(t.id).node:t.id,p=this.pointsTo(v,dest);if(!p)return null;
    return{p,eta:this.plen(p)/(v.d.v*(1.05-.15*this.nk())),risk:this.risk(p),dest}},
  go(){
    const s=this.s,v=this.vById(s.sel),t=s.tg;if(!v||!t||v.st==='dead')return;
    if(v.cargo>0&&v.st!=='ready'){say('Сначала доставьте людей на аэродром',2);return}
    if(v.st==='load'||v.st==='unload'){say('Техника занята',1.6);return}
    const pr=this.preview();if(!pr){say('Нет пути',1.6);return}
    if(t.k==='g'){const g=this.gById(t.id);if(g.st!=='wait'||g.people<=0){say('Группа уже недоступна',1.8);return}if(v.d.apc){say('БТР не перевозит людей: поставьте его на перекрёсток',2.4);return}v.tgt=g}
    else{if(!v.d.apc){say('Выберите группу выживших',1.8);return}v.tgt=null}
    v.pts=pr.p;v.pi=1;v.st='go';v.dest=pr.dest;v.edge=v.edge||null;s.tg=null;beep(500,.07);vib(18);this.log(v.d.n+' выехал: '+(t.k==='g'?this.gById(t.id).nm:'позиция'));this.ui()},
  recall(){const s=this.s,v=this.vById(s.sel);if(!v||v.st==='dead'||v.st==='ready'||v.st==='unload')return;
    const p=this.pointsTo(v,this.lzN);if(!p)return;v.pts=p;v.pi=1;v.st='back';v.tgt=null;beep(420,.06);this.ui()},
  // ---------------------------------------------------------------- движение
  step(v,dt){
    if(!v.pts)return true;let rem=v.d.v*(1.05-.15*this.nk())*dt;
    while(rem>0&&v.pi<v.pts.length){const q=v.pts[v.pi],dx=q[0]-v.x,dy=q[1]-v.y,d=Math.hypot(dx,dy);
      if(d<=rem){v.x=q[0];v.y=q[1];rem-=d;v.pi++;const nd=this.N.find(o=>o.x===q[0]&&o.y===q[1]);if(nd){v.node=nd.i;v.edge=null}}
      else{v.dx=dx/d;v.dy=dy/d;v.x+=v.dx*rem;v.y+=v.dy*rem;rem=0;
        if(!v.d.fly&&v.pi<v.pts.length){const nxt=this.N.find(o=>o.x===q[0]&&o.y===q[1]);if(nxt){let prev=v.node;if(prev!==nxt.i&&this.N[prev]&&this.N[prev].e.includes(nxt.i))v.edge=[prev,nxt.i]}}}}
    return v.pi>=v.pts.length},
  hurt(v,d){const s=this.s;if(v.st==='dead'||d<=0)return;v.hp-=d;if(v.cargo>0){const loss=Math.min(v.cargo,v.cargo*d/v.d.hp);v.cargo-=loss;s.killed+=loss}
    if(v.hp<=0){v.st='dead';s.vlost++;s.killed+=v.cargo;v.cargo=0;s.shake=.5;s.fx.push({k:'boom',x:v.x,y:v.y,t:0,d:2.4,seed:(Math.random()*1000)|0});this.log(v.d.n+' уничтожен');say(v.d.n+' уничтожен!',2.4);beep(90,.4,.08,'sawtooth');vib([80,40,120]);if(s.sel===v.id)s.tg=null;this.ui()}},
  update(dt){
    const s=this.s;if(s.end||s.hold)return;s.t+=dt;s.shake=Math.max(0,s.shake-dt);const nk=this.nk();
    // новые толпы
    s.hT-=dt;if(s.hT<=0){s.hT=rnd(19,28)*(1-.3*(s.t/s.dur))/(1+.35*nk);this.spawnH(Math.round(6+s.t/28+rnd(0,3)))}
    // судьба групп: рано или поздно к ним придёт толпа
    for(const g of s.g){if(g.st!=='wait'||g.people<=0)continue;g.doom-=dt;
      if(g.doom<=0&&!g.alarm){g.alarm=1;const h=this.spawnH(8+Math.round(s.t/30),g.node,{k:'g',g});h.path=[g.node];h.st='attack';this.log('Толпа добралась до группы: '+g.nm);say('Заражённые у группы «'+g.nm+'»!',2.2)}}
    // толпы
    for(const h of s.h){
      if(h.st==='idle'||(h.st==='move'&&!h.path)){this.retarget(h);continue}
      if(h.st==='move'){const A=this.N[h.path[h.pi]],B=this.N[h.path[h.pi+1]];if(!B){h.node=h.path[h.pi];h.st=h.tgt?'attack':'idle';continue}
        const L=Math.hypot(B.x-A.x,B.y-A.y)||1;h.f+=(4.8*(1+.35*nk))*dt/L;if(h.f>=1){h.f=0;h.pi++;h.node=h.path[h.pi];if(h.pi>=h.path.length-1){h.st=h.tgt?'attack':'idle'}}
        const a=this.N[h.path[h.pi]],b=this.N[h.path[Math.min(h.pi+1,h.path.length-1)]];h.x=a.x+(b.x-a.x)*h.f;h.y=a.y+(b.y-a.y)*h.f;
        if(h.tgt&&h.tgt.k==='v'&&Math.random()<dt*.8)this.retarget(h)}
      else if(h.st==='attack'){const t=h.tgt;
        if(!t){h.st='idle';continue}
        if(t.k==='g'){const g=t.g;if(g.people<=0||g.st!=='wait'){h.st='idle';continue}const k=Math.min(g.people,h.n*.2*dt);g.people-=k;s.killed+=k;h.n+=k*.12;
          if(g.people<=.5){g.people=0;g.st='lost';s.ruins.push({x:g.x,y:g.y,t:0});this.log('Группа «'+g.nm+'» потеряна');this.pop(g.x,g.y-16,'потеряна','#ff6b5c',1);s.fx.push({k:'ring',x:g.x,y:g.y,t:0,d:1.4,red:1});beep(150,.25,.06,'sawtooth');h.st='idle'}}
        else if(t.k==='v'){const v=t.v;if(v.st==='dead'||Math.hypot(v.x-h.x,v.y-h.y)>14){h.st='idle';continue}this.hurt(v,h.n*.035*dt)}}
    }
    // техника
    for(const v of s.v){
      if(v.st==='dead'||v.st==='ready')continue;
      if(v.st==='go'||v.st==='back'){
        const fin=this.step(v,dt);
        if(fin){
          if(v.st==='go'){
            if(v.d.apc){v.st='hold';v.pts=null}
            else{const g=v.tgt;if(g&&g.st==='wait'&&g.people>0){v.st='load';v.pts=null}else{v.st='back';v.pts=this.pointsTo(v,this.lzN);v.pi=1}}}
          else{v.st='unload';v.k=0;v.pts=null;v.edge=null;v.node=this.lzN}}}
      else if(v.st==='load'){const g=v.tgt;
        if(!g||g.st!=='wait'||g.people<=0||v.cargo>=v.d.cap-.01){v.st='back';v.pts=this.pointsTo(v,this.lzN);v.pi=1;if(v.cargo<1){v.st='back'}beep(480,.06);this.ui()}
        else{const take=Math.min(v.d.ld*dt,g.people,v.d.cap-v.cargo);g.people-=take;v.cargo+=take;
          if(g.people<=.01){g.people=0;g.st='saved'}}}
      else if(v.st==='unload'){v.k+=dt;if(v.k>=1.6){const n=Math.round(v.cargo);s.saved+=n;if(n>0){this.pop(v.x,v.y-14,'+'+n,'#7dffa6',1);s.fx.push({k:'ring',x:v.x,y:v.y,t:0,d:1.2});this.log(v.d.n+' доставил '+n+' чел.');beep(740,.1);vib(24)}v.cargo=0;v.st='ready';v.pts=null;this.ui()}}
      // урон от толп
      if(v.st!=='ready'&&v.st!=='unload'&&v.st!=='dead'&&!(v.d.fly&&v.st!=='load')){
        for(const h of s.h){const d=Math.hypot(v.x-h.x,v.y-h.y);if(d<(v.d.apc?10:7)){const k=v.d.apc?(h.st==='attack'&&h.tgt&&h.tgt.v===v?0:.06):(.35+h.n/25);if(v.st==='hold'&&v.d.apc)continue;this.hurt(v,k*dt)}}}
    }
    s.h=s.h.filter(h=>h.n>.5);
    // звуки опасности
    let thr=0;for(const h of s.h)if(h.st==='attack')thr++;
    s.sirT-=dt;if(s.sirT<=0){s.sirT=rnd(7,11);if(thr)Snd.siren(clamp(.3+thr*.15,.3,1))}
    s.panT-=dt;if(s.panT<=0){s.panT=rnd(2.5,4);if(thr)Snd.panic(clamp(.2+thr*.2,.2,1))}
    for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);for(const r of s.ruins)r.t+=dt;
    // конец
    const open=s.g.some(g=>g.st==='wait'&&g.people>0),busy=s.v.some(v=>v.cargo>0&&v.st!=='dead');
    if(s.t>=s.dur||(!open&&!busy&&s.t>20)||s.v.every(v=>v.st==='dead'||v.d.apc)){this.finish();return}
    if(!s.warn&&s.dur-s.t<20){s.warn=1;say('20 секунд до конца: везите людей на аэродром!',3)}
    s.hudT-=dt;if(s.hudT<=0){s.hudT=.25;this.hudUpd();this.ui(1)}
  },
  coachUpdate(dt){const s=this.s;if(s.end)return;dt*=2.2;for(const v of s.v){if(v.st==='go'||v.st==='back'){if(this.step(v,dt)){if(v.st==='go'){if(v.d.apc){v.st='hold';v.pts=null}else if(v.tgt){v.st='load'}}else{v.st='unload';v.k=0;v.pts=null;v.edge=null;v.node=this.lzN}}}
      else if(v.st==='load'){const g=v.tgt;if(!g||g.people<=0||v.cargo>=v.d.cap-.01){v.st='back';v.pts=this.pointsTo(v,this.lzN);v.pi=1}else{const take=Math.min(v.d.ld*dt,g.people,v.d.cap-v.cargo);g.people-=take;v.cargo+=take;if(g.people<=.01){g.people=0;g.st='saved'}}}
      else if(v.st==='unload'){v.k+=dt;if(v.k>=1.6){s.saved+=Math.round(v.cargo);v.cargo=0;v.st='ready';v.pts=null}}}
    for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);s.hudT-=dt;if(s.hudT<=0){s.hudT=.25;this.hudUpd();this.ui(1)}},
  coach(){const s=this.s,gB=s.g[5];s.sel='bus1';this.ui();
    const around=g=>()=>({x0:g.x-14,y0:g.y-16,x1:g.x+14,y1:g.y+10});
    Coach.run('s3',[
      {t:'Это парк техники. Автобус уже выбран. Теперь нажмите на группу выживших на карте — «Больница».',rc:around(gB),wait:()=>s.tg&&s.tg.k==='g'},
      {t:'Панель показывает время в пути и опасность маршрута. Нажмите «Отправить».',el:'#panel [data-a=m_go]',wait:()=>s.v[0].st!=='ready'},
      {t:'Автобус едет по улицам, грузит людей и сам везёт их на аэродром. Дождитесь загрузки.',pt:()=>({x:s.v[0].x,y:s.v[0].y-6,r:16}),wait:()=>s.v[0].st==='load'||s.v[0].st==='back'||s.saved>0},
      {t:'Красные — заражённые толпы. Они идут к выжившим и убивают технику. Броня (БТР) может их отвлечь: выберите БТР и поставьте на перекрёсток.',btn:'Понятно ▶'},
      {t:'Цель: вывезти как можно больше людей до конца времени. Можно ставить паузу планирования — приказы работают и на паузе.',btn:'Начать ▶'}
    ],()=>{this.ui();say('Эвакуация началась!',2)})},
  finish(){const s=this.s;if(s.end)return;s.end=true;
    const tot=s.total,sv=Math.round(s.saved),kl=Math.round(s.killed);G.saved+=sv;G.s3=sv;G.s3k=kl;G.s3v=s.vlost;G.s3t=tot;G.bridges=0;
    G.support=Math.round(clamp(35+60*sv/tot-25*kl/tot,10,95));G.epiInf=clamp(.3+.6*(1-sv/tot),.3,.95);G.cityInf=clamp(.15+.5*(1-sv/tot),.15,.7);G.contain3=sv>=.55*tot;
    setTimeout(()=>Flow.afterMil(),400)},
  hudUpd(){const s=this.s;hud(`<b>03 ЭВАКУАЦИЯ</b><span class="g">спасено ${Math.round(s.saved)}/${s.total}</span><span class="r">погибло ${Math.round(s.killed)}</span><span class="ob">${this.nk()>.55?'☾':'☀'} ${String(Math.floor(this.clock())).padStart(2,'0')}:${String(Math.floor(this.clock()%1*60)).padStart(2,'0')}</span><span>${mmss(s.dur-s.t)}</span>`)},
  // ---------------------------------------------------------------- управление
  tap(x,y){
    const s=this.s;if(x>MW||s.end)return;x-=OX;
    let bg=null,bd=17;for(const g of s.g){if(g.st!=='wait'||g.people<=0)continue;const d=Math.hypot(g.x-x,g.y-4-y);if(d<bd){bd=d;bg=g}}
    if(bg){const v=this.vById(s.sel);if(v&&v.d.apc){this.setTarget({k:'n',id:bg.node})}else this.setTarget({k:'g',id:bg.id});beep(620,.04);vib(12);return}
    let bv=null;bd=9;for(const v of s.v){if(v.st==='dead')continue;const d=Math.hypot(v.x-x,v.y-y);if(d<bd){bd=d;bv=v}}
    if(bv){s.sel=bv.id;s.tg=null;this.ui();beep(560,.04);return}
    const v=this.vById(s.sel);if(v&&v.d.apc){const n=this.nodeAt(x,y,14);if(n>=0){this.setTarget({k:'n',id:n});beep(620,.04);vib(12)}}
  },
  act(a,d){
    const s=this.s;if(s.end)return;
    if(a==='sel'){s.sel=d;s.tg=null;beep(560,.04)}
    else if(a==='go')this.go();
    else if(a==='cancel'){s.tg=null}
    else if(a==='recall')this.recall();
    else if(a==='hold'){s.hold=!s.hold;beep(s.hold?300:600,.06)}
    this.ui();
  },
  ui(soft){
    const s=this.s,v=this.vById(s.sel),pr=this.preview();
    const sig=JSON.stringify([s.sel,s.tg,s.hold,s.v.map(q=>[q.st,Math.round(q.cargo/4),Math.round(q.hp*2),q.tgt&&q.tgt.id]),pr&&[Math.round(pr.eta),pr.risk],s.log.join()]);
    if(soft&&sig===this.uiSig)return;this.uiSig=sig;
    const stT=q=>({ready:'готов · '+(q.d.cap?q.d.cap+' мест':'прикрытие'),go:q.d.apc?'едет на позицию':'едет к «'+(q.tgt?q.tgt.nm:'')+'»',load:'грузит '+Math.round(q.cargo)+'/'+q.d.cap,back:'везёт '+Math.round(q.cargo),unload:'выгрузка',hold:'держит позицию',dead:'уничтожен'}[q.st]);
    let h=`<div class="ph"><b>ПАРК ТЕХНИКИ</b><button class="pb ${s.hold?'warn':''}" data-a="m_hold" style="width:auto;margin:0!important;padding:.3rem .7rem!important"><span class="tx">${s.hold?'▶ Идёт пауза':'❚❚ Пауза'}</span></button></div>`;
    {const st2=q=>({ready:'готов',go:q.d.apc?'в пути':'едет',load:'грузит '+Math.round(q.cargo),back:'везёт '+Math.round(q.cargo),unload:'выгрузка',hold:'на позиции',dead:'потерян'}[q.st]);
      for(let i=0;i<s.v.length;i+=2)h+=`<div class="r2" style="gap:.25rem">`+[s.v[i],s.v[i+1]].filter(Boolean).map(q=>`<button class="pb ${q.id===s.sel?'glow':''}" data-a="m_sel" data-d="${q.id}" data-key="v${q.id}" ${q.st==='dead'?'disabled':''} style="padding:.25rem .35rem!important;gap:.3rem!important;margin:.1rem 0!important"><span class="bd" style="--c:${q.st==='dead'?'#6a3a3a':q.d.apc?'#6fc48a':'#ffd067'};width:1.5rem;height:1.5rem;font-size:.95rem">${q.d.ic}</span><span class="tx" style="font-size:1rem">${q.d.n}<small style="font-size:.8rem">${st2(q)}</small></span></button>`).join('')+`</div>`}
    if(v){h+=`<div class="m" style="margin:.2rem 0 .1rem;font-size:1rem">${v.d.n}: ${v.d.d}${v.hp<v.d.hp&&v.st!=='dead'?' · прочность '+Math.max(0,Math.ceil(v.hp))+'/'+v.d.hp:''}</div>`}
    if(v&&v.st!=='dead'){
      if(s.tg&&pr){const nm=s.tg.k==='g'?this.gById(s.tg.id).nm:'позиция',ppl=s.tg.k==='g'?Math.round(this.gById(s.tg.id).people):0,rk=pr.risk,rc=rk===0?'#7dffa6':rk===1?'#ffd067':'#ff6b5c',rt=rk===0?'путь свободен':rk===1?'рядом толпа':'опасно: толпы на пути';
        h+=`<div class="callc" data-key="tg${s.sel}${s.tg.id}"><div class="ad">→ ${nm}${ppl?' · '+ppl+' чел':''}</div><div class="tt">в пути ≈ ${Math.round(pr.eta)} с · <span style="color:${rc}">${rt}</span>${v.d.cap&&ppl?` · заберёт ${Math.min(v.d.cap,ppl)}`:''}</div></div><div class="r2"><button class="pb glow" data-a="m_go"><span class="tx">Отправить</span></button><button class="pb" data-a="m_cancel" style="flex:0 0 4.4rem"><span class="tx">✕</span></button></div>`}
      else if(v.st==='ready')h+=`<div class="m" style="margin:.3rem 0">${v.d.apc?'Нажмите на перекрёсток: БТР встанет там и отвлечёт заражённых.':'Нажмите на группу выживших на карте.'}</div>`;
      else if(v.st!=='unload')h+=`<div class="r2"><button class="pb" data-a="m_recall"><span class="tx">Вернуть на базу</span></button></div>`}
    h+=`<div class="log">${s.log.slice(0,2).map((x,i)=>`<div data-key="L${(s.logN||0)-i}">${x}</div>`).join('')}</div>`;panel(h);
  },
  // ---------------------------------------------------------------- рисование
  draw(){
    const s=this.s,tm=performance.now()/1000,now=performance.now(),dt=Math.min(.1,(now-this.lt)/1000);this.lt=now;
    cx.fillStyle='#070c11';cx.fillRect(0,0,W,H);
    cx.save();if(s.shake>0)cx.translate((Math.random()*5-2.5)|0,(Math.random()*5-2.5)|0);
    cx.save();cx.translate(OX,0);cx.beginPath();cx.rect(-OX,0,MW,H);cx.clip();
    Maps.blit(cx,this.map,this.strip);
    if(this.strip)for(const L of this.strip.lamps){const fl=.7+.3*Math.sin(tm*1.3+L.x*.7+L.y);Post.glow(L.x,L.y+1,13,'255,214,140',.1*fl)}
    const wt=this.map.water;cx.fillStyle='rgba(190,235,250,.5)';
    for(let i=0;i<70;i++){const y=22+((i*53+tm*(5+(i%4)*1.5))%(H-22)),x=(i*37+Math.sin(tm*.4+i)*2)%330;if(wt(x,y)&&Math.sin(tm*1.7+i)>-.1)cx.fillRect(x|0,y|0,2+(i%3),1)}
    for(const L of this.map.lamps){const fl=.7+.3*Math.sin(tm*1.3+L.x*.7+L.y);Post.glow(L.x,L.y+1,13,'255,214,140',.1*fl)}
    for(const L of this.map.lights){
      if(L.k==='r'){if((Math.floor(tm*9)+L.i)%12<2){cx.fillStyle='#fff6c0';cx.fillRect(L.x,L.y,1,1);Post.glow(L.x,L.y,5,'255,240,170',.4)}else{cx.fillStyle='rgba(255,226,140,.5)';cx.fillRect(L.x,L.y,1,1)}}
      else if(L.k==='b'){if(Math.floor(tm*1.5+L.x)%2){cx.fillStyle=L.c;cx.fillRect(L.x,L.y,2,2);Post.glow(L.x,L.y,6,L.c==='#e0453a'?'255,60,50':'76,201,192',.4)}}
      else if(Math.floor(tm*1.2+L.x)%2===0){cx.fillStyle='#ff4a3d';cx.fillRect(L.x,L.y,1,1);Post.glow(L.x,L.y,5,'255,60,50',.35)}}
    {const a=tm*2.2,bx=313,by=120;cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<4;k++){cx.strokeStyle='rgba(120,240,230,'+(.2-k*.04)+')';cx.beginPath();cx.moveTo(bx,by);cx.lineTo(bx+Math.cos(a-k*.07)*46,by+Math.sin(a-k*.07)*30);cx.stroke()}cx.restore()}
    for(const y of BRY)Maps.dimg(cx,this.br,170-23-4,Math.round(y-4)-6);
    // точка эвакуации
    {const lz=this.N[this.lzN],p=.5+.5*Math.sin(tm*3);cx.save();cx.strokeStyle='rgba(125,255,166,'+(.5+.3*p).toFixed(2)+')';cx.lineWidth=1.4;cx.beginPath();cx.ellipse(lz.x,lz.y,13+p*2,6+p,0,0,TAU);cx.stroke();cx.setLineDash([3,3]);cx.lineDashOffset=-tm*10;cx.beginPath();cx.ellipse(lz.x,lz.y,19,9,0,0,TAU);cx.stroke();cx.restore();Post.glow(lz.x,lz.y,24,'125,255,166',.12+.06*p);otx('ЭВАКУАЦИЯ',lz.x,lz.y+18,'#7dffa6',9,'center',.9)}
    // сгоревшие места
    for(const r of s.ruins){if(r.t<45){Art3.flame(r.x,r.y,.8,tm,Math.floor(r.x));if(Math.random()<dt*.6&&r.t<30)s.smoke.push({x:r.x+rnd(-2,2),y:r.y-6,v:rnd(8,14),l:0,m:rnd(2.5,4)})}else{cx.fillStyle='rgba(10,6,6,.35)';cx.beginPath();cx.ellipse(r.x,r.y,9,5,0,0,TAU);cx.fill()}}
    // предпросмотр маршрута
    {const pr=this.preview();if(pr){const rk=pr.risk,col=rk===0?'125,255,166':rk===1?'255,208,103':'255,107,92';cx.save();cx.setLineDash([3,3]);cx.lineDashOffset=-tm*14;cx.strokeStyle='rgba('+col+',.85)';cx.lineWidth=1.3;cx.beginPath();pr.p.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.stroke();cx.restore()}}
    for(const v of s.v)if(v.pts&&(v.st==='go'||v.st==='back')){cx.save();cx.setLineDash([2,4]);cx.lineDashOffset=-tm*12;cx.strokeStyle=v.st==='back'?'rgba(125,255,166,.35)':'rgba(255,255,255,.3)';cx.lineWidth=.9;cx.beginPath();cx.moveTo(v.x,v.y);for(let i=v.pi;i<v.pts.length;i++)cx.lineTo(v.pts[i][0],v.pts[i][1]);cx.stroke();cx.restore()}
    // спрайты с сортировкой по глубине
    const zs=[];
    for(const g of s.g){if(g.st==='lost')continue;const nv=g.st==='saved'?0:Math.min(14,Math.ceil(g.people/6)),thr=g.alarm||g.doom<20;
      for(let k=0;k<nv;k++){const a=k*2.4+g.id,r=3+((k*7)%5)*1.2,x=g.x+Math.cos(a)*r*1.4,y=g.y+Math.sin(a)*r*.8;zs.push([y,()=>Art3.person(x,y,g.id*31+k,tm,{run:thr,panic:thr&&k%2===0})])}}
    for(const h of s.h){const nz=Math.min(18,Math.ceil(h.n/1.6));Post.glow(h.x,h.y,16+h.n*.3,'255,50,40',.16+.06*Math.sin(tm*4+h.ph));cx.strokeStyle='rgba(255,70,55,'+(.55+.2*Math.sin(tm*5+h.ph)).toFixed(2)+')';cx.lineWidth=1;cx.beginPath();cx.ellipse(h.x,h.y+1,8+h.n*.22,4+h.n*.12,0,0,TAU);cx.stroke();otx('☣'+Math.round(h.n),h.x,h.y-11-Math.min(6,h.n*.2),'#ff8d82',8,'center');
      for(let k=0;k<nz;k++){const a=k*2.4+h.ph,r=1.5+((k*5)%6)*1.1,x=h.x+Math.cos(a+tm*.15*(k%2?1:-1))*r*1.5,y=h.y+Math.sin(a+tm*.15*(k%2?1:-1))*r*.9;zs.push([y,()=>Art3.zombie(x,y,h.id*17+k,tm,h.st==='move')])}}
    zs.sort((a,b)=>a[0]-b[0]);for(const z of zs)z[1]();
    // техника
    for(const v of s.v){if(v.st==='dead'||v.st==='ready'&&false)continue;const nk=this.nk(),x=v.x,y=v.y;
      if(v.st==='ready'){const i=s.v.indexOf(v),px=this.N[this.lzN].x-24+(i%4)*8,py=this.N[this.lzN].y+8+Math.floor(i/4)*6;v.x=px;v.y=py}
      if(v.d.fly)Art3.heli(v.x,v.y-(v.st==='load'||v.st==='ready'||v.st==='unload'?2:8),tm,nk);
      else if(v.t==='bus')Art3.bus(v.x,v.y,v.dx,v.dy,v.cargo,tm,nk);
      else if(v.t==='truck')Art3.truck(v.x,v.y,v.dx,v.dy,v.cargo,tm,nk);
      else if(v.t==='jeep')Art3.car(v.x,v.y,v.dx,v.dy,{k:'civ',col:'#6b7a5a'});
      else Art3.car(v.x,v.y,v.dx,v.dy,{k:'spec'});
      if(v.id===s.sel){cx.strokeStyle='#fff';cx.lineWidth=1;const b=9;for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){cx.beginPath();cx.moveTo(v.x+sx*b,v.y+sy*(b-3));cx.lineTo(v.x+sx*b,v.y+sy*b);cx.lineTo(v.x+sx*(b-3),v.y+sy*b);cx.stroke()}}
      if(v.hp<v.d.hp){cx.fillStyle='#0b1720';cx.fillRect(v.x-6,v.y-12,12,2);cx.fillStyle=v.hp/v.d.hp>.5?'#7dffa6':'#ff5b4d';cx.fillRect(v.x-6,v.y-12,12*clamp(v.hp/v.d.hp,0,1),2)}
      if(v.cargo>0.5&&v.st!=='ready')otx(String(Math.round(v.cargo)),v.x,v.y-14,'#ffd067',9,'center')}
    // метки групп
    for(const g of s.g){if(g.st==='lost'||g.st==='saved')continue;const tgt=s.tg&&s.tg.k==='g'&&s.tg.id===g.id,pr=clamp(g.doom/g.doom0,0,1),gx=g.x,gy=g.y-15,col=pr>.4?'#4cc9c0':pr>.2?'#ffd067':'#ff5b4d';
      cx.fillStyle='rgba(6,14,22,.9)';cx.fillRect(gx-14,gy-6,28,12);cx.strokeStyle=tgt?'#fff':col;cx.lineWidth=tgt?1.5:1;cx.strokeRect(gx-13.5,gy-5.5,27,11);
      txt(g.nm,gx,gy-1,'#9fb3c0',6,'center');txt(String(Math.round(g.people)),gx,gy+4.5,'#ffd067',7.5,'center');
      cx.fillStyle='#0b1720';cx.fillRect(gx-13,gy+6,26,1.4);cx.fillStyle=col;cx.fillRect(gx-13,gy+6,26*pr,1.4);
      if(tgt){cx.save();cx.setLineDash([2,2]);cx.lineDashOffset=-tm*8;cx.strokeStyle='rgba(255,255,255,.8)';cx.beginPath();cx.ellipse(g.x,g.y+1,13,6,0,0,TAU);cx.stroke();cx.restore()}}
    // цель-позиция для брони
    if(s.tg&&s.tg.k==='n'){const n=this.N[s.tg.id];cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=1.2;cx.beginPath();cx.arc(n.x,n.y,7+Math.sin(tm*5),0,TAU);cx.stroke()}
    // дым
    for(const q of s.smoke){q.y-=q.v*dt;q.x+=Math.sin(q.l*2+q.y*.1)*.12;q.l+=dt}s.smoke=s.smoke.filter(q=>q.l<q.m);
    for(const q of s.smoke){const a=Math.sin(q.l/q.m*3.14)*.34,r=2+q.l*2.6,g=cx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);g.addColorStop(0,'rgba(46,36,40,'+a.toFixed(3)+')');g.addColorStop(1,'rgba(46,36,40,0)');cx.fillStyle=g;cx.fillRect(q.x-r,q.y-r,r*2,r*2)}
    for(const f of s.fx){const u=f.t/f.d;
      if(f.k==='txt')otx(f.s,f.x,f.y-u*14,f.c,11,'center',clamp(1.7-u*1.7,0,1)*clamp(u*9,0,1));
      else if(f.k==='boom')Art3.boom(f.x,f.y,Math.min(.99,u),f.seed);
      else if(f.k==='ring')Art3.ring(f.x,f.y,u,f.red)}
    cx.restore();
    {const nk=this.nk();if(nk<.5){cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(120,150,190,'+((.5-nk)*.4).toFixed(3)+')';cx.fillRect(0,0,MW,H);cx.restore()}
      if(nk>.3){cx.fillStyle='rgba(6,12,40,'+((nk-.3)*.4).toFixed(3)+')';cx.fillRect(0,0,MW,H)}}
    Post.vig(.75);
    if(s.hold)otx('ПАУЗА ПЛАНИРОВАНИЯ',MW/2,36,'#ffd067',11,'center');
    cx.strokeStyle='#3a8f8a';cx.lineWidth=1;for(const[x,y,dx,dy]of[[2,24,1,1],[MW-3,24,-1,1],[2,H-3,1,-1],[MW-3,H-3,-1,-1]]){cx.beginPath();cx.moveTo(x,y+dy*10);cx.lineTo(x,y);cx.lineTo(x+dx*10,y);cx.stroke()}
    cx.restore();
  }
};
ACT.m_sel=d=>Mil.act('sel',d);ACT.m_go=()=>Mil.act('go');ACT.m_cancel=()=>Mil.act('cancel');ACT.m_recall=()=>Mil.act('recall');ACT.m_hold=()=>Mil.act('hold');
