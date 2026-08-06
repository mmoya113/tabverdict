# Contributing to TabVerdict

Thanks for helping make independent product comparisons easier to trust.

## Before opening code

1. Search existing issues and pull requests.
2. Keep the change focused on one problem.
3. For extraction bugs, remove personal data from any fixture.
4. For behavior changes, add a failing test first when practical.

## Local checks

Node.js 20 or newer is sufficient; the extension has no runtime dependencies.

```bash
npm run check
```

To test the UI, open `chrome://extensions`, enable Developer mode and load the repository folder unpacked. Reload the extension after changing the manifest, background script or content script.

## Pull-request expectations

- Explain the user problem and the chosen behavior.
- Include before/after screenshots for visible changes.
- Test keyboard focus and a narrow viewport.
- Keep permissions minimal; any new permission requires a plain-English justification in the README and privacy policy.
- Do not add analytics, affiliate parameters, remote scripts or an account requirement.
- Do not claim extraction certainty that the code cannot establish.

## Store fixtures

An ideal extraction fixture contains only the smallest relevant HTML or JSON-LD fragment. Replace customer names, order identifiers, tracking parameters and unrelated content. State the country/locale and expected normalized output.

## Design principles

1. Evidence before confidence.
2. A working small control before a decorative fake control.
3. User priorities before universal “best” claims.
4. Local data before network infrastructure.
5. Honest limits before roadmap theatre.

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
