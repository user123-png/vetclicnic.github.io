/* Тёплый Хвост — учебный проект. Скрипт без внешних библиотек. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Безопасная работа с localStorage (может быть недоступен)
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---------- Меню на телефоне ---------- */
  var burger = $('#burger'), nav = $('#nav');
  function closeNav() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Открыть меню'); }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* ---------- Вкладки «Для собак / Для кошек» ---------- */
  var tabs = $$('.tab'), cards = $$('#panel-services .card');
  function showSpecies(sp) {
    tabs.forEach(function (t) {
      var on = t.dataset.species === sp;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    cards.forEach(function (c) { c.hidden = c.dataset['for'].split(' ').indexOf(sp) === -1; });
    store.set('species', sp);
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { showSpecies(t.dataset.species); }); });
  showSpecies(store.get('species', 'dog'));

  /* ---------- Прайс: поиск и категории ---------- */
  var rows = $$('#price-table tbody tr'), search = $('#price-search'), chips = $$('.chip'), empty = $('#price-empty');
  var activeCat = 'all';
  function filterPrice() {
    var q = search.value.trim().toLowerCase(), shown = 0;
    rows.forEach(function (r) {
      var ok = (activeCat === 'all' || r.dataset.cat === activeCat) && r.textContent.toLowerCase().indexOf(q) !== -1;
      r.hidden = !ok;
      if (ok) shown++;
    });
    empty.hidden = shown !== 0;
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      activeCat = c.dataset.cat;
      chips.forEach(function (x) { x.classList.toggle('is-active', x === c); });
      filterPrice();
    });
  });
  search.addEventListener('input', filterPrice);

  /* ---------- Окна ---------- */
  var booking = $('#booking'), privacy = $('#privacy');
  function openDialog(d) {
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  function closeDialog(d) {
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }
  $$('[data-open-booking]').forEach(function (b) { b.addEventListener('click', function () { closeNav(); openDialog(booking); }); });
  $$('[data-open-privacy]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openDialog(privacy); }); });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { closeDialog(b.closest('dialog')); }); });
  [booking, privacy].forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) closeDialog(d); }); // клик по фону
  });

  // Минимальная дата записи — сегодня
  var dateInput = $('#bk-date');
  if (dateInput) {
    var t = new Date(), mm = ('0' + (t.getMonth() + 1)).slice(-2), dd = ('0' + t.getDate()).slice(-2);
    dateInput.min = t.getFullYear() + '-' + mm + '-' + dd;
  }

  /* ---------- Формы ---------- */
  function phoneOk(v) { return /^\+?[78]?[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}$/.test(v.trim()); }

  function validate(form) {
    var ok = true;
    $$('input, select, textarea', form).forEach(function (el) {
      var msg = '';
      var val = (el.value || '').trim();
      if (el.type === 'checkbox') {
        if (el.required && !el.checked) msg = 'Нужно согласие';
      } else if (el.required && !val) {
        msg = 'Заполните поле';
      } else if (el.type === 'tel' && !phoneOk(val)) {
        msg = 'Введите телефон полностью, например +7 900 000-00-00';
      } else if (el.minLength > 0 && val.length < el.minLength) {
        msg = 'Минимум ' + el.minLength + ' символов';
      }
      var holder = el.closest('.field');
      var err = holder ? $('.error', holder) : (el.closest('.agree') ? el.closest('.agree').nextElementSibling : null);
      if (holder) holder.classList.toggle('has-error', !!msg);
      if (err && err.classList.contains('error')) err.textContent = msg;
      if (msg) ok = false;
    });
    return ok;
  }

  function handleForm(form, storageKey, onSaved) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) {
        var bad = $('.has-error input, .has-error select, .has-error textarea', form);
        if (bad) bad.focus();
        return;
      }
      var data = {};
      $$('input, select, textarea', form).forEach(function (el) {
        if (el.type === 'checkbox') return;
        data[el.name] = el.value.trim();
      });
      data.createdAt = new Date().toISOString();
      var list = store.get(storageKey, []);
      list.push(data);
      store.set(storageKey, list);
      form.reset();
      var ok = $('.success', form);
      if (ok) { ok.hidden = false; setTimeout(function () { ok.hidden = true; }, 5000); }
      if (onSaved) onSaved(data);
    });
  }

  handleForm($('#booking-form'), 'bookings', function () {
    setTimeout(function () { closeDialog(booking); }, 1800);
  });
  handleForm($('#callback-form'), 'callbacks');

  /* ---------- Отзывы ---------- */
  var list = $('#reviews-list'), emptyReviews = $('#reviews-empty');
  function renderReview(r) {
    var box = document.createElement('article');
    box.className = 'review';
    var name = document.createElement('strong');
    name.textContent = r.name;            // textContent защищает от внедрения HTML
    var text = document.createElement('p');
    text.textContent = r.text;
    text.style.margin = '0';
    box.appendChild(name);
    box.appendChild(text);
    list.appendChild(box);
  }
  var saved = store.get('reviews', []);
  saved.forEach(renderReview);
  if (saved.length) emptyReviews.hidden = true;

  var reviewForm = $('#review-form');
  reviewForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(reviewForm)) return;
    var r = { name: $('#rv-name').value.trim(), text: $('#rv-text').value.trim() };
    var all = store.get('reviews', []);
    all.push(r);
    store.set('reviews', all);
    emptyReviews.hidden = true;
    renderReview(r);
    reviewForm.reset();
  });

  /* ---------- Cookie ---------- */
  var cookie = $('#cookie');
  if (!store.get('cookieOk', false)) cookie.hidden = false;
  $('#cookie-ok').addEventListener('click', function () { store.set('cookieOk', true); cookie.hidden = true; });

  /* ---------- Плавное появление ---------- */
  var targets = $$('.section h2, .card, .promo, .doctor, .steps li, .article, .faq');
  if ('IntersectionObserver' in window) {
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    targets.forEach(function (el) { io.observe(el); });
  }
})();
