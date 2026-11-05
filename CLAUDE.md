# Idol Academy: notes for Claude

A personal K-pop trainee training tracker, built stage by stage together with
its owner. Live site: https://anilemaki-eng.github.io/Idol-academy/
(GitHub Pages, served from `main`, root folder).

## Working with the owner

- The owner is not a programmer. Explain everything in simple, short English,
  without technical words. Say what changed and how to use it, not how it was
  coded.
- The owner controls the app's design and features.
  - **Decide small, obvious details yourself** (button sizes, wording of
    messages, remembering where the user stopped, fixing a gap that is clearly
    a bug) and mention them briefly afterwards.
  - **Ask first** about anything that changes what the app does or how it
    looks and feels: a new feature or screen, a different flow, saved data,
    privacy, hosting or other big technical changes.
- Don't invent features, content or sample data. Suggesting ideas is welcome,
  but ask before building them.
- Work on one area at a time. Dance is being finished first; Vocals and Rap
  come later, and only after discussing them with the owner. Home, Profile
  (Profile Info, Settings, Notifications, History), Goals, Vocals, Rap and
  Korean are still empty placeholders.
- After a change: test it, commit, push to `main` (that publishes the site),
  then tell the owner to refresh the app in a minute or two.

## How the app is built

- Plain HTML, CSS and JavaScript. No build step, no libraries, no npm.
- `index.html` loads every script in order: core (`app.js`, `routes.js`,
  `storage.js`, `local-videos.js`), then the page files, then `router.js`
  last. A new file needs its own `<script>` or `<link>` tag there.
- **Navigation**: `js/routes.js` lists the sections shown in the bottom menu
  and their sub-sections. Addresses are hashes: path `/training/dance` is
  `#training-dance`. `hasDetail: true` lets a page take a longer address
  (`#schedule-2026-11-05`, `#training-dance-learn-choreo-<videoId>`);
  `detailOwnPage: true` shows those longer addresses without the section
  headings on top.
- **Pages**: each page file calls `App.registerPage(path, render)`.
  `render(container, detail)` draws into `container` and may return a
  cleanup function, which the router calls when you leave (stop timers,
  watchers, players).
- **Layout**: white background, minimal styling, large tap targets (48px).
  The main menu is fixed at the bottom (about 58px tall), so keep the
  important buttons of a screen visible above it on a phone. Always check
  phone widths (320 and 375px) and desktop.

## Saved data (all on the user's device)

- `js/storage.js`: `App.storage.watch(name, onData, onError)` and
  `App.storage.save(name, data)`, kept in `localStorage` with the prefix
  `idol-academy:`. Records:
  - `schedule/<YYYY-MM-DD>`: `{ items: [{ id, time, text, done }] }`
  - `dance/videos`: `{ items: [{ id, name, url }] }` (YouTube links)
  - `dance-choreo/<videoId>`: `{ sections: [{ id, start, end }], current,
    furthest, speed, mirror, finished }`
  - `dance-compare/<videoId>`: `{ pro, mine }` (where both videos were lined up)
  - `dance-compare-flip/<videoId>`: `{ flip: true }`
- `js/local-videos.js`: the user's own dance videos for Compare, kept in
  IndexedDB on the device.
- **Privacy rule from the owner**: the user's own videos must never be
  uploaded or sent to any service. Don't add anything that does, unless the
  owner explicitly approves it.
- The GitHub repository is public (needed for free GitHub Pages), so never
  commit personal data.

## Dance (Training > Dance)

- `dance.js`: the three buttons (Warm Up and Stretch, Learn Choreo, Compare)
  and the practice video list (`videos.js`: name + YouTube link, tap opens
  YouTube).
- `youtube-player.js`: reads a video id from a YouTube link and loads
  YouTube's official IFrame Player API. YouTube decides which speeds are
  allowed, so the app always uses the closest allowed speed and says so.
  Some videos can't be embedded (errors 101/150): show "Open it on YouTube
  instead".
- **Learn Choreo** (`learn-choreo.js` picks a video,
  `learn-choreo-player.js` plays it):
  1. Mark sections: plays from 0:00 at 1.00x; one button ends the current
     section and starts the next; the last section ends with the video.
  2. Learn: the current section repeats by itself, starting at 0.50x;
     Slower/Faster change it by 0.10x (0.50x to 1.00x). Next section only
     appears at 1.00x (or for sections already reached). Also: Previous,
     Fix sections (move a start by 0.2s, join, split), Mirror, and
     "Practice the whole dance" once every section has been learned.
     Progress is remembered.
- **Compare** (`compare.js`): the practice video plus the user's own video
  (local only, remembered on the device). Play/Pause/Restart both, speed for
  both (0.50x to 1.00x), Flip for the user's video, and its own simple
  controls (slider, 0.2s steps, sound) so flipping doesn't flip a time bar.
- **Warm Up and Stretch** (`warming-up.js`, address `#training-dance-warming-up`):
  8 "Get moving" moves, then 16 stretches, each with a drawing, steps and a
  time. Start runs it by itself (Get ready, Move/Hold, Switch sides, next),
  with beeps and the screen kept awake.
- Drawings in `images/warm-up/` are line drawings provided by the owner,
  trimmed and resized (max 640px, WebP). Only use drawings the owner
  provides; never copy screenshots or content from other creators' videos.

## Testing

- Test every change in a real browser before pushing: Playwright for Python
  with the pre-installed Chromium, opening
  `file:///…/idol-academy/index.html#<address>`.
- YouTube can't be reached from Claude's workspace. Route
  `https://www.youtube.com/iframe_api` to `tests/mock-youtube.js`, a stand-in
  player. Before the page loads, set `window.__timeScale` (time runs that many
  times faster), `window.__duration` (video length in seconds),
  `window.__mockRates` (allowed speeds) and `window.__mockError` (an error
  code to report). Remember to divide YouTube times by `__timeScale` when
  comparing them with real-time things like the user's own video.
- For timers (Warm Up and Stretch), use Playwright's `page.clock` to fast
  forward.
- For Compare, make a small test video with ffmpeg (WebM/VP8 plays in
  Chromium).
- Real YouTube behaviour (allowed speeds, embedding) can only be checked on
  the owner's phone, so say so when it matters.

## Publishing

- `git push origin main` publishes; GitHub Pages updates in about a minute.
- End every commit message with the attribution lines given in the session.
- An older copy of the app was once published as a private Claude artifact;
  it is out of date and no longer used.
