/**
 * Background video — src is in HTML, autoplay muted.
 */
function initVideoBackground() {
  const video = document.getElementById('bg-video');
  if (!video) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) return;

  video.muted = true;
  video.playsInline = true;
  video.loop = true;

  const tryPlay = () => {
    video.play().catch(() => {});
  };

  if (video.readyState >= 2) {
    tryPlay();
  } else {
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  document.addEventListener('click', tryPlay, { once: true });
}

window.initVideoBackground = initVideoBackground;
