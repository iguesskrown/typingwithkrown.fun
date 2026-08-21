# Typingwithkrown.fun

A playful typing practice website with short timed tests, a dedicated typing focus experience, and cosmetic theme customization for the typing screen.

## Features

- 1, 3, and 5 minute typing tests
- Focused typing layout with hidden live stats until completion
- Theme presets for the typing page only
- Developer-managed custom background assets
- Responsive desktop-first layout

## Local development

From the project root, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

## Deployment

This project is a static website and can be deployed to GitHub Pages.

### GitHub Pages setup

1. Push this repository to GitHub.
2. Open the repository on GitHub.
3. Go to Settings > Pages.
4. Set Source to `GitHub Actions`.
5. The workflow in `.github/workflows/deploy-pages.yml` will publish the site automatically.

### Automatic deployment workflow

The repository includes a GitHub Action workflow that deploys the static site to GitHub Pages on pushes to the `master` branch.

## Project structure

- `index.html` — home page
- `test.html` — typing test screen
- `cosmetics.html` — cosmetics/theme selection page
- `styles.css` — styling and theme rules
- `index.js` — landing page behavior
- `test.js` — typing logic and theme/background handling
- `cosmetics.js` — cosmetics page behavior
- `assets/backgrounds/` — developer-managed background asset files

## Notes

- The site is static and does not use a backend.
- The custom background system is intentionally limited to developer-managed assets instead of public uploads.
- Theme changes are scoped to the typing page only, not the homepage or navbar.
