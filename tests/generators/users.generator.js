const { faker } = require('@faker-js/faker');

function generateValidUser() {
    return {
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: '+7' + faker.string.numeric(10),
        cardNumber: faker.finance.creditCardNumber('#### #### #### ####')
    };
}

function generateInvalidUser() {
    return {
        fullName: faker.string.alphanumeric({ length: 8 }),
        email: faker.word.words(1) + '.com',
        phone: faker.string.numeric({ length: 5 }),
        cardNumber: faker.string.numeric({ length: 4 })
    };
}

console.log(generateValidUser());
console.log(generateInvalidUser());

module.exports = {
    generateValidUser,
    generateInvalidUser
};