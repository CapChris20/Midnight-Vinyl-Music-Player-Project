document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground();
  new MidnightVinylPlayer({
    songsUrl: 'weeknd_merged.json',
    artistName: 'The Weeknd',
    visualizerImages: VISUALIZER_IMAGES,
    filterSongs: (raw) => raw.filter((s) =>
      s.previewUrl && s.artistName?.toLowerCase() === 'the weeknd' && !/remix|cover/i.test(s.trackName)
    ),
  });
});
