'use strict';
// Случайные этажи-лабиринты: генерация, обход, «запекание» картинки (вид сверху, объём, тени)
const TL=16,CP=48,DX4=[1,0,-1,0],DY4=[0,1,0,-1];
const THEMES=[
  {n:'Лаборатории',fl:'#233540',fl2:'#293c48',gr:'#1a2831',rm:'#2e4552',wt:'#6f8b9b',wl:'#a6c0ce',wd:'#4b6676',wf:'#35525f',wfd:'#233b46',ac:'#4cc9c0',lamp:'#cfeeff',rooms:['Лаборатория','Препаратная','Центрифужная','Стерильный бокс']},
  {n:'Медблок',fl:'#2a3938',fl2:'#304240',gr:'#202c2b',rm:'#3b514c',wt:'#7e9a90',wl:'#b4cec2',wd:'#52695f',wf:'#3d5a52',wfd:'#2a423c',ac:'#66e08a',lamp:'#e6fff0',rooms:['Палата','Процедурная','Изолятор','Ординаторская']},
  {n:'Архив',fl:'#352f2b',fl2:'#3b342f',gr:'#28221f',rm:'#4a3d33',wt:'#8d7c68',wl:'#bcab92',wd:'#5c4e40',wf:'#54463a',wfd:'#3b3026',ac:'#e5a93b',lamp:'#ffe2b0',rooms:['Архив','Картотека','Кладовая','Читальный зал']},
  {n:'Серверная',fl:'#192230',fl2:'#1e293a',gr:'#131a25',rm:'#233146',wt:'#566f90',wl:'#86a1c4',wd:'#34455e',wf:'#2a3b54',wfd:'#1c293c',ac:'#5aa8ff',lamp:'#c8e0ff',rooms:['Серверная','Узел связи','Хранилище данных','Диспетчерская']}];
const PKN=['','bench','bed','shelf','rack','crate','barrel','fridge','centr','chamber','locker'],TALLK={shelf:1,rack:1,locker:1};
const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const adj=(c,a)=>'#'+hx(c).map(n=>clamp(Math.round(n+a),0,255).toString(16).padStart(2,'0')).join('');
const cellC=(c,k)=>CP*c+CP/2+8; // центр ячейки в пикселях

function genFloor(o){
  const R=mulberry(o.seed),CW=o.CW,CH=o.CH,TW=CW*3+1,TH=CH*3+1,N=CW*CH,con=new Uint8Array(N);
  const F={seed:o.seed,CW,CH,TW,TH,N,con,th:o.th,thi:o.thi,R,t:new Uint8Array(TW*TH).fill(1),pk:new Uint8Array(TW*TH),room:new Int8Array(N).fill(-1),rooms:[],items:[],en:[],meds:[],leds:[],lamps:[],seen:new Uint8Array(TW*TH),arr:null,fwd:null,goal:null,reserved:new Uint8Array(N)};
  const ok=(x,y)=>x>=0&&y>=0&&x<CW&&y<CH;
  // DFS
  const vis=new Uint8Array(N),st=[(R()*N)|0];vis[st[0]]=1;
  while(st.length){const c=st[st.length-1],x=c%CW,y=(c/CW)|0,nb=[];
    for(let d=0;d<4;d++)if(ok(x+DX4[d],y+DY4[d])&&!vis[(y+DY4[d])*CW+x+DX4[d]])nb.push(d);
    if(!nb.length){st.pop();continue}
    const d=nb[(R()*nb.length)|0],n=(y+DY4[d])*CW+x+DX4[d];con[c]|=1<<d;con[n]|=1<<((d+2)%4);vis[n]=1;st.push(n)}
  // петли
  for(let k=0;k<N*.13;k++){const x=(R()*CW)|0,y=(R()*CH)|0,d=(R()*4)|0;if(!ok(x+DX4[d],y+DY4[d]))continue;con[y*CW+x]|=1<<d;con[(y+DY4[d])*CW+x+DX4[d]]|=1<<((d+2)%4)}
  // комнаты 2×2 и 3×2 ячейки
  const nr=Math.max(2,Math.round(N/13));
  for(let tr=0;tr<60&&F.rooms.length<nr;tr++){
    const w=R()<.3?3:2,h=2,bx=(R()*(CW-w+1))|0,by=(R()*(CH-h+1))|0;let free=true;
    for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(F.room[(by+j)*CW+bx+i]>=0)free=false;
    if(!free)continue;
    const id=F.rooms.length;
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){const c=(by+j)*CW+bx+i;F.room[c]=id;if(i<w-1){con[c]|=1;con[c+1]|=4}if(j<h-1){con[c]|=2;con[c+CW]|=8}}
    F.rooms.push({id,bx,by,w,h,tx0:3*bx+1,ty0:3*by+1,tx1:3*(bx+w)-1,ty1:3*(by+h)-1,name:o.th.rooms[id%o.th.rooms.length]});
  }
  // тайлы
  const T=F.t;
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){const c=y*CW+x;
    for(let j=1;j<=2;j++)for(let i=1;i<=2;i++)T[(3*y+j)*TW+3*x+i]=0;
    if(con[c]&1)for(let j=1;j<=2;j++)T[(3*y+j)*TW+3*x+3]=0;
    if(con[c]&2)for(let i=1;i<=2;i++)T[(3*y+3)*TW+3*x+i]=0}
  F.floorN=T.reduce((a,v)=>a+(v===0?1:0),0);
  return F;
}
function cdist(F,c0){const d=new Int16Array(F.N).fill(-1),q=[c0];d[c0]=0;
  for(let i=0;i<q.length;i++){const c=q[i],x=c%F.CW,y=(c/F.CW)|0;for(let k=0;k<4;k++)if(F.con[c]>>k&1){const n=(y+DY4[k])*F.CW+x+DX4[k];if(d[n]<0){d[n]=d[c]+1;q.push(n)}}}return d}
