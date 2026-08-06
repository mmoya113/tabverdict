import test from "node:test";
import assert from "node:assert/strict";

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key)
};
globalThis.dispatchEvent = () => true;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};

await import("../src/lib/core.js");
await import("../src/lib/storage.js");
const Store = globalThis.TabVerdictStore;

test.beforeEach(() => memory.clear());

test("stores products locally and keeps user-entered costs on recapture", async () => {
  let state = await Store.upsertProduct({
    title: "Product",
    url: "https://example.com/product",
    price: 100,
    costs: { shipping: 15, tax: 0, fees: 0, taxMode: "fixed" }
  });
  const id = state.products[0].id;
  state = await Store.upsertProduct({
    title: "Product renamed",
    url: "https://example.com/product",
    price: 90
  });

  assert.equal(state.products.length, 1);
  assert.equal(state.products[0].id, id);
  assert.equal(state.products[0].price, 90);
  assert.equal(state.products[0].costs.shipping, 15);
  assert.equal(state.products[0].history[0].price, 100);
});

test("removes and restores a product without losing its identity", async () => {
  let state = await Store.upsertProduct({ id: "one", title: "One", price: 1 });
  const result = await Store.removeProduct("one");
  assert.equal(result.state.products.length, 0);
  state = await Store.restoreProduct(result.removed, result.index);
  assert.equal(state.products[0].id, "one");
});

test("rejects incompatible imports", async () => {
  await assert.rejects(() => Store.importState('{"schemaVersion":2,"products":[]}'), /not a TabVerdict v1 export/);
});

test("limits a board to eight options", async () => {
  for (let index = 0; index < 8; index += 1) {
    await Store.upsertProduct({ id: `p-${index}`, title: `Product ${index}`, price: index });
  }
  await assert.rejects(
    () => Store.upsertProduct({ id: "p-9", title: "One too many", price: 9 }),
    (error) => error.code === "MAX_PRODUCTS"
  );
});
