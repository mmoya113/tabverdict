/* Local-only storage adapter. Uses chrome.storage in the extension and localStorage in the web demo. */
(function attachTabVerdictStore(root) {
  "use strict";

  if (root.TabVerdictStore) return;
  const Core = root.TabVerdictCore;
  if (!Core) throw new Error("TabVerdictCore must load before TabVerdictStore");

  const KEY = "tabverdict-state-v1";
  const MAX_PRODUCTS = 8;
  const defaults = () => ({
    schemaVersion: 1,
    products: [],
    criteria: Core.DEFAULT_CRITERIA.map((criterion) => ({ ...criterion, values: {} })),
    settings: { locale: "auto", reducedMotion: false },
    updatedAt: new Date().toISOString()
  });

  function canUseChromeStorage() {
    return Boolean(root.chrome?.storage?.local);
  }

  async function readRaw() {
    if (canUseChromeStorage()) {
      const result = await root.chrome.storage.local.get(KEY);
      return result[KEY] || null;
    }
    try {
      return JSON.parse(root.localStorage?.getItem(KEY) || "null");
    } catch {
      return null;
    }
  }

  async function writeRaw(state) {
    const snapshot = { ...state, updatedAt: new Date().toISOString() };
    if (canUseChromeStorage()) {
      await root.chrome.storage.local.set({ [KEY]: snapshot });
    } else {
      root.localStorage?.setItem(KEY, JSON.stringify(snapshot));
      root.dispatchEvent?.(new CustomEvent("tabverdict:storage", { detail: snapshot }));
    }
    return snapshot;
  }

  function normalizeState(value) {
    const base = defaults();
    if (!value || typeof value !== "object") return base;
    const products = Array.isArray(value.products)
      ? value.products.slice(0, MAX_PRODUCTS).map((product) => Core.normalizeProduct(product))
      : [];
    const criteria = Array.isArray(value.criteria) && value.criteria.length
      ? value.criteria.slice(0, 16).map(Core.normalizeCriterion)
      : base.criteria;
    return {
      ...base,
      ...value,
      products,
      criteria,
      settings: { ...base.settings, ...(value.settings || {}) }
    };
  }

  async function getState() {
    return normalizeState(await readRaw());
  }

  async function setState(next) {
    return writeRaw(normalizeState(next));
  }

  async function upsertProduct(rawProduct) {
    const state = await getState();
    const incoming = Core.normalizeProduct(rawProduct);
    const matchingIndex = state.products.findIndex((product) =>
      product.id === incoming.id || (incoming.url && product.url === incoming.url)
    );

    if (matchingIndex >= 0) {
      const previous = state.products[matchingIndex];
      const history = [...(previous.history || [])];
      if (previous.price !== incoming.price) {
        history.push({ at: new Date().toISOString(), price: previous.price, currency: previous.currency });
      }
      state.products[matchingIndex] = Core.normalizeProduct({
        ...previous,
        ...incoming,
        id: previous.id,
        createdAt: previous.createdAt,
        costs: previous.costs,
        notes: previous.notes,
        history: history.slice(-30)
      });
    } else {
      if (state.products.length >= MAX_PRODUCTS) {
        const error = new Error(`TabVerdict compares up to ${MAX_PRODUCTS} products at once.`);
        error.code = "MAX_PRODUCTS";
        throw error;
      }
      state.products.push(incoming);
    }
    return setState(state);
  }

  async function removeProduct(productId) {
    const state = await getState();
    const index = state.products.findIndex((product) => product.id === productId);
    if (index === -1) return { state, removed: null };
    const [removed] = state.products.splice(index, 1);
    state.criteria = state.criteria.map((criterion) => {
      const values = { ...(criterion.values || {}) };
      delete values[productId];
      return { ...criterion, values };
    });
    return { state: await setState(state), removed, index };
  }

  async function restoreProduct(product, index) {
    const state = await getState();
    if (state.products.some((item) => item.id === product.id)) return state;
    state.products.splice(Math.min(index ?? state.products.length, state.products.length), 0, product);
    return setState(state);
  }

  async function saveCriteria(criteria) {
    const state = await getState();
    state.criteria = criteria.map(Core.normalizeCriterion);
    return setState(state);
  }

  async function replaceProducts(products) {
    const state = await getState();
    state.products = products.slice(0, MAX_PRODUCTS).map(Core.normalizeProduct);
    return setState(state);
  }

  async function clearAll() {
    return setState(defaults());
  }

  async function importState(serialized) {
    const parsed = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.products)) {
      throw new Error("That file is not a TabVerdict v1 export.");
    }
    const current = await getState();
    return setState({ ...current, products: parsed.products, criteria: parsed.criteria || current.criteria });
  }

  function subscribe(callback) {
    if (canUseChromeStorage() && root.chrome.storage.onChanged) {
      const listener = (changes, area) => {
        if (area === "local" && changes[KEY]) callback(normalizeState(changes[KEY].newValue));
      };
      root.chrome.storage.onChanged.addListener(listener);
      return () => root.chrome.storage.onChanged.removeListener(listener);
    }
    const listener = (event) => {
      if (event.type === "tabverdict:storage") callback(normalizeState(event.detail));
      if (event.type === "storage" && event.key === KEY) callback(normalizeState(JSON.parse(event.newValue || "null")));
    };
    root.addEventListener?.("tabverdict:storage", listener);
    root.addEventListener?.("storage", listener);
    return () => {
      root.removeEventListener?.("tabverdict:storage", listener);
      root.removeEventListener?.("storage", listener);
    };
  }

  root.TabVerdictStore = Object.freeze({
    KEY,
    MAX_PRODUCTS,
    clearAll,
    defaults,
    getState,
    importState,
    removeProduct,
    replaceProducts,
    restoreProduct,
    saveCriteria,
    setState,
    subscribe,
    upsertProduct
  });
})(globalThis);
