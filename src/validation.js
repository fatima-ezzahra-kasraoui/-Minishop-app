'use strict';

const { isBugActive } = require('./config');

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 40;
const EMAIL_MAX = 254;

// Conforme : partie locale, @, puis un domaine avec au moins un point (a@b.co).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
// BUG-003 (volontaire) : on oublie d'exiger le point dans le domaine (a@g passe).
const EMAIL_PATTERN_BUGGY = /^[^\s@]+@[^\s@]+$/;

function normaliseEmail(email) {
  return email.trim().toLowerCase();
}

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const value = email.trim();
  if (value.length === 0 || value.length > EMAIL_MAX) return false;
  const pattern = isBugActive('BUG-003') ? EMAIL_PATTERN_BUGGY : EMAIL_PATTERN;
  return pattern.test(value);
}

function validatePassword(password) {
  if (typeof password !== 'string') return false;
  if (isBugActive('BUG-002')) {
    // BUG-002 (volontaire) : la borne minimale n'est plus contrôlée côté serveur.
    return password.length >= 1 && password.length <= PASSWORD_MAX;
  }
  return password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
}

module.exports = { normaliseEmail, validateEmail, validatePassword, PASSWORD_MIN, PASSWORD_MAX };
