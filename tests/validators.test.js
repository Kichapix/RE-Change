const {
    getDigits,
    validateEmail,
    validatePhone,
    validateCardNumber
} = require('../utils/validators');

describe('getDigits', () => {
    test('удаляет все нецифровые символы', () => {
        expect(getDigits('+7 999 123-45-67')).toBe('79991234567');
    });

    test('возвращает пустую строку для букв', () => {
        expect(getDigits('abc')).toBe('');
    });
});

describe('validateEmail', () => {
    test('корректный email', () => {
        expect(validateEmail('test@example.com')).toBe(true);
    });

    test('email без @', () => {
        expect(validateEmail('testexample.com')).toBe(false);
    });
});

describe('validatePhone', () => {
    test('корректный номер телефона', () => {
        expect(validatePhone('+7 999 123-45-67')).toBe(true);
    });

    test('некорректный номер телефона', () => {
        expect(validatePhone('7999123456')).toBe(false);
    });
});

describe('validateCardNumber', () => {
    test('корректный номер карты', () => {
        expect(validateCardNumber('1234 5678 9012 3456')).toBe(true);
    });

    test('некорректная длина номера карты', () => {
        expect(validateCardNumber('1234')).toBe(false);
    });
});


