'use strict';
// Спрайты: скелетная пиксельная отрисовка в кэш (кадры с обводкой, затенением, анимацией)
const Spr=(()=>{
  const SW=28,SH=34,AX=14,YF=32;
  const PAL={
    sci:{skin:'#eab895',skinD:'#c58f70',hair:'#4a2e1c',coat:'#e8f0f4',coatD:'#aab9c5',coatL:'#ffffff',inner:'#5f86a8',pants:'#2f3c4c',pantsD:'#1f2a37',shoe:'#14171b',glass:'#7fd8ee',badge:'#3fd68a',kind:'sci'},
    z0:{skin:'#8eb08c',skinD:'#5f8062',hair:'#262b26',coat:'#9aa6a2',coatD:'#5f6c68',coatL:'#b9c4c0',inner:'#4a5a5e',pants:'#2b3440',pantsD:'#1b222b',shoe:'#14171b',eye:'#ff3b2f',kind:'z',seed:3},
    z1:{skin:'#86a384',skinD:'#587758',hair:'#1a1d1a',coat:'#34476a',coatD:'#222f48',coatL:'#4a6290',inner:'#2a3342',pants:'#222a38',pantsD:'#161b25',shoe:'#101214',eye:'#ff5b2f',kind:'z',seed:8},
    z2:{skin:'#92ad88',skinD:'#647f5c',hair:'#2e2a22',coat:'#c4702e',coatD:'#8a4c1e',coatL:'#e08a44',inner:'#5c6068',pants:'#3a4250',pantsD:'#262c36',shoe:'#101214',eye:'#ffcf2f',kind:'z',seed:15},
    sol:{skin:'#d4ac8a',skinD:'#a8826a',hair:'#222',coat:'#46684c',coatD:'#2f4a35',coatL:'#5f8a66',inner:'#2a3a2e',pants:'#2c4032',pantsD:'#1d2c22',shoe:'#0e0f10',helm:'#33493a',helmL:'#4a6a54',vest:'#26342b',visor:'#9fe8d6',kind:'sol'}
  };
  const mk=(w,h,fn)=>{const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'));return c};
  function seg(g,x0,y0,x1,y1,w,col){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);g.fillStyle=col;for(let i=0;i<=n;i++){g.fillRect(Math.round(x0+(x1-x0)*i/n-w/2),Math.round(y0+(y1-y0)*i/n-w/2),w,w)}}
  function outline(c){
    const g=c.getContext('2d'),w=c.width,h=c.height,d=g.getImageData(0,0,w,h),a=d.data,o=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(a[(y*w+x)*4+3]>0)continue;
      if((x>0&&a[(y*w+x-1)*4+3]>0)||(x<w-1&&a[(y*w+x+1)*4+3]>0)||(y>0&&a[((y-1)*w+x)*4+3]>0)||(y<h-1&&a[((y+1)*w+x)*4+3]>0))o[y*w+x]=1}
    for(let i=0;i<o.length;i++)if(o[i]){a[i*4]=9;a[i*4+1]=12;a[i*4+2]=17;a[i*4+3]=255}
    g.putImageData(d,0,0);return c;
  }
  // o: ph — фаза шага, bob, crouch, arms: swing|fwd|up|s0|s1|aim, legs: walk|tuck|climb, lean, rifle
  function draw(g,P,o){
    const leg=o.crouch?6:9,tor=o.crouch?8:10,hy=YF-leg-(o.bob||0),sy=hy-tor,lean=o.lean||0,ph=o.ph||0,z=P.kind==='z',sol=P.kind==='sol';
    const hx=AX,shx=AX+lean,hdx=AX+Math.round(lean*1.4);
    const legAt=side=>{
      let a=Math.sin(ph+side*Math.PI)*(z?.55:.85),fx,fy=YF,kx,ky;
      if(o.legs==='tuck'){fx=hx+(side?3:-1);fy=YF-3;kx=hx+(side?5:2);ky=hy+4}
      else if(o.legs==='climb'){const up=Math.sin(ph+side*Math.PI);fx=hx+1;fy=YF-(up>0?5:0);kx=hx+3;ky=hy+(up>0?3:5)}
      else{fx=hx+Math.sin(a)*(leg*.75);fy=YF-Math.max(0,-Math.cos(ph+side*Math.PI))*(o.crouch?1:2.5);kx=hx+Math.sin(a)*(leg*.4)+(o.crouch?4:1.5);ky=(hy+fy)/2}
      if(o.crouch&&o.legs!=='tuck'){kx=hx+4+Math.sin(a)*2;ky=hy+3}
      const dk=side?P.pantsD:P.pants;
      seg(g,hx,hy,kx,ky,3,dk);seg(g,kx,ky,fx,fy-1,3,dk);
      g.fillStyle=P.shoe;g.fillRect(Math.round(fx-1),Math.round(fy-2),5,3);g.fillStyle='#2a2f36';g.fillRect(Math.round(fx),Math.round(fy-2),3,1);
    };
    const armAt=(side)=>{
      const sx=shx+(side?-1:1),sy2=sy+2;let hxp,hyp,ex,ey;
      const m=o.arms||'swing',s=Math.sin(ph+(side?0:Math.PI));
      if(m==='fwd'){hxp=sx+9+(side?-2:0);hyp=sy2+1+(side?2:0)+Math.sin(ph*2+side)*1;ex=(sx+hxp)/2;ey=sy2+3}
      else if(m==='up'){hxp=sx+(side?3:-2);hyp=sy2-9+(Math.sin(ph+side*Math.PI)>0?3:0);ex=sx+(side?1:-1);ey=sy2-3}
      else if(m==='s0'){if(side){hxp=sx-6;hyp=sy2-8;ex=sx-5;ey=sy2-2}else{hxp=sx+2;hyp=sy2+7;ex=sx+1;ey=sy2+4}}
      else if(m==='s1'){if(side){hxp=sx+9;hyp=sy2-1;ex=sx+4;ey=sy2+1}else{hxp=sx+1;hyp=sy2+7;ex=sx;ey=sy2+4}}
      else if(m==='aim'){hxp=sx+(side?7:10);hyp=sy2+1+(side?1:0);ex=sx+4;ey=sy2+3}
      else if(o.rifle){hxp=sx+(side?7:3);hyp=sy2+5;ex=sx+(side?3:1);ey=sy2+5}
      else{hxp=sx+s*5;hyp=sy2+8-Math.abs(s)*1.5;ex=sx+s*2.5;ey=sy2+4}
      const c=side?P.coatD:P.coat;seg(g,sx,sy2,ex,ey,3,c);seg(g,ex,ey,hxp,hyp,2,z&&!side?P.skinD:c);
      g.fillStyle=z?P.skin:P.skin;g.fillRect(Math.round(hxp-1),Math.round(hyp-1),3,3);
      if(z){g.fillStyle='#7a1a1a';g.fillRect(Math.round(ex),Math.round(ey),2,1)}
      return [hxp,hyp];
    };
    legAt(1);const back=armAt(1);
    // туловище
    const tx=shx-4,tw=9;
    if(P.kind==='sci'||z){
      const hem=o.crouch?2:3;g.fillStyle=P.coat;g.fillRect(tx,sy,tw,tor+hem);
      g.fillStyle=P.coatL;g.fillRect(tx,sy+1,1,tor+hem-2);g.fillStyle=P.coatD;g.fillRect(tx+tw-2,sy,2,tor+hem);
      g.fillStyle=P.inner;g.fillRect(shx,sy+1,2,tor-1);g.fillStyle=P.skin;g.fillRect(shx,sy,2,2);g.fillStyle=P.coatD;g.fillRect(tx+1,sy+tor-3,3,1);
      if(P.kind==='sci'){g.fillStyle=P.badge;g.fillRect(shx+3,sy+4,2,2);g.fillStyle='#0b1117';g.fillRect(tx+1,sy+tor+hem,tw-2,1)}
      else{ // рваный подол и кровь
        g.fillStyle='rgba(0,0,0,0)';for(let i=0;i<tw;i+=2)g.clearRect(tx+i,sy+tor+hem-1,1,1);
        let s=P.seed;const r=()=>(s=(s*9301+49297)%233280)/233280;g.fillStyle='#7a1a1a';
        for(let i=0;i<9;i++)g.fillRect(tx+Math.floor(r()*tw),sy+1+Math.floor(r()*(tor+hem-2)),1+Math.floor(r()*2),1+Math.floor(r()*2));
        g.fillStyle=P.skinD;g.fillRect(tx+1,sy+tor+hem-1,2,1)}
    }else{ // солдат: бронежилет
      g.fillStyle=P.coat;g.fillRect(tx,sy,tw,tor+2);g.fillStyle=P.vest;g.fillRect(tx+1,sy+1,tw-2,tor-1);g.fillStyle=P.coatL;g.fillRect(tx+1,sy+1,1,tor-1);
      g.fillStyle='#16201a';g.fillRect(tx+2,sy+tor-4,5,3);g.fillStyle='#46684c';g.fillRect(tx+2,sy+3,5,1);g.fillStyle=P.coatD;g.fillRect(tx+tw-2,sy,2,tor+2)}
    legAt(0);
    // голова
    const hdy=sy-7;
    g.fillStyle=P.skin;g.fillRect(hdx-3,hdy,7,7);g.fillStyle=P.skinD;g.fillRect(hdx+3,hdy+1,1,6);g.fillRect(hdx-3,hdy+6,7,1);
    if(P.kind==='sci'){g.fillStyle=P.hair;g.fillRect(hdx-3,hdy-1,7,3);g.fillRect(hdx-4,hdy,2,4);g.fillStyle='#10161c';g.fillRect(hdx+2,hdy+3,1,1);g.fillStyle=P.glass;g.fillRect(hdx+1,hdy+2,3,2);g.fillStyle='#10161c';g.fillRect(hdx+2,hdy+3,1,1);g.fillStyle='#a2634c';g.fillRect(hdx+1,hdy+5,2,1)}
    else if(z){g.fillStyle=P.hair;g.fillRect(hdx-3,hdy-1,6,2);g.fillRect(hdx-4,hdy,1,3);g.fillRect(hdx+1,hdy-2,2,1);g.fillStyle='#0c1010';g.fillRect(hdx,hdy+2,2,2);g.fillRect(hdx+2,hdy+2,2,2);g.fillStyle=P.eye;g.fillRect(hdx+1,hdy+3,1,1);g.fillRect(hdx+3,hdy+3,1,1);g.fillStyle='#220808';g.fillRect(hdx+1,hdy+5,3,2);g.fillStyle='#e8e0d0';g.fillRect(hdx+1,hdy+5,1,1);g.fillRect(hdx+3,hdy+5,1,1);g.fillStyle='#7a1a1a';g.fillRect(hdx-2,hdy+4,1,2)}
    else{g.fillStyle=P.helm;g.fillRect(hdx-4,hdy-2,9,5);g.fillStyle=P.helmL;g.fillRect(hdx-3,hdy-2,5,1);g.fillStyle=P.visor;g.fillRect(hdx+1,hdy+2,4,2);g.fillStyle='#10161c';g.fillRect(hdx+3,hdy+2,1,1);g.fillStyle=P.coatD;g.fillRect(hdx-3,hdy+5,7,1)}
    const front=armAt(0);
    if(P.kind==='sci'&&(o.arms==='s0'||o.arms==='s1')){const[hxp,hyp]=front;if(o.arms==='s1')seg(g,hxp,hyp,hxp+9,hyp-2,2,'#9fb0bb');else seg(g,hxp,hyp,hxp+2,hyp-9,2,'#9fb0bb')}
    if(sol){const[hxp,hyp]=front;if(o.arms==='aim')seg(g,hxp-9,hyp,hxp+8,hyp-1,2,'#101214');else seg(g,shx-3,sy+7,shx+9,sy+5,2,'#101214')}
  }
  const FR={};
  function build(){
    const mkf=(P,o)=>outline(mk(SW,SH,g=>draw(g,P,o)));
    const lie=c=>outline(mk(SH,SW,g=>{g.translate(0,SW);g.rotate(-Math.PI/2);g.drawImage(c,0,0)}));
    for(const k of Object.keys(PAL)){
      const P=PAL[k],z=P.kind==='z',f={};
      f.walk=[0,1,2,3,4,5].map(i=>mkf(P,{ph:i*Math.PI*2/6,bob:i%3===0?1:0,arms:z?'fwd':(P.kind==='sol'?'rifle':'swing'),lean:z?3:0,rifle:P.kind==='sol'}));
      f.idle=[0,1].map(i=>mkf(P,{ph:0,bob:i,arms:z?'fwd':(P.kind==='sol'?'rifle':'swing'),lean:z?2:0,rifle:P.kind==='sol',legAmp:0}));
      f.idle=f.idle.map((c,i)=>c);
      f.jump=[mkf(P,{legs:'tuck',arms:z?'fwd':'up',lean:1,rifle:P.kind==='sol'})];
      f.climb=[0,1].map(i=>mkf(P,{legs:'climb',arms:'up',ph:i*Math.PI,lean:1}));
      f.down=[lie(mkf(P,{ph:0,arms:'fwd',legAmp:0}))];
      if(P.kind==='sci'){f.crouch=[0,1,2,3].map(i=>mkf(P,{ph:i*Math.PI/2,crouch:1,arms:'swing',lean:2}));f.strike=[mkf(P,{arms:'s0',ph:0.4,lean:-1}),mkf(P,{arms:'s1',ph:.2,lean:2})]}
      if(P.kind==='sol'){f.aim=[mkf(P,{arms:'aim',ph:.3,rifle:true})]}
      FR[k]=f;
    }
  }
  return{build,FR,AX,YF,SW,SH,
    // x,y — точка стоп; f — направление; poses: walk|idle|jump|climb|down|crouch|strike|aim
    draw(g,kind,pose,i,x,y,f,alpha){
      const set=FR[kind][pose]||FR[kind].idle,c=set[i%set.length];if(alpha!=null)g.globalAlpha=alpha;
      g.save();g.translate(Math.round(x),Math.round(y));g.scale(f<0?-1:1,1);
      if(pose==='down')g.drawImage(c,-17,-26);else g.drawImage(c,-AX,-YF);
      g.restore();if(alpha!=null)g.globalAlpha=1;
    }};
})();
if(typeof document!=='undefined')Spr.build();
