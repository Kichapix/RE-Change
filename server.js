const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const xml2js = require('xml2js');
const path = require('path');

const app = express();
const PORT = 3000;

// DATABASE
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

(async () => {
  currentRates = await loadRatesFromCBR();

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/rates', (req, res) => {
    res.json(currentRates);
  });

  app.use(express.json());

  app.post('/api/deals', (req, res) => {
    const {
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      fullName,
      email,
      phone,
      cardNumber
    } = req.body;

    if (fromAmount <= 0 || toAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (
        !fromCurrency || !toCurrency ||
        !fromAmount || !toAmount ||
        !fullName || !email || !phone || !cardNumber
    ) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const dealNumber = generateDealNumber();
    const createdAt = new Date().toISOString();

    db.run(
        `
    INSERT INTO deals (
      deal_number,
      from_currency,
      to_currency,
      from_amount,
      to_amount,
      full_name,
      email,
      phone,
      card_number,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          dealNumber,
          fromCurrency,
          toCurrency,
          fromAmount,
          toAmount,
          fullName,
          email,
          phone,
          cardNumber,
          'created',
          createdAt
        ],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'DB error' });
          }

          res.json({
            dealId: this.lastID,
            dealNumber
          });
        }
    );
  });

  app.get('/api/debug/rates', (req, res) => {
    db.all(
        `SELECT * FROM currency_rates ORDER BY loaded_at DESC`,
        (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(rows);
        }
    );
  });

  app.get('/api/debug/deals', (req, res) => {
    db.all('SELECT * FROM deals', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  function generateDealNumber() {
    return 'RC-' + Date.now();
  }

  app.post('/api/deals/:id/paid', (req, res) => {
    const dealId = req.params.id;

    db.run(
        `UPDATE deals SET status = 'paid' WHERE id = ?`,
        [dealId],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'DB error' });
          }

          res.json({ success: true });
        }
    );
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
