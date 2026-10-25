'use strict';

/**
 * En-têtes de sécurité de base. Désactivé quand BUG-008 est actif
 * (voir app.js) : c'est précisément ce que le défaut simule.
 */
function securityHeaders(_req, res, next) {
  res.set({
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; " +
      "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  });
  next();
}

module.exports = { securityHeaders };
