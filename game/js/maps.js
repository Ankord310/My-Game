'use strict';
// Объёмные карты (вид сверху под углом): город для этапов 2–3, страна для этапа 4.
// Свет — с запада: западные грани светлее южных, тени падают на восток/юг.
const Maps={};
Maps.mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
Maps.hash=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177)|0;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
Maps.vn=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=Maps.hash(xi,yi,s),b=Maps.hash(xi+1,yi,s),c=Maps.hash(xi,yi+1,s),d=Maps.hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
Maps.fbm=(x,y,s,o)=>{o=o||4;let a=.5,f=1,t=0,n=0;for(let i=0;i<o;i++){t+=a*Maps.vn(x*f,y*f,s+i*17);n+=a;a*=.5;f*=2.03}return t/n};
const _cc={};
Maps.rgb=h=>_cc[h]||(_cc[h]=[parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]);
Maps.sh=(h,k)=>{const c=Maps.rgb(h);return'rgb('+Math.min(255,Math.round(c[0]*k))+','+Math.min(255,Math.round(c[1]*k))+','+Math.min(255,Math.round(c[2]*k))+')'};
Maps.mixc=(a,b,t)=>{const A=Maps.rgb(a),B=Maps.rgb(b);return'rgb('+Math.round(A[0]+(B[0]-A[0])*t)+','+Math.round(A[1]+(B[1]-A[1])*t)+','+Math.round(A[2]+(B[2]-A[2])*t)+')'};
Maps.lerpc=(A,B,t)=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t];
Maps.poly=(g,p)=>{g.beginPath();g.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)g.lineTo(p[i][0],p[i][1]);g.closePath();g.fill()};
Maps.sstep=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};

// ---------------------------------------------------------------- здание-параллелепипед
Maps.shadow=(g,x,y,w,h,ht,a)=>{const dx=Math.round(ht*.55+1),dy=Math.round(ht*.32+1);g.fillStyle='rgba(0,0,0,'+(a==null?.34:a)+')';
  g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.lineTo(x+w+dx,y+dy);g.lineTo(x+w+dx,y+h+dy);g.lineTo(x+dx,y+h+dy);g.lineTo(x,y+h);g.closePath();g.fill()};
// o: c — цвет крыши, rn — генератор, roof — вид крыши, lit — доля горящих окон, lean — наклон крыши, ant — антенна, lights — сюда пишутся мигающие огни
Maps.box=(g,x,y,w,h,ht,o)=>{
  x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);ht=Math.max(1,Math.round(ht));
  const rn=o.rn||Math.random,ox=Math.round(ht*(o.lean==null?.3:o.lean)),rc=o.c,S=o.fs||Maps.sh(rc,.44),Wc=o.fw||Maps.sh(rc,.66);
  g.fillStyle=Wc;for(let z=0;z<ht;z++)g.fillRect(x+Math.round(ox*z/ht),y-z,1,h);
  g.fillStyle=S;for(let z=0;z<ht;z++)g.fillRect(x+Math.round(ox*z/ht),y+h-1-z,w,1);
  g.fillStyle='rgba(255,255,255,.16)';for(let z=0;z<ht;z++)g.fillRect(x+Math.round(ox*z/ht),y+h-1-z,1,1);
  g.fillStyle='rgba(0,0,0,.28)';g.fillRect(x,y+h-1,w,1);
  const K=g.K||1,e=1/K;
  if(K>1&&o.win!==false&&ht>=5){ // детальные окна: мелкая сетка, подоконники, этажные пояса
    const lit=o.lit==null?.42:o.lit,wc=o.wc||['#f4d68a','#ffe9ae','#a8e6ff'];
    for(let z=1.5,fl=0;z<ht-1;z+=2,fl++){const sx=ox*z/ht;
      if(fl%3===2){g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x+sx,y+h-1.5-z+1.5,w,e);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x+sx,y+h-1.5-z+1.5+e,w,e)}
      for(let wx=1.5;wx<w-1.5;wx+=2){const on=rn()<lit;g.fillStyle=on?wc[(rn()*wc.length)|0]:(rn()<.3?'#16222d':'#0a131b');g.fillRect(x+sx+wx,y+h-1.5-z,1,1);
        if(on){g.fillStyle='rgba(255,255,255,.35)';g.fillRect(x+sx+wx,y+h-1.5-z,e,e)}else if(rn()<.08){g.fillStyle='rgba(120,170,200,.25)';g.fillRect(x+sx+wx,y+h-1.5-z,1,e)}}
      for(let d=1.5;d<h-1.5;d+=2){g.fillStyle=rn()<lit*.7?'#c99a44':'#0b141c';g.fillRect(x+sx,y+d-z-1,e*2,1)}}}
  else if(o.win!==false&&ht>=5){
    const lit=o.lit==null?.42:o.lit,wc=o.wc||['#f4d68a','#ffe9ae','#a8e6ff'];
    for(let z=2;z<ht-1;z+=3){const sx=Math.round(ox*z/ht);
      for(let wx=2;wx<w-2;wx+=3){g.fillStyle=rn()<lit?wc[(rn()*wc.length)|0]:'#0a131b';g.fillRect(x+sx+wx,y+h-2-z,2,2)}
      for(let d=2;d<h-2;d+=3){g.fillStyle=rn()<lit*.7?'#b98d3c':'#0b141c';g.fillRect(x+sx,y+d-z-1,1,2)}}}
  const rx=x+ox,ry=y-ht;
  g.fillStyle=rc;g.fillRect(rx,ry,w,h);
  const R=o.roof||'flat';
  if(R==='green'){g.fillStyle='#2b5d42';g.fillRect(rx+1,ry+1,w-2,h-2);for(let i=0;i<w*h/6;i++){g.fillStyle=rn()<.5?'#3c7a55':'#22503a';g.fillRect(rx+1+((rn()*(w-2))|0),ry+1+((rn()*(h-2))|0),1,1)}}
  else if(R==='solar'){for(let py=ry+2;py<ry+h-2;py+=3)for(let px=rx+2;px<rx+w-4;px+=5){g.fillStyle='#1d5276';g.fillRect(px,py,4,2);g.fillStyle='#55a4cc';g.fillRect(px,py,4,1)}}
  else if(R==='saw'){for(let px=rx+1;px<rx+w-2;px+=4){g.fillStyle=Maps.sh(rc,1.32);g.fillRect(px,ry+1,2,h-2);g.fillStyle=Maps.sh(rc,.72);g.fillRect(px+2,ry+1,1,h-2)}}
  else if(R==='gable'){const m=h>>1;g.fillStyle=Maps.sh(rc,1.22);g.fillRect(rx,ry,w,m);g.fillStyle=Maps.sh(rc,.74);g.fillRect(rx,ry+m,w,h-m);g.fillStyle=Maps.sh(rc,1.5);g.fillRect(rx,ry+m-1,w,1);
    if(w>6&&rn()<.6){g.fillStyle='#2a2f35';g.fillRect(rx+2+((rn()*(w-5))|0),ry-1,1,2)}}
  else if(R==='arch'){for(let i=0;i<h;i++){const k=Math.sin((i+.5)/h*Math.PI);g.fillStyle=Maps.sh(rc,.8+.5*k);g.fillRect(rx,ry+i,w,1)}g.fillStyle='rgba(0,0,0,.25)';for(let px=rx+3;px<rx+w-1;px+=5)g.fillRect(px,ry,1,h)}
  else if(R==='pad'){const cxp=rx+(w>>1),cyp=ry+(h>>1),r=Math.min(w,h)/2-2;g.fillStyle='#23323d';g.beginPath();g.arc(cxp,cyp,r,0,6.3);g.fill();g.strokeStyle='#e5c53b';g.lineWidth=1;g.beginPath();g.arc(cxp,cyp,r-.5,0,6.3);g.stroke();g.fillStyle='#e5c53b';g.fillRect(cxp-2,cyp-2,1,5);g.fillRect(cxp+1,cyp-2,1,5);g.fillRect(cxp-2,cyp,4,1)}
  else if(R==='tank'){const r=Math.min(w,h)/2;g.fillStyle=Maps.sh(rc,.9);g.beginPath();g.arc(rx+w/2,ry+h/2,r,0,6.3);g.fill();g.fillStyle=Maps.sh(rc,1.3);g.beginPath();g.arc(rx+w/2-r*.25,ry+h/2-r*.25,r*.55,0,6.3);g.fill()}
  else if(R==='ac'||R==='flat'){const n=R==='ac'?1+((rn()*3)|0):0;for(let k=0;k<n;k++){const ax=rx+2+((rn()*Math.max(1,w-6))|0),ay=ry+2+((rn()*Math.max(1,h-5))|0);g.fillStyle='#16222c';g.fillRect(ax,ay+1,3,2);g.fillStyle='#4a6378';g.fillRect(ax,ay,3,1)}}
  g.fillStyle=Maps.sh(rc,1.35);g.fillRect(rx,ry,w,1);g.fillRect(rx,ry,1,h);
  g.fillStyle=Maps.sh(rc,.62);g.fillRect(rx+w-1,ry,1,h);g.fillRect(rx,ry+h-1,w,1);
  if(K>1&&w>=6&&h>=5){ // парапет, швы кровли, вентиляция
    g.fillStyle=Maps.sh(rc,1.12);g.fillRect(rx+1,ry+1,w-2,e);g.fillRect(rx+1,ry+1,e,h-2);g.fillStyle=Maps.sh(rc,.8);g.fillRect(rx+1,ry+h-1-e,w-2,e);g.fillRect(rx+w-1-e,ry+1,e,h-2);
    if(R!=='pad'&&R!=='tank'&&R!=='arch'){g.fillStyle='rgba(0,0,0,.12)';for(let px=rx+3;px<rx+w-2;px+=3)g.fillRect(px,ry+1,e,h-2);
      if(rn()<.5&&w>8&&h>7){const vx=rx+2+((rn()*(w-6))|0),vy=ry+2+((rn()*(h-5))|0);g.fillStyle='#0f1a22';g.fillRect(vx,vy,2,1.5);g.fillStyle='#6f8798';g.fillRect(vx,vy,2,.5);g.fillStyle='#c8d6df';g.fillRect(vx+.5,vy+.5,1,e)}}}
  if(o.ant){g.fillStyle='#9fb0bc';g.fillRect(rx+(w>>1),ry-o.ant,1,o.ant);if(o.lights)o.lights.push({x:rx+(w>>1),y:ry-o.ant-1})}
  return{rx,ry}};
