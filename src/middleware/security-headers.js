'use strict';

/**
 * En-têtes de sécurité. Désactivé quand BUG-008 est actif
 * (voir app.js) : c'est précisément ce que le défaut simule.
 *
 * Les directives CSP base-uri, form-action et frame-ancestors n'héritent pas de
 * default-src : il faut les déclarer explicitement (alerte ZAP « CSP: Failure to
 * Define Directive with No Fallback »).
 * Les en-têtes Cross-Origin-* isolent le document : l'application ne charge rien
 * d'une autre origine, ces valeurs strictes sont sans effet sur son fonctionnement.
 */
function securityHeaders(_req, res, next) {
  res.set({
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; " +
      "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
  });
  next();
}

module.exports = { securityHeaders };
