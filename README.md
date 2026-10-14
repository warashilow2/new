# Eco Spark Cleaning

Static one-page site for Eco Spark Cleaning, Dublin. No build step and no
dependencies: plain HTML, CSS custom properties and vanilla JS, so whatever is
in this repo is exactly what gets served.

## Looking at it locally

Open `index.html` in a browser. Every path is relative, so it works straight
from the file system - the only thing that needs a server is seeking inside the
hero videos, which uses HTTP range requests.

For a real server, from the parent folder:

```
node serve.js
```

## Publishing

GitHub Pages serves this repo as-is from the default branch, root folder.
`.nojekyll` is there to stop Pages running the files through Jekyll.

## Before this goes live on the real domain

- The Telegram bot token in `assets/js/calculator.js` is readable by anyone.
  It has to move behind a proxy and be reissued through @BotFather.
- Photos under `assets/img/results/` and `assets/img/album/` are numbered
  placeholders cut from the client's own footage. They are meant to be replaced.
- `openingHours` is deliberately absent from the structured data until the real
  hours are confirmed.
- No privacy policy or consent banner yet - both are required before running
  Google Ads to EU traffic.
