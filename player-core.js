/**
 * MidnightVinylPlayer — canvas visualizer, shuffled bg images, iTunes previews.
 */
class MidnightVinylPlayer {
  constructor(config) {
    this.config = config;
    this.songs = [];
    this.shuffledSongs = [];
    this.currentIndex = 0;
    this.isShuffle = false;
    this.repeatMode = 'off';
    this.isMuted = false;
    this.savedVolume = 0.7;
    this.isScrubbing = false;
    this.lastImageIndex = -1;
    this.previewFailStreak = 0;

    this.audioPlayer = new AudioPlayer();
    this.audio = this.audioPlayer.audio;

    this._cacheElements();
    this._setupCanvas();
    this._setupVisualizer();
    this._bindControls();
    this._bindKeyboard();
    this._bindProgress();
    this.init();
  }

  _cacheElements() {
    this.el = {
      title: document.getElementById('song-title'),
      artist: document.getElementById('artist-name'),
      meta: document.getElementById('now-playing-meta'),
      timeDisplay: document.getElementById('time-display'),
      progressBar: document.getElementById('progress-bar'),
      bufferBar: document.getElementById('buffer-bar'),
      scrubTooltip: document.getElementById('scrub-tooltip'),
      volumeDisplay: document.getElementById('volume-display'),
      playBtn: document.querySelector('.btn-play'),
      pauseBtn: document.querySelector('.btn-pause'),
      forwardBtn: document.querySelector('.btn-forward'),
      backwardBtn: document.querySelector('.btn-backward'),
      repeatBtn: document.querySelector('.btn-repeat'),
      shuffleBtn: document.querySelector('.btn-shuffle'),
      volUpBtn: document.querySelector('.btn-vol-up'),
      volDownBtn: document.querySelector('.btn-vol-down'),
      muteBtn: document.querySelector('.btn-mute'),
      canvas: document.getElementById('song-canvas'),
      playerMain: document.getElementById('player-main'),
    };
    this.ctx = this.el.canvas?.getContext('2d');
  }

