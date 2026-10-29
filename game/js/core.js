'use strict';
// W — логическая ширина холста: подстраивается под соотношение сторон экрана (H фиксирована), см. fit()
const $=s=>document.querySelector(s),H=270,MAXA=2.6;let W=480,MW=330,OX=0;const PNL=150,SAFE={l:0,r:0,t:0,b:0};
const cv=$('#cv'),cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const mmss=t=>{t=Math.max(0,Math.floor(t));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')};
const ACT={};
const G={};
// ---------- хранилище: localStorage + резервная копия в IndexedDB ----------
// В Android WebView localStorage работает только при setDomStorageEnabled(true) (включено в оболочке с 0.6.2);
// IndexedDB — запасной путь: если localStorage недоступен или его очистили, прогресс восстанавливается оттуда.
const Store=(()=>{
  let ls=null;try{const L=window.localStorage,t='epi.__t';L.setItem(t,'1');if(L.getItem(t)!=='1')throw 0;L.removeItem(t);ls=L}catch(e){ls=null}
  const mem={};let db=null,dbOk=false;const waits=[];
  const ready=new Promise(res=>{try{if(!window.indexedDB){res(null);return}const r=indexedDB.open('epicenter',1);
      r.onupgradeneeded=()=>{try{r.result.createObjectStore('kv')}catch(e){}};r.onsuccess=()=>{db=r.result;dbOk=true;res(db)};r.onerror=()=>res(null);r.onblocked=()=>res(null)}catch(e){res(null)}});
  const put=(k,v)=>{try{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(v,k)}catch(e){}};
  return{
    get ls(){return !!ls},get idb(){return dbOk},ready,
    ok(){return !!ls||dbOk},
    get(k){if(ls){try{const v=ls.getItem(k);if(v!=null)return v}catch(e){}}return k in mem?mem[k]:null},
    set(k,v){mem[k]=v;if(ls){try{ls.setItem(k,v)}catch(e){}}if(db)put(k,v);else ready.then(d=>{if(d)put(k,v)})},
    // значение из резервной копии (асинхронно)
    getIdb(k){return ready.then(d=>new Promise(res=>{if(!d){res(null);return}try{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result==null?null:q.result);q.onerror=()=>res(null)}catch(e){res(null)}}))}
  }})();
