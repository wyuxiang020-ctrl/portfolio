document.querySelectorAll<HTMLElement>('[data-cube-showcase]').forEach(root=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const buttons=[...root.querySelectorAll<HTMLButtonElement>('[data-cube-state]')];
  const toggle=root.querySelector<HTMLButtonElement>('[data-cube-toggle]')!;
  const caption=root.querySelector<HTMLElement>('[data-cube-caption]')!;
  const ids=['idle','search','organize','ready'];
  const labels=['待命 · 合拢陪伴','查找 · 分层寻找','整理 · 展开归位','完成 · 收拢确认'];
  let active=0,paused=false,visible=false,timer:ReturnType<typeof setTimeout>|undefined;
  function sync(){
    clearTimeout(timer);
    const running=visible&&!paused&&!document.hidden&&!motion.matches;
    root.dataset.paused=String(!running);
    toggle.disabled=motion.matches;
    toggle.setAttribute('aria-label',motion.matches?'已跟随系统减弱动效':paused?'播放方块动画':'暂停方块动画');
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.firstElementChild!.textContent=paused||motion.matches?'▷':'Ⅱ';
    if(running)timer=setTimeout(()=>select((active+1)%4),4800);
  }
  function select(index:number){active=index;root.dataset.state=ids[index];caption.textContent=labels[index];buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));sync();}
  buttons.forEach((button,i)=>{button.addEventListener('click',()=>select(i));button.addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?3:(i+(event.key==='ArrowRight'?1:3))%4;select(next);buttons[next].focus();}});});
  toggle.addEventListener('click',()=>{paused=!paused;sync();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.35}).observe(root);
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);sync();
});
