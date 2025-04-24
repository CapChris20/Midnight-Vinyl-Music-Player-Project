// frankocean.js - Simplified version with audio fixes

// DOM elements
const titleEl = document.getElementById('song-title');
const playBtn = document.querySelector('.play');
const pauseBtn = document.querySelector('.pause');
const forwardBtn = document.querySelector('.forward');
const backwardBtn = document.querySelector('.backward');
const volUpBtn = document.querySelector('.vol-up');
const volDownBtn = document.querySelector('.vol-down');
const repeatBtn = document.querySelector('.repeat');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBar = document.getElementById('progress-bar');
const canvas = document.getElementById('song-canvas');
const ctx = canvas.getContext('2d');
const bgVideo = document.getElementById('bg-video');

// Variables
let currentIndex = 0;
let songsData = [];
let isShuffle = false;
let lastImageIndex = -1;
let imageChangeInterval = null;

// Audio setup - create a simple audio player if necessary
const audioPlayer = window.audioPlayer || {
  audio: new Audio(),
  context: new (window.AudioContext || window.webkitAudioContext)(),
  getAudioData: function() { return new Uint8Array(64).fill(0); },
  formatTime: function(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  },
  loadSong: async function(url) {
    this.audio.src = url;
    return new Promise((resolve) => {
      this.audio.oncanplaythrough = resolve;
      this.audio.onerror = resolve; // Continue even on error
      this.audio.load();
    });
  },
  play: function() { return this.audio.play(); },
  pause: function() { this.audio.pause(); },
  setVolume: function(val) { this.audio.volume = val; }
};

const audio = audioPlayer.audio;

// Background image setup
const bgImage = new Image();
let bgReady = false;
bgImage.onload = () => { bgReady = true; };

// Image files array
const imageFiles = [
  "https://i.postimg.cc/4Kt066P7/IMG-7036.jpg",
    "https://i.postimg.cc/RJCbxjBK/IMG-7037.jpg",
    "https://i.postimg.cc/YjtPFmW0/IMG-7038.jpg",
    "https://i.postimg.cc/34Fb63P3/IMG-7039.jpg",
    "https://i.postimg.cc/Dm5MPyrg/IMG-7040.jpg",
    "https://i.postimg.cc/rKmYnXgL/IMG-7041.jpg",
    "https://i.postimg.cc/gnTt1SBL/IMG-7042.jpg",
    "https://i.postimg.cc/FYkCvy2W/IMG-7043.jpg",
    "https://i.postimg.cc/t10S41bX/IMG-7044.jpg",
    "https://i.postimg.cc/ZB4w6102/IMG-7045.jpg",
    "https://i.postimg.cc/BtZhb9r1/IMG-7046.jpg",
    "https://i.postimg.cc/5YgngnC0/IMG-7047.jpg",
    "https://i.postimg.cc/gL04T8VK/IMG-7048.jpg",
    "https://i.postimg.cc/grMg6tpt/IMG-7049.jpg",
    "https://i.postimg.cc/YhhbNNqr/IMG-7050.jpg",
    "https://i.postimg.cc/Vdp4KSdj/IMG-7052.jpg",
    "https://i.postimg.cc/v4nhkQVC/IMG-7053.jpg",
    "https://i.postimg.cc/tZqzsWMH/IMG-7054.jpg",
    "https://i.postimg.cc/zL1719wv/IMG-7055.jpg",
    "https://i.postimg.cc/Tyq92CQ9/IMG-7057.jpg",
    "https://i.postimg.cc/phsJzrw5/IMG-7058.jpg",
    "https://i.postimg.cc/8jJmf1ts/IMG-7059.jpg",
    "https://i.postimg.cc/Fk1gZmvW/IMG-7060.png",
    "https://i.postimg.cc/QVMbsg7Q/IMG-7061.jpg",
    "https://i.postimg.cc/ZW6PjwkS/IMG-7062.jpg",
    "https://i.postimg.cc/svk9ptNm/IMG-7063.jpg"
];

// Canvas sizing
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
window.addEventListener('resize', () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
});

