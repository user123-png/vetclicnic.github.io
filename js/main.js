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
