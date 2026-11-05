// Сайт «Тёплый Хвост». Скрипт без библиотек. Каждый блок отвечает за одну функцию сайта.

// ---------- 1. Меню на телефоне ----------
const nav = document.querySelector('#nav');
document.querySelector('#burger').addEventListener('click', () => {
  nav.classList.toggle('is-open');            // показать или скрыть меню
});
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('is-open'));  // после выбора пункта меню закрывается
});

// ---------- 2. Вкладки «Для собак / Для кошек» ----------
const tabs = document.querySelectorAll('.tab');
const serviceCards = document.querySelectorAll('#panel-services .card');

function showSpecies(species) {
  tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.species === species));
  serviceCards.forEach(card => {
    // у карточки в data-for записано, для кого она: "dog", "cat" или "dog cat"
    card.hidden = !card.dataset.for.includes(species);
  });
}
tabs.forEach(tab => tab.addEventListener('click', () => showSpecies(tab.dataset.species)));
showSpecies('dog');                            // при открытии сайта показываем собак

// ---------- 3. Прайс: поиск и категории ----------
const priceRows = document.querySelectorAll('#price-table tbody tr');
const searchInput = document.querySelector('#price-search');
const chips = document.querySelectorAll('.chip');
let category = 'all';                          // выбранная категория

function filterPrice() {
  const query = searchInput.value.trim().toLowerCase();
  let shown = 0;
  priceRows.forEach(row => {
    const okCategory = category === 'all' || row.dataset.cat === category;
    const okText = row.textContent.toLowerCase().includes(query);
    row.hidden = !(okCategory && okText);      // строка видна, если подходит и по категории, и по тексту
    if (!row.hidden) shown++;
  });
  document.querySelector('#price-empty').hidden = shown > 0;   // «ничего не найдено»
}
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    category = chip.dataset.cat;
    chips.forEach(c => c.classList.toggle('is-active', c === chip));
    filterPrice();
  });
});
searchInput.addEventListener('input', filterPrice);

// ---------- 4. Всплывающие окна (запись и конфиденциальность) ----------
const booking = document.querySelector('#booking');
const privacy = document.querySelector('#privacy');

document.querySelectorAll('[data-open-booking]').forEach(btn => {
  btn.addEventListener('click', () => booking.showModal());
});
document.querySelectorAll('[data-open-privacy]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();                    // не переходить по ссылке #privacy
    privacy.showModal();
  });
});
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('dialog').close());
});

// Нельзя записаться на вчерашнюю дату: минимальная дата — сегодня
document.querySelector('#bk-date').min = new Date().toISOString().slice(0, 10);

// Контакты: Telegram и ВКонтакте открываются в маленьком окне с названием и значением
const contactDialog = document.querySelector('#contact');
const contactLink = document.querySelector('#contact-link');
document.querySelectorAll('[data-contact]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();                    // вместо перехода по ссылке показываем окно
    document.querySelector('#contact-title').textContent = link.dataset.contact;
    document.querySelector('#contact-value').textContent = link.dataset.value;
    contactLink.hidden = !link.dataset.button; // кнопка есть только у Telegram
    contactLink.href = link.getAttribute('href');
    contactLink.textContent = link.dataset.button || '';
    contactDialog.showModal();
  });
});

// ---------- 5. Формы: проверка полей ----------
// Возвращает текст ошибки или пустую строку, если поле заполнено верно
function getError(input) {
  const value = input.value.trim();
  if (input.type === 'checkbox') return input.checked ? '' : 'Нужно согласие';
  if (!value) return 'Заполните поле';
  if (input.type === 'tel' && value.replace(/\D/g, '').length < 10) return 'Введите телефон полностью';
  if (value.length < input.minLength) return `Минимум ${input.minLength} символов`;
  return '';
}

// Проверяет все поля формы, показывает ошибки. true — если ошибок нет
function validate(form) {
  let ok = true;
  form.querySelectorAll('input, select, textarea').forEach(input => {
    const message = getError(input);
    const field = input.closest('.field');
    field.classList.toggle('has-error', message !== '');     // красная рамка
    field.querySelector('.error').textContent = message;     // текст ошибки под полем
    if (message) ok = false;
  });
  return ok;
}

// Подключает форму: при отправке проверяем, и если всё верно — показываем «Спасибо»
function setupForm(form, onSuccess) {
  form.addEventListener('submit', event => {
    event.preventDefault();                    // не перезагружать страницу
    if (!validate(form)) return;
    form.reset();
    const success = form.querySelector('.success');
    success.hidden = false;
    setTimeout(() => { success.hidden = true; }, 5000);
    if (onSuccess) onSuccess();
  });
}
setupForm(document.querySelector('#booking-form'), () => setTimeout(() => booking.close(), 1800));
setupForm(document.querySelector('#callback-form'));

