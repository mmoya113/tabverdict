(function startDashboard(root) {
  "use strict";

  const Core = root.TabVerdictCore;
  const Store = root.TabVerdictStore;
  const Demo = root.TabVerdictDemo;
  const elements = {
    empty: document.querySelector("#empty-state"),
    workspace: document.querySelector("#workspace"),
    board: document.querySelector("#board"),
    verdict: document.querySelector("#verdict"),
    productCount: document.querySelector("#product-count"),
    productDialog: document.querySelector("#product-dialog"),
    productForm: document.querySelector("#product-form"),
    productDialogTitle: document.querySelector("#product-dialog-title"),
    criterionDialog: document.querySelector("#criterion-dialog"),
    criterionForm: document.querySelector("#criterion-form"),
    weightOutput: document.querySelector("#weight-output"),
    exportDialog: document.querySelector("#export-dialog"),
    importInput: document.querySelector("#import-input"),
    toastRegion: document.querySelector("#toast-region")
  };

  let state = Store.defaults();
  let persistTimer = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initials(title) {
    return Core.cleanText(title)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";
  }

  function formatCriterionValue(product, criterion, value) {
    if (value === null) return "—";
    if (criterion.field === "totalCost" || criterion.unit === "currency") {
      return Core.formatMoney(value, product.currency);
    }
    if (criterion.field === "rating") return `${Number(value).toFixed(1)} <small>/ 5</small>`;
    if (criterion.field === "reviewCount") return `${Math.round(value).toLocaleString()} <small>reviews</small>`;
    const formatted = Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
    return `${formatted}${criterion.unit ? ` <small>${escapeHtml(criterion.unit)}</small>` : ""}`;
  }

  function sourceFor(product, criterion) {
    if (criterion.field === "totalCost") return product.sources?.price || product.sources?.page;
    return product.sources?.[criterion.field] || product.sources?.[criterion.label] || product.sources?.page;
  }

  function sourceMark(product, criterion) {
    const source = sourceFor(product, criterion);
    if (!source) return '<span title="Manual value">Manual</span>';
    const title = escapeHtml(`${source.label || "Captured value"}${source.method ? ` · ${source.method}` : ""}`);
    if (source.url) {
      return `<a class="source-mark" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer" title="${title}">↗</a><span>${escapeHtml(source.method || "Source")}</span>`;
    }
    return `<span class="source-mark" title="${title}">i</span><span>${escapeHtml(source.method || "Manual")}</span>`;
  }

  function productCard(product, index, score, winnerId) {
    const isWinner = product.id === winnerId;
    const hasComparison = state.products.length > 1;
    const scoreText = hasComparison ? Math.round(score?.score || 0) : "—";
    const image = product.image
      ? `<img src="${escapeHtml(product.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
      : `<span class="product-placeholder">${escapeHtml(initials(product.title))}</span>`;
    const linkedTitle = product.url
      ? `<a href="${escapeHtml(product.url)}" target="_blank" rel="noreferrer">${escapeHtml(product.title)}</a>`
      : escapeHtml(product.title);
    const baseDiff = Core.calculateLandedCost(product) - product.price;

    return `
      <article class="product-card ${isWinner ? "is-winner" : ""}" style="--index:${index}">
        ${isWinner ? '<span class="winner-ribbon">CURRENT LEADER</span>' : ""}
        <div class="product-menu">
          <button type="button" data-action="edit-product" data-product-id="${escapeHtml(product.id)}" aria-label="Edit ${escapeHtml(product.title)}" title="Edit"><svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true"><path d="M4 14.8 5 11l7.8-7.8a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2L9 15l-3.8 1Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m11.6 4.4 4 4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></button>
          <button type="button" data-action="delete-product" data-product-id="${escapeHtml(product.id)}" aria-label="Remove ${escapeHtml(product.title)}" title="Remove">×</button>
        </div>
        <div class="product-visual">${image}</div>
        <span class="product-site">${escapeHtml(product.site)}${product.demo ? " · demo" : ""}</span>
        <h3 class="product-title">${linkedTitle}</h3>
        <div class="product-bottom">
          <div class="total-cost">
            <small>Total cost</small>
            <strong>${escapeHtml(Core.formatMoney(Core.calculateLandedCost(product), product.currency))}</strong>
            <span>${baseDiff > 0 ? `includes ${escapeHtml(Core.formatMoney(baseDiff, product.currency))} extras` : "no extras added"}</span>
          </div>
          <div class="score-ring" style="--score:${hasComparison ? score?.score || 0 : 0}" title="${hasComparison ? `${score?.coverage || 0}% data coverage` : "Add another product"}">
            <span>${scoreText}</span>
          </div>
        </div>
      </article>`;
  }

  function criterionRow(criterion, result) {
    const breakdownByProduct = new Map(
      result.scores.map((score) => [score.productId, score.breakdown.find((item) => item.criterionId === criterion.id)])
    );
    const canDelete = criterion.field === "custom";
    const cells = state.products.map((product) => {
      const value = Core.criterionValue(product, criterion);
      const breakdown = breakdownByProduct.get(product.id);
      const best = state.products.length > 1 && breakdown?.normalized === 100;
      const content = criterion.field === "custom"
        ? `<label><span class="sr-only">${escapeHtml(criterion.label)} for ${escapeHtml(product.title)}</span><input class="criterion-input" type="number" step="any" inputmode="decimal" value="${value ?? ""}" placeholder="—" data-criterion-value data-criterion-id="${escapeHtml(criterion.id)}" data-product-id="${escapeHtml(product.id)}"></label>`
        : `<span class="criterion-value">${formatCriterionValue(product, criterion, value)}</span>`;
      return `
        <div class="criterion-cell ${best ? "is-best" : ""}">
          ${content}
          <span class="cell-meta">${sourceMark(product, criterion)}</span>
        </div>`;
    }).join("");

    return `
      <div class="board-row">
        <div class="criterion-head">
          <div class="criterion-head-top">
            <strong>${escapeHtml(criterion.label)}</strong>
            ${canDelete ? `<button type="button" data-action="delete-criterion" data-criterion-id="${escapeHtml(criterion.id)}" aria-label="Delete ${escapeHtml(criterion.label)}" title="Delete criterion">×</button>` : ""}
          </div>
          <span class="criterion-direction">${criterion.direction === "min" ? "Lower is better ↓" : "Higher is better ↑"}</span>
          <label class="weight-line">
            <span class="sr-only">Importance of ${escapeHtml(criterion.label)}</span>
            <input type="range" min="0" max="100" value="${criterion.weight}" data-criterion-weight data-criterion-id="${escapeHtml(criterion.id)}">
            <output>${criterion.weight}%</output>
          </label>
        </div>
        ${cells}
      </div>`;
  }

  function renderVerdict(result) {
    if (state.products.length < 2) {
      elements.verdict.className = "verdict is-pending";
      elements.verdict.innerHTML = `
        <span class="verdict-kicker">?</span>
        <div class="verdict-copy"><small>VERDICT PENDING</small><strong>Add one more product.</strong><p>A ranking needs at least two options. Sensible, really.</p></div>
        <div class="verdict-score"><b>—</b><span>OUT OF 100</span></div>`;
      return;
    }

    const winner = state.products.find((product) => product.id === result.winnerId);
    const score = result.scores.find((item) => item.productId === winner?.id);
    if (!winner) {
      elements.verdict.className = "verdict is-pending";
      elements.verdict.innerHTML = `
        <span class="verdict-kicker">!</span>
        <div class="verdict-copy"><small>MORE EVIDENCE NEEDED</small><strong>Complete at least one criterion.</strong><p>Missing values never become invented confidence.</p></div>
        <div class="verdict-score"><b>0</b><span>DATA POINTS</span></div>`;
      return;
    }

    const runnerUp = [...result.scores].sort((a, b) => b.score - a.score)[1];
    const lead = Math.max(0, (score?.score || 0) - (runnerUp?.score || 0)).toFixed(1);
    elements.verdict.className = "verdict";
    elements.verdict.innerHTML = `
      <span class="verdict-kicker">✓</span>
      <div class="verdict-copy"><small>CURRENT VERDICT</small><strong>${escapeHtml(winner.title)} leads.</strong><p>It is ahead by ${lead} points with ${score?.coverage || 0}% data coverage. Change any weight to stress-test it.</p></div>
      <div class="verdict-score"><b>${Math.round(score?.score || 0)}</b><span>OUT OF 100</span></div>`;
  }

  function render() {
    const hasProducts = state.products.length > 0;
    document.body.classList.toggle("has-products", hasProducts);
    elements.empty.hidden = hasProducts;
    elements.workspace.hidden = !hasProducts;
    document.querySelectorAll('[data-action="export"]').forEach((button) => { button.disabled = !hasProducts; });
    if (!hasProducts) return;

    const result = Core.scoreProducts(state.products, state.criteria);
    const scores = new Map(result.scores.map((score) => [score.productId, score]));
    elements.productCount.textContent = `${state.products.length} / ${Store.MAX_PRODUCTS} products`;
    renderVerdict(result);
    elements.board.style.setProperty("--product-columns", state.products.length);
    elements.board.innerHTML = `
      <div class="board-row">
        <div class="corner-cell"><small>OPTIONS / ${state.products.length}</small><strong>Products</strong></div>
        ${state.products.map((product, index) => productCard(product, index, scores.get(product.id), result.winnerId)).join("")}
      </div>
      ${result.criteria.map((criterion) => criterionRow(criterion, result)).join("")}`;
  }

  function openProductDialog(product) {
    const form = elements.productForm;
    form.reset();
    form.querySelector(".form-error").hidden = true;
    elements.productDialogTitle.textContent = product ? "Edit product" : "Add a product";
    form.elements.id.value = product?.id || "";
    form.elements.title.value = product?.title || "";
    form.elements.url.value = product?.url || "";
    form.elements.price.value = product?.price ?? "";
    form.elements.currency.value = product?.currency || "EUR";
    form.elements.shipping.value = product?.costs?.shipping ?? 0;
    form.elements.fees.value = product?.costs?.fees ?? 0;
    form.elements.tax.value = product?.costs?.tax ?? 0;
    form.elements.taxMode.value = product?.costs?.taxMode || "fixed";
    form.elements.rating.value = product?.rating || "";
    form.elements.image.value = /^https?:/i.test(product?.image || "") ? product.image : "";
    form.elements.notes.value = product?.notes || "";
    elements.productDialog.showModal();
    requestAnimationFrame(() => form.elements.title.focus());
  }

  function showToast(message, actionLabel, action) {
    const toast = document.createElement("div");
    toast.className = "toast";
    const text = document.createElement("span");
    text.textContent = message;
    toast.append(text);
    if (actionLabel && action) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = actionLabel;
      button.addEventListener("click", async () => {
        await action();
        toast.remove();
      }, { once: true });
      toast.append(button);
    }
    elements.toastRegion.append(toast);
    setTimeout(() => toast.remove(), 4_800);
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const error = form.querySelector(".form-error");
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const existing = state.products.find((product) => product.id === data.id);
    try {
      state = await Store.upsertProduct({
        ...(existing || {}),
        id: data.id || undefined,
        title: data.title,
        url: data.url,
        site: data.url ? Core.hostFromUrl(data.url) : "Manual entry",
        price: Number(data.price),
        currency: data.currency,
        image: data.image,
        rating: Number(data.rating || 0),
        notes: data.notes,
        costs: {
          shipping: Number(data.shipping || 0),
          fees: Number(data.fees || 0),
          tax: Number(data.tax || 0),
          taxMode: data.taxMode
        },
        sources: existing?.sources || {
          price: { url: data.url, method: "manual", label: "Entered by you" },
          page: { url: data.url, method: "manual", label: "Product source" }
        }
      });
      elements.productDialog.close();
      render();
      showToast(existing ? "Product updated." : "Product added to the board.");
    } catch (exception) {
      error.textContent = exception.message;
      error.hidden = false;
    }
  }

  async function addCriterion(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    state.criteria.push(Core.normalizeCriterion({
      label: data.label,
      direction: data.direction,
      weight: Number(data.weight),
      unit: data.unit,
      field: "custom",
      values: {}
    }));
    state = await Store.saveCriteria(state.criteria);
    elements.criterionDialog.close();
    render();
    showToast(`“${data.label}” added. Fill one value per product.`);
  }

  async function loadDemo() {
    if (state.products.length && !state.products.every((product) => product.demo)) {
      const approved = root.confirm("Replace your current board with the illustrative demo? Export first if you want a backup.");
      if (!approved) return;
    }
    state = await Store.setState({
      ...state,
      products: Demo.products,
      criteria: Demo.criteria
    });
    render();
    elements.workspace.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Illustrative demo loaded. Every value can be changed.");
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  async function handleExport(format) {
    const exported = Core.exportComparison(state.products, state.criteria);
    if (format === "prompt" || format === "markdown") {
      await copyText(exported[format]);
      showToast(format === "prompt" ? "AI prompt copied with sources." : "Markdown comparison copied.");
    } else if (format === "csv") {
      downloadFile("tabverdict-comparison.csv", exported.csv, "text/csv;charset=utf-8");
      showToast("CSV downloaded.");
    } else {
      downloadFile("tabverdict-backup.json", exported.json, "application/json");
      showToast("JSON backup downloaded.");
    }
    elements.exportDialog.close();
  }

  async function handleBoardClick(actionElement) {
    const action = actionElement.dataset.action;
    if (action === "add-product") return openProductDialog();
    if (action === "load-demo") return loadDemo();
    if (action === "edit-product") {
      return openProductDialog(state.products.find((product) => product.id === actionElement.dataset.productId));
    }
    if (action === "delete-product") {
      const result = await Store.removeProduct(actionElement.dataset.productId);
      state = result.state;
      render();
      return showToast(`${result.removed?.title || "Product"} removed.`, "Undo", async () => {
        state = await Store.restoreProduct(result.removed, result.index);
        render();
      });
    }
    if (action === "add-criterion") {
      elements.criterionForm.reset();
      elements.weightOutput.value = 25;
      elements.weightOutput.textContent = "25";
      return elements.criterionDialog.showModal();
    }
    if (action === "delete-criterion") {
      const criterion = state.criteria.find((item) => item.id === actionElement.dataset.criterionId);
      if (!criterion || !root.confirm(`Delete “${criterion.label}” and its values?`)) return;
      state.criteria = state.criteria.filter((item) => item.id !== criterion.id);
      state = await Store.saveCriteria(state.criteria);
      return render();
    }
    if (action === "export") return elements.exportDialog.showModal();
    if (action === "import") return elements.importInput.click();
    if (action === "clear") {
      if (!root.confirm("Clear every product and criterion from this device? This cannot be undone.")) return;
      state = await Store.clearAll();
      render();
      return showToast("Board cleared from this device.");
    }
  }

  document.addEventListener("click", async (event) => {
    const close = event.target.closest("[data-close-dialog]");
    if (close) {
      close.closest("dialog")?.close();
      return;
    }
    const exportButton = event.target.closest("[data-export]");
    if (exportButton) {
      await handleExport(exportButton.dataset.export);
      return;
    }
    const actionElement = event.target.closest("[data-action]");
    if (actionElement) await handleBoardClick(actionElement);
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches('#criterion-form input[name="weight"]')) {
      elements.weightOutput.value = event.target.value;
      elements.weightOutput.textContent = event.target.value;
    }
    if (event.target.matches("[data-criterion-weight]")) {
      const criterion = state.criteria.find((item) => item.id === event.target.dataset.criterionId);
      if (!criterion) return;
      criterion.weight = Number(event.target.value);
      event.target.closest(".weight-line").querySelector("output").textContent = `${criterion.weight}%`;
    }
  });

  document.addEventListener("change", async (event) => {
    if (event.target.matches("[data-criterion-weight]")) {
      clearTimeout(persistTimer);
      persistTimer = setTimeout(async () => {
        state = await Store.saveCriteria(state.criteria);
        render();
      }, 80);
    }
    if (event.target.matches("[data-criterion-value]")) {
      const criterion = state.criteria.find((item) => item.id === event.target.dataset.criterionId);
      if (!criterion) return;
      const value = event.target.value === "" ? null : Number(event.target.value);
      criterion.values = { ...(criterion.values || {}), [event.target.dataset.productId]: value };
      state = await Store.saveCriteria(state.criteria);
      render();
    }
  });

  elements.productForm.addEventListener("submit", saveProduct);
  elements.criterionForm.addEventListener("submit", addCriterion);
  elements.importInput.addEventListener("change", async () => {
    const file = elements.importInput.files?.[0];
    if (!file) return;
    try {
      state = await Store.importState(await file.text());
      render();
      showToast("Backup imported successfully.");
    } catch (error) {
      showToast(error.message || "Could not import that file.");
    } finally {
      elements.importInput.value = "";
    }
  });

  for (const dialog of document.querySelectorAll("dialog")) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  async function init() {
    state = await Store.getState();
    render();
    Store.subscribe((nextState) => {
      state = nextState;
      render();
    });
    const query = new URLSearchParams(location.search);
    if (query.get("demo") === "1" && !state.products.length) await loadDemo();
  }

  init().catch((error) => {
    elements.toastRegion.textContent = `TabVerdict could not start: ${error.message}`;
  });
})(globalThis);
