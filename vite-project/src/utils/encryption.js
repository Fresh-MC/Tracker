import CryptoJS from "crypto-js";

// For demo purposes, we use a static key per channel
// ⚠️ In production, generate per-channel keys and exchange securely
const CHANNEL_KEYS = {}; // e.g., { "teamId:channelId": "secretkey123" }

export function getKey(roomKey) {
  if (!CHANNEL_KEYS[roomKey]) {
    // generate a random key for the room
    CHANNEL_KEYS[roomKey] = CryptoJS.lib.WordArray.random(16).toString();
  }
  return CHANNEL_KEYS[roomKey];
}

export function encryptMessage(message, roomKey) {
  const key = getKey(roomKey);
  return CryptoJS.AES.encrypt(message, key).toString();
}

export function decryptMessage(ciphertext, roomKey) {
  const key = getKey(roomKey);
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
