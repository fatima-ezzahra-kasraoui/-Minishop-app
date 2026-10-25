'use strict';

const { isBugActive } = require('../config');
const { ApiError } = require('../errors');
const messages = require('../messages');

function notFound(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND'));
}

// Express reconnaît un gestionnaire d'erreur à ses quatre paramètres.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({ code: err.code, message: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 'INVALID_JSON', message: messages.INVALID_JSON });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ code: 'PAYLOAD_TOO_LARGE', message: messages.PAYLOAD_TOO_LARGE });
  }

  console.error(err);
  const body = { code: 'INTERNAL_ERROR', message: messages.INTERNAL_ERROR };
  // BUG-007 (volontaire) : la trace de pile est renvoyée au client.
  if (isBugActive('BUG-007')) body.stack = err.stack;
  return res.status(500).json(body);
}

module.exports = { notFound, errorHandler };
