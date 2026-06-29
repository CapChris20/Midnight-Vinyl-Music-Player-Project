/**
 * Video backgrounds — MP4 sources in HTML, JS just plays them.
 */
const MOBILE_BREAKPOINT = '(max-width: 768px)';

class VideoBackgroundManager {
  constructor({ root }) {
    this.root = root || document.getElementById('bg-media');
    this.video = this.root?.querySelector('#bg-video');
    this.posterEl = this.root?.querySelector('.bg-poster');
    this.spinner = this.root?.querySelector('.bg-loading-spinner');
    this.errorEl = this.root?.querySelector('.bg-error-msg');
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
    if (this.video) { this.video.pause(); this.video.classList.add('is-hidden'); }
  }

  _setLoading(on) {
    this.root?.classList.toggle('is-loading', on);
    if (this.spinner) this.spinner.hidden = !on;
  }

  async play() {
    if (this.loaded || !this.video || this.isMobile) return;

    this._setLoading(true);
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.loop = true;

    try {
      await new Promise((resolve, reject) => {
        if (this.video.readyState >= 2) return resolve();
        const ok = () => { cleanup(); resolve(); };
        const fail = () => { cleanup(); reject(new Error('Video failed to load')); };
        const cleanup = () => {
          this.video.removeEventListener('canplay', ok);
          this.video.removeEventListener('error', fail);
        };
        this.video.addEventListener('canplay', ok);
        this.video.addEventListener('error', fail);
        this.video.load();
      });

      await this.video.play();
      this.video.classList.remove('is-hidden');
      this.root?.classList.add('is-ready');
      this._setLoading(false);
      this.loaded = true;
    } catch (err) {
      console.warn('[VideoBackground]', err.message);
      this._setLoading(false);
      if (this.errorEl) { this.errorEl.hidden = false; this.errorEl.textContent = 'Video unavailable'; }
      this.root?.classList.add('is-error');
    }
  }

  /** Browsers block autoplay sometimes — retry after first click */
  bindUserGestureRetry() {
    const retry = () => {
      if (!this.loaded && !this.isMobile) this.play();
    };
    document.addEventListener('click', retry, { once: true });
    document.addEventListener('keydown', retry, { once: true });
  }

  destroy() {
    if (this.video) { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); }
    this.loaded = false;
  }
}

function initVideoBackground() {
  const root = document.getElementById('bg-media');
  if (!root) return null;
  const manager = new VideoBackgroundManager({ root });
  manager.bindUserGestureRetry();

  const start = () => manager.play();
  if (document.body.classList.contains('artist-page')) {
    start();
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) { start(); obs.disconnect(); }
    }).observe(root);
  } else {
    start();
  }

  window.addEventListener('pagehide', () => manager.destroy());
  return manager;
}

window.initVideoBackground = initVideoBackground;
