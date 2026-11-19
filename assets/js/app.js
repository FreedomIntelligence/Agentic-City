// app.js — language, navigation, reveals, the film player, the approval replay, the chapter browser, the layer stack.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 60) : ms));

/* ───────── language ───────── */
const I18N = $$('[data-zh]'); I18N.forEach(el => { el.dataset.en = el.innerHTML; });
const TITLE = { en: 'Agentic City 2035 · A city plan you can run', zh: 'Agentic City 2035 · 一份能运行的城市方案' };
let lang = 'en'; const onLang = [];
function setLang(l, save = true) {
  lang = l === 'zh' ? 'zh' : 'en';
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
  I18N.forEach(el => { el.innerHTML = lang === 'zh' ? el.dataset.zh : el.dataset.en; });
  document.title = TITLE[lang];
  if (save) try { localStorage.setItem('ac-lang', lang); } catch {}
  onLang.forEach(f => f(lang));
}
{ let saved = null; try { saved = localStorage.getItem('ac-lang'); } catch {}
  const asked = new URLSearchParams(location.search).get('lang');
  lang = (asked || saved || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en')) === 'zh' ? 'zh' : 'en'; }
$('#lang').addEventListener('click', () => setLang(lang === 'zh' ? 'en' : 'zh'));

/* ───────── navigation ───────── */
const nav = $('#nav'), root = document.documentElement;
const onScroll = () => { nav.classList.toggle('solid', scrollY > 24); const h = root.scrollHeight - innerHeight; root.style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(4) : '0'); };
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll, { passive: true }); onScroll();
const links = $$('.links a');
const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
links.forEach(a => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });

/* ───────── reveals, counters, the light that follows the pointer ───────── */
const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });
$$('.reveal').forEach(el => { const sib = [...el.parentElement.children].filter(c => c.classList.contains('reveal')); el.style.setProperty('--d', (Math.min(sib.indexOf(el), 5) * 0.08).toFixed(2) + 's'); seen.observe(el); });
const fmt = (v, dec = 0) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
function countUp(el) {
  const to = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1500;
  if (reduced) { el.textContent = fmt(to, dec); return; }
  const tick = now => { const p = Math.min(1, (now - t0) / dur); el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)), dec); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.card, .idea, .phase'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });

/* ───────── the film ───────── */
const fv = $('#film-video'), player = $('#player'), beats = $$('#beats button');
let voice = null, chosen = false;
const filmSrc = v => `assets/media/a-plan-you-can-run.${v}.mp4`;
function setVoice(v) {
  if (v === voice) return;
  const at = fv.currentTime || 0, was = fv.dataset.loaded && !fv.paused && !fv.ended;
  voice = v; $$('.voices button').forEach(b => b.classList.toggle('on', b.dataset.voice === v));
  fv.poster = `assets/media/film-poster.${v}.jpg`;
  if (fv.dataset.loaded) { fv.src = filmSrc(v); fv.addEventListener('loadedmetadata', () => { fv.currentTime = at; if (was) fv.play().catch(() => {}); }, { once: true }); fv.load(); }
}
function playFilm(at) {
  if (!fv.dataset.loaded) { fv.preload = 'auto'; fv.src = filmSrc(voice); fv.dataset.loaded = '1'; fv.controls = true; }
  if (at != null) { if (fv.readyState >= 1) fv.currentTime = at; else fv.addEventListener('loadedmetadata', () => { fv.currentTime = at; }, { once: true }); }
  fv.play().catch(() => {});                              // play() is what starts the download: the element is preload="none" until asked
}
$('#film-play').addEventListener('click', () => playFilm());
fv.addEventListener('click', () => { if (!fv.dataset.loaded) playFilm(); });      // before the first play the whole picture is the button
$$('.voices button').forEach(b => b.addEventListener('click', () => { chosen = true; setVoice(b.dataset.voice); }));
beats.forEach(b => b.addEventListener('click', () => playFilm(+b.dataset.t)));
fv.addEventListener('play', () => player.classList.add('playing'));
fv.addEventListener('ended', () => player.classList.remove('playing'));
fv.addEventListener('timeupdate', () => { const t = fv.currentTime; let cur = -1; beats.forEach((b, i) => { if (t >= +b.dataset.t - 0.05) cur = i; }); beats.forEach((b, i) => b.classList.toggle('on', i === cur && !fv.paused)); });
onLang.push(l => { if (!chosen && (!fv.dataset.loaded || fv.paused)) setVoice(l); });      // narration follows the page until the visitor picks one
$$('[data-play]').forEach(a => a.addEventListener('click', () => setTimeout(() => playFilm(), reduced ? 50 : 700)));

