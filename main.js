/* Page behaviour: nav, scroll reveals, steps carousel, FAQ, asset chips. The calculator lives in sell.js. */
(function () {
  'use strict';

  // Where every "Download" button points. Replace with the app store / smart link.
  var DOWNLOAD_URL = '#';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  $$('[data-download]').forEach(function (a) { a.setAttribute('href', DOWNLOAD_URL); });

  /* ---------- Intro ---------- */
  requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  var nav = $('#nav');
  var burger = $('.nav__burger');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  $$('.nav__menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
  document.addEventListener('pointerdown', function (e) { if (nav.classList.contains('is-open') && !nav.contains(e.target)) setMenu(false); });

  /* ---------- Scroll reveals ---------- */
  // Once an element has revealed, drop the attribute so hover transforms work again.
  function settle(el) {
    var delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(function () { el.removeAttribute('data-reveal'); el.classList.remove('is-in'); }, 1100 + delay * 1000);
  }
  var revealEls = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.removeAttribute('data-reveal'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        settle(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Steps: a row of three cards on desktop, a swipeable carousel below 1025px ---------- */
  var track = $('#steps-track');
  var pager = $('#pager');
  if (track && pager) {
    var cards = $$('.step-card', track);
    var dots = $$('.pager__dot', pager);
    var prev = $('.pager__arrow--prev', pager);
    var next = $('.pager__arrow--next', pager);
    var current = 0;

    var paint = function (i) {
      current = i;
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
      dots.forEach(function (d, n) {
        if (n === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
      cards.forEach(function (c, n) { c.classList.toggle('is-current', n === i); });
    };
    var go = function (i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      var card = cards[i];
      var left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
      track.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
      paint(i);
    };
    // Work out which card is centred while the person swipes
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bestD = Infinity;
        cards.forEach(function (c, n) {
          var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
          if (d < bestD) { bestD = d; best = n; }
        });
        if (best !== current) paint(best);
      });
    }, { passive: true });
    prev.addEventListener('click', function () { go(current - 1); });
    next.addEventListener('click', function () { go(current + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    pager.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
    });
    paint(0);
  }

  /* ---------- FAQ accordion ---------- */
  $$('.qa').forEach(function (qa) {
    var btn = $('.qa__q', qa);
    btn.addEventListener('click', function () {
      var open = !qa.classList.contains('is-open');
      $$('.qa.is-open').forEach(function (o) {
        if (o !== qa) { o.classList.remove('is-open'); $('.qa__q', o).setAttribute('aria-expanded', 'false'); }
      });
      qa.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Asset chips: set the crypto in the calculator and scroll up to it ---------- */
  $$('.chip[data-coin]').forEach(function (chip) {
    var t = chip.dataset.coin;
    chip.setAttribute('aria-label', 'Sell ' + t + ' in the calculator');
    chip.addEventListener('click', function () {
      if (!window.vengaSell || !window.vengaSell.has(t)) return;
      window.vengaSell.setCoin(t);
      $('#sell-calc').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      var input = $('#amount');
      setTimeout(function () { input.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    });
  });
})();
