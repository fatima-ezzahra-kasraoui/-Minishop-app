'use strict';

const path = require('node:path');
const express = require('express');

const { KNOWN_BUGS, activeBugs, bugsMode, isBugActive } = require('./config');
const messages = require('./messages');
const { errorHandler, notFound } = require('./middleware/error-handler');
const { securityHeaders } = require('./middleware/security-headers');
const authRoutes = require('./routes/auth');
const basketRoutes = require('./routes/basket');
const productRoutes = require('./routes/products');
const { PASSWORD_MAX, PASSWORD_MIN } = require('./validation');

function createApp() {
  const app = express();

  // BUG-008 (volontaire) : sans ce bloc, ni en-têtes de sécurité ni masquage de X-Powered-By.
  if (!isBugActive('BUG-008')) {
    app.disable('x-powered-by');
    app.use(securityHeaders);
  }

  app.use(express.json({ limit: '10kb' }));

  // Configuration injectée dans le front : messages de la spec + indicateurs de défauts.
  app.get('/config.js', (_req, res) => {
    const bugs = Object.fromEntries(KNOWN_BUGS.map((id) => [id, activeBugs.has(id)]));
    const config = { messages, bugs, password: { min: PASSWORD_MIN, max: PASSWORD_MAX } };
    res
      .type('application/javascript')
      .set('Cache-Control', 'no-store')
      .send(`window.MINISHOP = ${JSON.stringify(config)};`);
  });

  // Les tests s'en servent pour vérifier que l'application tourne dans le bon mode.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', bugs: { mode: bugsMode(), active: [...activeBugs].sort() } });
  });

  app.use('/api', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/basket', basketRoutes);
  app.use('/api', notFound);

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
