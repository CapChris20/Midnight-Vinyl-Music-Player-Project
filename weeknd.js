document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground({
    mp4: 'videos/compressed/weekndbg.mp4',
    webm: 'videos/compressed/weekndbg.webm',
    poster: 'weekndphoto.PNG',
  });

  new MidnightVinylPlayer({
    songsUrl: 'weeknd_merged.json',
    artistName: 'The Weeknd',
    visualizerImages: VISUALIZER_IMAGES,
    filterSongs: (raw) =>
      raw.filter(
        (song) =>
          song.previewUrl &&
          song.artistName?.toLowerCase() === 'the weeknd' &&
          !/remix|cover/i.test(song.trackName)
      ),
  });
});
