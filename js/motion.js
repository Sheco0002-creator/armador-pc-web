// ===== Motion: scroll-reveal progresivo (Fase 2 del rediseño) =====
// Mejora progresiva: sin JS, cualquier elemento [data-reveal] se ve normal
// (nunca queda oculto). Con prefers-reduced-motion, no se activa nada y
// todo se muestra desde el inicio, sin transición.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  document.documentElement.classList.add('js-reveal-ready');

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();
