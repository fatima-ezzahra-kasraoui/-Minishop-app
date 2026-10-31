# MiniShop : spécification fonctionnelle

Version 1.0. Cette spécification décrit le comportement **attendu** de l'application. Elle sert de référence unique (l'oracle) pour les tests : une application en mode `BUGS=off` doit la respecter à la lettre.

## 1. Périmètre

MiniShop permet de créer un compte, de se connecter, de parcourir et rechercher des produits, puis de gérer un panier personnel. Il n'y a ni paiement, ni rôle administrateur.

## 2. User stories et critères d'acceptation

### US-01 : Inscription

*En tant que visiteur, je veux créer un compte avec mon e-mail et un mot de passe.*

- **AC-01.1** *Given* un formulaire d'inscription vide, *When* je saisis un e-mail valide et un mot de passe de 8 à 40 caractères puis je valide, *Then* le message « Compte créé. Vous pouvez maintenant vous connecter. » s'affiche.
- **AC-01.2** *Given* un e-mail dont le domaine n'a pas de point (`a@g`), *When* je valide, *Then* le message « Adresse e-mail invalide. » s'affiche et aucun compte n'est créé.
- **AC-01.3** *Given* un mot de passe de moins de 8 ou de plus de 40 caractères, *When* je valide, *Then* le message « Le mot de passe doit contenir entre 8 et 40 caractères. » s'affiche et aucun compte n'est créé.
- **AC-01.4** *Given* un e-mail déjà inscrit (casse ignorée), *When* je valide, *Then* le message « Cette adresse e-mail est déjà utilisée. » s'affiche.
- **AC-01.5** *Given* que je saisis un mot de passe, *When* je tape, *Then* un compteur affiche `longueur/40`.
- **AC-01.6** *Given* une requête d'inscription envoyée directement à l'API, *When* elle viole une règle de validation, *Then* le serveur la refuse comme le fait l'interface (la validation client ne dispense jamais de la validation serveur).

### US-02 : Connexion

*En tant qu'utilisateur inscrit, je veux me connecter pour accéder à mon panier.*

- **AC-02.1** *Given* un compte existant, *When* je saisis les bons identifiants, *Then* je suis connecté, l'état affiche « Connecté : *e-mail* » et l'API me remet un jeton JWT valable 1 heure.
- **AC-02.2** *Given* un mauvais mot de passe **ou** un e-mail inconnu, *When* je valide, *Then* le même message « Identifiants incorrects. » s'affiche (on ne révèle pas si l'e-mail existe).
- **AC-02.3** *Given* que je suis connecté, *When* je clique sur « Déconnexion », *Then* l'état redevient « Non connecté ».

### US-03 : Liste des produits

*En tant que visiteur, je veux voir le catalogue.*

- **AC-03.1** *Given* que j'ouvre l'application, *When* la page est chargée, *Then* les 12 produits du catalogue s'affichent avec nom, description et prix, sous le titre « Tous les produits ».

### US-04 : Recherche

*En tant que visiteur, je veux filtrer les produits par texte.*

- **AC-04.1** *Given* le catalogue, *When* je recherche un texte, *Then* seuls les produits dont le nom contient ce texte (casse ignorée) s'affichent, sous le titre « Résultats pour : *texte* ».
- **AC-04.2** *Given* une recherche sans résultat, *Then* le message « Aucun produit trouvé. » s'affiche.
- **AC-04.3** *Given* un texte contenant des caractères spéciaux (`(`, `[`, `*`, `%`, `<`, `'`...), *Then* ils sont traités comme du texte ordinaire : pas d'erreur, pas d'interprétation, et le titre affiche le texte tel quel (jamais interprété comme du HTML).

### US-05 : Ajouter et retirer des produits

*En tant qu'utilisateur connecté, je veux gérer mon panier.*

- **AC-05.1** *Given* que je suis connecté, *When* j'ajoute un produit, *Then* il apparaît dans mon panier avec la quantité 1 ; un nouvel ajout du même produit augmente la quantité.
- **AC-05.2** *Given* un produit dans mon panier, *When* je le retire, *Then* la ligne disparaît ; un panier vide affiche « Votre panier est vide. ».
- **AC-05.3** *Given* que je ne suis pas connecté, *When* j'ajoute un produit, *Then* le message « Authentification requise. » s'affiche.
- **AC-05.4** *Given* une quantité hors de l'intervalle 1 à 99 (ou non entière), *Then* la requête est refusée avec « Quantité invalide (entier de 1 à 99). ».

### US-06 : Consulter son panier (confidentialité)

*En tant qu'utilisateur, je veux que mon panier reste privé.*

- **AC-06.1** *Given* que je suis connecté, *When* je consulte mon panier, *Then* je vois mes lignes et le total (somme des prix × quantités).
- **AC-06.0** *Given* que je ne suis pas connecté, *When* j'ouvre la page « Panier », *Then* le message « Veuillez vous connecter pour voir votre panier. » s'affiche.
- **AC-06.2** *Given* que je ne présente aucun jeton, *When* je lis un panier, *Then* l'accès est refusé (401).
- **AC-06.3** *Given* que je suis connecté en tant que A, *When* je lis le panier de B, *Then* l'accès est refusé (403).
- **AC-06.4** *Given* un jeton falsifié, expiré ou signé avec un autre secret, *Then* l'accès est refusé (401).

