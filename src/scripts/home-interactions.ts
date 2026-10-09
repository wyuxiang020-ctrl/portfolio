const root = document.documentElement;
if(root.dataset.introTimer){clearTimeout(Number(root.dataset.introTimer));delete root.dataset.introTimer;}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const pointer=matchMedia('(hover: hover) and (pointer: fine)');
const greeting=document.querySelector<HTMLElement>('#greeting');
const regions=[...document.querySelectorAll<HTMLElement>('[data-page-region]')];
let timers:number[]=[];
function finishIntro(){timers.forEach(clearTimeout);timers=[];root.classList.remove('intro-pending');regions.forEach(el=>el.inert=false);try{sessionStorage.setItem('yuxiang-intro-v2-seen','1');}catch{}}
function startIntro(){
  if(!greeting||reduced.matches)return;
  timers.forEach(clearTimeout);timers=[];
  greeting.textContent='Hello';greeting.lang='en';
  regions.forEach(el=>el.inert=true);root.classList.add('intro-pending');
  // Hold the first and last greetings; keep the middle seven brisk.
  [['Hello','en'],['Bonjour','fr'],['Hola','es'],['Ciao','it'],['Hallo','de'],['Olá','pt'],['こんにちは','ja'],['안녕하세요','ko'],['你好','zh-CN']].forEach(([word,lang],i)=>timers.push(window.setTimeout(()=>{greeting.textContent=word;greeting.lang=lang;},i===0?0:460+(i-1)*230)));
  timers.push(window.setTimeout(finishIntro,2700));
}
if(root.classList.contains('intro-pending'))startIntro();
document.addEventListener('keydown',e=>{if(root.classList.contains('intro-pending')&&['Escape','Enter','Tab'].includes(e.key))finishIntro();});
reduced.addEventListener('change',()=>{if(reduced.matches)finishIntro();});
const filters=[...document.querySelectorAll<HTMLButtonElement>('[data-filter]')];
const cards=[...document.querySelectorAll<HTMLElement>('[data-category]')];
filters.forEach(button=>button.addEventListener('click',()=>{const value=button.dataset.filter;filters.forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});cards.forEach(card=>card.hidden=value!=='all'&&card.dataset.category!==value);const status=document.querySelector('#filter-status');if(status)status.textContent=cards.filter(card=>!card.hidden).length+' 个'+(value==='product'?'产品':value==='architecture'?'建筑':'')+'项目';}));
document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(el=>{el.addEventListener('pointermove',e=>{if(!pointer.matches||reduced.matches)return;const b=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-b.left-b.width/2)*.25+'px');el.style.setProperty('--my',(e.clientY-b.top-b.height/2)*.3+'px');});el.addEventListener('pointerleave',()=>{el.style.setProperty('--mx','0px');el.style.setProperty('--my','0px');});});
// A viewport cursor can shrink beyond the image edge without being clipped.
const projectCursor=document.querySelector<HTMLElement>('.project-cursor');
let cursorFrame=0,cursorX=0,cursorY=0,targetX=0,targetY=0;
function drawCursor(){
  if(!projectCursor)return;
  cursorX+=(targetX-cursorX)*.24;cursorY+=(targetY-cursorY)*.24;
  projectCursor.style.transform=`translate3d(${cursorX}px,${cursorY}px,0)`;
  cursorFrame=Math.abs(targetX-cursorX)+Math.abs(targetY-cursorY)>.2?requestAnimationFrame(drawCursor):0;
}
function hideProjectCursor(){projectCursor?.classList.remove('is-active');}
function setCursorMode(){root.classList.toggle('cursor-ready',pointer.matches&&!reduced.matches);hideProjectCursor();}
setCursorMode();pointer.addEventListener('change',setCursorMode);reduced.addEventListener('change',setCursorMode);
document.querySelectorAll<HTMLElement>('[data-project-preview]').forEach(surface=>{
  surface.addEventListener('pointerenter',event=>{
    if(!projectCursor||!pointer.matches||reduced.matches)return;
    cancelAnimationFrame(cursorFrame);cursorFrame=0;
    cursorX=targetX=event.clientX;cursorY=targetY=event.clientY;drawCursor();
    projectCursor.classList.add('is-active');
  });
  surface.addEventListener('pointermove',event=>{
    if(!pointer.matches||reduced.matches)return;
    targetX=event.clientX;targetY=event.clientY;if(!cursorFrame)cursorFrame=requestAnimationFrame(drawCursor);
  });
  surface.addEventListener('pointerleave',hideProjectCursor);
  surface.addEventListener('pointercancel',hideProjectCursor);
  surface.addEventListener('click',hideProjectCursor);
});
window.addEventListener('scroll',hideProjectCursor,{passive:true});
window.addEventListener('blur',hideProjectCursor);
window.addEventListener('pagehide',()=>{hideProjectCursor();cancelAnimationFrame(cursorFrame);cursorFrame=0;});
const menu=document.querySelector<HTMLDialogElement>('#navigation-dialog');
const toggles=[...document.querySelectorAll<HTMLButtonElement>('[data-menu-toggle]')];
toggles.forEach(toggle=>toggle.addEventListener('click',()=>{if(!menu)return;menu.showModal();toggles.forEach(button=>button.setAttribute('aria-expanded','true'));}));
menu?.querySelector('.menu-close')?.addEventListener('click',()=>menu.close());
menu?.addEventListener('close',()=>toggles.forEach(button=>button.setAttribute('aria-expanded','false')));
menu?.addEventListener('click',event=>{if((event.target as Element).closest('a'))menu.close();else if(event.target===menu){const rect=menu.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right)menu.close();}});
const header=document.querySelector('.header');
const floatingMenu=document.querySelector<HTMLButtonElement>('.floating-menu');
if(header&&floatingMenu)new IntersectionObserver(([entry])=>{floatingMenu.hidden=entry.isIntersecting;},{threshold:0}).observe(header);
