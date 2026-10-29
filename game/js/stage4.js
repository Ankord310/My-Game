'use strict';
// Этап 4 «Штаб / глава страны»: 12 провинций, ресурсы (деньги, припасы, топливо, политический капитал), заражение по дорогам,
// бригады, карантины, границы, события с выбором, внешний фронт. Время идёт само, можно ставить паузу.
const RG=[
  {id:'n1',nm:'Северный лес',ab:'С.лес',x:108,y:56,tp:'agri',pop:2.4,pal:1,gv:'Орлов',tr:'hawk'},
  {id:'n2',nm:'Таёжный',ab:'Тайга',x:160,y:46,tp:'oil',pop:1.8,pal:0,gv:'Бекетов',tr:'greedy'},
  {id:'n3',nm:'Рубежный',ab:'Рубеж',x:216,y:62,tp:'mount',pop:1.5,pal:6,gv:'Серов',tr:'hawk'},
  {id:'w1',nm:'Западный',ab:'Запад',x:64,y:108,tp:'ind',pop:3.5,pal:5,gv:'Лаврова',tr:'auto'},
  {id:'r1',nm:'Речной',ab:'Речной',x:118,y:104,tp:'agri',pop:3,pal:2,gv:'Кузин',tr:'greedy'},
  {id:'c0',nm:'Центральный',ab:'ЦЕНТР',x:170,y:134,tp:'cap',pop:8.5,pal:7,cap:1,gv:'Мэр столицы',tr:'-'},
  {id:'e1',nm:'Восточный',ab:'Восток',x:232,y:120,tp:'ind',pop:3.2,pal:3,gv:'Тихонов',tr:'hawk'},
  {id:'l1',nm:'Приозёрье',ab:'Озёра',x:70,y:170,tp:'sci',pop:2.2,pal:8,gv:'Фёдорова',tr:'auto'},
  {id:'s1',nm:'Степной',ab:'Степь',x:122,y:166,tp:'agri',pop:3.4,pal:4,gv:'Рахимов',tr:'greedy'},
  {id:'m1',nm:'Горный',ab:'Горы',x:186,y:182,tp:'mount',pop:1.2,pal:6,gv:'Беляев',tr:'auto'},
  {id:'p1',nm:'Приморский',ab:'Приморье',x:238,y:186,tp:'port',pop:4,pal:9,gv:'Дроздов',tr:'greedy'},
  {id:'u1',nm:'Южный',ab:'Юг',x:140,y:226,tp:'port',pop:2.8,pal:5,gv:'Ветров',tr:'hawk'}];
const CAP=5;
// соседство: провинции ближе 74 единиц
const RE=(()=>{const E=[];for(let i=0;i<RG.length;i++)for(let j=i+1;j<RG.length;j++)if(Math.hypot(RG[i].x-RG[j].x,RG[i].y-RG[j].y)<74)E.push([i,j]);return E})();
const TPN={agri:'аграрная',ind:'промышленная',oil:'нефть и газ',mount:'горная',cap:'столица',sci:'научная',port:'портовая'};
const PROD={agri:{S:2.4},ind:{S:1.4,F:2,M:1},oil:{F:3.5},mount:{S:.8,R:.15},cap:{M:3.4,S:1,P:.34},sci:{M:1,R:.8},port:{M:2.6,F:1}};
const TRN={hawk:'ястреб: хочет войск',greedy:'торгаш: хочет денег',auto:'автономист: хочет свободы','-':'столица'};
// итоги этапа 3 → стартовые условия штаба: эвакуированные, потери мирных, потерянная техника, взорванные мосты, удержанная эвакуация
const Link34=()=>{
  const tot=G.s3t||601,sv=G.s3||0,k=G.s3k||0,vl=G.s3v||0,br=G.bridges||0,L=[];
  const pool=Math.min(2,Math.floor(sv/(tot*.3))),gov=Math.round(Math.max(-20,clamp(sv/tot*16,0,12)-Math.min(20,k/tot*45))),pc=3,fund=3-Math.min(2,Math.floor(vl/2)),res=G.contain3?4:0;
  if(pool)L.push('эвакуированные пополнили резервы: +'+pool+' бр.');
  if(gov>=3)L.push('губернаторы благодарны: +'+gov+' к доверию');else if(gov<=-3)L.push('губернаторы помнят потери: '+gov+' к доверию');
  if(fund<3)L.push('потеряна техника: финансирование '+fund);
  if(br)L.push('взорвано мостов: '+br+' — логистика страдает');
  if(res)L.push('эвакуация удалась: исследования +'+res+'%');
  return{pool,gov,pc,fund,res,L}};
