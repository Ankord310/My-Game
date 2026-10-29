'use strict';
// Этап 3 «Эвакуация» (в духе Atom Zombie Smasher). Сотни жителей бродят по улицам и собираются в скопления.
// Вы отправляете технику в точку города: люди, увидев её, бегут к машине и садятся; потом машина везёт их на аэродром.
// Заражённые рождаются в очагах, идут к людям и технике, заражают на ходу. Мосты можно взорвать: толпе труднее, но и вывозить тяжелее.
const RX=[12,40,78,116,142,198,228,268,300,326],RY=[44,80,116,152,188,224,252],BRY=[80,152,224],LZ=[7,3],BR_NM=['Мост-1','Мост-2','Мост-3'];
const VT={
  bus:{n:'Автобус',cap:50,v:20,hp:4,ic:'🚌',d:'быстрый, 50 мест'},
  truck:{n:'Грузовик',cap:100,v:13,hp:6,ic:'🚚',d:'медленный, 100 мест'},
  jeep:{n:'Джип',cap:12,v:30,hp:2,ic:'🚙',d:'очень быстрый, 12 мест'},
  heli:{n:'Вертолёт',cap:30,v:34,hp:3,ic:'✈',d:'садится где угодно, 30 мест',fly:1},
  apc:{n:'БТР',cap:0,v:18,hp:10,ic:'⛨',d:'приманка для заражённых',apc:1}
};
const FL=[['bus1','bus'],['bus2','bus'],['trk','truck'],['jeep1','jeep'],['jeep2','jeep'],['heli','heli'],['apc1','apc'],['apc2','apc']];
// убежища: колонка и ряд перекрёстка, сколько людей стартует рядом, название
const SHL=[[0,1,60,'Дом'],[1,0,45,'Школа'],[2,0,90,'Рынок'],[3,1,70,'Офисы'],[1,2,50,'Детсад'],[3,2,120,'Больница'],[0,3,55,'Общага'],[2,3,100,'Стадион'],[4,3,40,'Вокзал'],
  [1,4,65,'Склады'],[3,4,80,'ТЦ'],[2,5,75,'Завод'],[0,6,40,'Гаражи'],[5,0,35,'Парк'],[8,5,45,'Посёлок'],[0,0,45,'Бараки'],[4,1,60,'Клиника'],[1,3,70,'Мэрия'],[3,5,90,'Депо'],[6,1,40,'Отель'],[7,5,50,'Склад']];