const OPT=(()=>{const o={vib:true,mute:false,tips:true,dev:false};try{Object.assign(o,JSON.parse(Store.get('epi.opt')||'{}'))}catch(e){}return o})();
const TOUCH=(()=>{try{return matchMedia('(pointer:coarse)').matches}catch(e){return true}})(),HINT=(t,k)=>TOUCH?t:k;
document.documentElement.classList.toggle('kbd',!TOUCH);
function saveOpt(){try{Store.set('epi.opt',JSON.stringify(OPT))}catch(e){}}
function newGame(o){Object.assign(G,{delay:0,foci:1,fociLeft:0,losses:0,saved:0,support:60,cruelty:0,home:'',bridges:0,cityInf:.3,role:'',route:[],research:0},o||{})}
newGame();
// ---------- layout ----------
function fit(){
  const vw=innerWidth,vh=innerHeight,a=$('#app'),R=document.documentElement.style;
  let aw=vw,ah=vh;
  if(vw/vh<16/9)ah=vw*9/16;else if(vw/vh>MAXA)aw=vh*MAXA;
  const rem=ah/36,nw=clamp(Math.round(H*aw/ah),480,Math.round(H*MAXA)),gx=Math.max(0,(vw-aw)/2);
  a.style.width=aw+'px';a.style.height=ah+'px';R.fontSize=rem+'px';
  R.setProperty('--gx',gx+'px');R.setProperty('--u',rem+'px');
  // безопасные поля: вырез камеры, скруглённые углы (px → логические пиксели холста)
  const pr=$('#sfp');if(pr){const cs=getComputedStyle(pr),k=nw/aw;
    SAFE.l=Math.max(0,(parseFloat(cs.paddingLeft)||0)-gx)*k;SAFE.r=Math.max(0,(parseFloat(cs.paddingRight)||0)-gx)*k;SAFE.t=(parseFloat(cs.paddingTop)||0)*k;SAFE.b=(parseFloat(cs.paddingBottom)||0)*k}
  MW=Math.max(250,nw-Math.round(PNL+SAFE.r));OX=MW-330;
  if(nw!==W){W=nw;cv.width=W;cx.imageSmoothingEnabled=false;Post.vc=null;Post.rain=null}
  if(typeof mode!=='undefined'&&mode&&mode.resize)mode.resize();
  if(typeof Slides!=='undefined'&&Slides.open){Slides.fitC();Slides.fitUI()}
  if(typeof Tut!=='undefined'&&Tut.on)Tut.fit();
}
let fitT=0;addEventListener('resize',()=>{clearTimeout(fitT);fitT=setTimeout(fit,60);fit()});
// ---------- loop ----------
let mode=null,last=0;
const Pause={on:false};
function imgSrc(n){return(typeof IMG!=='undefined'&&IMG['art_'+n])||'img/art_'+n+'.png'}
function setMode(m){if(Pause.close)Pause.close(true);if(mode&&mode.exit)mode.exit();mode=m;if(m&&m.enter)m.enter();if(typeof Tut!=='undefined')Tut.auto(m)}
function frame(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;try{if(mode){const blk=(typeof Tut!=='undefined'&&Tut.on)||Pause.on||(typeof Dlg!=='undefined'&&Dlg.on);if(!blk){if(typeof Coach!=='undefined'&&Coach.on){if(mode.coachUpdate)mode.coachUpdate(dt)}else mode.update(dt)}mode.draw()}if(typeof Dlg!=='undefined')Dlg.tick(dt);if(typeof Coach!=='undefined')Coach.tick();Cnt.tick(dt)}catch(e){console.error(e);window.__err=(window.__err||'')+e.stack+'\n'}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
// ---------- ui helpers ----------
// Обновление DOM «на месте»: меняются только отличающиеся атрибуты и тексты, поэтому панели не мигают,
// анимации появления не перезапускаются, а нажатая кнопка остаётся той же кнопкой. data-key — элемент с другим ключом создаётся заново.
function morphSet(box,h){
  if(box._raw===h)return;
  if(box._raw==null||!box.firstChild){box.innerHTML=h;box._raw=h;return}
  const t=document.createElement('div');t.innerHTML=h;morphKids(box,t);box._raw=h}
function morphKids(a,b){
  const nk=Array.from(b.childNodes),keyed=new Map();
  for(const n of a.childNodes){const k=n.nodeType===1&&n.getAttribute('data-key');if(k)keyed.set(k,n)}
  let i=0;
  for(const nb of nk){
    const cur=a.childNodes[i]||null,k=nb.nodeType===1&&nb.getAttribute('data-key');let m=null;
    if(k){m=keyed.get(k)||null;if(m){keyed.delete(k);if(m.tagName!==nb.tagName)m=null}}
    else if(cur&&cur.nodeType===nb.nodeType&&(nb.nodeType!==1||(cur.tagName===nb.tagName&&!cur.getAttribute('data-key'))))m=cur;
    if(m){if(m!==cur)a.insertBefore(m,cur);morphNode(m,nb)}else a.insertBefore(nb,cur);
    i++}
  while(a.childNodes.length>i)a.removeChild(a.lastChild)}
function morphNode(a,b){
  if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return}
  const cnt=a.classList.contains('cnt'),bar=a.hasAttribute('data-bk');
  if(cnt&&a.getAttribute('data-ck')!==b.getAttribute('data-ck')){a.replaceWith(b);return}
  for(const at of Array.from(b.attributes)){if(cnt&&at.name==='class')continue;if(bar&&at.name==='style')continue;if(a.getAttribute(at.name)!==at.value)a.setAttribute(at.name,at.value)}
  for(const at of Array.from(a.attributes)){if(cnt&&at.name==='class')continue;if(!b.hasAttribute(at.name))a.removeAttribute(at.name)}
  if(cnt)return;   // текст счётчика ведёт Cnt
  morphKids(a,b)}
