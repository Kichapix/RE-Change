function getDigits(value) {
    return value.replace(/\D/g, '');
}

function validateEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function validatePhone(phone) {
    const digits = getDigits(phone);
    return digits.length === 11 && digits.startsWith('7');
}

function validateCardNumber(cardNumber) {
    return getDigits(cardNumber).length === 16;
}

module.exports = {
    getDigits,
    validateEmail,
    validatePhone,
    validateCardNumber
};