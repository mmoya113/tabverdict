# SpecForge ✦

<p align="center">
  <img src="https://img.shields.io/badge/SpecForge-API%20workspace-9b8cff?style=for-the-badge&labelColor=111217" alt="SpecForge">
  <img src="https://img.shields.io/badge/local--first-no%20account-75e8bc?style=for-the-badge&labelColor=111217" alt="Local first">
  <img src="https://img.shields.io/badge/zero%20dependencies-single%20file-ffb86b?style=for-the-badge&labelColor=111217" alt="Single file">
</p>

<p align="center"><strong>Turn a raw API contract into documentation people actually want to use.</strong></p>

SpecForge is a calm, visual API workspace for developers, automation builders and small teams. Drop in an OpenAPI JSON file and get a useful surface immediately: searchable routes, a focused endpoint inspector, copyable cURL recipes, a handoff checklist and a README export.

It replaces the “here is a giant JSON file, good luck” experience with a first successful request in under a minute.

## Why this exists

Marc builds websites, automations and API-powered products. The painful part is rarely writing another endpoint; it is making the result understandable to someone else.

SpecForge is intentionally narrow:

- **Explore** routes without losing the context of the contract.
- **Inspect** one endpoint with its parameters and environment.
- **Copy** a ready-to-run cURL recipe.
- **Handoff** a clean README instead of a wall of screenshots.
- **Stay local** while you are shaping the contract.

## Features

| Feature | What it does |
| --- | --- |
| API explorer | Search paths, methods, names and tags in real time |
| Endpoint inspector | See description, parameters, status and request recipe |
| OpenAPI import | Parse OpenAPI 3 JSON paths directly in the browser |
| Recipes | Give teammates a first happy-path request |
| Handoff checklist | Catch missing base URL, auth, recipe and error docs |
| README export | Download a starter markdown reference |
| Local-first | No login, analytics or backend required |

## Quick start

\`\`\`bash
git clone https://github.com/mmoya113/tabverdict.git
cd tabverdict
open index.html
\`\`\`

Or double-click \`index.html\`. It is a portable static app: no build step, no account and no API key required for the demo.

## Try it in 30 seconds

1. Open the sample workspace.
2. Click an endpoint in **API explorer**.
3. Switch **Overview → Endpoints → Recipes**.
4. Copy the cURL recipe.
5. Use **Import OpenAPI** with your own JSON contract.
6. Export the README when the handoff is ready.

## OpenAPI input

The importer reads the most useful part of an OpenAPI JSON document: \`paths\`.

\`\`\`json
{
  "openapi": "3.0.3",
  "info": { "title": "Moya Studio API", "version": "1.4.0" },
  "paths": {
    "/v1/projects": {
      "get": {
        "summary": "List projects",
        "tags": ["Projects"]
      }
    }
  }
}
\`\`\`

No file is uploaded. The parser runs in your browser and keeps the imported surface in memory.

## Design principles

- **First win before full reference.** A good tool shows a successful request before the entire schema.
- **Proof over decoration.** Every panel exists to answer “what do I do next?”
- **Local by default.** Early API work often contains private URLs and unfinished ideas.
- **Polished, not noisy.** One primary action per surface and readable information density.
- **Static-friendly.** The useful version should work from a GitHub checkout or a downloaded file.

## Roadmap

- OpenAPI YAML import without a server.
- Request body examples generated from schema.
- Shareable static docs export with syntax highlighting.
- Optional real request runner with explicit CORS/auth warnings.
- GitHub Actions check for broken examples.

## Privacy

SpecForge has no login, analytics SDK or backend. The static demo does not transmit your contract anywhere. Do not paste production secrets into cURL examples; use environment variables such as \`$MOYA_API_KEY\`.

## Contributing

Ideas, bug reports and pull requests are welcome. Keep changes focused on making APIs easier to understand and safer to hand off.

## License

MIT — use it, fork it, improve it.
