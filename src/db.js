'use strict';

const { DatabaseSync } = require('node:sqlite');

// Base SQLite en mémoire : repart de zéro à chaque démarrage du conteneur.
const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE products (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL
  );

  CREATE TABLE basket_items (
    user_id    INTEGER NOT NULL REFERENCES users(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity   INTEGER NOT NULL,
    PRIMARY KEY (user_id, product_id)
  );
`);

const CATALOGUE = [
  [1, 'Clavier mécanique', 'Clavier filaire, switches rouges, rétroéclairé.', 8990],
  [2, 'Souris sans fil', 'Souris ergonomique 2,4 GHz, 6 boutons.', 2490],
  [3, 'Écran 27 pouces', 'Dalle IPS 2560x1440, 75 Hz.', 24900],
  [4, 'Casque audio', 'Casque fermé avec microphone antibruit.', 5990],
  [5, 'Webcam HD', 'Webcam 1080p avec cache de confidentialité.', 3990],
  [6, 'Hub USB-C', 'Hub 7 ports : HDMI, USB-A, lecteur SD.', 4490],
  [7, 'Câble HDMI', 'Câble HDMI 2.1, 2 mètres.', 1290],
  [8, 'Tapis de souris', 'Tapis XL antidérapant, 90x40 cm.', 1990],
  [9, 'Support pour ordinateur portable', 'Support aluminium réglable en hauteur.', 3490],
  [10, 'Disque SSD 1 To', 'SSD NVMe interne, lecture 3500 Mo/s.', 7990],
  [11, 'Lampe de bureau', 'Lampe LED à intensité variable.', 2990],
  [12, 'Chaise ergonomique', 'Chaise à soutien lombaire réglable.', 18900],
];

const insertProduct = db.prepare(
  'INSERT INTO products (id, name, description, price_cents) VALUES (?, ?, ?, ?)',
);
for (const row of CATALOGUE) insertProduct.run(...row);

module.exports = db;
