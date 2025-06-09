"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomNDigits = void 0;
const crypto_1 = require("crypto");
const generateRandomNDigits = (n) => {
    const min = Math.pow(10, n - 1);
    const max = Math.pow(10, n) - 1;
    return (0, crypto_1.randomInt)(min, max + 1);
};
exports.generateRandomNDigits = generateRandomNDigits;