## 3. Règles de validation

| Champ | Règle | Valeurs limites à tester |
|---|---|---|
| E-mail | Format `local@domaine.tld` ; le domaine contient au moins un point entouré de caractères ; pas d'espace ni de second `@` ; 254 caractères maximum ; espaces de début et de fin ignorés ; unicité sans tenir compte de la casse | `a@g` (refusé), `a@g.` (refusé), `a@.com` (refusé), `a@g.co` (accepté) |
| Mot de passe | 8 à 40 caractères, validé côté client **et** côté serveur ; type chaîne obligatoire | 0, 1, 7 (refusés) ; 8, 40 (acceptés) ; 41 (refusé) |
| Quantité | Entier de 1 à 99 ; le cumul d'une ligne ne dépasse pas 99 | 0, 1, 99, 100 |
| Recherche | Texte libre, traité littéralement | `(`, `[`, `*`, `%`, `<b>`, `'` |

L'e-mail est contrôlé **avant** le mot de passe : si les deux sont invalides, seule l'erreur d'e-mail est renvoyée.

## 4. Messages

| Code | Message |
|---|---|
| `EMAIL_INVALID` | Adresse e-mail invalide. |
| `EMAIL_TAKEN` | Cette adresse e-mail est déjà utilisée. |
| `PASSWORD_LENGTH` | Le mot de passe doit contenir entre 8 et 40 caractères. |
| `ACCOUNT_CREATED` | Compte créé. Vous pouvez maintenant vous connecter. |
| `INVALID_CREDENTIALS` | Identifiants incorrects. |
| `AUTH_REQUIRED` | Authentification requise. |
| `INVALID_TOKEN` | Jeton invalide ou expiré. |
| `FORBIDDEN` | Accès refusé. |
| `PRODUCT_NOT_FOUND` | Produit introuvable. |
| `INVALID_QUANTITY` | Quantité invalide (entier de 1 à 99). |
| `ITEM_NOT_IN_BASKET` | Ce produit n'est pas dans le panier. |
| `INVALID_USER_ID` | Identifiant utilisateur invalide. |
| `INVALID_JSON` | Corps de requête JSON invalide. |
| `BASKET_EMPTY` | Votre panier est vide. |
| `NO_RESULTS` | Aucun produit trouvé. |
| `LOGIN_REQUIRED` | Veuillez vous connecter pour voir votre panier. |
| `INTERNAL_ERROR` | Erreur interne du serveur. |

## 5. Contrat de l'API

Toutes les erreurs ont la forme `{ "code": "...", "message": "..." }`. Une erreur 500 ne contient **jamais** de trace de pile.

| Méthode et route | Auth | Succès | Erreurs |
|---|---|---|---|
| `POST /api/register` `{email, password}` | non | `201 {id, email}` (e-mail normalisé en minuscules, jamais de mot de passe ni d'empreinte) | `400 EMAIL_INVALID`, `400 PASSWORD_LENGTH`, `400 INVALID_JSON`, `409 EMAIL_TAKEN` |
| `POST /api/login` `{email, password}` | non | `200 {token, user:{id,email}}` | `401 INVALID_CREDENTIALS` |
| `GET /api/products?q=` | non | `200 {query, count, products[]}` | : |
| `GET /api/basket/:userId` | oui, propriétaire uniquement | `200 {userId, items[], totalCents}` | `401 AUTH_REQUIRED`, `401 INVALID_TOKEN`, `403 FORBIDDEN`, `400 INVALID_USER_ID` |
| `POST /api/basket/items` `{productId, quantity?}` | oui | `200` (panier mis à jour) | `401`, `400 INVALID_QUANTITY`, `404 PRODUCT_NOT_FOUND` |
| `DELETE /api/basket/items/:productId` | oui | `204` | `401`, `404 ITEM_NOT_IN_BASKET` |
| `GET /api/health` | non | `200 {status, bugs:{mode, active[]}}` (réservé à l'outillage de test) | : |

## 6. Exigences de sécurité

- **SEC-01** Les mots de passe sont stockés hachés (scrypt avec sel), jamais en clair.
- **SEC-02** Les jetons JWT sont signés en HS256 ; les jetons `alg: none` sont rejetés.
- **SEC-03** Chaque réponse HTTP porte les en-têtes `Content-Security-Policy` (avec `form-action`), `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy` et `Cross-Origin-Resource-Policy` ; `X-Powered-By` est absent.
- **SEC-04** Aucune donnée saisie par l'utilisateur n'est insérée comme HTML.
- **SEC-05** Les erreurs internes ne divulguent ni trace de pile ni chemin de fichier.

## 7. Catalogue

12 produits, identifiants 1 à 12 (Clavier mécanique, Souris sans fil, Écran 27 pouces, Casque audio, Webcam HD, Hub USB-C, Câble HDMI, Tapis de souris, Support pour ordinateur portable, Disque SSD 1 To, Lampe de bureau, Chaise ergonomique). Les prix sont exprimés en centimes.
