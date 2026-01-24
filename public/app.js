document.addEventListener('DOMContentLoaded', () => {

  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();

    if (tg.themeParams) {
      document.documentElement.style.setProperty(
          '--tg-bg',
          tg.themeParams.bg_color || '#f5f6f8'
      );

      document.documentElement.style.setProperty(
          '--tg-button',
          tg.themeParams.button_color || '#2f80ed'
      );

      document.documentElement.style.setProperty(
          '--tg-button-text',
          tg.themeParams.button_text_color || '#ffffff'
      );
    }
  }

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

function getDigits(value) {
  return value.replace(/\D/g, '');
}

const validators = {
  fullName: v => /^[А-Яа-яA-Za-z\s]{2,}$/.test(v),
  email: v => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v),
  phone: v => {
    const digits = getDigits(v);
    return digits.length === 11 && digits.startsWith('7');
  },
  cardNumber: v => getDigits(v).length === 16
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
  let digits = getDigits(e.target.value);

  // максимум 16 цифр
  digits = digits.slice(0, 16);

  // формат 0000 0000 0000 0000
  const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');

  e.target.value = formatted;

  validateForm();
});

const phoneInput = document.getElementById('phone');

// при фокусе — если пусто, ставим +7
phoneInput.addEventListener('input', (e) => {
  let digits = getDigits(e.target.value);

  // всегда начинаем с 7
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  if (!digits.startsWith('7')) {
    digits = '7' + digits;
  }

  // максимум 11 цифр
  digits = digits.slice(0, 11);

  let formatted = '+7';

  if (digits.length > 1) {
    formatted += ' ' + digits.slice(1, 4);
  }
  if (digits.length >= 5) {
    formatted += ' ' + digits.slice(4, 7);
  }
  if (digits.length >= 8) {
    formatted += '-' + digits.slice(7, 9);
  }
  if (digits.length >= 10) {
    formatted += '-' + digits.slice(9, 11);
  }

  e.target.value = formatted;
  validateForm();
});

// Доступные валюты
const currencies = ['RUB', 'USD', 'EUR'];

// DOM элементы
const fromInput = document.querySelectorAll('.amount-input')[0];
const toInput = document.querySelectorAll('.amount-input')[1];

fromInput.addEventListener('input', () => {
  let value = parseFloat(fromInput.value);

  if (isNaN(value) || value <= 0) {
    fromInput.value = '';
    dealDraft.fromAmount = null;
    return;
  }

  dealDraft.fromAmount = value;
  recalculate();
});

toInput.addEventListener('input', () => {
  let value = parseFloat(toInput.value);

  if (isNaN(value) || value <= 0) {
    toInput.value = '';
    dealDraft.toAmount = null;
    return;
  }

  dealDraft.toAmount = value;
  recalculate();
});

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

fromCurrencyBtn.addEventListener('pointerdown', () => {
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

toCurrencyBtn.addEventListener('pointerdown', () => {
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

document.getElementById('toFormBtn').addEventListener('pointerdown', () => {
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

document.getElementById('toConfirmBtn').addEventListener('pointerdown', () => {
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

document.getElementById('confirmDealBtn').addEventListener('pointerdown', async () => {

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


document.getElementById('paidBtn').addEventListener('pointerdown', async () => {

  await fetch(`/api/deals/${dealDraft.dealId}/paid`, {
    method: 'POST'
  });

  dealDraft.status = 'paid';

  document.getElementById('finalDealNumber').innerText =
      `Номер заявки: ${dealDraft.dealNumber}`;

  goToStep('success');
});
});