Maps.tree=(g,x,y,r,rn,pal)=>{pal=pal||['#173f2c','#2c6c48','#66b27c'];x=Math.round(x);y=Math.round(y);const K=g.K||1;
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x+r*.55,y+1,r*.95,r*.42,0,0,6.3);g.fill();
  g.fillStyle='#3a2a1e';g.fillRect(x,y-3,1,3);const cy=y-3-r*.75;
  g.fillStyle=pal[0];g.beginPath();g.arc(x,cy,r,0,6.3);g.fill();
  g.fillStyle=pal[1];g.beginPath();g.arc(x-r*.25,cy-r*.28,r*.66,0,6.3);g.fill();
  g.fillStyle=pal[2];g.fillRect(Math.round(x-r*.5),Math.round(cy-r*.55),Math.max(1,Math.round(r*.4)),1);
  if(K>1)for(let i=0;i<r*7;i++){const a=rn()*6.3,d=Math.sqrt(rn())*r*.95;g.fillStyle=rn()<.5?pal[2]:'rgba(0,0,0,.3)';g.fillRect(Math.round((x+Math.cos(a)*d)*K)/K,Math.round((cy+Math.sin(a)*d*.9)*K)/K,1/K,1/K)}};
Maps.chimney=(g,x,y,ht,r)=>{x=Math.round(x);y=Math.round(y);
  g.fillStyle='rgba(0,0,0,.3)';Maps.poly(g,[[x-r,y],[x+r,y],[x+r+ht*.5,y+ht*.3],[x-r+ht*.5,y+ht*.3]]);
  for(let i=0;i<r*2;i++){const k=i/(r*2-1);g.fillStyle=Maps.mixc('#7a6a60','#2e2826',k*k);g.fillRect(x-r+i,y-ht,1,ht)}
  g.fillStyle='#a4382e';g.fillRect(x-r,y-ht,r*2,1);g.fillStyle='#e8e0d8';g.fillRect(x-r,y-ht+3,r*2,1);g.fillStyle='#0c0a0a';g.beginPath();g.ellipse(x,y-ht,r,r*.45,0,0,6.3);g.fill()};
Maps.container=(g,x,y,w,h,ht,col,rn)=>{ // контейнер/ящик: цветной брусок с рёбрами
  x=Math.round(x);y=Math.round(y);const ox=Math.round(ht*.3);
  g.fillStyle='rgba(0,0,0,.28)';g.fillRect(x+ox+1,y+h-ht+1,w,h);
  g.fillStyle=Maps.sh(col,.68);for(let z=0;z<ht;z++)g.fillRect(x+Math.round(ox*z/ht),y-z,1,h);
  g.fillStyle=Maps.sh(col,.46);for(let z=0;z<ht;z++)g.fillRect(x+Math.round(ox*z/ht),y+h-1-z,w,1);
  g.fillStyle=col;g.fillRect(x+ox,y-ht,w,h);g.fillStyle='rgba(255,255,255,.22)';g.fillRect(x+ox,y-ht,w,1);
  g.fillStyle='rgba(0,0,0,.25)';for(let i=2;i<w;i+=2)g.fillRect(x+ox+i,y-ht,1,h)};
// заграждение блокпоста: полосатый брус и мешки
Maps.barrier=(g,x,y,w,t)=>{x=Math.round(x);y=Math.round(y);
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x+2,y+2,w,3);
  g.fillStyle='#2b2f33';g.fillRect(x,y-1,w,4);
  for(let i=0;i<w;i+=4){g.fillStyle='#e5c53b';g.fillRect(x+i,y-3,2,3);g.fillStyle='#16191c';g.fillRect(x+i+2,y-3,2,3)}
  g.fillStyle='#fff3a8';g.fillRect(x,y-3,w,1);
  g.fillStyle='#6f6a52';for(let i=0;i<w-2;i+=3){g.fillRect(x+i,y+3,3,2);g.fillStyle='#8b856a';g.fillRect(x+i,y+3,3,1);g.fillStyle='#6f6a52'}
  if(t!=null&&Math.floor(t*3)%2){g.fillStyle='#ff3b2f';g.fillRect(x+w-1,y-5,2,2)}};
// мост через реку: настил с перилами, опорами и тенью на воде
Maps.bridge=(L,Wd)=>{
  const c=Maps.mk(L+10,Wd+16),g=c.getContext('2d'),x=4,y=6,ht=3;
  g.fillStyle='rgba(0,0,0,.4)';g.fillRect(x+3,y+Wd+3,L,Wd);
  for(const px of[.22,.5,.78]){const q=Math.round(x+L*px);g.fillStyle='#1d2d38';g.fillRect(q,y+Wd-1,4,6);g.fillStyle='#34495a';g.fillRect(q,y+Wd-1,1,6);g.fillStyle='rgba(190,230,245,.35)';g.fillRect(q-1,y+Wd+5,6,1)}
  Maps.box(g,x,y,L,Wd,ht,{c:'#4a5966',win:false,roof:'flat',rn:Math.random});
  const rx=x+1,ry=y-ht;g.fillStyle='#2a343c';g.fillRect(rx,ry+2,L,Wd-4);
  g.fillStyle='#a58a2a';g.fillRect(rx+2,ry+(Wd>>1),L-4,1);g.fillStyle='#16202a';for(let i=3;i<L-3;i+=6)g.fillRect(rx+i,ry+(Wd>>1),3,1);
  g.fillStyle='#9fb4c2';g.fillRect(rx,ry,L,1);g.fillRect(rx,ry+Wd-1,L,1);
  for(let i=0;i<L;i+=6){g.fillStyle='#c4d4de';g.fillRect(rx+i,ry-1,1,2);g.fillRect(rx+i,ry+Wd-2,1,2)}
  for(const q of[2,L-3]){g.fillStyle='#252c30';g.fillRect(rx+q,ry-5,1,6);g.fillStyle='#ffd98a';g.fillRect(rx+q-1,ry-6,3,1)}
  return c};

// ---------------------------------------------------------------- дымка заражения (мягкие маски по районам)
Maps.Haze=function(w,h,sc){this.w=w;this.h=h;this.sc=sc;this.gw=Math.ceil(w/sc);this.gh=Math.ceil(h/sc);this.cv=Maps.mk(this.gw,this.gh);this.g=this.cv.getContext('2d');this.im=this.g.createImageData(this.gw,this.gh);this.masks=[]};
Maps.Haze.prototype={
  addMask(fn){const m=new Float32Array(this.gw*this.gh);let x0=1e9,y0=1e9,x1=-1,y1=-1;
    for(let gy=0;gy<this.gh;gy++)for(let gx=0;gx<this.gw;gx++){const v=fn((gx+.5)*this.sc,(gy+.5)*this.sc);m[gy*this.gw+gx]=v;if(v>.02){if(gx<x0)x0=gx;if(gx>x1)x1=gx;if(gy<y0)y0=gy;if(gy>y1)y1=gy}}
    this.masks.push({m,x0,y0,x1,y1});return this.masks.length-1},
  // inf[i] 0..1; o.a — прозрачность, o.c1 — внешний цвет, o.c2 — тёмное «ядро»
  render(g,inf,t,o){
    o=o||{};const d=this.im.data,gw=this.gw,A=o.a==null?.55:o.a,c1=o.c1||[222,60,52],c2=o.c2||[110,14,22],sp=o.sp||1;let any=false;
    d.fill(0);
    for(let i=0;i<this.masks.length;i++){const M=this.masks[i],f=inf[i];if(!(f>.02)||M.x1<0)continue;any=true;
      for(let gy=M.y0;gy<=M.y1;gy++)for(let gx=M.x0;gx<=M.x1;gx++){const k=gy*gw+gx,w=M.m[k];if(w<.02)continue;
        const n=Maps.vn(gx*.2+t*.33*sp,gy*.2-t*.22*sp,3)*.65+Maps.vn(gx*.45-t*.4*sp,gy*.45+t*.3*sp,8)*.35;
        const a=Math.max(0,Math.min(1,(w*(f*1.15+.04)+(n-.5)*.8-.26)*2.2));if(a<.02)continue;
        const q=k*4,core=Math.max(0,Math.min(1,(a-.55)*2.2));d[q]=Math.min(255,d[q]+c1[0]+(c2[0]-c1[0])*core);d[q+1]=Math.min(255,d[q+1]+c1[1]+(c2[1]-c1[1])*core);d[q+2]=Math.min(255,d[q+2]+c1[2]+(c2[2]-c1[2])*core);d[q+3]=Math.min(255,d[q+3]+a*255*A)}}
    if(!any)return;
    this.g.putImageData(this.im,0,0);g.save();g.imageSmoothingEnabled=true;g.drawImage(this.cv,0,0,this.gw,this.gh,0,0,this.w,this.h);g.restore();g.imageSmoothingEnabled=false}
};

