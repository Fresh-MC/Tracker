import CryptoJS from "crypto-js";

// AES encrypt/decrypt (for later)
export const encryptMessage = (msg, aesKey) => CryptoJS.AES.encrypt(msg, aesKey).toString();
export const decryptMessage = (ciphertext, aesKey) =>
  CryptoJS.AES.decrypt(ciphertext, aesKey).toString(CryptoJS.enc.Utf8);

// Generate ephemeral AES key (demo: random)
export const generateAESKey = () =>
  CryptoJS.lib.WordArray.random(16).toString();
