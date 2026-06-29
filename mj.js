document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground();
  new MidnightVinylPlayer({
    songsUrl: 'michael_jackson.json',
    artistName: 'Michael Jackson',
    filterSongs: (raw) => raw.filter((s) =>
      s.previewUrl && s.artistName?.toLowerCase() === 'michael jackson' && !/remix|cover/i.test(s.trackName)
    ),
  });
});
