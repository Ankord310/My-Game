'use strict';
// Детальная графика этапа 3 (холст ×2): люди, заражённые, солдаты, огонь, автобусы, вертолёт.
// Все координаты — логические; мелкие детали рисуются с шагом 1/RS (полпикселя при RS=2).
const Art3=(()=>{
  const h=()=>1/RS,q=v=>Math.round(v*RS)/RS;
  const R=(x,y,w,hh,c)=>{cx.fillStyle=c;const u=h();cx.fillRect(q(x),q(y),Math.max(u,q(w)),Math.max(u,q(hh)))};
  const hs=(i,n)=>Maps.hash(i|0,n,7);
  const CLOTH=['#c0453a','#3c6ea8','#d6b03a','#4c9a62','#8a8f96','#a65ea8','#e8e0d0','#d27a3a'],SKIN=['#e8c9a0','#c99a72','#8a5f42','#f0d4b0'],HAIR=['#2a1f1a','#5a3a22','#c9a050','#1a1a1a'];
  const d=(ox,oy)=>(dx,dy,w,hh,c)=>R(ox+dx*h(),oy+dy*h(),w*h(),hh*h(),c);
  const shadow=(x,y,r)=>{cx.fillStyle='rgba(0,0,0,.36)';cx.beginPath();cx.ellipse(x,y+.2,r,r*.42,0,0,6.3);cx.fill()};
  return{
    // спрайты 7×14 «физических» пикселей (при RS=2 это 3.5×7 логических); (x,y) — центр стоп
    person(x,y,id,t,o){o=o||{};const col=CLOTH[(hs(id,1)*CLOTH.length)|0],sk=SKIN[(hs(id,2)*SKIN.length)|0],hr=HAIR[(hs(id,3)*HAIR.length)|0],dk=Maps.sh(col,.62),lt=Maps.sh(col,1.25);
      const ph=t*(o.run?12:3)+id*1.7,sw=Math.sin(ph)>0?1:0,bob=o.run?(Math.sin(ph*2)>0?1:0):0,D=d(x,y-bob*h());shadow(x,y,2.6);
      D(-2,-5,2,5-(sw?2:0),'#222a33');D(1,-5,2,5-(sw?0:2),'#222a33');D(-2,-1-(sw?0:0)+(sw?-2:0),2,1,'#0e1217');D(1,-1+(sw?0:-2),2,1,'#0e1217');
      D(-2,-10,5,5,col);D(-2,-10,5,1,lt);D(-2,-6,5,1,'#1a1f26');D(1,-10,1,4,dk);
      if(o.panic){D(-3,-14,1,5,sk);D(3,-14,1,5,sk);D(-3,-10,1,2,dk);D(3,-10,1,2,dk)}else{D(-3,-10,1,4+sw,col);D(3,-10,1,4+(1-sw),col);D(-3,-6+sw,1,1,sk);D(3,-6+(1-sw),1,1,sk)}
      D(-1,-13,3,3,sk);D(-1,-13,3,1,hr);D(-2,-13,1,2,hr);if(o.panic){D(-1,-11,3,1,'#3a1212')}else{D(-1,-11,1,1,'#1a1010');D(1,-11,1,1,'#1a1010')}},
    zombie(x,y,id,t,moving){const col=['#4a4f46','#3d3a34','#55483e','#3a4552'][(hs(id,4)*4)|0],ph=t*(moving?3.4:1.6)+id*2.3,sw=Math.sin(ph)>0?1:0,lurch=Math.sin(ph*.5)>.3?1:0,D=d(x+lurch*h(),y);shadow(x,y,2.8);
      D(-2,-5,2,5-(sw?2:0),'#1c2126');D(1,-5,2,5-(sw?0:2),'#1c2126');D(-2,-1+(sw?-2:0),2,1,'#0b0e10');D(1,-1+(sw?0:-2),2,1,'#0b0e10');
      D(-2,-10,5,5,col);D(-2,-10,5,1,'rgba(255,255,255,.12)');D(-1,-8,2,2,'#5a1616');D(1,-6,2,1,'#2a2f2a');D(-2,-6,5,1,'#15191d');
      D(-4,-11,2,4+sw,'#7b9567');D(3,-11,2,4+(1-sw),'#7b9567');D(-4,-11,1,1,'#a4bf92');D(4,-11,1,1,'#a4bf92');
      D(-1,-13,3,3,'#8aa57a');D(-1,-13,3,1,'#5e7a52');D(-1,-12,1,1,'#ff3b2f');D(1,-12,1,1,'#ff3b2f');D(-1,-10,3,1,'#3a1010')},
    soldier(x,y,id,t,aim,fire){const d0=aim<0?-1:1,D=d(x,y);shadow(x,y,3);
      D(-2,-5,2,5,'#2a3326');D(1,-5,2,5,'#2a3326');D(-2,-1,2,1,'#12160f');D(1,-1,2,1,'#12160f');
      D(-2,-10,5,5,'#4a6a44');D(-2,-10,5,1,'#6f8f68');D(-2,-7,5,1,'#2f4a2c');D(-2,-6,1,1,'#8a7a50');D(2,-6,1,1,'#8a7a50');D(-3,-10,1,4,'#3c5a38');D(3,-10,1,4,'#3c5a38');
      const rx=d0>0?1:-6;D(rx,-9,6,1,'#1a1d1a');D(rx,-8,6,1,'#2c312c');D(d0>0?3:-4,-10,1,2,'#1a1d1a');
      D(-1,-12,3,2,'#d9b48a');D(-2,-14,5,3,'#3c5a38');D(-2,-14,5,1,'#587c52');D(-2,-11,1,1,'#2a3d28');
      if(fire){cx.save();cx.globalCompositeOperation='lighter';D(d0>0?7:-8,-10,2,2,'#fff3b0');D(d0>0?9:-10,-9,1,1,'#ffb040');cx.restore();Post.glow(x+(d0>0?4.5:-4.5),y-4.5,7,'255,220,120',.45)}},
    // пламя: основание в (x,y), sz — масштаб
    flame(x,y,sz,t,id){const u=h(),w=Math.max(4,Math.round(5*sz*RS/2)),mid=(w-1)/2;
      cx.fillStyle='rgba(12,8,8,.45)';cx.beginPath();cx.ellipse(x,y+.3,2.4*sz,.9*sz,0,0,6.3);cx.fill();
      for(let i=0;i<w;i++){const uu=(i-mid)/(mid+.5),env=1-uu*uu,n=.62+.38*Math.sin(t*13+i*1.9+id)*Math.sin(t*8.3+i*.7+id*2),H=Math.max(1,Math.round(env*n*7*sz*RS/2)),cxp=x+(i-mid-.5)*u;
        for(let k=0;k<H;k++){const f=k/Math.max(1,H-1),core=1-Math.abs(uu)*.9;cx.fillStyle=f<.2*core+.1?'#fff1b0':f<.45*core+.15?'#ffc83a':f<.75?'#ff7a1f':'#c8321a';cx.fillRect(cxp,y-(k+1)*u,u,u)}}
      cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){const p=(t*.9+k/3+id*.37)%1;R(x+Math.sin(p*6+k+id)*1.6,y-3*sz-p*7,.5,.5,'rgba(255,200,90,'+(1-p).toFixed(2)+')')}cx.restore();
      Post.glow(x,y-2*sz,14*sz,'255,130,40',.3+.12*Math.sin(t*11+id))},
    // автобус: x,y — центр, (dx,dy) — направление
    bus(x,y,dx,dy,load,t,night){const hz=Math.abs(dx)>=Math.abs(dy),L=14,Wd=6.5;cx.save();cx.translate(q(x),q(y));
      if(!hz){cx.rotate(dy>0?Math.PI/2:-Math.PI/2)}else if(dx<0){cx.scale(-1,1)}
      cx.fillStyle='rgba(0,0,0,.4)';cx.fillRect(-L/2+.5,-Wd/2+1.5,L,Wd);
      R(-L/2,-Wd/2,L,Wd,'#c99a1c');R(-L/2,-Wd/2,L,.5,'#ffe27a');R(-L/2,Wd/2-.5,L,.5,'#7a5a10');
      R(-L/2+.5,-Wd/2+.5,L-1,Wd-1,'#f0c53b');R(-L/2+.5,-Wd/2+.5,L-1,1.5,'#ffe27a');R(-L/2+.5,Wd/2-1.5,L-1,1,'#d9a52a');
      for(let i=0;i<5;i++){const wx=-L/2+1.5+i*2.4;R(wx,-Wd/2+1.8,1.8,1.6,'#17222c');R(wx,-Wd/2+1.8,1.8,.5,'rgba(160,220,240,.5)');if(load>0&&i<Math.ceil(load/12)+1){R(wx+.5,-Wd/2+2.3,.5,.5,'#e8c9a0');R(wx+1.2,-Wd/2+2.5,.5,.5,'#d6b03a')}}
      R(L/2-2,-Wd/2+1.2,1.5,2.4,'#17222c');R(L/2-2,-Wd/2+1.2,1.5,.5,'rgba(160,220,240,.6)');
      R(-1.5,-Wd/2-.5,3,.5,'#d8dde0');R(-.5,-Wd/2+.2,1,.5,'#c0392b');
      for(const wx of[-L/2+2.5,L/2-3.5]){R(wx,Wd/2-.3,1.8,.9,'#101416');R(wx+.4,Wd/2-.2,.9,.4,'#4a5258')}
      R(L/2-.5,-Wd/2+.8,.5,.8,'#fff6c0');R(L/2-.5,Wd/2-1.6,.5,.8,'#fff6c0');R(-L/2,-Wd/2+.8,.5,.8,'#c2281e');R(-L/2,Wd/2-1.6,.5,.8,'#c2281e');
      cx.save();cx.globalCompositeOperation='lighter';const g=cx.createLinearGradient(L/2,0,L/2+11,0);g.addColorStop(0,'rgba(255,240,170,'+(.22+.16*(night||0))+')');g.addColorStop(1,'rgba(255,240,170,0)');cx.fillStyle=g;cx.beginPath();cx.moveTo(L/2,-Wd/2+.8);cx.lineTo(L/2+11,-Wd/2-2.5);cx.lineTo(L/2+11,Wd/2+2.5);cx.lineTo(L/2,Wd/2-.8);cx.closePath();cx.fill();cx.restore();
      cx.restore();if(load>0)Post.glow(x,y,13,'255,210,90',.14)},
    // вертолёт: сверху-сбоку, ротор размыт, ночью — прожектор
    heli(x,y,t,night,sh){const u=h(),a=t*40;
      R(x-10,y-1,8,.5,'#46535d');R(x-10.5,y-3.5,.5,2.5,'#34414a');R(x-11,y-3.5,1.5,.5,'#34414a');
      R(x-3.5,y-3.5,8,5,'#5a6975');R(x-3.5,y-3.5,8,1,'#8a9ba8');R(x-3.5,y+.5,8,1,'#3c4852');R(x+1.5,y-2.5,3,2.5,'#7ac8d8');R(x+1.5,y-2.5,3,.5,'#c4f0f8');R(x-2,y-2.5,3,1.5,'#46535d');
      R(x-4.5,y+1.5,9.5,.5,'#2a343c');R(x-3.5,y+.5,.5,1,'#2a343c');R(x+3.5,y+.5,.5,1,'#2a343c');
      R(x-.5,y-4.5,1,1,'#2a343c');R(x-.5,y-4.5,1,.5,'#e0453a');
      cx.save();cx.fillStyle='rgba(205,220,230,.12)';cx.beginPath();cx.ellipse(x,y-4.7,10,2.8,0,0,6.3);cx.fill();
      cx.strokeStyle='rgba(235,243,248,.85)';cx.lineWidth=h()*1.2;cx.beginPath();cx.moveTo(x-Math.cos(a)*10,y-4.7-Math.sin(a)*2.7);cx.lineTo(x+Math.cos(a)*10,y-4.7+Math.sin(a)*2.7);cx.stroke();
      cx.beginPath();cx.moveTo(x-Math.sin(a*1.3)*10,y-4.7+Math.cos(a*1.3)*2.7);cx.lineTo(x+Math.sin(a*1.3)*10,y-4.7-Math.cos(a*1.3)*2.7);cx.stroke();
      if(night>.4){cx.globalCompositeOperation='lighter';const g=cx.createLinearGradient(x,y+1,x,y+14);g.addColorStop(0,'rgba(220,240,255,'+(.3*night).toFixed(2)+')');g.addColorStop(1,'rgba(220,240,255,0)');cx.fillStyle=g;cx.beginPath();cx.moveTo(x+1,y+1);cx.lineTo(x-5,y+14);cx.lineTo(x+7,y+14);cx.closePath();cx.fill()}
      cx.restore();Post.glow(x,y,12,'200,230,255',.1)},
    // взрыв: вспышка, ударная волна, огненный шар из пикселей, обломки, столб дыма; u — 0..1 за время эффекта
    boom(x,y,u,seed){const r=(i,k)=>Maps.hash(i,seed|0,k),n=80,ph=Math.min(1,u*1.35);
      if(u<.18){cx.save();cx.globalCompositeOperation='lighter';Post.glow(x,y-5,60,'255,236,190',1-u/.18);cx.restore()}
      const sr=5+u*62;cx.strokeStyle='rgba(255,'+Math.floor(230-u*110)+',160,'+((1-u)*.9).toFixed(2)+')';cx.lineWidth=2.4*(1-u)+.6;cx.beginPath();cx.ellipse(x,y,sr,sr*.55,0,0,6.3);cx.stroke();
      cx.strokeStyle='rgba(255,255,255,'+((1-u)*.35).toFixed(2)+')';cx.lineWidth=.8;cx.beginPath();cx.ellipse(x,y,sr*.82,sr*.45,0,0,6.3);cx.stroke();
      // огненное ядро: мягкий градиент
      if(ph<.95){const R0=6+ph*20,cy=y-6-ph*9,al=1-ph*ph;cx.save();cx.globalCompositeOperation='lighter';const g=cx.createRadialGradient(x,cy,0,x,cy,R0);
        g.addColorStop(0,'rgba(255,248,210,'+al.toFixed(2)+')');g.addColorStop(.35,'rgba(255,190,60,'+(al*.85).toFixed(2)+')');g.addColorStop(.7,'rgba(230,80,24,'+(al*.55).toFixed(2)+')');g.addColorStop(1,'rgba(120,30,10,0)');cx.fillStyle=g;cx.beginPath();cx.ellipse(x,cy,R0,R0*.8,0,0,6.3);cx.fill();cx.restore()}
      // огненные частицы
      for(let i=0;i<n;i++){const a=r(i,1)*6.283,v=6+r(i,2)*30,px=x+Math.cos(a)*v*ph,py=y-4-Math.abs(Math.sin(a))*v*ph*.9-ph*ph*14*r(i,3),sz=Math.max(.5,(2.6-ph*1.6)*(.6+r(i,4)*1.2)),al=Math.max(0,1-ph*ph);
        cx.globalAlpha=al;cx.fillStyle=ph<.25?'#fff4c0':ph<.45?'#ffc040':ph<.7?'#ff6a20':'#7a2a14';cx.fillRect(q(px),q(py),q(sz)||h(),q(sz)||h())}
      cx.globalAlpha=1;
      for(let i=0;i<22;i++){const a=r(i,5)*6.283,t=u*2.1,vx=Math.cos(a)*(12+r(i,6)*28),vy=14+r(i,7)*22,px=x+vx*t,py=y-3-vy*t+34*t*t;if(py>y+3||u>.97)continue;
        cx.fillStyle=r(i,8)<.5?'#3a2f2a':'#8a7a68';cx.fillRect(q(px),q(py),h()*3,h()*3)}
      for(let k=0;k<8;k++){const yy=y-6-k*4.2*Math.min(1,u*2),xx=x+Math.sin(k*2.1+u*2)*(2+k*.6),rr=5+k*1.8+u*4,al=(.55-k*.04)*Math.min(1,u*4)*(1-Math.max(0,u-.5)/.5);
        if(al<=0)continue;const g=cx.createRadialGradient(xx,yy,0,xx,yy,rr);g.addColorStop(0,'rgba(34,28,30,'+al.toFixed(3)+')');g.addColorStop(1,'rgba(34,28,30,0)');cx.fillStyle=g;cx.fillRect(xx-rr,yy-rr,rr*2,rr*2)}},
    // машина: направление (dx,dy), тип o.k: police|amb|fire|spec|civ; o.col — цвет гражданской; o.park — стоит без мигалок
    car(x,y,dx,dy,o){const k=o.k||'civ',T=performance.now()/1000,P={
        civ:{l:6.5,w:3.4,body:o.col||'#9aa6ad',stripe:null,roof:null},police:{l:7.5,w:3.6,body:'#eef2f5',stripe:'#2f62c8',roof:'#dfe6ea',bar:['#ff3b2f','#3b6bff']},
        amb:{l:9,w:4.2,body:'#f6f8f9',stripe:'#d8332a',roof:'#e6ecef',bar:['#ff3b2f','#ffffff'],cross:1},fire:{l:12,w:4.4,body:'#c8302a',stripe:'#f2f2f2',roof:'#a82822',bar:['#ff3b2f','#ffb03b'],ladder:1},
        spec:{l:10,w:4.4,body:'#2b343a',stripe:'#e5a93b',roof:'#1f272c',bar:['#3b6bff','#9fd0ff'],arm:1}}[k]||{l:6.5,w:3.4,body:'#999'},L=P.l,Wd=P.w;
      const fl=Math.floor(T*9+(x*.3))%2;cx.save();cx.translate(q(x),q(y));
      if(Math.abs(dx)>=Math.abs(dy)){if(dx<0)cx.scale(-1,1)}else cx.rotate(dy>0?Math.PI/2:-Math.PI/2);
      cx.fillStyle='rgba(0,0,0,.42)';cx.fillRect(-L/2+.7,-Wd/2+1.2,L,Wd);
      for(const wx of[-L/2+1.4,L/2-2.9]){R(wx,-Wd/2-.3,1.5,.7,'#0c1013');R(wx,Wd/2-.4,1.5,.7,'#0c1013')}
      R(-L/2,-Wd/2,L,Wd,Maps.sh(P.body,.62));R(-L/2+.3,-Wd/2+.3,L-.6,Wd-.6,P.body);R(-L/2+.3,-Wd/2+.3,L-.6,.5,'rgba(255,255,255,.4)');R(-L/2+.3,Wd/2-.8,L-.6,.5,'rgba(0,0,0,.22)');
      if(P.stripe){R(-L/2+.3,-.2,L-.6,.6,P.stripe)}
      const cl=P.roof||Maps.sh(P.body,1.12);R(-L/2+L*.28,-Wd/2+.7,L*.36,Wd-1.4,cl);R(-L/2+L*.28,-Wd/2+.7,L*.36,.4,'rgba(255,255,255,.35)');
      R(L/2-L*.3,-Wd/2+.6,L*.2,Wd-1.2,'#16222c');R(L/2-L*.3,-Wd/2+.6,L*.2,.4,'rgba(170,225,245,.65)');R(-L/2+L*.1,-Wd/2+.7,L*.14,Wd-1.4,'#121c25');
      if(P.cross){R(-1,-.7,2.4,.6,'#d8332a');R(-.1,-1.5,.6,2.4,'#d8332a')}
      if(P.ladder){for(let i=0;i<L*.55;i+=.8){R(-L/2+1+i,-.9,.4,1.8,'#cfd6db')}R(-L/2+1,-.9,L*.55,.4,'#e6ebee');R(-L/2+1,.5,L*.55,.4,'#e6ebee')}
      if(P.arm){R(-L/2+L*.45,-Wd/2+1,2,Wd-2,'#3e4a3a');R(-L/2+L*.45+.5,-.5,2.4,.7,'#161b1e')}
      if(P.bar&&!o.park){R(-.5,-Wd/2+.6,1,Wd-1.2,'#10161a');R(-.5,-Wd/2+.6,1,(Wd-1.2)/2,P.bar[fl]);R(-.5,0,1,(Wd-1.2)/2,P.bar[1-fl])}
      R(L/2-.5,-Wd/2+.5,.5,.8,'#fff4c0');R(L/2-.5,Wd/2-1.3,.5,.8,'#fff4c0');R(-L/2,-Wd/2+.5,.5,.8,o.park?'#7a1d18':'#ff3b2f');R(-L/2,Wd/2-1.3,.5,.8,o.park?'#7a1d18':'#ff3b2f');
      if(!o.park){cx.save();cx.globalCompositeOperation='lighter';const g=cx.createLinearGradient(L/2,0,L/2+10,0);g.addColorStop(0,'rgba(255,244,190,.2)');g.addColorStop(1,'rgba(255,244,190,0)');cx.fillStyle=g;cx.beginPath();cx.moveTo(L/2,-Wd/2+.4);cx.lineTo(L/2+10,-Wd/2-2);cx.lineTo(L/2+10,Wd/2+2);cx.lineTo(L/2,Wd/2-.4);cx.closePath();cx.fill();cx.restore()}
      cx.restore();if(P.bar&&!o.park)Post.glow(x,y,13,fl?'59,107,255':'255,59,47',.4)},
    // кольцо вспышки заражения: два контура и искры
    ring(x,y,u,red){const c=red?'255,96,80':'125,255,166',r1=6+u*28;cx.strokeStyle='rgba('+c+','+(1-u).toFixed(2)+')';cx.lineWidth=1.5;cx.beginPath();cx.ellipse(x,y,r1,r1*.55,0,0,6.3);cx.stroke();
      cx.lineWidth=.8;cx.beginPath();cx.ellipse(x,y,r1*.62,r1*.34,0,0,6.3);cx.stroke();
      cx.save();cx.globalCompositeOperation='lighter';for(let i=0;i<14;i++){const a=i*.449+x,rr=r1*(.7+((i*37)%10)/25);R(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.55-u*5,.5,.5,'rgba('+c+','+(1-u).toFixed(2)+')')}cx.restore()},
    // блокпост: бетонные блоки с полосами, мешки, шлагбаум, мигалка (горизонтально; поворот — снаружи)
    barrier(g,x,y,w,t){const u=h();x=q(x);y=q(y);
      g.fillStyle='rgba(0,0,0,.38)';g.fillRect(x+1,y+1.5,w+1,3);
      const n=Math.max(2,Math.floor(w/2.5));for(let i=0;i<n;i++){const bx=x+i*(w/n),bw=w/n-.5;g.fillStyle='#7d838a';g.fillRect(bx,y-2,bw,3.5);g.fillStyle='#a8aeb4';g.fillRect(bx,y-2,bw,.5);g.fillStyle='#5a6066';g.fillRect(bx,y+1,bw,.5);
        g.fillStyle=i%2?'#e5c53b':'#2a2d30';g.fillRect(bx+.3,y-1,bw-.6,.5);g.fillStyle=i%2?'#2a2d30':'#e5c53b';g.fillRect(bx+.3,y-.1,bw-.6,.5)}
      g.fillStyle='#6f6a52';for(let i=0;i<w-1;i+=1.5){g.fillRect(x+i,y+1.7,1.5,1);g.fillStyle='#8b856a';g.fillRect(x+i,y+1.7,1.5,.5);g.fillStyle='#6f6a52'}
      g.fillStyle='#d8dde0';g.fillRect(x,y-3.3,w,.5);g.fillStyle='#c0392b';for(let i=0;i<w;i+=2)g.fillRect(x+i,y-3.3,1,.5);
      const on=Math.floor((t||0)*3)%2;g.fillStyle=on?'#ff3b2f':'#5a1410';g.fillRect(x+w-1,y-4.8,1,1);if(on)Post.glow(x+w-.5,y-4.3,7,'255,59,47',.5)}
  }})();
Maps.barrier=Art3.barrier;
