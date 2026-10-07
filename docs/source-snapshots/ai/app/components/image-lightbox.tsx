'use client';
/* oxlint-disable next/no-img-element -- Display original evidence assets. */
import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
type Item={src:string;title:string;caption:string};
export default function ImageLightbox(){
 const [items,setItems]=useState<Item[]>([]),[index,setIndex]=useState(0),[open,setOpen]=useState(false);
 const origin=useRef<HTMLElement|null>(null);
 useEffect(()=>{const click=(e:MouseEvent)=>{const a=(e.target as Element).closest<HTMLAnchorElement>('a[data-lightbox]');if(!a||e.ctrlKey||e.metaKey)return;e.preventDefault();e.stopPropagation();origin.current=a;
 const all=Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]'));const unique=all.filter((a,i)=>all.findIndex(b=>b.href===a.href)===i);
 setItems(unique.map(a=>({src:a.href,title:a.querySelector('img')?.alt||'项目图片',caption:a.closest('figure')?.querySelector('figcaption')?.textContent||''})));setIndex(unique.findIndex(b=>b.href===a.href));setOpen(true);};document.addEventListener('click',click,true);return()=>document.removeEventListener('click',click,true);},[]);
 useEffect(()=>{if(!open)return;let last=0,total=0;const move=(d:number)=>setIndex(i=>Math.max(0,Math.min(items.length-1,i+d)));
 const wheel=(e:WheelEvent)=>{if(e.ctrlKey)return;e.preventDefault();if(Date.now()-last<450)return;total+=e.deltaY;if(Math.abs(total)>60){move(Math.sign(total));total=0;last=Date.now();}};
 const key=(e:KeyboardEvent)=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}};
 window.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',key);return()=>{window.removeEventListener('wheel',wheel);window.removeEventListener('keydown',key);};},[open,items.length]);
 const item=items[index];return <Dialog open={open} onOpenChange={setOpen}><DialogContent fullscreen className="image-lightbox" showCloseButton={false} finalFocus={origin}><header><DialogTitle>{item?.title}</DialogTitle><button onClick={()=>setOpen(false)} aria-label="关闭图片">关闭 ×</button></header><DialogDescription className="lightbox-help">滚轮或左右方向键切换 · 点击图片或按 Esc 返回正文</DialogDescription>{item&&<button className="lightbox-image" onClick={()=>setOpen(false)} aria-label="点击图片返回正文"><img src={item.src} alt={item.title}/></button>}<footer><p>{item?.caption}</p><div className="lightbox-controls"><button disabled={index===0} onClick={()=>setIndex(i=>i-1)}>← 上一张</button><span aria-live="polite">{index+1} / {items.length}</span><button disabled={index===items.length-1} onClick={()=>setIndex(i=>i+1)}>下一张 →</button></div><p className="lightbox-end" aria-live="polite">{index===items.length-1?'已经是最后一张，后面没有其他图片了。':'向下滚动查看下一张图片'}</p></footer></DialogContent></Dialog>;
}

