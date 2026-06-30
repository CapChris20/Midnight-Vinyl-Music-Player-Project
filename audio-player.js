/**
 * Simple audio — plain HTML5 Audio, no Web Audio routing (most reliable for iTunes previews).
 */
class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = 0.7;
    this._rafId = null;
    this._lastProgressTime = -1;
    this._onTimeUpdate = null;
  }

  getAudioData() {
    return new Uint8Array(64);
  }

  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  async resumeContext() {}

  loadSong(url) {
    return new Promise((resolve, reject) => {
      this.audio.pause();
      this.audio.src = url;
      this.audio.load();
      this.audio.onloadedmetadata = () => resolve();
      this.audio.onerror = () => reject(new Error('Failed to load audio'));
    });
  }

  async play() {
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