  _setupCanvas() {
    if (!this.el.canvas) return;
    const resize = () => {
      this.el.canvas.width = this.el.canvas.clientWidth;
      this.el.canvas.height = this.el.canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
  }

  _setupVisualizer() {
    const images = this.config.visualizerImages || [];
    this.bgImage = new Image();
    this.bgImage.crossOrigin = 'anonymous';
    this.bgReady = false;
    this.bgImage.onload = () => { this.bgReady = true; };
    this.bgImage.onerror = () => { this.bgReady = false; };

    this.changeVisualizerImage = () => {
      if (!images.length) return;
      this.bgReady = false;
      let idx;
      do {
        idx = Math.floor(Math.random() * images.length);
      } while (images.length > 1 && idx === this.lastImageIndex);
      this.lastImageIndex = idx;
      this.bgImage.src = images[idx];
    };

    const draw = () => {
      requestAnimationFrame(draw);
      if (!this.ctx || !this.el.canvas) return;
      const { width, height } = this.el.canvas;
      this.ctx.clearRect(0, 0, width, height);
      if (this.bgReady) this.ctx.drawImage(this.bgImage, 0, 0, width, height);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      this.ctx.fillRect(0, 0, width, height);
      try {
        const data = this.audioPlayer.getAudioData();
        const barW = Math.max(2, (width / data.length) * 2.5);
        let x = 0;
        data.forEach((value) => {
          const barH = value / 2;
          const grad = this.ctx.createLinearGradient(0, height, 0, height - barH);
          grad.addColorStop(0, 'rgba(255, 107, 207, 0.85)');
          grad.addColorStop(1, 'rgba(45, 226, 230, 0.85)');
          this.ctx.fillStyle = grad;
          this.ctx.fillRect(x, height - barH, barW, barH);
          x += barW + 1;
        });
      } catch (_) { /* analyser not ready yet */ }
    };
    draw();
    if (images.length) this.changeVisualizerImage();
  }

  get activeList() {
    return this.isShuffle ? this.shuffledSongs : this.songs;
  }

  _updateNowPlayingMeta() {
    if (!this.el.meta) return;
    const list = this.activeList;
    const parts = [`Track ${this.currentIndex + 1} of ${list.length}`];
    if (this.isShuffle) parts.push('Shuffle');
    if (this.repeatMode === 'one') parts.push('Repeat One');
    else if (this.repeatMode === 'all') parts.push('Repeat All');
    this.el.meta.textContent = parts.join(' · ');
  }

  _updateRepeatUI() {
    if (!this.el.repeatBtn) return;
    this.el.repeatBtn.dataset.mode = this.repeatMode;
    this.el.repeatBtn.classList.toggle('is-active', this.repeatMode !== 'off');
    this.el.repeatBtn.setAttribute('aria-pressed', String(this.repeatMode !== 'off'));
  }

  _updateShuffleUI() {
    this.el.shuffleBtn?.classList.toggle('is-active', this.isShuffle);
    this.el.shuffleBtn?.setAttribute('aria-pressed', String(this.isShuffle));
  }

  _updateVolumeUI() {
    const pct = Math.round(this.audio.volume * 100);
    if (this.el.volumeDisplay) {
      this.el.volumeDisplay.textContent = this.isMuted ? 'Muted' : `${pct}%`;
    }
    const icon = this.el.muteBtn?.querySelector('i');
    if (icon) {
      icon.className = this.isMuted || pct === 0
        ? 'fa-solid fa-volume-xmark'
        : pct < 50 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
    }
  }

  _updatePlayPauseUI(playing) {
    if (this.el.playBtn) this.el.playBtn.hidden = playing;
    if (this.el.pauseBtn) this.el.pauseBtn.hidden = !playing;
    this.el.playerMain?.classList.toggle('is-playing', playing);
  }

  _updateTimeDisplay(current, duration) {
    const cur = this.audioPlayer.formatTime(current);
    const dur = this.audioPlayer.formatTime(duration || 30);
    if (this.el.timeDisplay) this.el.timeDisplay.textContent = `${cur} / ${dur}`;
  }

  _updateBufferBar(buffered, duration) {
    if (!this.el.bufferBar || !duration) return;
    let end = 0;
    for (let i = 0; i < buffered.length; i++) end = Math.max(end, buffered.end(i));
    this.el.bufferBar.style.width = `${(end / duration) * 100}%`;
  }

  _buildShuffledList() {
    const copy = [...this.songs];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    this.shuffledSongs = copy;
  }

  async loadSong(index, skipFailAdvance = false) {
    const list = this.activeList;
    if (!list.length) return;

    const song = list[index];
    if (!song?.previewUrl) return;

    this.currentIndex = index;
    this.audio.pause();
    this.audio.loop = this.repeatMode === 'one';

    if (this.el.title) this.el.title.textContent = song.trackName || 'Unknown';
    if (this.el.artist) this.el.artist.textContent = song.artistName || this.config.artistName;
    this.changeVisualizerImage?.();
    this._updateNowPlayingMeta();

    try {
      await this.audioPlayer.loadSong(song.previewUrl);
      this.previewFailStreak = 0;
    } catch (err) {
      console.error('[Player] Load failed:', song.trackName, err);
      this.previewFailStreak += 1;
      if (!skipFailAdvance && this.previewFailStreak < 8) {
        await this.loadSong((index + 1) % list.length, true);
        return;
      }
      if (this.el.title) this.el.title.textContent = 'Preview unavailable — try next track';
      this._updatePlayPauseUI(false);
      return;
    }

    const duration = Math.floor(this.audio.duration) || 30;
    if (this.el.progressBar) {
      this.el.progressBar.max = duration;
      this.el.progressBar.value = 0;
    }
    this._updateTimeDisplay(0, duration);
    this._updatePlayPauseUI(false);
    if (this.el.meta) this.el.meta.textContent = 'Press ▶ to play';
  }

  async init() {
    try {
      const res = await fetch(`${this.config.songsUrl}?v=20250630b`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.results || [];
      this.songs = this.config.filterSongs(raw);

      if (this.songs.length) {
        this._buildShuffledList();
        await this.loadSong(0);
      } else if (this.el.title) {
        this.el.title.textContent = 'No songs found';
      }
    } catch (err) {
      console.error('[Player] Init failed:', err);
      if (this.el.title) this.el.title.textContent = 'Failed to load playlist';
    }

    this._updateRepeatUI();
    this._updateShuffleUI();
    this._updateVolumeUI();

    this.audioPlayer.startProgressLoop((current, duration, buffered) => {
      if (!this.isScrubbing && this.el.progressBar) this.el.progressBar.value = current;
      this._updateTimeDisplay(current, duration);
      this._updateBufferBar(buffered, duration);
    });

    this.audio.addEventListener('ended', () => this._onEnded());
    window.addEventListener('pagehide', () => this.destroy());
  }

  _onEnded() {
    if (this.repeatMode === 'one') return;
    const list = this.activeList;
    if (this.repeatMode === 'all' && this.currentIndex >= list.length - 1) this.loadSong(0);
    else this.skipForward();
  }

  async togglePlay() {
    if (this.audio.paused) {
      try {
        await this.audioPlayer.play();
        this._updatePlayPauseUI(true);
        this._updateNowPlayingMeta();
      } catch (err) {
        console.warn('[Player] Play blocked:', err);
        this._updatePlayPauseUI(false);
        if (this.el.meta) this.el.meta.textContent = 'Tap ▶ to play (browser needs a click)';
      }
    } else {
      this.audio.pause();
      this._updatePlayPauseUI(false);
    }
  }

  skipForward() {
    const list = this.activeList;
    if (!list.length) return;
    this.loadSong((this.currentIndex + 1) % list.length);
  }

  skipBack() {
    const list = this.activeList;
    if (!list.length) return;
    if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
    this.loadSong((this.currentIndex - 1 + list.length) % list.length);
  }

  cycleRepeat() {
    const order = ['off', 'all', 'one'];
    this.repeatMode = order[(order.indexOf(this.repeatMode) + 1) % order.length];
    this.audio.loop = this.repeatMode === 'one';
    this._updateRepeatUI();
    this._updateNowPlayingMeta();
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    if (this.isShuffle) this._buildShuffledList();
    this._updateShuffleUI();
    this._updateNowPlayingMeta();
  }

  adjustVolume(delta) {
    this.isMuted = false;
    this.audioPlayer.setVolume(this.audio.volume + delta);
    this.savedVolume = this.audio.volume;
    this._updateVolumeUI();
  }

  toggleMute() {
    if (this.isMuted) {
      this.isMuted = false;
      this.audioPlayer.setVolume(this.savedVolume || 0.7);
    } else {
      this.savedVolume = this.audio.volume;
      this.isMuted = true;
      this.audioPlayer.setVolume(0);
    }
    this._updateVolumeUI();
  }

  _pulseButton(btn) {
    btn?.classList.add('is-pulsed');
    setTimeout(() => btn?.classList.remove('is-pulsed'), 200);
  }

  _bindControls() {
    this.el.playBtn?.addEventListener('click', (e) => { e.stopPropagation(); this.togglePlay(); });
    this.el.pauseBtn?.addEventListener('click', (e) => { e.stopPropagation(); this.togglePlay(); });
    this.el.forwardBtn?.addEventListener('click', () => { this._pulseButton(this.el.forwardBtn); this.skipForward(); });
    this.el.backwardBtn?.addEventListener('click', () => { this._pulseButton(this.el.backwardBtn); this.skipBack(); });
    this.el.repeatBtn?.addEventListener('click', () => this.cycleRepeat());
    this.el.shuffleBtn?.addEventListener('click', () => this.toggleShuffle());
    this.el.volUpBtn?.addEventListener('click', () => this.adjustVolume(0.1));
    this.el.volDownBtn?.addEventListener('click', () => this.adjustVolume(-0.1));
    this.el.muteBtn?.addEventListener('click', () => this.toggleMute());
  }

  _bindProgress() {
    const bar = this.el.progressBar;
    if (!bar) return;

    bar.addEventListener('input', (e) => {
      this.isScrubbing = true;
      const t = Number(e.target.value);
      if (!isNaN(t)) {
        this.audio.currentTime = t;
        this._updateTimeDisplay(t, this.audio.duration);
      }
    });
    bar.addEventListener('change', () => { this.isScrubbing = false; });

    bar.addEventListener('mousemove', (e) => {
      if (!this.el.scrubTooltip || !bar.max) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.el.scrubTooltip.textContent = this.audioPlayer.formatTime(ratio * bar.max);
      this.el.scrubTooltip.hidden = false;
      this.el.scrubTooltip.style.left = `${ratio * 100}%`;
    });
    bar.addEventListener('mouseleave', () => { if (this.el.scrubTooltip) this.el.scrubTooltip.hidden = true; });
  }

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); this.togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); this.skipForward(); break;
        case 'ArrowLeft': e.preventDefault(); this.skipBack(); break;
        case 'KeyS': this.toggleShuffle(); break;
        case 'KeyR': this.cycleRepeat(); break;
        case 'KeyM': this.toggleMute(); break;
      }
    });
  }

  destroy() { this.audioPlayer.destroy(); }
}

window.MidnightVinylPlayer = MidnightVinylPlayer;