/* ───────── the approval replay: the demo's guided fire-services scenario, as recorded ───────── */
const HKD = n => 'HK$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STEPS = [
  { label: 'Fire services · Step 1 of 4 · Build three stations',
    user: 'Build three fire stations on road-adjacent buildable land in the southeast of Z6-150, the northern part of Z6-129 and the southwest of Z6-232. Generate suitable building dimensions.',
    map: 'proposed', cost: 270000000, line: '3 stations × HK$ 90,000,000.00', after: 9730000000, built: 'built', rev: 1,
    done: 'Three stations are now placed in Z6-150, Z6-129 and Z6-232. Each has a 24 × 18 m footprint and three floors. The sites pass V6 land-use and collision checks. Construction reserves HK$ 270,000,000.00. Both the 2D records and 3D city use these same buildings.' },
  { label: 'Fire services · Step 2 of 4 · Assess fire response',
    user: 'Assess the mean driving time from the new stations to the selected fire incidents.', map: 'assessed',
    say: 'The selected incident buildings are fixed for this comparison. Mean emergency travel time: 4.92 minutes. The evaluation panel includes every incident and its route.',
    result: ['FIRST FIRE RESPONSE ASSESSMENT', '4.92 min', 'Average driving time · three incident buildings'] },
  { label: 'Fire services · Step 3 of 4 · Build the highlighted access road',
    user: 'Add the proposed access connection to the road network.',
    map: 'road-proposed', cost: 157943.75, line: '145.9 m × 6 m · road construction allowance', after: 9729842056.25, built: 'road-built', rev: 2,
    done: 'The approved 146 m access connection is now built. Both maps show the new road and its endpoint connections. Send the next instruction to see the response-time comparison.' },
  { label: 'Fire services · Step 4 of 4 · Review the improvement',
    user: 'Show the before-and-after response times for these same incident buildings.',
    result: ['MEAN EMERGENCY TRAVEL', '4.92 → 3.44 min', 'Same three incidents · 30% shorter'] },
];
const NOTE = { en: { withdrawn: 'Replay note: the proposal was withdrawn. Nothing was changed or charged. Send the instruction again when you are ready.', again: 'Run the scenario again', done: 'Fire services · Complete' },
               zh: { withdrawn: '回放提示：提案已撤回，没有任何改动，也没有扣款。准备好后可以再次发送指令。', again: '重新回放这个场景', done: 'Fire services · Complete' } };
