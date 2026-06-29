document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground({
    mp4: 'videos/compressed/mjbg.mp4',
    webm: 'videos/compressed/mjbg.webm',
    poster: 'mjphoto.PNG',
  });

  new MidnightVinylPlayer({
    songsUrl: 'michael_jackson.json',
    artistName: 'Michael Jackson',
    filterSongs: (raw) => raw.filter((s) =>
      s.previewUrl && s.artistName?.toLowerCase() === 'michael jackson' && !/remix|cover/i.test(s.trackName)
    ),
  });
});
