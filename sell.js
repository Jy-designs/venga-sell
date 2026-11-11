/* Sell calculator (hero). Markup in index.html, styles in styles.css.
   Pick a crypto, set the amount to sell (type it or use − / +), and see the euros you receive after fees. */
(function () {
  'use strict';

  /* ================= CONFIG: replace with your price feed and fee schedule ================= */
  // Reference prices in EUR. BTC matches the Figma mock; the rest are placeholders.
  // `step` is what − / + add or remove. The list matches the coins on the page, plus LINK (named in its copy).
  var COINS = [
    { ticker: 'BTC',  name: 'Bitcoin',   price: 80838.038, step: 0.001 },
    { ticker: 'ETH',  name: 'Ethereum',  price: 2401.7481, step: 0.01 },
    { ticker: 'SOL',  name: 'Solana',    price: 152.4,     step: 0.1 },
    { ticker: 'XRP',  name: 'XRP',       price: 2.14,      step: 10 },
    { ticker: 'BNB',  name: 'BNB',       price: 905.2,     step: 0.01 },
    { ticker: 'ADA',  name: 'Cardano',   price: 0.61,      step: 10 },
    { ticker: 'AVAX', name: 'Avalanche', price: 22.35,     step: 1 },
    { ticker: 'DOGE', name: 'Dogecoin',  price: 0.152,     step: 100 },
    { ticker: 'LINK', name: 'Chainlink', price: 14.2,      step: 1 },
    { ticker: 'SUI',  name: 'Sui',       price: 2.48,      step: 10 },
    { ticker: 'TRX',  name: 'TRON',      price: 0.29,      step: 100 },
    { ticker: 'GRT',  name: 'The Graph', price: 0.085,     step: 100 }
  ];
  var FEE_RATE = 0.008;   // 0.8 % of the sale
  var FEE_FIXED = 1;      // + €1 per sale
  var DEFAULT = { ticker: 'BTC', amount: '0.02328' }; // Figma mock
  var LAST_UPDATED = '20 Oct 2026, 10:42 CEST';
  var ICON_BASE = 'assets/coins/';  // <ICON_BASE><ticker>.svg
  /* ========================================================================================== */

  var byTicker = {};
  COINS.forEach(function (c) { byTicker[c.ticker] = c; });

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    stat: document.querySelector('.stat--coin'),
    trigger: $('coin-trigger'), list: $('coin-list'), icon: $('coin-icon'), name: $('coin-name'),
    amount: $('amount'), minus: $('minus'), plus: $('plus'),
    receive: $('receive'), note: $('receive-note'),
    rate: $('rate'), updated: $('updated'), ctaText: $('cta-text'), ctaIcon: $('cta-icon')
  };
  if (!el.stat) return;

  var state = { ticker: DEFAULT.ticker, amount: DEFAULT.amount };

  /* ---------- Formatting ---------- */
  function iconMarkup(coin) {
    return '<img src="' + ICON_BASE + coin.ticker.toLowerCase() + '.svg" width="32" height="32" alt="">';
  }
  function parse(str) {
    var n = parseFloat(str);
    return isFinite(n) && n > 0 ? n : 0;
  }
  function decimalsOf(n) {
    var s = String(n);
    return s.indexOf('.') > -1 ? s.length - s.indexOf('.') - 1 : 0;
  }
  function trim(n, decimals) {
    var s = n.toFixed(decimals);
    return s.indexOf('.') > -1 ? s.replace(/\.?0+$/, '') : s;
  }
  function sanitise(raw) {
    var s = raw.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    var dot = s.indexOf('.');
    if (dot > -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '').slice(0, 8);
    if (s.charAt(0) === '.') s = '0' + s;
    return s;
  }
  function euro(n, maxDecimals) {
    return '€' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: maxDecimals || 2 });
  }
  function price(n) {
    return euro(n, n < 1 ? 4 : 3);
  }

  /* ---------- Maths ---------- */
  function quote() {
    var coin = byTicker[state.ticker];
    var gross = parse(state.amount) * coin.price;
    var fee = gross > 0 ? gross * FEE_RATE + FEE_FIXED : 0;
    return { gross: gross, fee: fee, net: Math.max(0, gross - fee) };
  }

  /* ---------- Render ---------- */
  // Shrink the euro amount so long numbers stay on one line in the box.
  function fitReceive() {
    var node = el.receive;
    node.style.fontSize = '';
    var size = parseFloat(getComputedStyle(node).fontSize);
    while (node.scrollWidth > node.clientWidth + 1 && size > 18) {
      size -= 1;
      node.style.fontSize = size + 'px';
    }
  }
  function pop(node) {
    node.classList.remove('amount-pop');
    void node.offsetWidth;
    node.classList.add('amount-pop');
  }

  function renderResult(animate) {
    var q = quote();
    var text = euro(q.net);
    if (animate && el.receive.textContent !== text) pop(el.receive);
    el.receive.textContent = text;
    var tooSmall = q.gross > 0 && q.gross <= q.fee;
    el.note.textContent = tooSmall ? 'The amount is too small to cover the fees' : 'Indicative price, confirmed before you sell';
    el.note.classList.toggle('is-warning', tooSmall);
    el.minus.disabled = parse(state.amount) <= 0;
    fitReceive();
  }

  function render(animate) {
    var coin = byTicker[state.ticker];
    el.icon.innerHTML = iconMarkup(coin);
    el.name.textContent = coin.name;
    el.trigger.setAttribute('aria-label', 'Crypto to sell: ' + coin.name + '. Choose another');
    el.amount.setAttribute('aria-label', 'Amount of ' + coin.ticker + ' to sell');
    if (document.activeElement !== el.amount) el.amount.value = state.amount;
    el.rate.textContent = '1 ' + coin.ticker + ' = ' + price(coin.price);
    el.updated.textContent = 'Last updated: ' + LAST_UPDATED;
    el.ctaText.textContent = 'Sell ' + coin.ticker;
    el.ctaIcon.innerHTML = iconMarkup(coin);
    renderResult(animate);
  }

  /* ---------- Amount: typing ---------- */
  el.amount.addEventListener('focus', function () { closeList(); el.amount.select(); });
  el.amount.addEventListener('input', function () {
    var clean = sanitise(el.amount.value);
    if (clean !== el.amount.value) el.amount.value = clean;
    state.amount = clean;
    renderResult();
  });
  el.amount.addEventListener('blur', function () {
    state.amount = trim(parse(el.amount.value), 8);
    el.amount.value = state.amount;
  });
  el.amount.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') el.amount.blur();
    if (e.key === 'ArrowUp') { e.preventDefault(); nudge(1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); nudge(-1); }
  });

  /* ---------- Amount: − / + ---------- */
  function nudge(dir) {
    var coin = byTicker[state.ticker];
    var d = Math.max(decimalsOf(coin.step), decimalsOf(state.amount));
    var next = Math.max(0, parse(state.amount) + dir * coin.step);
    state.amount = trim(next, Math.min(d, 8));
    el.amount.value = state.amount;
    renderResult(true);
  }
  el.minus.addEventListener('click', function () { nudge(-1); });
  el.plus.addEventListener('click', function () { nudge(1); });

  /* ---------- Coin list ---------- */
  function buildList() {
    el.list.innerHTML = COINS.map(function (c) {
      return '<li role="option" tabindex="-1" data-ticker="' + c.ticker + '" aria-selected="' + (c.ticker === state.ticker) + '">' +
        '<span class="coin-icon">' + iconMarkup(c) + '</span>' +
        '<span class="coin-list__name">' + c.name + '</span>' +
        '<span class="coin-list__ticker">' + c.ticker + '</span>' +
        '<svg class="coin-list__check" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</li>';
    }).join('');
  }
  function openList() {
    buildList();
    el.list.hidden = false;
    el.stat.classList.add('is-open');
    el.trigger.setAttribute('aria-expanded', 'true');
    var current = el.list.querySelector('[aria-selected="true"]') || el.list.firstElementChild;
    current.focus({ preventScroll: true });
    el.list.scrollTop = Math.max(0, current.offsetTop - 60);
  }
  function closeList(refocus) {
    if (el.list.hidden) return;
    el.list.hidden = true;
    el.stat.classList.remove('is-open');
    el.trigger.setAttribute('aria-expanded', 'false');
    if (refocus) el.trigger.focus();
  }

  // Switching crypto keeps roughly the same euro value, rounded to that coin's step.
  function choose(ticker, refocus) {
    var prev = byTicker[state.ticker], next = byTicker[ticker];
    if (ticker !== state.ticker) {
      var value = parse(state.amount) * prev.price;
      var d = decimalsOf(next.step) + 1;
      state.amount = value > 0 ? trim(value / next.price, d) : '0';
      if (parse(state.amount) === 0 && value > 0) state.amount = String(next.step);
      state.ticker = ticker;
    }
    closeList(refocus !== false);
    render(true);
  }

  el.trigger.addEventListener('click', function () {
    if (el.list.hidden) openList(); else closeList(true);
  });
  el.trigger.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openList(); }
  });
  el.list.addEventListener('click', function (e) {
    var li = e.target.closest('li');
    if (li) choose(li.dataset.ticker);
  });
  el.list.addEventListener('keydown', function (e) {
    var li = document.activeElement.closest('li');
    if (!li) return;
    var next = null;
    if (e.key === 'ArrowDown') next = li.nextElementSibling || el.list.firstElementChild;
    else if (e.key === 'ArrowUp') next = li.previousElementSibling || el.list.lastElementChild;
    else if (e.key === 'Home') next = el.list.firstElementChild;
    else if (e.key === 'End') next = el.list.lastElementChild;
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(li.dataset.ticker); return; }
    else if (e.key === 'Escape') { e.preventDefault(); closeList(true); return; }
    else if (e.key === 'Tab') { closeList(); return; }
    else if (e.key.length === 1) {
      var ch = e.key.toLowerCase();
      next = Array.prototype.find.call(el.list.children, function (item) {
        return item !== li && (item.dataset.ticker.toLowerCase().charAt(0) === ch || item.textContent.trim().toLowerCase().charAt(0) === ch);
      });
    }
    if (next) { e.preventDefault(); next.focus(); }
  });
  document.addEventListener('pointerdown', function (e) {
    if (!el.stat.contains(e.target)) closeList();
  });

  window.addEventListener('resize', fitReceive);

  /* ---------- Public hook: the asset chips further down set the crypto ---------- */
  window.vengaSell = {
    has: function (ticker) { return !!byTicker[ticker]; },
    setCoin: function (ticker) { if (byTicker[ticker]) choose(ticker, false); }
  };

  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitReceive);
})();
