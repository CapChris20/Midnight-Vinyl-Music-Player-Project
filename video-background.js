/**
 * Video backgrounds — MP4 in HTML, poster hidden once video plays.
 */
const MOBILE_BREAKPOINT = '(max-width: 768px)';

class VideoBackgroundManager {
  constructor({ root }) {
    this.root = root || document.getElementById('bg-media');
    this.video = this.root?.querySelector('#bg-video');
    this.posterEl = this.root?.querySelector('.bg-poster');
    this.mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);
    this.isMobile = this.mobileQuery.matches;
    this.loaded = false;

    this._initPoster();
    this.mobileQuery.addEventListener('change', (e) => {
      this.isMobile = e.matches;
      if (this.isMobile) this._mobileFallback();
      else this.play();
    });

    if (this.isMobile) this._mobileFallback();
  }

  _initPoster() {
    const poster = this.video?.getAttribute('poster');
    if (this.posterEl && poster) {
      this.posterEl.style.backgroundImage = `url('${poster}')`;
    }
  }

  _mobileFallback() {
    this.root?.classList.add('is-mobile', 'is-ready');
    this.root?.classList.remove('is-video-playing');
    if (this.video) {
      this.video.pause();
      this.video.classList.add('is-hidden');
    }
  }

  async play() {
    if (this.loaded || !this.video || this.isMobile) return;

    this.video.muted = true;
    this.video.playsInline = true;
    this.video.loop = true;
    this.video.classList.remove('is-hidden');

    try {
      await new Promise((resolve, reject) => {
        if (this.video.readyState >= 2) return resolve();
        const ok = () => { cleanup(); resolve(); };
        const fail = () => { cleanup(); reject(new Error('Video load failed')); };
        const cleanup = () => {
          this.video.removeEventListener('canplay', ok);
          this.video.removeEventListener('error', fail);
        };
        this.video.addEventListener('canplay', ok);
        this.video.addEventListener('error', fail);
        this.video.load();
      });

      await this.video.play();
      this.root?.classList.add('is-ready', 'is-video-playing');
      this.loaded = true;
    } catch (err) {
      console.warn('[VideoBackground]', err.message);
      this.root?.classList.add('is-error');
    }
  }

  bindUserGestureRetry() {
    const retry = () => {
      if (!this.loaded && !this.isMobile) this.play();
    };
    document.addEventListener('click', retry, { once: true });
    document.addEventListener('keydown', retry, { once: true });
  }

  destroy() {
    if (this.video) {
      this.video.pause();
      this.video.load();
    }
    this.loaded = false;
  }
}

function initVideoBackground() {
  const root = document.getElementById('bg-media');
  if (!root) return null;

  const manager = new VideoBackgroundManager({ root });
  manager.bindUserGestureRetry();

  // Start immediately — bg is position:fixed full screen
  manager.play();

  window.addEventListener('pagehide', () => manager.destroy());
  return manager;
}

window.initVideoBackground = initVideoBackground;
