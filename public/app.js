const statusEl = document.getElementById('status');
const button = document.getElementById('mainButton');

// Проверяем, есть ли Telegram WebApp
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;

  tg.ready();

  statusEl.innerText = 'Открыто внутри Telegram';
  button.innerText = 'Telegram работает';

  console.log('Telegram initData:', tg.initData);
} else {
  statusEl.innerText = 'Открыто в браузере (не Telegram)';
  button.innerText = 'Обычный браузер';
}

button.addEventListener('click', () => {
  alert('Кнопка работает');
});
