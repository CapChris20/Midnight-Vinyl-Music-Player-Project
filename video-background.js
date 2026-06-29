/**
 * Video Background Manager — Midnight Vinyl
 *
 * Performance strategy:
 * - preload="none": no network fetch until explicitly requested
 * - Lazy init on artist page navigation (not on home until visible)
 * - IndexedDB blob cache: repeat visits skip re-download
 * - Mobile (≤768px): skip video entirely — poster + CSS gradient animation
 * - Cleanup on pagehide: pause, revoke object URLs, detach sources
 * - MP4 (H.264) primary, WebM (VP9) fallback
 */

const VIDEO_CACHE_DB = 'midnight-vinyl-videos';
const VIDEO_CACHE_STORE = 'blobs';
const MOBILE_BREAKPOINT = '(max-width: 768px)';

class VideoBackgroundManager {
  /**
   * @param {Object} options
   * @param {string} options.mp4 - Path to H.264 MP4
   * @param {string} [options.webm] - Path to VP9 WebM fallback
   * @param {string} options.poster - Static fallback image
   * @param {HTMLElement} [options.root] - Container (#bg-media)
   */
  constructor({ mp4, webm, poster, root }) {
    this.mp4Src = mp4;
    this.webmSrc = webm || mp4.replace(/\.mp4$/i, '.webm');
    this.posterSrc = poster;
    this.root = root || document.getElementById('bg-media');
    this.video = this.root?.querySelector('#bg-video');
    this.posterEl = this.root?.querySelector('.bg-poster');
    this.spinner = this.root?.querySelector('.bg-loading-spinner');
    this.errorEl = this.root?.querySelector('.bg-error-msg');
    this.mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);
    this.isMobile = this.mobileQuery.matches;
    this.loaded = false;
    this.objectUrls = [];
    this._abortController = null;

