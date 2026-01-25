const fc = require('fast-check');
const { getDigits, validateEmail } = require('../utils/validators');

describe('Property-based tests', () => {

    test('getDigits возвращает строку, содержащую только цифры', () => {
        fc.assert(
            fc.property(fc.string(), (input) => {
                const result = getDigits(input);
                return /^[0-9]*$/.test(result);
            })
        );
    });

    test('email без символа @ всегда невалиден', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => !s.includes('@')),
                (email) => validateEmail(email) === false
            )
        );
    });

});