const QB=new Int32Array(90000);
// волновой обход по тайлам (8 направлений, без срезания углов); проходимы только пустые тайлы
function tdist(F,tx,ty,out){
  const TW=F.TW,TH=F.TH,t=F.t;out=out||new Int16Array(TW*TH);out.fill(-1);
  let h=0,e=0;const s=ty*TW+tx;out[s]=0;QB[e++]=s;
  while(h<e){const c=QB[h++],x=c%TW,y=(c/TW)|0,d=out[c]+1;
    for(let k=0;k<8;k++){const dx=k<4?DX4[k]:(k===4||k===7?1:-1),dy=k<4?DY4[k]:(k===4||k===5?1:-1),nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=TW||ny>=TH)continue;const n=ny*TW+nx;if(out[n]>=0||t[n]!==0)continue;
      if(k>=4&&(t[y*TW+nx]!==0||t[ny*TW+x]!==0))continue;out[n]=d;QB[e++]=n}}
  return out}
function reachAll(F,tx,ty){ // все ли пустые тайлы достижимы из (tx,ty) (4 направления)
  const TW=F.TW,t=F.t,seen=new Uint8Array(F.TW*F.TH);let h=0,e=0,cnt=0;QB[e++]=ty*TW+tx;seen[ty*TW+tx]=1;
  while(h<e){const c=QB[h++],x=c%TW,y=(c/TW)|0;cnt++;for(let k=0;k<4;k++){const nx=x+DX4[k],ny=y+DY4[k];if(nx<0||ny<0||nx>=TW||ny>=F.TH)continue;const n=ny*TW+nx;if(!seen[n]&&t[n]===0){seen[n]=1;QB[e++]=n}}}
  let tot=0;for(let i=0;i<t.length;i++)if(t[i]===0)tot++;return cnt===tot}
function setProp(F,tx,ty,kind){const i=ty*F.TW+tx;F.t[i]=TALLK[kind]?3:2;F.pk[i]=PKN.indexOf(kind)}
function tryProp(F,tx,ty,kind,s0){ // поставить мебель, если не ломает проходимость
  const i=ty*F.TW+tx;if(F.t[i]!==0)return false;const old=F.t[i];setProp(F,tx,ty,kind);
  if(!reachAll(F,s0[0],s0[1])){F.t[i]=old;F.pk[i]=0;return false}return true}
// выбор ячеек: в диапазоне расстояний, с разнесением; тупики и комнаты — в приоритете
function pickCells(F,from,minD,maxD,n,sep,avoid){
  const d=cdist(F,from),R=F.R,out=[];
  for(let pass=0;pass<3&&out.length<n;pass++){
    const cand=[];for(let c=0;c<F.N;c++){if(d[c]<minD||d[c]>maxD||F.reserved[c])continue;if(avoid&&avoid.includes(c))continue;if(out.includes(c))continue;
      let w=1+(F.room[c]>=0?2:0)+(F.con[c]&(F.con[c]-1)?0:3);cand.push([c,w])}
    while(cand.length&&out.length<n){const tot=cand.reduce((a,b)=>a+b[1],0);let r=R()*tot,k=0;for(;k<cand.length-1;k++){r-=cand[k][1];if(r<0)break}
      const c=cand.splice(k,1)[0][0],dd=out.length?cdist(F,c):null;
      if(pass<2&&out.some(o=>dd[o]<sep-pass*2))continue;out.push(c)}
  }
  return out}
function addItem(F,cell,kind,extra){ // 1 тайл мебели-цели в ячейке
  const R=F.R,cx=cell%F.CW,cy=(cell/F.CW)|0,tiles=[[0,0],[1,0],[0,1],[1,1]].sort(()=>R()-.5);
  const s0=[3*(F.arr?F.arr.cx:cx)+1,3*(F.arr?F.arr.cy:cy)+1];
  for(const[i,j]of tiles){const tx=3*cx+1+i,ty=3*cy+1+j;if(tryProp(F,tx,ty,kind,s0)){const it=Object.assign({kind,tx,ty,x:tx*TL+8,y:ty*TL+8,cell},extra||{});F.items.push(it);F.reserved[cell]=1;return it}}
  return null}
