'use strict';
// Стартовая страница: живая ночная сцена на канвасе + меню, настройки, справка, выбор этапа
const Title={
  tut:null,t:0,built:false,flash:0,nextFlash:7,drops:[],spl:[],figs:[],
  build(){
    const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c},R=mulberry(21),P=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
    const mix=(a,b,t)=>{const A=hx(a),B=hx(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
    // небо
    const sky=this.sky=mk(W,H),g=sky.getContext('2d'),st=[[0,'#03050b'],[.3,'#0a0e20'],[.55,'#1a1633'],[.8,'#40213a'],[1,'#6a2f3a']];
    for(let y=0;y<210;y+=2){const t=y/210;let k=0;while(k<st.length-2&&t>st[k+1][0])k++;const a=st[k],b=st[k+1];P(g,0,y,W,2,mix(a[1],b[1],clamp((t-a[0])/(b[0]-a[0]),0,1)))}
    this.stars=[];for(let i=0;i<110;i++){const s={x:R()*W|0,y:R()*120|0,p:R()*6,b:R()};this.stars.push(s)}
    // луна
    const mx=368,my=54;const gr=g.createRadialGradient(mx,my,6,mx,my,60);gr.addColorStop(0,'rgba(200,215,255,.38)');gr.addColorStop(1,'rgba(200,215,255,0)');g.fillStyle=gr;g.fillRect(mx-60,my-60,120,120);
    g.fillStyle='#e9eef6';g.beginPath();g.arc(mx,my,16,0,6.3);g.fill();g.fillStyle='#c4ccd9';for(const[a,b,r]of[[-5,-3,4],[4,5,3],[-1,8,2.2],[6,-6,2]]){g.beginPath();g.arc(mx+a,my+b,r,0,6.3);g.fill()}
    g.fillStyle='#fff';g.beginPath();g.arc(mx-4,my-5,6,0,6.3);g.fillStyle='rgba(255,255,255,.35)';g.fill();
    // облака
    const cl=this.cloud=mk(W*2,60),cg=cl.getContext('2d');for(let i=0;i<26;i++){const x=R()*W*2,y=8+R()*40,w=40+R()*90;for(let k=0;k<5;k++){cg.fillStyle='rgba(120,110,160,'+(.05+R()*.06)+')';cg.fillRect(x+k*6,y+k%2*2,w-k*10,3+R()*3)}}
    // силуэты
    const lay=(base,mn,mxh,wmin,wmax,col,ant,win)=>{const c=mk(W,H),gg=c.getContext('2d'),list=[];let x=-6;
      while(x<W){const w=wmin+R()*(wmax-wmin)|0,h=mn+R()*(mxh-mn)|0;P(gg,x,base-h,w,h+40,col);P(gg,x,base-h,w,1,mix(col,'#8aa0c8',.18));
        if(R()<.4)P(gg,x+w/2-1,base-h-6-R()*8,2,10,col);if(R()<.25)P(gg,x+2,base-h-3,w-4,3,col);
        if(ant&&R()<.35){P(gg,x+w/2,base-h-14,1,14,col);list.push({x:x+w/2,y:base-h-14,r:1,p:R()*6})}
        if(win)for(let wy=base-h+4;wy<base-3;wy+=5)for(let wx=x+3;wx<x+w-3;wx+=4)if(R()<win)list.push({x:wx,y:wy,c:R()<.8?'#e5c07b':R()<.5?'#6fd8d0':'#ff9a5a',p:R()*6,f:.3+R()*3,w:1});
        x+=w+(R()<.25?2:0)}
      return{c,list}};
    this.far=lay(176,26,84,10,26,'#10162a',false,.04);this.mid=lay(198,22,86,12,30,'#0a0f1e',false,.14);this.near=lay(228,18,70,14,40,'#05070d',true,0);
    // «Эпицентр»: приземистый комплекс с трубами в дальнем плане
    const fg=this.far.c.getContext('2d');P(fg,96,150,62,30,'#0a1020');P(fg,104,140,6,12,'#0a1020');P(fg,128,136,5,16,'#0a1020');P(fg,146,142,5,10,'#0a1020');this.far.list.push({x:106,y:142,r:1,p:1},{x:130,y:138,r:1,p:3});
    // земля
    const gd=this.ground=mk(W,H),gg=gd.getContext('2d');P(gg,0,226,W,H-226,'#070a12');for(let y=226;y<H;y+=2)P(gg,0,y,W,2,mix('#0b1020','#030409',(y-226)/(H-226)));P(gg,0,226,W,2,'#1a2236');
    for(let i=0;i<9;i++)P(gg,R()*W,232+R()*34,20+R()*40,1,'rgba(120,150,200,.12)');
    for(let x=14;x<W;x+=60)P(gg,x,252,22,2,'rgba(200,210,230,.1)');
    this.lamps=[70,230,400,560,720].filter(x=>x<W-24);for(const x of this.lamps){P(gg,x,176,2,52,'#12182a');P(gg,x-6,174,14,2,'#12182a');P(gg,x-5,176,5,2,'#ffe9b0')}
    // отражение
    const rf=this.refl=mk(W,40),rg=rf.getContext('2d');rg.save();rg.translate(0,40);rg.scale(1,-1);rg.drawImage(this.mid.c,0,198-40+1+0-1+0,W,40,0,0,W,40);rg.drawImage(this.near.c,0,228-40,W,40,0,0,W,40);rg.restore();
    this.fogs=[0,1,2].map(i=>({x:i*180,y:200+i*8,v:6+i*3}));
    this.drops=[];for(let i=0;i<150;i++)this.drops.push({x:R()*W,y:R()*H,v:190+R()*110,l:4+R()*4});
    this.beams=[{x:420,a:-2.2,w:.07,s:.6,ph:0},{x:60,a:-.9,w:.06,s:.45,ph:2}];
    this.t=0;this.built=true;this.bw=W;this.figs=[{k:'sci',x:-30,v:12,y:250,f:1,i:0},{k:'z0',x:-110,v:7,y:244,f:1,i:2,al:.55},{k:'z1',x:-170,v:6,y:246,f:1,i:4,al:.5}];
  },
  enter(){if(!this.built||this.bw!==W)this.build();Snd.play('menu')},
  resize(){if(this.built&&this.bw!==W)this.build()},
  exit(){},
  update(dt){
    this.t+=dt;this.nextFlash-=dt;if(this.nextFlash<=0){this.flash=1;this.nextFlash=8+Math.random()*10}this.flash=Math.max(0,this.flash-dt*2.2);
    for(const d of this.drops){d.y+=d.v*dt;d.x-=d.v*.16*dt;if(d.y>H){if(d.y>228&&Math.random()<.5)this.spl.push({x:d.x,y:228+Math.random()*38,l:.3});d.y=-6;d.x=Math.random()*(W+40)}}
    this.spl=this.spl.filter(s=>(s.l-=dt)>0);
    for(const f of this.figs){f.x+=f.v*dt;if(f.x>W+40){f.x=-60-Math.random()*60}}
    for(const f of this.fogs){f.x+=f.v*dt;if(f.x>W)f.x-=W*1.4}
  },
  draw(){
    const t=this.t,g=cx;cx.imageSmoothingEnabled=false;
    g.drawImage(this.sky,0,0);
    for(const s of this.stars){const a=.35+.5*Math.sin(t*(.8+s.b*2)+s.p);if(a>.3){g.fillStyle='rgba(235,240,255,'+(a*.8).toFixed(2)+')';g.fillRect(s.x,s.y,1,1)}}
    const cs=(t*3)%W;g.globalAlpha=1;g.drawImage(this.cloud,-cs,40);g.drawImage(this.cloud,W*2-cs,40);
    // свечение над «Эпицентром»
    const ep=.16+.08*Math.sin(t*1.3)+.05*Math.sin(t*5.1);const gr=g.createRadialGradient(128,176,4,128,176,90);gr.addColorStop(0,'rgba(255,50,30,'+ep+')');gr.addColorStop(1,'rgba(255,50,30,0)');g.fillStyle=gr;g.fillRect(30,90,200,130);
    g.drawImage(this.far.c,0,0);for(const a of this.far.list){if(a.r&&Math.sin(t*2.4+a.p)>.4){g.fillStyle='#ff3b2f';g.fillRect(a.x,a.y,2,2)}else if(a.w&&Math.sin(t*a.f+a.p)>-.7){g.fillStyle=a.c;g.fillRect(a.x,a.y,1,1)}}
    // лучи прожекторов
    g.save();g.globalCompositeOperation='lighter';for(const b of this.beams){const a=b.a+Math.sin(t*b.s+b.ph)*.5,l=300;g.fillStyle='rgba(180,210,255,.07)';g.beginPath();g.moveTo(b.x,226);g.lineTo(b.x+Math.cos(a-b.w)*l,226+Math.sin(a-b.w)*l);g.lineTo(b.x+Math.cos(a+b.w)*l,226+Math.sin(a+b.w)*l);g.fill()}g.restore();
    g.drawImage(this.mid.c,0,0);
    for(const a of this.mid.list){if(a.w&&Math.sin(t*a.f+a.p)>-.85){g.fillStyle=a.c;g.fillRect(a.x,a.y,2,2);if(a.f<.8){g.fillStyle='rgba(229,192,123,.12)';g.fillRect(a.x-1,a.y-1,4,4)}}}
    // туман
    for(const f of this.fogs){const w=220,gr2=g.createLinearGradient(f.x,0,f.x+w,0);gr2.addColorStop(0,'rgba(120,130,170,0)');gr2.addColorStop(.5,'rgba(120,130,170,.09)');gr2.addColorStop(1,'rgba(120,130,170,0)');g.fillStyle=gr2;g.fillRect(f.x,f.y,w,26)}
    g.drawImage(this.near.c,0,0);for(const a of this.near.list){if(a.r&&Math.sin(t*2+a.p)>.6){g.fillStyle='#ff3b2f';g.fillRect(a.x-1,a.y-1,2,2);g.fillStyle='rgba(255,59,47,.2)';g.fillRect(a.x-3,a.y-3,6,6)}}
    g.drawImage(this.ground,0,0);
    // свет фонарей
    for(const x of this.lamps){const fl=.75+.25*Math.sin(t*9+x)*(Math.sin(t*.7+x)>.9?1:.1);const gl=g.createRadialGradient(x-3,177,2,x-3,200,70);gl.addColorStop(0,'rgba(255,225,160,'+(.38*fl).toFixed(2)+')');gl.addColorStop(1,'rgba(255,225,160,0)');g.fillStyle=gl;g.fillRect(x-80,170,160,100);
      g.fillStyle='rgba(255,225,160,'+(.09*fl).toFixed(2)+')';g.beginPath();g.moveTo(x-4,178);g.lineTo(x-34,252);g.lineTo(x+30,252);g.fill()}
    // отражения на мокром асфальте
    g.globalAlpha=.3;for(let i=0;i<10;i++){const sy=i*4,off=Math.round(Math.sin(t*2+i*.9)*1.5);g.drawImage(this.refl,0,sy,W,4,off,228+sy,W,4)}g.globalAlpha=1;
    // фигуры
    for(const f of this.figs){const k=f.k==='sci'?'sci':f.k;g.save();Spr.draw(g,k,'walk',Math.floor(t*(f.k==='sci'?6:3.5)+f.i),f.x,f.y,1,f.al);g.restore()}
    // дождь
    g.fillStyle='rgba(170,200,230,.5)';for(const d of this.drops){g.fillRect(d.x|0,d.y|0,1,d.l|0)}
    g.fillStyle='rgba(170,200,230,.35)';for(const s of this.spl){const r=(.3-s.l)*14;g.fillRect(s.x-r,s.y,r*2,1)}
    // молния
    if(this.flash>0){g.fillStyle='rgba(200,215,255,'+(this.flash*this.flash*.3).toFixed(3)+')';g.fillRect(0,0,W,H)}
    // виньетка и скан-линии
    const vg=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.62)');g.fillStyle=vg;g.fillRect(0,0,W,H);
    g.fillStyle='rgba(0,0,0,.12)';for(let y=0;y<H;y+=3)g.fillRect(0,y,W,1);
  },
  // ---------------------------------------------------------------- экраны меню
  show(html){screen(html);$('#screen').classList.add('tr')},
  refresh(){if(this.pg==='home')this.home();else if(this.pg==='ach')this.ach()},
  home(){
    const done=this.rd();this.pg='home';
    this.show(`<div class="ttl"><div class="logo">${'ЭПИЦЕНТР'.split('').map((c,i)=>`<span style="animation-delay:${(i*1.7)%5}s">${c}</span>`).join('')}</div>
      <div class="sub">СИМУЛЯТОР КАТАСТРОФЫ</div>
      <div class="mn"><button class="pbtn pri" data-a="new">▶ Новая кампания</button><button class="pbtn" data-a="demo">Выбор этапа</button><button class="pbtn" data-a="ach">Достижения <span class="cc">${Prog.endCount()}/${ENDS.length}</span></button><button class="pbtn" data-a="settings">Настройки</button><button class="pbtn" data-a="howto">Как играть</button></div>
      <div class="ver" data-a="ver">v0.7.0 · демо${done?' · ★':''}</div></div>`)},
  rd(){return !!Prog.d.raid},
  ach(){this.pg='ach';
    const n=Prog.endCount(),N=ENDS.length,ex=ACHS.filter(a=>Prog.d.ach[a.k]).length;
    this.show(`<div class="ttl pg ap"><div class="ah"><h2>Достижения</h2><div class="acs"><span class="nw">Концовки: <b>${n} из ${N}</b></span><div class="bar"><i style="width:0%" data-w="${Math.round(n/N*100)}"></i></div></div><button class="pbtn" data-a="menu">◀ Назад</button></div>
      <div class="sec">КОНЦОВКИ</div>
      <div class="ach ends">${ENDS.map((e,i)=>{const ok=Prog.d.end[e.k];return `<div class="ac${ok?'':' lk'}" style="animation-delay:${i*.07}s"><div class="ai" style="background-image:${ok?`url(${imgSrc(e.img)})`:'none'}"></div><div class="at"><b>${ok?esc(e.n):'??? ???'}</b><span>${esc(ok?e.d:e.h)}</span></div><i class="st">${ok?'★':'🔒'}</i></div>`}).join('')}</div>
      <div class="sec">НАГРАДЫ · ${ex} из ${ACHS.length}</div>
      <div class="ach sm">${ACHS.map((a,i)=>{const ok=Prog.d.ach[a.k];return `<div class="ac${ok?'':' lk'}" style="animation-delay:${.35+i*.05}s"><div class="ai">${ok?a.i:'🔒'}</div><div class="at"><b>${ok?esc(a.n):'???'}</b><span>${esc(a.d)}</span></div></div>`}).join('')}</div></div>`);
    setTimeout(()=>{document.querySelectorAll('.acs .bar i').forEach(i=>{i.style.width=i.dataset.w+'%'})},60);
  },
  demo(){this.pg="demo";
    const unl=this.rd()||OPT.dev;
    this.show(`<div class="ttl pg"><h2>Выбор этапа</h2><p class="lead">Каждый этап можно запустить отдельно: с типовыми последствиями предыдущих. Сюжетные слайды в этом режиме пропускаются.</p>
      <div class="mn2"><button class="pbtn" data-a="st" data-d="1">01 · Учёный</button><button class="pbtn" data-a="st" data-d="2">02 · Оператор</button><button class="pbtn" data-a="st" data-d="3">03 · Военный</button><button class="pbtn" data-a="st" data-d="4">04 · Штаб</button>
      ${unl?'<button class="pbtn red" data-a="st" data-d="5">05 · Особый этап</button>':'<button class="pbtn" disabled style="opacity:.45">05 · ???  🔒</button>'}</div>
      <div class="mn"><button class="pbtn" data-a="menu">◀ Назад</button></div></div>`)},
  settings(){this.pg='set';const sv=Store.ok();
    this.show(`<div class="ttl pg"><h2>Настройки</h2>
      <div class="opt"><span>Звук и музыка</span><button class="pbtn ${Snd.muted?'':'pri'}" data-a="opt" data-d="snd">${Snd.muted?'ВЫКЛ':'ВКЛ'}</button></div>
      <div class="opt"><span>Вибрация кнопок</span><button class="pbtn ${OPT.vib?'pri':''}" data-a="opt" data-d="vib">${OPT.vib?'ВКЛ':'ВЫКЛ'}</button></div>
      <div class="opt"><span>Обучение и подсказки</span><button class="pbtn ${OPT.tips?'pri':''}" data-a="opt" data-d="tips">${OPT.tips?'ВКЛ':'ВЫКЛ'}</button></div>
      <div class="opt"><span>Пройти обучение заново</span><button class="pbtn" data-a="opt" data-d="retut">Сбросить</button></div>
      <div class="opt"><span>Сохранение прогресса</span><b style="color:${sv?'#7dffa6':'#ff8d82'};font-size:1.3rem">${sv?'✓ работает'+(Store.ls?'':' (резерв)'):'✕ недоступно'}</b></div>
      <p class="lead" style="margin-top:.8rem">Кнопка «?» в правом верхнем углу в любой момент повторит подсказки этапа.</p>
      <div class="mn"><button class="pbtn" data-a="menu">◀ Назад</button></div></div>`)},
  howto(){this.pg="how";
    this.show(`<div class="ttl pg"><h2>Как играть</h2>
      <ul class="tl hw"><li><i class="ic">◉</i><span>Кампания — это цепочка этапов в разном масштабе управления: от одного человека до целой страны. Решения и результаты каждого этапа влияют на следующие.</span></li>
      <li><i class="ic">▦</i><span>В первом этапе учёный сам рассказывает, что делать. На этапах 2–4 короткое обучение подсвечивает нужные кнопки — нажимайте их. Краткая справка — кнопка «?».</span></li>
      <li><i class="ic">★</i><span>После этапа — слайды с итогами и оценкой. Финалов несколько, и путь к ним зависит только от вас.</span></li>
      <li><i class="ic">☰</i><span>${HINT('Управление — касанием экрана: на первом этапе слева стик, справа кнопки действий. На этапах с картой — нажимайте на метки и районы.','Первый этап: WASD или стрелки — идти, E — действие, пробел — удар, Shift — красться, Esc — пауза. На этапах с картой — щёлкайте мышью по меткам, районам и кнопкам.')}</span></li></ul>
      <div class="mn"><button class="pbtn" data-a="menu">◀ Назад</button></div></div>`)}
};
let verTaps=0;
ACT.demo=()=>{Flow.clear();setMode(Title);Title.demo()};
ACT.ach=()=>{Title.ach()};ACT.settings=()=>{Title.settings()};ACT.howto=()=>{Title.howto()};
ACT.opt=d=>{if(d==='snd')Snd.setMute(!Snd.muted);else if(d==='vib'){OPT.vib=!OPT.vib;saveOpt();if(OPT.vib)vib(30)}else if(d==='tips'){OPT.tips=!OPT.tips;saveOpt()}else if(d==='retut'){Prog.d.tut={};Prog.save();OPT.tips=true;saveOpt();say('Обучение покажется снова',2)}Title.settings()};
ACT.ver=()=>{if(++verTaps>=5){OPT.dev=true;saveOpt();verTaps=0;say('Режим разработчика: все этапы открыты',2.4)}};
