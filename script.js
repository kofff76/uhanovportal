(() => {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.accordion-menu');
  if (burger && menu) {
    const close = () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); };
    burger.addEventListener('click', () => {
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  document.querySelectorAll('[data-placeholder-link]').forEach(link => {
    link.addEventListener('click', e => e.preventDefault());
  });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.to(el, {
        opacity:1, y:0, duration:1.05, ease:'power3.out',
        scrollTrigger:{ trigger:el, start:'top 88%', once:true }
      });
    });

    const word = document.querySelector('.projects-word');
    const projects = document.querySelector('.projects-scroll');
    if (word && projects) {
      gsap.fromTo(word, {xPercent:-28}, {
        xPercent:15, ease:'none',
        scrollTrigger:{ trigger:projects, start:'top bottom', end:'bottom top', scrub:1.1 }
      });
    }

    gsap.utils.toArray('.project-row').forEach((card, i) => {
      const dir = card.classList.contains('from-right') ? 1 : -1;
      gsap.fromTo(card,
        {x: dir * 150, opacity:.15, rotateY:dir * 4},
        {x:0, opacity:1, rotateY:0, ease:'power2.out',
          scrollTrigger:{trigger:card,start:'top 86%',end:'top 48%',scrub:1}}
      );
    });

    const heroOrb = document.querySelector('.hero-orbit-a');
    if (heroOrb && document.querySelector('.hero')) {
      gsap.to(heroOrb,{yPercent:9,scale:1.035,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    }
  } else {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  }
})();
