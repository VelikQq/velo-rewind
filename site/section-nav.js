export function initSectionNav(doc=document,win=window){
 const panel=doc.getElementById('block-nav'),toggle=doc.getElementById('nav-toggle'),label=doc.getElementById('nav-current'),nav=doc.getElementById('nav-links');
 const links=[...(nav?.querySelectorAll?.('a[href^="#"]')||[])];if(!panel||!links.length)return {refresh(){}};
 let open=false,pending=false,visible=[],active=null;
 function setOpen(value){open=value;panel.classList.toggle('is-open',value);toggle.setAttribute('aria-expanded',String(value));}
 function activate(item){active=item;for(const entry of links){if(entry===item.link)entry.setAttribute('aria-current','location');else entry.removeAttribute('aria-current');}label.textContent=item.link.textContent.trim();}
 function update(){pending=false;if(!visible.length)return;let current=visible[0],nearest=-Infinity;for(const item of visible){const top=item.target.getBoundingClientRect().top;if(top<=140&&(top>nearest||top===nearest&&item===active)){current=item;nearest=top;}}activate(current);}
 function schedule(){if(pending)return;pending=true;(win.requestAnimationFrame||((fn)=>fn()))(update);}
 function refresh(){visible=[];for(const link of links){const target=doc.getElementById(link.getAttribute('href').slice(1)),hidden=!target||!!target.closest('[hidden]');link.hidden=hidden;if(!hidden)visible.push({link,target});}update();}
 toggle.addEventListener('click',()=>setOpen(!open));
 nav.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');const item=visible.find(x=>x.link===link);if(!item)return;event.preventDefault();if(item.target.tagName==='DETAILS')item.target.open=true;const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;setOpen(false);item.target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});item.target.setAttribute('tabindex','-1');item.target.focus({preventScroll:true});activate(item);});
 doc.addEventListener?.('keydown',event=>{if(event.key==='Escape'&&open){event.preventDefault();setOpen(false);toggle.focus();}});
 doc.addEventListener?.('pointerdown',event=>{if(open&&!panel.contains(event.target))setOpen(false);});
 win.addEventListener?.('scroll',schedule,{passive:true});win.addEventListener?.('resize',schedule,{passive:true});
 setOpen(false);refresh();return {refresh};
}