function hud(h){morphSet($('#hud'),h);Cnt.dirty=true}
function panel(h){const p=$('#panel');document.body.classList.toggle('pn',h!=null);if(h==null){p.style.display='none';p._raw=null;p.innerHTML='';return}p.style.display='block';morphSet(p,h);Cnt.dirty=true}
function ctrl(on){$('#ctrl').style.display=on?'block':'none'}
function screen(h){const s=$('#screen');s.classList.remove('tr');s.innerHTML=h||'';s.style.display=h?'block':'none';Cnt.dirty=true}
let toastT=0;function say(t,d){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),(d||3.6)*1000)}
function card(o){screen(`<div class="card" style="background-image:linear-gradient(90deg,#070c11f2 0,#070c11e6 34%,#070c1166 75%),url(${imgSrc(o.img)})"><div class="ct"><div class="k">${o.k||''}</div><h1>${o.t}</h1>${(o.p||[]).map(x=>`<p>${x}</p>`).join('')}${o.st?`<div class="st">${o.st}</div>`:''}<div class="row">${(o.b||[]).map(b=>`<button class="btn ${b.c||''}" data-a="${b.a}" data-d="${b.d||''}">${b.l}</button>`).join('')}</div>${o.x||''}</div></div>`)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const f=ACT[b.dataset.a];if(f){beep(520,.04,.03);f(b.dataset.d)}});
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();if(mode&&mode.tap)mode.tap((e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H)});
// ---------- input ----------
const keys={},vk={},edge={},held={};const KM={ArrowLeft:'L',a:'L',A:'L',ArrowRight:'R',d:'R',D:'R',ArrowDown:'C',s:'C',S:'C',ArrowUp:'U',w:'U',W:'U',' ':'X',j:'X',J:'X',e:'E',E:'E',Enter:'E',Shift:'Z',z:'Z',Z:'Z'};
addEventListener('keydown',e=>{const n=KM[e.key];if(n){if(!keys[n])edge[n]=true;keys[n]=true;e.preventDefault()}});
addEventListener('keyup',e=>{const n=KM[e.key];if(n)keys[n]=false});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-k]');if(!b)return;const n=b.dataset.k;vk[n]=true;edge[n]=true;held[e.pointerId]=n;if(typeof vib==='function')vib(n==='X'?28:n==='E'?18:12);b.classList.add('on');e.preventDefault()});
const rel=e=>{const n=held[e.pointerId];if(n){vk[n]=false;delete held[e.pointerId];document.querySelectorAll('[data-k="'+n+'"]').forEach(b=>b.classList.remove('on'))}};
addEventListener('pointerup',rel);addEventListener('pointercancel',rel);
const dn=n=>keys[n]||vk[n],ed=n=>{const v=edge[n];edge[n]=false;return v};
// ---------- shared drawing ----------
function rect(x,y,w,h,c){cx.fillStyle=c;cx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function txt(s,x,y,c,sz,al){cx.font='bold '+(sz||8)+'px sans-serif';cx.fillStyle=c||'#cfe3ee';cx.textAlign=al||'left';cx.fillText(s,Math.round(x),Math.round(y))}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---------- общая постобработка карт: свет, виньетка, частицы
const Post={vc:null,
  vig(a){if(!this.vc){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),gr=g.createRadialGradient(W*.34,H*.56,H*.38,W*.34,H*.56,H*.98);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.6)');g.fillStyle=gr;g.fillRect(0,0,W,H);this.vc=c}cx.globalAlpha=a==null?1:a;cx.drawImage(this.vc,0,0);cx.globalAlpha=1},
  glow(x,y,r,rgb,a){cx.save();cx.globalCompositeOperation='lighter';const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(1,'rgba('+rgb+',0)');cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2);cx.restore()},
  rain:null,
  drops(n,wid,t,dt,col){if(!this.rain)this.rain=Array.from({length:n},()=>({x:Math.random()*wid,y:Math.random()*H,v:160+Math.random()*90}));
    cx.fillStyle=col||'rgba(160,195,225,.28)';for(const d of this.rain){d.y+=d.v*dt;d.x-=d.v*.12*dt;if(d.y>H){d.y=22;d.x=Math.random()*wid}cx.fillRect(d.x|0,d.y|0,1,4)}}
};

