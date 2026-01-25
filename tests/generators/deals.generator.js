const { faker } = require('@faker-js/faker');

const ratesToRub = {
    RUB: 1,
    USD: 92,
    EUR: 101
};

function generateDeal() {
    const currencies = ['RUB', 'USD', 'EUR'];

    const fromCurrency = faker.helpers.arrayElement(currencies);
    const toCurrency = faker.helpers.arrayElement(
        currencies.filter(c => c !== fromCurrency)
    );

    const fromAmount = faker.number.int({ min: 1000, max: 100000 });

    const amountInRub = fromAmount * ratesToRub[fromCurrency];
    const toAmount = +(amountInRub / ratesToRub[toCurrency]).toFixed(2);

    return {
        dealNumber: `RC-${Date.now()}`,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        status: faker.helpers.arrayElement(['pending', 'paid']),
        createdAt: faker.date.recent().toISOString()
    };
}

console.log(generateDeal());

module.exports = { generateDeal };