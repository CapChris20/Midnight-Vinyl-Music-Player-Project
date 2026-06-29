#!/usr/bin/env node
/**
 * Fetch 30-second preview URLs from the free iTunes Search API (no API key).
 * Usage: node scripts/fetch-itunes-previews.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const ARTISTS = [
  {
    name: 'The Weeknd',
    outFile: 'weeknd_merged.json',
    searchTerm: 'The Weeknd',
    filter: (s) =>
      s.previewUrl &&
      s.artistName?.toLowerCase() === 'the weeknd' &&
      !/remix|cover|karaoke|live/i.test(s.trackName),
  },
  {
    name: 'Frank Ocean',
    outFile: 'frank_ocean.json',
    searchTerm: 'Frank Ocean',
    filter: (s) => {
      const track = (s.trackName || '').toLowerCase();
      const artist = (s.artistName || '').toLowerCase();
      const banned = ['remix', 'rework', 'edit', 'bootleg', 'cover', 'version', 'karaoke'];
      return (
        s.previewUrl &&
        !banned.some((w) => track.includes(w)) &&
        (artist.includes('frank ocean') || track.includes('frank ocean'))
      );
    },
  },
  {
    name: 'Michael Jackson',
    outFile: 'michael_jackson.json',
    searchTerm: 'Michael Jackson',
    filter: (s) =>
      s.previewUrl &&
      s.artistName?.toLowerCase() === 'michael jackson' &&
      !/remix|cover|karaoke|live/i.test(s.trackName),
  },
];

async function searchItunes(term, limit = 200) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=${limit}&country=US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes API ${res.status} for ${term}`);
  return res.json();
}

async function main() {
  for (const artist of ARTISTS) {
    console.log(`Fetching ${artist.name}...`);
    const data = await searchItunes(artist.searchTerm);
    const filtered = data.results.filter(artist.filter);

    // Deduplicate by trackId
    const seen = new Set();
    const unique = filtered.filter((s) => {
      if (seen.has(s.trackId)) return false;
      seen.add(s.trackId);
      return true;
    });

    const output = { resultCount: unique.length, results: unique };
    const outPath = path.join(ROOT, artist.outFile);
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`  ✓ ${unique.length} songs → ${artist.outFile}`);

    if (unique[0]?.previewUrl) {
      const head = await fetch(unique[0].previewUrl, { method: 'HEAD' });
      console.log(`  ✓ Sample preview (${unique[0].trackName}): HTTP ${head.status}`);
    }
  }
  console.log('\nDone. iTunes previews are free — no API key needed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
