import test from "node:test";
import assert from "node:assert/strict";

await import("../src/lib/core.js");
const Core = globalThis.TabVerdictCore;

test("parses common European and US money formats", () => {
  assert.equal(Core.parseMoney("1.299,99 €"), 1299.99);
  assert.equal(Core.parseMoney("$1,299.99"), 1299.99);
  assert.equal(Core.parseMoney("12,50 EUR"), 12.5);
  assert.equal(Core.parseMoney("1 299 €"), 1299);
  assert.equal(Core.parseMoney("not a price"), null);
});

test("detects currency without confusing prefixed dollar variants", () => {
  assert.equal(Core.detectCurrency("899,00 €"), "EUR");
  assert.equal(Core.detectCurrency("CA$ 699"), "CAD");
  assert.equal(Core.detectCurrency("US$1,099"), "USD");
  assert.equal(Core.detectCurrency("£399"), "GBP");
});

test("calculates landed cost with fixed or percentage tax", () => {
  assert.equal(Core.calculateLandedCost({ price: 100, costs: { shipping: 10, fees: 5, tax: 21, taxMode: "percent" } }), 136);
  assert.equal(Core.calculateLandedCost({ price: 100, costs: { shipping: 10, fees: 5, tax: 21, taxMode: "fixed" } }), 136);
  assert.equal(Core.calculateLandedCost({ price: 99.99, costs: {} }), 99.99);
});

test("extracts a normalized product from schema.org JSON-LD", () => {
  const product = Core.productFromJsonLd([
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Acme Headphones",
      image: ["https://example.com/headphones.jpg"],
      brand: { "@type": "Brand", name: "Acme" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.7", reviewCount: "312" },
      offers: { "@type": "Offer", price: "249.95", priceCurrency: "EUR", availability: "https://schema.org/InStock" }
    }
  ], { url: "https://example.com/acme", site: "example.com" });

  assert.equal(product.title, "Acme Headphones");
  assert.equal(product.price, 249.95);
  assert.equal(product.currency, "EUR");
  assert.equal(product.rating, 4.7);
  assert.equal(product.reviewCount, 312);
  assert.equal(product.availability, "InStock");
  assert.equal(product.sources.price.method, "schema.org");
});

test("weighted scoring reacts to user priorities and exposes coverage", () => {
  const products = [
    Core.normalizeProduct({ id: "cheap", title: "Cheap", price: 100, rating: 4, currency: "EUR" }),
    Core.normalizeProduct({ id: "premium", title: "Premium", price: 200, rating: 5, currency: "EUR" })
  ];

  const priceFirst = Core.scoreProducts(products, [
    { id: "cost", label: "Cost", field: "totalCost", direction: "min", weight: 80 },
    { id: "rating", label: "Rating", field: "rating", direction: "max", weight: 20 }
  ]);
  assert.equal(priceFirst.winnerId, "cheap");
  assert.equal(priceFirst.scores.find((item) => item.productId === "cheap").score, 80);

  const qualityFirst = Core.scoreProducts(products, [
    { id: "cost", label: "Cost", field: "totalCost", direction: "min", weight: 20 },
    { id: "rating", label: "Rating", field: "rating", direction: "max", weight: 80 }
  ]);
  assert.equal(qualityFirst.winnerId, "premium");
  assert.equal(qualityFirst.scores.find((item) => item.productId === "premium").score, 80);
});

test("missing values reduce coverage instead of inventing a score", () => {
  const products = [
    Core.normalizeProduct({ id: "a", title: "A", price: 100 }),
    Core.normalizeProduct({ id: "b", title: "B", price: 110 })
  ];
  const result = Core.scoreProducts(products, [
    { id: "custom", label: "Repairability", field: "custom", direction: "max", weight: 100, values: { a: 8 } }
  ]);
  assert.equal(result.scores.find((item) => item.productId === "a").coverage, 100);
  assert.equal(result.scores.find((item) => item.productId === "b").coverage, 0);
  assert.equal(result.scores.find((item) => item.productId === "b").score, 0);
});

test("exports sourced Markdown, AI prompt, JSON and spreadsheet-safe CSV", () => {
  const product = Core.normalizeProduct({
    id: "safe",
    title: "=HYPERLINK(\"bad\")",
    url: "https://example.com/product",
    site: "example.com",
    price: 10,
    currency: "EUR"
  });
  const exported = Core.exportComparison([product], Core.DEFAULT_CRITERIA);
  assert.match(exported.markdown, /https:\/\/example\.com\/product/);
  assert.match(exported.prompt, /do not invent specifications/i);
  assert.match(exported.csv, /"'=HYPERLINK/);
  assert.equal(JSON.parse(exported.json).schemaVersion, 1);
});
