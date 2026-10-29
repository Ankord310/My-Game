'use strict';
// Слайд-шоу (листает игрок), экраны итогов с оценкой и обучающие подсказки с паузой
function resetInput(){for(const k in edge)edge[k]=false;for(const k in keys)keys[k]=false;for(const k in vk)vk[k]=false;document.querySelectorAll('.kb.on').forEach(b=>b.classList.remove('on'))}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
// ---------------------------------------------------------------- подсказки (пауза до подтверждения)
const TUT={
  s1:{k:'ЭТАП 01 · УЧЁНЫЙ',ok:'Понятно',p:[{h:'Управление',it:[['◉',HINT('Ведите пальцем по экрану — идти.','WASD или стрелки — идти.')],['E','Действие: взять, открыть, подняться по лестнице.'],['✊',HINT('Удар оглушает заражённого на 3 секунды.','Пробел — удар: оглушает заражённого на 3 секунды.')],['◐',HINT('Красться (держать) — тише: заметят только вблизи.','Shift (держать) — красться: заметят только вблизи.')]].concat(TOUCH?[]:[['Esc','Пауза.']])}]},
  raid:{k:'ОСОБЫЙ ЭТАП · ВОЗВРАЩЕНИЕ',ok:'Понятно — в здание',p:[{h:'Коротко',it:[['▼','Спуститесь по лестницам на нижний этаж — к хранилищу.'],['✊',HINT('Огонь по ближайшему заражённому перед вами.','Пробел — огонь по ближайшему заражённому перед вами.')],['◐',HINT('Красться — тише и незаметнее.','Shift — красться: тише и незаметнее.')],['♥','8 жизней. Аптечки — белые коробки с крестом.']]}]},
  s2:{k:'ЭТАП 02 · ОПЕРАТОР',ok:'Понятно',p:[{h:'Коротко',it:[['?','Неясный звонок — «Уточнить» (1,2 с).'],['П','Полиция — драки, мародёры, паника.'],['С','Скорая — раненые и ДТП. Ж — пожарные: огонь и газ.'],['Н','Спецназ — «ожившие» (откроется по ходу смены).'],['✕','Ложный вызов — «Игнор». Цель: ≤4 очагов и ≤14 потерь.']]}]},
  s3:{k:'ЭТАП 03 · ВОЕННЫЙ',ok:'Понятно',p:[{h:'Коротко',it:[['⌖','Нажмите на район, чтобы им управлять.'],['+','Отряды (их 3) сдерживают заражение.'],['➜','Колонны (до 3): автобус 50 чел, грузовик 90, пешая 30 без топлива.'],['⛽','Топливо нужно автобусам, грузовикам и вертолёту; оно медленно восстанавливается.'],['▮','Блокпост не пропускает заражение, но и колонны. Досмотр открывает проезд, но замедляет посадку.'],['☾','Ночью заражение растёт быстрее, днём работать легче.'],['⚠','События (пробка, мародёры, приказ генерала) требуют решения за несколько секунд.'],['◎','Удержите центр (<36%) и аэродром (<24%). Следите за доверием: при низком медики откажутся работать.']]}]},
  s4:{k:'ЭТАП 04 · ШТАБ',ok:'Понятно',p:[{h:'Коротко',it:[['+','Бригады снижают заражение региона.'],['☎','Договор повышает доверие губернатора.'],['⚗','Наука: при 95% откроется «Защита живых».'],['⚔','С 10-го месяца нужен фронт из 3 бригад.'],['✖','Поражение: поддержка <8% или заражение >90%.']]}]}
};
const Tut={on:false,key:null,pg:0,
  auto(m){const h=$('#help');if(h)h.style.display=m&&m.tut?'flex':'none';const pb=$('#pausebtn');if(pb)pb.style.display=m&&m.tut?'flex':'none';if(m&&m.tut&&OPT.tips&&m.tutAuto!==false)this.show(m.tut)},
  show(key){const T=TUT[key];if(!T)return;this.key=key;this.pg=0;this.on=true;resetInput();$('#tut').style.display='flex';this.render()},
  render(){
    const T=TUT[this.key],P=T.p[this.pg],last=this.pg===T.p.length-1;
    $('#tut').innerHTML=`<div class="tbox pxb"><div class="tk">${T.k} · ПОДСКАЗКА ${this.pg+1}/${T.p.length}</div><h2>${P.h}</h2><ul class="tl">${P.it.map(i=>`<li><i class="ic">${esc(i[0])}</i><span>${esc(i[1])}</span></li>`).join('')}</ul>
      <div class="tf"><span class="dots">${T.p.map((_,i)=>i===this.pg?'●':'○').join(' ')}</span><span>${this.pg>0?'<button class="pbtn" data-a="tut_prev">◀ Назад</button> ':''}<button class="pbtn pri" data-a="tut_next">${last?T.ok:'Далее ▶'}</button></span></div></div>`;
    this.fit();
  },
  fit(){const t=$('#tut'),b=t&&t.querySelector('.tbox');if(!b)return;b.style.transform='';const m=Math.max(10,parseFloat(getComputedStyle(document.documentElement).fontSize)*.7),h=b.offsetHeight,w=b.offsetWidth,z=Math.min(1,(t.clientHeight-2*m)/h,(t.clientWidth-2*m)/w);if(z<.995)b.style.transform='scale('+Math.max(.45,z).toFixed(3)+')'},
  hide(){this.on=false;$('#tut').style.display='none';resetInput()}
};
ACT.tut_prev=()=>{if(Tut.pg>0){Tut.pg--;Tut.render()}};
ACT.tut_next=()=>{const T=TUT[Tut.key];if(Tut.pg<T.p.length-1){Tut.pg++;Tut.render()}else Tut.hide()};
$('#help').addEventListener('click',()=>{if(mode&&mode.tut)Tut.show(mode.tut)});
// ---------------------------------------------------------------- слайд-шоу
const GR={A:['#ffd24a','★★★★'],B:['#66e08a','★★★☆'],C:['#e5a93b','★★☆☆'],D:['#ff5b4d','★☆☆☆']};
const Slides={sw:320,open:false,L:[],i:0,done:null,t:0,typed:0,fade:1,imgs:{},parts:[],raf:0,last:0,
  fitC(){const w=Math.round(180*W/H);this.sw=w;if(this.c&&this.c.width!==w){this.c.width=w;if(this.g)this.g.imageSmoothingEnabled=false}},
  img(n){let m=this.imgs[n];if(!m){m=new Image();m.src=imgSrc(n);this.imgs[n]=m}return m},
  play(list,done){
    this.L=list;this.i=0;this.done=done;this.open=true;resetInput();
    $('#slide').style.display='flex';this.c=$('#slc');this.fitC();this.g=this.c.getContext('2d');this.g.imageSmoothingEnabled=false;
    list.forEach(s=>this.img(s.img));this.go(0);this.last=performance.now();if(!this.raf)this.raf=requestAnimationFrame(ts=>this.loop(ts));
  },
  go(i){
    this.i=i;const s=this.L[i];this.t=0;this.fade=1;this.typed=0;this.parts=[];
    const fx=s.fx||'';
    if(fx.includes('rain'))for(let k=0;k<110;k++)this.parts.push({k:'r',x:Math.random()*(this.sw+20),y:Math.random()*180,v:150+Math.random()*90});
    if(fx.includes('embers'))for(let k=0;k<50;k++)this.parts.push({k:'e',x:Math.random()*this.sw,y:Math.random()*180,v:10+Math.random()*30,p:Math.random()*6});
    if(fx.includes('dust'))for(let k=0;k<40;k++)this.parts.push({k:'d',x:Math.random()*this.sw,y:Math.random()*180,v:3+Math.random()*8,p:Math.random()*6});
    const box=$('#slide .sl-box'),res=$('#slide .sl-res');
    $('#slide .sl-tag').textContent=s.tag||'';
    if(s.res){box.style.display='none';res.style.display='block';this.renderRes(s.res);Snd.jingle(s.res.grade)}
    else{res.style.display='none';box.style.display='block';$('#slide .sl-txt').textContent='';this.typedCh=0}
    this.ctl();this.fitUI();
  },
  // подгонка: если блок не помещается по высоте/ширине — масштабируем (transform), положение сохраняется
  fit(el,host,maxH,maxW){if(!el)return;el.style.transform='';const h=el.offsetHeight,w=el.offsetWidth;let z=1;if(maxH>0&&h>maxH)z=Math.min(z,maxH/h);if(maxW>0&&w>maxW)z=Math.min(z,maxW/w);if(z<.995)el.style.transform='scale('+Math.max(.45,z).toFixed(3)+')'},
  fitUI(){
    const sl=$('#slide'),s=this.L[this.i];if(!sl||!s)return;
    const top=sl.querySelector('.sl-top');const bot=sl.querySelector('.sl-bot'),box=sl.querySelector('.sl-box'),res=sl.querySelector('.sl-res'),txt=sl.querySelector('.sl-txt');
    if(s.res){const rs=res.querySelector('.rs');this.fit(rs,res,res.clientHeight,res.clientWidth);return}
    // резервируем высоту под полный текст, чтобы блок не «прыгал» при печати
    box.style.transform='';box.style.minHeight='';const cur=txt.textContent;txt.textContent=s.text||'';const full=box.offsetHeight;txt.textContent=cur;box.style.minHeight=full+'px';
    const avail=sl.clientHeight-bot.offsetHeight+box.offsetHeight-parseFloat(getComputedStyle(bot).marginBottom)-(top?top.offsetHeight+top.offsetTop:0)-8;
    this.fit(box,bot,avail,bot.clientWidth)
  },
  ctl(){
    const s=this.L[this.i],last=this.i===this.L.length-1;
    const dots=this.L.map((_,k)=>k===this.i?'■':'□').join('');
    let r='';
    if(last&&s.choices)r=s.choices.map((c,k)=>`<button class="pbtn ${c.c||''}" data-a="sl_pick" data-d="${k}">${c.l}</button>`).join(' ');
    else r=`<button class="pbtn pri blink" data-a="sl_next">${last?(s.btn||'Далее ▶'):'Далее ▶'}</button>`;
    $('#slide .sl-ctl').innerHTML=`<span class="sl-l">${this.i>0?'<button class="pbtn" data-a="sl_prev">◀</button>':''}<span class="sl-dots">${dots}</span></span><span class="sl-r">${r}</span>`;
    $('#slide .sl-skip').style.display=(Prog.skipOK()&&this.canSkip())?'block':'none';
  },
  num(v,i){
    let n=null,suf='';if(typeof v==='number')n=v;else if(typeof v==='string'){const m=v.match(/^(\d+)(%)$/);if(m){n=+m[1];suf='%'}}
    if(n==null)return esc(v);const k='rs'+Date.now()+'_'+i;Cnt.st.set(k,{v:0,t:n,b:0,d:1,f:-1});return Cnt.h(k,n,'n',suf)},
  renderRes(r){
    const gc=GR[r.grade]||GR.C;
    $('#slide .sl-res').innerHTML=`<div class="rs pxb"><div class="rs-k">${esc(r.k)}</div><div class="rs-main"><div class="rs-grade" style="color:${gc[0]}"><b>${r.grade}</b><small>ОЦЕНКА</small><div class="stars">${gc[1]}</div></div>
      <div class="rs-rows">${r.rows.map((w,ri)=>`<div class="rw"><span>${esc(w[0])}</span><em>${this.num(w[1],ri)}</em>${w[2]!=null?`<div class="sg"><i class="${w[3]||''}" data-w="${Math.round(clamp(w[2],0,1)*100)}"></i></div>`:''}</div>`).join('')}</div></div>
      <div class="rs-notes">${r.notes.map(n=>`<div>▸ ${esc(n)}</div>`).join('')}</div></div>`;
    Cnt.dirty=true;requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('#slide .sg i').forEach(i=>i.style.width=i.dataset.w+'%')));
  },
  next(){
    const s=this.L[this.i];if(!s)return;
    if(s.text&&this.typed<s.text.length){this.typed=s.text.length;return}
    if(this.i<this.L.length-1)this.go(this.i+1);else if(!s.choices)this.close(true)
  },
  prev(){if(this.i>0){this.go(this.i-1);const s=this.L[this.i];this.typed=(s.text||'').length}},
  skipTarget(){const L=this.L;for(let k=this.i+1;k<L.length;k++)if(L[k].res||(k===L.length-1&&L[k].choices))return k;return -1},
  canSkip(){const s=this.L[this.i];return !!s&&!s.res&&!(this.i===this.L.length-1&&s.choices)},
  skip(){if(!this.canSkip())return;const k=this.skipTarget();if(k>=0)this.go(k);else this.close(true)},
  pick(k){const c=this.L[this.L.length-1].choices[k];this.close(false);if(c&&ACT[c.a])ACT[c.a](c.d)},
  close(callDone){this.open=false;cancelAnimationFrame(this.raf);this.raf=0;$('#slide').style.display='none';if(callDone&&this.done)this.done()},
  loop(ts){
    if(!this.open){this.raf=0;return}
    const dt=Math.min(.05,(ts-this.last)/1000||0);this.last=ts;this.t+=dt;
    try{this.draw(dt)}catch(e){window.__err=(window.__err||'')+e.stack}
    this.raf=requestAnimationFrame(t=>this.loop(t));
  },
  draw(dt){
    const g=this.g,s=this.L[this.i],t=this.t,fx=s.fx||'';
    g.fillStyle='#05090d';g.fillRect(0,0,this.sw,180);
    const im=this.img(s.img);
    if(im.complete&&im.naturalWidth){const px=Math.min(16,Math.floor(t*1.1)),py=Math.floor(px*.56);{const dw=this.sw+16,dh=Math.max(189,Math.round(dw*189/336));g.drawImage(im,-px,Math.round((180-dh)/2)-py,dw,dh)}}
    // частицы
    for(const p of this.parts){
      if(p.k==='r'){p.y+=p.v*dt;p.x-=p.v*.18*dt;if(p.y>180){p.y=-6;p.x=Math.random()*(this.sw+20)}g.fillStyle='rgba(175,210,230,.55)';g.fillRect(Math.round(p.x),Math.round(p.y),1,5);g.fillStyle='rgba(175,210,230,.3)';g.fillRect(Math.round(p.x)+1,Math.round(p.y)+4,1,2)}
      else if(p.k==='e'){p.y-=p.v*dt;p.x+=Math.sin(t*2+p.p)*8*dt;if(p.y<-3){p.y=183;p.x=Math.random()*this.sw}g.fillStyle=Math.sin(t*9+p.p)>0?'rgba(255,170,60,.9)':'rgba(255,90,30,.7)';g.fillRect(Math.round(p.x),Math.round(p.y),1,1)}
      else{p.y-=p.v*dt;p.x+=Math.sin(t+p.p)*5*dt;if(p.y<-3){p.y=183;p.x=Math.random()*this.sw}g.fillStyle='rgba(210,230,240,.25)';g.fillRect(Math.round(p.x),Math.round(p.y),1,1)}
    }
    if(fx.includes('alarm')){g.fillStyle='rgba(225,20,20,'+(.07+.11*Math.max(0,Math.sin(t*5)))+')';g.fillRect(0,0,this.sw,180)}
    if(fx.includes('flicker')&&Math.random()<.07){g.fillStyle='rgba(0,0,0,.2)';g.fillRect(0,0,this.sw,180)}
    if(fx.includes('scan')){g.fillStyle='rgba(0,0,0,.2)';for(let y=0;y<180;y+=2)g.fillRect(0,y,this.sw,1);g.fillStyle='rgba(120,230,215,.07)';g.fillRect(0,((t*38)%210)-20,this.sw,16)}
    if(fx.includes('glitch')&&Math.random()<.05){const y=(Math.random()*150)|0,h=3+((Math.random()*10)|0);g.drawImage(this.c,0,y,this.sw,h,((Math.random()*14)-7)|0,y,this.sw,h)}
    if(fx.includes('red')){g.fillStyle='rgba(120,0,0,.22)';g.fillRect(0,0,this.sw,180)}
    // ступенчатая виньетка, кино-полосы, плёночное зерно
    for(let k=0;k<5;k++){g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=4;g.strokeRect(k*4-1,k*3-1,this.sw-k*8+2,180-k*6+2)}
    g.fillStyle='#000';g.fillRect(0,0,this.sw,12);g.fillRect(0,168,this.sw,12);
    for(let i=0;i<30;i++){g.fillStyle='rgba(255,255,255,.07)';g.fillRect((Math.random()*this.sw)|0,(Math.random()*180)|0,1,1)}
    if(this.fade>0){this.fade=Math.max(0,this.fade-dt*2.2);g.fillStyle='rgba(0,0,0,'+this.fade+')';g.fillRect(0,0,this.sw,180)}
    // печатная машинка
    if(s.text){const n=Math.min(s.text.length,Math.floor(Math.max(0,t-.25)*52));if(n>this.typed)this.typed=n;
      if(this.typed!==this.typedCh){const o=$('#slide .sl-txt');o.textContent=s.text.slice(0,this.typed);if(this.typed>this.typedCh&&this.typed%3===0&&this.typed<s.text.length)Snd.t('square',640+((this.typed*37)%90),640,.014,.03);this.typedCh=this.typed}}
  }
};
ACT.sl_next=()=>Slides.next();ACT.sl_prev=()=>Slides.prev();ACT.sl_skip=()=>Slides.skip();ACT.sl_pick=d=>Slides.pick(+d);
$('#slide').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;Slides.next()});
addEventListener('keydown',e=>{if(!Slides.open)return;if([' ','Enter','ArrowRight'].includes(e.key)){e.preventDefault();Slides.next()}else if(e.key==='ArrowLeft'){Slides.prev()}});
