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
  dealNumber: null
};

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

document.getElementById('confirmDealBtn').addEventListener('click', () => {
  document.getElementById('paymentAmount').innerText =
      `К оплате: ${dealDraft.fromAmount} ${dealDraft.fromCurrency}`;

  goToStep('payment');
});

document.getElementById('paidBtn').addEventListener('click', () => {
  goToStep('success');
});




