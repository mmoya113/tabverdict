import { access, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

check(manifest.manifest_version === 3, "manifest.json must use Manifest V3");
check(!manifest.host_permissions, "TabVerdict must not request permanent host permissions");
check(manifest.permissions.includes("activeTab"), "activeTab permission is required for explicit capture");
check(!manifest.permissions.includes("tabs"), "The broad tabs permission is not needed");
check(manifest.permissions.every((permission) => ["activeTab", "contextMenus", "scripting", "storage"].includes(permission)), "Unexpected browser permission in manifest.json");

const requiredFiles = [
  "index.html",
  "dashboard.html",
  "popup.html",
  "privacy.html",
  "README.md",
  "README.es.md",
  "PRIVACY.md",
  "LICENSE",
  "src/background.js",
  "src/content.js",
  "src/lib/core.js",
  "src/lib/storage.js",
  ...Object.values(manifest.icons),
  manifest.action.default_popup
];

for (const file of new Set(requiredFiles)) {
  try {
    const details = await stat(resolve(root, file));
    check(details.isFile(), `${file} must be a file`);
  } catch {
    errors.push(`Missing required file: ${file}`);
  }
}

const textFiles = [
  "index.html",
  "dashboard.html",
  "popup.html",
  "src/dashboard.js",
  "src/popup.js",
  "src/background.js",
  "src/content.js"
];
const htmlFiles = ["index.html", "dashboard.html", "popup.html", "privacy.html"];
const htmlEntries = await Promise.all(htmlFiles.map(async (file) => [file, await readFile(resolve(root, file), "utf8")]));
const text = (await Promise.all(textFiles.map((file) => readFile(resolve(root, file), "utf8")))).join("\n");
check(!/<script[^>]+src=["']https?:/i.test(text), "Remote scripts are forbidden");
check(!/\b(?:Welcome|Bienvenido),?\s+(?:Marc|Mark)\b/i.test(text), "No hard-coded personal greeting is allowed");
check(!/\bTODO\b|\bFIXME\b/.test(text), "Ship-ready source must not contain TODO or FIXME markers");

for (const [file, html] of htmlEntries) {
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const reference = match[1];
    if (/^(?:https?:|#|data:|mailto:)/i.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    try {
      await access(resolve(root, clean));
    } catch {
      errors.push(`${file} references missing local file: ${clean}`);
    }
  }
}

if (errors.length) {
  console.error(`Validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`✓ Manifest V3 permissions are minimal\n✓ ${requiredFiles.length} required artifacts exist\n✓ Local HTML references resolve\n✓ No remote scripts or hard-coded identity`);
