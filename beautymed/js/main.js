/* ============================================================
   BeautyMed Tunisia — main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Particles ─────────────────────────────────────────── */
  (function initParticles() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 5 + 2;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        bottom:${Math.random() * -20}%;
        animation-duration:${8 + Math.random() * 12}s;
        animation-delay:${Math.random() * 8}s;
      `;
      hero.appendChild(p);
    }
  })();

  /* ── Header scroll ─────────────────────────────────────── */
  (function initHeader() {
    const hdr = document.getElementById('header');
    if (!hdr) return;
    const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ── Mobile menu ───────────────────────────────────────── */
  (function initMobileMenu() {
    const burger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!burger || !mobileNav) return;
    burger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  })();

  /* ── Scroll reveal (Intersection Observer) ─────────────── */
  (function initReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  })();

  /* ── Animated counters ─────────────────────────────────── */
  (function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();
        function step(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  })();

  /* ── Service tabs ──────────────────────────────────────── */
  (function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.svc-panel');
    if (!tabs.length) return;
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
      });
    });
  })();

  /* ── Testimonials carousel ─────────────────────────────── */
  (function initCarousel() {
    const track   = document.querySelector('.testi-track');
    const btnPrev = document.querySelector('.t-prev');
    const btnNext = document.querySelector('.t-next');
    const dotsWrap = document.querySelector('.t-dots');
    if (!track) return;

    const cards = track.querySelectorAll('.testi-card');
    let current = 0;
    let autoTimer;

    function cardWidth() {
      return cards[0].offsetWidth + 32; // gap 2rem = 32px
    }

    function createDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      cards.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(d);
      });
    }

    function updateDots() {
      if (!dotsWrap) return;
      dotsWrap.querySelectorAll('.dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    function goTo(idx) {
      current = (idx + cards.length) % cards.length;
      track.style.transform = `translateX(-${current * cardWidth()}px)`;
      updateDots();
    }

    function startAuto() {
      autoTimer = setInterval(() => goTo(current + 1), 4500);
    }
    function stopAuto() { clearInterval(autoTimer); }

    createDots();
    if (btnPrev) btnPrev.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    if (btnNext) btnNext.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
    startAuto();

    window.addEventListener('resize', () => goTo(current));
  })();

  /* ── FAQ accordion ─────────────────────────────────────── */
  (function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-q').addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  })();

  /* ── Cookie banner ─────────────────────────────────────── */
  (function initCookie() {
    const banner = document.querySelector('.cookie');
    if (!banner) return;
    if (localStorage.getItem('bm_cookie') === '1') return;
    setTimeout(() => banner.classList.add('show'), 1200);
    banner.querySelector('.ck-accept').addEventListener('click', () => {
      localStorage.setItem('bm_cookie', '1');
      banner.classList.remove('show');
    });
    banner.querySelector('.ck-decline').addEventListener('click', () => {
      banner.classList.remove('show');
    });
  })();

  /* ── Back to top ───────────────────────────────────────── */
  (function initBTT() {
    const btn = document.querySelector('.btt');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();

  /* ── Active nav link on scroll ─────────────────────────── */
  (function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-links a[href^="#"]');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(s => io.observe(s));
  })();

  /* ── Form submit (demo) ────────────────────────────────── */
  (function initForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('.f-submit');
      btn.textContent = 'Message envoyé ✓';
      btn.style.background = 'linear-gradient(135deg,#2ecc71,#27ae60)';
      setTimeout(() => {
        btn.textContent = 'Envoyer ma demande →';
        btn.style.background = '';
      }, 4000);
    });
  })();

});
