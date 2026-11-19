# Agentic City 2035 · project site

This branch (`gh-pages`) is the published website: **https://freedomintelligence.github.io/Agentic-City/**

The repository's `main` branch holds the README, the docs and the chapter index. This branch holds only the site.

## What is here

| | |
|---|---|
| `index.html` | the one page, English with a Chinese version behind the language button (`?lang=zh`) |
| `assets/css/main.css`, `assets/js/app.js` | styles and behaviour; no build step, no framework |
| `assets/js/hero.js` | the 3D plan at the top of the page (three.js, vendored in `assets/vendor/`) |
| `assets/data/city.json` | outline, roads and building footprints traced from the one poster frame the repository publishes |
| `assets/data/chapters.json` | the 28 chapter clips: titles, lengths, narration and their GitHub attachment URLs |
| `assets/media/a-plan-you-can-run.{en,zh}.mp4` | the idea film, English and Chinese narration, with `.srt` subtitles |
| `assets/media/demo/`, `assets/media/chapters/` | stills of the studio taken from the chapter clips |
| `CREDITS.txt` | sources, third-party software and fonts, and what is an illustration |

The chapter clips are not copied here: the page streams them from the attachments of issue #1 in this repository.
Deleting that issue would break the chapter browser.

## Editing

The page's text is in `index.html`. The Chinese wording of an element is in its `data-zh` attribute, next to the English.
Two things live elsewhere: the approval replay's four steps are the `STEPS` list in `assets/js/app.js`, and the chapter titles
are in `assets/data/chapters.json`.

To look at the page locally, serve this folder with any static file server and open it, for example:

```
python -m http.server 8000
```

Then push to this branch: GitHub Pages publishes it in about a minute.

© 2026 Jing Qian. All rights reserved. See `NOTICE` on the `main` branch. This site is a showcase, not a release.
