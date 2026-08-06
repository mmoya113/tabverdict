# Security policy

## Supported versions

Security fixes are applied to the latest release and the `main` branch.

## Report a vulnerability privately

Please use [GitHub's private vulnerability reporting](https://github.com/mmoya113/tabverdict/security/advisories/new). Do not open a public issue for an unpatched vulnerability.

Include:

- The affected version or commit.
- Reproduction steps or a proof of concept.
- The security impact you expect.
- Any suggested mitigation.

You should receive an acknowledgement within seven days. We will coordinate disclosure after a fix is available and credit reporters who want to be named.

## Security boundaries

TabVerdict treats product-page content, imports and user-entered text as untrusted.

- The UI escapes captured text before rendering it.
- URLs are limited to supported schemes.
- Extension scripts are packaged locally; the content-security policy disallows remote scripts.
- CSV cells that begin with spreadsheet formula characters are prefixed before export.
- JSON imports require the expected schema version.
- The manifest avoids permanent host access.

This policy does not turn changing store prices or inaccurate merchant markup into a security vulnerability. Extraction errors should use the bug-report template unless they enable code execution, data exposure or permission abuse.