const Hq={
  tut:'s4',tutAuto:false,rs:2,map:null,lt:0,
  enter(){
    Snd.play('hq');this.mkMap();const LK=Link34();
    const cap=RG[CAP],r=RG.map((o,i)=>{const d=Math.hypot(o.x-cap.x,o.y-cap.y);
      return{...o,i,inf:i===CAP?clamp(.5+.4*(G.epiInf||.5),.5,.95):clamp(.03+.24*(G.cityInf||.3)*(1-d/170)+Math.random()*.03,.02,.35),mood:clamp(60+LK.gov+(i===CAP?-8:rnd(-8,8)),10,95),br:0,q:0,bc:0,rev:0,strike:0,auto:0,lift:0,di:0,tk:[],qt:0}});
    r.forEach(o=>o.di=o.inf);
    const s=this.s={m:1,t:0,mt:20,dur:24,r,sel:CAP,hold:false,pool:Math.max(5,10-Math.floor(G.losses/12))+LK.pool,fr:0,front:false,fp:0,truce:0,res:Math.min(100,(G.research||0)+LK.res),
      M:10,S:10,F:6,P:LK.pc,nat:clamp(G.support,25,90),emer:false,head:false,cruel:G.cruelty||0,mut:1,mutEnd:0,log:[],logN:0,end:false,ev:null,evT:30,evHist:{},later:[],hudT:0,sig:'',fx:[],ftk:[0,0,0],smk:[],fxb:[],
      starve:false,cd:{aid:0,data:0},clouds:[{x:40,y:70,v:4,s:1},{x:180,y:170,v:3,s:1.2},{x:290,y:40,v:5,s:.9},{x:100,y:230,v:3.5,s:1}],stats:{riots:0,events:0}};
    if(G.bridges>0){s.S-=Math.min(3,G.bridges)}
    for(const m of LK.L.slice(0,3).reverse())this.log(m);
    ctrl(false);this.ui();this.hudUpd();this.lt=performance.now();if(Coach.need('s4'))this.coach();else say('Вы — начальник штаба. Столичный округ — тяжёлый эпицентр.',5);
  },
  exit(){const b=$('#evbox');if(b){b.style.display='none';b._raw=null;b.innerHTML=''}},
  coachUpdate(dt){const s=this.s;if(s.end)return;for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);s.hudT=(s.hudT||0)-dt;if(s.hudT<=0){s.hudT=.3;this.hudUpd();this.ui(1)}},
  coach(){const s=this.s,c=RG[CAP];s.sel=0;this.ui();let res0=s.res;
    Coach.run('s4',[
      {t:'Страна разделена на 12 провинций. Нажмите на «Центральный» — там эпицентр.',rc:()=>({x0:c.x-16,y0:c.y-14,x1:c.x+16,y1:c.y+10}),wait:()=>s.sel===CAP},
      {t:'Бригады замедляют заражение, но едят припасы. Добавьте бригаду.',el:'#panel [data-a="s4_b+"]',wait:()=>s.r[CAP].br>0},
      {t:'Карантин сильно замедляет заражение, но стоит денег и портит настроение. Введите его.',el:'#panel [data-a=s4_q]',wait:()=>s.r[CAP].q>0},
      {t:'Деньги можно вложить в исследования: вакцина — путь к победе.',el:'#panel [data-a=s4_res]',wait:()=>s.res>res0},
      {t:'Месяцы идут сами, паузу можно поставить в любой момент. Проиграть можно четырьмя способами: заражённость выше 90%, падение столицы, поддержка ниже 8% и развал фронта.',btn:'Войти в штаб ▶'}
    ],()=>{this.ui();say('Штаб работает!',2)})},
  mkMap(){const ex=Math.max(0,OX);if(!this.map||this.mapEx!==ex){this.map=Maps.country(RG,RE,ex,RS);this.mapEx=ex}},
  resize(){if(this.s&&this.mapEx!==Math.max(0,OX))this.mkMap()},
  log(m){const s=this.s;s.log.unshift('М'+s.m+': '+m);s.logN=(s.logN||0)+1;s.log.length=Math.min(4,s.log.length)},
  pop(x,y,t,c){this.s.fx.push({k:'txt',x,y,t:0,d:1.8,s:t,c:c||'#fff'})},
  tap(x,y){const s=this.s;if(x>MW||s.end)return;x-=OX;let b=this.map.regAt(x,y);
    if(!(b>=0&&b<RG.length)){b=-1;let bd=30;s.r.forEach((o,i)=>{const d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;b=i}})}
    if(b>=0){if(s.sel!==b){s.sel=b;beep(620,.04);vib(12)}this.ui()}},
  // --------------------------------------------------------------- расчёты
  mean(){const s=this.s;let a=0,w=0;for(const o of s.r){a+=o.inf*o.pop;w+=o.pop}return a/w},
  nbs(i){const o=[];for(const[a,b]of RE){if(a===i)o.push(b);if(b===i)o.push(a)}return o},
  eff(){const s=this.s;return(s.starve?.5:1)},
  act(a,d){
    const s=this.s,o=s.r[s.sel];if(s.end)return;
    if(a==='br+'){if(s.pool>0&&!o.rev){s.pool--;o.br++;beep(520,.05);vib(14);this.pop(o.x,o.y-20,'+1 бригада','#9fe8d6')}}
    else if(a==='br-'){if(o.br>0){o.br--;s.pool++;beep(400,.05)}}
    else if(a==='q'){o.q=(o.q+1)%3;o.qt=0;this.log(o.q?'Карантин '+o.q+' ур.: '+o.nm:'Карантин снят: '+o.nm);beep(o.q?260:500,.1,.05)}
    else if(a==='bc'){o.bc=o.bc?0:1;this.log(o.bc?'Границы закрыты: '+o.nm:'Границы открыты: '+o.nm);beep(300,.08)}
    else if(a==='sup'){if(s.S>=3&&!o.rev){s.S-=3;o.mood=Math.min(100,o.mood+15);this.pop(o.x,o.y-20,'+15 настроения','#7dffa6');this.log('Припасы отправлены: '+o.nm)}else say('Нужно 3 припаса',1.6)}
    else if(a==='gov'){if(s.P>=1){s.P--;o.mood=Math.min(100,o.mood+20);this.pop(o.x,o.y-20,'+20 доверия','#7dffa6');this.log('Договорённость с губернатором: '+o.nm)}else say('Нет политического капитала',1.6)}
    else if(a==='res'){if(s.M>=3){s.M-=3;s.res=Math.min(100,s.res+2.5);beep(700,.06);this.pop(o.x,o.y-20,'+2.5% исследований','#9fd0e8')}else say('Нужно 3 денег',1.6)}
    else if(a==='emer'){s.emer=!s.emer;this.log(s.emer?'Чрезвычайный закон введён':'Чрезвычайный закон отменён')}
    else if(a==='fr+'){if(s.pool>0&&s.front){s.pool--;s.fr++}}
    else if(a==='fr-'){if(s.fr>0){s.fr--;s.pool++}}
    else if(a==='aid'){if(s.cd.aid<=0){s.cd.aid=6;s.S+=4;s.F+=2;s.nat=Math.max(0,s.nat-2);this.log('Международная помощь: +4 припаса, +2 топлива')}}
    else if(a==='data'){if(s.cd.data<=0){s.cd.data=6;s.res=Math.min(100,s.res+10);this.log('Обмен данными: +10% исследований')}}
    else if(a==='hold'){s.hold=!s.hold;beep(s.hold?300:600,.06)}
    else if(a==='raid')this.raid();
    else if(a==='prot')this.finish('protect');
    this.ui();
  },
  raidOk(){const s=this.s;return s.r[CAP].inf<.4&&this.mean()<.5},
  raid(){const s=this.s;if(!this.raidOk())return;s.end=true;G.role=s.head?'head':'staff';setTimeout(()=>Flow.raidIntro(s.head?12:9,G.role),200)},
  finish(k){const s=this.s;if(s.end)return;s.end=true;this.evUi();setTimeout(()=>Flow.ending(k),300)},
  // --------------------------------------------------------------- время
  update(dt){
    const s=this.s;if(s.end||s.hold)return;s.t+=dt;s.cd.aid=Math.max(0,s.cd.aid-dt/s.mt);s.cd.data=Math.max(0,s.cd.data-dt/s.mt);
    for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<f.d);
    if(s.t>=s.mt){s.t=0;s.m++;this.tick()}
    // события
    if(s.ev){s.ev.t+=dt;if(s.ev.t>=s.ev.ttl)this.evChoose(this.EV[s.ev.k].def);else{s.evUiT=(s.evUiT||0)-dt;if(s.evUiT<=0){s.evUiT=.25;this.evUi()}}}
    else{s.evT-=dt;if(s.evT<=0&&s.m>=2){s.evT=rnd(22,34);this.evStart()}}
    s.hudT=(s.hudT||0)-dt;if(s.hudT<=0){s.hudT=.3;this.hudUpd();this.ui(1)}
  },
  tick(){
    const s=this.s,rs=s.r,nx=rs.map(o=>o.inf),E=this.eff();
    if(s.mutEnd&&s.m>=s.mutEnd){s.mut=1;s.mutEnd=0;this.log('Мутация сошла на нет')}
    // отложенные последствия
    for(const L of s.later.filter(x=>x.m<=s.m)){this.later(L)}s.later=s.later.filter(x=>x.m>s.m);
    // ресурсы: производство и содержание
    let dM=0,dS=0,dF=0,dP=0,dR=0,nbr=0;
    for(const o of rs){nbr+=o.br;if(o.rev||o.inf>=.98)continue;const f=Math.pow(1-o.inf,1.2)*(.5+o.mood/200)*(o.strike?.5:1)*(o.auto?.7:1),pr=PROD[o.tp];
      dM+=(pr.M||0)*f;dS+=(pr.S||0)*f;dF+=(pr.F||0)*f;dP+=(pr.P||0)*f;dR+=(pr.R||0)*f;if(o.strike>0)o.strike--}
    nbr+=s.fr;const quar=rs.reduce((a,o)=>a+[0,1,2][o.q],0),bord=rs.reduce((a,o)=>a+(o.bc?.4:0),0);
    if(G.bridges>0)dS*=1-Math.min(.25,G.bridges*.1);
    s.M+=dM-quar-bord;s.S+=dS-.55*nbr;s.F+=dF-.25*nbr;s.P=Math.min(6,s.P+dP);s.res=Math.min(100,s.res+dR);
    s.starve=false;
    if(s.S<0){s.S=0;s.starve=true;s.nat=Math.max(0,s.nat-1.5);this.log('Нехватка припасов: бригады голодают');say('Нехватка припасов! Бригады ослаблены.',2.4)}
    if(s.F<0){s.F=0;s.nat=Math.max(0,s.nat-.5)}
    if(s.M<0){s.M=0;s.nat=Math.max(0,s.nat-2);for(const o of rs)o.mood=Math.max(0,o.mood-2);this.log('Казна пуста: недовольство растёт')}
    // заражение: рост, перенос по дорогам, бригады, карантины
    const E2=this.eff();
    rs.forEach((o,i)=>{
      const qg=[1,.65,.45][o.q],g=.19*o.inf*(1-o.inf)*(1-s.res/250)*qg*s.mut*(s.emer?.8:1)*(o.rev?1.3:1);
      let sp=0;for(const j of this.nbs(i)){const n=rs[j],gap=n.inf-o.inf;if(gap>0){const open=(o.bc||n.bc?.25:1)*[1,.8,.6][o.q]*[1,.7,.4][n.q];sp+=.1*gap*open}}
      const cl=.04*o.br*E2*(o.mood>=25?1:.6)*(1-s.res/400);
      nx[i]=clamp(o.inf+g+sp-cl+(o.inf<.02&&sp>0?.004:0),0,1);
      // настроение
      o.mood=clamp(o.mood+(o.inf<.25?.8:o.inf>.5?-2.5:-.8)-[0,2,5][o.q]-(o.bc?1.2:0)+Math.min(3,o.br)*.8-(s.starve&&o.br?3:0)-(s.emer?2:0)+(o.auto?.5:0),0,100);
      if(o.rev>0){o.rev--;if(!o.rev)this.log('Порядок в провинции '+o.nm+' восстановлен')}
      else if(o.mood<8&&Math.random()<.45){o.rev=4;o.br=Math.floor(o.br/2);this.log('Восстание: '+o.nm+' вышла из-под контроля');say('Восстание в провинции «'+o.nm+'»!',2.6);beep(150,.25,.06,'sawtooth')}
    });
    rs.forEach((o,i)=>o.inf=nx[i]);
    // страна
    s.nat=clamp(s.nat+.15-(s.emer?1.2:0)-this.mean()*1.4+(rs[CAP].mood>60?.2:0),0,100);if(s.emer){s.cruel+=.08;G.cruelty=s.cruel}
    if(s.m%4===0&&s.S>6&&s.pool<12){s.pool++;this.log('Новая бригада в резерве')}
    // фронт
    if(s.m===6&&!s.front){s.front=true;this.log('Противник давит на границу: нужен фронт из 3 бригад');say('На границе началась война. Выделите на фронт 3 бригады.',4)}
    if(s.front){if(s.truce>0){s.truce--;s.fp=Math.max(0,s.fp-6)}else{s.fp=clamp(s.fp+10-4*Math.min(3,s.fr)+(s.m===14||s.m===22?22:0),0,100);if(s.fr<3&&s.m%3===0)this.log('Фронт ослаблен: противник наступает')}}
    if(s.m>=9&&!s.head&&s.nat>=45&&s.cruel<3&&!s.evHist.offer){s.evT=Math.min(s.evT,3)}
    if(s.m%12===0)this.log('Год '+(s.m/12)+': средняя заражённость '+Math.round(this.mean()*100)+'%');
    // условия поражения
    if(rs[CAP].inf>=.95){this.finish('capital');return}
    if(s.fp>=100){this.finish('front');return}
    if(s.nat<8||(s.cruel>5&&s.nat<30)){this.finish('fall');return}
    if(this.mean()>.9){this.finish('nuke');return}
    if(s.m>s.dur){this.endTime();return}
    this.ui();
  },
  endTime(){const s=this.s,mean=this.mean();if(s.res>=95)this.finish('protect');else if(mean<.62&&s.nat>25)this.finish('long');else this.finish('fall')},
  // --------------------------------------------------------------- события с выбором
  EV:{
    riot:{ok:s=>s.r.some(o=>o.mood<45&&!o.rev),t:p=>'Бунт: '+p.nm,x:'Люди вышли на улицы: не хватает припасов, страшно. Нужно решение сейчас.',o:[['Подавить силой','поддержка −4, жестоко'],['Уступки','деньги −3, настроение +22'],['Игнорировать','заражение растёт, выпуск ниже']],def:2,pick:s=>s.r.filter(o=>o.mood<45&&!o.rev).sort((a,b)=>a.mood-b.mood)[0]},
    refugees:{ok:s=>s.r.some(o=>o.inf<.35),t:p=>'Беженцы у провинции '+p.nm,x:'Колонна беженцев просит приют'+(G.s3?', среди них — эвакуированные из города.':'.'),o:[['Принять','припасы −2, риск заражения'],['Отказать','настроение −8, поддержка −3'],['Лагерь вне города','деньги −2, безопаснее']],def:1,pick:s=>pick(s.r.filter(o=>o.inf<.35))},
    aid:{ok:s=>s.m>=3,t:()=>'Международный совет',x:'Иностранные державы предлагают помощь. Условия — по-разному.',o:[['Принять всё','+6 припасов, +4 топлива, долг'],['Принять часть','+3 припаса, без условий'],['Отказаться','поддержка +2']],def:2,pick:s=>s.r[CAP]},
    samples:{ok:s=>s.r.some(o=>o.inf>.4)&&s.res<90,t:p=>'Образцы из провинции '+p.nm,x:'Учёные просят образцы из горячей зоны для вакцины.',o:[['Отправить бригаду','риск потери, исследования +9'],['Выделить деньги','деньги −4, исследования +5'],['Отказать','учёные недовольны']],def:2,pick:s=>s.r.filter(o=>o.inf>.4).sort((a,b)=>b.inf-a.inf)[0]},
    leak:{ok:s=>s.m>=4,t:()=>'Утечка в прессе',x:'Газеты пишут о настоящем числе заражённых.',o:[['Опровергнуть','★1, потом скандал'],['Признать','поддержка −3, настроение +4 везде'],['Закрыть СМИ','поддержка −5, жестоко']],def:1,pick:s=>s.r[CAP]},
    desert:{ok:s=>s.r.some(o=>o.br>0),t:p=>'Дезертирство: '+p.nm,x:'Бригада в провинции отказывается воевать: нет припасов и страшно.',o:[['Выплатить премии','деньги −3'],['Наказать','жестоко, настроение −6'],['Игнорировать','бригада потеряна']],def:2,pick:s=>pick(s.r.filter(o=>o.br>0))},
    outbreak:{ok:s=>s.r.some(o=>o.inf<.3&&o.i!==CAP),t:p=>'Новая вспышка: '+p.nm,x:'В провинции начался новый очаг заражения.',o:[['Карантин сразу','деньги −2'],['Прислать бригаду','из резерва'],['Игнорировать','заражение +14%']],def:2,pick:s=>pick(s.r.filter(o=>o.inf<.3&&o.i!==CAP))},
    autonomy:{ok:s=>s.r.some(o=>o.i!==CAP&&o.mood>45&&!o.auto&&o.tr==='auto'),t:p=>'Автономия: '+p.nm,x:'Губернатор требует автономию в обмен на лояльность.',o:[['Дать автономию','выпуск −30%, настроение +25'],['Отказать','настроение −10'],['Сменить губернатора','★2, настроение +10']],def:1,pick:s=>pick(s.r.filter(o=>o.i!==CAP&&o.mood>45&&!o.auto&&o.tr==='auto'))},
    truce:{ok:s=>s.front&&s.fp>25&&!s.truce,t:()=>'Предложение перемирия',x:'Противник предлагает перемирие на полгода — но с уступками.',o:[['Принять','давление −50, ★1, поддержка −2'],['Отказаться','поддержка +1, давление +8']],def:1,pick:s=>s.r[CAP]},
    mutation:{ok:s=>s.m>=10&&!s.evHist.mutation,t:()=>'Обнаружена мутация',x:'Появились быстрые заражённые: болезнь распространяется быстрее.',o:[['Ускорить науку','деньги −5, исследования +8'],['Мобилизация','припасы −4, +1 бригада'],['Ничего не делать','заражение быстрее']],def:2,pick:s=>s.r[CAP]},
    convoy:{ok:s=>s.m>=3,t:()=>'Налёт на колонну',x:'Мародёры напали на колонну с припасами.',o:[['Выслать сопровождение','нужна бригада из резерва'],['Принять потерю','припасы −3'],['Карательный рейд','жестоко, поддержка −2']],def:1,pick:s=>s.r[CAP]},
    offer:{ok:s=>s.m>=8&&!s.head&&s.nat>=45&&s.cruel<3&&!s.evHist.offer,t:()=>'Руководство страной',x:'Правительство предлагает вам возглавить страну: откроются международная помощь и обмен данными.',o:[['Согласиться','★2, откроются помощь и данные'],['Отказаться','остаётесь начальником штаба']],def:1,pick:s=>s.r[CAP]}
  },
  evStart(){
    const s=this.s,keys=Object.keys(this.EV).filter(k=>this.EV[k].ok(s)&&k!==s.lastEv&&!(s.evHist[k]&&s.m-s.evHist[k]<3));
    if(s.m>=9&&!s.head&&this.EV.offer.ok(s))keys.push('offer','offer');
    if(!keys.length)return;
    const k=pick(keys),E=this.EV[k],p=E.pick(s);if(!p)return;
    s.ev={k,i:p.i,t:0,ttl:36};s.lastEv=k;s.evHist[k]=s.m;s.stats.events++;say('Событие: '+E.t(p),2.5);beep(420,.12,.05,'triangle');setTimeout(()=>beep(560,.12,.05,'triangle'),130);vib([30,30,30]);this.evUi()},
  evChoose(c){
    const s=this.s,e=s.ev;if(!e||s.end)return;const p=s.r[e.i],cap=s.r[CAP];let ok=true;
    switch(e.k){
      case'riot':if(c===0){p.mood=Math.min(100,p.mood+8);s.nat=Math.max(0,s.nat-4);s.cruel++;G.cruelty=s.cruel;this.log('Бунт подавлен силой: '+p.nm)}else if(c===1){if(s.M<3){say('Не хватает денег',1.6);return}s.M-=3;p.mood=Math.min(100,p.mood+22);this.log('Уступки бунтовщикам: '+p.nm)}else{p.mood=Math.max(0,p.mood-8);p.inf=clamp(p.inf+.05,0,1);p.strike=3;this.log('Бунт в провинции '+p.nm+' остался без ответа')}break;
      case'refugees':if(c===0){if(s.S<2){say('Не хватает припасов',1.6);return}s.S-=2;p.inf=clamp(p.inf+.05,0,1);p.mood=Math.min(100,p.mood+10);s.nat=Math.min(100,s.nat+2);this.log('Беженцы приняты: '+p.nm)}else if(c===1){p.mood=Math.max(0,p.mood-8);s.nat=Math.max(0,s.nat-3);this.log('Беженцам отказали')}else{if(s.M<2){say('Не хватает денег',1.6);return}s.M-=2;p.inf=clamp(p.inf+.01,0,1);p.mood=Math.min(100,p.mood+4);s.nat=Math.min(100,s.nat+1);this.log('Беженцы размещены вне города')}break;
      case'aid':if(c===0){s.S+=6;s.F+=4;s.P=Math.max(0,s.P-1);s.later.push({m:s.m+6,k:'debt'});this.log('Помощь принята: +6 припасов, +4 топлива. Долг через полгода')}else if(c===1){s.S+=3;this.log('Принята часть помощи: +3 припаса')}else{s.nat=Math.min(100,s.nat+2);this.log('От помощи отказались')}break;
      case'samples':if(c===0){if(s.pool<1){say('Нет бригады в резерве',1.6);return}if(Math.random()<.55){s.res=Math.min(100,s.res+9);this.log('Образцы добыты: исследования +9%')}else{s.pool--;this.log('Бригада с образцами потеряна')}}else if(c===1){if(s.M<4){say('Не хватает денег',1.6);return}s.M-=4;s.res=Math.min(100,s.res+5);this.log('Образцы куплены: исследования +5%')}else{this.log('Учёным отказали')}break;
      case'leak':if(c===0){if(s.P<1){say('Нет политического капитала',1.6);return}s.P--;s.later.push({m:s.m+5,k:'scandal'});this.log('Утечка опровергнута')}else if(c===1){s.nat=Math.max(0,s.nat-3);for(const o of s.r)o.mood=Math.min(100,o.mood+4);this.log('Правда признана: настроение растёт')}else{s.nat=Math.max(0,s.nat-5);s.cruel++;G.cruelty=s.cruel;this.log('СМИ закрыты')}break;
      case'desert':if(c===0){if(s.M<3){say('Не хватает денег',1.6);return}s.M-=3;this.log('Бригаде выплачены премии')}else if(c===1){s.cruel++;G.cruelty=s.cruel;p.mood=Math.max(0,p.mood-6);this.log('Дезертиров наказали')}else{p.br=Math.max(0,p.br-1);this.log('Бригада в провинции '+p.nm+' потеряна')}break;
      case'outbreak':if(c===0){if(s.M<2){say('Не хватает денег',1.6);return}s.M-=2;p.q=2;p.qt=3;p.inf=clamp(p.inf+.04,0,1);this.log('Карантин в провинции '+p.nm)}else if(c===1){if(s.pool<1){say('Нет бригады в резерве',1.6);return}s.pool--;p.br++;p.inf=clamp(p.inf+.06,0,1);this.log('Бригада отправлена в '+p.nm)}else{p.inf=clamp(p.inf+.14,0,1);this.log('Вспышка в '+p.nm+' не остановлена')}break;
      case'autonomy':if(c===0){p.auto=1;p.mood=Math.min(100,p.mood+25);this.log('Автономия предоставлена: '+p.nm)}else if(c===1){p.mood=Math.max(0,p.mood-10);this.log('В автономии отказано: '+p.nm)}else{if(s.P<2){say('Нужно ★2',1.6);return}s.P-=2;p.mood=Math.min(100,p.mood+10);p.tr=pick(['hawk','greedy']);this.log('Губернатор сменён: '+p.nm)}break;
      case'truce':if(c===0){s.fp=Math.max(0,s.fp-50);s.P=Math.max(0,s.P-1);s.nat=Math.max(0,s.nat-2);s.truce=6;this.log('Перемирие принято на полгода')}else{s.nat=Math.min(100,s.nat+1);s.fp=Math.min(100,s.fp+8);this.log('Перемирие отвергнуто')}break;
      case'mutation':if(c===0){if(s.M<5){say('Не хватает денег',1.6);return}s.M-=5;s.res=Math.min(100,s.res+8);s.mut=1.15;s.mutEnd=s.m+8}else if(c===1){if(s.S<4){say('Не хватает припасов',1.6);return}s.S-=4;s.pool++;s.mut=1.25;s.mutEnd=s.m+8}else{s.mut=1.35;s.mutEnd=s.m+8}this.log('Мутация: заражение быстрее до М'+s.mutEnd);break;
      case'convoy':if(c===0){if(s.pool<1){say('Нет бригады в резерве',1.6);return}this.log('Колонна дошла под охраной')}else if(c===1){s.S=Math.max(0,s.S-3);this.log('Колонна потеряна: −3 припаса')}else{s.nat=Math.max(0,s.nat-2);s.cruel++;G.cruelty=s.cruel;this.log('Карательный рейд против мародёров')}break;
      case'offer':if(c===0){s.head=true;s.P=Math.min(6,s.P+2);this.log('Вы возглавили страну')}else this.log('Вы отказались возглавить страну');break;
    }
    s.ev=null;s.evT=rnd(22,34);this.evUi();this.ui();this.hudUpd()},
  later(L){const s=this.s;if(L.k==='debt'){if(s.M>=5){s.M-=5;this.log('Долг перед союзниками выплачен: −5 денег')}else{s.nat=Math.max(0,s.nat-6);this.log('Долг не выплачен: поддержка −6');say('Долг перед союзниками не выплачен!',2.6)}}
    else if(L.k==='scandal'){s.nat=Math.max(0,s.nat-6);this.log('Скандал: опровержение оказалось ложью, поддержка −6');say('Скандал с опровержением!',2.6)}},
  evUi(){
    const b=$('#evbox');if(!b)return;const s=this.s,e=s.ev;
    if(!e||s.end){b.style.display='none';b._raw=null;b.innerHTML='';return}
    const T=this.EV[e.k],p=s.r[e.i],pr=clamp(1-e.t/e.ttl,0,1);b.style.display='block';
    morphSet(b,`<div class="ev" data-key="ev${e.k}${e.i}"><div class="ad">⚠ ${T.t(p)}</div><div class="tt">${T.x}</div>${T.o.map((q,i)=>`<button class="pb" data-a="s4_ev" data-d="${i}" style="margin:.15rem 0!important"><span class="tx">${q[0]}<small>${q[1]}</small></span></button>`).join('')}<div class="tm" style="width:${(pr*100).toFixed(1)}%"></div></div>`)},
  // --------------------------------------------------------------- интерфейс
  hudUpd(){const s=this.s;hud(`<b>04 ${s.head?'ГЛАВА':'ШТАБ'}</b><span class="d">мес. ${s.m}/${s.dur}</span><span class="g">💰${Math.floor(s.M)}</span><span class="a">📦${Math.floor(s.S)}</span><span>⛽${Math.floor(s.F)}</span><span class="g">★${Math.floor(s.P)}</span><span class="r">${Math.round(this.mean()*100)}%</span><span class="a">${Math.round(s.nat)}%</span>`)},
  ui(soft){
    const s=this.s,o=s.r[s.sel],E=this.eff(),pr=PROD[o.tp];
    const sig=JSON.stringify([s.sel,o.br,s.pool,s.fr,s.hold,Math.floor(s.M),Math.floor(s.S),Math.floor(s.F),Math.floor(s.P),o.q,o.bc,s.emer,s.front,s.head,Math.round(o.inf*40),Math.round(o.mood/3),Math.round(s.fp/4),this.raidOk(),s.cd.aid>0,s.cd.data>0,Math.round(s.res/4),s.log.join()]);
    if(soft&&sig===s.sig)return;s.sig=sig;
    let h=`<div class="ph"><b>${o.nm.toUpperCase()}</b><button class="pb ${s.hold?'warn':''}" data-a="s4_hold" style="width:auto;margin:0!important;padding:.3rem .7rem!important"><span class="tx">${s.hold?'▶ Пауза':'❚❚ Пауза'}</span></button></div>`;
    h+=`<div class="m" style="margin:.05rem 0 .15rem;font-size:.95rem">${TPN[o.tp]} · ${o.gv} · ${TRN[o.tr]}${o.rev?' · ВОССТАНИЕ':''}</div>`;
    h+=`<div class="stat3"><div>население<b>${o.pop.toFixed(1)}</b></div><div class="${o.inf>.5?'r':o.inf>.25?'a':'g'}">заражено<b>${Math.round(o.inf*100)}%</b></div><div class="${o.mood<25?'r':o.mood<50?'a':'g'}">настроение<b>${Math.round(o.mood)}</b></div></div>`;
    h+=`<div class="bar">${Cnt.bar('s4.bar.'+o.id,o.inf*100,'r')}</div>`;
    h+=`<div class="r2 r3"><button class="pb" data-a="s4_b+" ${s.pool<1||o.rev?'disabled':''}><span class="tx">+ Бригада ${s.pool}</span></button><button class="pb" data-a="s4_b-" ${o.br<1?'disabled':''} style="flex:0 0 3.2rem"><span class="tx">−${o.br}</span></button><button class="pb ${o.q?'warn':''}" data-a="s4_q"><span class="tx">Карантин ${o.q}</span></button></div>`;
    h+=`<div class="r2 r3"><button class="pb ${o.bc?'warn':''}" data-a="s4_bc"><span class="tx">${o.bc?'Закрыта':'Граница'}</span></button><button class="pb" data-a="s4_sup" ${s.S<3||o.rev?'disabled':''}><span class="tx">Припасы</span></button><button class="pb" data-a="s4_gov" ${s.P<1?'disabled':''}><span class="tx">Договор</span></button></div>`;
    h+=`<div class="r2 r3"><button class="pb" data-a="s4_res" ${s.M<3?'disabled':''}><span class="tx">Наука ${Math.round(s.res)}%</span></button><button class="pb ${s.emer?'warn':''}" data-a="s4_emer"><span class="tx">Закон${s.emer?' ✔':''}</span></button></div>`;
    if(s.front)h+=`<div class="m" style="margin:.15rem 0 .05rem;font-size:.95rem">Фронт: давление ${Math.round(s.fp)}%${s.truce?' · перемирие':''}</div><div class="bar">${Cnt.bar('s4.fp',s.fp,s.fp>70?'r':'a')}</div><div class="r2 r3"><button class="pb ${s.fr<3?'dng':''}" data-a="s4_f+" ${s.pool<1?'disabled':''}><span class="tx">Фронт ${s.fr}/3 +</span></button><button class="pb" data-a="s4_f-" ${s.fr<1?'disabled':''} style="flex:0 0 3.2rem"><span class="tx">−</span></button></div>`;
    if(s.head)h+=`<div class="r2 r3"><button class="pb" data-a="s4_aid" ${s.cd.aid>0?'disabled':''}><span class="tx">Помощь</span></button><button class="pb" data-a="s4_data" ${s.cd.data>0?'disabled':''}><span class="tx">Данные</span></button></div>`;
    if(this.raidOk())h+=`<button class="pb glow" data-a="s4_raid"><span class="tx">Вернуться в «Эпицентр»</span></button>`;
    if(s.res>=95)h+=`<button class="pb glow" data-a="s4_prot"><span class="tx">★ Раздать защиту живым</span></button>`;
    h+=`<div class="log">${s.log.slice(0,2).map((x,i)=>`<div data-key="L${(s.logN||0)-i}">${x}</div>`).join('')}</div>`;panel(h);
  },
  // --------------------------------------------------------------- рисование
  plate(o,i,sel,t){
    const L=o.lift,x=Math.round(o.x),w=38,h=13,y=Math.round(o.y-15-L),x0=x-(w>>1),ic=o.di>.5?'#ffb0a8':o.di>.25?'#ffd067':'#9fe8d6';
    cx.fillStyle=sel?'rgba(12,28,40,.95)':'rgba(6,14,22,.82)';cx.fillRect(x0,y,w,h);cx.strokeStyle=sel?'#fff':o.rev?'#ff5b4d':o.mood<30?'#e5a93b':'#3b8aa4';cx.lineWidth=sel||o.rev?1.4:1;cx.strokeRect(x0+.5,y+.5,w-1,h-1);
    txt(o.ab,x0+2,y+6,'#cfe0ea',5.5,'left');txt(Math.round(o.di*100)+'%',x0+w-2,y+11,ic,6.5,'right');
    if(o.q){cx.fillStyle='#ffd23c';cx.fillRect(x0+2,y+8,3,3)}if(o.bc){cx.fillStyle='#ff8d82';cx.fillRect(x0+6,y+8,3,3)}if(o.br){txt('Б'+o.br,x0+12,y+11,'#9fe8d6',5.5,'left')}
    cx.fillStyle='#0b1720';cx.fillRect(x0+1,y+h-1.6,w-2,1.2);cx.fillStyle=o.di>.5?'#ff5b4d':o.di>.25?'#e5a93b':'#4cc9c0';cx.fillRect(x0+1,y+h-1.6,(w-2)*clamp(o.di,0,1),1.2);
    if(o.i===CAP){const b=Math.sin(this.s.t*4)*.8;cx.fillStyle='#ff5b4d';cx.beginPath();cx.moveTo(x,y-6+b);cx.lineTo(x-3,y-1+b);cx.lineTo(x+3,y-1+b);cx.fill()}
    if(this.s.ev&&this.s.ev.i===o.i){const p=.5+.5*Math.sin(t*6);cx.fillStyle='rgba(255,208,60,'+(.6+.4*p).toFixed(2)+')';cx.fillRect(x0+w-5,y-5,5,5);txt('!',x0+w-2.5,y-1,'#1a1004',6,'center')}
  },
  draw(){
    const s=this.s,M=this.map,now=performance.now(),dt=Math.min(.1,(now-this.lt)/1000);this.lt=now;const tm=now/1000;
    cx.fillStyle='#06121c';cx.fillRect(0,0,W,H);cx.save();cx.translate(OX,0);cx.beginPath();cx.rect(-OX,0,MW,H);cx.clip();Maps.dimg(cx,M.cv,-M.ex,0);
    cx.fillStyle='rgba(200,240,250,.6)';M.sea.forEach((p,i)=>{if(Math.sin(tm*1.4+i*1.7)>.55)cx.fillRect(p[0],p[1],2+(i%3),1)});
    s.r.forEach((o,i)=>{o.lift=tw(o,'lift',i===s.sel?3:0,dt,10);const R=M.regs[i];if(!R||o.lift<.15)return;const L=o.lift;
      cx.globalAlpha=clamp(L/3,0,1)*.95;Maps.dimg(cx,R.pit,R.x0,R.y0);cx.globalAlpha=1;
      cx.globalAlpha=.25;Maps.dimg(cx,R.sl,R.x0+3,R.y0+4);cx.globalAlpha=1;
      for(let k=Math.ceil(L*RS);k>=1;k--)Maps.dimg(cx,R.sl,R.x0,R.y0-(L-k/RS));
      Maps.dimg(cx,R.cv,R.x0,R.y0-L)});
    for(const c of s.clouds){if(!s.hold)c.x+=c.v*dt;if(c.x>W+50)c.x=-50;
      cx.fillStyle='rgba(0,0,0,.14)';for(let k=0;k<5;k++){cx.beginPath();cx.ellipse(c.x+k*9*c.s+6,c.y+Math.sin(k*2)*4+12,12*c.s,6*c.s,0,0,TAU);cx.fill()}
      cx.fillStyle='rgba(235,245,252,.12)';for(let k=0;k<5;k++){cx.beginPath();cx.ellipse(c.x+k*9*c.s,c.y+Math.sin(k*2)*4,12*c.s,7*c.s,0,0,TAU);cx.fill()}}
    // дороги: колонны снабжения (реже, если граница закрыта)
    M.roads.forEach((r,k)=>{const e=RE[k];if(!e)return;const closed=s.r[e[0]].bc||s.r[e[1]].bc;if(closed&&k%2)return;for(let j=0;j<2;j++){const u=((tm*.045+k*.31+j*.5)%1),a=1-u,x=a*a*r.ax+2*a*u*r.cx+u*u*r.bx,y=a*a*r.ay+2*a*u*r.cy+u*u*r.by,dx=2*(a*(r.cx-r.ax)+u*(r.bx-r.cx)),dy=2*(a*(r.cy-r.ay)+u*(r.by-r.cy));
      Art3.car(x,y,dx,dy,{k:'civ',col:j?'#6b7a5a':'#9a8f6a'})}});
    {const c0=s.r[CAP],an=tm*.9;cx.save();cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(90,220,200,.06)';cx.beginPath();cx.moveTo(c0.x,c0.y);cx.arc(c0.x,c0.y,190,an,an+.35);cx.fill();cx.restore()}
    cx.save();cx.translate(-M.ex,0);M.haze.render(cx,s.r.map(o=>o.inf),tm,{a:.62});cx.restore();
    s.r.forEach((o,i)=>{if(o.inf>.45)Post.glow(o.x,o.y,40,'255,60,45',.09*(o.inf-.2)*(1+.25*Math.sin(tm*2+i)))});
    // карантин: жёлтая лента по границе провинции, восстание: красная
    s.r.forEach((o,i)=>{if(!(o.q||o.rev))return;const R=M.regs[i];if(!R)return;cx.fillStyle=o.rev?'rgba(255,70,55,.9)':'rgba(255,210,60,'+(o.q>1?.9:.6)+')';const f=Math.floor(tm*8);for(let k=0;k<R.bd.length;k+=2){if(((k>>1)+f)%6<3)cx.fillRect(R.bd[k],R.bd[k+1]-o.lift,1/RS,1/RS)}});
    // пожары и дым
    s.smk=s.smk||[];
    s.r.forEach((o,i)=>{if(o.inf<.4)return;const n=1+Math.floor((o.inf-.4)*7);for(let k=0;k<n;k++){const an=Maps.hash(i,k,3)*6.283,d=5+Maps.hash(i,k,4)*20,x=o.x+Math.cos(an)*d,y=o.y+Math.sin(an)*d*.75;if(M.regAt(x,y)!==i)continue;
      Art3.flame(x,y,.7+Maps.hash(i,k,5)*.5,tm,i*10+k);if(!s.hold&&Math.random()<dt*.4)s.smk.push({x:x+rnd(-1,1),y:y-5,v:rnd(7,13),l:0,m:rnd(3,5)})}});
    for(const q of s.smk){if(!s.hold){q.y-=q.v*dt;q.x+=Math.sin(q.l*2+q.y*.1)*.15;q.l+=dt}}s.smk=s.smk.filter(q=>q.l<q.m);
    for(const q of s.smk){const a=Math.sin(q.l/q.m*3.14)*.3,r=2.5+q.l*2.4,g=cx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);g.addColorStop(0,'rgba(36,28,30,'+a.toFixed(3)+')');g.addColorStop(1,'rgba(36,28,30,0)');cx.fillStyle=g;cx.fillRect(q.x-r,q.y-r,r*2,r*2)}
    {const R=M.regs[s.sel],L=s.r[s.sel].lift;if(R){const f=Math.floor(tm*28)*RS,u=1/RS;cx.fillStyle='rgba(255,255,255,.9)';for(let k=0;k<R.bd.length;k+=2){const q=k>>1;if(((q+f)&(16*RS-1))<8*RS)cx.fillRect(R.bd[k],R.bd[k+1]-L,u,u)}}}
    // фронт на восточной границе
    if(s.front){const bd=M.borderE,slots=[.22,.5,.78],hot=s.fp>50;s.fxb=s.fxb||[];
      slots.forEach((u,q)=>{const p=bd[Math.floor(bd.length*u)];if(!p)return;const x=p[0]-9,y=p[1];s.ftk[q]=tw(s.ftk,q,q<s.fr?1:0,dt,9);
        if(s.ftk[q]>.02)Art3.tank(Math.round(x)+4,Math.round(y)+4,s.ftk[q],'#e5a93b');
        if(q>=s.fr){cx.save();cx.setLineDash([2,2]);cx.lineDashOffset=-tm*8;cx.strokeStyle='rgba(229,169,59,'+(.5+.4*Math.sin(tm*4+q)).toFixed(2)+')';cx.strokeRect(x-1.5,y-4.5,10,9);cx.restore()}
        cx.save();cx.translate(p[0]+17,0);cx.scale(-1,1);Art3.tank(0,p[1]+4,1,'#8a3a34');cx.restore();
        if(s.ftk[q]>.5)for(let m=0;m<3;m++)Art3.soldier(p[0]-6-m*3.5,p[1]+3+(m%2)*1.5,q*3+m+1,tm,1,hot&&Math.sin(tm*9+m*2+q)>.8)});
      if(hot&&!s.hold&&Math.random()<dt*(.5+s.fp/100)){const p=bd[Math.floor(Math.random()*bd.length)];if(p)s.fxb.push({x:p[0]+rnd(2,14),y:p[1]+rnd(-6,6),t:0,d:1.5,seed:Math.floor(rnd(0,999))})}
      for(const f of s.fxb){if(!s.hold)f.t+=dt;Art3.boom(f.x,f.y,Math.min(.99,f.t/f.d),f.seed,.3)}s.fxb=s.fxb.filter(f=>f.t<f.d);
      const fb=bd[Math.floor(bd.length*.5)];if(fb){otx('ФРОНТ '+s.fr+'/3 · '+Math.round(s.fp)+'%',fb[0]-6,fb[1]-18,s.fp>70?'#ff8d82':s.fr>=3?'#7dffa6':'#ffd067',9,'center')}}
    cx.save();cx.translate(12,138);cx.rotate(-Math.PI/2);otx('СОЮЗНИК',0,0,'#8fc6e0',11,'center',.8);cx.restore();cx.save();cx.translate(322,138);cx.rotate(Math.PI/2);otx('ПРОТИВНИК',0,0,'#e08a80',11,'center',.8);cx.restore();
    // бригады и ярлыки
    const order=s.r.map((o,i)=>i).sort((a,b)=>s.r[a].y-s.r[b].y);
    for(const i of order){const o=s.r[i];o.di=tw(o,'di',o.inf,dt,4);
      while(o.tk.length<o.br)o.tk.push(0);o.tk.length=o.br;
      for(let q=0;q<Math.min(4,o.br);q++){o.tk[q]=tw(o.tk,q,1,dt,8);Art3.tank(o.x-14+q*9,o.y+9-o.lift,o.tk[q],'#2fb0a6')}}
    for(const i of order)this.plate(s.r[i],i,i===s.sel,tm);
    for(const f of s.fx){const u=f.t/f.d;otx(f.s,f.x,f.y-u*14,f.c,11,'center',clamp(1.7-u*1.7,0,1)*clamp(u*9,0,1))}
    cx.restore();
    cx.strokeStyle='#3a8f8a';cx.lineWidth=1;for(const[x,y,dx,dy]of[[2,24,1,1],[MW-3,24,-1,1],[2,H-3,1,-1],[MW-3,H-3,-1,-1]]){cx.beginPath();cx.moveTo(x,y+dy*10);cx.lineTo(x,y);cx.lineTo(x+dx*10,y);cx.stroke()}
    Post.vig(.7);
    if(s.hold)otx('ПАУЗА',MW/2,36,'#ffd067',11,'center');
    {const nx=Math.round(SAFE.l)+16;otx('N',nx,40,'#9fb3c0',10,'center');cx.strokeStyle='#9fb3c0';cx.beginPath();cx.moveTo(nx,44);cx.lineTo(nx,58);cx.stroke();cx.fillStyle='#9fb3c0';cx.beginPath();cx.moveTo(nx,40);cx.lineTo(nx-3,46);cx.lineTo(nx+3,46);cx.fill()}
  }
};
ACT['s4_b+']=()=>Hq.act('br+');ACT['s4_b-']=()=>Hq.act('br-');ACT.s4_q=()=>Hq.act('q');ACT.s4_bc=()=>Hq.act('bc');ACT.s4_sup=()=>Hq.act('sup');ACT.s4_gov=()=>Hq.act('gov');ACT.s4_res=()=>Hq.act('res');ACT.s4_emer=()=>Hq.act('emer');
ACT['s4_f+']=()=>Hq.act('fr+');ACT['s4_f-']=()=>Hq.act('fr-');ACT.s4_aid=()=>Hq.act('aid');ACT.s4_data=()=>Hq.act('data');ACT.s4_raid=()=>Hq.act('raid');ACT.s4_prot=()=>Hq.act('prot');ACT.s4_hold=()=>Hq.act('hold');
ACT.s4_ev=d=>Hq.evChoose(+d);
