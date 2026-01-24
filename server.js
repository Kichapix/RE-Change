const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const xml2js = require('xml2js');
const path = require('path');

const app = express();
const PORT = 3000;

// ---------- DATABASE ----------
const db = new sqlite3.Database('./db/database.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS currency_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency_code TEXT,
      rate_to_rub REAL,
      loaded_at TEXT
    )
  `);
});

// ---------- FETCH RATES FROM CBR ----------
async function loadRatesFromCBR() {
  const url = 'https://www.cbr.ru/scripts/XML_daily.asp';
  const response = await axios.get(url);
  const data = await xml2js.parseStringPromise(response.data);

  const date = new Date().toISOString();

  const currencies = data.ValCurs.Valute;

  const rates = {
    RUB: 1
  };

  currencies.forEach(valute => {
    const code = valute.CharCode[0];
    const value = parseFloat(valute.Value[0].replace(',', '.'));
    const nominal = parseInt(valute.Nominal[0]);

    if (code === 'USD' || code === 'EUR') {
      rates[code] = value / nominal;
    }
  });

  for (const code in rates) {
    db.run(
        `INSERT INTO currency_rates (currency_code, rate_to_rub, loaded_at)
       VALUES (?, ?, ?)`,
        [code, rates[code], date]
    );
  }

  console.log('Rates loaded from CBR:', rates);
  return rates;
}

let currentRates = {};

// ---------- SERVER START ----------
(async () => {
  currentRates = await loadRatesFromCBR();

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/rates', (req, res) => {
    res.json(currentRates);
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
