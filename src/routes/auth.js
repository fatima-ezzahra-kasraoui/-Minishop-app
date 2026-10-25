'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');

const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const db = require('../db');
const { ApiError } = require('../errors');
const { hashPassword, verifyPassword } = require('../passwords');
const { normaliseEmail, validateEmail, validatePassword } = require('../validation');

const router = express.Router();

// POST /api/register : l'e-mail est contrôlé avant le mot de passe (cf. spec).
router.post('/register', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!validateEmail(email)) throw new ApiError(400, 'EMAIL_INVALID');
  if (!validatePassword(password)) throw new ApiError(400, 'PASSWORD_LENGTH');

  const normalised = normaliseEmail(email);
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalised);
  if (existing) throw new ApiError(409, 'EMAIL_TAKEN');

  const result = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(normalised, hashPassword(password));

  res.status(201).json({ id: Number(result.lastInsertRowid), email: normalised });
});

// POST /api/login : même réponse pour un e-mail inconnu et un mauvais mot de passe.
router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new ApiError(401, 'INVALID_CREDENTIALS');
  }

  const user = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(normaliseEmail(email));
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new ApiError(401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign({ sub: String(user.id), email: user.email }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN,
  });
  res.json({ token, user: { id: user.id, email: user.email } });
});

module.exports = router;
