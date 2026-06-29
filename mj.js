document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground({
    mp4: 'videos/compressed/mjbg.mp4',
    webm: 'videos/compressed/mjbg.webm',
    poster: 'mjphoto.PNG',
  });

  new MidnightVinylPlayer({
    songsUrl: 'michael_jackson.json',
    artistName: 'Michael Jackson',
    visualizerImages: VISUALIZER_IMAGES,
    filterSongs: (raw) =>
      raw.filter(
        (song) =>
          song.previewUrl &&
          song.artistName?.toLowerCase() === 'michael jackson' &&
          !/remix|cover/i.test(song.trackName)
      ),
  });
});
