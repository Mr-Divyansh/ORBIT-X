(() => {
  const page = document.querySelector('.about-page');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (menuToggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation menu');
    };

    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation menu' : 'Open navigation menu'
      );
    });

    navLinks.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (!menuToggle.contains(event.target) && !navLinks.contains(event.target)) {
        closeMenu();
      }
    });
  }

  if (!page) return;

  const characterSwaps = page.querySelectorAll('[data-character-swap]');
  const hoverAvailable = window.matchMedia('(hover: hover) and (pointer: fine)');

  const setGadgetVisible = (visual, visible) => {
    const soloImage = visual.querySelector('.swap-image-solo');
    const gadgetImage = visual.querySelector('.swap-image-gadget');
    const characterName = visual.dataset.characterName;
    const gadgetName = visual.dataset.gadgetName;

    visual.classList.toggle('is-gadget-visible', visible);
    visual.setAttribute('aria-pressed', String(visible));
    soloImage.setAttribute('aria-hidden', String(visible));
    gadgetImage.setAttribute('aria-hidden', String(!visible));
    visual.setAttribute(
      'aria-label',
      visible
        ? `${characterName} holding his ${gadgetName}. Activate to return to the original portrait.`
        : `${characterName}. Hover or activate to see his ${gadgetName}.`
    );
  };

  characterSwaps.forEach((visual) => {
    const gadgetImage = visual.querySelector('.swap-image-gadget');
    const preload = new Image();
    preload.src = gadgetImage.currentSrc || gadgetImage.src;

    if (hoverAvailable.matches) {
      visual.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'touch') setGadgetVisible(visual, true);
      });
      visual.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'touch') setGadgetVisible(visual, false);
      });
    }

    visual.addEventListener('click', (event) => {
      if (event.detail === 0 || (hoverAvailable.matches && event.pointerType !== 'touch')) {
        return;
      }

      setGadgetVisible(
        visual,
        !visual.classList.contains('is-gadget-visible')
      );
    });

    visual.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();
      setGadgetVisible(
        visual,
        !visual.classList.contains('is-gadget-visible')
      );
    });
  });

  const revealItems = page.querySelectorAll('.reveal');
  if (
    reducedMotion.matches ||
    !('IntersectionObserver' in window) ||
    revealItems.length === 0
  ) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  page.classList.add('has-reveals');
  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        activeObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -5% 0px',
    }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${(index % 3) * 85}ms`;
    observer.observe(item);
  });
})();
