# Architecture Decision Records — Midnight Vinyl Music Player

Midnight Vinyl is a cyberpunk / retrowave music player with pages for The Weeknd, Frank Ocean and Michael Jackson. It plays 30-second iTunes previews over full-screen video backgrounds, with a real-time Web Audio frequency visualizer. It's vanilla HTML/CSS/JS on Firebase Hosting.

These records were reconstructed from the code in this repo (`player-core.js`, `audio-player.js`, `scripts/`, `firebase.json`).

---

# ADR-001: iTunes Search API previews, pre-fetched into static JSON

## Context
A music player needs playable audio. Full-track streaming requires licensing or a streaming platform's SDK and user login.

## Alternatives Considered
- **Spotify Web Playback SDK**: Full tracks, but every listener needs a Spotify **Premium** login and OAuth, and the app has to be approved for public users.
- **YouTube embeds**: Free, but no access to raw audio, so no Web Audio visualizer, and the embed UI clashes with the design.
- **Hosting MP3s myself**: Copyright infringement.
- **Calling iTunes live on each page load**: Always fresh, but it adds latency, depends on the API being up, and the API is rate-limited (~20 calls/min).

## Decision
`scripts/fetch-itunes-previews.js` queries the **free, keyless iTunes Search API** once, filters out remixes, covers, karaoke and live versions, and writes one JSON file per artist. Pages load the local JSON and stream `previewUrl` (30-second AAC clips from Apple's CDN).

## Rationale
It's legal (Apple provides previews for promotional use), needs no login and no API key, and loads instantly from the same origin.

## Tradeoffs
- **Gained:** zero-friction playback for any visitor, and an app that works if the iTunes API is down.
- **Cost:** clips are only 30 seconds. Preview URLs can expire or change, so the JSON needs periodic re-fetching. The JSON keeps the full iTunes response (many unused fields).

## What I'd Change
Trim the JSON to the fields actually used (`trackName`, `previewUrl`, `collectionName`, `artworkUrl100`), which is what the sequel's `songs.js` does. I'd also add a scheduled re-fetch or a check for broken links.

## Measurement
- Tracks: **Weeknd 145, Frank Ocean 147, Michael Jackson 179 = 471 previews**.
- Each preview is 30 s.

---

# ADR-002: Vanilla JS + Web Audio API visualizer (no framework)

## Context
This is a portfolio piece meant to show core browser skills. There are three near-identical artist pages.

## Alternatives Considered
- **React/Vue**: Component reuse, but a build step and runtime overhead for a few pages.
- **Howler.js / Wavesurfer**: Easier audio handling, but hides the Web Audio fundamentals the project is meant to demonstrate.

## Decision
A shared `player-core.js` (playback, shuffle, repeat, progress, volume) and `audio-player.js` (`AudioContext` → `createMediaElementSource` → `AnalyserNode`, `fftSize = 64`) drive canvas frequency bars. Each artist file (`weeknd.js`, `frankocean.js`, `mj.js`, ~11–13 lines) only configures the shared core.

## Rationale
There's no build step, so the site deploys as is. Keeping shared logic in one place stops three diverging copies.

## Tradeoffs
- **Gained:** a tiny payload and code that shows the fundamentals directly.
- **Cost:** `createMediaElementSource` on cross-origin audio needs CORS headers from Apple's CDN, otherwise the analyser outputs silence. The DOM IDs are a hidden contract, which is why `LOVABLE_PROMPT.md` lists hooks "not to break".

## What I'd Change
Set `audio.crossOrigin = 'anonymous'` explicitly and fall back to a simulated visualizer if the analyser returns all zeros.

## Measurement
- `fftSize = 64` gives **32 frequency bins** per frame.
- Shared core is 382 lines (`player-core.js`). Per-artist config is 11–13 lines.

---

# ADR-003: Firebase Hosting with tuned cache headers + compressed videos in Git LFS

## Context
Each page has a full-screen looping background video. Large videos hurt load time and hosting bandwidth, and HTML/JS changes must show up immediately after a deploy.

## Alternatives Considered
- **Netlify / GitHub Pages**: Also free. GitHub Pages can't set custom cache headers.
- **YouTube/Vimeo background embeds**: No bandwidth cost, but branding, autoplay limits and less control.

## Decision
- **Firebase Hosting** (`midnight-vinyl-playe.web.app`) with headers: HTML `no-store`, JS/CSS/JSON `no-cache`, and MP4 `public, max-age=31536000, immutable`.
- `scripts/compress-videos.sh` re-encodes videos to 720p (target 3–5 MB) and creates VP9 WebM copies. MP4s are stored in **Git LFS**.

## Rationale
Deploys show up immediately, while heavy videos are cached by the browser for a year.

## Tradeoffs
- **Gained:** fast repeat visits and a small repo.
- **Cost:** `immutable` MP4s with fixed names (`weekndbg.mp4`) **can't be updated in place**; browsers keep the old file for a year unless the filename changes. The WebM files are generated but not referenced by the HTML. A CI deploy that clones without `git lfs pull` would upload 132-byte LFS pointer files instead of videos.

## What I'd Change
Add content hashes to video filenames (`weekndbg.3f9a.mp4`), add `<source type="video/webm">` before the MP4 so browsers that support it get the smaller file, and run `git lfs pull` in any deploy pipeline.

## Measurement
Background video sizes (MP4 / WebM):
- Home: 1.14 MB / 0.74 MB
- Weeknd: 1.77 MB / 0.89 MB
- Frank Ocean: 0.52 MB / 0.50 MB
- MJ: 2.35 MB / 1.34 MB

Serving the WebM copies would save **~2.3 MB (≈40%)** across the four pages.

---

# ADR-004: No database, authentication or payments

## Context
The player is a public demo.

## Decision
No backend. The README mentions `localStorage` for user preferences, and there are no accounts.

## Rationale
Nothing needs to be persisted or protected.

## Tradeoffs
Playlists and favorites can't sync across devices.

## What I'd Change
Nothing for a portfolio piece.

## Measurement
Not applicable.
