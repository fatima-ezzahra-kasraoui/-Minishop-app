'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { ApiError } = require('../errors');

function readBearerToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  return scheme && scheme.toLowerCase() === 'bearer' && token ? token : null;
}

function decode(token) {
  const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  return { id: Number(payload.sub), email: payload.email };
}

/** Exige un jeton valide : 401 AUTH_REQUIRED sans jeton, 401 INVALID_TOKEN sinon. */
function requireAuth(req, _res, next) {
  const token = readBearerToken(req);
  if (!token) throw new ApiError(401, 'AUTH_REQUIRED');
  try {
    req.user = decode(token);
  } catch {
    throw new ApiError(401, 'INVALID_TOKEN');
  }
  next();
}

/** Identifie l'utilisateur si un jeton valide est fourni, sans jamais refuser. */
function optionalAuth(req, _res, next) {
  const token = readBearerToken(req);
  if (token) {
    try {
      req.user = decode(token);
    } catch {
      // jeton ignoré
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