function furnish(F){ // мебель по краям комнат, колонны, лампы, светодиоды
  const R=F.R,th=F.th,TW=F.TW,s0=[3*F.arr.cx+1,3*F.arr.cy+1],kinds=[['bench','crate'],['bed','crate'],['shelf','crate','barrel'],['rack','crate']][F.thi];
  for(const r of F.rooms){
    const cells=[];for(let j=0;j<r.h;j++)for(let i=0;i<r.w;i++)cells.push((r.by+j)*F.CW+r.bx+i);
    if(cells.some(c=>F.reserved[c]))continue;
    const sides=[0,1,2,3].sort(()=>R()-.5).slice(0,1+(R()<.55?1:0)),k0=kinds[0];
    for(const sd of sides){
      const ring=[];
      if(sd<2){const y=sd?r.ty1:r.ty0;for(let x=r.tx0;x<=r.tx1;x++)ring.push([x,y])}else{const x=sd===2?r.tx0:r.tx1;for(let y=r.ty0;y<=r.ty1;y++)ring.push([x,y])}
      for(const[x,y]of ring){
        const out=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].some(([a,b])=>(a<r.tx0||a>r.tx1||b<r.ty0||b>r.ty1)&&F.t[b*TW+a]===0);
        if(out||R()<.18)continue;tryProp(F,x,y,k0,s0)}}
    if(R()<.6){const k=kinds[1+((R()*(kinds.length-1))|0)],tx=r.tx0+1+((R()*(r.tx1-r.tx0-1))|0),ty=r.ty0+1+((R()*(r.ty1-r.ty0-1))|0);tryProp(F,tx,ty,k,s0)}
    F.lamps.push({x:(r.tx0+r.tx1+1)*TL/2,y:(r.ty0+r.ty1+1)*TL/2,r:78,room:1})}
  for(let c=0;c<F.N;c++){if(F.room[c]<0&&R()<.3)F.lamps.push({x:cellC(c%F.CW),y:cellC((c/F.CW)|0),r:54})}
  // опознать проходимость тупиков: аптечки
  return F}


