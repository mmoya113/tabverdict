import test from "node:test";
import assert from "node:assert/strict";

const listenerBox = { listener: null };
const metaValues = new Map([
  ['meta[property="og:title"]', "Fallback title"],
  ['meta[property="og:image"]', "https://example.com/image.jpg"]
]);
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Structured Camera",
  image: "https://example.com/camera.jpg",
  offers: { "@type": "Offer", price: "1.249,50", priceCurrency: "EUR" },
  aggregateRating: { ratingValue: "4.8", reviewCount: "91" }
};

function element(value, attributes = {}) {
  return {
    textContent: value,
    getAttribute: (name) => attributes[name] ?? (name === "content" ? value : null),
    querySelectorAll: () => [],
    nextElementSibling: null,
    matches: () => false
  };
}

globalThis.location = { href: "https://example.com/camera", hostname: "www.example.com" };
globalThis.document = {
  title: "Document title",
  querySelector(selector) {
    return metaValues.has(selector) ? element(metaValues.get(selector)) : null;
  },
  querySelectorAll(selector) {
    if (selector === 'script[type="application/ld+json"]') return [element(JSON.stringify(jsonLd))];
    return [];
  }
};
globalThis.getComputedStyle = () => ({ display: "block", visibility: "visible" });
globalThis.chrome = {
  runtime: {
    onMessage: { addListener: (listener) => { listenerBox.listener = listener; } }
  }
};

await import("../src/lib/core.js");
await import("../src/content.js");

test("content capture prefers structured data and keeps provenance", async () => {
  assert.equal(typeof listenerBox.listener, "function");
  const response = await new Promise((resolve) => {
    listenerBox.listener({ type: "TABVERDICT_CAPTURE" }, {}, resolve);
  });
  assert.equal(response.ok, true);
  assert.equal(response.quality, "structured");
  assert.equal(response.product.title, "Structured Camera");
  assert.equal(response.product.price, 1249.5);
  assert.equal(response.product.site, "example.com");
  assert.equal(response.product.sources.price.method, "schema.org");
});
