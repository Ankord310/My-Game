'use strict';
// Звук: процедурная музыка для каждого этапа, эффекты (WebAudio) и вибрация
const vib=p=>{if(!OPT.vib)return;try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}};
const SC={min:[0,2,3,5,7,8,10],dor:[0,2,3,5,7,9,10],phr:[0,1,3,5,7,8,10],maj:[0,2,4,5,7,9,11]};
// Треки: bpm/arp/bass/drums могут быть массивами по уровням интенсивности
const TRK={
  menu:{bpm:58,root:45,sc:'min',prog:[0,0,5,3],vol:.9,arp:'0...2...4...2...',bass:'x.......x.......'},
  s1:{bpm:[70,128],root:40,sc:'min',prog:[0,0,5,6],vol:1,arp:['0.....2.....4...','0.2.4.2.0.2.4.7.'],bass:['x.......x.......','x.x.x.x.xx.x.x.x'],
      drums:[null,{k:'x...x...x...x...',s:'....x.......x...',h:'..x...x...x...x.'}]},
  op:{bpm:96,root:43,sc:'dor',prog:[0,3,5,4],vol:1,arp:'0.2.4.2.0.2.4.5.',bass:'x..x..x.x..x..x.',drums:{k:'x.......x.......',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.'}},
  mil:{bpm:104,root:38,sc:'min',prog:[0,0,5,4],vol:1,arp:null,bass:'x.xx.x.xx.xx.x.x',drums:{k:'x..x..x.x..x..x.',s:'....x..x....x.xx',h:null}},
  hq:{bpm:68,root:41,sc:'phr',prog:[0,1,0,5],vol:.95,arp:'0...4...2...5...',bass:'x.......x.......',drums:{k:'x.......x.......',s:null,h:'....x.......x...'}},
  raid:{bpm:128,root:36,sc:'min',prog:[0,0,6,5],vol:1,arp:'0.0.3.0.5.0.3.2.',bass:'x.xxx.xxx.xxx.xx',drums:{k:'x...x...x...x...',s:'....x.......x..x',h:'x.x.x.x.x.x.x.xx'}},
  win:{bpm:80,root:48,sc:'maj',prog:[0,4,5,3],vol:.95,arp:'0.2.4.7.4.2.0...',bass:'x.......x.......'},
  lose:{bpm:50,root:38,sc:'min',prog:[0,5,3,4],vol:.9,arp:'0.......4.......',bass:'x...............'}
};
const Snd={
  ctx:null,out:null,mus:null,fx:null,nb:null,muted:false,want:null,cur:null,lvl:0,groans:0,
  unlock(){
    if(this.ctx){if(this.ctx.state!=='running')this.ctx.resume();return}
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const c=this.ctx=new AC(),comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=6;
    this.out=c.createGain();this.out.gain.value=this.muted?0:1;this.out.connect(comp);comp.connect(c.destination);
    this.mus=c.createGain();this.mus.gain.value=.85;this.mus.connect(this.out);
    this.fx=c.createGain();this.fx.gain.value=1.25;this.fx.connect(this.out);
    const n=c.createBuffer(1,c.sampleRate,c.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.nb=n;
    setInterval(()=>this.tick(),40);if(c.state!=='running')c.resume();
    if(this.want){const w=this.want;this.want=null;this.play(w)}
  },
  setMute(m){this.muted=m;OPT.mute=m;saveOpt();if(this.out)this.out.gain.setTargetAtTime(m?0:1,this.ctx.currentTime,.05);const b=$('#mute');if(b)b.textContent=m?'🔇':'♪'},
  level(n){this.lvl=n},
  play(name){
    if(!this.ctx){this.want=name;return}
    if(this.cur&&this.cur.name===name)return;
    const c=this.ctx,now=c.currentTime;
    if(this.cur){const o=this.cur.g;o.gain.cancelScheduledValues(now);o.gain.setValueAtTime(o.gain.value,now);o.gain.linearRampToValueAtTime(0,now+.8);setTimeout(()=>{try{o.disconnect()}catch(e){}},1200)}
    const g=c.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(TRK[name].vol,now+1.2);g.connect(this.mus);
    this.cur={name,T:TRK[name],g,step:0,bar:0,next:now+.15};this.lvl=0;
  },
  tick(){
    const c=this.ctx,k=this.cur;if(!c||!k||document.hidden||c.state!=='running')return;
    let guard=0;while(k.next<c.currentTime+.2&&guard++<8){this.step(k,k.next);}
  },
  note(dest,type,f,t,dur,vol,o){
    o=o||{};const c=this.ctx,os=c.createOscillator(),g=c.createGain();os.type=type;os.frequency.setValueAtTime(f,t);if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+dur);
    let nd=g;if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;fl.Q.value=o.q||1;os.connect(fl);fl.connect(g)}else os.connect(g);
    const a=o.a||.008;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+a);g.gain.setTargetAtTime(0,t+Math.max(a,dur*(o.hold||.5)),o.r||dur*.25);
    g.connect(dest);os.start(t);os.stop(t+dur+(o.r||dur*.25)*5);
  },
  nz(dest,t,dur,vol,type,f0,f1,q){
    const c=this.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.nb;s.loop=true;f.type=type;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);f.Q.value=q||1;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+.02);
  },
  step(k,t){
    const T=k.T,L=this.lvl,pk=v=>Array.isArray(v)?v[Math.min(L,v.length-1)]:v,bpm=pk(T.bpm),sd=60/bpm/4,s=k.step,ch=T.prog[k.bar%T.prog.length],sc=SC[T.sc];
    const nt=i=>sc[((i%7)+7)%7]+12*Math.floor(i/7),mf=m=>440*Math.pow(2,(m-69)/12),d=k.g;
    if(s===0){for(const q of[0,2,4]){this.note(d,'sawtooth',mf(T.root+12+nt(ch+q)),t,sd*15,.085,{a:sd*5,lp:700,r:sd*3,hold:.9});this.note(d,'triangle',mf(T.root+nt(ch+q))*1.004,t,sd*15,.085,{a:sd*6,r:sd*3,hold:.9})}}
    const bp=pk(T.bass);if(bp&&bp[s]!=='.'){const dg=bp[s]==='x'?0:+bp[s];this.note(d,'sawtooth',mf(T.root+nt(ch+dg)),t,sd*.9,.17,{lp:380+L*160,a:.004,r:sd*.4})}
    const ap=pk(T.arp);if(ap&&ap[s]!=='.'){this.note(d,'triangle',mf(T.root+24+nt(ch+(+ap[s]))),t,sd*1.6,.11,{lp:2600,a:.004,r:sd*.9,hold:.2})}
    const dr=pk(T.drums);if(dr){
      if(dr.k&&dr.k[s]==='x')this.note(d,'sine',130,t,.16,.55,{f2:42,a:.002,hold:.6,r:.05});
      if(dr.s&&dr.s[s]==='x'){this.nz(d,t,.14,.28,'bandpass',1900,1200,.8);this.note(d,'triangle',190,t,.09,.18,{a:.002,r:.03})}
      if(dr.h&&dr.h[s]==='x')this.nz(d,t,.04,.1,'highpass',7500,7000,.5)}
    k.next+=sd;k.step++;if(k.step>=16){k.step=0;k.bar++}
  },
  // ----- эффекты
  t(type,f0,f1,dur,vol,delay){if(!this.ctx)return;this.note(this.fx,type,f0,this.ctx.currentTime+(delay||0),dur,vol,{f2:f1!==f0?f1:0,a:.003,hold:.3,r:dur*.3})},
  n(dur,vol,type,f0,f1,q){if(!this.ctx)return;this.nz(this.fx,this.ctx.currentTime,dur,vol,type,f0,f1,q)},
  swing(){this.n(.2,1.7,'bandpass',450,3000,.7);this.t('sine',900,300,.12,.08)},
  hit(){this.n(.13,.7,'lowpass',2400,170,.8);this.t('sine',170,44,.2,.8);this.t('square',95,50,.08,.18)},
  hurt(){this.n(.16,.55,'lowpass',1000,120,.8);this.t('sawtooth',230,110,.24,.4)},
  shot(){this.n(.12,.8,'highpass',3200,800,.7);this.t('sine',160,40,.14,.9);this.n(.3,.2,'lowpass',1400,200,.6)},
  jump(){this.t('sine',260,540,.1,.22)},
  land(){this.n(.08,.9,'lowpass',700,90,.7);this.t('sine',120,50,.08,.3)},
  foot(v){this.n(.05,.28*(v||1),'lowpass',460,150,.8)},
  clank(){this.t('triangle',980,640,.06,.16);this.n(.05,.12,'highpass',4500,3000,.6)},
  crack(){this.n(.09,.55,'highpass',2400,1100,.8);this.t('square',2100,260,.06,.14)},
  siren(){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type='sawtooth';
    for(let i=0;i<8;i++)o.frequency.setValueAtTime(i%2?900:620,t+i*.22);g.gain.setValueAtTime(.2,t);g.gain.linearRampToValueAtTime(.2,t+1.4);g.gain.linearRampToValueAtTime(0,t+1.8);
    const fl=this.ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=1800;o.connect(fl);fl.connect(g);g.connect(this.fx);o.start(t);o.stop(t+1.9)},
  groan(v,p,big){
    if(!this.ctx||v<.04||this.groans>=3)return;const c=this.ctx,t=c.currentTime,d=big?rnd(1,1.3):rnd(.7,1.1),f=(p||90)*rnd(.9,1.15)*(big?1.25:1),o=c.createOscillator();
    o.type='sawtooth';o.frequency.setValueAtTime(f*1.25,t);o.frequency.exponentialRampToValueAtTime(f*.62,t+d);
    const lf=c.createOscillator(),lg=c.createGain();lf.frequency.value=rnd(5,9);lg.gain.value=f*.07;lf.connect(lg);lg.connect(o.frequency);
    const fl=c.createBiquadFilter();fl.type='bandpass';fl.Q.value=4;fl.frequency.setValueAtTime(rnd(420,640),t);fl.frequency.linearRampToValueAtTime(rnd(210,320),t+d);
    const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime((big?1.5:1.1)*v,t+.12);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(fl);fl.connect(g);g.connect(this.fx);o.start(t);lf.start(t);o.stop(t+d+.05);lf.stop(t+d+.05);
    this.nz(this.fx,t,d*.85,(big?.6:.45)*v,'bandpass',520,250,2);
    this.groans++;setTimeout(()=>{this.groans--},d*1000);
  },
  jingle(g){if(!this.ctx)return;const q={A:[523,659,784,1047,1319],B:[440,554,659,880],C:[392,440,494,523],D:[330,294,262,196]}[g]||[440];q.forEach((f,i)=>this.t('square',f,f,.2,.16,i*.13))},
  roar(v,p){this.groan(Math.max(v,.3),p,true)},
  zdie(v,p){this.groan(Math.max(v,.3),(p||90)*.8,false);this.hit()}
};
function beep(f,d,v,type){Snd.t(type||'square',f,f,d||.08,(v==null?.04:v)*3)}
['pointerdown','touchend','click','keydown'].forEach(e=>addEventListener(e,()=>Snd.unlock(),{passive:true}));
document.addEventListener('visibilitychange',()=>{if(!Snd.ctx)return;if(document.hidden)Snd.ctx.suspend();else Snd.ctx.resume()});
if(OPT.mute){Snd.muted=true;$('#mute').textContent='🔇'}
(()=>{const b=$('#mute');b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',()=>{Snd.unlock();Snd.setMute(!Snd.muted)})})();
