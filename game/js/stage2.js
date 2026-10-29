'use strict';
// Этап 2 «Оператор»: диспетчерская карта района (звонок → уточнить → служба → последствия)
const BASE={x:165,y:252};
const SVC={police:{n:'Полиция',s:'Полиц.',c:'#4a8cff',ic:'П'},amb:{n:'Скорая',s:'Скорая',c:'#e8eef2',ic:'С'},fire:{n:'Пожарные',s:'Пожар.',c:'#ff8a3a',ic:'Ж'},spec:{n:'Спецназ',s:'Спец.',c:'#e5a93b',ic:'Н'}};
// типы происшествий: нужная служба, «вес» появления и ясные формулировки
const TYP={
  fight:{svc:'police',w:3,c:['Двое дерутся во дворе, у одного укус на руке.','Сосед ломится в дверь и рычит, как зверь.','Драка у магазина: один кусается.']},
  loot:{svc:'police',w:1.4,c:['Мародёры разбили витрину аптеки.','Толпа выносит продукты из магазина.']},
  crowd:{svc:'police',w:1,c:['Паника на остановке: люди давят друг друга.','Толпа перекрыла улицу, кто-то кричит «заражённый!».']},
  hurt:{svc:'amb',w:3,c:['Мужчина истекает кровью — укус на шее.','Женщина без сознания, вокруг кровь.','Старика укусили в подъезде, он весь в крови.']},
  crash:{svc:'amb',w:1.4,c:['ДТП на перекрёстке: водитель зажат и стонет.','Сбили пешехода, он не встаёт.']},
  fire:{svc:'fire',w:2,c:['Горит автомобиль у подъезда.','Дым валит из окна третьего этажа.','Горит киоск на остановке.']},
  gas:{svc:'fire',w:1,c:['Сильный запах газа в подъезде.','На стройке прорвало газовую трубу.']},
  dead:{svc:'spec',w:0,c:['Умерший встал и ходит по квартире!','Тело в подъезде шевельнулось и встаёт.','Покойник бросается на санитаров!']},
  heart:{svc:'amb',w:1.2,c:['Мужчине плохо с сердцем, он держится за грудь.','Пожилая женщина задыхается, ей нужен врач.']},
  theft:{svc:'police',w:1,c:['Угнали машину прямо со двора, виновник ещё рядом.','Взлом квартиры: слышно, как кто-то ходит внутри.']},
  fake:{svc:null,w:3.6,c:['В трубке смеются — это розыгрыш.','Ребёнок балуется с телефоном, взрослых дома нет.','Ошиблись номером: всё в порядке.','Сработала сигнализация в магазине — продавец просто не так закрыл дверь.','Сосед громко смотрит фильм ужасов, а не «убивают человека».','Звонит скучающий старик: ему просто не с кем поговорить.','Пьяный друг сам нашёлся, пока вы дозванивались.','Датчик дыма сработал на кухне: подгорел ужин.','Школьники пошутили и убежали, адреса не существует.']}
};
const DISG=['Мужчина упал на остановке и не дышит. Нужна скорая!','Пожилая женщина потеряла сознание на лавочке, пульса нет.','Сосед лежит в подъезде, не дышит. Приезжайте!'];
const VAGUE=['Слышны крики за стеной…','В подъезде шумно, я боюсь выходить.','Там что-то случилось, я не пойму что.','Человек на улице ведёт себя странно.','Кричат во дворе, потом всё стихло.','Алло?.. Тут… тут такое… приезжайте!','Связь прерывается, слышен грохот.','Соседка не отвечает, за дверью странные звуки.','Мне кажется, что-то случилось… или нет.','Быстрее, пожалуйста! Адрес… (обрыв связи)'];
const STR=['Литейная','Речная','Садовая','Заводская','Парковая','Мира','Школьная','Вокзальная','Лесная','Мостовая'];
const CARC=['#c9d6dc','#9a3a3a','#3a62a0','#c9a83a','#4a8a5a'];
const TAU=Math.PI*2,CL=1.2,USP=54;
const otx=(s,x,y,c,sz,al,a)=>{cx.globalAlpha=a==null?1:a;txt(s,x+1,y+1,'#000',sz,al);txt(s,x,y,c,sz,al);cx.globalAlpha=1};
// дорожная сеть района: перекрёстки и улицы (машины служб ездят только по ним)
const ROAD=(()=>{const xs=[3,47,91,135,179,272,311],ys=[63,107,151,195,239],N=[],id={};
  for(const x of xs)for(const y of ys){id[x+','+y]=N.length;N.push({x,y,e:[]})}
  const link=(a,b)=>{const A=id[a],B=id[b];N[A].e.push(B);N[B].e.push(A)},L=[3,47,91,135,179];
  for(const y of ys){for(let i=0;i<L.length-1;i++)link(L[i]+','+y,L[i+1]+','+y);link('272,'+y,'311,'+y);if(y===107||y===195)link('179,'+y,'272,'+y)}
  for(const x of[3,47,91,135,179,311])for(let j=0;j<ys.length-1;j++)link(x+','+ys[j],x+','+ys[j+1]);
  const seg=[];N.forEach((n,i)=>n.e.forEach(j=>{if(j>i)seg.push([i,j])}));return{N,id,seg}})();
// части служб: перекрёсток выезда, название, цвет крыши
const STN={police:{at:'47,107',n:'ПОЛИЦИЯ',roof:'#3a64a8',q:[[1,-1],[-1,-1],[1,1]]},amb:{at:'135,63',n:'БОЛЬНИЦА',roof:'#dfe7ec',q:[[1,-1],[1,1],[-1,-1]]},
  fire:{at:'91,195',n:'ПОЖАРНЫЕ',roof:'#b23a2c',q:[[1,-1],[-1,-1],[1,1]]},spec:{at:'311,151',n:'СПЕЦНАЗ',roof:'#46523e',q:[[-1,-1],[-1,1]]}};
// модели машин служб
const VEH={police:{l:8,w:4,c:'#e9eef2',s:'#2f62c8',f:['#ff3b2f','#3b6bff']},amb:{l:9,w:5,c:'#f3f5f6',s:'#d8332a',f:['#ff3b2f','#ffffff'],cross:1},
  fire:{l:12,w:5,c:'#c8302a',s:'#f2f2f2',f:['#ff3b2f','#ffb03b'],ladder:1},spec:{l:10,w:5,c:'#262e33',s:'#e5a93b',f:['#3b6bff','#9fd0ff'],arm:1}};