    this._bindMobileListener();
    this._initPoster();
  }

  /** Detect viewport changes — tear down video if user resizes to mobile */
  _bindMobileListener() {
    this.mobileQuery.addEventListener('change', (e) => {
      this.isMobile = e.matches;
      if (this.isMobile) {
        this.destroy();
        this._showMobileFallback();
      } else if (!this.loaded) {
        this.load();
      }
    });
  }

  _initPoster() {
    if (!this.posterEl || !this.posterSrc) return;
    this.posterEl.style.backgroundImage = `url('${this.posterSrc}')`;
  }

  _showMobileFallback() {
    if (!this.root) return;
    this.root.classList.add('is-mobile', 'is-ready');
    this.root.classList.remove('is-loading', 'is-error');
    if (this.video) this.video.classList.add('is-hidden');
    console.info('[VideoBackground] Mobile detected — using static poster + gradient');
  }

  _setLoading(loading) {
    this.root?.classList.toggle('is-loading', loading);
    if (this.spinner) this.spinner.hidden = !loading;
  }

  _setError(message) {
    console.error('[VideoBackground] Load failed:', message);
    this.root?.classList.add('is-error', 'is-ready');
    this.root?.classList.remove('is-loading');
    if (this.errorEl) {
      this.errorEl.hidden = false;
      this.errorEl.textContent = message || 'Video unavailable';
    }
    if (this.video) this.video.classList.add('is-hidden');
  }

  _setReady() {
    this.root?.classList.add('is-ready');
    this.root?.classList.remove('is-loading', 'is-error');
    if (this.errorEl) this.errorEl.hidden = true;
    if (this.video) this.video.classList.remove('is-hidden');
    this._setLoading(false);
  }

  /** Open IndexedDB for video blob caching */
  _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(VIDEO_CACHE_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(VIDEO_CACHE_STORE)) {
          db.createObjectStore(VIDEO_CACHE_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async _getCachedBlob(key) {
    try {
      const db = await this._openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(VIDEO_CACHE_STORE, 'readonly');
        const req = tx.objectStore(VIDEO_CACHE_STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[VideoBackground] IndexedDB read failed:', err);
      return null;
    }
  }

  async _setCachedBlob(key, blob) {
    try {
      const db = await this._openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(VIDEO_CACHE_STORE, 'readwrite');
        tx.objectStore(VIDEO_CACHE_STORE).put(blob, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[VideoBackground] IndexedDB write failed:', err);
    }
  }

  _revokeObjectUrls() {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }

  /**
   * Fetch video with cache-first strategy.
   * Returns blob URL suitable for <video src>.
   */
  async _resolveSource(url) {
    const cached = await this._getCachedBlob(url);
    if (cached) {
      console.info('[VideoBackground] Cache hit:', url);
      const blobUrl = URL.createObjectURL(cached);
      this.objectUrls.push(blobUrl);
      return blobUrl;
    }

    console.info('[VideoBackground] Fetching:', url);
    this._abortController = new AbortController();
    const response = await fetch(url, { signal: this._abortController.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);

    const blob = await response.blob();
    await this._setCachedBlob(url, blob);
    const blobUrl = URL.createObjectURL(blob);
    this.objectUrls.push(blobUrl);
    return blobUrl;
  }

  /** Try WebM first if browser supports it, else MP4 */
  _pickFormat() {
    const v = document.createElement('video');
    if (v.canPlayType('video/webm; codecs="vp9"') && this.webmSrc) {
      return { url: this.webmSrc, type: 'video/webm' };
    }
    return { url: this.mp4Src, type: 'video/mp4' };
  }

  /**
   * Load and play background video on demand.
   * Called when user navigates to artist page or home becomes visible.
   */
  async load() {
    if (this.loaded || !this.video || !this.root) return;
    if (this.isMobile) {
      this._showMobileFallback();
      this.loaded = true;
      return;
    }

    this._setLoading(true);
    const { url, type } = this._pickFormat();

    try {
      const src = await this._resolveSource(url);
      this.video.innerHTML = '';
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      this.video.appendChild(source);
      this.video.load();

      await new Promise((resolve, reject) => {
        const onCanPlay = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error(`Failed to decode ${url}`));
        };
        const cleanup = () => {
          this.video.removeEventListener('canplay', onCanPlay);
          this.video.removeEventListener('error', onError);
        };
        this.video.addEventListener('canplay', onCanPlay);
        this.video.addEventListener('error', onError);
      });

      this.video.muted = true;
      this.video.playsInline = true;
      this.video.loop = true;
      await this.video.play();
      this._setReady();
      this.loaded = true;
      console.info('[VideoBackground] Playing:', url);
    } catch (err) {
      if (err.name === 'AbortError') return;
      // Fallback: try MP4 if WebM failed
      if (url !== this.mp4Src) {
        try {
          const src = await this._resolveSource(this.mp4Src);
          this.video.innerHTML = '';
          const source = document.createElement('source');
          source.src = src;
          source.type = 'video/mp4';
          this.video.appendChild(source);
          this.video.load();
          await this.video.play();
          this._setReady();
          this.loaded = true;
          return;
        } catch (mp4Err) {
          this._setError('Video unavailable');
          return;
        }
      }
      this._setError('Video unavailable');
    }
  }

  /** Pause and release memory — call on navigation away */
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.innerHTML = '';
      this.video.load();
    }
    this._revokeObjectUrls();
    this.loaded = false;
    console.info('[VideoBackground] Destroyed — memory released');
  }
}

/**
 * Home page: lazy load when hero is in viewport (IntersectionObserver).
 * Artist pages: load immediately on DOMContentLoaded.
 */
function initVideoBackground(config) {
  const root = document.getElementById('bg-media');
  if (!root) return null;

  const manager = new VideoBackgroundManager({ ...config, root });
  const isArtistPage = document.body.classList.contains('artist-page');

  const startLoad = () => manager.load();

  if (isArtistPage) {
    // Artist page = user navigated here intentionally — load on demand
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startLoad);
    } else {
      startLoad();
    }
  } else if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startLoad();
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(root);
  } else {
    startLoad();
  }

  window.addEventListener('pagehide', () => manager.destroy());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && manager.video) manager.video.pause();
    else if (!document.hidden && manager.loaded && manager.video && !manager.isMobile) {
      manager.video.play().catch(() => {});
    }
  });

  return manager;
}

window.VideoBackgroundManager = VideoBackgroundManager;
window.initVideoBackground = initVideoBackground;
