const deck=document.getElementById('deck'),scenes=[...deck.querySelectorAll('.scene')];
const pad=n=>String(n).padStart(2,'0');
document.getElementById('tot').textContent=pad(scenes.length);
const dots=document.getElementById('dots');
scenes.forEach((s,i)=>{const b=document.createElement('button');b.title=s.dataset.title;b.onclick=()=>s.scrollIntoView({behavior:'smooth'});dots.appendChild(b)});
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');const i=scenes.indexOf(e.target);
   document.getElementById('cur').textContent=pad(i+1);
   document.getElementById('bar').style.width=((i+1)/scenes.length*100)+'%';
   [...dots.children].forEach((d,j)=>d.classList.toggle('on',j===i));}
}),{root:deck,threshold:.55});
scenes.forEach(s=>io.observe(s));
// subtle parallax
const px=[...deck.querySelectorAll('[data-speed]')];let tick=false;
function par(){tick=false;const vh=innerHeight;px.forEach(el=>{const s=el.closest('.scene'),r=s.getBoundingClientRect();
 const p=(r.top+r.height/2-vh/2)/vh;el.style.translate=`0 ${(p*+el.dataset.speed).toFixed(1)}px`})}
deck.addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(par)}},{passive:true});par();
// keyboard
addEventListener('keydown',e=>{const i=scenes.findIndex(s=>s.classList.contains('in')&&Math.abs(s.getBoundingClientRect().top)<10);
 const go=n=>scenes[Math.max(0,Math.min(scenes.length-1,n))].scrollIntoView({behavior:'smooth'});
 if(['ArrowDown','PageDown',' ','ArrowLeft'].includes(e.key)){e.preventDefault();go(i+1)}
 if(['ArrowUp','PageUp','ArrowRight'].includes(e.key)){e.preventDefault();go(i-1)}});
