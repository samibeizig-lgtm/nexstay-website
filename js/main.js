/* ============================================
   NEXSTAY CONCIERGERIE — MAIN JAVASCRIPT
   ============================================ */

// ── GOOGLE REVIEWS ────────────────────────────
(function () {
  const STAR = '<svg class="star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

  function getPerView() {
    return window.innerWidth > 1024 ? 3 : window.innerWidth > 600 ? 2 : 1;
  }

  let carouselState = null;

  function initCarousel() {
    const outer = document.getElementById('reviews-outer');
    const track = document.getElementById('reviews-track');
    const controlsEl = document.getElementById('carousel-controls');
    const dotsEl = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    if (!track || !outer) return;

    let current = 0;
    let autoTimer = null;

    function cards() { return Array.from(track.children); }

    function totalSlides() {
      return Math.max(1, cards().length - getPerView() + 1);
    }

    function updateControls() {
      const slides = totalSlides();
      if (controlsEl) controlsEl.style.display = slides <= 1 ? 'none' : 'flex';
      if (dotsEl) {
        dotsEl.innerHTML = '';
        for (let i = 0; i < slides; i++) {
          const dot = document.createElement('button');
          dot.className = 'carousel-dot' + (i === current ? ' active' : '');
          dot.setAttribute('aria-label', 'Avis ' + (i + 1));
          dot.addEventListener('click', () => { clearAuto(); go(i); });
          dotsEl.appendChild(dot);
        }
      }
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current >= totalSlides() - 1;
    }

    function go(idx) {
      const slides = totalSlides();
      current = Math.max(0, Math.min(idx, slides - 1));
      const c = cards();
      if (!c.length) return;
      const cardW = c[0].offsetWidth + 24;
      track.style.transform = 'translateX(-' + (current * cardW) + 'px)';
      updateControls();
    }

    function clearAuto() { clearInterval(autoTimer); autoTimer = null; }

    function startAuto() {
      clearAuto();
      autoTimer = setInterval(() => {
        go(current >= totalSlides() - 1 ? 0 : current + 1);
      }, 5000);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { clearAuto(); go(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', () => { clearAuto(); go(current + 1); });

    let touchX = 0;
    outer.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    outer.addEventListener('touchend', e => {
      const diff = touchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { clearAuto(); go(current + (diff > 0 ? 1 : -1)); }
    }, { passive: true });

    window.addEventListener('resize', () => go(current), { passive: true });

    go(0);
    startAuto();
    carouselState = { reset: () => { current = 0; go(0); startAuto(); } };
  }

  function renderGoogleReviews(place) {
    const track = document.getElementById('reviews-track');
    if (!track) return;

    const gRating = document.getElementById('g-rating');
    const gStars = document.getElementById('g-stars');
    const gCount = document.getElementById('g-count');

    if (place.rating) {
      if (gRating) gRating.textContent = place.rating.toFixed(1).replace('.', ',');
      if (gStars) {
        const r = Math.round(place.rating);
        gStars.textContent = '★'.repeat(r) + '☆'.repeat(5 - r);
      }
    }
    if (place.user_ratings_total && gCount) {
      gCount.textContent = place.user_ratings_total + ' avis Google';
    }

    const reviews = (place.reviews || []).filter(r => r.rating >= 4).slice(0, 5);
    if (!reviews.length) return;

    track.innerHTML = '';
    reviews.forEach(r => {
      const initials = r.author_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const text = r.text.length > 320 ? r.text.slice(0, 317) + '…' : r.text;
      const card = document.createElement('div');
      card.className = 'testimonial-card';
      const photoHTML = r.profile_photo_url
        ? '<img src="' + r.profile_photo_url + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent=\'' + initials + '\'">'
        : initials;
      card.innerHTML =
        '<div class="testimonial-stars">' + STAR.repeat(r.rating) + '</div>' +
        '<p class="testimonial-text">“' + text + '”</p>' +
        '<div class="testimonial-author">' +
          '<div class="testimonial-avatar">' + photoHTML + '</div>' +
          '<div>' +
            '<div class="testimonial-name">' + r.author_name + '</div>' +
            '<div class="testimonial-role" style="color:var(--terracotta);">★ Google · ' + r.relative_time_description + '</div>' +
          '</div>' +
        '</div>';
      track.appendChild(card);
    });

    if (carouselState) { carouselState.reset(); } else { initCarousel(); }
  }

  function fetchDetails(placeId) {
    const dummy = document.createElement('div');
    document.body.appendChild(dummy);
    const svc = new google.maps.places.PlacesService(dummy);
    svc.getDetails({
      placeId: placeId,
      fields: ['reviews', 'rating', 'user_ratings_total', 'url']
    }, function (place, status) {
      dummy.remove();
      if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
        console.warn('[Nexstay Reviews] getDetails:', status);
        return;
      }
      // Update "Voir les avis" link with the real Google Maps place URL
      const reviewLink = document.querySelector('.btn-google-link');
      if (reviewLink && place.url) reviewLink.href = place.url;
      renderGoogleReviews(place);
    });
  }

  window.initGoogleReviews = function () {
    const dummy = document.createElement('div');
    document.body.appendChild(dummy);
    const svc = new google.maps.places.PlacesService(dummy);

    // Primary: look up by phone number (most precise for a known business)
    svc.findPlaceFromPhoneNumber({
      phoneNumber: '+21627973200',
      fields: ['place_id']
    }, function (results, status) {
      dummy.remove();
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length) {
        fetchDetails(results[0].place_id);
        return;
      }
      console.warn('[Nexstay Reviews] findPlaceFromPhoneNumber:', status, '— falling back to textSearch');

      // Fallback: text search with Tunis location bias
      const dummy2 = document.createElement('div');
      document.body.appendChild(dummy2);
      const svc2 = new google.maps.places.PlacesService(dummy2);
      svc2.textSearch({
        query: 'Nexstay Conciergerie Tunis',
        location: new google.maps.LatLng(36.8, 10.18),
        radius: 50000
      }, function (results2, status2) {
        dummy2.remove();
        if (status2 === google.maps.places.PlacesServiceStatus.OK && results2 && results2.length) {
          fetchDetails(results2[0].place_id);
        } else {
          console.warn('[Nexstay Reviews] textSearch:', status2);
        }
      });
    });
  };

  window._initReviewCarousel = initCarousel;
})();

document.addEventListener('DOMContentLoaded', () => {

  // ── REVIEWS CAROUSEL INIT ─────────────────────
  if (document.getElementById('reviews-track')) {
    if (window._initReviewCarousel) window._initReviewCarousel();
  }

  // ── NAV SCROLL BEHAVIOUR ──────────────────────
  const nav = document.querySelector('.nav');
  if (nav) {
    const updateNav = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  // ── MOBILE NAV ────────────────────────────────
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        toggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── SCROLL REVEAL ─────────────────────────────
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  // ── COUNTER ANIMATION ─────────────────────────
  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'));
          const suffix = el.getAttribute('data-suffix') || '';
          const duration = 1800;
          const start = performance.now();

          const update = (time) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(update);
          };

          requestAnimationFrame(update);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    countEls.forEach(el => counterObserver.observe(el));
  }

  // ── FAQ ACCORDION ─────────────────────────────
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      faqItems.forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
        }
      });
    });
  });

  // ── PLAN TABS ─────────────────────────────────
  document.querySelectorAll('.ptab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.plan-panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      const panel = document.getElementById('pp-' + this.dataset.pt);
      if (panel) panel.classList.add('active');
    });
  });

  // ── SMART CALCULATOR ──────────────────────────
  const BASE = {
    gammarth:    {s1:115, s2:175, s3:240, villa3:520, villa4:780},
    sidibousaid: {s1:120, s2:185, s3:260, villa3:550, villa4:820},
    jardins:     {s1:105, s2:160, s3:220, villa3:460, villa4:700},
    marsa:       {s1:100, s2:150, s3:210, villa3:450, villa4:680},
    lac2:        {s1:95,  s2:145, s3:195, villa3:420, villa4:640},
    lac1:        {s1:90,  s2:135, s3:185, villa3:400, villa4:600},
    ainzagnord:  {s1:85,  s2:130, s3:175, villa3:380, villa4:560},
    ainzag:      {s1:80,  s2:125, s3:165, villa3:360, villa4:530},
    menzah:      {s1:85,  s2:130, s3:175, villa3:380, villa4:560},
    ennasr:      {s1:80,  s2:120, s3:160, villa3:350, villa4:520},
    soukra:      {s1:80,  s2:120, s3:160, villa3:350, villa4:520},
    hammamet:    {s1:115, s2:175, s3:240, villa3:500, villa4:750}
  };
  const NIGHTS = {
    gammarth:20, sidibousaid:20, jardins:20, marsa:20, lac2:20, lac1:20,
    ainzagnord:20, ainzag:20, menzah:20, ennasr:20, soukra:20, hammamet:22
  };
  const POOL = {s1:0, s2:0, s3:0.2, villa3:0.4, villa4:0.4};
  const COMM = {essential:0.15, premium:0.25};

  function getGrpVal(g) {
    const btn = document.querySelector(`[data-grp="${g}"] .csel-btn.active`);
    return btn ? btn.dataset.v : null;
  }

  function smartCalc() {
    const locEl = document.getElementById('sel-loc');
    if (!locEl) return;
    const loc = locEl.value;
    const type = getGrpVal('type');
    const pool = getGrpVal('pool') === 'yes';
    const sea = getGrpVal('sea') === 'yes';
    const formula = getGrpVal('formula');
    const resultEl = document.getElementById('calcResult');
    if (!loc || !BASE[loc] || !type || !formula) {
      if (resultEl) resultEl.style.display = 'none';
      return;
    }
    let price = BASE[loc][type];
    if (pool) price = Math.round(price * (1 + (POOL[type] || 0)));
    if (sea) price = Math.round(price * 1.3);
    const nights = NIGHTS[loc] || 20;
    const gross = price * nights;
    const net = Math.round(gross * (1 - COMM[formula]));
    const el = (id) => document.getElementById(id);
    if (el('r_price')) el('r_price').textContent = price.toLocaleString('fr-TN') + ' DT';
    if (el('r_nights')) el('r_nights').textContent = nights + ' nuits';
    if (el('r_gross')) el('r_gross').textContent = gross.toLocaleString('fr-TN') + ' DT';
    if (el('r_net')) el('r_net').textContent = net.toLocaleString('fr-TN') + ' DT';
    if (el('r_note')) el('r_note').textContent = `Après commission ${COMM[formula]*100}% TTC · Formule ${formula === 'essential' ? 'Essential' : 'Premium'} · Estimation indicative`;
    if (resultEl) resultEl.style.display = 'block';
  }

  const selLoc = document.getElementById('sel-loc');
  if (selLoc) {
    selLoc.addEventListener('change', smartCalc);
    document.querySelectorAll('.csel-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const grp = this.closest('[data-grp]');
        if (!grp) return;
        grp.querySelectorAll('.csel-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        smartCalc();
      });
    });
    smartCalc();
  }

  // ── PROPERTY FILTER ───────────────────────────
  const filterBtns = document.querySelectorAll('.filter-btn');
  const propCards = document.querySelectorAll('.prop-card[data-city]');

  if (filterBtns.length && propCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const city = btn.getAttribute('data-filter');
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        propCards.forEach(card => {
          if (city === 'all' || card.getAttribute('data-city') === city) {
            card.style.display = '';
            setTimeout(() => { card.style.opacity = 1; card.style.transform = ''; }, 10);
          } else {
            card.style.opacity = 0;
            card.style.transform = 'scale(0.95)';
            setTimeout(() => { card.style.display = 'none'; }, 300);
          }
        });
      });
    });
  }

  // ── CONTACT FORM ──────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = '<span>Envoi en cours…</span>';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = '<span>Message envoyé ✓</span>';
        contactForm.reset();
        showToast('Votre message a bien été envoyé. Nous vous répondrons dans les 24h.');
        setTimeout(() => {
          btn.innerHTML = original;
          btn.disabled = false;
        }, 3000);
      }, 1500);
    });
  }

  // ── TOAST UTILITY ─────────────────────────────
  window.showToast = (message) => {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  };

  // ── CUSTOM CURSOR (desktop only) ──────────────
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    let cx = 0, cy = 0;
    let tx = 0, ty = 0;

    document.addEventListener('mousemove', e => {
      tx = e.clientX;
      ty = e.clientY;
    });

    const animateCursor = () => {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    document.querySelectorAll('a, button, .service-card, .prop-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('cursor-large'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-large'));
    });
  }

  // ── PARALLAX HERO ─────────────────────────────
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const offset = window.scrollY * 0.4;
      heroBg.style.transform = `translateY(${offset}px)`;
    }, { passive: true });
  }

  // ── ACTIVE NAV LINK ───────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

});
