'use strict';

const express = require('express');

const { isBugActive } = require('../config');
const db = require('../db');

const router = express.Router();

const SELECT_PRODUCTS = 'SELECT id, name, description, price_cents FROM products';

function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
  };
}

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// GET /api/products?q=texte : recherche insensible à la casse sur le nom.
// Les caractères spéciaux sont traités comme du texte ordinaire.
router.get('/', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  let rows;

  if (isBugActive('BUG-007')) {
    // BUG-007 (volontaire) : le texte saisi devient une expression régulière.
    // « ( », « [ » ou « * » lèvent une SyntaxError => 500 avec trace de pile.
    const pattern = new RegExp(q, 'i');
    rows = db
      .prepare(`${SELECT_PRODUCTS} ORDER BY id`)
      .all()
      .filter((row) => pattern.test(row.name));
  } else {
    rows = db
      .prepare(`${SELECT_PRODUCTS} WHERE name LIKE ? ESCAPE '\\' ORDER BY id`)
      .all(`%${escapeLike(q)}%`);
  }

  res.json({ query: q, count: rows.length, products: rows.map(toProduct) });
});

module.exports = router;