// ---------------------------------------------------------------- запекание (v0.4: два слоя — «низ» и «верх» — для объёма)
// F.cv — нижний слой: пол, тени, лицевые грани стен и корпуса мебели.
// F.top — верхний слой: верхние грани стен и крышки мебели. Он рисуется построчно вперемешку с персонажами,
// поэтому тот, кто стоит за стеной или шкафом, прячется за ними.
const WTOP=7; // высота верхней грани стены в пикселях тайла; остальное — лицевая грань
function bakeFloor(F){
  const th=F.th,TW=F.TW,TH=F.TH,t=F.t,R=mulberry(F.seed^0x5bd1e995),mk=()=>{const c=document.createElement('canvas');c.width=TW*TL;c.height=TH*TL;return c};
  const cA=mk(),cB=mk(),g=cA.getContext('2d'),gt=cB.getContext('2d');
  const px=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)},pt=(x,y,w,h,col)=>{gt.fillStyle=col;gt.fillRect(x,y,w,h)};
  const wall=(x,y)=>x<0||y<0||x>=TW||y>=TH||t[y*TW+x]===1,solid=(x,y)=>x>=0&&y>=0&&x<TW&&y<TH&&t[y*TW+x]>=2;
  px(0,0,cA.width,cA.height,'#05070a');
  const inRoom=(x,y)=>{for(const r of F.rooms)if(x>=r.tx0&&x<=r.tx1&&y>=r.ty0&&y<=r.ty1)return r;return null};
  const K=F.thi,rgb=hx(th.lamp).join(',');
  // ---------- пол
  for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){if(t[y*TW+x]===1)continue;
    const X=x*TL,Y=y*TL,rm=inRoom(x,y),base=rm?th.rm:(((x>>1)+(y>>1))&1?th.fl:th.fl2),lum=((R()*8)|0)-4;
    px(X,Y,TL,TL,adj(base,lum));
    if(K===0){ // лаборатории: панели 8×8 с заклёпками
      for(let j=0;j<2;j++)for(let i=0;i<2;i++){const sh=((i+j+x+y)&1)?5:-3,x0=X+i*8,y0=Y+j*8;px(x0,y0,8,8,adj(base,lum+sh));
        px(x0,y0,8,1,'rgba(255,255,255,.07)');px(x0,y0,1,8,'rgba(255,255,255,.05)');px(x0,y0+7,8,1,'rgba(0,0,0,.26)');px(x0+7,y0,1,8,'rgba(0,0,0,.2)');
        px(x0+1,y0+1,1,1,'rgba(255,255,255,.18)');px(x0+6,y0+6,1,1,'rgba(0,0,0,.35)')}}
    else if(K===1){ // медблок: глянцевый линолеум
      px(X,Y,TL,1,'rgba(255,255,255,.08)');px(X,Y,1,TL,'rgba(255,255,255,.06)');px(X,Y+15,TL,1,'rgba(0,0,0,.3)');px(X+15,Y,1,TL,'rgba(0,0,0,.24)');
      for(let k=0;k<9;k++)px(X+3+k,Y+12-k,1,1,'rgba(255,255,255,'+(.05+(k&1)*.03)+')');
      if(!rm&&((x+y*3)%7===0)){px(X,Y+7,TL,2,'rgba(102,224,138,.16)');px(X,Y+7,TL,1,'rgba(160,255,190,.14)')}}
    else if(K===2){ // архив: паркетные доски
      for(let j=0;j<4;j++){const sh=((R()*12)|0)-6+(j&1?4:0),y0=Y+j*4;px(X,y0,TL,4,adj(base,lum+sh));px(X,y0,TL,1,'rgba(255,232,190,.09)');px(X,y0+3,TL,1,'rgba(0,0,0,.34)');
        px(X+1+((R()*13)|0),y0+1+((R()*2)|0),2+((R()*5)|0),1,'rgba(0,0,0,.14)');const jx=((R()*14)|0)+1;px(X+jx,y0,1,4,'rgba(0,0,0,.3)');px(X+jx+1,y0,1,1,'rgba(255,255,255,.05)')}}
    else { // серверная: фальшпол с перфорацией
      px(X,Y,TL,1,'rgba(150,190,255,.12)');px(X,Y,1,TL,'rgba(150,190,255,.08)');px(X,Y+15,TL,1,'rgba(0,0,0,.4)');px(X+15,Y,1,TL,'rgba(0,0,0,.3)');
      for(let j=0;j<3;j++)for(let i=0;i<3;i++)px(X+3+i*4,Y+3+j*4,2,2,'rgba(0,0,0,.34)');
      px(X+1,Y+1,1,1,'rgba(220,235,255,.3)');px(X+14,Y+14,1,1,'rgba(0,0,0,.5)')}
    for(let k=0;k<5;k++){const a=R();px(X+2+((R()*12)|0),Y+2+((R()*12)|0),1,1,a<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.18)')}
  }
  // ---------- грязь и мусор
  for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){if(t[y*TW+x]!==0||R()>.075)continue;const X=x*TL+3+((R()*9)|0),Y=y*TL+3+((R()*9)|0),r=R();
    if(r<.28){g.fillStyle='rgba(8,10,12,.4)';g.beginPath();g.ellipse(X,Y,3+R()*3,2+R()*2,R()*3,0,6.3);g.fill()}
    else if(r<.46){px(X,Y,4,3,'#c7d2d8');px(X+1,Y+1,2,1,'#8a9aa3');px(X+1,Y+3,4,1,'rgba(0,0,0,.35)')}
    else if(r<.62){g.strokeStyle='#0a0d10';g.beginPath();g.moveTo(X,Y);g.quadraticCurveTo(X+4,Y+3,X+8,Y+(R()*4|0));g.stroke()}
    else if(r<.78){g.fillStyle='rgba(120,16,16,.35)';g.beginPath();g.ellipse(X,Y,2+R()*3,1.5+R()*2,R()*3,0,6.3);g.fill();g.fillStyle='rgba(200,40,40,.12)';g.beginPath();g.ellipse(X-1,Y-1,1+R()*2,1,R()*3,0,6.3);g.fill()}
    else if(r<.9){px(X,Y,3,3,'#2a2f33');px(X,Y,3,1,'#3d444a');px(X,Y+3,3,1,'rgba(0,0,0,.4)')}
    else{g.fillStyle='rgba(70,120,160,.22)';g.beginPath();g.ellipse(X,Y,3+R()*3,1.5+R()*1.5,0,0,6.3);g.fill();px(X-1,Y-1,2,1,'rgba(200,230,255,.25)')}}
  // ---------- стены: лицевая грань — в нижний слой, верхняя грань — в верхний
  for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){if(t[y*TW+x]!==1)continue;
    let near=false;for(let j=-1;j<=1&&!near;j++)for(let i=-1;i<=1;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<TW&&yy<TH&&t[yy*TW+xx]!==1){near=true;break}}
    if(!near)continue;
    const X=x*TL,Y=y*TL,face=!wall(x,y+1),h=face?WTOP:TL;
    // верх
    const gr=gt.createLinearGradient(0,Y,0,Y+h);gr.addColorStop(0,adj(th.wt,12));gr.addColorStop(1,adj(th.wt,-8));gt.fillStyle=gr;gt.fillRect(X,Y,TL,h);
    for(let k=0;k<h;k+=5)pt(X,Y+k,TL,1,'rgba(0,0,0,.07)');pt(X+((x+y)&1?5:11),Y,1,h,'rgba(0,0,0,.1)');pt(X+((x+y)&1?6:12),Y,1,h,'rgba(255,255,255,.05)');
    if(R()<.12){pt(X+3+((R()*9)|0),Y+1+((R()*3)|0),2,2,adj(th.wt,-26));pt(X+3,Y+1,1,1,'rgba(255,255,255,.2)')}
    if(!wall(x,y-1)||y===0)pt(X,Y,TL,1,th.wl);
    if(!wall(x-1,y)){pt(X,Y,1,h,th.wl)}
    if(!wall(x+1,y)){pt(X+TL-1,Y,1,h,adj(th.wd,-14))}
    if(face){pt(X,Y+WTOP-1,TL,1,adj(th.wt,-32));
      // лицевая грань
      const fg=g.createLinearGradient(0,Y+WTOP,0,Y+TL);fg.addColorStop(0,adj(th.wf,20));fg.addColorStop(.12,adj(th.wf,8));fg.addColorStop(1,adj(th.wfd,-6));g.fillStyle=fg;g.fillRect(X,Y+WTOP,TL,TL-WTOP);
      px(X,Y+WTOP,TL,1,adj(th.wf,34));px(X+((x*7+y)&1?7:3),Y+WTOP+1,1,TL-WTOP-3,'rgba(0,0,0,.2)');px(X+((x*7+y)&1?8:4),Y+WTOP+1,1,TL-WTOP-3,'rgba(255,255,255,.05)');
      px(X,Y+TL-3,TL,2,th.wfd);px(X,Y+TL-3,TL,1,adj(th.wfd,16));px(X,Y+TL-1,TL,1,'rgba(0,0,0,.5)');
      px(X,Y+WTOP+3,TL,1,'rgba(76,201,192,.0)');
      if(!wall(x-1,y+1)||!wall(x-1,y))px(X,Y+WTOP,1,TL-WTOP,adj(th.wf,26));
      if(!wall(x+1,y+1)||!wall(x+1,y))px(X+TL-1,Y+WTOP,1,TL-WTOP,'rgba(0,0,0,.35)')}
  }
  // декор на лицевых гранях
  for(let y=0;y<TH-1;y++)for(let x=0;x<TW;x++){if(t[y*TW+x]!==1||wall(x,y+1))continue;const X=x*TL,Y=y*TL,r=R(),y0=Y+WTOP+2;
    if(r<.09){px(X+3,y0,10,5,'#080e14');for(let k=0;k<5;k++)px(X+3+k*2,y0,1,5,adj(th.wf,-10));px(X+3,y0,10,1,'rgba(255,255,255,.12)')}           // решётка
    else if(r<.15){px(X+4,y0,8,5,'#d9e3e8');px(X+4,y0,8,1,'#fff');px(X+5,y0+1,6,1,'#7d8e98');px(X+5,y0+3,4,1,'#7d8e98');px(X+4,y0+5,8,1,'rgba(0,0,0,.4)')} // объявление
    else if(r<.2){for(let k=0;k<16;k+=4){px(X+k,y0+1,2,4,'#e5c53b');px(X+k+2,y0+1,2,4,'#14171a')}px(X,y0+1,TL,1,'rgba(255,255,255,.2)')}          // полосы
    else if(r<.25){px(X+3,y0,10,5,'#07141a');px(X+4,y0+1,8,3,th.ac);px(X+4,y0+1,8,1,adj(th.ac,70));px(X+3,y0+5,10,1,'rgba(0,0,0,.4)');F.leds.push({x:X+11,y:y0+4,c:'#fff',f:3,p:R()*6})} // экран
    else if(r<.33){px(X,y0+1,TL,3,adj(th.wf,-38));px(X,y0+1,TL,1,adj(th.wf,30));px(X,y0+3,TL,1,'rgba(0,0,0,.4)');px(X+4,y0,2,5,adj(th.wf,-20));px(X+11,y0,2,5,adj(th.wf,-20))} // труба
    else if(r<.37){px(X+5,y0,6,3,'#fff4cc');px(X+4,y0-1,8,1,'#2a2f33');px(X+5,y0+3,6,1,'rgba(255,244,204,.25)');F.lamps.push({x:X+8,y:Y+TL+4,r:66,wl:1})}
    else if(r<.395){px(X+3,y0,10,5,'#0a1015');g.fillStyle=th.ac;g.fillRect(X+4,y0+1,8,1);g.fillRect(X+4,y0+3,5,1)}
  }
  // ---------- свет ламп: тёплые пятна и блики на полу
  g.save();g.globalCompositeOperation='lighter';
  for(const L of F.lamps){const gr=g.createRadialGradient(L.x,L.y,2,L.x,L.y,L.r);gr.addColorStop(0,'rgba('+rgb+',.24)');gr.addColorStop(.5,'rgba('+rgb+',.09)');gr.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=gr;g.fillRect(L.x-L.r,L.y-L.r,L.r*2,L.r*2);
    if(!L.wl){g.fillStyle='rgba('+rgb+',.07)';g.beginPath();g.ellipse(L.x,L.y+8,5,15,0,0,6.3);g.fill();g.fillStyle='rgba(255,255,255,.07)';g.beginPath();g.ellipse(L.x,L.y+1,3,3,0,0,6.3);g.fill()}}
  g.restore();
  // ---------- тени от стен и мебели на пол
  const shade=(X,Y,w,h,dir,a)=>{const gr=dir==='v'?g.createLinearGradient(0,Y,0,Y+h):g.createLinearGradient(X,0,X+w,0);gr.addColorStop(0,'rgba(0,0,0,'+a+')');gr.addColorStop(.45,'rgba(0,0,0,'+(a*.45).toFixed(3)+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(X,Y,w,h)};
  for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){if(t[y*TW+x]!==0)continue;const X=x*TL,Y=y*TL,n=wall(x,y-1),np=solid(x,y-1),w=wall(x-1,y),wp=solid(x-1,y);
    if(n)shade(X,Y,TL,10,'v',.62);else if(np)shade(X,Y,TL,8,'v',.46);
    if(w)shade(X,Y,6,TL,'h',.34);else if(wp)shade(X,Y,6,TL,'h',.3);
    if((n||np)&&(w||wp))px(X,Y,3,3,'rgba(0,0,0,.18)');
    if(wall(x+1,y)){px(X+TL-2,Y,2,TL,'rgba(0,0,0,.16)');px(X+TL-1,Y,1,TL,'rgba(0,0,0,.14)')}
    if(wall(x,y+1)&&!solid(x,y+1)){px(X,Y+TL-2,TL,2,'rgba(0,0,0,.18)')}
    // углы: мягкая тень по диагонали
    if(!n&&!np&&!w&&!wp&&(wall(x-1,y-1)||solid(x-1,y-1)))px(X,Y,4,4,'rgba(0,0,0,.16)')}
  // ---------- мебель (корпус — вниз, крышка — вверх)
  for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){const k=PKN[F.pk[y*TW+x]];if(t[y*TW+x]<2||!k)continue;drawProp(g,gt,F,x,y,k,th,R)}
  // ---------- лестницы, цели
  const cellRect=(cell)=>({X:(cell%F.CW)*CP+16,Y:((cell/F.CW)|0)*CP+16});
  const stairs=(cell,up,dim)=>{const{X,Y}=cellRect(cell),ac=dim?'#e5a93b':th.ac;
    px(X-1,Y-1,34,34,'#05080b');px(X,Y,32,32,'#0b1116');
    for(let k=0;k<8;k++){const sh=up?k:7-k,y0=Y+1+k*3.75|0,col=adj('#58727f',-72+sh*14-(dim?16:0));
      px(X+1,y0,30,3,col);px(X+1,y0,30,1,adj(col,26));px(X+1,y0+3,30,1,'rgba(0,0,0,.45)')}
    px(X,Y,3,32,'#8fa6b4');px(X+29,Y,3,32,'#8fa6b4');px(X,Y,32,2,'#a9bfcc');px(X,Y+30,32,2,'#6c8392');
    px(X+2,Y+2,1,28,'rgba(0,0,0,.4)');px(X+28,Y+2,1,28,'rgba(0,0,0,.4)');
    for(let k=0;k<32;k+=8){px(X,Y+k,3,1,'#dbe8f0');px(X+29,Y+k,3,1,'#dbe8f0')}
    g.fillStyle=ac;g.beginPath();if(up){g.moveTo(X+16,Y+8);g.lineTo(X+24,Y+18);g.lineTo(X+8,Y+18)}else{g.moveTo(X+16,Y+24);g.lineTo(X+24,Y+14);g.lineTo(X+8,Y+14)}g.fill();
    px(X+13,up?Y+18:Y+8,6,6,ac);
    g.save();g.globalCompositeOperation='lighter';const gl=g.createRadialGradient(X+16,Y+16,2,X+16,Y+16,34);gl.addColorStop(0,dim?'rgba(229,169,59,.18)':'rgba('+hx(th.ac).join(',')+',.18)');gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.fillRect(X-20,Y-20,72,72);g.restore()};
  if(F.fwd)stairs(F.fwd.cell,F.fwd.up,false);
  if(F.back)stairs(F.back.cell,F.back.up,true);
  if(F.entry){const{X,Y}=cellRect(F.entry);px(X+1,Y+1,30,30,'#10181e');px(X+2,Y+2,28,28,'#1a252d');px(X+2,Y+2,28,2,'#4a6070');
    px(X+4,Y+6,10,22,'#8aa2b2');px(X+18,Y+6,10,22,'#8aa2b2');px(X+4,Y+6,10,1,'#c4d8e4');px(X+18,Y+6,10,1,'#c4d8e4');px(X+13,Y+6,1,22,'rgba(0,0,0,.4)');px(X+15,Y+6,2,22,'#0b1116');px(X+10,Y+3,12,2,th.ac);px(X+4,Y+27,24,1,'rgba(0,0,0,.4)')}
  if(F.goal){const{X,Y}=cellRect(F.goal.cell),ex=F.goal.kind==='exit';
    px(X,Y,32,32,'#0c1a17');px(X+1,Y+1,30,30,ex?'#12382c':'#12322e');
    for(let k=0;k<32;k+=8){px(X+k,Y,4,3,'#e5c53b');px(X+k+4,Y,4,3,'#14171a');px(X+k,Y+29,4,3,'#e5c53b');px(X+k+4,Y+29,4,3,'#14171a')}
    if(ex){px(X+6,Y+5,20,20,'#06130e');px(X+8,Y+7,16,16,'#2fd68a');px(X+10,Y+9,12,12,'#b6ffe0');px(X+15,Y+9,2,12,'#2fd68a');g.fillStyle='#0b2418';g.fillRect(X+4,Y+25,24,5);g.fillStyle='#3fd68a';g.font='bold 5px sans-serif';g.textAlign='center';g.fillText('ВЫХОД',X+16,Y+29.5)}
    else{px(X+6,Y+6,20,18,'#0a1c1a');px(X+7,Y+7,18,16,'#14403a');px(X+12,Y+9,8,12,'#7fe8cc');px(X+13,Y+10,6,10,'#d6fff2');px(X+11,Y+8,10,2,'#2e6f6a');g.fillStyle='#0b2420';g.fillRect(X+4,Y+25,24,5);g.fillStyle='#4cc9c0';g.font='bold 5px sans-serif';g.textAlign='center';g.fillText('ХРАНИЛИЩЕ',X+16,Y+29.5)}
    g.save();g.globalCompositeOperation='lighter';const gl=g.createRadialGradient(X+16,Y+16,2,X+16,Y+16,46);gl.addColorStop(0,ex?'rgba(63,214,138,.3)':'rgba(76,201,192,.3)');gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.fillRect(X-30,Y-30,92,92);g.restore();g.textAlign='left'}
  // подсветка верхних граней рядом с лампами
  gt.save();gt.globalCompositeOperation='source-atop';
  for(const L of F.lamps){const gr=gt.createRadialGradient(L.x,L.y,2,L.x,L.y,L.r*.9);gr.addColorStop(0,'rgba('+rgb+',.2)');gr.addColorStop(1,'rgba('+rgb+',0)');gt.fillStyle=gr;gt.fillRect(L.x-L.r,L.y-L.r,L.r*2,L.r*2)}
  gt.restore();
  F.top=cB;
  return cA}

