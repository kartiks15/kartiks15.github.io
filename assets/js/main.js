/* Kartik Soni — portfolio scripts. No dependencies. */
(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => motionQuery.matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };

  /* ------------------------------------------------------------------
     Theme (day / night)
     ------------------------------------------------------------------ */
  const themeBtn = $('.js-theme');
  const metaTheme = $('meta[name="theme-color"]');

  function applyTheme(t) {
    doc.dataset.theme = t;
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to day mode' : 'Switch to night mode');
    if (metaTheme) metaTheme.content = t === 'dark' ? '#0c121c' : '#eef3f7';
  }
  applyTheme(doc.dataset.theme === 'dark' ? 'dark' : 'light');

  themeBtn && themeBtn.addEventListener('click', () => {
    const next = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('ks-theme', next);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!store.get('ks-theme')) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ------------------------------------------------------------------
     Toasts (in-game notifications)
     ------------------------------------------------------------------ */
  const toastBox = $('#toasts');
  const TOAST_ICONS = { msg: '#i-msg', rank: '#i-star', check: '#i-check' };

  function toast({ title, body, icon = 'msg', tone = 'green', href, ms = 4200 }) {
    if (!toastBox) return;
    const el = document.createElement(href ? 'a' : 'div');
    el.className = 'toast';
    if (href) el.href = href;
    el.innerHTML =
      `<span class="app-ico app-ico--${tone}" aria-hidden="true"><svg class="ico"><use href="${TOAST_ICONS[icon]}"/></svg></span>` +
      '<span class="toast__text"><span class="toast__title"></span><span class="toast__body"></span></span>';
    el.querySelector('.toast__title').textContent = title;
    el.querySelector('.toast__body').textContent = body;
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.firstElementChild.remove();

    const leave = () => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), calm() ? 0 : 300);
    };
    const timer = setTimeout(leave, ms);
    el.addEventListener('click', () => { clearTimeout(timer); leave(); });
  }

  /* ------------------------------------------------------------------
     Clocks
     ------------------------------------------------------------------ */
  const fmtHud = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  const fmtDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  let fmtIST = null;
  try { fmtIST = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }); } catch (e) { /* old engine */ }

  function tick() {
    const now = new Date();
    const hm = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
    $$('.js-clock').forEach((el) => { el.textContent = fmtHud.format(now); });
    $$('.js-phone-time, .js-home-time').forEach((el) => { el.textContent = hm; });
    $$('.js-home-date').forEach((el) => { el.textContent = fmtDate.format(now); });
    if (fmtIST) $$('.js-ist').forEach((el) => { el.textContent = fmtIST.format(now); });
  }
  tick();
  setInterval(tick, 15000);

  /* ------------------------------------------------------------------
     Low-poly hero scene
     ------------------------------------------------------------------ */
  const layers = [];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildScene(svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const rand = mulberry32(20261014);
    const W = 1600;
    const f1 = (n) => (Math.round(n * 10) / 10).toString();

    const mk = (tag, attrs, parent) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    };
    const layer = (name, depth) => {
      const g = mk('g', { class: `layer layer--${name}` }, svg);
      if (depth) layers.push({ el: g, depth });
      return g;
    };
    const tri = (g, a, b, c, shade) =>
      mk('polygon', { points: [a, b, c].map((p) => `${f1(p[0])},${f1(p[1])}`).join(' '), style: `fill:var(${shade})` }, g);

    const defs = mk('defs', {}, svg);
    defs.innerHTML =
      '<radialGradient id="sunGlow"><stop offset="0" style="stop-color:var(--sun-1);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--sun-1);stop-opacity:0"/></radialGradient>' +
      '<linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lamp);stop-opacity:.85"/><stop offset="1" style="stop-color:var(--lamp);stop-opacity:0"/></linearGradient>';

    // Terrain ridge: a row of points across the width.
    function ridge(y0, amp, stepMin, stepMax, peaky) {
      const out = [];
      let x = -60;
      let i = 0;
      while (x < W + 60) {
        const lift = peaky
          ? (i % 2 ? amp * (0.12 + rand() * 0.28) : amp * (0.6 + rand() * 0.4))
          : amp * (0.5 + 0.5 * Math.sin(x / 230 + 1.3)) * (0.55 + rand() * 0.45);
        out.push([x, y0 - lift]);
        x += stepMin + rand() * (stepMax - stepMin);
        i++;
      }
      out.push([W + 60, y0 - amp * 0.3]);
      return out;
    }

    // Fill the area under a ridge with flat-shaded triangles. Faces that
    // slope down to the right face the sun and get the lighter shades.
    function facets(g, top, bottomY, shades) {
      const mid = top.map(([x, y]) => [x + (rand() - 0.5) * 26, y + (bottomY - y) * (0.38 + rand() * 0.14)]);
      const bot = top.map(([x]) => [x + (rand() - 0.5) * 36, bottomY]);
      const rows = [top, mid, bot];
      const last = shades.length - 1;
      for (let r = 0; r < rows.length - 1; r++) {
        const A = rows[r];
        const B = rows[r + 1];
        for (let i = 0; i < A.length - 1; i++) {
          const slope = (A[i + 1][1] - A[i][1]) / (A[i + 1][0] - A[i][0]);
          let s = (slope > 0 ? 0 : 2) + r + (rand() < 0.3 ? 1 : 0);
          s = Math.min(last, s);
          tri(g, A[i], A[i + 1], B[i], shades[s]);
          tri(g, A[i + 1], B[i + 1], B[i], shades[Math.min(last, Math.max(0, s + (rand() < 0.5 ? 1 : 0)))]);
        }
      }
    }

    const yAt = (line, x) => {
      for (let i = 0; i < line.length - 1; i++) {
        const [x1, y1] = line[i];
        const [x2, y2] = line[i + 1];
        if (x >= x1 && x <= x2) return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
      }
      return line[line.length - 1][1];
    };

    // Stars (night only, opacity via --stars)
    const starG = layer('stars', 0.5);
    for (let i = 0; i < 90; i++) {
      mk('circle', {
        cx: f1(rand() * W),
        cy: f1(rand() * 440),
        r: f1(0.6 + rand() * 1.3),
        class: rand() < 0.3 ? 'star twinkle' : 'star',
        style: `animation-delay:${(rand() * 4).toFixed(2)}s`,
      }, starG);
    }

    // Sun / moon: a faceted 12-gon
    const sunG = layer('sun', 0.42);
    const cx = 1320;
    const cy = 250;
    mk('circle', { cx, cy, r: 200, fill: 'url(#sunGlow)' }, sunG);
    const n = 12;
    const ring = Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2 + 0.2;
      const rr = 64 * (0.94 + rand() * 0.08);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    });
    ring.forEach((p, k) => {
      const midA = ((k + 0.5) / n) * Math.PI * 2 + 0.2;
      tri(sunG, [cx, cy], p, ring[(k + 1) % n], Math.sin(midA) < 0.15 ? '--sun-1' : '--sun-2');
    });

    // Clouds
    const cloudG = layer('clouds', 0.38);
    const shape = [[-64, 0], [-56, -16], [-40, -22], [-30, -38], [-8, -46], [12, -40], [24, -28], [40, -32], [56, -18], [66, 0]];
    [[250, 170, 1.25], [760, 110, 0.9], [1500, 185, 1.05], [1030, 300, 0.6]].forEach(([x, y, s], ci) => {
      const g = mk('g', { class: 'cloud', style: `animation-delay:${-ci * 9}s` }, cloudG);
      const P = shape.map(([px, py]) => [x + px * s, y + py * s]);
      const c = [x, y + 2 * s];
      for (let k = 0; k < P.length - 1; k++) tri(g, c, P[k], P[k + 1], k % 2 ? '--cloud-2' : '--cloud-1');
    });

    // Far mountains
    const mtnG = layer('mountains', 0.3);
    facets(mtnG, ridge(560, 230, 110, 170, true), 770, ['--mtn-1', '--mtn-2', '--mtn-3', '--mtn-4']);

    // City skyline on the right
    const cityG = layer('city', 0.18);
    let bx = 600;
    while (bx < W + 20) {
      const w = 48 + rand() * 62;
      const center = 1 - Math.min(1, Math.abs(bx - 1150) / 600);
      const h = 110 + rand() * 120 + center * 110;
      const top = 700 - h;
      const shade = `--bld-${1 + Math.floor(rand() * 3)}`;
      mk('rect', { x: f1(bx), y: f1(top), width: f1(w), height: f1(h), style: `fill:var(${shade})` }, cityG);
      mk('rect', { x: f1(bx - 2), y: f1(top - 6), width: f1(w + 4), height: 6, style: 'fill:var(--bld-roof)' }, cityG);
      if (rand() < 0.35) {
        mk('rect', { x: f1(bx + w * 0.2), y: f1(top - 20), width: f1(w * 0.3), height: 14, style: 'fill:var(--bld-roof)' }, cityG);
      } else if (rand() < 0.4) {
        mk('rect', { x: f1(bx + w * 0.7), y: f1(top - 34), width: 2.5, height: 28, style: 'fill:var(--bld-roof)' }, cityG);
      }
      const cols = Math.max(1, Math.floor((w - 14) / 15));
      const rows = Math.max(0, Math.floor((h - 70) / 20));
      const offX = bx + (w - (cols * 15 - 6)) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const on = rand() < 0.4;
          mk('rect', {
            x: f1(offX + c * 15), y: f1(top + 14 + r * 20), width: 9, height: 11, rx: 1,
            style: `fill:var(${on ? '--win-on' : '--win-off'})`,
          }, cityG);
        }
      }
      bx += w + (rand() < 0.3 ? 8 + rand() * 14 : 0);
    }

    // Rolling hills with low-poly trees
    const hillG = layer('hills', 0.1);
    const hillTop = ridge(690, 60, 90, 140, false);
    facets(hillG, hillTop, 800, ['--hill-1', '--hill-2', '--hill-3', '--hill-4']);
    const tree = (x, y, s) => {
      mk('rect', { x: f1(x - 3 * s), y: f1(y - 14 * s), width: f1(6 * s), height: f1(16 * s), style: 'fill:var(--trunk)' }, hillG);
      [[10, 19, 40], [30, 13, 32]].forEach(([dy, hw, ht]) => {
        const base = y - dy * s;
        const apex = [x, base - ht * s];
        tri(hillG, apex, [x - hw * s, base], [x, base], '--tree-2');
        tri(hillG, apex, [x, base], [x + hw * s, base], '--tree-1');
      });
    };
    [70, 140, 420, 505, 880, 955, 1015, 1530, 1580].forEach((tx) => tree(tx, yAt(hillTop, tx) + 12, 0.8 + rand() * 0.5));

    // Road, street lamp and the RV
    const roadG = layer('road', 0);
    mk('rect', { x: 0, y: 762, width: W, height: 6, style: 'fill:var(--curb)' }, roadG);
    mk('rect', { x: 0, y: 768, width: W, height: 58, style: 'fill:var(--road)' }, roadG);
    for (let x = 20; x < W; x += 96) mk('rect', { x, y: 795, width: 46, height: 4, rx: 2, style: 'fill:var(--road-line)' }, roadG);

    const lamp = mk('g', { class: 'lamp' }, roadG);
    mk('polygon', { points: '1169,644 1092,822 1248,822', fill: 'url(#lampCone)', class: 'lamp__cone' }, lamp);
    mk('rect', { x: 1146, y: 640, width: 6, height: 128, style: 'fill:var(--pole)' }, lamp);
    mk('path', { d: 'M1149 646 q0 -12 12 -12 h8', fill: 'none', 'stroke-width': 5, style: 'stroke:var(--pole)' }, lamp);
    mk('rect', { x: 1160, y: 630, width: 20, height: 9, rx: 2, style: 'fill:var(--pole)' }, lamp);
    mk('rect', { x: 1162, y: 639, width: 16, height: 4, rx: 1.5, style: 'fill:var(--lamp)' }, lamp);

    const rv = mk('g', { class: 'rv' }, roadG);
    mk('ellipse', { cx: 1338, cy: 807, rx: 122, ry: 7, fill: 'rgba(0,0,0,.28)' }, rv);
    mk('rect', { x: 1228, y: 708, width: 178, height: 84, rx: 9, style: 'fill:var(--rv-body)' }, rv);
    mk('path', { d: 'M1380 700 h38 q8 0 10 8 l4 16 h-52 z', style: 'fill:var(--rv-body)' }, rv);
    mk('path', { d: 'M1400 726 h30 q6 0 9 6 l12 30 q2 6 2 12 v12 q0 6 -6 6 h-47 z', style: 'fill:var(--rv-body)' }, rv);
    mk('path', { d: 'M1412 734 h18 q4 0 6 4 l9 22 h-33 z', style: 'fill:var(--rv-glass)' }, rv);
    mk('rect', { x: 1228, y: 760, width: 225, height: 7, style: 'fill:var(--rv-trim)' }, rv);
    mk('rect', { x: 1228, y: 770, width: 225, height: 3, opacity: 0.6, style: 'fill:var(--rv-trim)' }, rv);
    mk('rect', { x: 1244, y: 724, width: 40, height: 22, rx: 3, style: 'fill:var(--rv-glass)' }, rv);
    mk('rect', { x: 1296, y: 724, width: 30, height: 22, rx: 3, style: 'fill:var(--rv-glass)' }, rv);
    mk('rect', { x: 1340, y: 726, width: 26, height: 60, rx: 3, fill: 'none', 'stroke-width': 2, style: 'stroke:var(--rv-line)' }, rv);
    mk('circle', { cx: 1360, cy: 758, r: 2, style: 'fill:var(--rv-line)' }, rv);
    [[1270, 792], [1418, 792]].forEach(([x, y]) => {
      mk('circle', { cx: x, cy: y, r: 15, fill: '#16181d' }, rv);
      mk('circle', { cx: x, cy: y, r: 6, fill: '#9aa3ae' }, rv);
    });

    // Foreground grass
    const fgG = layer('ground', 0);
    facets(fgG, ridge(842, 22, 80, 130, false), 912, ['--gnd-1', '--gnd-2', '--gnd-3', '--gnd-4']);
  }

  const scene = $('.js-scene');
  if (scene) {
    buildScene(scene);
    const fit = () => scene.setAttribute('preserveAspectRatio', innerWidth / innerHeight < 0.9 ? 'xMaxYMax slice' : 'xMidYMax slice');
    fit();
    addEventListener('resize', fit, { passive: true });
  }

  /* ------------------------------------------------------------------
     HUD: rank + XP from scroll progress, parallax
     ------------------------------------------------------------------ */
  // Rank ladder from the game. Edit freely.
  const RANKS = ['Street Rat', 'Hoodlum', 'Peddler', 'Hustler', 'Bagman', 'Enforcer', 'Shot Caller', 'Block Boss', 'Underlord', 'Baron', 'Kingpin'];
  const TIERS = ['I', 'II', 'III', 'IV', 'V'];
  const STEPS = (RANKS.length - 1) * TIERS.length; // last step = Kingpin

  const hud = $('#hud');
  const hero = $('.hero');
  const rankName = $('.js-rank-name');
  const rankTier = $('.js-rank-tier');
  const rankNum = $('.js-rank-num');
  const xpFill = $('.js-xp-fill');
  const xpNum = $('.js-xp');
  let maxRank = -1;
  let rankTimer = 0;

  function updateRank(initial) {
    const max = doc.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 1;
    const step = Math.round(p * STEPS);
    const r = Math.min(RANKS.length - 1, Math.floor(step / TIERS.length));
    const isMax = r === RANKS.length - 1;

    rankName.textContent = RANKS[r];
    rankTier.textContent = isMax ? '★' : TIERS[step % TIERS.length];
    rankNum.textContent = String(r + 1);
    xpFill.style.transform = `scaleX(${p.toFixed(4)})`;
    xpNum.textContent = Math.round(p * 9600).toLocaleString('en-US');

    if (initial) { maxRank = r; return; }
    if (r > maxRank) {
      maxRank = r;
      clearTimeout(rankTimer);
      rankTimer = setTimeout(() => {
        const top = maxRank === RANKS.length - 1;
        toast({
          title: top ? 'Max rank' : 'Rank up',
          body: top ? 'Kingpin. You read the whole thing, thanks!' : `You're now ${RANKS[maxRank]} I`,
          icon: 'rank',
          tone: 'yellow',
          ms: top ? 5200 : 3200,
        });
      }, 450);
    }
  }

  function parallax() {
    if (calm() || !hero) return;
    const y = scrollY;
    if (y > hero.offsetHeight) return;
    for (const l of layers) l.el.style.transform = `translate(0px, ${(y * l.depth).toFixed(1)}px)`;
  }

  let ticking = false;
  function onScroll() {
    updateRank(false);
    hud.classList.toggle('is-scrolled', scrollY > 24);
    parallax();
  }
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onScroll(); });
  }, { passive: true });
  addEventListener('resize', () => updateRank(true), { passive: true });
  updateRank(true);
  hud.classList.toggle('is-scrolled', scrollY > 24);

  // Highlight the HUD nav link for the section in view
  const navLinks = $$('.hud__nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const secIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === `#${en.target.id}`) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((s) => secIO.observe(s));
  }

  /* ------------------------------------------------------------------
     Reveal on scroll + count-ups
     ------------------------------------------------------------------ */
  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const dec = Number(el.dataset.decimals || 0);
    if (calm() || Number.isNaN(end)) return;
    const t0 = performance.now();
    const dur = 1100;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = (end * (1 - Math.pow(1 - k, 3))).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ------------------------------------------------------------------
     Messages: chat with quick replies
     ------------------------------------------------------------------ */
  const CHAT = {
    intro: [
      'hey 👋 it\'s kartik',
      'final-year b.tech in ai &amp; ml at nmims, mumbai',
      'i like the parts of ml that sit close to the hardware. what a model computes, and what it costs in memory, time and energy',
    ],
    replies: [
      {
        id: 'work',
        q: 'what are you working on?',
        a: [
          'my thesis: fp4 vs nf4 quantization on mistral-7b, measuring energy as well as accuracy',
          'early result: 4-bit cuts peak memory from 14.5 gb to ~4.6 gb, but a full mmlu run uses ~5% <i>more</i> energy than fp16',
          'so for my capstone i\'m writing a triton matmul kernel to try to bring gpu power draw down',
        ],
      },
      {
        id: 'best',
        q: 'best thing you\'ve built?',
        a: [
          'probably the pm2.5 forecaster. a convlstm with a physics-based windwarp module that moves pollution along the wind field',
          '89.25% accuracy, 16 hours ahead, and 1st place at anrf aisehack 2026 🏆',
        ],
      },
      {
        id: 'open',
        q: 'are you open to work?',
        a: [
          'yes! i\'m looking for a six-month research internship from dec 2026 to may 2027',
          'one well-scoped efficiency problem, measured carefully enough to write up. that\'s the dream',
        ],
      },
      {
        id: 'reach',
        q: 'how do i reach you?',
        a: [
          'email is quickest: <a href="mailto:hypertex.work@gmail.com">hypertex.work@gmail.com</a>',
          'github and linkedin are in the <a href="#contact">contacts app</a> at the bottom',
        ],
      },
    ],
    done: ['that\'s everything. go check out the <a href="#products">products</a> 👇'],
  };

  const chatEl = $('.js-chat');
  const repliesEl = $('.js-replies');
  if (chatEl && repliesEl) {
    const used = new Set();
    let queue = Promise.resolve();
    let started = false;

    const bubble = (html, who) => {
      const b = document.createElement('div');
      b.className = `msg msg--${who}`;
      b.innerHTML = html;
      chatEl.appendChild(b);
      chatEl.scrollTop = chatEl.scrollHeight;
      return b;
    };

    const setReplies = (on) => $$('.reply', repliesEl).forEach((b) => { b.disabled = !on; });

    async function typeLines(lines) {
      for (const line of lines) {
        if (!calm()) {
          const t = bubble('<span class="typing"><i></i><i></i><i></i></span>', 'them');
          t.setAttribute('aria-hidden', 'true');
          await sleep(Math.min(1500, 420 + line.length * 13));
          t.remove();
        }
        bubble(line, 'them');
        if (!calm()) await sleep(200);
      }
    }

    function say(lines) {
      queue = queue
        .then(() => { setReplies(false); return typeLines(lines); })
        .then(() => setReplies(true));
      return queue;
    }

    function renderReplies() {
      $$('.reply', repliesEl).forEach((b) => b.remove());
      const left = CHAT.replies.filter((r) => !used.has(r.id));
      left.forEach((r) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'reply';
        b.dataset.id = r.id;
        b.textContent = r.q;
        repliesEl.appendChild(b);
      });
      if (!left.length) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'reply';
        b.dataset.id = 'restart';
        b.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-reset"/></svg>start over';
        repliesEl.appendChild(b);
      }
    }

    function start() {
      if (started) return;
      started = true;
      say(CHAT.intro);
    }

    repliesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.reply');
      if (!btn || btn.disabled) return;
      if (btn.dataset.id === 'restart') {
        used.clear();
        $$('.msg', chatEl).forEach((m) => m.remove());
        renderReplies();
        say(CHAT.intro);
        return;
      }
      const r = CHAT.replies.find((x) => x.id === btn.dataset.id);
      if (!r) return;
      used.add(r.id);
      renderReplies();
      const me = bubble('', 'me');
      me.textContent = r.q;
      say(r.a).then(() => {
        if (used.size === CHAT.replies.length) say(CHAT.done);
      });
    });

    // Replace the static (no-JS) intro and replay it when the phone is seen.
    $$('.msg', chatEl).forEach((m) => m.remove());
    renderReplies();
    setReplies(false);
    if ('IntersectionObserver' in window) {
      const pio = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) { start(); pio.disconnect(); }
      }, { threshold: 0.35 });
      pio.observe(chatEl);
    } else {
      start();
    }

    // A text from Kartik shortly after arriving on the title screen
    setTimeout(() => {
      if (scrollY < 200) {
        toast({ title: 'New message · Kartik', body: 'hey, who\'s checking out my portfolio? 👀', icon: 'msg', tone: 'green', href: '#about', ms: 6500 });
      }
    }, 1600);
  }

  /* ------------------------------------------------------------------
     Mixing station: ingredients (skills) → recipes (work that uses them)
     ------------------------------------------------------------------ */
  const mixer = $('.js-mixer');
  const inventory = $('.js-inventory');
  if (mixer && inventory) {
    const KIND_ORDER = { Product: 0, Research: 1, Work: 2, 'Side build': 3 };
    const KIND_CLASS = { Product: 'product', Research: 'research', Work: 'work', 'Side build': 'side' };
    const works = $$('[data-uses]').map((el) => ({
      id: el.id,
      name: el.dataset.name,
      kind: el.dataset.kind,
      uses: new Set(el.dataset.uses.trim().split(/\s+/)),
    }));
    const ings = $$('.ing', inventory);
    const byId = new Map(ings.map((b) => [b.dataset.skill, b]));
    const nameOf = (id) => byId.get(id).querySelector('.ing__name').textContent;
    const slots = $$('.mslot', mixer);
    const out = $('.js-mix-out', mixer);
    const clearBtn = $('.js-mix-clear', mixer);
    let picked = [];

    // Quantity badge = how many things on the page use this ingredient
    ings.forEach((b) => {
      const count = works.filter((w) => w.uses.has(b.dataset.skill)).length;
      const qty = b.querySelector('.ing__qty');
      if (count) qty.textContent = `×${count}`;
      else b.classList.add('is-unused');
      b.title = count ? `Used in ${count} ${count === 1 ? 'thing' : 'things'} on this page` : 'In stock, not used on this page yet';
    });

    const el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    };

    function renderSlots() {
      slots.forEach((s, i) => {
        const id = picked[i];
        s.replaceChildren();
        if (id) {
          const b = byId.get(id);
          s.className = `mslot is-full cat--${b.dataset.cat}`;
          s.disabled = false;
          s.dataset.id = id;
          s.append(el('span', 'ing__tile', b.querySelector('.ing__tile').textContent), el('span', 'mslot__name', nameOf(id)));
          s.setAttribute('aria-label', `Remove ${nameOf(id)} from the mixer`);
        } else {
          s.className = 'mslot';
          s.disabled = true;
          delete s.dataset.id;
          const plus = el('span', 'mslot__empty', '+');
          plus.setAttribute('aria-hidden', 'true');
          s.append(plus);
          s.setAttribute('aria-label', 'Empty slot');
        }
      });
    }

    function renderResult() {
      out.replaceChildren();
      if (!picked.length) {
        out.append(el('p', 'mixer__hint', 'Pick an ingredient from the inventory to start mixing.'));
        return;
      }

      const formula = el('p', 'mix-formula');
      picked.forEach((id, i) => {
        if (i) formula.append(el('span', null, '+'));
        formula.append(el('b', null, nameOf(id)));
      });
      out.append(formula);

      const scored = works
        .map((w) => ({ w, n: picked.filter((id) => w.uses.has(id)).length }))
        .filter((s) => s.n > 0)
        .sort((a, b) => b.n - a.n || KIND_ORDER[a.w.kind] - KIND_ORDER[b.w.kind]);
      const full = scored.filter((s) => s.n === picked.length);

      let list = [];
      if (full.length) {
        out.append(el('p', 'mix-status mix-status--ok', `Recipe found: ${full.length} ${full.length === 1 ? 'match' : 'matches'}`));
        list = full;
      } else if (scored.length) {
        const best = scored[0].n;
        out.append(el('p', 'mix-status', `Nothing uses all ${picked.length} yet. Closest matches use ${best} of ${picked.length}:`));
        list = scored.filter((s) => s.n === best);
      } else {
        out.append(el('p', 'mix-status', picked.length === 1
          ? `${nameOf(picked[0])} is in stock, but nothing on this page uses it yet.`
          : 'Nothing on this page uses these yet.'));
      }

      if (list.length) {
        const ul = el('ul', 'mix-hits');
        list.forEach(({ w }) => {
          const li = el('li');
          const a = el('a', 'mix-hit');
          a.href = `#${w.id}`;
          a.append(el('span', `kind kind--${KIND_CLASS[w.kind] || 'product'}`, w.kind), el('span', null, w.name));
          const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          arrow.setAttribute('class', 'ico ico--sm');
          arrow.setAttribute('aria-hidden', 'true');
          arrow.innerHTML = '<use href="#i-arrow"/>';
          a.append(arrow);
          li.append(a);
          ul.append(li);
        });
        out.append(ul);
      }
    }

    function update() {
      ings.forEach((b) => b.setAttribute('aria-pressed', String(picked.includes(b.dataset.skill))));
      clearBtn.disabled = !picked.length;
      renderSlots();
      renderResult();
      mixer.classList.toggle('has-mix', picked.length > 0);
      mixer.classList.remove('is-mixing');
      if (picked.length && !calm()) {
        void mixer.offsetWidth; // restart the fill animation
        mixer.classList.add('is-mixing');
      }
    }
    mixer.addEventListener('animationend', () => mixer.classList.remove('is-mixing'));

    inventory.addEventListener('click', (e) => {
      const b = e.target.closest('.ing');
      if (!b) return;
      const id = b.dataset.skill;
      const at = picked.indexOf(id);
      if (at >= 0) picked.splice(at, 1);
      else {
        if (picked.length === 3) picked.shift();
        picked.push(id);
      }
      update();
    });
    $('.js-mix-slots', mixer).addEventListener('click', (e) => {
      const s = e.target.closest('.mslot.is-full');
      if (!s) return;
      picked = picked.filter((id) => id !== s.dataset.id);
      update();
    });
    clearBtn.addEventListener('click', () => { picked = []; update(); });
    update();
  }

  // Briefly outline the card a mixer result points to
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.mix-hit');
    if (!a) return;
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    target.classList.remove('is-flash');
    void target.offsetWidth;
    target.classList.add('is-flash');
    setTimeout(() => target.classList.remove('is-flash'), 1800);
  });

  /* ------------------------------------------------------------------
     Chart tooltips (hover + keyboard focus)
     ------------------------------------------------------------------ */
  const tip = $('#tip');
  if (tip) {
    const show = (row) => {
      tip.textContent = row.dataset.tip;
      tip.hidden = false;
      const anchor = row.querySelector('.bar') || row;
      const r = anchor.getBoundingClientRect();
      const w = tip.offsetWidth;
      const x = Math.min(innerWidth - w / 2 - 8, Math.max(w / 2 + 8, r.left + r.width / 2));
      tip.style.left = `${x}px`;
      tip.style.top = `${r.top}px`;
    };
    const hide = () => { tip.hidden = true; };
    $$('[data-tip]').forEach((row) => {
      row.addEventListener('pointerenter', () => show(row));
      row.addEventListener('pointerleave', hide);
      row.addEventListener('focus', () => show(row));
      row.addEventListener('blur', hide);
    });
    addEventListener('scroll', hide, { passive: true });
  }

  /* ------------------------------------------------------------------
     Copy email
     ------------------------------------------------------------------ */
  $$('.js-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
      }
      toast(ok
        ? { title: 'Copied', body: text, icon: 'check', tone: 'green', ms: 2600 }
        : { title: 'Couldn\'t copy', body: text, icon: 'msg', tone: 'red', ms: 4000 });
    });
  });

  /* ------------------------------------------------------------------
     Phone (navigation dialog)
     ------------------------------------------------------------------ */
  const dlg = $('#phone-dialog');
  if (dlg) {
    const open = () => {
      tick();
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    };
    const close = () => {
      if (typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    };
    $$('.js-open-phone').forEach((b) => b.addEventListener('click', open));
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('.js-close-phone') || e.target.closest('.app')) close();
    });
  }
})();
