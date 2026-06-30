document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground();
  new MidnightVinylPlayer({
    songsUrl: 'frank_ocean.json',
    artistName: 'Frank Ocean',
    visualizerImages: VISUALIZER_IMAGES,
    filterSongs: (raw) => raw.filter((s) =>
      s.previewUrl
        && s.artistName?.toLowerCase().includes('frank ocean')
        && !/remix|cover|rework|edit|bootleg/i.test(s.trackName || '')
    ),
  });
});
