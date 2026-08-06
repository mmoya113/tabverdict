import "./lib/core.js";
import "./lib/storage.js";

const Core = globalThis.TabVerdictCore;
const Store = globalThis.TabVerdictStore;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "tabverdict-add-page",
      title: "Add this product to TabVerdict",
      contexts: ["page"]
    });
  });
});

async function injectAndCapture(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["src/lib/core.js", "src/content.js"]
  });
  const response = await chrome.tabs.sendMessage(tabId, { type: "TABVERDICT_CAPTURE" });
  if (!response?.ok) throw new Error(response?.error || "Could not capture this product page.");
  return response;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "tabverdict-add-page" || !tab?.id) return;
  try {
    const response = await injectAndCapture(tab.id);
    await Store.upsertProduct(response.product);
    await chrome.action.setBadgeBackgroundColor({ color: "#166534" });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "✓" });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 1800);
  } catch {
    await chrome.action.setBadgeBackgroundColor({ color: "#b42318" });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 2200);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "TABVERDICT_CAPTURE_TAB" || !message.tabId) return false;
  injectAndCapture(message.tabId)
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

// Keep Core referenced so bundler-free static analysis catches missing shared logic.
void Core;
