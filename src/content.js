(function installTabVerdictExtractor(root) {
  "use strict";

  if (root.__tabVerdictExtractorInstalled) return;
  root.__tabVerdictExtractorInstalled = true;
  const Core = root.TabVerdictCore;

  function meta(...selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const value = element?.getAttribute("content") || element?.getAttribute("value") || element?.textContent;
      if (Core.cleanText(value)) return Core.cleanText(value);
    }
    return "";
  }

  function parseJsonLd() {
    const values = [];
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        values.push(JSON.parse(script.textContent));
      } catch {
        // Broken structured data should never block the user's capture.
      }
    }
    return values;
  }

  function visiblePrice() {
    const selectors = [
      '[itemprop="price"]',
      '[data-testid*="price" i]',
      '[class~="price"]',
      '[class*="product-price" i]',
      '[id*="price" i]'
    ];
    for (const selector of selectors) {
      const elements = [...document.querySelectorAll(selector)].slice(0, 12);
      for (const element of elements) {
        const style = getComputedStyle(element);
        const text = Core.cleanText(element.getAttribute("content") || element.textContent, 100);
        if (style.display !== "none" && style.visibility !== "hidden" && /\d/.test(text) && Core.parseMoney(text) !== null) {
          return text;
        }
      }
    }
    return "";
  }

  function collectSpecs() {
    const specs = {};
    const add = (label, value) => {
      const key = Core.cleanText(label, 80).replace(/:$/, "");
      const cleanValue = Core.cleanText(value, 300);
      if (key && cleanValue && key !== cleanValue && Object.keys(specs).length < 40) specs[key] = cleanValue;
    };

    for (const row of [...document.querySelectorAll("table tr")].slice(0, 80)) {
      const cells = row.querySelectorAll("th, td");
      if (cells.length === 2) add(cells[0].textContent, cells[1].textContent);
    }
    for (const term of [...document.querySelectorAll("dl dt")].slice(0, 80)) {
      const description = term.nextElementSibling;
      if (description?.matches("dd")) add(term.textContent, description.textContent);
    }
    return specs;
  }

  function extractProduct() {
    const url = location.href;
    const title = meta('meta[property="og:title"]', 'meta[name="twitter:title"]') || document.title;
    const image = meta('meta[property="og:image"]', 'meta[name="twitter:image"]', '[itemprop="image"]');
    const priceText = meta(
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[itemprop="price"]'
    ) || visiblePrice();
    const currency = meta(
      'meta[property="product:price:currency"]',
      'meta[property="og:price:currency"]',
      'meta[itemprop="priceCurrency"]'
    ) || Core.detectCurrency(priceText);
    const context = { url, title, image, priceText, currency, site: location.hostname.replace(/^www\./, "") };
    const structured = Core.productFromJsonLd(parseJsonLd(), context);
    const product = Core.normalizeProduct({
      ...context,
      ...(structured || {}),
      specs: collectSpecs(),
      sources: {
        ...(structured?.sources || {}),
        page: { url, method: "capture", label: "Captured from current tab" },
        ...(structured ? {} : {
          title: { url, method: "Open Graph / page title", label: "Page metadata" },
          price: { url, method: "visible page", label: "Visible price heuristic" }
        })
      }
    });
    return { ok: true, product, quality: structured ? "structured" : priceText ? "heuristic" : "manual-review" };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "TABVERDICT_CAPTURE") return false;
    try {
      sendResponse(extractProduct());
    } catch (error) {
      sendResponse({ ok: false, error: error?.message || "Could not read this page." });
    }
    return false;
  });
})(globalThis);
