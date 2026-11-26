(() => {
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const firefly=document.createElement('div');firefly.className='firefly';firefly.setAttribute('aria-hidden','true');document.body.append(firefly);
 const sparks=new Set();
 let x=-200,y=-200,targetX=-200,targetY=-200,active=false,lastSpark=0,frame=0,previous=0;
 function hide(){active=false;firefly.style.opacity='0';cancelAnimationFrame(frame);frame=0;previous=0;sparks.forEach(s=>s.remove());sparks.clear();}
 function animate(time){
  if(!active){frame=0;return;}
  const dt=previous?Math.min(50,time-previous):16.67;previous=time;
  const ease=1-Math.pow(.84,dt/16.67);x+=(targetX-x)*ease;y+=(targetY-y)*ease;
  firefly.style.transform=`translate3d(${x-50}px,${y-50}px,0)`;
  if(time-lastSpark>85&&sparks.size<16){
   lastSpark=time;
   const spark=document.createElement('span');spark.className='spark';spark.setAttribute('aria-hidden','true');
   spark.style.left=`${x}px`;spark.style.top=`${y}px`;
   spark.style.setProperty('--dx',`${(Math.random()-.5)*35}px`);
   spark.style.setProperty('--dy',`${(Math.random()-.5)*35}px`);
   firefly.parentElement.append(spark);sparks.add(spark);
   spark.addEventListener('animationend',()=>{spark.remove();sparks.delete(spark);},{once:true});
  }
  frame=requestAnimationFrame(animate);
 }
 document.addEventListener('pointermove',event=>{
  if(!fine.matches||reduced.matches||event.pointerType!=='mouse')return hide();
  const host=event.target.closest('dialog[open]')||document.body;
  if(firefly.parentElement!==host){hide();host.append(firefly);}
  targetX=event.clientX;targetY=event.clientY;
  if(!active){x=targetX;y=targetY;active=true;firefly.style.opacity='1';}
  if(!frame)frame=requestAnimationFrame(animate);
 },{passive:true});
 document.documentElement.addEventListener('pointerleave',hide);
 window.addEventListener('blur',hide);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
 document.addEventListener('toggle',event=>{if(event.target instanceof HTMLDialogElement)hide();},true);
 fine.addEventListener('change',hide);reduced.addEventListener('change',hide);
})();
