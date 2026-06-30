document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground();
  new MidnightVinylPlayer({
    songsUrl: 'michael_jackson.json',
    artistName: 'Michael Jackson',
    visualizerImages: VISUALIZER_IMAGES,
    filterSongs: (raw) => raw.filter((s) =>
      s.previewUrl && s.artistName?.toLowerCase() === 'michael jackson' && !/remix|cover/i.test(s.trackName)
    ),
  });
});
