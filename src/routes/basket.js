'use strict';

const express = require('express');

const { isBugActive } = require('../config');
const db = require('../db');
const { ApiError } = require('../errors');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

const MAX_QUANTITY = 99;

function readBasket(userId) {
  const rows = db
    .prepare(
      `SELECT p.id AS product_id, p.name, p.price_cents, b.quantity
         FROM basket_items b
         JOIN products p ON p.id = b.product_id
        WHERE b.user_id = ?
        ORDER BY p.id`,
    )
    .all(userId);

  const items = rows.map((row) => ({
    productId: row.product_id,
    name: row.name,
    priceCents: row.price_cents,
    quantity: row.quantity,
    lineTotalCents: row.price_cents * row.quantity,
  }));
  const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return { userId, items, totalCents };
}

function parseId(value, code) {
  if (!/^\d+$/.test(String(value))) throw new ApiError(400, code);
  return Number(value);
}

// BUG-005 (volontaire) : la lecture du panier n'exige plus de jeton.
const authForRead = isBugActive('BUG-005') ? optionalAuth : requireAuth;

// POST /api/basket/items { productId, quantity? } : ajoute au panier de l'utilisateur connecté.
router.post('/items', requireAuth, (req, res) => {
  const { productId, quantity = 1 } = req.body ?? {};

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new ApiError(400, 'INVALID_QUANTITY');
  }
  if (!Number.isInteger(productId)) throw new ApiError(404, 'PRODUCT_NOT_FOUND');
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND');

  const current = db
    .prepare('SELECT quantity FROM basket_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, productId);
  const newQuantity = (current ? current.quantity : 0) + quantity;
  if (newQuantity > MAX_QUANTITY) throw new ApiError(400, 'INVALID_QUANTITY');

  db.prepare(
    `INSERT INTO basket_items (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = excluded.quantity`,
  ).run(req.user.id, productId, newQuantity);

  res.json(readBasket(req.user.id));
});

// DELETE /api/basket/items/:productId : retire la ligne du panier de l'utilisateur connecté.
router.delete('/items/:productId', requireAuth, (req, res) => {
  const productId = parseId(req.params.productId, 'PRODUCT_NOT_FOUND');
  const result = db
    .prepare('DELETE FROM basket_items WHERE user_id = ? AND product_id = ?')
    .run(req.user.id, productId);
  if (result.changes === 0) throw new ApiError(404, 'ITEM_NOT_IN_BASKET');
  res.status(204).end();
});

// GET /api/basket/:userId : un panier n'est visible que par son propriétaire.
router.get('/:userId', authForRead, (req, res) => {
  const userId = parseId(req.params.userId, 'INVALID_USER_ID');

  // BUG-004 (volontaire) : le contrôle du propriétaire est supprimé (IDOR).
  if (!isBugActive('BUG-004') && req.user && req.user.id !== userId) {
    throw new ApiError(403, 'FORBIDDEN');
  }

  res.json(readBasket(userId));
});

module.exports = router;
