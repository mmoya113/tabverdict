import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(root, "dist/tabverdict");
const files = [
  "manifest.json",
  "popup.html",
  "popup.css",
  "dashboard.html",
  "dashboard.css",
  "index.html",
  "index.css",
  "privacy.html",
  "docs.css",
  "PRIVACY.md",
  "assets",
  "src"
];

await rm(resolve(root, "dist"), { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const file of files) {
  await cp(resolve(root, file), resolve(destination, file), { recursive: true });
}
console.log(`Packaged ${files.length} runtime entries in dist/tabverdict`);
