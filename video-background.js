/**
 * Video Background — fast direct streaming.
 * Videos use native browser streaming (no fetch→blob→IndexedDB blocking).
 * IDB cache runs in background after playback starts for repeat visits.
 */
const MOBILE_BREAKPOINT = '(max-width: 768px)';
const VIDEO_CACHE_DB = 'midnight-vinyl-videos-v2';
const VIDEO_CACHE_STORE = 'blobs';

class VideoBackgroundManager {
  constructor({ mp4, webm, poster, root, deferMs = 800 }) {
    this.mp4Src = mp4;
    this.webmSrc = webm;
    this.posterSrc = poster;
    this.root = root || document.getElementById('bg-media');
    this.video = this.root?.querySelector('#bg-video');
    this.posterEl = this.root?.querySelector('.bg-poster');
    this.spinner = this.root?.querySelector('.bg-loading-spinner');
    this.errorEl = this.root?.querySelector('.bg-error-msg');
    this.mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);
    this.isMobile = this.mobileQuery.matches;
    this.deferMs = deferMs;
    this.loaded = false;

    this._initPoster();
    this.mobileQuery.addEventListener('change', (e) => {
      this.isMobile = e.matches;
      if (this.isMobile) this._showMobileFallback();
      else if (!this.loaded) this.load();
    });

    if (this.isMobile) this._showMobileFallback();
  }

  _initPoster() {
    if (this.posterEl && this.posterSrc) {
      this.posterEl.style.backgroundImage = `url('${this.posterSrc}')`;
    }
    this.root?.classList.add('is-ready');
  }

  _showMobileFallback() {
    this.root?.classList.add('is-mobile', 'is-ready');
    this.root?.classList.remove('is-loading', 'is-error');
    if (this.video) this.video.classList.add('is-hidden');
  }

  _setLoading(on) {
    this.root?.classList.toggle('is-loading', on);
    if (this.spinner) this.spinner.hidden = !on;
  }

  _setError(msg) {
    this.root?.classList.add('is-error', 'is-ready');
    this.root?.classList.remove('is-loading');
    if (this.errorEl) { this.errorEl.hidden = false; this.errorEl.textContent = msg; }
    if (this.video) this.video.classList.add('is-hidden');
  }

  /** Background cache — never blocks playback */
  _cacheInBackground(url) {
    fetch(url).then((r) => r.blob()).then(async (blob) => {
      try {
        const req = indexedDB.open(VIDEO_CACHE_DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(VIDEO_CACHE_STORE);
        req.onsuccess = () => {
          const tx = req.result.transaction(VIDEO_CACHE_STORE, 'readwrite');
          tx.objectStore(VIDEO_CACHE_STORE).put(blob, url);
        };
      } catch (_) {}
    }).catch(() => {});
  }

  async load() {
    if (this.loaded || !this.video || this.isMobile) return;

    this._setLoading(true);

    // Let audio + UI paint first — video is decorative
    await new Promise((r) => setTimeout(r, this.deferMs));

    this.video.muted = true;
    this.video.playsInline = true;
    this.video.loop = true;
    this.video.preload = 'auto';

    // Direct src — browser streams, no blob conversion delay
    this.video.innerHTML = '';
    if (this.webmSrc) {
      const w = document.createElement('source');
      w.src = this.webmSrc;
      w.type = 'video/webm';
      this.video.appendChild(w);
    }
    const m = document.createElement('source');
    m.src = this.mp4Src;
    m.type = 'video/mp4';
    this.video.appendChild(m);

    try {
      await this.video.play();
      this.video.classList.remove('is-hidden');
      this.root?.classList.add('is-ready');
      this._setLoading(false);
      this.loaded = true;
      this._cacheInBackground(this.mp4Src);
    } catch (err) {
      console.warn('[VideoBackground]', err);
      this._setError('Video unavailable');
      this._setLoading(false);
    }
  }

  destroy() {
    if (this.video) {
      this.video.pause();
      this.video.innerHTML = '';
      this.video.load();
    }
    this.loaded = false;
  }
}

function initVideoBackground(config) {
  const root = document.getElementById('bg-media');
  if (!root) return null;

  const manager = new VideoBackgroundManager({ ...config, root });
  const isArtist = document.body.classList.contains('artist-page');

  const start = () => manager.load();

  if (isArtist) {
    requestAnimationFrame(() => requestAnimationFrame(start));
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) { start(); obs.disconnect(); }
    }, { rootMargin: '50px' }).observe(root);
  } else {
    start();
  }

  window.addEventListener('pagehide', () => manager.destroy());
  return manager;
}

window.initVideoBackground = initVideoBackground;
