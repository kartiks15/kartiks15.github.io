/* Kartik Soni — portfolio scripts. No dependencies. */
(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme: dark by default, light on request */
  const themeBtn = $('.js-theme');
  const metaTheme = $('meta[name="theme-color"]');

  function applyTheme(t) {
    doc.dataset.theme = t;
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (metaTheme) metaTheme.content = t === 'dark' ? '#131312' : '#f7f6f2';
  }
  applyTheme(doc.dataset.theme === 'light' ? 'light' : 'dark');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = doc.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      store.set('ks-theme', next);
    });
  }

  /* Copy email */
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
      btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      btn.classList.toggle('is-done', ok);
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 2000);
    });
  });

  /* Chart tooltips (hover and keyboard focus) */
  const tip = $('#tip');
  if (tip) {
    const show = (row) => {
      tip.textContent = row.dataset.tip;
      tip.hidden = false;
      const anchor = row.querySelector('.grow__bars') || row;
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

  /* Local time in Mumbai */
  const ist = $('.js-ist');
  const istWrap = $('.js-ist-wrap');
  if (ist && istWrap) {
    try {
      const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      const tick = () => { ist.textContent = fmt.format(new Date()); };
      tick();
      istWrap.hidden = false;
      setInterval(tick, 30000);
    } catch (e) { /* time zone data unavailable */ }
  }

  /* Entrance: each part of a section rises in turn, once. Content stays visible without this. */
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const groups = [
    ['.intro', '.intro__top, .intro__pitch, .intro__meta, .intro__status, .buttons li, .stats li'],
    ['.row', ':scope > .row__label, .prose > p, .focus > div, .entry, .more h3, .more li, .plain li, .sub, .skills > div, .contact__lede, .contact__email, .contact__time, .next'],
  ];

  // Parts that come into view together are staggered by their order in this batch.
  const io = new IntersectionObserver((entries) => {
    entries
      .filter((en) => en.isIntersecting)
      .forEach((en, i) => {
        if (!en.target.classList.contains('chart')) en.target.style.setProperty('--i', String(Math.min(i, 6)));
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  groups.forEach(([scope, parts]) => {
    $$(scope).forEach((root) => {
      $$(parts, root).forEach((el) => {
        el.classList.add('reveal');
        io.observe(el);
      });
    });
  });

  const chart = $('.chart');
  if (chart) {
    $$('.grow', chart).forEach((row, i) => {
      $$('.gbar', row).forEach((bar) => bar.style.setProperty('--i', String((i % 5) + 1)));
    });
    chart.classList.add('will-grow');
    io.observe(chart);
  }
})();
