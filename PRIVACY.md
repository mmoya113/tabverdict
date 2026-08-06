# TabVerdict privacy policy

Effective date: 6 August 2026

TabVerdict is designed so that a shopping shortlist does not need to become somebody else's dataset.

## The short version

- TabVerdict does not require an account.
- TabVerdict does not operate a data-collection server.
- TabVerdict does not contain analytics, advertising or affiliate tracking.
- Products, criteria, settings and price snapshots are stored on your device.
- A page is read only after you explicitly click the extension or its context-menu action.

## Data processed on your device

When you capture a product, the extension may read the chosen page's title, URL, image reference, price, currency, brand, availability, rating, review count, structured product data and specification tables. It stores the normalized result in `chrome.storage.local`.

You can also enter notes, costs and custom criterion values. Those values remain in the same local storage area.

## Network behavior

TabVerdict contains no API endpoint and does not upload the comparison. If a captured product has a remote image URL, your browser may request that image directly from the source site when the board displays it. The UI uses `referrerpolicy="no-referrer"` for those images.

The optional GitHub Pages demo serves static project files. Its board uses localStorage in that site's browser origin. The repository does not include a telemetry script.

## Exports

Markdown, CSV, JSON and AI prompts are generated locally. Data leaves TabVerdict only when you choose to copy, download or share one of those exports.

## Browser sync

TabVerdict uses `chrome.storage.local`, not `chrome.storage.sync`. Browser-vendor syncing is therefore not requested by this extension.

## Delete your data

Use the reset button on the decision board and confirm “Clear every product and criterion”. You can also remove the extension, then ask the browser to clear its extension data.

## Permissions

- `activeTab`: temporary access to the page you chose.
- `scripting`: run the packaged extractor on that chosen page.
- `storage`: retain the board locally.
- `contextMenus`: provide the optional right-click shortcut.

The manifest intentionally has no permanent `host_permissions` entry.

## Changes

Material changes to this policy will be documented in `CHANGELOG.md` and the effective date above will change. A future network-dependent feature must be opt-in and documented before it can ship.

## Questions

Open a public privacy question in [GitHub Issues](https://github.com/mmoya113/tabverdict/issues). Report a vulnerability privately through [GitHub Security Advisories](https://github.com/mmoya113/tabverdict/security/advisories/new).
