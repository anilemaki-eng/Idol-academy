# Idol Academy

Personal K-pop trainee training tracker. Plain HTML, CSS and JavaScript, with no dependencies or build step.

## Run it

Open the app's website address (GitHub Pages). Everything you save (Schedule plans, practice videos, dance sections) is kept in that browser on that device.

## How it's organized

- `index.html`: the page shell (header, navigation, content area) and the list of scripts.
- `css/styles.css`: layout styles. The other files in `css/` style one page each.
- `js/app.js`: the shared `App` object.
- `js/routes.js`: the list of sections and sub-sections shown in the navigation.
- `js/router.js`: shows the right page when the address changes.
- `js/storage.js`: saving and loading data in the browser's local storage.
- `js/local-videos.js`: your own dance videos for Compare, kept on your device only.
- `js/pages/`: one file per page. Each page's features go in its own file.
- `js/pages/schedule/`: the Schedule page (`schedule.js`), its 12-month calendar (`calendar.js`) and the board for one day (`day-board.js`).
- `js/pages/training/dance/`: the Dance page (`dance.js`), its practice video list (`videos.js`), the YouTube player helpers (`youtube-player.js`), Learn Choreo (`learn-choreo.js`, `learn-choreo-player.js`), Compare (`compare.js`) and Warm Up and Stretch (`warming-up.js`).
- `images/warm-up/`: the warm-up drawings.
- `tests/`: helpers for testing (not used by the app).
- `CLAUDE.md`: notes for Claude on how this app is built and how we work.

## Adding a page

1. Add it to `js/routes.js`.
2. Create its file in `js/pages/` (copy an existing page file and change the path).
3. Add a `<script>` tag for the new file in `index.html`, before `router.js`.
