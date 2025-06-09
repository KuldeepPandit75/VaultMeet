import { randomInt } from "crypto";

export const generateRandomNDigits = (n: number) => {
    const min = Math.pow(10, n - 1);
    const max = Math.pow(10, n) - 1;
  
    return randomInt(min, max + 1);
  };