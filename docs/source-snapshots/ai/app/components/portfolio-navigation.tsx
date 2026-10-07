'use client';
import {useEffect,useState} from 'react';
export default function PortfolioNavigation({items}:{items:string[][]}){
 const [active,setActive]=useState(items[0][0]);
 const ids=items.map(item=>item[0]).join('|');
 useEffect(()=>{
  const sections=ids.split('|').map(id=>document.getElementById(id)).filter((node):node is HTMLElement=>Boolean(node));
  let frame=0;
  const update=()=>{frame=0;let current=sections[0]?.id;for(const section of sections){if(section.getBoundingClientRect().top<=window.innerHeight*.35)current=section.id;}if(current)setActive(current);};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
  update();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);};
 },[ids]);
 return <nav className="index-navigation" aria-label="页面章节">{items.map(([id,label,en])=><a key={id} href={'#'+id} aria-current={active===id?'location':undefined}><span className="nav-rule" aria-hidden="true"/><span>{label}</span><small>{en}</small></a>)}</nav>;
}
