/**
 * Background video — src is in HTML, autoplay muted.
 */
function initVideoBackground() {
  const video = document.getElementById('bg-video');
  if (!video) return;

  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.setAttribute('playsinline', '');

  const tryPlay = () => {
    video.play().catch(() => {});
  };

  if (video.readyState >= 2) {
    tryPlay();
  } else {
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  document.addEventListener('click', tryPlay, { once: true });
  document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
}

window.initVideoBackground = initVideoBackground;