const rp = { chat: $('#rp-chat'), next: $('#rp-next'), send: $('#rp-send'), step: $('#rp-step'), budget: $('#rp-budget'), bar: $('#rp-bar'), rev: $('#rp-rev'), map: $('#rp-map') };
let step = 0, money = 1e10, busy = false, finished = false;
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function say(cls, html) { const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; rp.chat.appendChild(d); rp.chat.scrollTop = rp.chat.scrollHeight; return d; }
function showMap(state, flash = true) {
  $$('img', rp.map).forEach(i => i.classList.toggle('on', i.dataset.state === state));
  if (flash) { rp.map.classList.add('lit'); setTimeout(() => rp.map.classList.remove('lit'), 900); }
}
function offer() { const s = STEPS[step]; rp.step.textContent = s.label; rp.next.textContent = s.user; rp.next.classList.remove('idle'); rp.send.disabled = false; rp.send.textContent = '↑'; }
function rollBudget(to) {
  const from = money, t0 = performance.now(), dur = reduced ? 1 : 1100; money = to; rp.budget.classList.add('roll');
  const tick = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); rp.budget.textContent = HKD(from + (to - from) * e); if (p < 1) requestAnimationFrame(tick); else { rp.budget.textContent = HKD(to); setTimeout(() => rp.budget.classList.remove('roll'), 500); } };
  requestAnimationFrame(tick); rp.bar.style.width = (to / 1e10 * 100).toFixed(2) + '%';
}
async function thinking() { const d = say('agent', '<span class="typing"><i></i><i></i><i></i></span>'); await sleep(820); d.remove(); }
async function send() {
  if (busy) return; if (finished) { reset(); return; }
  busy = true; const s = STEPS[step]; rp.send.disabled = true; rp.next.textContent = '…'; rp.next.classList.add('idle');
  say('you', `<small>You</small>${esc(s.user)}`);
  await thinking();
  if (s.map) showMap(s.map);
  if (s.cost != null) {                                   // an operation that spends: the agent proposes, prices, and stops
    const prev = step === 0 ? 'district' : 'assessed';
    const card = say('op wait', `<small>Proposed operation · approval required</small><b class="amt">${HKD(s.cost)}</b><p>${esc(s.line)}</p><p class="strong">Budget after approval: ${HKD(s.after)}</p><p>Review the highlighted proposal. Nothing has been changed or charged.</p><div class="acts"><button type="button" class="go">Confirm &amp; execute</button><button type="button" class="no">Revise instruction</button></div>`);
    busy = false;
    $('.go', card).addEventListener('click', async () => {
      if (busy) return; busy = true;
      card.classList.remove('wait'); card.classList.add('done');
      card.innerHTML = `<small>Approved</small><b class="amt">${HKD(s.cost)}</b><p>${esc(s.line)}</p><p class="strong">Budget after approval: ${HKD(s.after)}</p><p>Applied to the city plan.</p>`;
      rollBudget(s.after); await sleep(650);
      showMap(s.built); rp.rev.textContent = 'Saved revision ' + s.rev; rp.rev.classList.add('flash'); setTimeout(() => rp.rev.classList.remove('flash'), 900);
      await sleep(500); say('agent', `<small>Planning agent</small>${esc(s.done)}`);
      busy = false; advance();
    }, { once: true });
    $('.no', card).addEventListener('click', () => { if (busy) return; card.remove(); showMap(prev, false); say('agent', `<small>·</small><i>${NOTE[lang].withdrawn}</i>`); offer(); }, { once: true });
  } else {                                                // a question: it costs nothing, so nothing waits for approval
    if (s.say) { say('agent', `<small>Planning agent</small>${esc(s.say)}`); await sleep(350); }
    say('op', `<small>${s.result[0]}</small><b class="amt">${s.result[1]}</b><p>${s.result[2]}</p>`);
    busy = false; advance();
  }
}
function advance() {
  step++;
  if (step < STEPS.length) { offer(); return; }
  finished = true; rp.step.textContent = NOTE[lang].done; rp.next.textContent = NOTE[lang].again; rp.next.classList.add('idle'); rp.send.disabled = false; rp.send.textContent = '↺';
}
function reset() {
  step = 0; money = 1e10; finished = false; busy = false; rp.chat.innerHTML = ''; rp.budget.textContent = HKD(1e10); rp.bar.style.width = '100%'; rp.rev.textContent = 'Saved revision 0'; showMap('district', false);
  say('agent', '<small>Planning agent</small>Welcome, Chief Planner. Choose the station sites, measure emergency access, then connect the road network. Each instruction is ready below; send it when you are ready.');
  offer();
}
rp.send.addEventListener('click', send);
onLang.push(() => { if (finished) { rp.next.textContent = NOTE[lang].again; } });
reset();

/* ───────── the loop: a light walks the stages, and goes round the inner loop before it moves on ───────── */
{ const nodes = $$('#flow li'), order = [0, 1, 2, 1, 2, 3, 4, 5, 6]; let k = 0, timer = null;
  const tick = () => { nodes.forEach((n, i) => n.classList.toggle('live', i === order[k])); k = (k + 1) % order.length; };
  new IntersectionObserver(es => { if (es[0].isIntersecting && !timer && !reduced) { tick(); timer = setInterval(tick, 950); } else if (!es[0].isIntersecting && timer) { clearInterval(timer); timer = null; } }).observe($('#flow'));
  if (reduced) nodes[1].classList.add('live'); }

