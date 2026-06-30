/**
 * AudioPlayer — HTML5 audio + lazy Web Audio analyser (for canvas visualizer).
 * Graph connects on first play so iTunes previews aren't blocked by CORS at load.
 */
class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = 0.7;
    this._rafId = null;
    this._lastProgressTime = -1;
    this._onTimeUpdate = null;
    this._graphReady = false;
    this.context = null;
    this.analyser = null;
  }

  _ensureGraph() {
    if (this._graphReady) return;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 64;
    const source = this.context.createMediaElementSource(this.audio);
    source.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    this._graphReady = true;
  }

  getAudioData() {
    if (!this.analyser) return new Uint8Array(32);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  async resumeContext() {
    this._ensureGraph();
    if (this.context?.state === 'suspended') await this.context.resume();
  }

  loadSong(url) {
    return new Promise((resolve, reject) => {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.src = url;
      this.audio.load();

      const onReady = () => {
        cleanup();
        resolve();
      };
      const onFail = () => {
        cleanup();
        reject(new Error('Failed to load audio'));
      };
      const cleanup = () => {
        this.audio.onloadedmetadata = null;
        this.audio.oncanplay = null;
        this.audio.onerror = null;
      };

      this.audio.onloadedmetadata = onReady;
      this.audio.oncanplay = onReady;
      this.audio.onerror = onFail;
    });
  }

  async play() {
    await this.resumeContext();
    return this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  setVolume(level) {
    this.audio.volume = Math.max(0, Math.min(1, level));
  }

  startProgressLoop(callback) {
    this.stopProgressLoop();
    this._onTimeUpdate = callback;
    const tick = () => {
      if (!this._onTimeUpdate) return;
      const t = this.audio.currentTime;
      if (t !== this._lastProgressTime) {
        this._lastProgressTime = t;
        this._onTimeUpdate(t, this.audio.duration, this.audio.buffered);
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  stopProgressLoop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._onTimeUpdate = null;
  }

  destroy() {
    this.stopProgressLoop();
    this.pause();
    this.audio.src = '';
  }
}

window.AudioPlayer = AudioPlayer;