const Op={
  tut:'s2',tutAuto:false,rs:2,map:null,br:null,lt:0,
  enter(){
    Snd.play('op');
    if(!this.map){this.map=Maps.city2(RS);this.br=Maps.bridge(48,7,RS)}
    if(!this.map.stn)this.bakeStations();
    this.mkStrip();
    const s=this.s={t:0,dur:180,calls:[],foci:[],units:[],sel:null,losses:0,ok:0,fail:0,id:1,fat:0,lock:0,home:false,log:[],crew:{police:3,amb:3,fire:2,spec:0},specMax:1,nx:5,end:false,fid:1,hudT:0,spawnT:{},fx:[],sig:'',vis:{},wave:24,amb:30,
      rev:false,revT:0,dz:36,dcall:null,cut:null,tutOn:false,blocks:[],blkT:rnd(26,38),dupT:rnd(16,26),brkN:0,waste:0};
    this.mkCars();for(let i=0;i<2;i++)this.addFocus(i?2:3);
    ctrl(false);this.ui();this.hudUpd();this.lt=performance.now();
    if(Coach.need('s2'))this.coach();else say('Смена диспетчера началась. Нажимайте на мигающие метки вызовов.',4);
  },
  exit(){$('#fat').style.opacity=0;$('#app').classList.remove('cine');$('#cap').textContent=''},
  mkStrip(){const ex=Math.max(0,OX);this.exW=ex;this.strip=ex>2?Maps.cityStrip('c2',ex,RS):null},
  resize(){if(this.s&&this.exW!==Math.max(0,OX))this.mkStrip()},
  // части служб: двор, здание и эмблема на крыше — запекаются в карту один раз
  bakeStations(){
    const M=this.map,g=M.cv.getContext('2d'),rn=mulberry(77);M.stn={};
    for(const k in STN){const S=STN[k],nd=ROAD.N[ROAD.id[S.at]];let blk=null;
      for(const[qx,qy]of S.q){for(const b of M.blocks){const cxr=qx>0?b.x0:b.x1,cyr=qy>0?b.y0:b.y1;if(Math.abs(cxr-nd.x)<9&&Math.abs(cyr-nd.y)<9&&b.x1-b.x0>=26&&b.y1-b.y0>=26&&!(b.x0<=106&&b.x1>=106&&b.y0<=96&&b.y1>=96)){blk=b;break}}if(blk)break}
      if(!blk)continue;
      const b=blk,bw=b.x1-b.x0,bh=b.y1-b.y0;
      g.fillStyle='#16232c';g.fillRect(b.x0,b.y0,bw,bh);g.fillStyle='rgba(160,200,220,.16)';g.fillRect(b.x0,b.y0,bw,1);g.fillRect(b.x0,b.y0,1,bh);
      g.fillStyle='rgba(230,240,245,.18)';for(let x=b.x0+4;x<b.x1-6;x+=11)g.fillRect(x,b.y1-8,1,6);
      const w=Math.min(bw-8,30),h=Math.min(12,bh-20),x=Math.round(b.x0+(bw-w)/2),y=b.y0+9;
      Maps.shadow(g,x,y,w,h,7);const r=Maps.box(g,x,y,w,h,7,{c:S.roof,roof:'flat',lit:.85,rn,wc:['#ffe9ae','#d8f4ff'],lean:.3});
      const ex=r.rx+(w>>1),ey=r.ry+(h>>1);
      if(k==='amb'){g.fillStyle='#d8332a';g.fillRect(ex-1,ey-3,3,7);g.fillRect(ex-3,ey-1,7,3)}
      else if(k==='police'){g.fillStyle='#e9eef2';g.fillRect(ex-3,ey-2,7,5);g.fillStyle='#2f62c8';g.fillRect(ex-2,ey-1,5,3)}
      else if(k==='fire'){g.fillStyle='#f2f2f2';for(let i=0;i<3;i++)g.fillRect(r.rx+3+i*((w-6)/3|0),r.ry+2,((w-6)/3|0)-2,1);g.fillStyle='#2a1512';for(let i=0;i<3;i++)g.fillRect(x+3+i*((w-6)/3|0),y+h-5,((w-6)/3|0)-2,4)}
      else{g.fillStyle='#e5a93b';g.fillRect(ex-4,ey-1,9,1);g.fillRect(ex-4,ey+1,9,1);g.fillStyle='#2a3226';g.beginPath();g.arc(r.rx+w-5,r.ry+4,3,0,TAU);g.fill();g.fillStyle='#e5a93b';g.fillRect(r.rx+w-6,r.ry+3,3,1)}
      M.stn[k]={node:ROAD.id[S.at],bx:x,by:y,bw:w,bh:h,lx:r.rx+(w>>1),ly:r.ry-3,park:[b.x0+6,b.y1-12,bw-12]}}
  },
  mkCars(){const rn=mulberry(5),cs=[],rows=[63,107,151,195,239],cols=[3,47,91,135,179,311];
    for(let i=0;i<20;i++){if(rn()<.55){const y=rows[(rn()*5)|0],br=y===107||y===195,side=rn()<.5?0:1,x0=br?0:side?272:0,x1=br?MW:side?MW:214;cs.push({h:1,y:y+(rn()<.5?-1:1),x:x0+rn()*(x1-x0),x0,x1,d:rn()<.5?1:-1,v:12+rn()*16,c:CARC[(rn()*5)|0]})}
      else{cs.push({h:0,x:cols[(rn()*6)|0]+(rn()<.5?-1:1),y:22+rn()*230,y0:22,y1:H,d:rn()<.5?1:-1,v:12+rn()*16,c:CARC[(rn()*5)|0]})}}
    this.s.cars=cs},
  rpos(){let x,y,t=0;do{x=rnd(30,300);y=rnd(44,232);t++}while((x>212&&x<272)&&t<20);return{x,y}},
  addFocus(hp,near){const s=this.s;if(s.foci.length>=7)return;let p=this.rpos();if(near){p={x:clamp(near.x+rnd(-40,40),20,205),y:clamp(near.y+rnd(-40,40),40,235)}}
    s.foci.push({id:s.fid++,x:p.x,y:p.y,hp:hp||2,t:rnd(2.5,7),age:0,r:0,gr:rnd(26,36)})},
  // место для метки вызова: рядом с очагом (или где придётся), но не поверх других меток, значков очагов и частей служб
  spot(f,tight){
    const s=this.s,xl=Math.max(14,14-OX),xr=316,yt=46,yb=236;let best=null,bd=-1;
    const score=(x,y)=>{let m=99;for(const c of s.calls)m=Math.min(m,Math.hypot(c.x-x,(c.y-y)*.85));
      for(const q of s.foci)m=Math.min(m,Math.hypot(q.x-x,(q.y-(q.r||16)*.55-y)*.85)+6);
      m=Math.min(m,Math.hypot(BASE.x-x,BASE.y-y)+4);
      const st=this.map.stn;if(st)for(const k in st){const q=st[k];m=Math.min(m,Math.hypot(q.lx-x,q.ly+6-y)+2)}return m};
    for(let k=0;k<64;k++){let x,y;
      if(f){const a=Math.random()*TAU,r=(tight&&k===0)?0:rnd(4,16+k*1.8);x=f.x+Math.cos(a)*r;y=f.y+Math.sin(a)*r*.85}
      else{const p=this.rpos();x=p.x;y=p.y}
      x=clamp(x,xl,xr);y=clamp(y,yt,yb);if(x>214&&x<268)x=x<241?214:268;
      const sc=score(x,y);if(sc>=26)return{x,y};if(sc>bd){bd=sc;best={x,y}}}
    return best},
  log(m){const s=this.s;s.log.unshift(m);s.logN=(s.logN||0)+1;s.log.length=Math.min(s.log.length,4)},
  pop(x,y,t,c,big){this.s.fx.push({k:'txt',x,y,t:0,d:big?2.2:1.7,s:t,c:c||'#fff'})},
  pickType(f){const s=this.s,pd=!s.rev?0:s.t<120?.26:.36;if(Math.random()<pd)return'dead';
    let tot=0;const L=[];for(const k in TYP){const w=k==='fake'&&f?1.2:TYP[k].w;if(!w)continue;L.push([k,w]);tot+=w}
    let r=Math.random()*tot;for(const[k,w]of L){if((r-=w)<=0)return k}return'hurt'},
  newCall(f,special,o){
    const s=this.s;o=o||{};let type=o.type||this.pickType(f);
    const p=special?this.spot({x:106,y:96},1):this.spot(f);
    const clear=o.clear!=null?o.clear:(type!=='fake'&&Math.random()<.5);
    const c={id:s.id++,x:p.x,y:p.y,type,f:f?f.id:0,age:0,ttl:Math.round(clamp(46-s.t*.08,32,46)),clar:clear,txt:clear?pick(TYP[type].c):'',cl:0,asg:false,addr:pick(STR)+', '+Math.floor(rnd(2,60)),vg:pick(VAGUE),sp:false};
    if(o.disg){Object.assign(c,{type:'dead',shown:'hurt',disg:true,clar:true,txt:pick(DISG),ttl:50})}
    if(special){Object.assign(c,{type:'hurt',ttl:62,sp:true,clar:false,txt:'',addr:'Садовая, 14 (дом Артёма)',vg:'«Артём только что пришёл… он бледный, кашляет и не отвечает. Мне страшно.»'});c.f=0}
    if(o.dup){const q=this.spot(o.dup,1);Object.assign(c,{type:'fake',dup:true,x:q.x,y:q.y,addr:o.dup.addr,clar:false,txt:'Повторный звонок по этому адресу: экипаж уже выехал.',vg:pick(['Я уже звонил! Почему никто не едет?!','Это снова я, по тому же адресу. Где помощь?!']),ttl:30})}
    if(o.vg)c.vg=o.vg;if(o.txt)c.txt=o.txt;
    s.calls.push(c);beep(900,.07,.04);setTimeout(()=>beep(1250,.06,.035),110);return c},
  shown(c){return c.shown||c.type},
  fail(c,why,heavy){const s=this.s;s.fail++;s.losses+=heavy?2:1;G.losses++;this.pop(c.x,c.y-14,heavy?'✕ −2':'✕ −1','#ff6b5c',heavy);
    if(Math.random()<(heavy?.3:.15)){const f=s.foci.find(f=>f.id===c.f);this.addFocus(2,f||c);this.log('Новый очаг рядом с '+c.addr)}this.log(why+' ('+c.addr+')');beep(130,.2,.06,'sawtooth');vib(40)},
  resolve(c,svc){
    const s=this.s,f=s.foci.find(f=>f.id===c.f);
    if(c.sp){G.home=svc;s.ok++;this.pop(c.x,c.y-14,'ответ получен','#ffd98a',1);this.log('Дом Артёма: ответ службы получен');if(Math.random()<.35){this.addFocus(2,c);this.log('Из дома донёсся шум…')}return}
    if(c.type==='fake'){s.waste++;this.pop(c.x,c.y-14,c.dup?'дубликат · −5 с':'ложный · −5 с','#ffb35c');this.log(c.dup?'Повторный звонок: экипаж потерял время зря':'Ложный вызов: экипаж потерял время зря');return}
    if(c.disg){s.ok++;s.losses++;G.losses++;s.dcall=null;this.log('«Пациент» напал на экипаж: '+c.addr);this.reveal(c,svc);return}
    if(svc===TYP[c.type].svc){s.ok++;this.pop(c.x,c.y-14,'✓ помощь оказана','#7dffa6');
      if(f){f.hp-=(c.type==='dead'?2:1);f.gr=Math.max(f.gr,18);if(f.hp<=0){s.foci=s.foci.filter(x=>x!==f);s.fx.push({k:'clear',x:f.x,y:f.y,t:0,d:1.4,r:f.r});this.pop(f.x,f.y-22,'ОЧАГ ПОДАВЛЕН','#7dffa6',1);this.log('Очаг подавлен');say('Очаг подавлен!',2);beep(780,.15);vib(30)}}}
    else if(c.type==='dead'&&svc==='police'&&!s.spec){s.ok++;s.losses++;G.losses++;if(f)f.hp--;this.log('Полиция справилась, но с потерями');this.pop(c.x,c.y-14,'с потерями −1','#ffd067')}
    else this.fail(c,'Неверная служба: '+SVC[svc].n,c.type==='dead');
  },
  tap(x,y){
    const s=this.s;if(s.end||s.cut||x>MW)return;x-=OX;let b=null,bd=19;for(const c of s.calls){const d=Math.min(Math.hypot(c.x-x,c.y-y),Math.hypot(c.x-x,c.y-12-y));if(d<bd){bd=d;b=c}}
    if(b){s.sel=b;this.ui();beep(620,.04);vib(12)}
  },
  // ---------------------------------------------------------------- маршруты по улицам
  blocked(a,b){const B=this.s&&this.s.blocks;if(!B)return false;for(const k of B)if((k.a===a&&k.b===b)||(k.a===b&&k.b===a))return true;return false},
  // граф остаётся связным, если убрать перекрытые улицы (плюс кандидата)
  linked(extra){const N=ROAD.N,bl=this.s.blocks.concat(extra?[extra]:[]),seen=new Set([0]),q=[0];
    const off=(a,b)=>bl.some(k=>(k.a===a&&k.b===b)||(k.a===b&&k.b===a));
    while(q.length){const u=q.pop();for(const v of N[u].e)if(!seen.has(v)&&!off(u,v)){seen.add(v);q.push(v)}}return seen.size===N.length},
  // случайное перекрытие улицы: маршруты экипажей становятся длиннее
  addBlock(){const s=this.s;if(s.blocks.length>=2)return;const C=ROAD.seg.filter(([a,b])=>!this.blocked(a,b)&&this.linked({a,b}));if(!C.length)return;
    const[a,b]=pick(C),A=ROAD.N[a],B=ROAD.N[b],bridge=A.x!==B.x&&Math.abs(A.x-B.x)>100;
    s.blocks.push({a,b,age:0,ttl:rnd(28,42),br:bridge});
    const m=bridge?'Перекрыт мост — маршруты длиннее':'Улица перекрыта — экипажи едут в объезд';this.log(m);say(m,2.4);beep(240,.12,.05,'square');vib(20);this.reroute()},
  tickBlocks(dt){const s=this.s;s.blkT-=dt;if(s.blkT<=0&&!s.tutOn){s.blkT=rnd(28,46);if(Math.random()<.85)this.addBlock()}
    let gone=false;for(const k of s.blocks){k.age+=dt;if(k.age>k.ttl)gone=true}
    if(gone){s.blocks=s.blocks.filter(k=>k.age<=k.ttl);this.log('Улица снова открыта')}},
  // машины в пути пересчитывают маршрут от ближайшего перекрёстка
  reroute(){for(const u of this.s.units){if(u.pi>=u.path.length||u.pi<1)continue;
      const prev=u.path[u.pi-1],nxt=u.path[u.pi],ip=ROAD.id[prev[0]+','+prev[1]],inx=ROAD.id[nxt[0]+','+nxt[1]];
      if(ip==null||inx==null)continue;
      const src=this.blocked(ip,inx)?ip:inx,N=ROAD.N[src],P=u.st==='go'?u.P:{x:ROAD.N[u.src].x,y:ROAD.N[u.src].y,a:u.src,b:u.src};
      u.path=[[u.x,u.y]].concat(this.route(src,P));u.pi=1}},
  // маршрут и время прибытия каждой службы до выбранного вызова (с учётом перекрытий) — показываются до отправки
  preview(c){const s=this.s,key=c.id+'|'+s.blocks.map(k=>k.a+'-'+k.b).join(','),pv=s.pv;if(pv&&pv.key===key)return pv.d;
    const P=this.proj(c.x,c.y),d={},sv=['police','amb','fire','spec'],bl=s.blocks;
    const len=pts=>{let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L};
    for(const k of sv){const st=this.map.stn&&this.map.stn[k],src=st?st.node:ROAD.id['179,239'];
      const path=this.route(src,P);s.blocks=[];const free=len(this.route(src,P));s.blocks=bl;
      const e=Math.round(len(path)/USP),e0=Math.round(free/USP);d[k]={path,e,det:Math.max(0,e-e0)}}
    s.pv={key,d};return d},
  proj(x,y){let best=null,bd=1e9;for(const[a,b]of ROAD.seg){const A=ROAD.N[a],B=ROAD.N[b];let px,py;
      if(A.y===B.y){px=clamp(x,Math.min(A.x,B.x),Math.max(A.x,B.x));py=A.y}else{px=A.x;py=clamp(y,Math.min(A.y,B.y),Math.max(A.y,B.y))}
      const d=Math.hypot(px-x,py-y);if(d<bd){bd=d;best={x:px,y:py,a,b}}}return best},
  dij(src){const N=ROAD.N,d=N.map(()=>1e9),pv=N.map(()=>-1),dn=N.map(()=>0);d[src]=0;
    for(;;){let u=-1,bd=1e9;for(let i=0;i<N.length;i++)if(!dn[i]&&d[i]<bd){bd=d[i];u=i}if(u<0)break;dn[u]=1;
      for(const v of N[u].e){if(this.blocked(u,v))continue;const w=Math.abs(N[u].x-N[v].x)+Math.abs(N[u].y-N[v].y);if(d[u]+w<d[v]){d[v]=d[u]+w;pv[v]=u}}}return{d,pv}},
  route(src,P){const{d,pv}=this.dij(src),N=ROAD.N,A=N[P.a],B=N[P.b];
    const da=d[P.a]+Math.abs(A.x-P.x)+Math.abs(A.y-P.y),db=d[P.b]+Math.abs(B.x-P.x)+Math.abs(B.y-P.y);
    const ids=[];for(let v=da<=db?P.a:P.b;v!==-1;v=pv[v])ids.unshift(v);
    const pts=ids.map(i=>[N[i].x,N[i].y]);pts.push([P.x,P.y]);return pts},
  moveU(u,dt){let rem=u.sp*dt;while(rem>0&&u.pi<u.path.length){const q=u.path[u.pi],dx=q[0]-u.x,dy=q[1]-u.y,d=Math.hypot(dx,dy);
      if(d<=rem){u.x=q[0];u.y=q[1];rem-=d;u.pi++}else{u.dx=dx/d;u.dy=dy/d;u.x+=u.dx*rem;u.y+=u.dy*rem;rem=0}}
    return u.pi>=u.path.length},
  left(u){let L=0,x=u.x,y=u.y;for(let i=u.pi;i<u.path.length;i++){const q=u.path[i];L+=Math.hypot(q[0]-x,q[1]-y);x=q[0];y=q[1]}return L},
  dispatch(k){
    const s=this.s,c=s.sel;if(!c||c.asg||s.lock>0||s.cut)return;if(s.crew[k]<=0){say('Нет свободных экипажей: '+SVC[k].n,1.6);return}
    let svc=k;if(!s.tutOn&&s.fat>80&&Math.random()<.35){svc=pick(['police','amb','fire']);say('Усталость: вы ошиблись кнопкой!',2.5)}
    s.crew[svc]>0||(svc=k);s.crew[svc]--;c.asg=true;
    const st=this.map.stn&&this.map.stn[svc],src=st?st.node:ROAD.id['179,239'],N=ROAD.N[src],P=this.proj(c.x,c.y);
    const u={x:N.x,y:N.y,c,svc,k:svc,sp:USP,st:'go',dx:0,dy:-1,src,P,path:this.route(src,P),pi:1};
    if(!s.tutOn&&Math.random()<.09){u.L0=this.left(u);u.brk=rnd(.3,.7)}
    s.units.push(u);c.eta=this.left(u)/USP;this.ui();beep(480,.06);vib(16)},
  ignore(){const s=this.s,c=s.sel;if(!c||c.asg||s.cut)return;s.calls=s.calls.filter(x=>x!==c);s.sel=null;
    if(c.type==='fake'){s.ok++;this.pop(c.x,c.y-14,c.dup?'✓ дубликат':'✓ ложный вызов','#7dffa6');this.log(c.dup?'Дубликат отклонён':'Ложный вызов отклонён');beep(700,.06)}
    else if(c.sp){G.home='ignore';this.log('Вы проигнорировали звонок из дома Артёма');this.fail(c,'Звонок проигнорирован',true);this.addFocus(3,c)}
    else{if(c.disg){s.dcall=null;s.dz=s.t+10}this.fail(c,'Звонок проигнорирован',false)}this.ui()},
  clarify(){const s=this.s,c=s.sel;if(!c||c.clar||c.cl>0||s.lock>0||s.cut)return;c.cl=CL;this.ui();beep(520,.05)},
  coffee(){const s=this.s;if(s.lock>0||s.cut)return;s.lock=s.tutOn?0:4;s.fat=Math.max(0,s.fat-70);s.coffeeN=(s.coffeeN||0)+1;this.log('Кофе: потеряно время, но голова ясная');beep(300,.2,.04,'sine');this.ui()},
  // уточнение звонков и движение машин (общая часть обычного хода и обучения)
  tickCalls(dt,noExpire){const s=this.s;
    for(const c of s.calls){c.age+=noExpire?0:dt;if(c.cl>0){c.cl-=dt;if(c.cl<=0){c.clar=true;c.txt=c.sp?'Он ранен: порез и укус на руке. Нужна помощь.':pick(TYP[c.type].c);beep(700,.05,.04);if(s.sel===c)this.ui()}}}
    if(noExpire)return;
    for(const c of[...s.calls])if(!c.asg&&c.age>c.ttl){s.calls=s.calls.filter(x=>x!==c);if(s.sel===c){s.sel=null;this.ui()}
      if(c.type==='fake'){this.log('Ложный вызов сброшен ('+c.addr+')');continue}
      if(c.sp)G.home='ignore';if(c.disg){s.dcall=null;s.dz=s.t+10}this.fail(c,'Вызов остался без ответа',c.type==='dead'||c.sp)}},
  tickUnits(dt){const s=this.s;
    for(const u of s.units){
      if(u.st==='stay'){u.stay-=dt;if(u.stay<=0){u.st='back';u.path=this.route(u.src,u.P).reverse();u.pi=1}continue}
      if(u.stop>0){u.stop-=dt;continue}
      if(u.brk&&u.st==='go'&&this.left(u)<=u.L0*(1-u.brk)){u.brk=0;u.stop=4;s.brkN++;this.pop(u.x,u.y-12,'⚠ поломка','#ffb35c');this.log('Машина службы '+SVC[u.svc].n+' встала: поломка в пути');beep(140,.2,.05,'square');continue}
      if(!this.moveU(u,dt))continue;
      if(u.st==='go'){const c=u.c;s.calls=s.calls.filter(x=>x!==c);if(s.sel===c)s.sel=null;
        if(c.type==='fake'){u.st='stay';u.stay=5}else{u.st='back';u.path=this.route(u.src,u.P).reverse();u.pi=1}
        this.resolve(c,u.svc);this.ui();if(s.cut)return}
      else{s.crew[u.k]++;u.done=1;this.ui()}}
    s.units=s.units.filter(u=>!u.done)},
  tickCars(dt){for(const c of this.s.cars){if(c.h){c.x+=c.d*c.v*dt;if(c.x>c.x1)c.x=c.x0;if(c.x<c.x0)c.x=c.x1}else{c.y+=c.d*c.v*dt;if(c.y>c.y1)c.y=c.y0;if(c.y<c.y0)c.y=c.y1}}},
  update(dt){
    const s=this.s;if(s.end)return;
    if(s.cut){this.cutUpd(dt);return}
    s.t+=dt;s.lock=Math.max(0,s.lock-dt);
    this.tickCars(dt);
    s.fat+=dt*(s.t>45?.68:.3);
    if(!s.home&&s.t>14){s.home=true;const c=this.newCall(null,true);if(!s.sel||s.sel.asg)s.sel=c;this.ui();say('Звонок из знакомого дома… (метка ★)',3.5)}
    // первый «оживший» приходит под видом обычного вызова — разоблачит его служба на месте
    if(!s.rev&&!s.dcall&&s.t>=s.dz){const f=s.foci.length?pick(s.foci):null;s.dcall=this.newCall(f,false,{disg:1})}
    if(s.rev&&s.t>Math.max(120,s.revT+40)&&s.specMax<2){s.specMax=2;s.crew.spec++;this.log('Второй экипаж спецназа');say('Подкрепление: второй экипаж спецназа',3);this.ui()}
    const k=s.t/s.dur;
    for(const f of s.foci){f.age+=dt;f.t-=dt;f.gr-=dt;
      if(f.t<=0){f.t=rnd(12,19)*(1-.2*k)*(f.hp>=4?.8:1);this.newCall(f)}
      if(f.gr<=0){f.gr=rnd(38,52);
        if(f.hp<4){f.hp++;this.pop(f.x,f.y-24,'очаг растёт','#ff8d82');this.log('Очаг разрастается');beep(190,.12,.04,'sawtooth')}
        else if(s.foci.length<6&&Math.random()<.35){this.addFocus(2,f);this.log('Заражение перекинулось дальше');say('Заражение перекинулось на соседний квартал!',2.2);beep(150,.18,.05,'sawtooth')}}}
    if(!s.calls.length&&!s.units.length){s.idleT=(s.idleT||0)+dt;if(s.idleT>2&&s.foci.length){s.idleT=0;const f=pick(s.foci);f.t=rnd(9,15);this.newCall(f)}}else s.idleT=0;
    s.wave-=dt;
    if(s.wave<=0&&s.foci.length<6){s.wave=rnd(.85,1.15)*(22-6*k);this.addFocus(s.t>80?3:2);const nf=s.foci[s.foci.length-1];this.pop(nf.x,nf.y-24,'НОВЫЙ ОЧАГ','#ff6b5c',1);this.log('Новый очаг заражения');say('Новый очаг заражения!',1.8);beep(210,.2,.05,'sawtooth');vib(25)}
    if(!s.foci.length&&s.calls.length<2&&s.t>2&&s.wave>4){s.wave=rnd(7,10);this.addFocus(2);const nf=s.foci[s.foci.length-1];if(nf){nf.t=rnd(1.5,3.5);this.pop(nf.x,nf.y-24,'НОВЫЙ ОЧАГ','#ff6b5c',1);this.log('Очаг вспыхнул заново');say('Вспышка в новом квартале!',1.8)}}
    s.amb-=dt;if(s.amb<=0){s.amb=rnd(.8,1.2)*(16-6*k);this.newCall(null)}
    s.dupT-=dt;if(s.dupT<=0){s.dupT=rnd(18,30);const U=s.units.filter(u=>u.st==='go'&&!u.c.dupd&&u.c.type!=='fake'&&!u.c.sp&&!u.c.disg);
      if(U.length&&Math.random()<.7){const u=pick(U);u.c.dupd=1;const d=this.newCall(null,false,{dup:u.c});if(!s.sel)s.sel=d;this.ui()}}
    this.tickBlocks(dt);this.tickCalls(dt);this.tickUnits(dt);if(s.cut)return;
    for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);
    if(s.t>=s.dur){this.finish();return}
    this.uiTick(dt);
  },
  uiTick(dt){const s=this.s;
    s.hudT-=dt;if(s.hudT<=0){s.hudT=.25;this.hudUpd();this.ui(true)}
    const tb=document.getElementById('tmb');if(tb&&s.sel&&!s.sel.asg){const pr=clamp(1-s.sel.age/s.sel.ttl,0,1);tb.style.width=(pr*100)+'%';tb.className='tm'+(pr<.4?' r':'')}
    $('#fat').style.opacity=clamp((s.fat-45)/70,0,.85)},
  // во время обучения время смены стоит: работают только уточнение и машины
  coachUpdate(dt){const s=this.s;if(s.end)return;s.ct=(s.ct||0)+dt;this.tickCars(dt);this.tickCalls(dt,true);this.tickUnits(dt);for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);this.uiTick(dt)},
  // ---------------------------------------------------------------- кат-сцена: первый «оживший»
  reveal(c,svc){const s=this.s;s.rev=true;s.revT=s.t;s.sel=null;
    s.cut={t:0,x:c.x,y:c.y,svc,l:{}};resetInput();$('#app').classList.add('cine');$('#cskip').style.display=Prog.skipOK()?'block':'none';$('#prompt').style.display='none';
    Snd.t&&Snd.t('sawtooth',120,70,.6,.12);this.ui()},
  cutUpd(dt){const s=this.s,c=s.cut;c.t+=dt;s.ct=(s.ct||0)+dt;const T=c.t,once=(k,at,fn)=>{if(T>=at&&!c.l[k]){c.l[k]=1;fn()}};
    const who={amb:'Скорая',police:'Патруль',fire:'Пожарные',spec:'Спецназ'}[c.svc]||'Экипаж';
    once('a',.4,()=>Maze.cap(who+' на месте. Человек без пульса…'));
    once('b',2.2,()=>{Maze.cap('Он встаёт. Он напал на экипаж!',true);beep(160,.3,.07,'sawtooth');vib([60,40,90]);s.shake=.4});
    once('c',4.2,()=>Maze.cap('Мёртвые оживают. Обычные службы здесь бессильны.'));
    once('d',5.9,()=>{Maze.cap('Открыт СПЕЦНАЗ — отправляйте его к «ожившим».',true);beep(660,.12);setTimeout(()=>beep(990,.15),140)});
    s.shake=Math.max(0,(s.shake||0)-dt);for(const f of s.fx)f.t+=dt;
    if(T>=8)this.cutEnd()},
  cutEnd(){const s=this.s;if(!s.cut)return;s.cut=null;s.shake=0;$('#app').classList.remove('cine');$('#cap').textContent='';
    s.spec=true;s.crew.spec=Math.max(s.crew.spec,1);this.log('Доступен спецназ!');say('Спецназ доступен: кнопка «Спецназ» в панели',3.2);this.ui();this.hudUpd()},
  cutSkip(){if(this.s&&this.s.cut)this.cutEnd()},
  // ---------------------------------------------------------------- интерактивное обучение
  coach(){
    const s=this.s,f0=s.foci[0];s.tutOn=true;let A=null,B=null;
    const pin=c=>()=>c&&s.calls.includes(c)?{x:c.x,y:c.y-11,r:16}:null;
    Coach.run('s2',[
      {t:'Поступил звонок. Нажмите на мигающую метку на карте.',start:()=>{A=this.newCall(f0,false,{type:'hurt',clear:false,vg:'Кто-то стонет за дверью, я боюсь открыть…'});A.ttl=99},pt:()=>pin(A)(),wait:()=>s.sel===A},
      {t:'Звонящий говорит неясно. Нажмите «Уточнить» и дождитесь ответа.',el:'#panel [data-a=op_cl]',wait:()=>A.clar},
      {t:'Теперь ясно: человек ранен. Отправьте скорую.',el:'#panel [data-a=op_amb]',wait:()=>A.asg},
      {t:'Скорая выехала из больницы и едет по улицам. Дождитесь, пока она доберётся.',pt:()=>{const u=s.units.find(q=>q.c===A);return u?{x:u.x,y:u.y,r:15}:null},wait:()=>!s.calls.includes(A)},
      {t:'Этот вызов понятен сразу — уточнять не нужно. Выберите его.',start:()=>{B=this.newCall(f0,false,{type:'fire',clear:true});B.ttl=99},pt:()=>pin(B)(),wait:()=>s.sel===B},
      {t:'Пожар — отправьте пожарных.',el:'#panel [data-a=op_fire]',wait:()=>B.asg},
      {t:'Красные зоны — очаги заражения. Верная помощь их ослабляет, а без помощи они растут.',pt:()=>({x:f0.x,y:f0.y,r:Math.max(22,f0.r||22)}),btn:'Понятно ▶'},
      {t:'К концу смены растёт усталость. Кофе её снимает — нажмите.',el:'#panel [data-a=op_coffee]',wait:()=>(s.coffeeN||0)>0},
      {t:'Цель смены: к концу — не больше 4 очагов и 14 потерь. Ложные вызовы можно игнорировать.',btn:'Начать смену ▶'}
    ],()=>{s.tutOn=false;s.lock=0;s.fat=0;if(A&&s.calls.includes(A)&&!A.asg)A.ttl=40;if(B&&s.calls.includes(B)&&!B.asg)B.ttl=40;this.ui();say('Смена началась!',2)})},
  finish(){const s=this.s;s.end=true;G.fociLeft=s.foci.length;G.ok2=s.ok;G.fail2=s.fail;G.s2loss=s.losses;G.s2waste=s.waste;const ok=s.foci.length<=4&&s.losses<=14;G.contain2=ok;setTimeout(()=>Flow.afterOp(),400)},
  hudUpd(){const s=this.s,gm=s.t/s.dur*720,h=(18+Math.floor(gm/60))%24,m=Math.floor(gm%60);hud(`<b>02 ОПЕРАТОР</b><span class="ob">Смена ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}</span><span class="r">потери ${Cnt.h('s2.loss',s.losses,'i')}</span><span class="a">очагов ${Cnt.h('s2.foci',s.foci.length,'i')}</span><span>${mmss(s.dur-s.t)}</span>`)},
  ui(soft){
    const s=this.s,c=s.sel,cr=s.crew,lk=s.lock>0;let eta=0;const pv=c&&!c.asg&&s.calls.includes(c)?this.preview(c):null;
    if(c&&c.asg){const u=s.units.find(q=>q.c===c&&q.st==='go');if(u)eta=Math.ceil(this.left(u)/u.sp)}
    const sig=JSON.stringify([cr,lk,!!s.spec,s.specMax,Math.round(s.fat/2),c&&[c.id,c.clar,c.cl>0,c.asg,eta],pv&&Object.keys(pv).map(k=>pv[k].e+'/'+pv[k].det)]).concat(s.log.join());
    if(soft&&this._sig===sig)return;this._sig=sig;
    const sv=(k,max)=>`<div class="cw" style="--c:${SVC[k].c}"><b>${SVC[k].s}</b><div class="pips">${Array.from({length:max},(_,i)=>`<u class="${i<cr[k]?'':'o'}"></u>`).join('')}</div></div>`;
    let h=`<div class="ph"><b>ДИСПЕТЧЕР</b><span class="chip ${s.fat>80?'r':s.fat>55?'a':''}">усталость ${Cnt.h('s2.fat',clamp(s.fat,0,100),'p')}</span></div>`;
    h+=`<div class="crew">${sv('police',3)}${sv('amb',3)}${sv('fire',2)}${s.spec?sv('spec',s.specMax||1):'<div class="cw" style="--c:#6a7a86"><b>Спец.</b><div class="m">🔒</div></div>'}</div>`;
    h+=`<div class="bar">${Cnt.bar('s2.fatb',clamp(s.fat,0,100),s.fat>80?'r':'a')}</div>`;
    if(c){
      {const pr=clamp(1-c.age/c.ttl,0,1);h+=`<div class="callc${c.sp?' sp':''}" data-key="c${c.id}"><div class="ad">${c.sp?'★ ':''}${c.addr}</div><div class="tt">${c.clar?c.txt:c.vg}</div><div class="tm${pr<.4?' r':''}" id="tmb" style="width:${(pr*100).toFixed(1)}%"></div></div>`}
      if(c.asg)h+=`<div class="m" style="color:#4cc9c0;margin:.2rem 0 .4rem">Экипаж в пути · прибытие через ${Cnt.h('s2.eta',eta,'i',' с')}</div>`;
      else{
        h+=`<div class="r2"><button class="pb warn" data-a="op_cl" ${c.clar||c.cl>0||lk?'disabled':''}><span class="bd" style="--c:#e5c53b">?</span><span class="tx">${c.cl>0?'Уточняю…':c.clar?'Уточнено':'Уточнить'}</span></button><button class="pb" data-a="op_ign"><span class="bd" style="--c:#7f98a8">✕</span><span class="tx">Игнор</span></button></div>`;
        const sb=k=>{const off=lk||cr[k]<=0||(k==='spec'&&!s.spec);return`<button class="pb svc" style="--c:${SVC[k].c}" data-a="op_${k}" ${off?'disabled':''}><span class="bd">${SVC[k].ic}</span><span class="tx">${SVC[k].n}${pv&&!off?`<small${pv[k].det>=2?' style="color:#ffb35c"':''}>≈ ${pv[k].e} с${pv[k].det>=2?' · +'+pv[k].det+' с':''}</small>`:''}</span></button>`};
        h+=`<div class="r2">${sb('police')}${sb('amb')}</div><div class="r2">${sb('fire')}${sb('spec')}</div>`}
    }else h+=`<div class="m" style="margin:.4rem 0 .6rem">Выберите метку вызова на карте. Неясный звонок можно уточнить.</div>`;
    h+=`<button class="pb ${c&&!c.asg?'':'glow'}" data-a="op_coffee" ${lk?'disabled':''} style="${c&&!c.asg?'':'animation:none'}"><span class="bd" style="--c:#c28a4a">☕</span><span class="tx">Кофе<small>снимает усталость, 4 с без связи</small></span></button><div class="log">${s.log.slice(0,2).map((x,i)=>`<div data-key="L${(s.logN||0)-i}">${x}</div>`).join('')}</div>`;
    panel(h);
  },
  // ---------------------------------------------------------------- рисование
  veh(x,y,dx,dy,col,o){Art3.car(x,y,dx,dy,{k:'civ',col})},
  // машина службы: у каждой своя модель, мигалки и свет фар
  svcVeh(x,y,dx,dy,k,t,parked){Art3.car(x,y,dx,dy,{k,park:parked})},
  // части служб: свободные машины во дворе и подпись
  stations(t){const st=this.map.stn;if(!st)return;const s=this.s;
    for(const k in st){const q=st[k],max=k==='spec'?(s.spec?s.specMax:0):k==='fire'?2:3,n=Math.min(max,s.crew[k]||0),L=VEH[k].l+3;
      for(let i=0;i<n;i++){const px=q.park[0]+VEH[k].l/2+i*L;if(px+VEH[k].l/2>q.park[0]+q.park[2])break;this.svcVeh(px,q.park[1],1,0,k,t,true)}
      const tw=k==='spec'&&!s.spec?'#7f8c94':SVC[k].c;otx(STN[k].n,q.lx,q.ly-2,tw,8,'center',.95);
      if(k==='spec'&&!s.spec){otx('🔒',q.lx,q.ly+8,'#9fb3c0',8,'center',.9)}}},
  focus(f,t){
    const e=ease(f.age/1.3),r0=(13+f.hp*4.6)*e;f.r=r0;if(r0<1)return;const n=28,pts=[];
    for(let k=0;k<n;k++){const a=k/n*TAU,rr=r0*(1+.16*Math.sin(a*3+t*1.4+f.id)+.09*Math.sin(a*5-t*2.2+f.id*2)+.05*Math.sin(a*8+t*3));pts.push([f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr*.8])}
    Post.glow(f.x,f.y,r0+18,'255,50,40',.15+.05*Math.sin(t*3+f.id));
    const gr=cx.createRadialGradient(f.x,f.y,2,f.x,f.y,r0*1.05);gr.addColorStop(0,'rgba(110,8,16,.62)');gr.addColorStop(.7,'rgba(210,48,44,.3)');gr.addColorStop(1,'rgba(240,70,60,.1)');
    cx.fillStyle=gr;cx.beginPath();pts.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();cx.fill();
    cx.save();cx.setLineDash([3,3]);cx.lineDashOffset=-t*9;cx.strokeStyle='rgba(255,100,86,.9)';cx.lineWidth=1.2;cx.stroke();cx.restore();
    cx.fillStyle='rgba(90,6,12,.4)';cx.beginPath();for(let k=0;k<n;k+=2){const p=pts[k],q=[f.x+(p[0]-f.x)*.55,f.y+(p[1]-f.y)*.55];k?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1])}cx.closePath();cx.fill();
    // волны
    for(let q=0;q<2;q++){const u=(t*.55+f.id*.37+q*.5)%1;cx.strokeStyle='rgba(255,92,76,'+((1-u)*.55).toFixed(2)+')';cx.lineWidth=1;cx.beginPath();cx.ellipse(f.x,f.y,r0*(.55+u*.95),r0*(.55+u*.95)*.8,0,0,TAU);cx.stroke()}
    // заражённые на улицах
    const cnt=Math.min(26,f.hp*5+6);
    for(let k=0;k<cnt;k++){const a=k*2.4+f.id+t*(k%2?.28:-.22),rad=r0*(.2+.62*((k*.37)%1));Art3.zombie(f.x+Math.cos(a)*rad,f.y+Math.sin(a)*rad*.8,f.id*17+k,t,true)}
    // споры
    cx.save();cx.globalCompositeOperation='lighter';
    for(let k=0;k<7;k++){const u=(t*.45+k/7+f.id*.13)%1,x=f.x+Math.sin(k*2.3+f.id)*r0*.7+Math.sin(u*6+k)*2,y=f.y+Math.cos(k*1.7)*r0*.35-u*18;cx.fillStyle='rgba(255,110,90,'+((1-u)*.8).toFixed(2)+')';cx.fillRect(Math.round(x),Math.round(y),k%3?1:2,k%3?1:2)}
    cx.restore();
    // знак тревоги и «здоровье» очага
    const by=f.y-r0*.55-6+Math.sin(t*3+f.id)*1.2;cx.fillStyle='rgba(0,0,0,.4)';cx.beginPath();cx.moveTo(f.x+1,by+1);cx.lineTo(f.x-5,by+10);cx.lineTo(f.x+7,by+10);cx.fill();
    cx.fillStyle='#ff5b4d';cx.beginPath();cx.moveTo(f.x,by);cx.lineTo(f.x-5,by+9);cx.lineTo(f.x+5,by+9);cx.closePath();cx.fill();cx.fillStyle='#2a0a0a';cx.fillRect(Math.round(f.x),Math.round(by)+3,1,3);cx.fillRect(Math.round(f.x),Math.round(by)+7,1,1);
    for(let k=0;k<4;k++){cx.fillStyle=k<f.hp?'#ff5b4d':'rgba(255,255,255,.14)';cx.fillRect(Math.round(f.x)-8+k*4,Math.round(f.y+r0*.8)+3,3,2)}
  },
  pin(c,t,sel){
    const sv=TYP[this.shown(c)].svc,k=c.asg?'#4a8cff':c.clar?(sv?SVC[sv].c:'#9aa8b2'):'#e5c53b',ic=c.clar?(sv?SVC[sv].ic:'✕'):'?',pr=clamp(1-c.age/c.ttl,0,1),u=clamp(c.age/.45,0,1);
    const sc=u<1?(1+Math.sin(u*Math.PI)*.35)*ease(Math.min(1,u*1.6)):1;
    // волны на земле
    if(!c.asg){for(let q=0;q<2;q++){const w=(t*.9+c.id*.3+q*.5)%1;cx.strokeStyle=k+Math.round((1-w)*70).toString(16).padStart(2,'0');cx.lineWidth=1;cx.beginPath();cx.ellipse(c.x,c.y+1,3+w*13,1.5+w*6.5,0,0,TAU);cx.stroke()}}
    cx.fillStyle='rgba(0,0,0,.4)';cx.beginPath();cx.ellipse(c.x+1,c.y+1,3.5*sc,1.7*sc,0,0,TAU);cx.fill();
    const hop=(!c.asg&&!c.clar&&c.cl<=0)?-Math.abs(Math.sin(t*4+c.id))*2.2:0,hx=c.x,hy=c.y-13*sc+hop,R=7.5*sc;
    cx.save();
    if(sel)Post.glow(hx,hy,18,'255,255,255',.18);
    // тело метки: капля
    cx.fillStyle=k;cx.beginPath();cx.arc(hx,hy,R,Math.PI*.8,Math.PI*2.2);cx.lineTo(hx,c.y+hop*.3);cx.closePath();cx.fill();
    cx.fillStyle='rgba(0,0,0,.28)';cx.beginPath();cx.arc(hx,hy,R,Math.PI*.1,Math.PI*.9);cx.lineTo(hx,c.y+hop*.3);cx.closePath();cx.fill();
    cx.fillStyle='#0a1219';cx.beginPath();cx.arc(hx,hy,R*.7,0,TAU);cx.fill();
    cx.fillStyle='rgba(255,255,255,.35)';cx.beginPath();cx.arc(hx-R*.35,hy-R*.4,R*.22,0,TAU);cx.fill();
    cx.restore();
    if(sc>.7)txt(ic,hx,hy+3.5,k,Math.round(10*Math.min(1,sc)),'center');
    // кольцо времени
    cx.strokeStyle=pr>.4?'#4cc9c0':'#ff5b4d';cx.lineWidth=1.6;cx.beginPath();cx.arc(hx,hy,R+2,-Math.PI/2,-Math.PI/2+TAU*pr);cx.stroke();
    // звонок: «волны» по бокам
    if(!c.clar&&!c.asg&&c.cl<=0){const w=(t*3+c.id)%1.5;if(w<1){cx.strokeStyle='rgba(255,230,120,'+(1-w).toFixed(2)+')';cx.lineWidth=1;for(const sd of[-1,1]){cx.beginPath();cx.arc(hx+sd*(R+4+w*3),hy,2+w*2,sd<0?Math.PI*.6:-Math.PI*.4,sd<0?Math.PI*1.4:Math.PI*.4);cx.stroke()}}}
    if(c.cl>0){const pc=1-c.cl/CL;cx.strokeStyle='#e5a93b';cx.lineWidth=2;cx.beginPath();cx.arc(hx,hy,R*.7,-Math.PI/2,-Math.PI/2+TAU*pc);cx.stroke();rect(c.x-9,c.y+4,18,2,'#16222d');rect(c.x-9,c.y+4,18*pc,2,'#e5a93b')}
    if(c.sp){otx('★',hx,hy-R-4+Math.sin(t*4)*1,'#ffd067',9,'center');Post.glow(hx,hy,16,'255,208,100',.14+.06*Math.sin(t*5))}
    if(sel){cx.strokeStyle='#fff';cx.lineWidth=1;const b=R+5;for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){cx.beginPath();cx.moveTo(hx+sx*b,hy+sy*(b-3));cx.lineTo(hx+sx*b,hy+sy*b);cx.lineTo(hx+sx*(b-3),hy+sy*b);cx.stroke()}
      cx.save();cx.setLineDash([2,3]);cx.lineDashOffset=-t*8;cx.strokeStyle='rgba(255,255,255,.7)';cx.beginPath();cx.ellipse(c.x,c.y+1,9,4.4,0,0,TAU);cx.stroke();cx.restore()}
  },
  cutDraw(c){const T=c.t,x=c.x+8,y=c.y+1;
    Post.glow(c.x,c.y,40,'255,40,30',.12+.1*Math.max(0,Math.sin(T*6)));
    if(T<1.4)return;const u=clamp((T-1.4)/1.2,0,1),jx=u<.7?(Math.random()-.5)*.8:0;
    cx.fillStyle='rgba(0,0,0,.4)';cx.beginPath();cx.ellipse(x+1,y+3,5,2.4,0,0,TAU);cx.fill();
    if(u<.6)TS.draw(cx,'z1','down',Math.PI,0,x+jx,y,1);
    else{const f=clamp((u-.6)/.4,0,1),lx=T>2.4?-Math.min(4,(T-2.4)*6):0;TS.draw(cx,'z1','walk',Math.PI,Math.floor(T*8)%4,x+lx,y-(1-f)*2,1);
      if(T>2.2&&T<4)otx('!',x+lx,y-14,'#ff5b4d',10,'center')}
    if(T>2.2&&T<3.4)Post.glow(x,y-3,26,'255,40,30',.55*(1-(T-2.2)/1.2))},
  draw(){
    const s=this.s,t=s.t+(s.ct||0),now=performance.now(),dt=Math.min(.1,(now-this.lt)/1000);this.lt=now;
    cx.fillStyle='#05090d';cx.fillRect(0,0,W,H);cx.save();
    if(s.cut){const T=s.cut.t,z=1+1.3*ease(Math.min(1,T/1.3))*(1-ease(clamp((T-7.2)/.8,0,1))),fx=s.cut.x+OX,fy=s.cut.y,sh=s.shake>0?(Math.random()*2-1)*s.shake*4:0;cx.translate(fx+sh,fy);cx.scale(z,z);cx.translate(-fx,-fy)}
    cx.translate(OX,0);cx.beginPath();cx.rect(-OX,0,MW,H);cx.clip();Maps.blit(cx,this.map,this.strip);
    // вода: мерцание и течение
    cx.fillStyle='rgba(190,235,250,.5)';for(let i=0;i<46;i++){const y=22+((i*53+t*(5+(i%4)*1.5))%(H-22)),a=222+Math.sin(y/34)*2.4,b=262+Math.sin(y/34+.8)*2.4,x=a+3+((i*37)%Math.max(1,(b-a-6)));if(Math.sin(t*1.7+i)>-.1)cx.fillRect(x|0,y|0,2+(i%3),1)}
    for(const y of[107,195])Maps.dimg(cx,this.br,218-4,Math.round(y-3.5)-6);
    // ночные огни: мерцание фонарей и сигнальных огней
    for(const L of this.map.lamps){const fl=.7+.3*Math.sin(t*1.3+L.x*.7+L.y);Post.glow(L.x,L.y+1,13,'255,214,140',.12*fl)}
    for(const L of this.map.lights)if(Math.floor(t*1.2+L.x)%2===0){cx.fillStyle='#ff4a3d';cx.fillRect(L.x,L.y,1,1);Post.glow(L.x,L.y,5,'255,60,50',.35)}
    // машины на улицах
    for(const c of s.cars){const dx=c.h?c.d:0,dy=c.h?0:c.d;this.veh(c.x,c.y,dx,dy,c.c,{});
      cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,246,190,.12)';if(c.h)cx.fillRect(c.d>0?c.x+3:c.x-11,c.y-1,8,3);else cx.fillRect(c.x-1,c.d>0?c.y+3:c.y-11,3,8);cx.restore()}
    // зоны заражения
    for(const f of s.foci)this.focus(f,t);
    // дом Артёма — тёплое свечение
    {const a=s.home?.16:.06;Post.glow(106,96,22,'255,200,110',a+.04*Math.sin(t*2))}
    // центр управления: радар и огни
    {const a=t*.8,rx=BASE.x,ry=BASE.y-14;cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<6;k++){cx.strokeStyle='rgba(76,201,192,'+(.16-k*.025).toFixed(3)+')';cx.beginPath();cx.moveTo(rx,ry);cx.lineTo(rx+Math.cos(a-k*.06)*92,ry+Math.sin(a-k*.06)*92*.8);cx.stroke()}cx.restore();
      cx.strokeStyle='rgba(76,201,192,'+(.5+.3*Math.sin(t*4)).toFixed(2)+')';cx.lineWidth=1;cx.beginPath();cx.arc(rx,ry+8,9+((t*8)%6),0,TAU);cx.globalAlpha=.4;cx.stroke();cx.globalAlpha=1;
      Post.glow(rx,ry+6,26,'76,201,192',.1);otx('ЦУ',BASE.x,BASE.y+14,'#4cc9c0',10,'center')}
    // части служб
    this.stations(t);
    // перекрытые улицы: заграждение и подсвеченный участок
    for(const k of s.blocks){const A=ROAD.N[k.a],B=ROAD.N[k.b],mx=(A.x+B.x)/2,my=(A.y+B.y)/2,hz=A.y===B.y,pr=clamp(1-k.age/k.ttl,0,1);
      cx.save();cx.strokeStyle='rgba(255,70,50,'+(.22+.1*Math.sin(t*5)).toFixed(2)+')';cx.lineWidth=4;cx.beginPath();cx.moveTo(A.x,A.y);cx.lineTo(B.x,B.y);cx.stroke();cx.restore();
      const w=hz?4:12,h=hz?12:4,bx=Math.round(mx-w/2),by=Math.round(my-h/2);cx.fillStyle='rgba(0,0,0,.4)';cx.fillRect(bx+1,by+1,w,h);
      for(let i=0;i<(hz?h:w);i+=2){cx.fillStyle=(i/2)%2?'#f2f2f2':'#e8432f';if(hz)cx.fillRect(bx,by+i,w,2);else cx.fillRect(bx+i,by,2,h)}
      Post.glow(mx,my,10,'255,120,60',.25+.1*Math.sin(t*6));
      cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(Math.round(mx)-7,Math.round(my)+8,14,2);cx.fillStyle='#ff8a3a';cx.fillRect(Math.round(mx)-7,Math.round(my)+8,14*pr,2)}
    // предпросмотр: пути служб до выбранного вызова
    if(s.sel&&!s.sel.asg&&s.calls.includes(s.sel)&&!s.cut){const pv=this.preview(s.sel);
      for(const k in pv){if(s.crew[k]<=0||(k==='spec'&&!s.spec))continue;const q=pv[k].path;
        cx.save();cx.setLineDash([2,4]);cx.lineDashOffset=-t*14;cx.strokeStyle=SVC[k].c;cx.globalAlpha=.8;cx.lineWidth=1.6;cx.beginPath();q.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke();cx.restore()}}
    // маршруты и машины служб (по улицам, по правой полосе)
    for(const u of s.units){if(u.pi>=u.path.length)continue;const col=SVC[u.svc].c;
      cx.save();cx.setLineDash([3,4]);cx.lineDashOffset=-t*22;cx.strokeStyle=col;cx.globalAlpha=u.st==='go'?.6:.25;cx.lineWidth=1;cx.beginPath();cx.moveTo(u.x,u.y);for(let i=u.pi;i<u.path.length;i++)cx.lineTo(u.path[i][0],u.path[i][1]);cx.stroke();cx.restore();
      if(u.st==='go'){const e=u.path[u.path.length-1];cx.strokeStyle=col;cx.globalAlpha=.6;cx.beginPath();cx.moveTo(e[0],e[1]);cx.lineTo(u.c.x,u.c.y);cx.stroke();cx.globalAlpha=1}}
    for(const u of s.units)this.svcVeh(u.x-u.dy*1.6,u.y+u.dx*1.6,u.dx,u.dy,u.k,t);
    // вызовы
    for(const c of s.calls)if(s.sel!==c)this.pin(c,t,false);
    if(s.sel&&s.calls.includes(s.sel))this.pin(s.sel,t,true);
    // всплывающие эффекты
    for(const f of s.fx){const u=f.t/f.d;
      if(f.k==='txt'){otx(f.s,f.x,f.y-u*12,f.c,10,'center',clamp(1.6-u*1.6,0,1)*clamp(u*8,0,1))}
      else{cx.strokeStyle='rgba(125,255,166,'+(1-u).toFixed(2)+')';cx.lineWidth=2;cx.beginPath();cx.ellipse(f.x,f.y,(f.r||16)*(.5+u*1.2),(f.r||16)*(.5+u*1.2)*.8,0,0,TAU);cx.stroke();
        cx.save();cx.globalCompositeOperation='lighter';for(let k=0;k<12;k++){const a=k*.52+f.x,rr=u*(f.r||16)*1.3;cx.fillStyle='rgba(125,255,166,'+(1-u).toFixed(2)+')';cx.fillRect(f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr*.8-u*6,2,2)}cx.restore()}}
    if(this.strip)for(const L of this.strip.lamps){const fl=.7+.3*Math.sin(t*1.3+L.x*.7+L.y);Post.glow(L.x,L.y+1,13,'255,214,140',.12*fl)}
    if(s.cut)this.cutDraw(s.cut);
    cx.restore();
    Post.drops(40,MW,t,dt,'rgba(160,195,225,.2)');Post.vig(.8);
    cx.strokeStyle='#3a8f8a';cx.lineWidth=1;for(const[x,y,dx,dy]of[[2,24,1,1],[MW-3,24,-1,1],[2,H-3,1,-1],[MW-3,H-3,-1,-1]]){cx.beginPath();cx.moveTo(x,y+dy*10);cx.lineTo(x,y);cx.lineTo(x+dx*10,y);cx.stroke()}
    if(s.lock>0){cx.fillStyle='rgba(0,0,0,.66)';cx.fillRect(0,0,MW,H);otx('☕ Вы пьёте кофе…',MW/2,H/2,'#e5a93b',14,'center')}
  }
};
ACT.op_police=()=>Op.dispatch('police');ACT.op_amb=()=>Op.dispatch('amb');ACT.op_fire=()=>Op.dispatch('fire');ACT.op_spec=()=>Op.dispatch('spec');
ACT.op_cl=()=>Op.clarify();ACT.op_ign=()=>Op.ignore();ACT.op_coffee=()=>Op.coffee();