// ---------- анимированные счётчики и полосы ----------
// Cnt.h(ключ,значение,формат,суффикс) → html; число плавно «докручивается» до нового значения, а при изменении подсвечивается
const Cnt={st:new Map(),els:[],dirty:true,fr:0,
  fmt(v,f,s){let r;
    if(f==='p')r=Math.round(v)+'%';else if(f==='d')r=(Math.round(v*10)/10).toFixed(1);
    else if(f==='n')r=String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');else r=String(Math.round(v));
    return r+(s||'')},
  h(k,v,f,s){const o=this.st.get(k),c=o?o.v:v;return`<span class="cnt" data-ck="${k}" data-v="${v}" data-f="${f||'i'}"${s?` data-s="${s}"`:''}>${this.fmt(c,f||'i',s)}</span>`},
  bar(k,v,cls){const o=this.st.get(k),c=o?o.v:v;return`<i class="${cls||''}" data-bk="${k}" data-v="${v}" style="width:${clamp(c,0,100).toFixed(1)}%"></i>`},
  tick(dt){
    if(this.dirty){this.els=Array.from(document.querySelectorAll('.cnt,[data-bk]'));this.dirty=false}
    this.fr++;const ek=1-Math.exp(-dt*7.5);
    for(const el of this.els){
      if(!el.isConnected){this.dirty=true;continue}
      const k=el.dataset.ck||el.dataset.bk,tv=parseFloat(el.dataset.v);if(!(tv===tv))continue;
      let o=this.st.get(k);if(!o){o={v:tv,t:tv,b:0,d:0,f:-1};this.st.set(k,o)}
      if(o.f!==this.fr){o.f=this.fr;
        if(o.t!==tv){o.d=tv>o.t?1:-1;o.t=tv;o.b=.75}
        if(o.v!==o.t){o.v+=(o.t-o.v)*ek;if(Math.abs(o.v-o.t)<(el.dataset.f==='d'?.04:.35))o.v=o.t}
        if(o.b>0)o.b-=dt}
      if(el.dataset.bk){el.style.width=clamp(o.v,0,100).toFixed(1)+'%'}
      else{const tx=this.fmt(o.v,el.dataset.f,el.dataset.s);if(el.textContent!==tx)el.textContent=tx;
        const up=o.b>0&&o.d>0,dn=o.b>0&&o.d<0;if(el.classList.contains('up')!==up)el.classList.toggle('up',up);if(el.classList.contains('dn')!==dn)el.classList.toggle('dn',dn)}
    }
  },
  snap(){for(const[k,o]of this.st){o.v=o.t}}
};
const tw=(o,k,t,dt,sp)=>{const v=o[k]==null?t:o[k];o[k]=Math.abs(v-t)<.3?t:v+(t-v)*(1-Math.exp(-dt*(sp||7)));return o[k]};
const ease=u=>u<0?0:u>1?1:u*u*(3-2*u),lerp=(a,b,u)=>a+(b-a)*u;

// ---------- прогресс игрока: концовки, достижения, открытие пропуска кат-сцен ----------
const Prog={d:{end:{},ach:{},tut:{},raid:false,runs:0,v:2},
  // прогресс только накапливается: при чтении из нескольких копий берём объединение
  merge(j){if(!j||typeof j!=='object')return false;const d=this.d;let ch=false;
    for(const k of['end','ach','tut'])if(j[k]&&typeof j[k]==='object')for(const q in j[k])if(j[k][q]&&!(d[k]&&d[k][q])){d[k]=d[k]||{};d[k][q]=1;ch=true}
    if(j.raid&&!d.raid){d.raid=true;ch=true}if((j.runs||0)>(d.runs||0)){d.runs=j.runs;ch=true}return ch},
  parse(s){try{return s?JSON.parse(s):null}catch(e){return null}},
  load(){this.merge(this.parse(Store.get('epi.prog')));if(Store.get('epi.raid')==='1')this.d.raid=true;this.d.end=this.d.end||{};this.d.ach=this.d.ach||{};this.d.tut=this.d.tut||{};
    // догрузить резервную копию: если там есть то, чего нет в localStorage, — вернуть и пересохранить
    Store.getIdb('epi.prog').then(s=>{const ch=this.merge(this.parse(s));this.save();if(ch&&typeof Title!=='undefined'&&typeof mode!=='undefined'&&mode===Title&&Title.refresh)Title.refresh()});
    Store.getIdb('epi.opt').then(s=>{if(!Store.get('epi.opt')&&s){try{Object.assign(OPT,JSON.parse(s));saveOpt()}catch(e){}}})},
  save(){this.d.ts=Date.now();try{Store.set('epi.prog',JSON.stringify(this.d))}catch(e){}},
  end(k){const n=!this.d.end[k];this.d.end[k]=1;this.d.runs=(this.d.runs||0)+1;this.save();return n},
  ach(k){if(this.d.ach[k])return false;this.d.ach[k]=1;this.save();if(typeof say==='function')say('★ Достижение: '+(typeof ACH_N!=='undefined'&&ACH_N[k]||k),3.2);return true},
  raid(){if(!this.d.raid){this.d.raid=true;this.save()}},
  endCount(){return Object.keys(this.d.end).length},
  skipOK(){return OPT.dev||this.endCount()>0}
};
Prog.load();
Store.ready.then(()=>{if(!Store.ok())setTimeout(()=>say('Внимание: сохранение недоступно — прогресс не сохранится после закрытия игры.',6),1500)});
fit();