// ---------------------------------------------------------------- город
Maps.PAL={
  res:['#33506a','#3b5a76','#2c4660','#456680','#3d546c','#4c5a6c'],
  down:['#40647f','#4a7592','#375a74','#547c98','#5d819a'],
  ind:['#3e444c','#484f56','#383e46','#524c46','#434a52'],
  sub:['#554a58','#5c4a50','#47545c','#4d5a64','#5e5050','#4a5560'],
  mix:['#30475e','#38546e','#2b3f52','#3f5a70','#3d4e60','#4a4350']
};
Maps.bakeCity=function(o){
  const W=o.w,H=o.h,K=o.K||1,e=1/K,rn=mulberry(o.seed||5),c=Maps.mk(W*K,H*K),g=c.getContext('2d'),items=[],lamps=[],lights=[],hys=o.hy,vxs=o.vx,R0=o.rv0,R1=o.rv1,wat=new Float32Array(W*H);
  // --- земля и вода
  const im=g.createImageData(W,H),d=im.data;
  for(let y=0;y<H;y++){const a=R0?R0(y):0,b=R0?R1(y):-1;
    for(let x=0;x<W;x++){let dep=0;if(R0&&x>=a&&x<=b){const u=(x-a)/Math.max(1,b-a);dep=Math.max(.06,Math.sin(u*Math.PI))}
      if(o.sea){const v=o.sea(x,y);if(v>dep)dep=v}
      wat[y*W+x]=dep;const q=(y*W+x)*4;let r,gg,bb;
      if(dep>0){const k=Maps.sstep(0,.9,dep),st=(Maps.vn(x*.04,y*.5,9)-.5)*12+(Maps.hash(x,y,2)-.5)*5;r=16-10*k+st*.5;gg=88-46*k+st*.8;bb=114-52*k+st}
      else{const g0=o.ground(x,y),n=(Maps.vn(x*.1,y*.1,3)-.5)*9+(Maps.hash(x,y,1)-.5)*5;r=g0[0]+n;gg=g0[1]+n;bb=g0[2]+n}
      d[q]=r;d[q+1]=gg;d[q+2]=bb;d[q+3]=255}}
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const k=y*W+x,q=k*4;
    if(wat[k]>0){if(wat[k-1]===0||wat[k+1]===0||wat[k-W]===0||wat[k+W]===0){d[q]=d[q]*.5+88;d[q+1]=d[q+1]*.5+110;d[q+2]=d[q+2]*.5+120}continue}
    let near=0;for(let r=1;r<=2&&!near;r++){if(wat[k-r]>0||wat[k+r]>0||wat[k-r*W]>0||wat[k+r*W]>0)near=r}
    if(near===1){d[q]=64;d[q+1]=86;d[q+2]=102}else if(near===2){d[q]=36;d[q+1]=58;d[q+2]=72}}
  if(K>1){const tc=Maps.mk(W,H);tc.getContext('2d').putImageData(im,0,0);g.imageSmoothingEnabled=false;g.drawImage(tc,0,0,W*K,H*K);
    // мелкое зерно земли и блики воды в разрешении холста
    const hi=g.getImageData(0,0,W*K,H*K),hd=hi.data,HW=W*K;
    for(let Y=0;Y<H*K;Y++)for(let X=0;X<HW;X++){const q=(Y*HW+X)*4,n=(Maps.hash(X,Y,11)-.5)*7,wv=wat[((Y/K)|0)*W+((X/K)|0)]>0;
      hd[q]+=n;hd[q+1]+=n;hd[q+2]+=n;
      if(wv&&Maps.hash(X>>1,Y,13)>.965&&Maps.vn(X*.05,Y*.18,4)>.55){hd[q]+=60;hd[q+1]+=84;hd[q+2]+=96}}
    g.putImageData(hi,0,0)}
  else g.putImageData(im,0,0);
  g.K=K;g.setTransform(K,0,0,K,0,0);
  const water=(x,y)=>wat[Math.max(0,Math.min(H-1,y|0))*W+Math.max(0,Math.min(W-1,x|0))]>0;
  const hband=y=>hys.some(r=>Math.abs(y-r.y)<=r.w/2),vband=x=>vxs.some(r=>Math.abs(x-r.x)<=r.w/2);
  // --- дороги
  const ASP='#15212b',CURB='#26394a';
  for(const r of hys){const y0=Math.round(r.y-r.w/2);let x=0;
    while(x<W){while(x<W&&water(x,r.y))x++;const s=x;while(x<W&&!water(x,r.y))x++;if(x>s){
      g.fillStyle=ASP;g.fillRect(s,y0,x-s,r.w);g.fillStyle=CURB;g.fillRect(s,y0,x-s,1);g.fillRect(s,y0+r.w-1,x-s,1);
      for(let px=s;px<x;px++){if(r.maj){if(px%12<8){g.fillStyle='#9c8222';g.fillRect(px,r.y-1,1,1);g.fillRect(px,r.y,1,1)}}else if(px%6<3){g.fillStyle='#3e505c';g.fillRect(px,r.y,1,1)}}}}}
  for(const r of vxs){const x0=Math.round(r.x-r.w/2);let y=0;
    while(y<H){while(y<H&&water(r.x,y))y++;const s=y;while(y<H&&!water(r.x,y))y++;if(y>s){
      g.fillStyle=ASP;g.fillRect(x0,s,r.w,y-s);
      for(let py=s;py<y;py++){if(hband(py))continue;g.fillStyle=CURB;g.fillRect(x0,py,1,1);g.fillRect(x0+r.w-1,py,1,1);
        if(r.maj){if(py%12<8){g.fillStyle='#9c8222';g.fillRect(r.x-1,py,1,1);g.fillRect(r.x,py,1,1)}}else if(py%6<3){g.fillStyle='#3e505c';g.fillRect(r.x,py,1,1)}}}}}
  for(const a of hys)for(const b of vxs){if(!(a.maj&&b.maj)||water(b.x,a.y))continue;g.fillStyle='rgba(215,228,235,.3)';
    for(const sx of[-1,1])for(let i=0;i<3;i++)g.fillRect(b.x+sx*(b.w/2+2+i*2)-(sx<0?1:0),a.y-a.w/2+1,1,a.w-2);
    for(const sy of[-1,1])for(let i=0;i<3;i++)g.fillRect(b.x-b.w/2+1,a.y+sy*(a.w/2+2+i*2)-(sy<0?1:0),b.w-2,1)}
  if(K>1){ // фактура асфальта: заплатки, трещины, люки, разметка тоньше, припаркованные машины
    for(const r of hys)for(let i=0;i<W*r.w/9;i++){const x=rn()*W,y=r.y+(rn()-.5)*(r.w-2);if(water(x,y))continue;g.fillStyle=rn()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.22)';g.fillRect(x,y,rn()<.2?2:1/K,rn()<.2?1:1/K)}
    for(const r of vxs)for(let i=0;i<H*r.w/9;i++){const x=r.x+(rn()-.5)*(r.w-2),y=rn()*H;if(water(x,y)||hband(y))continue;g.fillStyle=rn()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.22)';g.fillRect(x,y,rn()<.2?1:1/K,rn()<.2?2:1/K)}
    for(const r of hys)for(let x=10;x<W-10;x+=26+((rn()*14)|0)){if(water(x,r.y)||vband(x))continue;g.fillStyle='#0a1218';g.beginPath();g.arc(x,r.y+(rn()<.5?-1:1)*(r.w/4),1,0,6.3);g.fill();g.fillStyle='rgba(120,150,170,.25)';g.fillRect(x-.5,r.y-r.w/4-.5+(rn()<.5?0:r.w/2),1,e)}
    const CARS=['#7a2d2d','#2d4f7a','#9aa6ad','#c4b46a','#35684a','#59595f'];
    for(const r of hys){if(r.maj)continue;for(let x=14;x<W-14;x+=18+((rn()*20)|0)){if(water(x,r.y)||vband(x)||vband(x+5))continue;const side=rn()<.5?-1:1,y=r.y+side*(r.w/2-1.4),col=CARS[(rn()*CARS.length)|0];
      items.push({y:y+1,dr:gg=>{gg.fillStyle='rgba(0,0,0,.4)';gg.fillRect(x+.5,y+.5,5,2);gg.fillStyle=Maps.sh(col,.6);gg.fillRect(x,y,5,2);gg.fillStyle=col;gg.fillRect(x,y-.5,5,1.5);gg.fillStyle='rgba(180,220,240,.55)';gg.fillRect(x+1.5,y-.5,2,1);gg.fillStyle='rgba(255,255,255,.3)';gg.fillRect(x,y-.5,5,e)}})}}}
  // --- уличные фонари на перекрёстках
  for(const a of hys)for(const b of vxs){if(water(b.x,a.y)||((a.y*7+b.x*3)%3===0&&!(a.maj&&b.maj)))continue;
    const px=Math.round(b.x+b.w/2+1),py=Math.round(a.y+a.w/2+1);if(water(px,py)||px>=W-2||py>=H-2)continue;lamps.push({x:px,y:py-7});
    const gr=g.createRadialGradient(px-2,py-3,1,px-2,py-3,17);gr.addColorStop(0,'rgba(255,210,130,.2)');gr.addColorStop(1,'rgba(255,210,130,0)');g.save();g.globalCompositeOperation='lighter';g.fillStyle=gr;g.fillRect(px-20,py-20,40,40);g.restore();
    items.push({y:py,dr:gg=>{gg.fillStyle='rgba(0,0,0,.35)';gg.fillRect(px+1,py,3,1);gg.fillStyle='#5a6772';gg.fillRect(px,py-7,1,7);gg.fillStyle='#ffe2a0';gg.fillRect(px-1,py-8,3,1);gg.fillStyle='#fff6d6';gg.fillRect(px,py-8,1,1)}})}
  // --- кварталы
  const addB=(x,y,w,h,ht,col,op)=>{op=op||{};op.rn=mulberry((rn()*1e9)|0);op.c=col;op.lights=lights;items.push({y:y+h,sh:gg=>Maps.shadow(gg,x,y,w,h,ht),dr:gg=>Maps.box(gg,x,y,w,h,ht,op)})};
  const addT=(x,y,r,col)=>{items.push({y,dr:gg=>Maps.tree(gg,x,y,r,rn,col)})};
  const GR=[['#173f2c','#2c6c48','#66b27c'],['#1a4630','#337850','#76c28c'],['#244a2a','#4a7f3e','#98c070']];
  const pickp=k=>{const p=Maps.PAL[k]||Maps.PAL.mix;return p[(rn()*p.length)|0]};
  const lotsOf=(b,n)=>{const m=2,x=b.x0+m,y=b.y0+m,w=b.x1-b.x0-2*m,h=b.y1-b.y0-2*m,g2=2;
    if(n<=1||w<14&&h<14)return[[x,y,w,h]];
    if(n===2){return w>=h?[[x,y,(w-g2)>>1,h],[x+((w-g2)>>1)+g2,y,w-((w-g2)>>1)-g2,h]]:[[x,y,w,(h-g2)>>1],[x,y+((h-g2)>>1)+g2,w,h-((h-g2)>>1)-g2]]}
    const hw=(w-g2)>>1,hh=(h-g2)>>1;return[[x,y,hw,hh],[x+hw+g2,y,w-hw-g2,hh],[x,y+hh+g2,hw,h-hh-g2],[x+hw+g2,y+hh+g2,w-hw-g2,h-hh-g2]]};
  const pave=(b,col,edge)=>{g.fillStyle=col;g.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);g.fillStyle=edge||'rgba(120,160,185,.12)';g.fillRect(b.x0,b.y0,b.x1-b.x0,1);g.fillRect(b.x0,b.y0,1,b.y1-b.y0)};
  const grass=(b,col,col2)=>{g.fillStyle=col;g.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);for(let i=0;i<(b.x1-b.x0)*(b.y1-b.y0)/9;i++){g.fillStyle=rn()<.5?col2:'rgba(0,0,0,.18)';g.fillRect(b.x0+((rn()*(b.x1-b.x0))|0),b.y0+((rn()*(b.y1-b.y0))|0),1,1)}};
  const spots=(b,n,out)=>{ // свободные точки для деревьев (вне занятых прямоугольников)
    const pts=[];for(let t=0;t<n*8&&pts.length<n;t++){const x=b.x0+3+rn()*(b.x1-b.x0-6),y=b.y0+5+rn()*(b.y1-b.y0-7);if(out.some(r=>x>r[0]-2&&x<r[0]+r[2]+r[3]*.2+2&&y>r[1]-3&&y<r[1]+r[3]+2))continue;pts.push([x,y])}return pts};
  const T={
    res(b){pave(b,'#101c26');const L=lotsOf(b,2+((rn()*3)|0));
      for(const l of L){const ht=6+rn()*6;addB(l[0],l[1],l[2],l[3],ht,pickp('res'),{roof:rn()<.55?'ac':rn()<.5?'flat':'solar',lit:.4,ant:rn()<.12?4:0})}
      for(const p of spots(b,2+((rn()*3)|0),L))addT(p[0],p[1],2+rn()*1.5,GR[(rn()*3)|0])},
    down(b){pave(b,'#142431');const L=lotsOf(b,rn()<.55?1:2);let first=true;
      for(const l of L){const ht=13+rn()*12;const col=pickp('down'),op={roof:'flat',lit:.5,ant:rn()<.7?7:0,lean:.28};
        const x=l[0],y=l[1],w=l[2],h=l[3],r2=mulberry((rn()*1e9)|0),ht2=4+rn()*5,pad=first&&rn()<.4;first=false;op.rn=mulberry((rn()*1e9)|0);op.c=col;op.lights=lights;
        items.push({y:y+h,sh:gg=>{Maps.shadow(gg,x,y,w,h,ht+4)},dr:gg=>{const r=Maps.box(gg,x,y,w,h,ht,op);
          if(w>10&&h>10)Maps.box(gg,r.rx+2,r.ry+2,w-4,h-4,ht2,{c:Maps.sh(col,1.1),rn:r2,lit:.55,roof:pad?'pad':'flat',ant:pad?0:5,lights})}})}
      for(const p of spots(b,2,L))addT(p[0],p[1],2,GR[0])},
    ind(b){pave(b,'#1a1e22','rgba(170,150,110,.1)');const w=b.x1-b.x0-4,h=b.y1-b.y0-4;
      const k=rn();
      if(k<.6){const lw=(w*.62)|0;addB(b.x0+2,b.y0+2,lw,(h*.55)|0,5+rn()*2,pickp('ind'),{roof:'saw',lit:.1});
        items.push({y:b.y0+h-1,dr:gg=>{Maps.chimney(gg,b.x0+lw+7,b.y0+(h*.5),14+rn()*6,2)}});
        for(let i=0;i<3;i++){const cxp=b.x0+3+i*11;if(cxp+9<b.x1)addB(cxp,b.y0+h-12,9,9,4,'#667078',{roof:'tank',win:false})}}
      else{for(let i=0;i<(w/9|0);i++)for(let j=0;j<(h/6|0);j++){if(rn()<.2)continue;const col=['#b5402f','#2f6aa0','#c9862b','#3c8a5a','#8a8f96'][(rn()*5)|0];const x=b.x0+2+i*9,y=b.y0+4+j*6;items.push({y:y+3+j*0.01,dr:gg=>Maps.container(gg,x,y,8,4,3+(rn()<.3?3:0),col,rn)})}}},
    sub(b){grass(b,'#0f2a21','#17402f');const cols=Math.max(1,((b.x1-b.x0)/12)|0),rows=Math.max(1,((b.y1-b.y0)/12)|0),cw=(b.x1-b.x0)/cols,ch=(b.y1-b.y0)/rows,occ=[];
      for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){if(rn()<.1)continue;const w=Math.min(cw-2,6+((rn()*3)|0)),h=Math.min(ch-2,5+((rn()*3)|0)),x=b.x0+i*cw+(cw-w)/2,y=b.y0+j*ch+(ch-h)/2+1;occ.push([x,y,w,h]);
        addB(x,y,w,h,3+rn()*1.5,pickp('sub'),{roof:'gable',lean:.25,lit:.5})}
      for(const p of spots(b,3+((rn()*3)|0),occ))addT(p[0],p[1],1.8+rn(),GR[(rn()*3)|0])},
    park(b){grass(b,'#11301f','#1b4a30');const bw=b.x1-b.x0,bh=b.y1-b.y0;
      g.fillStyle='rgba(120,100,70,.35)';g.fillRect(b.x0+2,b.y0+(bh>>1),bw-4,1);g.fillRect(b.x0+(bw>>1),b.y0+2,1,bh-4);
      if(rn()<.55){const px=b.x0+bw*.5,py=b.y0+bh*.5;g.fillStyle='#12485f';g.beginPath();g.ellipse(px,py,bw*.2,bh*.16,0,0,6.3);g.fill();g.fillStyle='rgba(160,215,230,.3)';g.beginPath();g.ellipse(px-1,py-1,bw*.12,bh*.07,0,0,6.3);g.fill()}
      for(const p of spots(b,7+((rn()*5)|0),[]))addT(p[0],p[1],2+rn()*1.8,GR[(rn()*3)|0])},
    mix(b){const k=rn();if(k<.2)return T.park(b);if(k<.32)return T.sub(b);
      pave(b,'#101c26');const L=lotsOf(b,1+((rn()*3)|0));
      for(const l of L){const ht=4+rn()*7,green=rn()<.12;addB(l[0],l[1],l[2],l[3],ht,pickp('mix'),{roof:green?'green':rn()<.5?'ac':'flat',lit:.4,ant:rn()<.1?4:0})}
      for(const p of spots(b,2,L))addT(p[0],p[1],2+rn(),GR[(rn()*3)|0])}
  };
  const xb=[],yb=[];
  const xs=vxs.map(r=>[r.x,r.w]),ys=hys.map(r=>[r.y,r.w]);
  const spanX=[],spanY=[];
  if(xs[0][0]-xs[0][1]/2>12)spanX.push([1,xs[0][0]-xs[0][1]/2]);
  for(let i=0;i<xs.length-1;i++)spanX.push([xs[i][0]+xs[i][1]/2,xs[i+1][0]-xs[i+1][1]/2]);
  const lx=xs[xs.length-1];if(W-(lx[0]+lx[1]/2)>12)spanX.push([lx[0]+lx[1]/2,W-1]);
  if(ys[0][0]-ys[0][1]/2>12)spanY.push([o.top||1,ys[0][0]-ys[0][1]/2]);
  for(let i=0;i<ys.length-1;i++)spanY.push([ys[i][0]+ys[i][1]/2,ys[i+1][0]-ys[i+1][1]/2]);
  const ly=ys[ys.length-1];if(H-(ly[0]+ly[1]/2)>12)spanY.push([ly[0]+ly[1]/2,H-1]);
  const blocks=[];
  for(const sy of spanY)for(const sx of spanX){let x0=Math.round(sx[0])+1,x1=Math.round(sx[1])-1,y0=Math.round(sy[0])+1,y1=Math.round(sy[1])-1;
    let rects=[[x0,x1]];
    if(R0){let a=1e9,bb=-1e9;for(let y=y0;y<=y1;y+=2){a=Math.min(a,R0(y));bb=Math.max(bb,R1(y))}
      if(x1>a-2&&x0<bb+2){rects=[];const la=Math.floor(a)-4,rb=Math.ceil(bb)+4;if(la-x0>=9)rects.push([x0,la]);if(x1-rb>=9)rects.push([rb,x1])}}
    for(const rc of rects){let yy1=y1;const xa=rc[0],xb2=rc[1],cxm=(xa+xb2)/2;
      if(o.sea)while(yy1>y0+8&&(o.sea(xa,yy1)>0||o.sea(xb2,yy1)>0||o.sea(cxm,yy1)>0))yy1-=2;
      if(xb2-xa<9||yy1-y0<9)continue;blocks.push({x0:xa,y0,x1:xb2,y1:yy1,cx:cxm,cy:(y0+yy1)/2})}}
  const ctx={g,items,rn,lights,lamps,addB,addT,water,W,H,blocks,T,pave,grass,GR,pickp};
  if(o.themes)Object.assign(T,o.themes(ctx));
  for(const b of blocks){const th=o.zone?o.zone(b.cx,b.cy,b):'mix';if(th==='skip')continue;(T[th]||T.mix)(b)}
  if(o.extra)o.extra(ctx);
  items.sort((a,b)=>a.y-b.y);
  for(const it of items)if(it.sh)it.sh(g);
  for(const it of items)it.dr(g);
  // мягкая вечерняя виньетка и общий тон
  return{cv:c,K,lamps,lights,water,wat,items,blocks}};

