'use strict';

const crypto = require('node:crypto');

const KEY_LENGTH = 64;

/** Hache un mot de passe avec scrypt. Format stocké : sel:empreinte (hexadécimal). */
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [saltHex, hashHex] = String(stored).split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