// ---------- 6. Отзывы (хранятся в браузере) ----------
const reviewsList = document.querySelector('#reviews-list');
const reviewsEmpty = document.querySelector('#reviews-empty');
const reviewForm = document.querySelector('#review-form');
let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');

function showReview(review) {
  const box = document.createElement('article');
  box.className = 'review';
  // textContent вставляет текст как есть, поэтому чужой HTML-код на странице не выполнится
  box.innerHTML = '<strong></strong><p></p>';
  box.querySelector('strong').textContent = review.name;
  box.querySelector('p').textContent = review.text;
  reviewsList.append(box);
  reviewsEmpty.hidden = true;
}
reviews.forEach(showReview);

reviewForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!validate(reviewForm)) return;
  const review = { name: reviewForm.querySelector('#rv-name').value.trim(), text: reviewForm.querySelector('#rv-text').value.trim() };
  reviews.push(review);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  showReview(review);
  reviewForm.reset();
});

// ---------- 7. Уведомление о cookie ----------
const cookie = document.querySelector('#cookie');
cookie.hidden = localStorage.getItem('cookieOk') === 'yes';
document.querySelector('#cookie-ok').addEventListener('click', () => {
  localStorage.setItem('cookieOk', 'yes');
  cookie.hidden = true;
});

// ---------- 8. Плавное появление блоков при прокрутке ----------
// Класс js включает скрытие блоков только если скрипт работает: без него страница видна целиком
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const reveals = document.querySelectorAll('.section h2, .card, .promo, .doctor, .steps li, .article, .faq, .review');
  const watcher = new IntersectionObserver(items => {
    items.forEach(item => {
      if (item.isIntersecting) { item.target.classList.add('is-in'); watcher.unobserve(item.target); }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => { el.classList.add('reveal'); watcher.observe(el); });
}

// ---------- 9. Мой питомец (данные хранятся в браузере) ----------
const petForm = document.querySelector('#pet-form');
const petCard = document.querySelector('#pet-card');
const petDate = document.querySelector('#pt-date');
petDate.max = new Date().toISOString().slice(0, 10); // прививка не может быть в будущем

// Мордочки для карточки питомца (готовые константы, пользовательский текст в разметку не попадает)
const CAT_ART = '<svg viewBox="0 0 64 64" aria-hidden="true"><path class="pet-art__head" d="M14 46 V19 L25 27 Q32 25 39 27 L50 19 V46 Q50 55 32 55 Q14 55 14 46 Z"/><ellipse class="pet-art__dark" cx="25" cy="37" rx="3" ry="4"/><ellipse class="pet-art__dark" cx="39" cy="37" rx="3" ry="4"/><path class="pet-art__dark" d="M29.5 43.5 H34.5 L32 46.5 Z"/><path class="pet-art__line" d="M32 46.5 V48.5 M32 48.5 Q29.5 51 27.5 49.5 M32 48.5 Q34.5 51 36.5 49.5" fill="none" stroke-width="1.4" stroke-linecap="round"/><path class="pet-art__line" d="M8 40 L18 42 M8 47 L18 45 M56 40 L46 42 M56 47 L46 45" fill="none" stroke-width="2" stroke-linecap="round"/></svg>';
const DOG_ART = '<svg viewBox="0 0 64 64" aria-hidden="true"><path class="pet-art__ear" d="M13 18 Q4 34 13 48 Q21 48 22 36 L21 18 Z"/><path class="pet-art__ear" d="M51 18 Q60 34 51 48 Q43 48 42 36 L43 18 Z"/><rect class="pet-art__head" x="17" y="12" width="30" height="40" rx="15"/><ellipse class="pet-art__snout" cx="32" cy="42" rx="9.5" ry="7.5"/><circle class="pet-art__dark" cx="25" cy="30" r="2.8"/><circle class="pet-art__dark" cx="39" cy="30" r="2.8"/><ellipse class="pet-art__dark" cx="32" cy="38" rx="4.2" ry="3"/><path class="pet-art__line" d="M32 41 V45 M32 45 Q29 48 26.5 46.5 M32 45 Q35 48 37.5 46.5" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>';

function showPet(pet) {
  const done = new Date(pet.date);
  const next = new Date(done);
  next.setFullYear(done.getFullYear() + 1);                       // повторная прививка — через год
  const days = Math.ceil((next - new Date()) / 86400000);
  let status = 'ok', text = `Осталось дней: ${days}`;
  if (days < 0) { status = 'late'; text = 'Пора на прививку: срок прошёл'; }
  else if (days <= 30) { status = 'soon'; text = `Скоро: осталось дней — ${days}`; }

  petCard.innerHTML = '<div class="pet__head"><span class="avatar"></span><div><h3></h3><p></p></div></div>' +
    '<p class="pet__next">Следующая прививка: <strong></strong></p><p class="pet__status"></p>' +
    '<div class="pet__buttons"><button class="btn btn--accent" type="button" data-open-booking>Записаться</button><button class="link" type="button" id="pet-clear">Удалить данные</button></div>';
  const avatar = petCard.querySelector('.avatar');
  avatar.classList.add('avatar--pet');
  avatar.innerHTML = pet.species === 'Кошка' ? CAT_ART : DOG_ART;
  petCard.querySelector('h3').textContent = pet.name;
  petCard.querySelector(".pet__head p").textContent = `${pet.species} · последняя прививка ${done.toLocaleDateString("ru-RU")}`;
  petCard.querySelector('.pet__next strong').textContent = next.toLocaleDateString('ru-RU');
  const badge = petCard.querySelector('.pet__status');
  badge.textContent = text;
  badge.className = 'pet__status pet__status--' + status;
  petCard.querySelector('[data-open-booking]').addEventListener('click', () => booking.showModal());
  petCard.querySelector('#pet-clear').addEventListener('click', () => {
    localStorage.removeItem('pet');
    petCard.innerHTML = '<p class="empty">Здесь появится карточка вашего питомца.</p>';
  });
}
const savedPet = JSON.parse(localStorage.getItem('pet') || 'null');
if (savedPet) showPet(savedPet);

petForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!validate(petForm)) return;
  const pet = { name: petForm.querySelector('#pt-name').value.trim(), species: petForm.querySelector('#pt-species').value, date: petDate.value };
  localStorage.setItem('pet', JSON.stringify(pet));
  showPet(pet);
  petForm.reset();
});