const CELL=14;
const Mil={
  tut:'s3',tutAuto:false,rs:2,map:null,br:null,lt:0,
  enter(){
    Snd.play('mil');
    if(!this.map){this.map=Maps.city3(RS);this.br=Maps.bridge(46,8,RS)}
    this.mkStrip();this.N=null;this.mkGraph();
    const N=this.N,lz=N[this.lzN],s=this.s={t:0,dur:240,hold:false,civ:[],zom:[],v:FL.map(([id,t])=>({id,t,d:VT[t],x:lz.x,y:lz.y,node:lz.i,st:'ready',hp:VT[t].hp,cargo:0,pts:null,pi:0,dx:1,dy:0,spd:0,tgt:null,cnode:-1,wt:0,k:0,sk:0})),
      saved:0,killed:0,vlost:0,bridges:0,dead:[false,false,false],sel:'bus1',tg:null,bsel:null,aid:1,fx:[],ruins:[],log:[],end:false,hudT:0,uiSig:'',shake:0,smoke:[],wT:16,sirT:4,panT:2,cntT:0,total:0};
    this.shelters=SHL.map((a,i)=>({i,node:this.nid[a[1]*RX.length+a[0]],nm:a[3],n:a[2],cnt:0}));
    for(const sh of this.shelters){const k=Math.round(sh.n/2.2);for(let i=0;i<k;i++)this.addCiv(sh.node)}
    s.total=s.civ.length;
    {const ep=this.nid[3*RX.length+3];for(let i=0;i<3;i++)this.addZom(ep,false);this.s.fx.push({k:'ring',x:this.N[ep].x,y:this.N[ep].y,t:0,d:1.8,red:1});this.log('Первый очаг заражения в центре города')}
    this.zg=this.grid(s.zom);this.cg=this.grid(s.civ);
    ctrl(false);this.ui();this.hudUpd();this.lt=performance.now();
    if(Coach.need('s3'))this.coach();else say('Отправьте технику в точку города — люди сами побегут к ней.',4.5);
  },
  exit(){},
  mkStrip(){const ex=Math.max(0,OX);this.exW=ex;this.strip=ex>2?Maps.cityStrip('c3',ex,RS):null},
  resize(){if(this.s&&this.exW!==Math.max(0,OX))this.mkStrip()},
  // ---------------------------------------------------------------- дорожный граф и таблицы кратчайших путей
  mkGraph(){
    if(this.N)return;const M=this.map,N=[],nid={},wat=(x,y)=>M.water(x,y);
    RY.forEach((y,ri)=>RX.forEach((x,ci)=>{if(wat(x,y)){nid[ri*RX.length+ci]=-1;return}nid[ri*RX.length+ci]=N.length;N.push({i:N.length,x,y,e:[],ci,ri,cnt:0})}));
    const clear=(A,B)=>{for(let k=1;k<9;k++){const u=k/9;if(wat(A.x+(B.x-A.x)*u,A.y+(B.y-A.y)*u))return false}return true};
    const link=(a,b)=>{if(a<0||b<0)return;const A=N[a],B=N[b];if(clear(A,B)){A.e.push(b);B.e.push(a)}};
    for(let ri=0;ri<RY.length;ri++)for(let ci=0;ci<RX.length-1;ci++){const a=nid[ri*RX.length+ci],b=nid[ri*RX.length+ci+1];
      if(ci===4){if(BRY.includes(RY[ri])&&a>=0&&b>=0){N[a].e.push(b);N[b].e.push(a)}}else link(a,b)}
    for(let ci=0;ci<RX.length;ci++)for(let ri=0;ri<RY.length-1;ri++)link(nid[ri*RX.length+ci],nid[(ri+1)*RX.length+ci]);
    this.N=N;this.nid=nid;this.lzN=nid[LZ[1]*RX.length+LZ[0]];this.mkTables();
  },
  mkTables(){
    const N=this.N,n=N.length,D=new Float32Array(n*n).fill(1e9),NH=new Int16Array(n*n).fill(-1);
    for(let j=0;j<n;j++){const d=new Float32Array(n).fill(1e9),pv=new Int16Array(n).fill(-1),dn=new Uint8Array(n);d[j]=0;
      for(;;){let u=-1,bd=1e9;for(let i=0;i<n;i++)if(!dn[i]&&d[i]<bd){bd=d[i];u=i}if(u<0)break;dn[u]=1;
        for(const v of N[u].e){const w=Math.hypot(N[u].x-N[v].x,N[u].y-N[v].y);if(d[u]+w<d[v]){d[v]=d[u]+w;pv[v]=u}}}
      for(let i=0;i<n;i++){D[i*n+j]=d[i];NH[i*n+j]=pv[i]}}
    this.D=D;this.NH=NH;this.NN=n},
  nodeAt(x,y,r){let b=-1,bd=r||1e9;for(const n of this.N){const d=Math.hypot(n.x-x,n.y-y);if(d<bd){bd=d;b=n.i}}return b},
  route(a,b){if(a===b)return[a];const NN=this.NN,p=[a];let c=a,g=0;while(c!==b&&g++<80){c=this.NH[c*NN+b];if(c<0)return null;p.push(c)}return p},
  pointsTo(v,dest){
    const N=this.N,NN=this.NN;if(v.d.fly)return[[v.x,v.y],[this.tx(dest),this.ty(dest)]];
    let start=v.node,pre=null;
    if(v.edge&&N[v.edge[0]]&&N[v.edge[1]]){const A=N[v.edge[0]],B=N[v.edge[1]],da=this.D[A.i*NN+dest]+Math.hypot(v.x-A.x,v.y-A.y),db=this.D[B.i*NN+dest]+Math.hypot(v.x-B.x,v.y-B.y);start=da<=db?A.i:B.i;pre=[v.x,v.y]}
    const r=this.route(start,dest);if(!r)return null;const pts=r.map(i=>[N[i].x,N[i].y]);if(pre)pts.unshift(pre);return pts},
  tx(d){return typeof d==='number'?this.N[d].x:d.x},ty(d){return typeof d==='number'?this.N[d].y:d.y},
  plen(p){let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return L},
  // ---------------------------------------------------------------- агенты
  edgeSet(g,a,b,u){g.a=a;g.b=b;g.u=u;const A=this.N[a],B=this.N[b];g.L=Math.hypot(B.x-A.x,B.y-A.y)||1},
  place(g){const N=this.N,A=N[g.a],B=N[g.b],dx=B.x-A.x,dy=B.y-A.y,ux=dx/g.L,uy=dy/g.L;g.x=A.x+dx*g.u-uy*g.off;g.y=A.y+dy*g.u+ux*g.off;g.dx=ux;g.dy=uy},
  roadW(a,b){const A=this.N[a],B=this.N[b];return A.y===B.y?([80,152,224].includes(A.y)?8:5):([78,268].includes(A.x)?8:5)},
  mkAgent(node,id){const nb=pick(this.N[node].e),g={id,x:0,y:0,a:node,b:nb,u:Math.random()*.8,L:1,off:rnd(-1,1)*(this.roadW(node,nb)/2-1.4),spd:0,goal:-1,st:'walk',sw:0,t:rnd(0,.5),dx:1,dy:0,prev:-1,fl:0};
    this.edgeSet(g,node,nb,g.u);this.place(g);return g},
  addCiv(node){const s=this.s,g=this.mkAgent(node,s.aid++);g.spd=rnd(1.5,2.2);g.k='c';g.tv=null;if(Math.random()<.4){g.st='stand';g.sw=rnd(0,3);g.x=this.N[node].x+rnd(-5,5);g.y=this.N[node].y+rnd(-5,5)}s.civ.push(g);return g},
  addZom(node,rise,x,y){const s=this.s,g=this.mkAgent(node,s.aid++);g.spd=rnd(1.2,1.5);g.k='z';g.st=rise?'rise':'walk';g.sw=rise?1.2:0;g.dir=null;if(x!=null){g.x=x;g.y=y;g.snap=1}s.zom.push(g);return g},
  // пространственная сетка
  grid(list){const cols=Math.ceil(340/CELL),rows=Math.ceil(280/CELL),G=new Array(cols*rows);for(const g of list){const c=clamp(Math.floor(g.x/CELL),0,cols-1)+clamp(Math.floor(g.y/CELL),0,rows-1)*cols;(G[c]||(G[c]=[])).push(g)}G.cols=cols;G.rows=rows;return G},
  near(G,x,y,r,fn){const cx0=clamp(Math.floor((x-r)/CELL),0,G.cols-1),cx1=clamp(Math.floor((x+r)/CELL),0,G.cols-1),cy0=clamp(Math.floor((y-r)/CELL),0,G.rows-1),cy1=clamp(Math.floor((y+r)/CELL),0,G.rows-1);
    for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const c=G[cx+cy*G.cols];if(c)for(const g of c){if(Math.abs(g.x-x)<=r&&Math.abs(g.y-y)<=r&&fn(g))return g}}return null},
  nearest(G,x,y,r){let b=null,bd=r*r;const cx0=clamp(Math.floor((x-r)/CELL),0,G.cols-1),cx1=clamp(Math.floor((x+r)/CELL),0,G.cols-1),cy0=clamp(Math.floor((y-r)/CELL),0,G.rows-1),cy1=clamp(Math.floor((y+r)/CELL),0,G.rows-1);
    for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const c=G[cx+cy*G.cols];if(c)for(const g of c){if(g.dead||g.boarded)continue;const d=(g.x-x)*(g.x-x)+(g.y-y)*(g.y-y);if(d<bd){bd=d;b=g}}}return b},
  crowd(x,y,r){let c=0;this.near(this.cg,x,y,r,g=>{if(!g.dead&&!g.boarded)c++;return false});return c},
  // выбор следующего ребра на узле
  nextEdge(g,n){
    const NN=this.NN,E=this.N[n].e;let b=-1;
    if(g.fl>0&&g.fx!=null){let bd=-1;for(const c of E){const d=Math.hypot(this.N[c].x-g.fx,this.N[c].y-g.fy)+(c===g.prev?-6:0)+Math.random()*3;if(d>bd){bd=d;b=c}}}
    else if(g.goal>=0&&g.goal!==n){b=this.NH[n*NN+g.goal]}
    if(b<0){const o=E.filter(c=>c!==g.prev);b=(o.length&&Math.random()<.92?pick(o):pick(E))}
    g.prev=n;this.edgeSet(g,n,b,0);const w=this.roadW(n,b)/2-1.4;g.off=clamp(g.off,-w,w)},
  snap(g){const n=this.nodeAt(g.x,g.y);g.dir=null;g.snap=0;g.prev=-1;const nb=pick(this.N[n].e);this.edgeSet(g,n,nb,0);g.st='walk';g.goal=-1;this.place(g)},
  move(g,dt){
    if(g.dir){const d=g.dir,dx=d.x-g.x,dy=d.y-g.y,L=Math.hypot(dx,dy),st=g.spd*dt;if(L<=st+.01){g.x=d.x;g.y=d.y}else{g.x+=dx/L*st;g.y+=dy/L*st}return}
    if(g.snap)this.snap(g);
    if(g.st==='stand'){g.sw-=dt;if(g.sw<=0){g.st='walk';if(g.goal<0&&g.k==='c'&&Math.random()<.5)this.nextGoal(g);this.place(g)}return}
    g.u+=g.spd*dt/g.L;
    if(g.u>=1){const n=g.b;
      if(g.goal===n&&g.k==='c'){g.st='stand';g.sw=rnd(2,6);g.goal=-1;g.x=this.N[n].x+rnd(-5,5);g.y=this.N[n].y+rnd(-5,5);g.prev=-1;const nb=pick(this.N[n].e);this.edgeSet(g,n,nb,0);return}
      this.nextEdge(g,n)}
    this.place(g)},
  // куда пойдёт гражданский: чаще в соседнее убежище
  nextGoal(g){const sh=pick(this.shelters);g.goal=this.D[g.b*this.NN+sh.node]<150?sh.node:-1},
  // ---------------------------------------------------------------- приказы
  vById(id){return this.s.v.find(v=>v.id===id)},
  setTarget(t){const s=this.s,v=this.vById(s.sel);if(!v||v.st==='dead')return;s.tg=t;s.bsel=null;this.ui()},
  preview(){
    const s=this.s,v=this.vById(s.sel),t=s.tg;if(!v||!t||v.st==='dead')return null;
    const dest=v.d.fly?{x:t.x,y:t.y}:t.id,p=this.pointsTo(v,dest);if(!p)return null;
    const zg=this.zg||this.grid(s.zom),seen=new Set();for(let i=1;i<p.length;i++){const A=p[i-1],B=p[i],L=Math.hypot(B[0]-A[0],B[1]-A[1])||1;for(let u=0;u<=L;u+=7){const x=A[0]+(B[0]-A[0])*u/L,y=A[1]+(B[1]-A[1])*u/L;this.near(zg,x,y,10,g=>{seen.add(g.id);return false})}}
    const n=seen.size;let spot=0;const e=p[p.length-1];this.near(zg,e[0],e[1],34,()=>{spot++;return false});
    return{p,eta:this.plen(p)/(v.d.v*(1.05-.15*this.nk())),risk:n>=5?2:n>=1?1:0,spot:spot>=8?2:spot>=2?1:0,dest,zn:n}},
  go(){
    const s=this.s,v=this.vById(s.sel),t=s.tg;if(!v||!t||v.st==='dead')return;
    if(v.st==='unload'||(v.cargo>0&&v.st!=='ready'&&v.st!=='wait')){say('Сначала довезите людей на аэродром',2);return}
    const pr=this.preview();if(!pr){say('Нет пути',1.6);return}
    v.pts=pr.p;v.pi=1;v.st='go';v.dest=pr.dest;v.cnode=v.d.fly?this.nodeAt(t.x,t.y):t.id;v.hx=v.d.fly?t.x:null;v.hy=v.d.fly?t.y:null;v.wt=0;s.tg=null;beep(500,.07);vib(18);this.log(v.d.n+' выехал'+(v.d.apc?' на позицию':' за людьми'));this.ui()},
  recall(){const s=this.s,v=this.vById(s.sel);if(!v||v.st==='dead'||v.st==='ready'||v.st==='unload')return;
    const p=this.pointsTo(v,this.lzN);if(!p){say('Нет пути на аэродром',2);return}v.pts=p;v.pi=1;v.st='back';v.cnode=-1;beep(420,.06);this.ui()},
  leave(){const s=this.s,v=this.vById(s.sel);if(!v||v.st!=='wait')return;this.depart(v)},
  depart(v){const p=this.pointsTo(v,this.lzN);if(!p){v.st='hold';return}v.pts=p;v.pi=1;v.st='back';v.cnode=-1;beep(480,.06);this.log(v.d.n+' уехал с '+Math.round(v.cargo)+' чел.');this.ui()},
  blow(){const s=this.s,i=s.bsel;if(i==null||s.dead[i])return;
    const ri=RY.indexOf(BRY[i]),a=this.nid[ri*RX.length+4],b=this.nid[ri*RX.length+5];if(a<0||b<0)return;
    const A=this.N[a],B=this.N[b];A.e=A.e.filter(x=>x!==b);B.e=B.e.filter(x=>x!==a);s.dead[i]=true;s.bridges++;
    s.fx.push({k:'boom',x:(A.x+B.x)/2,y:A.y,t:0,d:2.4,seed:(Math.random()*1000)|0});s.shake=.7;beep(70,.5,.09,'sawtooth');vib([100,50,140]);
    const hit=g=>!g.dir&&((g.a===a&&g.b===b)||(g.a===b&&g.b===a));
    for(const g of s.civ)if(hit(g)){g.dead=1;s.killed++}for(const g of s.zom)if(hit(g))g.dead=1;
    for(const v of s.v){if(v.st==='dead'||v.d.fly)continue;if(v.edge&&((v.edge[0]===a&&v.edge[1]===b)||(v.edge[0]===b&&v.edge[1]===a)))this.hurt(v,99)}
    this.mkTables();
    for(const v of s.v){if(v.st==='dead'||v.d.fly||!v.pts)continue;const dest=v.st==='go'?(v.cnode>=0?v.cnode:this.lzN):this.lzN,p=this.pointsTo(v,dest);if(p){v.pts=p;v.pi=1}else{v.pts=null;v.st='hold';this.log(v.d.n+' отрезан от маршрута')}}
    // гражданские, чьи маршруты оборвались, ищут другие цели сами
    this.log(BR_NM[i]+' взорван');say(BR_NM[i]+' взорван: заражённые и колонны не пройдут.',3);s.bsel=null;this.ui()},
  // ---------------------------------------------------------------- время суток и вспомогательное
  clock(){const s=this.s;return(6+s.t/s.dur*24)%24},
  nk(){const h=this.clock(),sun=Math.sin((h-6)/24*TAU);return clamp(.5-sun*.9,0,1)},
  log(m){const s=this.s;s.log.unshift(m);s.logN=(s.logN||0)+1;s.log.length=Math.min(4,s.log.length)},
  pop(x,y,t,c,big){this.s.fx.push({k:'txt',x,y,t:0,d:big?2.4:1.8,s:t,c:c||'#fff'})},
  hurt(v,d){const s=this.s;if(v.st==='dead'||d<=0)return;v.hp-=d;if(v.cargo>0){const loss=Math.min(v.cargo,v.cargo*d/v.d.hp);v.cargo-=loss;s.killed+=loss}
    if(v.hp<=0){v.st='dead';s.vlost++;s.killed+=v.cargo;v.cargo=0;s.shake=.5;s.fx.push({k:'boom',x:v.x,y:v.y,t:0,d:2.4,seed:(Math.random()*1000)|0});this.log(v.d.n+' уничтожен');say(v.d.n+' уничтожен!',2.4);beep(90,.4,.08,'sawtooth');vib([80,40,120]);if(s.sel===v.id)s.tg=null;this.ui()}},
  // шаг техники по маршруту: следование за впереди идущей машиной, толпа на дороге замедляет
  step(v,dt,nk){
    if(!v.pts){v.spd=0;return false}let sp=v.d.v*(1.05-.15*nk);
    if(!v.d.fly){let f=1;const s=this.s;
      for(const w of s.v){if(w===v||w.d.fly||w.st==='dead'||w.st==='ready')continue;const dx=w.x-v.x,dy=w.y-v.y,d=Math.hypot(dx,dy);if(d<11&&dx*v.dx+dy*v.dy>0&&(w.dx*v.dx+w.dy*v.dy)>.3&&Math.abs(dx*v.dy-dy*v.dx)<4)f=Math.min(f,clamp((d-4.5)/6.5,0,1))}
      let zc=0;if(this.zg)this.near(this.zg,v.x+v.dx*5,v.y+v.dy*5,5,()=>{zc++;return false});if(zc)f*=1/(1+zc*.35);sp*=f}
    v.spd=sp;let rem=sp*dt;
    while(rem>0&&v.pi<v.pts.length){const q=v.pts[v.pi],dx=q[0]-v.x,dy=q[1]-v.y,d=Math.hypot(dx,dy);
      if(d<=rem){v.x=q[0];v.y=q[1];rem-=d;v.pi++;const nd=this.N.find(o=>o.x===q[0]&&o.y===q[1]);if(nd){v.node=nd.i;v.edge=null}}
      else{v.dx=dx/d;v.dy=dy/d;v.x+=v.dx*rem;v.y+=v.dy*rem;rem=0;
        if(!v.d.fly){const nxt=this.N.find(o=>o.x===q[0]&&o.y===q[1]);if(nxt&&v.node!==nxt.i&&this.N[v.node]&&this.N[v.node].e.includes(nxt.i))v.edge=[v.node,nxt.i]}}}
    return v.pi>=v.pts.length},
  // ---------------------------------------------------------------- симуляция
  update(dt){
    const s=this.s;if(s.end||s.hold)return;s.t+=dt;s.shake=Math.max(0,s.shake-dt);const nk=this.nk(),N=this.N;
    // новые очаги заражения
    s.wT-=dt;if(s.wT<=0){s.wT=rnd(18,28)/(1+.3*nk);const far=N.filter(o=>o.x<150&&Math.hypot(o.x-N[this.lzN].x,o.y-N[this.lzN].y)>90),o=pick(far),k=2+Math.floor(s.t/70);
      for(let i=0;i<k;i++)this.addZom(o.i,true,o.x+rnd(-4,4),o.y+rnd(-4,4));s.fx.push({k:'ring',x:o.x,y:o.y,t:0,d:1.6,red:1});
      const sh=this.shelters.reduce((b,q)=>Math.hypot(N[q.node].x-o.x,N[q.node].y-o.y)<Math.hypot(N[b.node].x-o.x,N[b.node].y-o.y)?q:b);this.log('Новый очаг заражения у «'+sh.nm+'»');beep(180,.2,.05,'sawtooth')}
    this.zg=this.grid(s.zom);this.cg=this.grid(s.civ);const zg=this.zg,cg=this.cg;
    // заражённые
    for(const g of s.zom){
      if(g.dead)continue;
      if(g.st==='rise'){g.sw-=dt;if(g.sw<=0){g.st='walk';if(g.snap)this.snap(g)}continue}
      g.t-=dt;
      if(g.t<=0){g.t=rnd(.3,.6);g.spd=rnd(1.2,1.5)*(1+.25*nk);
        const c=this.nearest(cg,g.x,g.y,22);
        if(c){const d=Math.hypot(c.x-g.x,c.y-g.y);if(d<7){g.dir={x:c.x,y:c.y};g.spd*=1.45}else{if(g.dir){g.dir=null;this.snap(g)}g.goal=c.u<.5?c.a:c.b}}
        else{let tv=null,bd=95;for(const v of s.v)if(v.st==='wait'||v.st==='hold'||v.st==='go'){const d=Math.hypot(v.x-g.x,v.y-g.y);if(d<bd){bd=d;tv=v}}
          if(g.dir){g.dir=null;this.snap(g)}g.goal=tv?this.nodeAt(tv.x,tv.y):(Math.random()<.25?-1:g.goal)}}
      this.move(g,dt);
      g.ic=(g.ic||0)-dt;const c=g.ic>0?null:this.near(cg,g.x,g.y,2.4,q=>!q.dead&&!q.boarded);
      if(c){g.ic=10;c.dead=1;s.killed++;const z=this.addZom(c.a,true,c.x,c.y);z.sw=1.1;s.fx.push({k:'ring',x:c.x,y:c.y,t:0,d:.9,red:1});if(Math.random()<.3)Snd.panic(.35)}
    }
    // жители
    for(const g of s.civ){
      if(g.dead||g.boarded)continue;
      g.t-=dt;
      if(g.t<=0){g.t=rnd(.35,.7);
        const z=this.nearest(zg,g.x,g.y,22);
        if(z){g.fl=2.5;g.fx=z.x;g.fy=z.y;g.spd=3.7;g.tv=null;g.dir=null;
          if(g.st==='stand'){g.st='walk';this.place(g)}
          if(g.st==='walk'&&((z.x-g.x)*g.dx+(z.y-g.y)*g.dy)>0){const a=g.a,b=g.b;this.edgeSet(g,b,a,1-g.u);g.off=-g.off;this.place(g)}}
        else{g.fl=Math.max(0,g.fl-.6);
          if(!g.tv||g.tv.st==='dead'||(g.tv.st!=='wait'&&g.tv.st!=='go')||g.tv.cargo+g.tv.sk>=g.tv.d.cap*1.12){g.tv=null;
            let bv=null,bd=190;for(const v of s.v){if(v.d.apc||v.st==='dead'||!(v.st==='wait'||(v.st==='go'&&v.cnode>=0))||v.cargo+v.sk>=v.d.cap*1.1)continue;const n0=g.u<.5?g.a:g.b,d=this.D[n0*this.NN+v.cnode]+Math.hypot(v.x-g.x,v.y-g.y)*.3;if(d<bd){bd=d;bv=v}}
            if(bv){g.tv=bv;bv.sk++}}
          if(g.tv){g.goal=g.tv.cnode;g.spd=3.4;if(g.st==='stand'){g.st='walk';this.place(g)}const dv=Math.hypot(g.tv.x-g.x,g.tv.y-g.y);if(dv<(g.tv.d.fly?45:16)&&g.tv.st==='wait')g.dir={x:g.tv.x,y:g.tv.y}}
          else{if(g.dir){g.dir=null;g.snap=1}g.spd=g.fl>0?3:rnd(1.5,2.2);if(g.st==='walk'&&g.goal<0&&Math.random()<.25)this.nextGoal(g)}}}
      if(g.dir&&!g.tv){g.dir=null;g.snap=1}
      this.move(g,dt);
      if(g.tv&&g.tv.st==='wait'&&Math.hypot(g.tv.x-g.x,g.tv.y-g.y)<4.8&&g.tv.cargo<g.tv.d.cap){g.boarded=1;g.tv.cargo++}
    }
    s.civ=s.civ.filter(g=>!g.dead&&!g.boarded);s.zom=s.zom.filter(g=>!g.dead);
    for(const v of s.v)v.sk=0;for(const g of s.civ)if(g.tv)g.tv.sk++;
    // защитники аэродрома
    const lz=N[this.lzN];for(const g of s.zom)if(Math.hypot(g.x-lz.x,g.y-lz.y)<26){g.hp=(g.hp==null?1:g.hp)-dt*1.6;if(g.hp<=0)g.dead=1}
    s.zom=s.zom.filter(g=>!g.dead);
    // техника
    for(const v of s.v){
      if(v.st==='dead'||v.st==='ready')continue;
      if(v.st==='go'||v.st==='back'){
        const fin=this.step(v,dt,nk);
        if(fin){if(v.st==='go'){if(v.d.apc){v.st='hold';v.pts=null;v.spd=0}else{v.st='wait';v.pts=null;v.wt=0;v.spd=0;if(v.d.fly){v.x=v.hx;v.y=v.hy}}}
          else{v.st='unload';v.k=0;v.pts=null;v.edge=null;v.node=this.lzN;v.spd=0}}}
      else if(v.st==='wait'){v.wt+=dt;v.spd=0;if(v.cargo>=v.d.cap-.01||(v.wt>50&&v.cargo>0)||(v.hp<=1.2&&v.cargo>0))this.depart(v)}
      else if(v.st==='unload'){v.k+=dt;if(v.k>=1.6){const n=Math.round(v.cargo);s.saved+=n;if(n>0){this.pop(v.x,v.y-14,'+'+n,'#7dffa6',1);s.fx.push({k:'ring',x:v.x,y:v.y,t:0,d:1.2});this.log(v.d.n+' доставил '+n+' чел.');beep(740,.1);vib(24)}v.cargo=0;v.st='ready';v.pts=null;this.ui()}}
      if(v.st!=='ready'&&v.st!=='unload'&&v.st!=='dead'&&!(v.d.fly&&v.st!=='wait')&&v.spd<8){let zc=0;this.near(zg,v.x,v.y,6,()=>{zc++;return false});if(zc)this.hurt(v,zc*(v.d.apc?.035:.06)*dt)}
    }
    // звуки опасности
    let nearZ=0;for(const g of s.zom){if(nearZ>=6)break;if(g.st!=='rise'&&this.nearest(cg,g.x,g.y,9))nearZ++}
    s.sirT-=dt;if(s.sirT<=0){s.sirT=rnd(8,12);if(nearZ)Snd.siren(clamp(.25+nearZ*.1,.25,.8))}
    s.panT-=dt;if(s.panT<=0){s.panT=rnd(2.5,4);if(nearZ)Snd.panic(clamp(.2+nearZ*.12,.2,.8))}
    // счётчики скоплений
    s.cntT-=dt;if(s.cntT<=0){s.cntT=.6;for(const sh of this.shelters){let c=0;this.near(cg,N[sh.node].x,N[sh.node].y,14,()=>{c++;return false});sh.cnt=c}}
    for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);
    // конец
    const aliveV=s.v.some(v=>v.st!=='dead'&&!v.d.apc),cargo=s.v.some(v=>v.cargo>0&&v.st!=='dead');
    if(s.t>=s.dur||(!s.civ.length&&!cargo&&s.t>10)||!aliveV){this.finish();return}
    if(!s.warn&&s.dur-s.t<25){s.warn=1;say('25 секунд до конца: везите людей на аэродром!',3)}
    s.hudT-=dt;if(s.hudT<=0){s.hudT=.25;this.hudUpd();this.ui(1)}
  },
  // во время обучения живут люди и техника; заражённые стоят
  coachUpdate(dt){const s=this.s;if(s.end)return;dt*=2;this.zg=this.grid(s.zom);this.cg=this.grid(s.civ);
    for(const g of s.civ){if(g.boarded)continue;g.t-=dt;this.move(g,dt)}
    for(const v of s.v){if(v.st==='go'||v.st==='back'){if(this.step(v,dt,0)){if(v.st==='go'){v.st=v.d.apc?'hold':'wait';v.pts=null;v.wt=0;v.spd=0}else{v.st='unload';v.k=0;v.pts=null;v.edge=null;v.node=this.lzN}}}
      else if(v.st==='wait'){for(const g of s.civ){if(g.boarded)continue;if(!g.tv&&v.cargo+v.sk<v.d.cap&&Math.hypot(g.x-v.x,g.y-v.y)<70){g.tv=v;v.sk++;g.goal=v.cnode;g.spd=4;g.fl=0;g.st='walk'}
          if(g.tv===v&&Math.hypot(g.x-v.x,g.y-v.y)<22&&g.st!=='rise'){g.dir={x:v.x,y:v.y}}
          if(g.tv===v&&Math.hypot(v.x-g.x,v.y-g.y)<4.8&&v.cargo<v.d.cap){g.boarded=1;v.cargo++}}s.civ=s.civ.filter(g=>!g.boarded);
        if(v.cargo>=Math.min(v.d.cap,12)){const p=this.pointsTo(v,this.lzN);if(p){v.pts=p;v.pi=1;v.st='back';v.cnode=-1}}}
      else if(v.st==='unload'){v.k+=dt;if(v.k>=1.6){s.saved+=Math.round(v.cargo);v.cargo=0;v.st='ready';v.pts=null}}}
    for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);s.hudT-=dt;if(s.hudT<=0){s.hudT=.25;this.hudUpd();this.ui(1)}},
  coach(){const s=this.s,hosp=this.N[this.shelters[5].node];s.sel='bus1';this.ui();
    Coach.run('s3',[
      {t:'Это парк техники. Автобус уже выбран. Нажмите на перекрёсток у «Больницы» — там собралось много людей.',rc:()=>({x0:hosp.x-14,y0:hosp.y-14,x1:hosp.x+14,y1:hosp.y+14}),wait:()=>s.tg&&s.tg.k==='n'},
      {t:'Панель показывает время в пути и опасность маршрута. Нажмите «Отправить».',el:'#panel [data-a=m_go]',wait:()=>s.v[0].st!=='ready'},
      {t:'Автобус едет по улицам и встаёт на перекрёстке. Люди, увидев его, сами бегут к машине и садятся. Дождитесь погрузки.',pt:()=>({x:s.v[0].x,y:s.v[0].y-6,r:16}),wait:()=>s.v[0].cargo>=6||s.v[0].st==='back'||s.saved>0},
      {t:'Заполненная машина уезжает сама; можно отправить её раньше кнопкой «Отъезд». Красные — заражённые: они рождаются в очагах и заражают всех на пути. БТР отвлекает их, а мост можно взорвать (нажмите на мост).',btn:'Понятно ▶'},
      {t:'Цель: вывезти как можно больше людей до конца времени. Можно ставить паузу планирования — приказы работают и на паузе.',btn:'Начать ▶'}
    ],()=>{this.ui();say('Эвакуация началась!',2)})},
  finish(){const s=this.s;if(s.end)return;s.end=true;
    const tot=s.total,sv=Math.round(s.saved),kl=Math.round(s.killed);G.saved+=sv;G.s3=sv;G.s3k=kl;G.s3v=s.vlost;G.s3t=tot;G.bridges=s.bridges;
    G.support=Math.round(clamp(35+60*sv/tot-25*kl/tot,10,95));G.epiInf=clamp(.3+.6*(1-sv/tot),.3,.95);G.cityInf=clamp(.15+.5*(1-sv/tot),.15,.7);G.contain3=sv>=.5*tot;
    setTimeout(()=>Flow.afterMil(),400)},
  hudUpd(){const s=this.s;hud(`<b>03 ЭВАКУАЦИЯ</b><span class="g">спасено ${Math.round(s.saved)}/${s.total}</span><span class="a">в городе ${s.civ.length}</span><span class="r">заражённых ${s.zom.length}</span><span class="ob">${this.nk()>.55?'☾':'☀'} ${String(Math.floor(this.clock())).padStart(2,'0')}:${String(Math.floor(this.clock()%1*60)).padStart(2,'0')}</span><span>${mmss(s.dur-s.t)}</span>`)},
  // ---------------------------------------------------------------- управление
  tap(x,y){
    const s=this.s;if(x>MW||s.end)return;x-=OX;
    let bv=null,bd=9;for(const v of s.v){if(v.st==='dead')continue;const d=Math.hypot(v.x-x,v.y-y);if(d<bd){bd=d;bv=v}}
    if(bv){s.sel=bv.id;s.tg=null;s.bsel=null;this.ui();beep(560,.04);return}
    for(let i=0;i<3;i++)if(Math.hypot(170-x,BRY[i]-y)<12){s.bsel=i;s.tg=null;this.ui();beep(560,.04);vib(12);return}
    const v=this.vById(s.sel);if(!v||v.st==='dead')return;
    if(v.d.fly){if(this.map.water(x,y)){say('Вертолёт садится на землю',1.6);return}this.setTarget({k:'p',x,y});beep(620,.04);vib(12);return}
    const n=this.nodeAt(x,y,30);if(n>=0){this.setTarget({k:'n',id:n});beep(620,.04);vib(12)}
  },
  act(a,d){
    const s=this.s;if(s.end)return;
    if(a==='sel'){s.sel=d;s.tg=null;s.bsel=null;beep(560,.04)}
    else if(a==='go')this.go();
    else if(a==='cancel'){s.tg=null;s.bsel=null}
    else if(a==='recall')this.recall();
    else if(a==='leave')this.leave();
    else if(a==='blow')this.blow();
    else if(a==='hold'){s.hold=!s.hold;beep(s.hold?300:600,.06)}
    this.ui();
  },
  ui(soft){
    const s=this.s,v=this.vById(s.sel),pr=this.preview();
    const sig=JSON.stringify([s.sel,s.tg,s.hold,s.bsel,s.dead,s.v.map(q=>[q.st,Math.round(q.cargo/2),Math.round(q.hp*2)]),pr&&[Math.round(pr.eta),pr.risk,pr.spot],s.log.join()]);
    if(soft&&sig===this.uiSig)return;this.uiSig=sig;
    let h=`<div class="ph"><b>ПАРК ТЕХНИКИ</b><button class="pb ${s.hold?'warn':''}" data-a="m_hold" style="width:auto;margin:0!important;padding:.3rem .7rem!important"><span class="tx">${s.hold?'▶ Идёт пауза':'❚❚ Пауза'}</span></button></div>`;
    {const st2=q=>({ready:'готов',go:q.d.apc?'в пути':'едет',wait:'грузит '+Math.round(q.cargo),back:'везёт '+Math.round(q.cargo),unload:'выгрузка',hold:'на позиции',dead:'потерян'}[q.st]);
      for(let i=0;i<s.v.length;i+=2)h+=`<div class="r2" style="gap:.25rem">`+[s.v[i],s.v[i+1]].filter(Boolean).map(q=>`<button class="pb ${q.id===s.sel?'glow':''}" data-a="m_sel" data-d="${q.id}" data-key="v${q.id}" ${q.st==='dead'?'disabled':''} style="padding:.25rem .35rem!important;gap:.3rem!important;margin:.1rem 0!important"><span class="bd" style="--c:${q.st==='dead'?'#6a3a3a':q.d.apc?'#6fc48a':'#ffd067'};width:1.5rem;height:1.5rem;font-size:.95rem">${q.d.ic}</span><span class="tx" style="font-size:1rem">${q.d.n}<small style="font-size:.8rem">${st2(q)}</small></span></button>`).join('')+`</div>`}
    if(s.bsel!=null){const i=s.bsel;h+=`<div class="callc" data-key="br${i}${s.dead[i]}"><div class="ad">${BR_NM[i]}</div><div class="tt">${s.dead[i]?'Мост разрушен.':'Взрыв необратим: заражённые и колонны не пройдут. Останется меньше мостов — больше пробок.'}</div></div><div class="r2"><button class="pb dng" data-a="m_blow" ${s.dead[i]?'disabled':''}><span class="tx">Взорвать мост</span></button><button class="pb" data-a="m_cancel" style="flex:0 0 4.4rem"><span class="tx">✕</span></button></div>`}
    else if(v&&v.st!=='dead'){
      h+=`<div class="m" style="margin:.2rem 0 .1rem;font-size:1rem">${v.d.n}: ${v.d.d}${v.hp<v.d.hp?' · прочность '+Math.max(0,Math.ceil(v.hp))+'/'+v.d.hp:''}</div>`;
      if(s.tg&&pr){const rk=pr.risk,rc=rk===0?'#7dffa6':rk===1?'#ffd067':'#ff6b5c',rt=rk===0?'путь свободен':rk===1?'на пути заражённые':'опасно: толпа на пути',sp=pr.spot===0?'тихо':pr.spot===1?'есть заражённые':'толпа заражённых',pc=pr.spot===0?'#7dffa6':pr.spot===1?'#ffd067':'#ff6b5c';
        h+=`<div class="callc" data-key="tg${s.sel}${s.tg.id!=null?s.tg.id:Math.round(s.tg.x)}"><div class="ad">→ ${v.d.fly?'посадка здесь':'эта точка'}</div><div class="tt">в пути ≈ ${Math.round(pr.eta)} с · <span style="color:${rc}">${rt}</span><br>у места: <span style="color:${pc}">${sp}</span></div></div><div class="r2"><button class="pb glow" data-a="m_go"><span class="tx">Отправить</span></button><button class="pb" data-a="m_cancel" style="flex:0 0 4.4rem"><span class="tx">✕</span></button></div>`}
      else if(v.st==='ready')h+=`<div class="m" style="margin:.3rem 0">${v.d.apc?'Нажмите на перекрёсток: БТР встанет там и отвлечёт заражённых.':v.d.fly?'Нажмите в любом месте: вертолёт сядет и заберёт людей.':'Нажмите на перекрёсток или улицу: машина встанет там, люди сами подбегут.'}</div>`;
      else if(v.st==='wait')h+=`<div class="m" style="margin:.3rem 0">Погрузка: ${Math.round(v.cargo)}/${v.d.cap}. Люди бегут к машине.</div><div class="r2"><button class="pb glow" data-a="m_leave"><span class="tx">Отъезд</span></button></div>`;
      else if(v.st==='go'||v.st==='back'||v.st==='hold')h+=`<div class="r2"><button class="pb" data-a="m_recall"><span class="tx">Вернуть на базу</span></button></div>`}
    h+=`<div class="log">${s.log.slice(0,2).map((x,i)=>`<div data-key="L${(s.logN||0)-i}">${x}</div>`).join('')}</div>`;panel(h);
  },
  // ---------------------------------------------------------------- рисование
  draw(){
    const s=this.s,tm=performance.now()/1000,now=performance.now(),dt=Math.min(.1,(now-this.lt)/1000);this.lt=now;const nk=this.nk(),N=this.N;
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
    // мосты
    for(let i=0;i<3;i++){const X=170-23,Y=Math.round(BRY[i]-4),bsel=s.bsel===i;
      if(!s.dead[i])Maps.dimg(cx,this.br,X-4,Y-6);
      else{const K=this.br.K,bh=this.br.height;cx.drawImage(this.br,0,0,18*K,bh,X-4,Y-6,18,bh/K);cx.drawImage(this.br,this.br.width-18*K,0,18*K,bh,X+46-14,Y-6,18,bh/K);
        for(let k=0;k<5;k++){const u=(tm*.5+k/5)%1;cx.fillStyle='rgba(40,30,34,'+(.3*(1-u)).toFixed(2)+')';cx.beginPath();cx.arc(170-5+k*3,BRY[i]-5-u*16,2+u*3,0,TAU);cx.fill()}
        Post.glow(170,BRY[i]-1,14,'255,120,50',.2+.08*Math.sin(tm*8))}
      cx.strokeStyle=bsel?'#fff':'rgba(255,255,255,.28)';cx.lineWidth=bsel?1.5:.8;cx.beginPath();cx.ellipse(170,BRY[i],9,4,0,0,TAU);cx.stroke()}
    // точка эвакуации и защитники
    {const lz=N[this.lzN],p=.5+.5*Math.sin(tm*3);cx.save();cx.strokeStyle='rgba(125,255,166,'+(.5+.3*p).toFixed(2)+')';cx.lineWidth=1.4;cx.beginPath();cx.ellipse(lz.x,lz.y,13+p*2,6+p,0,0,TAU);cx.stroke();cx.setLineDash([3,3]);cx.lineDashOffset=-tm*10;cx.beginPath();cx.ellipse(lz.x,lz.y,19,9,0,0,TAU);cx.stroke();cx.restore();Post.glow(lz.x,lz.y,24,'125,255,166',.12+.06*p);otx('ЭВАКУАЦИЯ',lz.x,lz.y+22,'#7dffa6',9,'center',.9);
      for(let k=0;k<4;k++){const sx=lz.x-22+k*14,sy=lz.y-16+(k%2)*3,z=this.zg&&this.nearest(this.zg,sx,sy,30),fire=!!z&&Math.floor(tm*8+k*3)%3===0;Art3.soldier(sx,sy,k+1,tm,k<2?-1:1,fire);if(fire){cx.strokeStyle='rgba(255,230,140,.7)';cx.lineWidth=.6;cx.beginPath();cx.moveTo(sx,sy-6);cx.lineTo(z.x,z.y);cx.stroke()}}}
    // предпросмотр
    {const pr=this.preview();if(pr){const rk=pr.risk,col=rk===0?'125,255,166':rk===1?'255,208,103':'255,107,92';cx.save();cx.setLineDash([3,3]);cx.lineDashOffset=-tm*14;cx.strokeStyle='rgba('+col+',.85)';cx.lineWidth=1.3;cx.beginPath();pr.p.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.stroke();cx.restore();
        const e=pr.p[pr.p.length-1];cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=1.2;cx.beginPath();cx.arc(e[0],e[1],7+Math.sin(tm*5),0,TAU);cx.stroke()}}
    for(const v of s.v)if(v.pts&&(v.st==='go'||v.st==='back')){cx.save();cx.setLineDash([2,4]);cx.lineDashOffset=-tm*12;cx.strokeStyle=v.st==='back'?'rgba(125,255,166,.35)':'rgba(255,255,255,.3)';cx.lineWidth=.9;cx.beginPath();cx.moveTo(v.x,v.y);for(let i=v.pi;i<v.pts.length;i++)cx.lineTo(v.pts[i][0],v.pts[i][1]);cx.stroke();cx.restore()}
    // толпа заражённых: красное свечение скоплений
    if(this.zg){const Z=this.zg;for(let c=0;c<Z.length;c++){const a=Z[c];if(a&&a.length>=3){let sx=0,sy=0;for(const g of a){sx+=g.x;sy+=g.y}Post.glow(sx/a.length,sy/a.length,10+a.length*1.2,'255,50,40',Math.min(.3,.08+a.length*.025))}}}
    // люди и заражённые
    for(const g of s.civ)Art3.mini('p',g.x,g.y,g.id,tm,g.spd>3||g.fl>0);
    for(const g of s.zom)Art3.mini(g.st==='rise'?'r':'z',g.x,g.y,g.id,tm,!!g.dir);
    // подписи скоплений
    for(const sh of this.shelters){if(sh.cnt<5)continue;const nd=N[sh.node],gx=nd.x,gy=nd.y-12;cx.fillStyle='rgba(6,14,22,.82)';cx.fillRect(gx-12,gy-5,24,10);txt(sh.nm,gx,gy-.5,'#9fb3c0',5.5,'center');txt(String(sh.cnt),gx,gy+4,'#ffd067',6.5,'center')}
    // техника
    for(const v of s.v){if(v.st==='dead')continue;
      if(v.st==='ready'){const i=s.v.indexOf(v),px=N[this.lzN].x-26+(i%4)*8,py=N[this.lzN].y+8+Math.floor(i/4)*6;v.x=px;v.y=py}
      if(v.d.fly)Art3.heli(v.x,v.y-(v.st==='wait'||v.st==='ready'||v.st==='unload'?2:8),tm,nk);
      else if(v.t==='bus')Art3.bus(v.x,v.y,v.dx,v.dy,v.cargo,tm,nk);
      else if(v.t==='truck')Art3.truck(v.x,v.y,v.dx,v.dy,v.cargo,tm,nk);
      else if(v.t==='jeep')Art3.car(v.x,v.y,v.dx,v.dy,{k:'civ',col:'#6b7a5a'});
      else Art3.car(v.x,v.y,v.dx,v.dy,{k:'spec'});
      if(v.st==='wait'){cx.save();cx.strokeStyle='rgba(255,208,103,'+(.5+.3*Math.sin(tm*6)).toFixed(2)+')';cx.lineWidth=1;cx.setLineDash([2,2]);cx.lineDashOffset=-tm*8;cx.beginPath();cx.ellipse(v.x,v.y+1,16,8,0,0,TAU);cx.stroke();cx.restore();Post.glow(v.x,v.y,22,'255,208,103',.14)}
      if(v.id===s.sel){cx.strokeStyle='#fff';cx.lineWidth=1;const b=9;for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){cx.beginPath();cx.moveTo(v.x+sx*b,v.y+sy*(b-3));cx.lineTo(v.x+sx*b,v.y+sy*b);cx.lineTo(v.x+sx*(b-3),v.y+sy*b);cx.stroke()}}
      if(v.hp<v.d.hp){cx.fillStyle='#0b1720';cx.fillRect(v.x-6,v.y-12,12,2);cx.fillStyle=v.hp/v.d.hp>.5?'#7dffa6':'#ff5b4d';cx.fillRect(v.x-6,v.y-12,12*clamp(v.hp/v.d.hp,0,1),2)}
      if(v.cargo>0.5&&v.st!=='ready')otx(Math.round(v.cargo)+(v.st==='wait'?'/'+v.d.cap:''),v.x,v.y-14,'#ffd067',9,'center')}
    if(s.tg&&s.tg.k==='p'){cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=1.2;cx.beginPath();cx.arc(s.tg.x,s.tg.y,7+Math.sin(tm*5),0,TAU);cx.stroke()}
    for(const q of s.smoke){q.y-=q.v*dt;q.x+=Math.sin(q.l*2+q.y*.1)*.12;q.l+=dt}s.smoke=s.smoke.filter(q=>q.l<q.m);
    for(const q of s.smoke){const a=Math.sin(q.l/q.m*3.14)*.34,r=2+q.l*2.6,g=cx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);g.addColorStop(0,'rgba(46,36,40,'+a.toFixed(3)+')');g.addColorStop(1,'rgba(46,36,40,0)');cx.fillStyle=g;cx.fillRect(q.x-r,q.y-r,r*2,r*2)}
    for(const f of s.fx){const u=f.t/f.d;
      if(f.k==='txt')otx(f.s,f.x,f.y-u*14,f.c,11,'center',clamp(1.7-u*1.7,0,1)*clamp(u*9,0,1));
      else if(f.k==='boom')Art3.boom(f.x,f.y,Math.min(.99,u),f.seed);
      else if(f.k==='ring')Art3.ring(f.x,f.y,u,f.red)}
    cx.restore();
    if(nk<.5){cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(120,150,190,'+((.5-nk)*.4).toFixed(3)+')';cx.fillRect(0,0,MW,H);cx.restore()}
    if(nk>.3){cx.fillStyle='rgba(6,12,40,'+((nk-.3)*.4).toFixed(3)+')';cx.fillRect(0,0,MW,H)}
    Post.vig(.75);
    if(s.hold)otx('ПАУЗА ПЛАНИРОВАНИЯ',MW/2,36,'#ffd067',11,'center');
    cx.strokeStyle='#3a8f8a';cx.lineWidth=1;for(const[x,y,dx,dy]of[[2,24,1,1],[MW-3,24,-1,1],[2,H-3,1,-1],[MW-3,H-3,-1,-1]]){cx.beginPath();cx.moveTo(x,y+dy*10);cx.lineTo(x,y);cx.lineTo(x+dx*10,y);cx.stroke()}
    cx.restore();
  }
};
ACT.m_sel=d=>Mil.act('sel',d);ACT.m_go=()=>Mil.act('go');ACT.m_cancel=()=>Mil.act('cancel');ACT.m_recall=()=>Mil.act('recall');ACT.m_leave=()=>Mil.act('leave');ACT.m_blow=()=>Mil.act('blow');ACT.m_hold=()=>Mil.act('hold');
