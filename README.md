# minishop-app

Petite boutique web (Node.js, Express, SQLite en mémoire, front sans framework) écrite pour servir de **banc d'essai QA**. Elle existe en deux modes :

| Mode | Comportement |
|---|---|
| `BUGS=off` (défaut) | Application conforme à [`docs/spec.md`](docs/spec.md) |
| `BUGS=on` | 8 défauts volontaires activés |
| `BUGS=BUG-002,BUG-004` | Seulement les défauts listés |

> **Application d'entraînement, à ne jamais déployer publiquement.** Avec `BUGS=on`, elle contient volontairement des failles (IDOR, XSS, fuite de trace de pile...). Elle est conçue pour tourner en local ou dans la CI.

Les tests automatisés vivent dans le dépôt `minishop-tests`.

## Démarrer

### Avec Docker

```bash
docker build -t minishop-app .
docker run --rm -p 3000:3000 -e BUGS=off minishop-app     # conforme
docker run --rm -p 3000:3000 -e BUGS=on  minishop-app     # avec défauts
```

L'image est publiée par la CI sur `ghcr.io/<utilisateur>/minishop-app` (voir `.github/workflows/docker-publish.yml`).

### Sans Docker

Node.js 22.13 ou plus est requis (le module `node:sqlite` est intégré, aucune compilation native).

```bash
npm ci
npm start                 # BUGS=off
BUGS=on npm start         # avec défauts (PowerShell : $env:BUGS="on"; npm.cmd start)
```

Puis ouvrir <http://localhost:3000>.

## Vérifier le mode actif

```bash
curl http://localhost:3000/api/health
# {"status":"ok","bugs":{"mode":"off","active":[]}}
```

La suite de tests lit cette route au démarrage pour refuser de tourner si l'application n'est pas dans le mode annoncé.

## Défauts volontaires

| Réf. | Défaut | Où |
|---|---|---|
| BUG-001 | compteur du mot de passe : `/20` au lieu de `/40` | `public/app.js` |
| BUG-002 | mot de passe trop court accepté par le serveur | `src/validation.js` |
| BUG-003 | e-mail sans point dans le domaine accepté (`a@g`) | `src/validation.js`, `public/app.js` |
| BUG-004 | `GET /api/basket/:userId` sans contrôle du propriétaire (IDOR) | `src/routes/basket.js` |
| BUG-005 | `GET /api/basket/:userId` sans jeton | `src/routes/basket.js` |
| BUG-006 | titre de recherche injecté en HTML brut (XSS réfléchi) | `public/app.js` |
| BUG-007 | caractère spécial dans la recherche : 500 avec trace de pile | `src/routes/products.js`, `src/middleware/error-handler.js` |
| BUG-008 | en-têtes de sécurité absents, `X-Powered-By` présent | `src/app.js` |

Chaque défaut est repérable dans le code par un commentaire `BUG-00X (volontaire)`.

## Structure

```
minishop-app/
├── src/
│   ├── server.js            point d'entrée
│   ├── app.js               assemblage Express
│   ├── config.js            modes BUGS, secret JWT
│   ├── db.js                schéma SQLite en mémoire et catalogue
│   ├── validation.js        règles e-mail et mot de passe
│   ├── passwords.js         hachage scrypt
│   ├── messages.js          messages de la spécification
│   ├── errors.js            ApiError
│   ├── middleware/          auth, en-têtes de sécurité, gestion d'erreurs
│   └── routes/              auth, products, basket
├── public/                  front (index.html, app.js, style.css) avec des data-testid
├── docs/spec.md             spécification
├── Dockerfile
└── .github/workflows/       build et publication de l'image
```

## Limites

- Les données sont en mémoire : tout disparaît à l'arrêt.
- Le jeton JWT est conservé dans `localStorage` côté front, ce qui est acceptable pour un banc d'essai mais pas pour une vraie application.
- Pas de limitation de débit ni de protection CSRF : hors périmètre.
