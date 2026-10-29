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
      cx.restore();Post.glow(x,y,12,'200,230,255',.1)}
  }})();
