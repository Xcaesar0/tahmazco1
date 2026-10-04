(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pad = n => String(n).padStart(2, '0');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 900px)');
const secs = $$('.sec[data-ch]');

/* ---- chapter menu ---- */
const menu = $('#menu'), btn = $('#menuBtn');
$('#menuList').innerHTML = secs.map(s => `<li><a href="#${s.id}">${s.dataset.ch}</a></li>`).join('');
$('#tot').textContent = pad(secs.length);
const toggle = open => { menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : ''; };
btn.onclick = () => toggle(!menu.classList.contains('open'));
menu.addEventListener('click', e => { if (e.target.closest('a')) toggle(false); });
addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

/* ---- reveals ---- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .18 });
$$('.sec, .reveal, .track').forEach(el => io.observe(el));
// cover is visible immediately
requestAnimationFrame(() => $('#cover').classList.add('in'));

/* ---- QR glyph ---- */
(function () {
  const n = 21, cells = []; let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const finder = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let on = rnd() > .52;
    if (finder(x, y)) { const [a, b] = [[0, 0], [n - 7, 0], [0, n - 7]].find(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7); const dx = x - a, dy = y - b; on = dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx > 1 && dx < 5 && dy > 1 && dy < 5); }
    else if ((x >= 7 && x <= 8 && y <= 7) || (y >= 7 && y <= 8 && x <= 7) || (x >= n - 8 && x <= n - 8 && y <= 7) || (y === 7 && x >= n - 8)) on = false;
    if (on) cells.push(`<rect x="${x}" y="${y}" width="1.04" height="1.04"/>`);
  }
  $('#qr').insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 ${n} ${n}" fill="#14110f" shape-rendering="crispEdges">${cells.join('')}</svg>`);
})();

/* ---- scroll engine ---- */
const scrubs = $$('[data-scrub]'), pars = $$('[data-par]'), zooms = $$('[data-zoom]');
const pagesSec = $('#pages'), stacks = { d: $('#stackD'), m: $('#stackM') }, ticksEl = $('#ticks');
const pgT = $('#pgT'), pgS = $('#pgS');
let pgIdx = -1, pgKey = '';
const flows = $$('.flow').map(s => ({ s, st: $('.stage', s), lis: $$('.rail li', s), dots: $$('.dots4 i', s), n: 4, step: -1 }));
const pts = $('#pts');
let ptsAnim;
const countTo = (el, from, to, ms = 900) => { cancelAnimationFrame(ptsAnim); const t0 = performance.now(); const f = t => { const k = clamp((t - t0) / ms); const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); el.textContent = v.toLocaleString('en-US'); if (k < 1) ptsAnim = requestAnimationFrame(f); }; ptsAnim = requestAnimationFrame(f); };

function pageProgress(s) {
  const r = s.getBoundingClientRect(), vh = innerHeight;
  if (s.querySelector(':scope > .pin')) return clamp(-r.top / (r.height - vh));
  return clamp((vh - r.top) / (vh + r.height));
}

function setPages(p) {
  const key = mobile.matches ? 'm' : 'd', stack = stacks[key], imgs = [...stack.children];
  const vp = stack.parentElement;
  if (key !== pgKey) { pgKey = key; pgIdx = -1; ticksEl.innerHTML = imgs.map(() => '<i></i>').join(''); }
  const max = Math.max(0, stack.offsetHeight - vp.clientHeight);
  const q = clamp((p - .04) / .9);
  const y = q * max;
  stack.style.transform = `translate3d(0,${-y}px,0)`;
  const mid = y + vp.clientHeight * .4;
  let idx = 0; imgs.forEach((im, i) => { if (im.offsetTop <= mid) idx = i; });
  [...ticksEl.children].forEach((t, i) => {
    const top = imgs[i].offsetTop, bot = top + imgs[i].offsetHeight;
    t.style.setProperty('--f', clamp((y + vp.clientHeight * .4 - top) / (bot - top)).toFixed(3));
  });
  if (idx !== pgIdx) {
    pgIdx = idx;
    const h = pagesSec.querySelector('.pin-head');
    [pgT, pgS].forEach(e => { e.style.opacity = 0; });
    setTimeout(() => { pgT.textContent = imgs[idx].dataset.t; pgS.textContent = imgs[idx].dataset.s; [pgT, pgS].forEach(e => { e.style.opacity = 1; }); }, 160);
  }
}

function setFlow(f, p) {
  const q = clamp((p - .05) / .88);
  const step = Math.min(f.n - 1, Math.floor(q * f.n));
  if (step === f.step) return;
  const prev = f.step; f.step = step;
  f.st.dataset.step = step;
  f.lis.forEach((li, i) => li.classList.toggle('on', i === step));
  f.dots.forEach((d, i) => d.classList.toggle('on', i === step));
  if (f.s.id === 'redeem') { if (step === 3 && prev !== 3) countTo(pts, 2350, 1850); if (step < 3) pts.textContent = '2,350'; }
}

let ticking = false;
function frame() {
  ticking = false;
  const vh = innerHeight, sy = scrollY, doc = document.documentElement.scrollHeight - vh;
  $('#bar').style.transform = `scaleX(${clamp(sy / doc).toFixed(4)})`;
  // current chapter
  let cur = 0; secs.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * .5) cur = i; });
  $('#cur').textContent = pad(cur + 1); $('#chap').textContent = secs[cur].dataset.ch;
  // scrubs
  scrubs.forEach(s => {
    const r = s.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
    const p = pageProgress(s); s.style.setProperty('--p', p.toFixed(4));
    if (s === pagesSec) setPages(p);
    const f = flows.find(f => f.s === s); if (f) setFlow(f, p);
  });
  if (reduce) return;
  // parallax (gentler on small screens)
  const k = mobile.matches ? .5 : 1;
  pars.forEach(el => {
    const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
    const d = (r.top + r.height / 2 - vh / 2); el.style.translate = `0 ${(-d * parseFloat(el.dataset.par) * k).toFixed(1)}px`;
  });
  zooms.forEach(el => { const r = el.getBoundingClientRect(); if (r.top > vh || r.bottom < 0) return; const t = clamp(1 - r.top / vh); el.style.setProperty('--z', (1 + (mobile.matches ? .06 : .16) * (1 - t)).toFixed(3)); });
}
const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
addEventListener('scroll', req, { passive: true });
addEventListener('resize', () => { pgKey = ''; req(); });
addEventListener('load', req);
frame();
})();
