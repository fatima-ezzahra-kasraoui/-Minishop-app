'use strict';

const { PORT, activeBugs, bugsMode } = require('./config');
const { createApp } = require('./app');

const server = createApp().listen(PORT, '0.0.0.0', () => {
  const mode = bugsMode();
  console.log(`MiniShop à l'écoute sur http://localhost:${PORT}`);
  console.log(
    mode === 'off'
      ? 'Mode BUGS=off : application conforme à la spécification.'
      : `Mode BUGS=${mode} : défauts volontaires actifs (${[...activeBugs].sort().join(', ')}).`,
  );
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