// ---------------------------------------------------------------- этап 2: городской район 330×270
Maps.city2=function(){
  const hy=[19,63,107,151,195,239].map(y=>({y,w:y===107||y===195?7:5,maj:y===107||y===195})),vx=[3,47,91,135,179,311].map(x=>({x,w:x===91?7:5,maj:x===91}));
  return Maps.bakeCity({w:330,h:270,top:22,seed:11,hy,vx,
    rv0:y=>222+Math.sin(y/34)*2.4,rv1:y=>262+Math.sin(y/34+.8)*2.4,
    ground:(x,y)=>[13,22,30],
    zone:(cx,cy,b)=>{if(b.x0<=105&&b.x1>=105&&b.y0<=95&&b.y1>=95)return'home';if(b.x0<=165&&b.x1>=165&&b.y1>=250)return'base';
      if(cx>=270&&cx<=310)return(cy>150&&cy<200)?'park':'mix';const h=Maps.hash((cx/8)|0,(cy/8)|0,4);return h<.09?'park':h<.2?'sub':h<.38?'res':'mix'},
    themes:C=>({
      home(b){C.grass(b,'#102a21','#18402e');
        C.addB(100,92,12,9,5,'#c8923a',{roof:'gable',lean:.25,lit:.95,wc:['#ffe9ae','#ffd98a']});
        for(const p of[[98,78,2.6],[116,82,2.2],[124,96,2.4],[108,74,2],[121,72,2.2]])C.addT(p[0],p[1],p[2],C.GR[0]);
        C.g.fillStyle='rgba(180,150,90,.4)';C.g.fillRect(104,101,2,3)},
      base(b){C.pave(b,'#182a35','rgba(76,201,192,.3)');
        C.addB(153,246,24,12,8,'#2f6f78',{roof:'flat',lit:.8,ant:7,lean:.3,wc:['#9fe8d6','#d8fff4']});
        C.addB(144,248,6,8,3,'#46606e',{roof:'ac',win:false});C.addB(182,248,6,8,3,'#46606e',{roof:'ac',win:false})}
    })})};

