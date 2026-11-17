# S & S | Paris Love Story

A self-contained recreation of the [original Gallera photography gallery](https://20931-tetiana-bidna.gallera.io/s-s-paris-love-story), photographed by **Photo_paris_dreams by Tanya** on 15 October 2026.

## Website

**https://smikhaylyuk.github.io/paris-love-story/**

The site includes all 177 photographs, the original cover and typography, a responsive three-column masonry gallery, a keyboard- and swipe-controlled photo viewer, favorites saved in the browser, shareable photo links, individual image downloads, and ZIP downloads of the collection or favorites.

Images, thumbnails, and fonts are stored in this repository. The gallery runs without Gallera, a database, third-party scripts, or a build step. Downloaded photographs use the preserved web-resolution images; the original platform's account and server-side features are not replicated. Favorites stay on the visitor's browser and are not sent to the photographer.

## Run locally

With Node.js installed:

```sh
npm start
```

Open http://127.0.0.1:8080. Alternatively, use any static file server, for example `python -m http.server 8080` from this directory. No package installation is needed.

```sh
npm run check
```

## GitHub Pages

In **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/(root)**. This static site uses relative paths so it works under the repository's Pages URL. `.nojekyll` prevents unnecessary Jekyll processing.

## Editing

- `index.html`: page structure and dialogs
- `styles.css`: layout, typography, and responsive styles
- `app.js`: gallery interactions and local ZIP generation
- `gallery-data.js`: ordered photograph list and dimensions
- `assets/photos/`: full gallery images
- `assets/thumbnails/`: lighter gallery previews
- `assets/cover.jpg`: cover photograph
- `assets/fonts/` and `assets/fonts.css`: local typefaces

Photography and original gallery attribution remain with their respective creators.
