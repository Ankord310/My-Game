'use strict';
// Диалоги персонажей (этап 1) и интерактивное обучение «нажми сюда» (этапы 2–4)

// ---------------------------------------------------------------- портреты 24×24 (пиксель-арт)
const Portrait={
  draw(g,who,mood){
    g.clearRect(0,0,24,24);const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
    const bg=g.createLinearGradient(0,0,0,24);bg.addColorStop(0,'#123440');bg.addColorStop(1,'#071219');g.fillStyle=bg;g.fillRect(0,0,24,24);
    R(0,0,24,1,'#1c4c58');
    if(who==='sci'){ // Артём: тёмные волосы, очки, белый халат
      R(4,19,16,5,'#d9e6ec');R(4,19,16,1,'#ffffff');R(10,19,4,5,'#3a8f8a');R(11,20,2,4,'#2a6a66');R(5,21,1,3,'#b4c6cf');R(18,21,1,3,'#b4c6cf');R(15,21,2,2,'#4cc9c0');
      R(9,16,6,3,'#d8a77e');
      R(7,6,10,11,'#e8bd93');R(6,8,1,6,'#e8bd93');R(17,8,1,6,'#e8bd93');R(7,15,10,2,'#d8a77e');
      R(6,4,12,4,'#3b2a20');R(5,5,2,6,'#3b2a20');R(17,5,2,5,'#3b2a20');R(8,3,8,2,'#4a3628');R(9,7,5,1,'#3b2a20');
      const sc=mood==='scared';
      R(7,10,4,3,'#1b2a33');R(13,10,4,3,'#1b2a33');R(11,11,2,1,'#1b2a33');R(8,11,2,1,sc?'#ffffff':'#bfe9f5');R(14,11,2,1,sc?'#ffffff':'#bfe9f5');
      if(sc){R(8,8,3,1,'#3b2a20');R(13,8,3,1,'#3b2a20');R(11,14,2,2,'#5a1a1a')}else{R(8,9,3,1,'#3b2a20');R(13,9,3,1,'#3b2a20');R(10,15,4,1,'#9a5a48')}
      R(11,12,1,2,'#d09a72');
    }
  }
};

// ---------------------------------------------------------------- диалоговое окно (игра на паузе, тап — дальше)
const WHO={sci:'Артём Воронов · вирусолог'};
const Dlg={on:false,q:[],cur:null,shown:0,t:0,cb:null,
  say(lines,cb){if(!Array.isArray(lines))lines=[lines];this.q.push(...lines);if(cb)this.cb=cb;if(!this.on)this.next()},
  next(){
    const l=this.q.shift();if(!l){this.close();return}
    this.on=true;this.cur=l;this.shown=0;this.t=0;resetInput();if(typeof joy!=='undefined'){joy.on=false;joy.x=joy.y=0}
    const d=$('#dlg');d.style.display='flex';d.classList.remove('in');void d.offsetWidth;d.classList.add('in');
    Portrait.draw($('#dpor').getContext('2d'),l.who||'sci',l.mood);
    $('#dlg .dwho').textContent=WHO[l.who||'sci']||'';$('#dlg .dt').textContent='';
    const h=$('#dlg .dh');h.textContent=l.hint||'';h.style.display=l.hint?'block':'none';
    $('#dlg .dnext').style.opacity=0;beep(520,.03,.025)},
  tick(dt){if(!this.on||!this.cur)return;const s=this.cur.t;if(this.shown<s.length){this.t+=dt;const n=Math.min(s.length,Math.floor(this.t*55));if(n!==this.shown){this.shown=n;$('#dlg .dt').textContent=s.slice(0,n);if(n%3===0)beep(760+Math.random()*120,.012,.012)}}else $('#dlg .dnext').style.opacity=1},
  tap(){if(!this.on)return;if(this.shown<this.cur.t.length){this.shown=this.cur.t.length;$('#dlg .dt').textContent=this.cur.t;return}this.next()},
  close(){this.on=false;this.cur=null;$('#dlg').style.display='none';resetInput();const f=this.cb;this.cb=null;if(f)f()},
  clear(){this.q=[];if(this.on){this.on=false;this.cur=null;$('#dlg').style.display='none'}this.cb=null}
};
$('#dlg').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();Dlg.tap()});

