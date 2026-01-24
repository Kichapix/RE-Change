let ratesToRUB = {};

let step = 'exchange';
// exchange | form | confirm | payment | success

const dealDraft = {
  fromCurrency: null,
  toCurrency: null,
  fromAmount: null,
  toAmount: null,

  fullName: '',
  email: '',
  phone: '',
  cardNumber: '',

  dealId: null,
  dealNumber: null,
  status: null
};

const validators = {
  fullName: v => /^[А-Яа-яA-Za-z\s]{2,}$/.test(v),
  email: v => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v),
  phone: v => /^\+7\s\d{3}\s\d{3}-\d{2}-\d{2}$/.test(v),
  cardNumber: v => /^\d{16}$/.test(v.replace(/\s/g, ''))
};

function validateField(id) {
  const input = document.getElementById(id);
  const error = document.getElementById(`error-${id}`);
  const value = input.value.trim();

  if (!validators[id](value)) {
    input.classList.add('invalid');
    error.textContent = 'Некорректное значение';
    return false;
  }

  input.classList.remove('invalid');
  error.textContent = '';
  return true;
}

function validateForm() {
  const fields = ['fullName', 'email', 'phone', 'cardNumber'];

  const isValid = fields.every(id => {
    const input = document.getElementById(id);
    return input.value.trim() !== '' && validateField(id);
  });

  const btn = document.getElementById('toConfirmBtn');

  if (isValid) {
    btn.classList.remove('hidden-btn');
  } else {
    btn.classList.add('hidden-btn');
  }

  return isValid;
}

['fullName', 'email', 'phone', 'cardNumber'].forEach(id => {
  document.getElementById(id).addEventListener('input', validateForm);
});

const cardInput = document.getElementById('cardNumber');

cardInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');

  if (value.length > 16) {
    value = value.slice(0, 16);
  }

  e.target.value = value.replace(/(.{4})/g, '$1 ').trim();
});

const phoneInput = document.getElementById('phone');

// при фокусе — если пусто, ставим +7
phoneInput.addEventListener('focus', () => {
  if (phoneInput.value.trim() === '') {
    phoneInput.value = '+7';
  }
});

// форматирование при вводе
phoneInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');

  // если пользователь стёр всё — возвращаем +7
  if (value.length === 0) {
    e.target.value = '+7';
    return;
  }

  // всегда начинаем с 7
  if (value[0] !== '7') {
    value = '7' + value.slice(1);
  }

  value = value.slice(0, 11); // +7XXXXXXXXXX

  const formatted =
      '+7 ' +
      value.slice(1, 4) +
      (value.length > 4 ? ' ' + value.slice(4, 7) : '') +
      (value.length > 7 ? '-' + value.slice(7, 9) : '') +
      (value.length > 9 ? '-' + value.slice(9, 11) : '');

  e.target.value = formatted.trim();
});

// Доступные валюты
const currencies = ['RUB', 'USD', 'EUR'];

// DOM элементы
const fromInput = document.querySelectorAll('.amount-input')[0];
const toInput = document.querySelectorAll('.amount-input')[1];

const fromCurrencyBtn = document.querySelectorAll('.currency-btn')[0];
const toCurrencyBtn = document.querySelectorAll('.currency-btn')[1];

// Состояние
let fromCurrency = 'RUB';
let toCurrency = 'USD';
let activeField = 'from'; // 'from' | 'to'

function getRate(from, to) {
  // через RUB
  return ratesToRUB[from] / ratesToRUB[to];
}

function recalculate() {
  const rate = getRate(fromCurrency, toCurrency);

  if (activeField === 'from') {
    const value = parseFloat(fromInput.value);
    if (!isNaN(value)) {
      toInput.value = (value * rate).toFixed(2);
    }
  } else {
    const value = parseFloat(toInput.value);
    if (!isNaN(value)) {
      fromInput.value = (value / rate).toFixed(2);
    }
  }
}


fromInput.addEventListener('input', () => {
  activeField = 'from';
  recalculate();
});

toInput.addEventListener('input', () => {
  activeField = 'to';
  recalculate();
});

fromCurrencyBtn.addEventListener('click', () => {
  const index = currencies.indexOf(fromCurrency);
  let newCurrency = currencies[(index + 1) % currencies.length];

  // Запрет одинаковых валют
  if (newCurrency === toCurrency) {
    newCurrency = currencies[(currencies.indexOf(newCurrency) + 1) % currencies.length];
  }

  fromCurrency = newCurrency;
  fromCurrencyBtn.innerText = fromCurrency;
  recalculate();
});

toCurrencyBtn.addEventListener('click', () => {
  const index = currencies.indexOf(toCurrency);
  let newCurrency = currencies[(index + 1) % currencies.length];

  // Запрет одинаковых валют
  if (newCurrency === fromCurrency) {
    newCurrency = currencies[(currencies.indexOf(newCurrency) + 1) % currencies.length];
  }

  toCurrency = newCurrency;
  toCurrencyBtn.innerText = toCurrency;
  recalculate();
});

async function loadRates() {
  const response = await fetch('/api/rates');
  ratesToRUB = await response.json();
  recalculate();
}

loadRates();

function goToStep(nextStep) {
  step = nextStep;

  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
  });

  document.getElementById(`screen-${step}`).classList.remove('hidden');
}

document.getElementById('toFormBtn').addEventListener('click', () => {
  if (!fromInput.value || !toInput.value) {
    alert('Введите сумму и выберите валюты');
    return;
  }

  dealDraft.fromCurrency = fromCurrency;
  dealDraft.toCurrency = toCurrency;
  dealDraft.fromAmount = fromInput.value;
  dealDraft.toAmount = toInput.value;

  goToStep('form');
});

document.getElementById('toConfirmBtn').addEventListener('click', () => {
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const card = document.getElementById('cardNumber').value;

  if (!fullName || !email || !phone || !card) {
    alert('Заполните все поля');
    return;
  }

  Object.assign(dealDraft, {
    fullName,
    email,
    phone,
    cardNumber: card
  });

  document.getElementById('confirmData').innerHTML = `
    <p>${dealDraft.fromCurrency} → ${dealDraft.toCurrency}</p>
    <p>${dealDraft.fromAmount} → ${dealDraft.toAmount}</p>
    <p>${dealDraft.fullName}</p>
    <p>${dealDraft.email}</p>
    <p>${dealDraft.phone}</p>
    <p>${dealDraft.cardNumber}</p>
  `;

  goToStep('confirm');
});

document.getElementById('confirmDealBtn').addEventListener('click', async () => {

  const response = await fetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromCurrency: dealDraft.fromCurrency,
      toCurrency: dealDraft.toCurrency,
      fromAmount: dealDraft.fromAmount,
      toAmount: dealDraft.toAmount,
      fullName: dealDraft.fullName,
      email: dealDraft.email,
      phone: dealDraft.phone,
      cardNumber: dealDraft.cardNumber
    })
  });

  const result = await response.json();

  // 🔐 СОХРАНЯЕМ ОДИН РАЗ
  dealDraft.dealId = result.dealId;
  dealDraft.dealNumber = result.dealNumber;
  dealDraft.status = result.status;

  console.log('CREATED DEAL:', dealDraft);

  goToStep('payment');
});


document.getElementById('paidBtn').addEventListener('click', async () => {

  await fetch(`/api/deals/${dealDraft.dealId}/paid`, {
    method: 'POST'
  });

  dealDraft.status = 'paid';

  document.getElementById('finalDealNumber').innerText =
      `Номер заявки: ${dealDraft.dealNumber}`;

  goToStep('success');
});





