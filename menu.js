(function () {
  function $all(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // app button hover/click: produce a subtle burst on backdrop
  $all('.app-btn').forEach(function (btn) {
    btn.addEventListener('mouseenter', function () {
      if (window.Sketches && window.Sketches.backdrop && typeof window.Sketches.backdrop.burst === 'function') {
        window.Sketches.backdrop.burst();
      }
      btn.classList.add('hover');
    });
    btn.addEventListener('mouseleave', function () { btn.classList.remove('hover'); });
    btn.addEventListener('click', function () {
      // placeholder: flash the backdrop and pulse the button
      if (window.Sketches && window.Sketches.backdrop && typeof window.Sketches.backdrop.burst === 'function') window.Sketches.backdrop.burst();
      btn.animate([{ transform: 'scale(1.02)' }, { transform: 'scale(0.98)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1)' });
    });
  });
})();