// ---------------------------------------------------------------- интерактивное обучение
// шаг: {t:'текст', el:'селектор' | pt:()=>({x,y,r}) | rc:()=>({x0,y0,x1,y1}) (логические координаты холста),
//       wait:()=>bool (шаг засчитывается сам), btn:'надпись' (шаг по кнопке), start:fn}
const Coach={on:false,st:null,i:-1,L:[],done:null,key:'',
  need(k){return OPT.tips&&!(Prog.d.tut&&Prog.d.tut[k])},
  run(key,steps,done){this.key=key;this.L=steps;this.i=-1;this.done=done;this.on=true;resetInput();$('#coach').style.display='block';this.next()},
  next(){
    this.i++;const st=this.st=this.L[this.i];if(!st){this.finish(false);return}
    if(st.start)st.start();
    const b=$('#coach .cbub');b.classList.remove('in');void b.offsetWidth;b.classList.add('in');
    $('#coach .ct').textContent=st.t;$('#coach .cn').textContent=`ОБУЧЕНИЕ · ${this.i+1}/${this.L.length}`;
    const nb=$('#coach .cgo');nb.style.display=st.btn?'inline-block':'none';nb.textContent=st.btn||'';
    $('#coach .cskip').style.display=this.i<this.L.length-1?'inline-block':'none';
    this.place()},
  finish(skip){this.on=false;this.st=null;$('#coach').style.display='none';Prog.d.tut=Prog.d.tut||{};Prog.d.tut[this.key]=1;Prog.save();const f=this.done;this.done=null;if(f)f(skip)},
  tick(){if(!this.on||!this.st)return;if(this.st.wait&&this.st.wait()){beep(990,.06,.04);vib(15);this.next();return}this.place()},
  // прямоугольник цели в координатах экрана
  rect(){
    const st=this.st;if(!st)return null;
    if(st.el){const e=document.querySelector(st.el);if(!e||!e.offsetParent)return null;const r=e.getBoundingClientRect();return{l:r.left-6,t:r.top-6,r:r.right+6,b:r.bottom+6,round:0}}
    const c=cv.getBoundingClientRect(),kx=c.width/W,ky=c.height/H;
    if(st.pt){const p=st.pt();if(!p)return null;const x=c.left+(p.x+OX)*kx,y=c.top+p.y*ky,r=(p.r||14)*kx;return{l:x-r,t:y-r,r:x+r,b:y+r,round:1}}
    if(st.rc){const q=st.rc();if(!q)return null;return{l:c.left+(q.x0+OX)*kx,t:c.top+q.y0*ky,r:c.left+(q.x1+OX)*kx,b:c.top+q.y1*ky,round:0}}
    return null},
  place(){
    const R=this.rect(),h=$('#coach .chole'),b=$('#coach .cbub'),vw=innerWidth,vh=innerHeight;this.R=R;
    if(R){h.style.display='block';h.style.left=R.l+'px';h.style.top=R.t+'px';h.style.width=(R.r-R.l)+'px';h.style.height=(R.b-R.t)+'px';h.style.borderRadius=R.round?'50%':'.8rem';$('#coach').classList.remove('dim')}
    else{h.style.display='none';$('#coach').classList.add('dim')}
    const bw=b.offsetWidth,bh=b.offsetHeight,m=12;let x,y;
    if(!R){x=(vw-bw)/2;y=(vh-bh)/2}
    else{const cxm=(R.l+R.r)/2,cym=(R.t+R.b)/2,opts=[
        [R.l-bw-m,cym-bh/2,R.l-bw-m>=m],[R.r+m,cym-bh/2,R.r+m+bw<=vw-m],
        [cxm-bw/2,R.t-bh-m,R.t-bh-m>=m],[cxm-bw/2,R.b+m,R.b+m+bh<=vh-m]];
      const pref=this.st&&this.st.pt?(cym>vh*.5?[2,3,1,0]:[3,2,1,0]):(cxm>vw*.55?[0,2,3,1]:[1,2,3,0]);let ch=null;for(const k of pref)if(opts[k][2]){ch=opts[k];break}
      if(!ch)ch=[(vw-bw)/2,m];x=ch[0];y=ch[1]}
    b.style.left=clamp(x,m,vw-bw-m)+'px';b.style.top=clamp(y,m,vh-bh-m)+'px'},
  // разрешён ли тап по точке экрана (только цель и кнопки подсказки)
  allow(e){
    if(e.target.closest&&e.target.closest('#coach .cbub'))return true;
    const R=this.R;if(!R||!this.st||this.st.btn)return false;
    return e.clientX>=R.l&&e.clientX<=R.r&&e.clientY>=R.t&&e.clientY<=R.b}
};
['pointerdown','click','touchstart'].forEach(ev=>document.addEventListener(ev,e=>{
  if(!Coach.on||Dlg.on)return;if(Coach.allow(e))return;
  if(e.target.closest&&(e.target.closest('#mute')||e.target.closest('#slide')||e.target.closest('#pause')))return;
  e.stopPropagation();if(e.cancelable)e.preventDefault()},true));
ACT.coach_go=()=>{if(Coach.on&&Coach.st&&Coach.st.btn)Coach.next()};
ACT.coach_skip=()=>{if(Coach.on)Coach.finish(true)};
addEventListener('keydown',e=>{const k=e.key,go=k===' '||k==='Enter'||k==='e'||k==='E';
  if(Dlg.on&&go){e.preventDefault();Dlg.tap();return}
  if(Coach.on&&Coach.st&&Coach.st.btn&&(k==='Enter'||k===' ')){e.preventDefault();Coach.next();return}
  if(typeof Slides!=='undefined'&&Slides.open&&!Pause.on&&(k==='Enter'||k===' '||k==='ArrowRight')){const s=Slides.L[Slides.i];if(s&&!s.choices&&!s.res){e.preventDefault();Slides.next()}}});
// во весь экран (кнопка видна только на компьютере)
(()=>{const b=$('#fs');if(!b)return;b.addEventListener('click',()=>{try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen()}catch(e){}})})();
if(!TOUCH){const r=$('#rot');if(r)r.innerHTML='Сделайте окно браузера шире,<br>чем выше — игра рассчитана на горизонтальный экран'}