// ---------- 10. Светлая и тёмная тема ----------
const root = document.documentElement;
const themeButton = document.querySelector('#theme-toggle');
const autoBox = document.querySelector('#theme-auto');
function setTheme(name, remember) {
  root.dataset.theme = name;
  themeButton.setAttribute('aria-pressed', String(name === 'dark'));
  if (remember) {
    try { localStorage.setItem('theme', name); } catch (e) { /* хранилище недоступно — тема просто не запомнится */ }
  }
}
// Тема: сначала выбор посетителя, если его нет, то настройка системы (авто-режим)
let savedTheme = null;
try { savedTheme = localStorage.getItem('theme'); } catch (e) {}
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
setTheme(savedTheme || (systemDark.matches ? 'dark' : 'light'), false);
autoBox.checked = !savedTheme; // галочка «авто» стоит, пока посетитель сам не выбрал тему
// Пока посетитель сам не нажимал кнопку, тема следует за системой (например, вечером переключается на тёмную)
systemDark.addEventListener('change', (e) => {
  let chosen = null;
  try { chosen = localStorage.getItem('theme'); } catch (err) {}
  if (!chosen) {
    root.classList.add('theme-fade');
    setTheme(e.matches ? 'dark' : 'light', false);
    setTimeout(() => root.classList.remove('theme-fade'), 600);
  }
});

themeButton.addEventListener('click', () => {
  root.classList.add('theme-fade'); // на 0,6 с включается плавный переход цветов
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  autoBox.checked = false; // ручной выбор отключает авто-режим
  setTimeout(() => root.classList.remove('theme-fade'), 600);
});

// Фото врачей: если файл img/doctors/N.jpg есть, он заменяет кружок с инициалами
document.querySelectorAll('.doctor[data-photo]').forEach(function (card) {
  var probe = new Image();
  probe.onload = function () {
    var img = document.createElement('img');
    img.className = 'doctor__photo';
    img.src = card.dataset.photo;
    img.alt = card.querySelector('h3').textContent;
    img.loading = 'lazy';
    card.replaceChild(img, card.querySelector('.avatar'));
  };
  probe.src = card.dataset.photo;
});

// Галочка «авто»: включена, значит тема берётся из настроек устройства
autoBox.addEventListener('change', () => {
  root.classList.add('theme-fade');
  if (autoBox.checked) {
    try { localStorage.removeItem('theme'); } catch (e) {}
    setTheme(systemDark.matches ? 'dark' : 'light', false);
  } else {
    setTheme(root.dataset.theme, true); // фиксируем текущую тему как выбор посетителя
  }
  setTimeout(() => root.classList.remove('theme-fade'), 600);
});
