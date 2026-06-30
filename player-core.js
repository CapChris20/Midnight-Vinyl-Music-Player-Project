/**
 * MidnightVinylPlayer — fast playback, album art, premium UI hooks.
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

    this.audioPlayer = new AudioPlayer();
    this.audio = this.audioPlayer.audio;

    this._cacheElements();
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
      albumArt: document.getElementById('album-art'),
      albumDisc: document.getElementById('album-disc'),
      eqBars: document.getElementById('eq-bars'),
      playerMain: document.getElementById('player-main'),
    };
  }

  get activeList() {
    return this.isShuffle ? this.shuffledSongs : this.songs;
  }

  /** iTunes 100px art → 300px for crisp display */
  _artUrl(song) {
    const url = song.artworkUrl100 || song.artworkUrl60 || '';
    return url.replace('100x100bb', '300x300bb').replace('60x60bb', '300x300bb');
  }

  _setAlbumArt(song) {
    if (!this.el.albumArt) return;
    const url = this._artUrl(song);
    if (url) {
      this.el.albumArt.src = url;
      this.el.albumArt.alt = `${song.trackName} album art`;
    }
  }

  _setPlayingVisual(on) {
    this.el.albumDisc?.classList.toggle('is-spinning', on);
    this.el.eqBars?.classList.toggle('is-active', on);
    this.el.playerMain?.classList.toggle('is-playing', on);
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
    this._setPlayingVisual(playing);
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

  loadSong(index) {
    const list = this.activeList;
    if (!list.length) return;

    const song = list[index];
    if (!song?.previewUrl) return;

    this.currentIndex = index;
    this.audio.pause();
    this.audio.loop = this.repeatMode === 'one';

    if (this.el.title) this.el.title.textContent = song.trackName || 'Unknown';
    if (this.el.artist) this.el.artist.textContent = song.artistName || this.config.artistName;
    this._setAlbumArt(song);
    this._updateNowPlayingMeta();

    this.audio.src = song.previewUrl;
    this.audio.load();

    this.audio.onloadedmetadata = () => {
      const duration = Math.floor(this.audio.duration) || 30;
      if (this.el.progressBar) {
        this.el.progressBar.max = duration;
        this.el.progressBar.value = 0;
      }
      this._updateTimeDisplay(0, duration);
    };

    this.audio.onerror = () => {
      if (this.el.title) this.el.title.textContent = 'Preview unavailable — try next track';
      this._updatePlayPauseUI(false);
    };

    this._updatePlayPauseUI(false);
    if (this.el.meta) this.el.meta.textContent = 'Press ▶ to play';
  }

  async init() {
    try {
      const res = await fetch(this.config.songsUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.results || [];
      this.songs = this.config.filterSongs(raw);

      if (this.songs.length) {
        this._buildShuffledList();
        this.loadSong(0);
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
    document.addEventListener('click', () => this.audioPlayer.resumeContext(), { once: true });
    window.addEventListener('pagehide', () => this.destroy());
  }

  _onEnded() {
    if (this.repeatMode === 'one') return;
    const list = this.activeList;
    if (this.repeatMode === 'all' && this.currentIndex >= list.length - 1) this.loadSong(0);
    else this.skipForward();
  }

  togglePlay() {
    if (this.audio.paused) {
      const start = () => {
        this.audioPlayer.play()
          .then(() => this._updatePlayPauseUI(true))
          .catch(() => {
            this._updatePlayPauseUI(false);
            if (this.el.meta) this.el.meta.textContent = 'Could not play — try next track';
          });
      };
      if (this.audio.readyState >= 2) start();
      else this.audio.addEventListener('canplay', start, { once: true });
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
    this.el.playBtn?.addEventListener('click', () => this.togglePlay());
    this.el.pauseBtn?.addEventListener('click', () => this.togglePlay());
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
