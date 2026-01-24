let ratesToRUB = {};

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



