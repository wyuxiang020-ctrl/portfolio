'use client';
import {useEffect} from 'react';
export default function ReadingNavigation(){useEffect(()=>{
 const reveal=(hash:string)=>{if(!hash)return;let target:HTMLElement|null=null;try{target=document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return;}if(!target)return;let parent:HTMLElement|null=target;while(parent){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}return target;};
 const onHash=()=>{const target=reveal(location.hash);if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));};
 // Cross-page links use the browser's native navigation, including without JavaScript.
 const onClick=(event:MouseEvent)=>{const link=event.target instanceof Element?event.target.closest('a'):null;if(!link||link.hasAttribute('data-lightbox')||link.download||link.target==='_blank'||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;const url=new URL(link.href,location.href);if(url.origin!==location.origin||url.pathname!==location.pathname)return;if(url.hash)reveal(url.hash);};
 onHash();window.addEventListener('hashchange',onHash);document.addEventListener('click',onClick,true);return()=>{window.removeEventListener('hashchange',onHash);document.removeEventListener('click',onClick,true);};
},[]);return null;}