// ---------------------------------------------------------------- этап 3: город с рекой, аэродромом и портом
Maps.D3={A:[8,22,148,116],B:[8,116,148,188],C:[8,188,148,270],D:[200,22,330,116],E:[200,116,330,188],F:[200,188,330,270]};
Maps.plane=(g,x,y,col,ang)=>{x=Math.round(x);y=Math.round(y);
  g.fillStyle='rgba(0,0,0,.3)';g.fillRect(x-6,y+3,16,3);g.fillRect(x-2,y-2,5,14);
  g.fillStyle='#aab7c0';g.fillRect(x-2,y-6,5,13);g.fillStyle='#d4dde3';g.fillRect(x-2,y-6,1,13);
  g.fillStyle='#e8eef1';g.fillRect(x-8,y-1,17,3);g.fillStyle='#fff';g.fillRect(x-8,y-1,17,1);g.fillStyle=col;g.fillRect(x-4,y+1,9,1);
  g.fillStyle='#27475a';g.fillRect(x+5,y-1,2,1);g.fillStyle='#c4cfd6';g.fillRect(x-8,y-3,2,7);g.fillStyle=col;g.fillRect(x-8,y-3,2,1)};
Maps.heli=(g,x,y,t,sc)=>{sc=sc||1;x=Math.round(x);y=Math.round(y);
  g.fillStyle='#4a5864';g.fillRect(x-9,y-1,7,1);g.fillStyle='#38444e';g.fillRect(x-10,y-3,1,3);
  g.fillStyle='#5f6f7c';g.fillRect(x-3,y-3,7,5);g.fillStyle='#8a9ba8';g.fillRect(x-3,y-3,7,1);g.fillStyle='#9fe8d6';g.fillRect(x+2,y-2,2,2);
  g.fillStyle='#e0453a';g.fillRect(x-1,y-4,1,1);
  const a=t*34;g.save();g.fillStyle='rgba(205,220,230,.13)';g.beginPath();g.arc(x,y-4,9,0,6.3);g.fill();
  g.strokeStyle='rgba(225,236,242,.75)';g.lineWidth=1;g.beginPath();g.moveTo(x-Math.cos(a)*9,y-4-Math.sin(a)*2.4);g.lineTo(x+Math.cos(a)*9,y-4+Math.sin(a)*2.4);g.stroke();g.restore()};
