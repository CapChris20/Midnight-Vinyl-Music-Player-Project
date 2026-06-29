document.addEventListener('DOMContentLoaded', () => {
  initVideoBackground({
    mp4: 'videos/compressed/frankoceanbg.mp4',
    webm: 'videos/compressed/frankoceanbg.webm',
    poster: 'music-home.JPG',
  });

  const bannedWords = ['remix', 'rework', 'edit', 'bootleg', 'cover', 'version'];

  new MidnightVinylPlayer({
    songsUrl: 'frank_ocean.json',
    artistName: 'Frank Ocean',
    visualizerImages: VISUALIZER_IMAGES,
    filterSongs: (raw) =>
      raw.filter((song) => {
        const track = song.trackName?.toLowerCase() || '';
        const artist = song.artistName?.toLowerCase() || '';
        const isFrank = artist.includes('frank ocean');
        const hasPreview = !!song.previewUrl;
        const isNotBanned = !bannedWords.some((word) => track.includes(word));
        return hasPreview && isNotBanned && (isFrank || track.includes('frank ocean'));
      }),
  });
});
