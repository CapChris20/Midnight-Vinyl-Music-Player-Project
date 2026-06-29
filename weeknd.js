document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground({
    mp4: 'videos/compressed/weekndbg.mp4',
    webm: 'videos/compressed/weekndbg.webm',
    poster: 'weekndphoto.PNG',
  });

  new MidnightVinylPlayer({
    songsUrl: 'weeknd_merged.json',
    artistName: 'The Weeknd',
    filterSongs: (raw) => raw.filter((s) =>
      s.previewUrl && s.artistName?.toLowerCase() === 'the weeknd' && !/remix|cover/i.test(s.trackName)
    ),
  });
});