// Draw visualizer
function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (bgReady) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  try {
    const data = audioPlayer.getAudioData();
    const barW = (canvas.width / data.length) * 2.5;
    let x = 0;
    
    data.forEach(value => {
      const height = value / 2;
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - height);
      gradient.addColorStop(0, `rgba(255, 107, 207, 0.8)`);
      gradient.addColorStop(1, `rgba(45, 226, 230, 0.8)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - height, barW, height);
      x += barW + 1;
    });
  } catch (err) {}
}

// Change background image
function changeBackgroundImage() {
  let idx = Math.floor(Math.random() * imageFiles.length);
  lastImageIndex = idx;
  bgReady = false;
  bgImage.src = imageFiles[idx];
}

// Load and play a song
async function loadSong(i) {
  if (!songsData.length) return;
  
  // Stop current audio
  audio.pause();
  
  currentIndex = i;
  const list = isShuffle ? shuffledSongs : songsData;
  const song = list[i];
  titleEl.textContent = `${song.trackName} — ${song.artistName}`;
  
  // Start image rotation
  changeBackgroundImage();
  
  // Reset UI
  progressBar.value = 0;
  currentTimeEl.textContent = '0:00';
  
  try {
    // AUDIO FIX: Direct approach to loading audio
    audio.src = song.previewUrl;
    audio.crossOrigin = "anonymous"; // Try to fix CORS issues
    
    // Set up audio events
    audio.onloadedmetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        durationEl.textContent = audioPlayer.formatTime(audio.duration);
        progressBar.max = Math.floor(audio.duration);
      }
    };
    
    // Use direct play with timeout to ensure browser is ready
    setTimeout(() => {
      audio.play()
        .then(() => {
          playBtn.style.display = 'none';
          pauseBtn.style.display = 'inline-block';
        })
        .catch(err => {
          console.error("Play error. Trying alternative method:", err);
          
          // Alternative method: create new Audio element
          const newAudio = new Audio(song.previewUrl);
          newAudio.play()
            .then(() => {
              // Replace the audio element if successful
              audioPlayer.audio = newAudio;
              audio = newAudio;
              playBtn.style.display = 'none';
              pauseBtn.style.display = 'inline-block';
            })
            .catch(e => console.error("Alternative play failed:", e));
        });
    }, 300);
  } catch (err) {
    console.error('Song load error:', err);
  }
}

// Initialize player
async function initPlayer() {
  try {
    const response = await fetch('frank_ocean.json');
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    const data = await response.json();
    
    // Filter for Frank Ocean originals with preview URLs
    songsData = (Array.isArray(data) ? data : (data.results || [])).filter(song => 
      song.previewUrl && 
      song.artistName?.toLowerCase() === 'frank ocean' && 
      !/remix|cover/i.test(song.trackName || '')
    );
    
    if (songsData.length) {
      loadSong(0);
    } else {
      titleEl.textContent = 'No Frank Ocean songs found';
    }
    
    // Initialize background video
    bgVideo.muted = true;
    bgVideo.play().catch(() => {
      bgVideo.style.display = 'none';
      document.body.style.backgroundColor = '#121212';
    });
  } catch (err) {
    console.error('Error loading songs:', err);
    titleEl.textContent = 'Error loading songs';
  }
}

// Event Listeners
playBtn.addEventListener('click', () => {
  try {
    audio.play();
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
  } catch (err) {
    console.error('Play error:', err);
  }
});

pauseBtn.addEventListener('click', () => {
  audio.pause();
  pauseBtn.style.display = 'none';
  playBtn.style.display = 'inline-block';
});



forwardBtn.addEventListener('click', () => {
  if (!songsData.length) return;
  currentIndex = (currentIndex + 1) % songsData.length;
  loadSong(currentIndex);
});



// Progress bar
progressBar.addEventListener('input', e => {
  const time = Number(e.target.value);
  if (!isNaN(time) && isFinite(time)) {
    audio.currentTime = time;
    currentTimeEl.textContent = audioPlayer.formatTime(time);
  }
});

audio.addEventListener('timeupdate', () => {
  if (!isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
    const currentTime = Math.floor(audio.currentTime);
    progressBar.value = currentTime;
    currentTimeEl.textContent = audioPlayer.formatTime(currentTime);
  }
});

audio.addEventListener('ended', () => {
  if (!audio.loop) forwardBtn.click();
});

// Unlock audio context on user interaction
document.addEventListener('click', () => {
  if (audioPlayer.context && audioPlayer.context.state === 'suspended') {
    audioPlayer.context.resume();
  }
}, {once: true});

// Start visualizer
drawVisualizer();

// Initialize player
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlayer);
} else {
  initPlayer();
}