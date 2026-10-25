'use strict';

/**
 * Messages définis par la spécification (docs/spec.md, section « Messages »).
 * Ils sont servis au front via /config.js pour rester une source unique.
 */
module.exports = Object.freeze({
  EMAIL_INVALID: 'Adresse e-mail invalide.',
  EMAIL_TAKEN: 'Cette adresse e-mail est déjà utilisée.',
  PASSWORD_LENGTH: 'Le mot de passe doit contenir entre 8 et 40 caractères.',
  ACCOUNT_CREATED: 'Compte créé. Vous pouvez maintenant vous connecter.',
  INVALID_CREDENTIALS: 'Identifiants incorrects.',
  AUTH_REQUIRED: 'Authentification requise.',
  INVALID_TOKEN: 'Jeton invalide ou expiré.',
  FORBIDDEN: 'Accès refusé.',
  PRODUCT_NOT_FOUND: 'Produit introuvable.',
  INVALID_QUANTITY: 'Quantité invalide (entier de 1 à 99).',
  ITEM_NOT_IN_BASKET: "Ce produit n'est pas dans le panier.",
  INVALID_USER_ID: 'Identifiant utilisateur invalide.',
  INVALID_JSON: 'Corps de requête JSON invalide.',
  PAYLOAD_TOO_LARGE: 'Requête trop volumineuse.',
  NOT_FOUND: 'Ressource introuvable.',
  INTERNAL_ERROR: 'Erreur interne du serveur.',
  BASKET_EMPTY: 'Votre panier est vide.',
  NO_RESULTS: 'Aucun produit trouvé.',
  LOGIN_REQUIRED: 'Veuillez vous connecter pour voir votre panier.',
});