Maps.extra3=function(ctx){
  const g=ctx.g,items=ctx.items,rn=ctx.rn,lights=ctx.lights,H=ctx.H;
  // ---- аэродром (район E)
  const X0=201,Y0=118,X1=330,Y1=186;
  g.fillStyle='#10281f';g.fillRect(X0,Y0,X1-X0,Y1-Y0);
  for(let i=0;i<700;i++){g.fillStyle=rn()<.5?'#183a2b':'rgba(0,0,0,.2)';g.fillRect(X0+((rn()*(X1-X0))|0),Y0+((rn()*(Y1-Y0))|0),1,1)}
  g.fillStyle='#202f37';g.fillRect(X0,Y0,X1-X0,1);g.fillRect(X0,Y1-1,X1-X0,1);g.fillRect(X0,Y0,1,Y1-Y0);
  for(let x=X0;x<X1;x+=4){g.fillStyle='#55656f';g.fillRect(x,Y0,1,2);g.fillRect(x,Y1-2,1,2)}
  // взлётная полоса
  g.fillStyle='#2a3238';g.fillRect(X0+3,170,X1-X0-3,11);g.fillStyle='#39434b';g.fillRect(X0+3,170,X1-X0-3,1);g.fillStyle='#181e23';g.fillRect(X0+3,180,X1-X0-3,1);
  for(let x=X0+14;x<X1-8;x+=10){g.fillStyle='#d4dde3';g.fillRect(x,175,5,1)}
  for(let i=0;i<5;i++){g.fillStyle='#cfd8de';g.fillRect(X0+7,171+i*2,5,1);g.fillRect(X1-13,171+i*2,5,1)}
  for(let x=X0+6,k=0;x<X1-4;x+=8,k++){lights.push({x,y:169,k:'r',i:k});lights.push({x,y:182,k:'r',i:k})}
  // рулёжка и перрон
  g.fillStyle='#262d33';g.fillRect(238,160,6,11);g.fillStyle='#a58a2a';g.fillRect(240,160,1,11);
  g.fillStyle='#2e3a43';g.fillRect(232,128,74,33);g.fillStyle='#3a4852';g.fillRect(232,128,74,1);g.fillStyle='#202930';g.fillRect(232,160,74,1);g.fillRect(305,128,1,33);
  g.strokeStyle='#a58a2a';g.lineWidth=1;g.strokeRect(235.5,131.5,68,27);
  for(const hx of[252,288]){g.strokeStyle='#e5c53b';g.beginPath();g.arc(hx,146,9,0,6.3);g.stroke();g.fillStyle='#e5c53b';g.fillRect(hx-3,142,1,8);g.fillRect(hx+2,142,1,8);g.fillRect(hx-3,145,6,1)}
  g.fillStyle='#a58a2a';for(let x=X0+3;x<236;x+=8)g.fillRect(x,152,4,1);
  // ангары, башня, баки, самолёты
  for(const x of[206,232,258]){const lw=22;items.push({y:126,sh:gg=>Maps.shadow(gg,x,118,lw,8,8),dr:gg=>Maps.box(gg,x,118,lw,8,8,{c:'#53636f',roof:'arch',win:false,rn})})}
  items.push({y:129,sh:gg=>Maps.shadow(gg,306,121,8,8,22),dr:gg=>{const r=Maps.box(gg,306,121,8,8,18,{c:'#4b5a66',win:false,rn});
    Maps.box(gg,r.rx-1,r.ry-6,10,10,5,{c:'#38566a',win:false,rn,roof:'flat',lean:.2});gg.fillStyle='#a8e8ff';gg.fillRect(r.rx,r.ry-4,8,2);gg.fillStyle='#e0453a';gg.fillRect(r.rx+4,r.ry-13,1,3);lights.push({x:r.rx+4,y:r.ry-14})}});
  for(let i=0;i<3;i++){const x=290+i*10;items.push({y:143,sh:gg=>Maps.shadow(gg,x,134,8,8,5),dr:gg=>Maps.box(gg,x,134,8,8,5,{c:'#7a838c',roof:'tank',win:false,rn})})}
  items.push({y:158,dr:gg=>Maps.plane(gg,246,155,'#4a8cff')});
  items.push({y:177,dr:gg=>Maps.plane(gg,312,168,'#e0453a')});
  // ---- порт (район F): пирсы, судно, портальный кран
  const sy=x=>247+Math.sin(x/17)*2+Maps.vn(x*.05,3,5)*3;
  for(const px of[236,292]){const y0=Math.round(sy(px))-2;items.push({y:y0+22,sh:gg=>Maps.shadow(gg,px,y0,9,22,2,.3),dr:gg=>{Maps.box(gg,px,y0,9,22,2,{c:'#6b5e4c',win:false,rn,roof:'flat'});gg.fillStyle='rgba(0,0,0,.25)';for(let k=3;k<22;k+=4)gg.fillRect(px+2,y0-2+k,9,1);for(let k=0;k<22;k+=6){gg.fillStyle='#262c30';gg.fillRect(px,y0+k,1,2);gg.fillRect(px+8,y0+k,1,2)}}})}
  items.push({y:261,sh:gg=>Maps.shadow(gg,247,250,42,9,5,.4),dr:gg=>{
    Maps.box(gg,247,250,42,9,5,{c:'#6c2b2b',win:false,rn,roof:'flat',lean:.22});
    for(let i=0;i<4;i++){const cc=['#b5402f','#2f6aa0','#c9862b','#3c8a5a'][i];Maps.container(gg,254+i*7,256,6,6,4,cc,rn)}
    Maps.box(gg,278,251,9,7,10,{c:'#cfd8de',rn,lit:.6,roof:'flat',ant:4,lights,lean:.25});
    gg.fillStyle='rgba(200,235,250,.35)';gg.fillRect(246,260,44,1)}});
  items.push({y:246,sh:gg=>{gg.fillStyle='rgba(0,0,0,.25)';gg.fillRect(252,242,22,8)},dr:gg=>{
    const L=[Maps.box(gg,250,243,2,2,15,{c:'#d08a3a',win:false,rn,lean:.22}),Maps.box(gg,272,243,2,2,15,{c:'#d08a3a',win:false,rn,lean:.22})];
    gg.fillStyle='#e8a850';gg.fillRect(L[0].rx,L[0].ry,L[1].rx-L[0].rx+2,2);gg.fillStyle='#b9772a';gg.fillRect(L[0].rx+9,L[0].ry,3,16);gg.fillStyle='#fff';gg.fillRect(L[0].rx+10,L[0].ry+16,1,3)}});
  for(const[bx,by,c]of[[231,255,'#e0453a'],[298,258,'#4cc9c0'],[310,252,'#e0453a']])lights.push({x:bx,y:by,k:'b',c});
};
Maps.city3=function(K){
  const hy=[[44,5],[80,8],[116,5],[152,8],[188,5],[224,8],[252,5]].map(a=>({y:a[0],w:a[1],maj:a[1]>5})),
    vx=[[12,5],[40,5],[78,8],[116,5],[142,5],[198,5],[228,5],[268,8],[300,5],[326,5]].map(a=>({x:a[0],w:a[1],maj:a[1]>5}));
  const sea=(x,y)=>{if(x<202)return 0;const sy=247+Math.sin(x/17)*2+Maps.vn(x*.05,3,5)*3;return y>sy?Math.min(1,.35+(y-sy)/11):0};
  const ground=(x,y)=>{if(x<150)return y<116?[15,25,33]:y<188?[14,22,32]:[24,26,28];return y<116?[13,27,26]:y<188?[16,32,28]:[20,27,33]};
  return Maps.bakeCity({w:330,h:270,K:K||1,top:22,seed:23,hy,vx,sea,ground,rv0:y=>150+Math.sin(y/40)*2.5,rv1:y=>190+Math.sin(y/40+.7)*2.5,
    zone:(cx,cy)=>{if(cx<150)return cy<116?'res':cy<188?'down':'ind';if(cx<198)return'skip';if(cy<116)return Maps.hash((cx/9)|0,(cy/9)|0,6)<.2?'park':'sub';if(cy<188)return'skip';return'ind'},
    extra:Maps.extra3})};


// ---------------------------------------------------------------- продолжение города слева от карты (для широких экранов)
// kind: 'c2' | 'c3'; w — ширина полосы в логических пикселях (мировые x от -w до 0)
// выводит карту мира; strip (необязательно) — продолжение влево
Maps.blit=function(g,map,strip){const K=map.K||1,mw=map.cv.width/K,mh=map.cv.height/K;
  if(!strip){g.drawImage(map.cv,0,0,mw,mh);return}
  g.drawImage(strip.cv,strip.x0,0,strip.cv.width/(strip.K||1),strip.cv.height/(strip.K||1));const c=strip.cut,w=mw-c;if(w>0)g.drawImage(map.cv,c*K,0,w*K,mh*K,c,0,w,mh)};
Maps.cityStrip=function(kind,w,K){
  w=Math.max(8,Math.round(w));const c3=kind==='c3',rx=c3?12:3,ov=rx+5,SW=w+ov,step=c3?[28,38]:[44];
  const hy=(c3?[[44,5],[80,8],[116,5],[152,8],[188,5],[224,8],[252,5]].map(a=>({y:a[0],w:a[1],maj:a[1]>5})):[19,63,107,151,195,239].map(y=>({y,w:y===107||y===195?7:5,maj:y===107||y===195})));
  const vx=[];let x=w+rx,k=0;while(x>-4){vx.push({x,w:5,maj:false});x-=step[k%step.length];k++}vx.reverse();
  const r=Maps.bakeCity({w:SW,h:270,K:K||1,top:22,seed:c3?31:19,hy,vx,
    ground:(x,y)=>c3?(y<116?[15,25,33]:y<188?[14,22,32]:[24,26,28]):[13,22,30],
    zone:(cx,cy)=>{if(c3)return cy<116?'res':cy<188?'down':'ind';const h=Maps.hash((cx/8)|0,(cy/8)|0,4);return h<.09?'park':h<.2?'sub':h<.38?'res':'mix'}});
  return{cv:r.cv,K:r.K,w:SW,x0:-w,cut:rx-3,lamps:r.lamps.map(L=>({x:L.x-w,y:L.y})),lights:r.lights.map(L=>({x:L.x-w,y:L.y}))}};

