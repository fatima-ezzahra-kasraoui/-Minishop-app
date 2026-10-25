(() => {
  'use strict';

  // Configuration servie par /config.js : messages de la spec et défauts actifs.
  const { messages, bugs, password: passwordRules } = window.MINISHOP;
  const bugActive = (id) => Boolean(bugs[id]);

  const SESSION_KEY = 'minishop.session';

  // ---------- Utilitaires ----------

  const $ = (testId) => document.querySelector(`[data-testid="${testId}"]`);

  function show(element, text) {
    element.textContent = text;
    element.hidden = false;
  }

  function hide(...elements) {
    for (const element of elements) {
      element.textContent = '';
      element.hidden = true;
    }
  }

  function formatPrice(cents) {
    return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
  }

  function createElement(tag, { className, text, testId, attributes } = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    if (testId) element.dataset.testid = testId;
    for (const [name, value] of Object.entries(attributes ?? {})) element.setAttribute(name, value);
    return element;
  }

  // ---------- Session ----------

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null;
    } catch {
      return null;
    }
  }

  let session = loadSession();

  function saveSession(next) {
    session = next;
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
    renderSession();
  }

  function renderSession() {
    $('user-status').textContent = session ? `Connecté : ${session.user.email}` : 'Non connecté';
    $('nav-logout').hidden = !session;
    $('nav-login').hidden = Boolean(session);
    $('nav-register').hidden = Boolean(session);
  }

  // ---------- API ----------

  async function api(path, { method = 'GET', body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && session) headers.Authorization = `Bearer ${session.token}`;

    const response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
  }

  // ---------- Navigation ----------

  const views = ['register', 'login', 'products', 'basket'];

  function showView(name) {
    for (const view of views) $(`view-${view}`).hidden = view !== name;
    if (name === 'basket') loadBasket();
  }

  document.querySelectorAll('nav [data-view]').forEach((button) => {
    button.addEventListener('click', () => showView(button.dataset.view));
  });

  $('nav-logout').addEventListener('click', () => {
    saveSession(null);
    showView('products');
  });

  // ---------- Validation côté client (miroir de la spec) ----------

  // Conforme : le domaine doit contenir au moins un point (a@b.co).
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  // BUG-003 (volontaire) : le point dans le domaine n'est plus exigé.
  const EMAIL_PATTERN_BUGGY = /^[^\s@]+@[^\s@]+$/;

  function isEmailValid(value) {
    const email = value.trim();
    if (email.length === 0 || email.length > 254) return false;
    return (bugActive('BUG-003') ? EMAIL_PATTERN_BUGGY : EMAIL_PATTERN).test(email);
  }

  function isPasswordValid(value) {
    return value.length >= passwordRules.min && value.length <= passwordRules.max;
  }

  // ---------- Inscription ----------

  const registerPassword = $('register-password');
  const passwordCounter = $('register-password-counter');

  // BUG-001 (volontaire) : le compteur affiche /20 alors que la limite réelle est 40.
  const counterLimit = bugActive('BUG-001') ? 20 : passwordRules.max;

  function updatePasswordCounter() {
    passwordCounter.textContent = `${registerPassword.value.length}/${counterLimit}`;
  }
  registerPassword.addEventListener('input', updatePasswordCounter);
  updatePasswordCounter();

  $('register-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const emailError = $('register-email-error');
    const passwordError = $('register-password-error');
    const formError = $('register-error');
    const success = $('register-success');
    const submit = $('register-submit');
    hide(emailError, passwordError, formError, success);

    const email = $('register-email').value;
    const password = registerPassword.value;

    let valid = true;
    if (!isEmailValid(email)) {
      show(emailError, messages.EMAIL_INVALID);
      valid = false;
    }
    if (!isPasswordValid(password)) {
      show(passwordError, messages.PASSWORD_LENGTH);
      valid = false;
    }
    if (!valid) return;

    submit.disabled = true; // évite les doubles soumissions
    try {
      const { ok, data } = await api('/api/register', { method: 'POST', body: { email, password } });
      if (ok) {
        show(success, messages.ACCOUNT_CREATED);
        $('register-form').reset();
        updatePasswordCounter();
      } else if (data?.code === 'EMAIL_INVALID' || data?.code === 'EMAIL_TAKEN') {
        show(emailError, data.message);
      } else if (data?.code === 'PASSWORD_LENGTH') {
        show(passwordError, data.message);
      } else {
        show(formError, data?.message ?? messages.INTERNAL_ERROR);
      }
    } finally {
      submit.disabled = false;
    }
  });

  // ---------- Connexion ----------

  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = $('login-error');
    const submit = $('login-submit');
    hide(error);

    submit.disabled = true;
    try {
      const { ok, data } = await api('/api/login', {
        method: 'POST',
        body: { email: $('login-email').value, password: $('login-password').value },
      });
      if (ok) {
        saveSession({ token: data.token, user: data.user });
        $('login-form').reset();
        showView('products');
      } else {
        show(error, data?.message ?? messages.INTERNAL_ERROR);
      }
    } finally {
      submit.disabled = false;
    }
  });

  // ---------- Produits et recherche ----------

  const productList = $('product-list');

  function renderProducts(products) {
    productList.replaceChildren();
    for (const product of products) {
      const item = createElement('li', { testId: 'product-item', attributes: { 'data-product-id': product.id } });
      item.append(
        createElement('span', { className: 'name', text: product.name, testId: 'product-name' }),
        createElement('span', { className: 'price', text: formatPrice(product.priceCents), testId: 'product-price' }),
        createElement('span', { className: 'description', text: product.description }),
      );
      const button = createElement('button', {
        text: 'Ajouter au panier',
        testId: `add-to-basket-${product.id}`,
        attributes: { type: 'button' },
      });
      button.addEventListener('click', () => addToBasket(product.id));
      item.append(button);
      productList.append(item);
    }
  }

  async function search(query) {
    const heading = $('search-heading');
    const count = $('search-count');
    hide($('products-message'));

    const { ok, data } = await api(`/api/products?q=${encodeURIComponent(query)}`);
    if (!ok) {
      show($('products-message'), data?.message ?? messages.INTERNAL_ERROR);
      return;
    }

    if (query === '') {
      heading.textContent = 'Tous les produits';
    } else if (bugActive('BUG-006')) {
      // BUG-006 (volontaire) : le texte saisi est injecté comme HTML brut (XSS réfléchi).
      heading.innerHTML = `Résultats pour : ${query}`;
    } else {
      heading.textContent = `Résultats pour : ${query}`;
    }

    renderProducts(data.products);
    count.textContent =
      data.count === 0 ? messages.NO_RESULTS : `${data.count} produit${data.count > 1 ? 's' : ''}`;
  }

  $('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    search($('search-input').value.trim());
  });

  // ---------- Panier ----------

  async function addToBasket(productId) {
    const message = $('products-message');
    hide(message);
    const { ok, data } = await api('/api/basket/items', {
      method: 'POST',
      body: { productId },
      auth: true,
    });
    if (!ok) show(message, data?.message ?? messages.INTERNAL_ERROR);
  }

  async function removeFromBasket(productId) {
    await api(`/api/basket/items/${productId}`, { method: 'DELETE', auth: true });
    loadBasket();
  }

  async function loadBasket() {
    const message = $('basket-message');
    const table = $('basket-table');
    const rows = $('basket-items');
    const total = $('basket-total');
    hide(total);
    table.hidden = true;
    rows.replaceChildren();

    if (!session) {
      show(message, messages.LOGIN_REQUIRED);
      return;
    }

    const { ok, data } = await api(`/api/basket/${session.user.id}`, { auth: true });
    if (!ok) {
      show(message, data?.message ?? messages.INTERNAL_ERROR);
      return;
    }
    if (data.items.length === 0) {
      show(message, messages.BASKET_EMPTY);
      return;
    }

    hide(message);
    for (const item of data.items) {
      const row = createElement('tr', { testId: 'basket-item', attributes: { 'data-product-id': item.productId } });
      const nameCell = createElement('td', { text: item.name, testId: 'basket-item-name' });
      const quantityCell = createElement('td', { text: String(item.quantity), testId: 'basket-item-quantity' });
      const totalCell = createElement('td', { text: formatPrice(item.lineTotalCents), testId: 'basket-item-total' });
      const actionCell = createElement('td');
      const remove = createElement('button', {
        text: 'Retirer',
        testId: `remove-${item.productId}`,
        attributes: { type: 'button' },
      });
      remove.addEventListener('click', () => removeFromBasket(item.productId));
      actionCell.append(remove);
      row.append(nameCell, quantityCell, totalCell, actionCell);
      rows.append(row);
    }
    table.hidden = false;
    show(total, `Total : ${formatPrice(data.totalCents)}`);
  }

  // ---------- Démarrage ----------

  renderSession();
  showView('products');
  search('');
})();
