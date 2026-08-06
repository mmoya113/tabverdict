/* TabVerdict's dependency-free domain logic. Shared by extension pages, content scripts and tests. */
(function attachTabVerdictCore(root) {
  "use strict";

  if (root.TabVerdictCore) return;

  const CURRENCY_SYMBOLS = Object.freeze({
    EUR: "€",
    USD: "$",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    KRW: "₩",
    INR: "₹",
    CAD: "CA$",
    AUD: "A$",
    CHF: "CHF",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    BRL: "R$",
    MXN: "MX$"
  });

  const CURRENCY_HINTS = [
    [/\bEUR\b|€/i, "EUR"],
    [/\bGBP\b|£/i, "GBP"],
    [/\bJPY\b|円/i, "JPY"],
    [/\bCNY\b|元/i, "CNY"],
    [/\bKRW\b|₩/i, "KRW"],
    [/\bINR\b|₹/i, "INR"],
    [/\bCAD\b|CA\$/i, "CAD"],
    [/\bAUD\b|A\$/i, "AUD"],
    [/\bCHF\b/i, "CHF"],
    [/\bPLN\b|zł/i, "PLN"],
    [/\bBRL\b|R\$/i, "BRL"],
    [/\bMXN\b|MX\$/i, "MXN"],
    [/\bUSD\b|US\$|\$/i, "USD"]
  ];

  const DEFAULT_CRITERIA = Object.freeze([
    {
      id: "total-cost",
      label: "Total cost",
      field: "totalCost",
      direction: "min",
      weight: 45,
      unit: "currency",
      values: {}
    },
    {
      id: "rating",
      label: "Rating",
      field: "rating",
      direction: "max",
      weight: 20,
      unit: "/ 5",
      values: {}
    }
  ]);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function cleanText(value, maxLength = 500) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function safeNumber(value, fallback = null) {
    if (value === "" || value === null || value === undefined) return fallback;
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function parseMoney(input) {
    if (typeof input === "number") return Number.isFinite(input) ? input : null;
    if (!input) return null;

    let value = String(input)
      .replace(/[\u00a0\u202f\s]/g, "")
      .replace(/[^0-9,.'-]/g, "")
      .replace(/'/g, "");

    if (!value || value === "-") return null;

    const negative = value.startsWith("-");
    value = value.replace(/-/g, "");
    const comma = value.lastIndexOf(",");
    const dot = value.lastIndexOf(".");

    if (comma !== -1 && dot !== -1) {
      const decimal = comma > dot ? "," : ".";
      const thousands = decimal === "," ? /\./g : /,/g;
      value = value.replace(thousands, "").replace(decimal, ".");
    } else {
      const separator = comma !== -1 ? "," : dot !== -1 ? "." : null;
      if (separator) {
        const chunks = value.split(separator);
        const last = chunks.at(-1);
        if (chunks.length > 2 || last.length === 3) {
          value = chunks.join("");
        } else {
          value = `${chunks.slice(0, -1).join("")}.${last}`;
        }
      }
    }

    const number = Number(value);
    return Number.isFinite(number) ? (negative ? -number : number) : null;
  }

  function detectCurrency(...hints) {
    const value = hints.filter(Boolean).join(" ");
    for (const [pattern, currency] of CURRENCY_HINTS) {
      if (pattern.test(value)) return currency;
    }
    return "EUR";
  }

  function normalizeCurrency(value, fallback = "EUR") {
    const currency = cleanText(value, 8).toUpperCase();
    return /^[A-Z]{3}$/.test(currency) ? currency : fallback;
  }

  function formatMoney(value, currency = "EUR", locale) {
    const amount = safeNumber(value);
    if (amount === null) return "—";
    try {
      return new Intl.NumberFormat(locale || undefined, {
        style: "currency",
        currency: normalizeCurrency(currency),
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return `${CURRENCY_SYMBOLS[currency] || currency} ${amount.toFixed(2)}`;
    }
  }

  function safeUrl(value, fallback = "") {
    const url = cleanText(value, 2_000);
    if (!url) return fallback;
    if (/^(https?:|chrome-extension:|moz-extension:|data:image\/|\.\/|\.\.\/|\/|assets\/)/i.test(url)) {
      return url;
    }
    return fallback;
  }

  function hostFromUrl(value) {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch {
      return "Manual entry";
    }
  }

  function uid(prefix = "item") {
    const cryptoApi = root.crypto;
    const random = cryptoApi?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${random}`;
  }

  function calculateLandedCost(product) {
    const price = Math.max(0, safeNumber(product?.price, 0));
    const costs = product?.costs || {};
    const shipping = Math.max(0, safeNumber(costs.shipping, 0));
    const fees = Math.max(0, safeNumber(costs.fees, 0));
    const taxValue = Math.max(0, safeNumber(costs.tax, 0));
    const tax = costs.taxMode === "percent" ? price * (taxValue / 100) : taxValue;
    return Number((price + shipping + fees + tax).toFixed(2));
  }

  function normalizeSpecs(specs) {
    if (!specs || typeof specs !== "object" || Array.isArray(specs)) return {};
    const entries = Object.entries(specs)
      .slice(0, 60)
      .map(([key, value]) => [cleanText(key, 80), cleanText(value, 300)])
      .filter(([key, value]) => key && value);
    return Object.fromEntries(entries);
  }

  function normalizeSources(sources, productUrl) {
    if (!sources || typeof sources !== "object" || Array.isArray(sources)) return {};
    const result = {};
    for (const [key, source] of Object.entries(sources).slice(0, 80)) {
      if (!source || typeof source !== "object") continue;
      result[cleanText(key, 80)] = {
        url: safeUrl(source.url, productUrl),
        method: cleanText(source.method, 80),
        label: cleanText(source.label, 120)
      };
    }
    return result;
  }

  function normalizeProduct(payload = {}, fallback = {}) {
    const url = safeUrl(payload.url, safeUrl(fallback.url));
    const currency = normalizeCurrency(
      payload.currency,
      normalizeCurrency(fallback.currency || detectCurrency(payload.priceText), "EUR")
    );
    const price = Math.max(0, safeNumber(payload.price, parseMoney(payload.priceText) ?? 0));
    const createdAt = payload.createdAt || fallback.createdAt || new Date().toISOString();
    const costs = {
      shipping: Math.max(0, safeNumber(payload.costs?.shipping, 0)),
      fees: Math.max(0, safeNumber(payload.costs?.fees, 0)),
      tax: Math.max(0, safeNumber(payload.costs?.tax, 0)),
      taxMode: payload.costs?.taxMode === "percent" ? "percent" : "fixed"
    };

    const product = {
      id: cleanText(payload.id, 100) || uid("product"),
      title: cleanText(payload.title, 220) || "Untitled product",
      url,
      site: cleanText(payload.site, 120) || hostFromUrl(url),
      image: safeUrl(payload.image),
      brand: cleanText(payload.brand, 120),
      price,
      priceText: cleanText(payload.priceText, 80),
      currency,
      availability: cleanText(payload.availability, 120),
      rating: clamp(safeNumber(payload.rating, 0), 0, 5),
      reviewCount: Math.max(0, Math.round(safeNumber(payload.reviewCount, 0))),
      costs,
      notes: cleanText(payload.notes, 2_000),
      specs: normalizeSpecs(payload.specs),
      sources: normalizeSources(payload.sources, url),
      history: Array.isArray(payload.history) ? payload.history.slice(-30) : [],
      createdAt,
      updatedAt: payload.updatedAt || new Date().toISOString(),
      demo: Boolean(payload.demo)
    };
    product.totalCost = calculateLandedCost(product);
    return product;
  }

  function flattenJsonLd(value, result = []) {
    if (!value) return result;
    if (Array.isArray(value)) {
      value.forEach((item) => flattenJsonLd(item, result));
      return result;
    }
    if (typeof value !== "object") return result;
    result.push(value);
    if (value["@graph"]) flattenJsonLd(value["@graph"], result);
    return result;
  }

  function hasType(node, type) {
    const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
    return types.some((candidate) => cleanText(candidate).toLowerCase() === type.toLowerCase());
  }

  function firstOffer(offers) {
    if (Array.isArray(offers)) return offers.find(Boolean) || {};
    return offers && typeof offers === "object" ? offers : {};
  }

  function valueFromRating(rating, key) {
    if (rating && typeof rating === "object") return rating[key];
    return key === "ratingValue" ? rating : null;
  }

  function productFromJsonLd(nodes, context = {}) {
    const flattened = flattenJsonLd(nodes);
    const node = flattened.find((item) => hasType(item, "Product"));
    if (!node) return null;

    const offer = firstOffer(node.offers);
    const price = offer.price ?? offer.lowPrice ?? node.price;
    const rating = node.aggregateRating;
    const brand = typeof node.brand === "object" ? node.brand.name : node.brand;
    const image = Array.isArray(node.image)
      ? node.image[0]
      : typeof node.image === "object"
        ? node.image.url
        : node.image;
    const currency = offer.priceCurrency || node.priceCurrency || detectCurrency(price, context.priceText);
    const url = offer.url || node.url || context.url;

    return normalizeProduct({
      title: node.name || context.title,
      url,
      site: context.site,
      image: image || context.image,
      brand,
      price: parseMoney(price),
      priceText: cleanText(price),
      currency,
      availability: cleanText(offer.availability || node.availability).split("/").at(-1),
      rating: safeNumber(valueFromRating(rating, "ratingValue"), 0),
      reviewCount: safeNumber(valueFromRating(rating, "reviewCount") ?? valueFromRating(rating, "ratingCount"), 0),
      sources: {
        title: { url, method: "schema.org", label: "Product structured data" },
        price: { url, method: "schema.org", label: "Offer structured data" },
        rating: { url, method: "schema.org", label: "AggregateRating structured data" }
      }
    }, context);
  }

  function criterionValue(product, criterion) {
    if (criterion.field === "totalCost") return calculateLandedCost(product);
    if (criterion.field && criterion.field !== "custom") {
      return safeNumber(product[criterion.field]);
    }
    return safeNumber(criterion.values?.[product.id]);
  }

  function normalizeCriterion(raw = {}) {
    return {
      id: cleanText(raw.id, 100) || uid("criterion"),
      label: cleanText(raw.label, 80) || "New criterion",
      field: ["totalCost", "rating", "reviewCount"].includes(raw.field) ? raw.field : "custom",
      direction: raw.direction === "min" ? "min" : "max",
      weight: clamp(safeNumber(raw.weight, 10), 0, 100),
      unit: cleanText(raw.unit, 24),
      values: raw.values && typeof raw.values === "object" ? { ...raw.values } : {}
    };
  }

  function scoreProducts(products = [], rawCriteria = []) {
    const criteria = rawCriteria.map(normalizeCriterion).filter((criterion) => criterion.weight > 0);
    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0) || 1;
    const stats = new Map();

    for (const criterion of criteria) {
      const values = products
        .map((product) => criterionValue(product, criterion))
        .filter((value) => value !== null);
      stats.set(criterion.id, {
        min: values.length ? Math.min(...values) : null,
        max: values.length ? Math.max(...values) : null
      });
    }

    const scores = products.map((product) => {
      let weighted = 0;
      let coveredWeight = 0;
      const breakdown = [];

      for (const criterion of criteria) {
        const value = criterionValue(product, criterion);
        const range = stats.get(criterion.id);
        let normalized = null;

        if (value !== null && range.min !== null) {
          coveredWeight += criterion.weight;
          if (range.max === range.min) {
            normalized = 100;
          } else if (criterion.direction === "min") {
            normalized = ((range.max - value) / (range.max - range.min)) * 100;
          } else {
            normalized = ((value - range.min) / (range.max - range.min)) * 100;
          }
          weighted += clamp(normalized, 0, 100) * criterion.weight;
        }

        breakdown.push({
          criterionId: criterion.id,
          value,
          normalized: normalized === null ? null : Number(normalized.toFixed(1)),
          contribution: normalized === null ? 0 : Number(((normalized * criterion.weight) / totalWeight).toFixed(1))
        });
      }

      return {
        productId: product.id,
        score: Number((weighted / totalWeight).toFixed(1)),
        coverage: Number(((coveredWeight / totalWeight) * 100).toFixed(0)),
        breakdown
      };
    });

    const ranked = [...scores].sort((a, b) => b.score - a.score || b.coverage - a.coverage);
    return {
      scores,
      winnerId: products.length > 1 && ranked[0]?.coverage > 0 ? ranked[0].productId : null,
      criteria,
      totalWeight
    };
  }

  function markdownCell(value) {
    return cleanText(value, 500).replace(/\|/g, "\\|");
  }

  function csvCell(value) {
    let string = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@]/.test(string)) string = `'${string}`;
    return `"${string.replace(/"/g, '""')}"`;
  }

  function exportComparison(products = [], criteria = []) {
    const scored = scoreProducts(products, criteria);
    const scoreMap = new Map(scored.scores.map((item) => [item.productId, item]));
    const winner = products.find((product) => product.id === scored.winnerId);

    const markdown = [
      "# TabVerdict comparison",
      "",
      winner ? `> **Current verdict:** ${markdownCell(winner.title)} leads with ${scoreMap.get(winner.id).score}/100.` : "> Add at least two products and complete your criteria to calculate a verdict.",
      "",
      `Generated ${new Date().toISOString()} · Scores are transparent weighted min-max comparisons, not recommendations.`,
      "",
      `| Product | Total cost | Score | Data coverage | Source |`,
      `| --- | ---: | ---: | ---: | --- |`,
      ...products.map((product) => {
        const result = scoreMap.get(product.id) || { score: 0, coverage: 0 };
        const source = product.url ? `[${markdownCell(product.site)}](${product.url})` : "Manual entry";
        return `| ${markdownCell(product.title)} | ${formatMoney(calculateLandedCost(product), product.currency, "en")} | ${result.score}/100 | ${result.coverage}% | ${source} |`;
      }),
      "",
      "## Criteria",
      "",
      `| Criterion | Direction | Weight | ${products.map((product) => markdownCell(product.title)).join(" | ")} |`,
      `| --- | --- | ---: | ${products.map(() => "---:").join(" | ")} |`,
      ...scored.criteria.map((criterion) => `| ${markdownCell(criterion.label)} | ${criterion.direction === "min" ? "Lower is better" : "Higher is better"} | ${criterion.weight} | ${products.map((product) => criterionValue(product, criterion) ?? "—").join(" | ")} |`),
      "",
      "_Created locally with TabVerdict. Verify prices and specifications at the linked sources before buying._"
    ].join("\n");

    const csvRows = [
      ["Product", "Site", "URL", "Price", "Shipping", "Tax", "Fees", "Total cost", "Currency", "Score", "Coverage"],
      ...products.map((product) => {
        const result = scoreMap.get(product.id) || { score: 0, coverage: 0 };
        return [
          product.title,
          product.site,
          product.url,
          product.price,
          product.costs?.shipping || 0,
          product.costs?.tax || 0,
          product.costs?.fees || 0,
          calculateLandedCost(product),
          product.currency,
          result.score,
          result.coverage
        ];
      })
    ];
    const csv = csvRows.map((row) => row.map(csvCell).join(",")).join("\n");

    const prompt = [
      "Help me choose between these products using only the sourced data below.",
      "Explain the trade-offs, challenge my weights if they look unreasonable, flag missing or stale information, and do not invent specifications.",
      "End with: (1) best overall, (2) best value, (3) who should choose each option, and (4) what I should verify before paying.",
      "",
      markdown
    ].join("\n");

    return {
      markdown,
      csv,
      prompt,
      json: JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), products, criteria: scored.criteria }, null, 2)
    };
  }

  root.TabVerdictCore = Object.freeze({
    CURRENCY_SYMBOLS,
    DEFAULT_CRITERIA,
    calculateLandedCost,
    cleanText,
    criterionValue,
    detectCurrency,
    exportComparison,
    formatMoney,
    hostFromUrl,
    normalizeCriterion,
    normalizeCurrency,
    normalizeProduct,
    parseMoney,
    productFromJsonLd,
    safeNumber,
    safeUrl,
    scoreProducts,
    uid
  });
})(globalThis);