function drawProp(g,gt,F,tx,ty,k,th,R){
  const X=tx*TL,Y=ty*TL,P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(X+x,Y+y,w,h)},T=(x,y,w,h,c)=>{gt.fillStyle=c;gt.fillRect(X+x,Y+y,w,h)},TW=F.TW;
  const same=(dx)=>F.pk[ty*TW+tx+dx]===F.pk[ty*TW+tx]&&F.t[ty*TW+tx+dx]>=2,sl=same(-1),sr=same(1);
  const grad=(gc,x,y,w,h,c0,c1)=>{const q=gc.createLinearGradient(0,Y+y,0,Y+y+h);q.addColorStop(0,c0);q.addColorStop(1,c1);gc.fillStyle=q;gc.fillRect(X+x,Y+y,w,h)};
  // нижний контактный силуэт (мягкая тень под корпусом)
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(X+(sl?0:1),Y+TL-2,TL-(sl?0:1)-(sr?0:1),3);
  // крышка высотой h (верхний слой) и корпус (нижний)
  const cap=(c,h)=>{h=h||10;grad(gt,0,0,TL,h,adj(c,22),adj(c,-6));T(0,0,TL,1,adj(c,52));if(!sl)T(0,0,1,h,adj(c,34));if(!sr)T(TL-1,0,1,h,adj(c,-38));T(0,h-1,TL,1,adj(c,-44))};
  const face=(c,d,h0)=>{h0=h0||10;grad(g,0,h0,TL,TL-h0,adj(c,6),adj(c,-12));P(0,h0,TL,1,adj(c,-45));P(0,h0+1,TL,1,adj(c,20));P(0,TL-2,TL,2,d||adj(c,-30));P(0,TL-2,TL,1,adj(d||c,12));if(!sl)P(0,h0+1,1,TL-h0-2,adj(c,22));if(!sr)P(TL-1,h0+1,1,TL-h0-2,adj(c,-38))};
  if(k==='bench'){cap('#a6b9c4');face('#456371','#2f4752');
    P(3,12,5,3,'#2f4752');P(3,12,5,1,'#6f93a4');P(9,12,5,3,'#2f4752');P(9,12,5,1,'#6f93a4');P(5,13,1,1,'#dfe9ee');P(11,13,1,1,'#dfe9ee');
    const col=['#4cc9c0','#e5a93b','#e0453a','#7fa8c4'];
    if(R()<.82){for(let i=0;i<3;i++){const c=col[(R()*4)|0];T(2+i*3,2,2,6,'#e6f4fa');T(2+i*3,3+(i&1),2,4,c);T(2+i*3,2,1,5,'rgba(255,255,255,.55)')}}
    if(R()<.6){gt.fillStyle='#d6e6ee';gt.beginPath();gt.arc(X+12,Y+5,3.2,0,6.3);gt.fill();gt.fillStyle=col[(R()*4)|0];gt.beginPath();gt.arc(X+12,Y+5,2.2,0,6.3);gt.fill();T(11,4,1,1,'rgba(255,255,255,.8)')}
    if(R()<.3){T(5,6,6,3,'#1e2a33');T(6,6,4,2,'#5ac8c0');T(5,9,6,1,'#0b1217')}}
  else if(k==='bed'){cap('#d3e0e5');T(sl?0:3,0,sl?TL:13,10,'#4b7aa8');T(sl?0:3,0,sl?TL:13,2,'#79a8d4');T(sl?0:3,8,sl?TL:13,1,'#355a80');if(!sl){T(0,1,3,8,'#f6fafb');T(0,1,3,2,'#fff');T(0,8,3,1,'#b8c8cf')}
    face('#5b7078','#394b52');P(2,14,2,2,'#1a2227');P(12,14,2,2,'#1a2227')}
  else if(k==='shelf'){cap('#6e5841',7);
    for(let i=0;i<7;i++)if(R()<.8)T(1+i*2,1,2,5,['#a3412f','#2f6d8a','#c9a24a','#4a7a4a','#7a5aa0','#d8d0c0'][(R()*6)|0]);
    face('#3d3125','#241a12',7);
    const bc=['#a3412f','#2f6d8a','#c9a24a','#4a7a4a','#7a5aa0','#d8d0c0','#c06a3a'];
    for(let r=0;r<2;r++){const y0=8+r*4;P(0,y0+3,TL,1,'#1c140d');for(let i=0;i<7;i++)if(R()<.88){const c=bc[(R()*7)|0],hh=2+((R()*2)|0);P(1+i*2,y0+3-hh,2,hh,c);P(1+i*2,y0+3-hh,1,hh,adj(c,26))}}}
  else if(k==='rack'){cap('#0f151e',7);for(let i=0;i<4;i++)T(2,1+i*2,12,1,'#1d2837');T(13,1,2,2,'#3fd68a');
    face('#1b2636','#0e1520',7);
    for(let r=0;r<3;r++){const y0=8+r*3;P(1,y0,14,2,'#0c121b');P(1,y0,14,1,'#2a3a50');for(let i=0;i<4;i++){const c=['#3fd68a','#e5a93b','#e0453a','#5aa8ff'][(R()*4)|0];P(2+i*3,y0+1,2,1,c);F.leds.push({x:X+2+i*3,y:Y+y0+1,c,f:2+R()*5,p:R()*6})}}}
  else if(k==='crate'){cap('#93713f');T(7,0,2,10,'#614829');T(0,4,TL,2,'#614829');T(1,1,3,1,'rgba(255,255,255,.2)');T(10,7,4,1,'rgba(0,0,0,.2)');
    face('#5f4529','#3f2e1a');P(7,10,2,6,'#3f2e1a');P(2,11,2,2,'#2a1d10');P(12,11,2,2,'#2a1d10');P(0,12,TL,1,'rgba(0,0,0,.25)')}
  else if(k==='barrel'){const c0=R()<.5?'#8a342c':'#4f6676',c1=adj(c0,-34),c2=adj(c0,30);
    gt.fillStyle=c1;gt.beginPath();gt.ellipse(X+8,Y+5.5,7,5.5,0,0,6.3);gt.fill();gt.fillStyle=c0;gt.beginPath();gt.ellipse(X+8,Y+5,6.2,4.6,0,0,6.3);gt.fill();
    gt.strokeStyle=c2;gt.lineWidth=1;gt.beginPath();gt.ellipse(X+8,Y+5,4.4,3,0,0,6.3);gt.stroke();gt.fillStyle='rgba(255,255,255,.4)';gt.fillRect(X+5,Y+3,2,1);gt.fillStyle=c1;gt.fillRect(X+7,Y+4,2,2);
    const q=g.createLinearGradient(X+1,0,X+15,0);q.addColorStop(0,adj(c0,-30));q.addColorStop(.4,adj(c0,18));q.addColorStop(1,adj(c0,-48));g.fillStyle=q;g.fillRect(X+1,Y+6,14,9);
    P(1,8,14,1,'rgba(0,0,0,.35)');P(1,12,14,1,'rgba(0,0,0,.35)');P(2,9,2,1,'rgba(255,255,255,.25)');P(2,13,2,1,'rgba(255,255,255,.2)');P(2,14,12,1,'rgba(0,0,0,.5)')}
  else if(k==='fridge'){cap('#e7f0f4');T(2,6,12,2,'#4a90c0');T(3,2,5,1,'rgba(255,255,255,.9)');
    face('#a8bac4','#7a8e99');P(6,11,4,3,'#c7ecff');P(6,11,4,1,'#fff');P(1,11,1,4,'#fff');P(13,10,2,5,'#6a8190');P(11,11,1,4,'#eaf4f8')}
  else if(k==='centr'){cap('#93a2ac');gt.fillStyle='#34424c';gt.beginPath();gt.arc(X+8,Y+5,5.6,0,6.3);gt.fill();gt.fillStyle='#5e707c';gt.beginPath();gt.arc(X+8,Y+5,3.6,0,6.3);gt.fill();gt.fillStyle='#aebfc9';gt.beginPath();gt.arc(X+7,Y+4,1.6,0,6.3);gt.fill();
    T(7,4,2,2,'#dfe9ee');T(1,1,2,2,'#e0453a');T(13,1,2,2,'#e5a93b');
    face('#51606a','#36434c');P(3,12,2,2,'#3fd68a');P(7,12,2,2,'#e5a93b');P(11,12,2,2,'#4a90c0');P(3,12,2,1,'#9fffbf')}
  else if(k==='chamber'){cap('#1d3a36');const gr=gt.createRadialGradient(X+7,Y+4,1,X+8,Y+5,7.5);gr.addColorStop(0,'#e4fff6');gr.addColorStop(.45,'#3fe0a4');gr.addColorStop(1,'#0e4a3b');gt.fillStyle=gr;gt.beginPath();gt.arc(X+8,Y+5,6.6,0,6.3);gt.fill();
    gt.strokeStyle='#0a1d19';gt.lineWidth=1;gt.beginPath();gt.arc(X+8,Y+5,6.9,0,6.3);gt.stroke();gt.fillStyle='rgba(255,255,255,.55)';gt.beginPath();gt.ellipse(X+6,Y+3,2,1,-.5,0,6.3);gt.fill();
    face('#16302c','#0d1f1c');P(3,11,10,3,'#47e0a8');P(5,11,2,3,'#e4fff6');P(3,11,10,1,'#b8ffe6');P(11,12,1,1,'#e0453a')}
  else if(k==='locker'){cap('#6f7d88',7);face('#4b5964','#303b44',7);
    for(let i=0;i<3;i++){const x0=1+i*5;P(x0,8,4,7,'#34414b');P(x0,8,4,1,'#6a7b88');P(x0,8,1,7,'#5b6c79');P(x0+1,9,2,1,'#0e1418');P(x0+1,10,2,1,'#0e1418');P(x0+3,12,1,1,'#dfe9ee')}}
}