/* ───────── chapters ───────── */
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
(async () => {
  const box = $('#chapters'), list = $('#ch-list'), vid = $('#ch-video');
  let data; try { data = await (await fetch('assets/data/chapters.json')).json(); } catch { box.hidden = true; return; }
  const all = data.chapters; let film = 1, cur = all[0];
  const show = (c, play) => {
    cur = c; box.classList.remove('playing'); vid.pause(); vid.removeAttribute('src'); vid.load(); $('#ch-fail').hidden = true;
    $('#ch-id').textContent = c.id; $('#ch-dur').textContent = mmss(c.dur); $('#ch-title').textContent = c[lang]; $('#ch-text').textContent = c.narration; $('#ch-poster').src = `assets/media/chapters/${c.id}.webp`;
    $$('button', list).forEach(b => b.classList.toggle('on', b.dataset.id === c.id));
    if (play) start();
  };
  const start = () => { vid.src = cur.src; box.classList.add('playing'); vid.play().catch(() => {}); };
  const render = () => {
    list.innerHTML = '';
    all.filter(c => c.film === film).forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `<button type="button" data-id="${c.id}"><img src="assets/media/chapters/${c.id}.webp" alt="" loading="lazy" width="104" height="56"><span><small>${c.id}</small><b>${esc(c[lang])}</b></span><time>${mmss(c.dur)}</time></button>`;
      $('button', li).addEventListener('click', () => show(c, true)); list.appendChild(li);
    });
    $$('button', list).forEach(b => b.classList.toggle('on', b.dataset.id === cur.id));
  };
  $$('.ch-tabs button').forEach(b => b.addEventListener('click', () => { film = +b.dataset.film; $$('.ch-tabs button').forEach(x => x.classList.toggle('on', x === b)); render(); show(all.find(c => c.film === film), false); list.scrollTop = 0; }));
  $('#ch-play').addEventListener('click', start);
  vid.addEventListener('error', () => { if (vid.getAttribute('src')) { box.classList.remove('playing'); $('#ch-fail').hidden = false; } });
  vid.addEventListener('ended', () => { const same = all.filter(c => c.film === film), n = same[same.indexOf(cur) + 1]; if (n) show(n, true); else box.classList.remove('playing'); });
  onLang.push(() => { render(); $('#ch-title').textContent = cur[lang]; });
  render(); show(cur, false);
})();

/* ───────── four layers ───────── */
{ const slabs = $$('.slab'), items = $$('#layers li'); let cur = 0, auto = true, timer = null;
  const set = (n, byHand) => { cur = n; slabs.forEach(s => { s.classList.toggle('on', +s.dataset.layer === n); s.classList.toggle('up', +s.dataset.layer < n); }); items.forEach(s => s.classList.toggle('on', +s.dataset.layer === n)); if (byHand) auto = false; };
  [...slabs, ...items].forEach(el => { el.addEventListener('click', () => set(+el.dataset.layer, true)); el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') set(+el.dataset.layer, true); }); });
  new IntersectionObserver(es => { if (es[0].isIntersecting && !timer && !reduced) timer = setInterval(() => { if (auto) set((cur + 1) % 4); }, 3200); else if (!es[0].isIntersecting && timer) { clearInterval(timer); timer = null; } }).observe($('#stack'));
  set(0); }

/* ───────── go ───────── */
setLang(lang, false);
setVoice(lang);
requestAnimationFrame(() => { document.body.classList.add('ready'); setTimeout(() => $$('[data-count]').forEach(countUp), 520); });
{ const canvas = $('#city'), labels = $$('#places span').map(el => ({ el, x: +el.dataset.x, y: +el.dataset.y }));
  const canGL = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };
  const boot = () => !canGL() ? document.body.classList.add('no-gl') : import('./hero.js').then(m => m.initHero(canvas, { reduced, labels })).then(ok => { if (ok) canvas.classList.add('on'); else document.body.classList.add('no-gl'); }).catch(() => document.body.classList.add('no-gl'));
  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 900 }); else setTimeout(boot, 200); }
