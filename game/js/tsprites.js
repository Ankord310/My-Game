'use strict';
// Спрайты для вида сверху: 16 направлений × кадры анимации, генерируются кодом
const TS=(()=>{
  const SZ=30,CX=15,ND=16;
  const PAL={
    sci:{skin:'#eab895',skinD:'#c58f70',hair:'#4a2e1c',coat:'#e8f0f4',coatD:'#aab9c5',coatL:'#ffffff',pants:'#2f3c4c',shoe:'#14171b',k:'sci'},
    z0:{skin:'#8eb08c',skinD:'#5f8062',hair:'#262b26',coat:'#9aa6a2',coatD:'#5f6c68',coatL:'#b9c4c0',pants:'#2b3440',shoe:'#14171b',eye:'#ff3b2f',k:'z',seed:3},
    z1:{skin:'#86a384',skinD:'#587758',hair:'#1a1d1a',coat:'#3a5078',coatD:'#222f48',coatL:'#556e9c',pants:'#222a38',shoe:'#101214',eye:'#ff5b2f',k:'z',seed:8},
    z2:{skin:'#92ad88',skinD:'#647f5c',hair:'#2e2a22',coat:'#c4702e',coatD:'#8a4c1e',coatL:'#e08a44',pants:'#3a4250',shoe:'#101214',eye:'#ffcf2f',k:'z',seed:15},
    sol:{skin:'#d4ac8a',skinD:'#a8826a',hair:'#222',coat:'#4b5f3e',coatD:'#303d29',coatL:'#6f8650',pants:'#2c3626',shoe:'#0e0f10',helm:'#7b8c58',helmL:'#b3c785',visor:'#9fe8d6',k:'sol'}
  };
  const adj0=(c,a)=>{const v=[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(c.slice(i,i+2),16)+a)));return'#'+v.map(n=>n.toString(16).padStart(2,'0')).join('')};
  const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  function outline(c){
    const g=c.getContext('2d'),w=c.width,h=c.height,d=g.getImageData(0,0,w,h),a=d.data,o=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(a[(y*w+x)*4+3]>0)continue;
      if((x>0&&a[(y*w+x-1)*4+3]>0)||(x<w-1&&a[(y*w+x+1)*4+3]>0)||(y>0&&a[((y-1)*w+x)*4+3]>0)||(y<h-1&&a[((y+1)*w+x)*4+3]>0))o[y*w+x]=1}
    for(let i=0;i<o.length;i++)if(o[i]){a[i*4]=8;a[i*4+1]=10;a[i*4+2]=15;a[i*4+3]=255}
    g.putImageData(d,0,0);return c;
  }
  function fig(g,P,a,ph,o){
    const fx=Math.cos(a),fy=Math.sin(a),px=-fy,py=fx,sn=o.sneak?.86:1,sw=Math.sin(ph);
    const D=(f,s,r,col)=>{const x=CX+fx*f+px*s,y=CX+fy*f+py*s,R=Math.ceil(r);g.fillStyle=col;
      for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const xx=Math.round(x)+i,yy=Math.round(y)+j;if((xx-x)*(xx-x)+(yy-y)*(yy-y)<=r*r+.3)g.fillRect(xx,yy,1,1)}};
    const L=(f0,s0,f1,s1,r,col)=>{const n=Math.max(2,Math.ceil(Math.hypot(f1-f0,s1-s0)));for(let i=0;i<=n;i++)D(f0+(f1-f0)*i/n,s0+(s1-s0)*i/n,r,col)};
    const z=P.k==='z',sol=P.k==='sol',sci=P.k==='sci';
    if(o.down){ // лежит
      for(let f=-6;f<=4;f+=1.5){D(f,0,3.4*sn,P.coat);D(f-.8,0,2.6,P.coatD)}
      D(-8,1.8,1.8,P.pants);D(-8,-1.8,1.8,P.pants);D(-9,1.8,1.4,P.shoe);D(-9,-1.8,1.4,P.shoe);
      L(0,3.5,5,5.5,1.5,P.coat);L(0,-3.5,6,-4.5,1.5,P.coatD);D(5,5.5,1.4,P.skin);D(6,-4.5,1.4,P.skinD);
      D(7,0,3.4,P.skin);D(6.2,0,3.2,P.hair);if(z){D(9,1.2,.6,'#220808')}
      if(z){D(-1,1.5,1.5,'#7a1a1a');D(2,-1,1,'#7a1a1a')}
      return;
    }
    // ноги
    const st=sw*(z?2.4:3.2)*(o.idle?0:1);
    D(st-1,2.5*sn,2.1,P.pants);D(-st-1,-2.5*sn,2.1,P.pants);
    D(st+1.4,2.5*sn,1.9,P.shoe);D(-st+1.4,-2.5*sn,1.9,P.shoe);
    // торс
    for(const s of[-4.6,-2.3,0,2.3,4.6]){D(-1.2,s*sn,3.1,P.coatD)}
    for(const s of[-4.2,-2.1,0,2.1,4.2]){D(-.2,s*sn,3.1,P.coat)}
    D(.8,-2.6*sn,1.4,P.coatL);D(.5,2.6*sn,1.2,P.coatL);
    if(sol){D(-.8,0,3.4,'#1f2a22');D(-2,0,2.2,'#2c3a30');D(.6,-3.4,1.3,'#7b8c58');D(.6,3.4,1.3,'#7b8c58');D(-4,0,2.2,'#3a4636')}
    if(z){let s=P.seed||1;const r=()=>(s=(s*9301+49297)%233280)/233280;for(let i=0;i<5;i++)D(-2+r()*3,(r()-.5)*8,.8,'#7a1a1a')}
    // руки
    if(z){
      const sway=sw*1.1;
      L(0,4.4,4,4.2,1.7,P.coat);L(4,4.2,8.5+sway,3.2,1.5,P.skinD);D(9+sway,3.2,1.6,P.skin);
      L(0,-4.4,4,-4.2,1.7,P.coatD);L(4,-4.2,8.5-sway,-3.2,1.5,P.skinD);D(9-sway,-3.2,1.6,P.skin);
    }else if(o.strike){
      L(0,4.4,4,3.2,1.8,P.coat);L(4,3.2,10,1.8,1.7,P.coat);D(11,1.8,1.9,P.skin);
      L(0,-4.4,-1,-5.5,1.7,P.coatD);D(-1,-5.8,1.6,P.skin);
    }else if(sol){
      L(0,4.2,5,2.2,1.7,P.coatD);D(5.5,2,1.6,P.skin);
      L(0,-4.2,6,-1.2,1.7,P.coat);D(10,-.8,1.6,P.skin);
      L(1,2.6,16,-.4,1.1,'#0e1012');L(3,2.2,10,.4,.7,'#3a4048');D(8,.9,.9,'#2a2f36');
      if(o.shoot){D(18.5,-.4,2.6,'#fff6c8');D(20,-.4,1.6,'#ffe28a')}
    }else{
      const sw2=sw*3.4;
      L(0,4.6,sw2*.5,5,1.7,P.coat);D(sw2,5.4,1.6,P.skin);
      L(0,-4.6,-sw2*.5,-5,1.7,P.coatD);D(-sw2,-5.4,1.6,P.skin);
    }
    // голова
    D(1.2,0,3.7*sn,P.skin);D(.8,-2.4,1.2,P.skinD);
    if(sci){D(-.6,0,3.5*sn,P.hair);D(-2,0,2.4,P.hair);D(3.2,-1.7,.75,'#7fd8ee');D(3.2,1.7,.75,'#7fd8ee')}
    else if(z){D(-.4,0,3.4*sn,P.hair);D(0,2.4,1.3,P.hair);D(3.4,-1.6,.8,P.eye);D(3.4,1.6,.8,P.eye);D(4.2,0,.7,'#220808');D(-1,-2.6,.9,'#7a1a1a')}
    else{D(.4,0,4.5,P.helm);D(1,-1.8,1.4,P.helmL);D(-1.2,0,2.6,adj0(P.helm,-36));D(3.8,0,1.7,P.visor);D(4.7,0,.8,'#10161c')}
  }
  const FR={};
  function build(){
    for(const k of Object.keys(PAL)){const P=PAL[k],f=FR[k]={};
      const mkset=(n,fn)=>{const arr=[];for(let d=0;d<ND;d++){const row=[];for(let i=0;i<n;i++){const c=mk(SZ,SZ);fn(c.getContext('2d'),d*Math.PI*2/ND,i);row.push(outline(c))}arr.push(row)}return arr};
      f.walk=mkset(6,(g,a,i)=>fig(g,P,a,i*Math.PI*2/6,{}));
      f.idle=mkset(2,(g,a,i)=>fig(g,P,a,0,{idle:1}));
      f.sneak=mkset(6,(g,a,i)=>fig(g,P,a,i*Math.PI*2/6,{sneak:1}));
      f.down=mkset(1,(g,a)=>fig(g,P,a,0,{down:1}));
      if(k==='sci')f.strike=mkset(1,(g,a)=>fig(g,P,a,0,{strike:1}));
      if(k==='sol')f.shoot=mkset(1,(g,a)=>fig(g,P,a,0,{shoot:1}));
    }
  }
  const dirOf=a=>((Math.round(a/(Math.PI*2)*ND)%ND)+ND)%ND;
  return{build,FR,SZ,CX,PAL,
    draw(g,kind,pose,a,fr,x,y,alpha){
      const set=(FR[kind][pose]||FR[kind].idle)[dirOf(a)],c=set[Math.floor(fr)%set.length];
      if(alpha!=null&&alpha<1)g.globalAlpha=alpha;g.drawImage(c,Math.round(x)-CX,Math.round(y)-CX);if(alpha!=null&&alpha<1)g.globalAlpha=1}};
})();
if(typeof document!=='undefined')TS.build();
