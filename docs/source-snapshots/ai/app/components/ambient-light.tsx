'use client';
import {useEffect,useRef} from 'react';

export default function AmbientLight(){
 const light=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const preference=window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  let frame=0,x=0,y=0;
  const move=(event:PointerEvent)=>{
   if(!preference.matches)return;
   x=event.clientX;y=event.clientY;
   if(!frame)frame=requestAnimationFrame(()=>{frame=0;const el=light.current;if(el){el.style.setProperty('--light-x',x+'px');el.style.setProperty('--light-y',y+'px');el.style.opacity='1';}});
  };
  const hide=()=>{cancelAnimationFrame(frame);frame=0;if(light.current)light.current.style.opacity='0';};
  window.addEventListener('pointermove',move,{passive:true});document.documentElement.addEventListener('pointerleave',hide);preference.addEventListener('change',hide);
  return()=>{hide();window.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',hide);preference.removeEventListener('change',hide);};
 },[]);
 return <div ref={light} className="ambient-light" aria-hidden="true"/>;
}
