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

  /* Theme */
  const themeBtn = $('.js-theme');
  const metaTheme = $('meta[name="theme-color"]');

  function applyTheme(t) {
    doc.dataset.theme = t;
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    if (metaTheme) metaTheme.content = t === 'dark' ? '#0f1113' : '#f8f8f5';
  }
  applyTheme(doc.dataset.theme === 'dark' ? 'dark' : 'light');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = doc.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      store.set('ks-theme', next);
    });
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!store.get('ks-theme')) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* Navigation: border on scroll, mobile menu, current section */
  const nav = $('#nav');
  const menuBtn = $('.js-menu');
  const links = $$('.nav__links a');

  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    links.forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
    matchMedia('(min-width: 880px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute('href') === `#${en.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section[id]').forEach((s) => io.observe(s));
  }

  /* Copy email */
  $$('.js-copy').forEach((btn) => {
    const label = btn.querySelector('span');
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
      label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      btn.classList.toggle('is-done', ok);
      setTimeout(() => { label.textContent = 'Copy'; btn.classList.remove('is-done'); }, 2000);
    });
  });

  /* Chart tooltips (hover and keyboard focus) */
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
})();
