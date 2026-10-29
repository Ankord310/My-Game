'use strict';
// Интерфейс поверх игры: пауза
Snd.duck=function(on){try{if(this.mus&&this.ctx)this.mus.gain.setTargetAtTime(on?.16:.85,this.ctx.currentTime,.08)}catch(e){}};
Object.assign(Pause,{
  confirm:false,
  stage(){return mode===Maze?(Maze.cfg.kind==='raid'?'Особый этап · Возвращение':'Этап 01 · Учёный'):mode===Op?'Этап 02 · Оператор':mode===Mil?'Этап 03 · Военный':mode===Hq?'Этап 04 · Штаб':''},
  can(){
    if(!mode||!(mode===Maze||mode===Op||mode===Mil||mode===Hq))return false;
    if(Tut.on||Slides.open||this.on||Dlg.on||Coach.on)return false;
    if($('#screen').style.display==='block')return false;
    const s=mode.s;if(s&&(s.end||s.done||s.cut))return false;return true},
  open(){
    if(!this.can())return;this.on=true;this.confirm=false;resetInput();joy.on=false;joy.x=joy.y=0;
    this.render();$('#pause').classList.add('on');Snd.duck(true);vib(15)},
  close(quiet){
    if(!this.on)return;this.on=false;this.confirm=false;$('#pause').classList.remove('on');$('#pause').innerHTML='';Snd.duck(false);resetInput();last=performance.now()},
  toggle(){if(this.on)this.close();else this.open()},
  render(){
    const hudTxt=$('#hud').innerText.replace(/\s*\n\s*/g,'  ·  ').replace(/\s{2,}/g,' ').replace(/[♥♡]/g,'').replace(/^\d\d\s+[А-ЯЁ ]+?\s+·\s*/,'').replace(/(\s*·\s*)+/g,' · ').replace(/^\s*·\s*|\s*·\s*$/g,'').slice(0,140);
    $('#pause').innerHTML=`<div class="pbox pxb"><div class="pk">ИГРА ОСТАНОВЛЕНА</div><h2>ПАУЗА</h2><div class="pst">${esc(this.stage())}<br>${esc(hudTxt)}</div>
      <button class="pbtn pri" data-a="p_res">▶ Продолжить</button>
      <button class="pbtn" data-a="p_tips">? Подсказки этапа</button>
      <div class="opt"><span>Звук и музыка</span><button class="pbtn ${Snd.muted?'':'pri'}" data-a="p_snd">${Snd.muted?'ВЫКЛ':'ВКЛ'}</button></div>
      <div class="opt"><span>Вибрация</span><button class="pbtn ${OPT.vib?'pri':''}" data-a="p_vib">${OPT.vib?'ВКЛ':'ВЫКЛ'}</button></div>
      <button class="pbtn ${this.confirm?'red':''}" data-a="p_menu">${this.confirm?'Выйти? Прогресс этапа будет потерян — нажмите ещё раз':'⌂ В главное меню'}</button></div>`}
});
ACT.p_res=()=>Pause.close();
ACT.p_tips=()=>{Pause.close();if(mode&&mode.tut)Tut.show(mode.tut)};
ACT.p_snd=()=>{Snd.setMute(!Snd.muted);Pause.render()};
ACT.p_vib=()=>{OPT.vib=!OPT.vib;saveOpt();if(OPT.vib)vib(30);Pause.render()};
ACT.p_menu=()=>{if(!Pause.confirm){Pause.confirm=true;Pause.render();return}Pause.close();Flow.menu()};
$('#pausebtn').addEventListener('click',()=>Pause.open());
addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(Pause.on||Pause.can()){e.preventDefault();Pause.toggle()}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&Pause.can())Pause.open()});
