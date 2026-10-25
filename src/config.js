'use strict';

const crypto = require('node:crypto');

/**
 * Défauts volontaires disponibles dans le banc d'essai.
 * Chaque identifiant correspond à un rapport dans minishop-tests/docs/bugs/.
 */
const KNOWN_BUGS = Object.freeze([
  'BUG-001', // UI : compteur du mot de passe affiche /20 au lieu de /40
  'BUG-002', // validation serveur : mot de passe trop court accepté
  'BUG-003', // validation : e-mail sans extension de domaine accepté
  'BUG-004', // contrôle d'accès : GET /api/basket/:userId sans vérification du propriétaire (IDOR)
  'BUG-005', // authentification : GET /api/basket/:userId accessible sans jeton
  'BUG-006', // injection : le titre de la recherche est injecté en HTML brut (XSS)
  'BUG-007', // robustesse : entrée spéciale dans la recherche => 500 avec trace
  'BUG-008', // configuration : en-têtes de sécurité absents
]);

/**
 * BUGS=off (défaut)            => aucun défaut
 * BUGS=on                      => tous les défauts
 * BUGS=BUG-002,BUG-004         => uniquement ceux de la liste
 */
function parseBugs(raw) {
  const value = String(raw ?? 'off').trim().toLowerCase();
  if (value === '' || value === 'off') return new Set();
  if (value === 'on') return new Set(KNOWN_BUGS);

  const requested = value
    .split(',')
    .map((id) => id.trim().toUpperCase())
    .filter(Boolean);
  const unknown = requested.filter((id) => !KNOWN_BUGS.includes(id));
  if (unknown.length > 0) {
    throw new Error(
      `Valeur BUGS invalide (${unknown.join(', ')}). ` +
        'Valeurs admises : on, off, ou une liste comme BUG-002,BUG-004.',
    );
  }
  return new Set(requested);
}

const activeBugs = parseBugs(process.env.BUGS);

function bugsMode() {
  if (activeBugs.size === 0) return 'off';
  if (activeBugs.size === KNOWN_BUGS.length) return 'on';
  return 'custom';
}

module.exports = Object.freeze({
  PORT: Number(process.env.PORT) || 3000,
  // Pas de secret dans le dépôt : sans variable d'environnement, un secret
  // aléatoire est généré à chaque démarrage (les jetons expirent au redémarrage).
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  JWT_EXPIRES_IN: '1h',
  KNOWN_BUGS,
  activeBugs,
  isBugActive: (id) => activeBugs.has(id),
  bugsMode,
});