// ---------------------------------------------------------------- этап 4: объёмная карта страны
// RG — центры округов [{x,y}], RE — связи [[a,b]]. Регионы 0..n-1 — наша страна, n — союзник (запад), n+1 — противник (восток).
Maps.country=function(RG,RE,ex){
  ex=ex|0;RG=RG.map(p=>({x:p.x+ex,y:p.y}));
  const W=330+ex,H=270,N=RG.length,AL=N,EN=N+1,NR=N+2,sz=W*H,rn=mulberry(9);
  const hgt=new Float32Array(sz),reg=new Uint8Array(sz).fill(255),land=new Uint8Array(sz);
  const PK=[[140,50,30,1],[250,82,26,.95],[70,150,24,.75],[205,150,20,.5],[296,205,26,.85],[22,112,22,.6],[120,238,18,.5]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const k=y*W+x,wx=(Maps.fbm(x*.035,y*.035,11)-.5)*30,wy=(Maps.fbm(x*.035+40,y*.035+40,12)-.5)*30;
    const bd=Math.pow((x-ex-157)/116,2)+Math.pow((y-141)/108,2)+(Maps.fbm(x*.045,y*.045,5)-.5)*.55;
    const ad=Math.pow((x-ex+26)/70,2)+Math.pow((y-145)/104,2)+(Maps.fbm(x*.05,y*.05,6)-.5)*.4,ed=Math.pow((x-ex-352)/80,2)+Math.pow((y-142)/102,2)+(Maps.fbm(x*.05+9,y*.05,7)-.5)*.4;
    if(ad<1){reg[k]=AL;land[k]=1}else if(ed<1){reg[k]=EN;land[k]=1}
    else if(bd<1){let b=0,bdist=1e9;for(let i=0;i<N;i++){const d=(x+wx-RG[i].x)*(x+wx-RG[i].x)+(y+wy-RG[i].y)*(y+wy-RG[i].y);if(d<bdist){bdist=d;b=i}}reg[k]=b;land[k]=1}
    let m=0;for(const p of PK){const d2=(x-ex-p[0])*(x-ex-p[0])+(y-p[1])*(y-p[1]);m+=p[3]*Math.exp(-d2/(p[2]*p[2]))*(.6+.8*Maps.vn(x*.12,y*.12,4))}
    hgt[k]=Math.min(1.2,Maps.fbm(x*.02,y*.02,3)*.55+m*.5)}
  // --- океан: глубина от береговой линии
  const bl=new Float32Array(sz),tmp=new Float32Array(sz);for(let i=0;i<sz;i++)bl[i]=land[i];
  for(let pass=0;pass<2;pass++){const R=6;
    for(let y=0;y<H;y++){let s=0;for(let x=-R;x<=R;x++)s+=bl[y*W+Math.max(0,Math.min(W-1,x))];for(let x=0;x<W;x++){tmp[y*W+x]=s/(2*R+1);s+=bl[y*W+Math.min(W-1,x+R+1)]-bl[y*W+Math.max(0,x-R)]}}
    for(let x=0;x<W;x++){let s=0;for(let y=-R;y<=R;y++)s+=tmp[Math.max(0,Math.min(H-1,y))*W+x];for(let y=0;y<H;y++){bl[y*W+x]=s/(2*R+1);s+=tmp[Math.min(H-1,y+R+1)*W+x]-tmp[Math.max(0,y-R)*W+x]}}}
  const c=Maps.mk(W,H),g=c.getContext('2d'),oc=g.createImageData(W,H),od=oc.data;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x,q=k*4,t=1-Math.min(1,bl[k]*2.4),st=(Maps.vn(x*.05,y*.3,9)-.5)*8+(Maps.hash(x,y,3)-.5)*4;
    let r=28+(6-28)*t+st*.4,gg=112+(34-112)*t+st*.7,b=134+(50-134)*t+st;
    const cl=bl[k]*9,ln=Math.abs(cl-Math.round(cl));if(ln<.05&&!land[k]){r+=10;gg+=16;b+=18}
    od[q]=r;od[q+1]=gg;od[q+2]=b;od[q+3]=255}
  g.putImageData(oc,0,0);
  // --- верхняя поверхность: рельеф, цвета округов, границы
  const PALS=[['#3a5a52','#8a948c'],['#2f5c44','#a2aaa2'],['#3a6c44','#8c9a88'],['#5c643a','#a69a82'],['#62743e','#aaa68a'],['#3a6a5c','#8aa098'],['#3a6478','#a0b4c0'],['#6e4a40','#b09a90']];
  const top=Maps.mk(W,H),tg=top.getContext('2d'),ti=tg.createImageData(W,H),td=ti.data;
  const H0=(x,y)=>hgt[Math.max(0,Math.min(H-1,y))*W+Math.max(0,Math.min(W-1,x))];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;if(!land[k])continue;const q=k*4,r=reg[k],P=PALS[r];
    const h=hgt[k],t=Maps.sstep(.38,.95,h),A=Maps.rgb(P[0]),B=Maps.rgb(P[1]);
    const sh=.7+((H0(x+1,y)-H0(x-1,y))+(H0(x,y+1)-H0(x,y-1)))*3.2;
    const n=(Maps.vn(x*.2,y*.2,13)-.5)*.14+(Maps.hash(x,y,5)-.5)*.06;
    let cr=A[0]+(B[0]-A[0])*t,cg=A[1]+(B[1]-A[1])*t,cb=A[2]+(B[2]-A[2])*t;
    if(h>.9){const s2=Maps.sstep(.9,1.1,h);cr+=(235-cr)*s2;cg+=(240-cg)*s2;cb+=(245-cb)*s2}
    const forest=r<N&&Maps.fbm(x*.08,y*.08,21)>.6&&h<.5;if(forest){cr*=.72;cg*=.86;cb*=.74}
    let coast=false;for(let d=1;d<=2&&!coast;d++)if(!land[k-d]||!land[k+d]||!land[k-d*W]||!land[k+d*W])coast=true;
    if(coast&&h<.3){cr=cr*.5+112*.5;cg=cg*.5+118*.5;cb=cb*.5+86*.5}
    const f=Math.max(.45,Math.min(1.5,sh+n));td[q]=Math.min(255,cr*f);td[q+1]=Math.min(255,cg*f);td[q+2]=Math.min(255,cb*f);td[q+3]=255;
    const ri=k+1,di=k+W;if((x<W-1&&land[ri]&&reg[ri]!==r)||(y<H-1&&land[di]&&reg[di]!==r)){td[q]*=.45;td[q+1]*=.5;td[q+2]*=.55}}
  tg.putImageData(ti,0,0);
  // --- реки и озёра
  const river=(x0,y0)=>{let x=x0,y=y0;tg.strokeStyle='#2a86a8';tg.lineWidth=1.6;tg.beginPath();tg.moveTo(x,y);
    for(let i=0;i<260;i++){const gx=H0(Math.round(x+2),Math.round(y))-H0(Math.round(x-2),Math.round(y)),gy=H0(Math.round(x),Math.round(y+2))-H0(Math.round(x),Math.round(y-2));
      const nx=Maps.vn(x*.1,y*.1,31)-.5,ny=Maps.vn(x*.1+7,y*.1,32)-.5;x+=-gx*8+nx*2.2+.25;y+=-gy*8+ny*2.2+.25;if(x<1||y<1||x>=W-1||y>=H-1||!land[Math.round(y)*W+Math.round(x)])break;tg.lineTo(x,y)}
    tg.stroke()};
  for(const p of[[141,54],[250,86],[72,150],[205,152]])river(p[0]+ex,p[1]);
  for(const L of[[118,160,9,5],[206,58,8,4],[58,200,7,4]].map(a=>[a[0]+ex,a[1],a[2],a[3]])){if(!land[L[1]*W+L[0]])continue;tg.fillStyle='#1c6a86';tg.beginPath();tg.ellipse(L[0],L[1],L[2],L[3],0,0,6.3);tg.fill();tg.strokeStyle='rgba(190,235,245,.55)';tg.lineWidth=1;tg.stroke()}
  // --- поля
  for(const f of[[104,224,18,10],[128,232,14,8],[84,196,16,9],[200,226,16,10],[238,170,14,9],[246,236,12,8]].map(a=>[a[0]+ex,a[1],a[2],a[3]])){if(!land[(f[1]+4)*W+f[0]+4])continue;for(let i=0;i<f[3];i+=2){tg.fillStyle=(i/2)%2?'rgba(196,184,90,.55)':'rgba(120,150,70,.55)';tg.fillRect(f[0],f[1]+i,f[2],2)}tg.strokeStyle='rgba(0,0,0,.2)';tg.strokeRect(f[0]+.5,f[1]+.5,f[2]-1,f[3]-1)}
  // --- дороги между округами
  const road=(A,B,col,w)=>{const mx=(A.x+B.x)/2,my=(A.y+B.y)/2,dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1,off=(Maps.vn(mx*.1,my*.1,41)-.5)*L*.35;
    tg.strokeStyle='rgba(8,14,16,.65)';tg.lineWidth=w+1.6;tg.beginPath();tg.moveTo(A.x,A.y);tg.quadraticCurveTo(mx-dy/L*off,my+dx/L*off,B.x,B.y);tg.stroke();
    tg.strokeStyle=col;tg.lineWidth=w;tg.stroke()};
  const roads=[];for(const e of RE){const A=RG[e[0]],B=RG[e[1]],mx=(A.x+B.x)/2,my=(A.y+B.y)/2,dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1,off=(Maps.vn(mx*.1,my*.1,41)-.5)*L*.35;road(A,B,'#c8b886',1.1);
    roads.push({ax:A.x,ay:A.y,cx:mx-dy/L*off,cy:my+dx/L*off,bx:B.x,by:B.y})}
  // --- деревья, горы, города
  const rr=mulberry(77),GREEN=['#143c28','#2a6a44'];
  const tree=(x,y,s)=>{tg.fillStyle='rgba(0,0,0,.28)';tg.fillRect(x+1,y,s+1,1);tg.fillStyle=GREEN[0];tg.beginPath();tg.moveTo(x,y-s*2-1);tg.lineTo(x-s,y);tg.lineTo(x+s,y);tg.fill();tg.fillStyle=GREEN[1];tg.beginPath();tg.moveTo(x,y-s*2-1);tg.lineTo(x-s,y);tg.lineTo(x,y);tg.fill()};
  for(let i=0;i<1400;i++){const x=(rr()*W)|0,y=(rr()*H)|0,k=y*W+x;if(!land[k]||reg[k]>=N||hgt[k]>.5)continue;if(Maps.fbm(x*.08,y*.08,21)<.6)continue;tree(x,y,1+(rr()<.3?1:0))}
  const pk=[];for(let i=0;i<1500&&pk.length<24;i++){const x=(rr()*W)|0,y=(rr()*H)|0,k=y*W+x;if(!land[k]||hgt[k]<.64)continue;if(pk.some(p=>Math.hypot(p[0]-x,p[1]-y)<12))continue;pk.push([x,y,6+(hgt[k]-.6)*17])}
  pk.sort((a,b)=>a[1]-b[1]);
  for(const p of pk){const x=p[0],y=p[1],s=p[2];tg.fillStyle='rgba(0,0,0,.3)';tg.beginPath();tg.moveTo(x+s*.4,y+1);tg.lineTo(x+s*1.5,y+2);tg.lineTo(x+s*.3,y-s*.4);tg.fill();
    tg.fillStyle='#8e9aa2';tg.beginPath();tg.moveTo(x,y-s);tg.lineTo(x-s*.8,y);tg.lineTo(x,y);tg.fill();tg.fillStyle='#4e5a64';tg.beginPath();tg.moveTo(x,y-s);tg.lineTo(x,y);tg.lineTo(x+s*.8,y);tg.fill();
    tg.fillStyle='#f4f8fa';tg.beginPath();tg.moveTo(x,y-s);tg.lineTo(x-s*.28,y-s*.62);tg.lineTo(x+s*.05,y-s*.55);tg.lineTo(x+s*.26,y-s*.66);tg.fill()}
  const town=(x,y,n,col,ht,rs)=>{const items=[];for(let i=0;i<n;i++){const a=i*2.4+rs,r=2+i*1.7,bx=x+Math.cos(a)*r*1.5-3,by=y+Math.sin(a)*r*.9-2,w=5+((rr()*3)|0),h=4+((rr()*2)|0);items.push([bx,by,w,h,ht*(.5+rr()*.9)])}
    items.sort((a,b)=>a[1]-b[1]);for(const b of items)Maps.shadow(tg,b[0],b[1],b[2],b[3],b[4],.3);for(const b of items)Maps.box(tg,b[0],b[1],b[2],b[3],b[4],{c:col,rn:rr,lit:.5,roof:'flat'})};
  RG.forEach((p,i)=>{if(i===0){tg.strokeStyle='rgba(200,215,225,.3)';tg.lineWidth=1;tg.beginPath();tg.ellipse(p.x,p.y+2,22,14,0,0,6.3);tg.stroke();town(p.x,p.y,10,'#86aac4',7,.5)}else town(p.x,p.y,6,'#7096b0',4,i)});
  for(let i=0;i<14;i++){const x=(rr()*W)|0,y=(rr()*H)|0,k=y*W+x;if(!land[k]||hgt[k]>.5||reg[k]>=N)continue;if(RG.some(p=>Math.hypot(p.x-x,p.y-y)<26))continue;town(x,y,3,'#6e88a0',3,i)}
  for(let i=0;i<10;i++){const x=(rr()*(60+ex)+8)|0,y=(rr()*190+50)|0,k=y*W+x;if(land[k]&&reg[k]===AL&&(i%2||true)){town(x,y,3,'#5f94b4',4,i)}}
  for(let i=0;i<8;i++){const x=(300+ex+rr()*25)|0,y=(rr()*180+50)|0,k=y*W+x;if(land[k]&&reg[k]===EN)town(x,y,3,'#9a5a54',4,i)}
  // --- граница с противником: стена и вышки
  const borderE=[];for(let y=24;y<H-6;y++){for(let x=W-1;x>40;x--){if(land[y*W+x]&&reg[y*W+x]!==EN&&reg[y*W+x]!==AL&&land[y*W+x+1]&&reg[y*W+x+1]===EN){borderE.push([x,y]);break}}}
  for(const p of borderE){tg.fillStyle='#4a2220';tg.fillRect(p[0]+1,p[1],2,1);tg.fillStyle='#8a4038';tg.fillRect(p[0]+1,p[1],1,1)}
  for(let i=4;i<borderE.length;i+=22){const p=borderE[i];Maps.shadow(tg,p[0]+1,p[1]-1,3,3,6,.3);Maps.box(tg,p[0]+1,p[1]-1,3,3,6,{c:'#6a3430',win:false,rn:rr})}
  tg.fillStyle='rgba(60,20,20,.0)';
  // --- итоговая сборка: тень, «срез» земли, поверхность
  const lm=Maps.mk(W,H),lg=lm.getContext('2d'),li=lg.createImageData(W,H);for(let i=0;i<sz;i++){if(land[i]){li.data[i*4]=li.data[i*4+1]=li.data[i*4+2]=255;li.data[i*4+3]=255}}lg.putImageData(li,0,0);
  const tint=(src,col)=>{const t=Maps.mk(W,H),q=t.getContext('2d');q.drawImage(src,0,0);q.globalCompositeOperation='source-in';q.fillStyle=col;q.fillRect(0,0,W,H);return t};
  const blk=tint(lm,'#000');g.globalAlpha=.16;g.drawImage(blk,7,13);g.drawImage(blk,5,10);g.drawImage(blk,3,7);g.globalAlpha=1;
  const T=7;for(let dy=T;dy>=1;dy--){const st=(dy%3===0)?.82:1;g.drawImage(tint(lm,Maps.mixc('#16100a','#4a3826',((T-dy)/(T-1))*st)),0,dy)}
  g.drawImage(top,0,0);
  // контур береговой линии
  const edge=Maps.mk(W,H),eg=edge.getContext('2d'),ei=eg.createImageData(W,H);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const k=y*W+x;if(land[k]&&(!land[k-1]||!land[k-W]))ei.data.set([200,226,232,120],k*4)}eg.putImageData(ei,0,0);g.drawImage(edge,0,0);
  // --- округа: вырезки для «подъёма» и границы для подсветки
  const regs=[],cliff='#3a2c20';
  for(let i=0;i<NR;i++){let x0=W,y0=H,x1=-1,y1=-1;const bd=[];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;if(reg[k]!==i)continue;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      if(!land[k-1]||!land[k+1]||!land[k-W]||!land[k+W]||reg[k-1]!==i||reg[k+1]!==i||reg[k-W]!==i||reg[k+W]!==i)bd.push(x,y)}
    if(x1<0){regs.push(null);continue}
    const rm=Maps.mk(W,H),rg2=rm.getContext('2d'),ri=rg2.createImageData(W,H);for(let k=0;k<sz;k++)if(reg[k]===i){ri.data[k*4]=ri.data[k*4+1]=ri.data[k*4+2]=255;ri.data[k*4+3]=255}rg2.putImageData(ri,0,0);
    const cv=Maps.mk(x1-x0+1,y1-y0+1),cg=cv.getContext('2d');cg.drawImage(top,-x0,-y0);cg.globalCompositeOperation='destination-in';cg.drawImage(rm,-x0,-y0);
    const sl=Maps.mk(x1-x0+1,y1-y0+1),sg=sl.getContext('2d');sg.drawImage(rm,-x0,-y0);sg.globalCompositeOperation='source-in';sg.fillStyle=cliff;sg.fillRect(0,0,sl.width,sl.height);
    const pit=Maps.mk(x1-x0+1,y1-y0+1),pg=pit.getContext('2d');pg.drawImage(rm,-x0,-y0);pg.globalCompositeOperation='source-in';pg.fillStyle='#08151d';pg.fillRect(0,0,pit.width,pit.height);
    regs.push({i,x0:x0-ex,y0,x1:x1-ex,y1,cv,sl,pit,bd:bd.map((v,k)=>k%2?v:v-ex)})}
  // мягкие маски для дымки заражения
  const hz=new Maps.Haze(W,H,3);for(let i=0;i<N;i++)hz.addMask((x,y)=>{let s=0,n=0;for(let dy=-3;dy<=3;dy+=2)for(let dx=-3;dx<=3;dx+=2){const xx=Math.max(0,Math.min(W-1,Math.round(x+dx))),yy=Math.max(0,Math.min(H-1,Math.round(y+dy)));n++;if(reg[yy*W+xx]===i)s++}return s/n});
  // точки для бликов на воде
  const sea=[];for(let i=0;i<4000&&sea.length<150;i++){const x=(rn()*W)|0,y=(24+rn()*(H-24))|0;if(!land[y*W+x])sea.push([x,y])}
  return{ex,cv:c,top,reg,land,regs,haze:hz,sea:sea.map(p=>[p[0]-ex,p[1]]),roads:roads.map(r=>({ax:r.ax-ex,ay:r.ay,cx:r.cx-ex,cy:r.cy,bx:r.bx-ex,by:r.by})),borderE:borderE.map(p=>[p[0]-ex,p[1]]),hgt,regAt:(x,y)=>{x=Math.round(x+ex);y=Math.round(y);return x<0||y<0||x>=W||y>=H?255:reg[y*W+x]}}};
