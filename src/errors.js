'use strict';

const messages = require('./messages');

/** Erreur « métier » : statut HTTP + code stable + message de la spécification. */
class ApiError extends Error {
  constructor(status, code) {
    super(messages[code] ?? code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

module.exports = { ApiError };
