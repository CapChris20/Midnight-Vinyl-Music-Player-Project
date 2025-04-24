// audio-player.js - Audio visualization and playback handling

class AudioPlayer {
  constructor() {
    // Create audio element
    this.audio = new Audio();
    
    // Set up Web Audio API context
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 64;
    
    // Connect audio to analyser
    this.source = this.context.createMediaElementSource(this.audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    
    // Set initial volume
    this.audio.volume = 0.7;
  }
  
  // Get audio frequency data for visualization
  getAudioData() {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
  
  // Format time in seconds to MM:SS
  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }
  
  // Load a song by URL
  async loadSong(url) {
    return new Promise((resolve, reject) => {
      this.audio.src = url;
      this.audio.load();
      
      // When metadata is loaded, we can access duration
      this.audio.onloadedmetadata = () => resolve();
      this.audio.onerror = (err) => reject(err);
    });
  }
  
  // Play the current audio
  async play() {
    try {
      // Ensure context is running (required by some browsers)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      return this.audio.play();
    } catch (err) {
      console.error('Playback failed:', err);
      throw err;
    }
  }
  
  // Pause the current audio
  pause() {
    this.audio.pause();
  }
  
  // Set volume (0-1)
  setVolume(level) {
    this.audio.volume = Math.max(0, Math.min(1, level));
  }
}