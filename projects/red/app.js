/* ГармоньDRIVE landing v6 — classic HTML/CSS/JS + GSAP ScrollTrigger enhancement */
(() => {
  'use strict';
  document.documentElement.classList.add('has-classic-js');

  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Shared menu */
  const burger = qs('.site-burger');
  const mobile = qs('.site-mobile-menu');
  const close = qs('.site-mobile-close');
  const projects = qs('.site-projects');
  const projectTrigger = qs('.site-projects__trigger');

  const setMenu = (open) => {
    if (!mobile || !burger) return;
    mobile.classList.toggle('is-open', open);
    mobile.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setMenu(true));
  close?.addEventListener('click', () => setMenu(false));
  qsa('.site-mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  projectTrigger?.addEventListener('click', (event) => {
    event.preventDefault();
    const open = !projects?.classList.contains('is-open');
    projects?.classList.toggle('is-open', open);
    projectTrigger.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (event) => {
    if (projects && !projects.contains(event.target)) {
      projects.classList.remove('is-open');
      projectTrigger?.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    setMenu(false);
    projects?.classList.remove('is-open');
    projectTrigger?.setAttribute('aria-expanded', 'false');
  });

  /* Same-page smooth links */
  qsa('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const selector = link.getAttribute('href');
    if (!selector || selector === '#') return;
    const target = qs(selector);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'});
  }));

  /* Basic reveal fallback. Content starts visible. */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const reveal = qsa('.black-reveal,[data-reveal]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(getComputedStyle(el).getPropertyValue('--delay'), 10) || 0;
        el.animate(
          [{opacity: 0, transform: 'translateY(34px)'}, {opacity: 1, transform: 'translateY(0)'}],
          {duration: 780, delay, easing: 'cubic-bezier(.2,.75,.2,1)', fill: 'both'}
        );
        observer.unobserve(el);
      });
    }, {threshold: .12, rootMargin: '0px 0px -8% 0px'});
    reveal.forEach(el => observer.observe(el));
  }

  /* Team mobile arrows */
  const teamGrid = qs('.black-team-grid');
  if (teamGrid && !qs('.gd-team-arrows')) {
    const wrap = document.createElement('div');
    wrap.className = 'gd-team-arrows';
    wrap.innerHTML = '<button class="gd-team-arrow" type="button" data-dir="-1" aria-label="Предыдущий участник">‹</button><button class="gd-team-arrow" type="button" data-dir="1" aria-label="Следующий участник">›</button>';
    teamGrid.parentNode.insertBefore(wrap, teamGrid);
    const step = () => {
      const card = qs('.black-team-card', teamGrid);
      return card ? Math.max(card.getBoundingClientRect().width + 12, innerWidth * .72) : innerWidth * .82;
    };
    qsa('.gd-team-arrow', wrap).forEach(button => button.addEventListener('click', () => {
      teamGrid.scrollBy({left: Number(button.dataset.dir) * step(), behavior: 'smooth'});
    }));
  }

  /* Lightweight 3D/parallax for photography. */
  const photoTargets = qsa('main img').filter(img => !img.classList.contains('black-layer-bg'));
  photoTargets.forEach(img => img.classList.add('gd-photo-3d'));

  const tiltContainers = qsa('.black-team-card,.black-h-panel,.black-service-panel,.gd-news-card,.site-secondary-hero__media,.black-page-image,.black-detail-image,.black-member-sticky,.black-about-team-link,.black-photo-gallery figure');
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    tiltContainers.forEach(box => {
      const img = qs('img.gd-photo-3d', box);
      if (!img) return;
      box.addEventListener('pointermove', event => {
        const rect = box.getBoundingClientRect();
        const nx = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1) - .5;
        const ny = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1) - .5;
        img.style.setProperty('--photo-x', `${nx * 10}px`);
        img.style.setProperty('--photo-y', `${ny * 7}px`);
        img.style.setProperty('--photo-rx', `${-ny * 3.2}deg`);
        img.style.setProperty('--photo-ry', `${nx * 4.2}deg`);
      }, {passive:true});
      box.addEventListener('pointerleave', () => {
        img.style.setProperty('--photo-x', '0px');
        img.style.setProperty('--photo-y', '0px');
        img.style.setProperty('--photo-rx', '0deg');
        img.style.setProperty('--photo-ry', '0deg');
      }, {passive:true});
    });
  }



  /* Poster slider: deliberately manual (no autoplay) to avoid layout/scroll jumps. */
  const posterSlider = qs('[data-poster-slider]');
  if (posterSlider) {
    const posterTrack = qs('.gd-poster-slider__track', posterSlider);
    const posterSlides = qsa('.gd-poster-slide', posterSlider);
    const posterDots = qsa('[data-poster-dot]', posterSlider);
    const posterCurrent = qs('[data-poster-current]', posterSlider);
    let posterIndex = 0;

    const showPoster = (nextIndex, focusDot = false) => {
      if (!posterTrack || !posterSlides.length) return;
      posterIndex = (nextIndex + posterSlides.length) % posterSlides.length;
      posterTrack.style.transform = `translate3d(${-posterIndex * 100}%,0,0)`;
      posterSlides.forEach((slide, i) => {
        const active = i === posterIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      posterDots.forEach((dot, i) => {
        const active = i === posterIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', String(active));
        dot.setAttribute('tabindex', active ? '0' : '-1');
      });
      if (posterCurrent) posterCurrent.textContent = String(posterIndex + 1).padStart(2, '0');
      if (focusDot) posterDots[posterIndex]?.focus({preventScroll:true});
    };

    qs('[data-poster-prev]', posterSlider)?.addEventListener('click', () => showPoster(posterIndex - 1));
    qs('[data-poster-next]', posterSlider)?.addEventListener('click', () => showPoster(posterIndex + 1));
    posterDots.forEach((dot, i) => dot.addEventListener('click', () => showPoster(i)));
    posterSlider.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); showPoster(posterIndex - 1, true); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showPoster(posterIndex + 1, true); }
    });
    showPoster(0);
  }


  /* Projects keep the existing lightweight horizontal movement. */
  const horizontalPairs = [
    ['.black-horizontal-section', '.black-horizontal-track', 'rtl']
  ].map(([sectionSel, trackSel, fallbackDirection]) => {
    const section = qs(sectionSel);
    const track = section ? qs(trackSel, section) : null;
    const direction = section?.dataset.horizontalDirection || fallbackDirection;
    return section && track ? {section, track, direction} : null;
  }).filter(Boolean);

  const layoutHorizontal = () => {
    horizontalPairs.forEach(({section, track}) => {
      if (innerWidth <= 700) {
        section.style.height = '';
        track.style.transform = '';
        return;
      }
      const distance = Math.max(0, track.scrollWidth - innerWidth);
      section.style.height = `${innerHeight + distance}px`;
    });
  };

  let raf = 0;
  const updateMotion = () => {
    raf = 0;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    horizontalPairs.forEach(({section, track, direction}) => {
      if (innerWidth <= 700) {
        track.style.transform = '';
        section.style.height = '';
        return;
      }
      const top = section.getBoundingClientRect().top + scrollY;
      const max = Math.max(1, section.offsetHeight - innerHeight);
      const progress = clamp((scrollY - top) / max);
      const distance = Math.max(0, track.scrollWidth - innerWidth);
      const x = direction === 'ltr' ? (-distance + distance * progress) : (-distance * progress);
      track.style.transform = `translate3d(${x}px,0,0)`;
    });

    if (!reduceMotion) {
      photoTargets.forEach(img => {
        if (img.closest('.black-team-card') || img.closest('.black-services-track') || img.closest('.gd-poster-slider')) return;
        const rect = img.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > innerHeight + 80) return;
        const center = rect.top + rect.height / 2;
        const normalized = clamp((center - innerHeight / 2) / Math.max(1, innerHeight), -1, 1);
        img.style.setProperty('--photo-scroll', `${normalized * -14}px`);
      });
    }

    const hero = qs('.black-hero-scene');
    const camera = qs('.black-scene-camera', hero || document);
    if (hero && camera && innerWidth > 700) {
      const rect = hero.getBoundingClientRect();
      const p = clamp(-rect.top / Math.max(1, rect.height));
      camera.style.transform = `scale(${1 + p * .035}) translate3d(0,${p * 18}px,0)`;
    }

    const cd = qs('.black-cd-box');
    if (cd && !window.gsap) {
      const rect = cd.getBoundingClientRect();
      const p = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
      cd.style.transform = `rotateX(${-8 + p * 10}deg) rotateY(${-24 + p * 48}deg)`;
    }
  };

  const requestUpdate = () => {
    if (raf) return;
    raf = requestAnimationFrame(updateMotion);
  };
  window.addEventListener('scroll', requestUpdate, {passive: true});
  window.addEventListener('resize', () => { layoutHorizontal(); requestUpdate(); });
  window.addEventListener('load', () => { layoutHorizontal(); requestUpdate(); });
  layoutHorizontal();
  requestUpdate();

  /* Real GSAP ScrollTrigger for the SECOND horizontal section (Services).
     Sequence remains 01→04 while the track physically travels LEFT→RIGHT. */
  const initGsapMotion = () => {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return false;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-gsap-motion');
    ScrollTrigger.config({ignoreMobileResize: true});

    const services = qs('.black-services-horizontal');
    const servicesSticky = qs('.black-services-sticky', services || document);
    const servicesTrack = qs('.black-services-track', services || document);

    if (services && servicesSticky && servicesTrack && innerWidth > 700) {
      services.classList.add('is-scrolltrigger-ready');
      services.style.height = 'auto';

      const distance = () => Math.max(0, servicesTrack.scrollWidth - innerWidth);

      gsap.fromTo(servicesTrack,
        {x: () => -distance()},
        {
          x: 0,
          ease: 'none',
          scrollTrigger: {
            id: 'gd-services-horizontal',
            trigger: services,
            start: 'top top',
            end: () => `+=${Math.max(innerWidth, distance())}`,
            pin: servicesSticky,
            pinSpacing: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        }
      );

      /* Subtle internal depth while the pinned story is moving. */
      qsa('.black-service-panel figure img', servicesTrack).forEach((img, index) => {
        gsap.fromTo(img,
          {scale: 1.08 + index * .01},
          {scale: 1, ease: 'none', scrollTrigger: {trigger: services, start: 'top top', end: () => `+=${Math.max(innerWidth, distance())}`, scrub: true}}
        );
      });
    }

    /* Layered reveals: stronger motion, but content never depends on JS for visibility. */
    qsa('.landing-about-details__grid article').forEach((card, index) => {
      gsap.from(card, {
        y: 90,
        rotateZ: index === 1 ? 1.5 : (index ? -2 : 2),
        scale: .94,
        opacity: .35,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {trigger: card, start: 'top 88%', toggleActions: 'play none none none', once: true}
      });
    });

    qsa('.gd-agenda-row').forEach((row, index) => {
      gsap.from(row, {
        x: index % 2 ? 100 : -80,
        y: 40,
        rotateZ: index % 2 ? 1.2 : -1.2,
        opacity: .25,
        duration: .95,
        ease: 'power3.out',
        scrollTrigger: {trigger: row, start: 'top 90%', toggleActions: 'play none none none', once: true}
      });
    });

    const newsCards = qsa('[data-gd-card]');
    newsCards.forEach((card, index) => {
      gsap.from(card, {
        y: 110 + index * 14,
        x: index % 2 ? 60 : -50,
        rotateZ: index % 2 ? 2.2 : -2.4,
        scale: .9,
        opacity: .25,
        duration: 1.15,
        ease: 'power3.out',
        scrollTrigger: {trigger: card, start: 'top 92%', toggleActions: 'play none none none', once: true}
      });
    });

    qsa('.black-photo-gallery figure').forEach((figure, index) => {
      gsap.from(figure, {
        y: 90,
        rotateZ: [-2.5, 1.6, -1.2][index % 3],
        scale: .9,
        opacity: .35,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {trigger: figure, start: 'top 90%', toggleActions: 'play none none none', once: true}
      });
    });

    const marquee = qs('.gd-news-marquee > div');
    if (marquee) {
      gsap.to(marquee, {xPercent: -50, ease:'none', scrollTrigger:{trigger:'.gd-news-section', start:'top bottom', end:'bottom top', scrub:true}});
    }

    const video = qs('.black-video-box');
    if (video) {
      gsap.from(video, {scale:.88, rotateZ:-1.5, y:80, duration:1.2, ease:'power3.out', scrollTrigger:{trigger:video,start:'top 88%',toggleActions:'play none none none',once:true}});
    }

    const refresh = () => requestAnimationFrame(() => ScrollTrigger.refresh());
    if (document.readyState === 'complete') refresh();
    else window.addEventListener('load', refresh, {once:true});
    return true;
  };

  const gsapReady = initGsapMotion();
  if (!gsapReady) {
    /* Offline/CDN fallback for Services: same 01→04 sequence and left→right travel. */
    const section = qs('.black-services-horizontal');
    const track = section ? qs('.black-services-track', section) : null;
    if (section && track) {
      const layout = () => {
        if (innerWidth <= 700) { section.style.height=''; track.style.transform=''; return; }
        const distance = Math.max(0, track.scrollWidth - innerWidth);
        section.style.height = `${innerHeight + distance}px`;
      };
      const move = () => {
        if (innerWidth <= 700) return;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const top = section.getBoundingClientRect().top + scrollY;
        const max = Math.max(1, section.offsetHeight - innerHeight);
        const progress = clamp((scrollY - top) / max);
        const distance = Math.max(0, track.scrollWidth - innerWidth);
        track.style.transform = `translate3d(${-distance + distance * progress}px,0,0)`;
      };
      addEventListener('resize', () => {layout(); move();});
      addEventListener('scroll', move, {passive:true});
      addEventListener('load', () => {layout(); move();});
      layout(); move();
    }
  }

  /* One-page navigation scrollspy. */
  const navLinks = qsa('.site-nav a[href^="#"]');
  const navTargets = navLinks.map(link => {
    const target = qs(link.getAttribute('href'));
    return target ? {link, target} : null;
  }).filter(Boolean);
  if ('IntersectionObserver' in window && navTargets.length) {
    const activeObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a,b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
      if (!visible.length) return;
      const current = visible[0].target;
      navTargets.forEach(({link,target}) => link.classList.toggle('is-active', target === current));
    }, {rootMargin:'-24% 0px -62% 0px', threshold:[0,.01,.1]});
    navTargets.forEach(({target}) => activeObserver.observe(target));
  }
})();
