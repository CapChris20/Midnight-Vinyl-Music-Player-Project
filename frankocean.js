document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground();
  const banned = ['remix', 'rework', 'edit', 'bootleg', 'cover', 'version'];
  new MidnightVinylPlayer({
    songsUrl: 'frank_ocean.json',
    artistName: 'Frank Ocean',
    filterSongs: (raw) => raw.filter((s) => {
      const track = s.trackName?.toLowerCase() || '';
      const artist = s.artistName?.toLowerCase() || '';
      return s.previewUrl && !banned.some((w) => track.includes(w))
        && (artist.includes('frank ocean') || track.includes('frank ocean'));
    }),
  });
});
