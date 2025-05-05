document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('song-title');
  const playBtn = document.querySelector('.play');
  const pauseBtn = document.querySelector('.pause');
  const forwardBtn = document.querySelector('.forward');
  const backwardBtn = document.querySelector('.backward');
  const volUpBtn = document.querySelector('.vol-up');
  const volDownBtn = document.querySelector('.vol-down');
  const repeatBtn = document.querySelector('.repeat');
  const shuffleBtn = document.querySelector('.shuffle');
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const progressBar = document.getElementById('progress-bar');
  const canvas = document.getElementById('song-canvas');
  const ctx = canvas.getContext('2d');
  const bgVideo = document.getElementById('bg-video');

  let currentIndex = 0;
  let songsData = [];
  let isShuffle = false;

  const audioPlayer = {
    audio: new Audio(),
    context: new (window.AudioContext || window.webkitAudioContext)(),
    getAudioData: () => new Uint8Array(64).fill(0),
    formatTime: seconds => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    }
  };
  let audio = audioPlayer.audio;

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  window.addEventListener('resize', () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  });

  const bgImage = new Image();
  let bgReady = false;
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
  bgImage.onload = () => { bgReady = true; };

  function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgReady) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
  }

  function changeBackgroundImage() {
    const idx = Math.floor(Math.random() * imageFiles.length);
    bgReady = false;
    bgImage.src = imageFiles[idx];
  }

  async function loadSong(i) {
    if (!songsData.length) {
      titleEl.textContent = "No songs available";
      return;
    }

    const song = songsData[i];
    if (!song || !song.previewUrl) {
      titleEl.textContent = "Invalid song data";
      return;
    }

    currentIndex = i;
    audio.pause();
    audio.src = song.previewUrl;
    audio.crossOrigin = "anonymous";
    titleEl.textContent = `${song.trackName} — ${song.artistName}`;
    changeBackgroundImage();
    progressBar.value = 0;
    currentTimeEl.textContent = '0:00';

    audio.onloadedmetadata = () => {
      durationEl.textContent = audioPlayer.formatTime(audio.duration);
      progressBar.max = Math.floor(audio.duration);
    };

    try {
      await audio.play();
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    } catch (err) {
      titleEl.textContent = "Tap play to start";
    }
  }

  async function initPlayer() {
    try {
      const response = await fetch('frank_ocean.json');
      const data = await response.json();
      const rawSongs = Array.isArray(data) ? data : data.results || [];

      const bannedWords = ["remix", "rework", "edit", "bootleg", "cover", "version"];

      songsData = rawSongs.filter(song => {
        const track = song.trackName?.toLowerCase() || "";
        const artist = song.artistName?.toLowerCase() || "";
        const isFrank = artist.includes("frank ocean");
        const hasPreview = !!song.previewUrl;
        const isNotBanned = !bannedWords.some(word => track.includes(word));
        return hasPreview && isNotBanned && (isFrank || track.includes("frank ocean"));
      });

      if (songsData.length > 0) {
        loadSong(0);
        bgVideo.muted = true;
        bgVideo.play().catch(() => {
          bgVideo.style.display = 'none';
        });
      } else {
        titleEl.textContent = "No valid songs found";
      }
    } catch (err) {
      console.error("❌ Failed to load:", err);
      titleEl.textContent = "Error loading songs";
    }
  }

  playBtn.addEventListener('click', () => {
    audio.play().then(() => {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    });
  });

  pauseBtn.addEventListener('click', () => {
    audio.pause();
    pauseBtn.style.display = 'none';
    playBtn.style.display = 'inline-block';
  });

  forwardBtn.addEventListener('click', () => {
    if (songsData.length) {
      const nextIndex = isShuffle ? Math.floor(Math.random() * songsData.length) : (currentIndex + 1) % songsData.length;
      loadSong(nextIndex);
    }
  });

  backwardBtn.addEventListener('click', () => {
    if (songsData.length) {
      const prevIndex = isShuffle ? Math.floor(Math.random() * songsData.length) : (currentIndex - 1 + songsData.length) % songsData.length;
      loadSong(prevIndex);
    }
  });

  volUpBtn.addEventListener('click', () => audio.volume = Math.min(audio.volume + 0.1, 1));
  volDownBtn.addEventListener('click', () => audio.volume = Math.max(audio.volume - 0.1, 0));
  repeatBtn.addEventListener('click', () => {
    audio.loop = !audio.loop;
    repeatBtn.classList.toggle('active', audio.loop);
  });

  shuffleBtn.addEventListener('click', () => {
    if (!songsData.length) return;
    const newIndex = Math.floor(Math.random() * songsData.length);
    currentIndex = newIndex;
    loadSong(currentIndex);
  });

  progressBar.addEventListener('input', e => {
    const time = Number(e.target.value);
    if (!isNaN(time)) {
      audio.currentTime = time;
      currentTimeEl.textContent = audioPlayer.formatTime(time);
    }
  });

  audio.addEventListener('timeupdate', () => {
    const time = Math.floor(audio.currentTime);
    progressBar.value = time;
    currentTimeEl.textContent = audioPlayer.formatTime(time);
  });

  audio.addEventListener('ended', () => {
    if (!audio.loop) forwardBtn.click();
  });

  document.addEventListener('click', () => {
    if (audioPlayer.context.state === 'suspended') {
      audioPlayer.context.resume();
    }
  }, { once: true });

  drawVisualizer();
  initPlayer();

  bgVideo.addEventListener('ended', () => {
    bgVideo.currentTime = 0;
    bgVideo.play();
  });
});