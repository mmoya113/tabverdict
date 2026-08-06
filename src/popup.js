(function startPopup(root) {
  "use strict";

  const Core = root.TabVerdictCore;
  const Store = root.TabVerdictStore;
  const elements = {
    loading: document.querySelector("#loading"),
    preview: document.querySelector("#preview"),
    error: document.querySelector("#capture-error"),
    errorMessage: document.querySelector("#capture-error-message"),
    visual: document.querySelector("#preview-visual"),
    site: document.querySelector("#preview-site"),
    quality: document.querySelector("#quality-badge"),
    title: document.querySelector("#preview-title"),
    price: document.querySelector("#preview-price"),
    rating: document.querySelector("#preview-rating"),
    captureButton: document.querySelector("#capture-button"),
    recent: document.querySelector("#recent-products"),
    count: document.querySelector("#shortlist-count")
  };

  let previewProduct = null;
  let state = Store.defaults();

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initials(value) {
    return Core.cleanText(value).split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  }

  function renderRecent() {
    elements.count.textContent = `${state.products.length} / ${Store.MAX_PRODUCTS}`;
    const products = [...state.products].reverse().slice(0, 3);
    if (!products.length) {
      elements.recent.innerHTML = '<div class="recent-empty">No products yet. Capture two options and the board will calculate a transparent verdict.</div>';
      return;
    }
    elements.recent.innerHTML = products.map((product) => `
      <div class="recent-item">
        <span class="recent-thumb">${product.image ? `<img src="${escapeHtml(product.image)}" alt="" referrerpolicy="no-referrer">` : escapeHtml(initials(product.title))}</span>
        <span class="recent-copy"><strong>${escapeHtml(product.title)}</strong><small>${escapeHtml(product.site)}</small></span>
        <strong>${escapeHtml(Core.formatMoney(Core.calculateLandedCost(product), product.currency))}</strong>
      </div>`).join("");
  }

  function showError(message) {
    elements.loading.hidden = true;
    elements.preview.hidden = true;
    elements.error.hidden = false;
    elements.errorMessage.textContent = message || "Open a public product page, then try again.";
  }

  function showPreview(response) {
    previewProduct = Core.normalizeProduct(response.product);
    const existing = state.products.find((product) => product.url && product.url === previewProduct.url);
    elements.loading.hidden = true;
    elements.error.hidden = true;
    elements.preview.hidden = false;
    elements.visual.innerHTML = previewProduct.image
      ? `<img src="${escapeHtml(previewProduct.image)}" alt="" referrerpolicy="no-referrer">`
      : `<span class="preview-placeholder">${escapeHtml(initials(previewProduct.title))}</span>`;
    elements.site.textContent = previewProduct.site;
    elements.title.textContent = previewProduct.title;
    elements.price.textContent = previewProduct.price ? Core.formatMoney(previewProduct.price, previewProduct.currency) : "Review needed";
    elements.rating.textContent = previewProduct.rating ? `★ ${previewProduct.rating.toFixed(1)}` : "No rating";
    const labels = {
      structured: "Structured data",
      heuristic: "Price detected",
      "manual-review": "Needs review"
    };
    elements.quality.textContent = labels[response.quality] || "Captured";
    elements.quality.classList.toggle("needs-review", response.quality !== "structured");
    elements.captureButton.querySelector("span").textContent = existing ? "Update saved product" : "Add to comparison";
  }

  async function captureCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !/^https?:/i.test(tab.url || "")) {
        return showError("Chrome pages, new tabs and extension pages cannot be read. Open a public product page.");
      }
      const response = await chrome.runtime.sendMessage({ type: "TABVERDICT_CAPTURE_TAB", tabId: tab.id });
      if (!response?.ok) throw new Error(response?.error || "The page blocked capture.");
      showPreview(response);
    } catch (error) {
      showError(error.message || "Could not read this page.");
    }
  }

  async function savePreview() {
    if (!previewProduct) return;
    const button = elements.captureButton;
    button.disabled = true;
    try {
      state = await Store.upsertProduct(previewProduct);
      renderRecent();
      button.classList.add("is-saved");
      button.querySelector("span").textContent = "Saved to your board";
      button.querySelector("b").textContent = "✓";
      setTimeout(() => {
        button.classList.remove("is-saved");
        button.querySelector("span").textContent = "Update saved product";
        button.querySelector("b").textContent = "↻";
        button.disabled = false;
      }, 1_600);
    } catch (error) {
      button.querySelector("span").textContent = error.message;
      button.disabled = false;
    }
  }

  function openBoard() {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    root.close();
  }

  document.querySelectorAll("[data-open-board]").forEach((button) => button.addEventListener("click", openBoard));
  elements.captureButton.addEventListener("click", savePreview);

  async function init() {
    state = await Store.getState();
    renderRecent();
    await captureCurrentTab();
  }

  init().catch((error) => showError(error.message));
})(globalThis);
