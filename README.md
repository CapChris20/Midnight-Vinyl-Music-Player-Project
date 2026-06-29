# 🎵 Midnight Vinyl Music Player

A stunning, cyberpunk-themed music player featuring three legendary artists: **The Weeknd**, **Frank Ocean**, and **Michael Jackson**. Built with vanilla JavaScript, HTML5, and CSS3, this project delivers an immersive audio experience with real-time visualizations and a retro-futuristic aesthetic.

![Midnight Vinyl](https://img.shields.io/badge/Music-Player-ff69b4?style=for-the-badge&logo=music&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

## ✨ Features

### 🎨 Visual Design
- **Cyberpunk Aesthetic**: Neon gradients, glowing effects, and futuristic typography
- **Dynamic Backgrounds**: Full-screen video backgrounds for each artist
- **Real-time Visualizations**: Canvas-based audio frequency bars with gradient effects
- **Responsive Design**: Optimized for desktop and mobile devices
- **Custom Fonts**: Orbitron font family for that retro-futuristic feel

### 🎵 Audio Features
- **Multi-Artist Support**: Dedicated pages for The Weeknd, Frank Ocean, and Michael Jackson
- **Audio Visualization**: Real-time frequency analysis with colorful bar graphs
- **Playback Controls**: Play, pause, forward, backward, repeat, and shuffle
- **Progress Tracking**: Visual progress bar with time display
- **Volume Control**: Adjustable volume levels
- **Auto-play**: Seamless song transitions

### 🎯 Technical Features
- **Web Audio API**: Advanced audio processing and visualization
- **iTunes API Integration**: Real song data with preview URLs
- **Canvas Rendering**: Dynamic visual effects and animations
- **Local Storage**: Session management and user preferences
- **Firebase Hosting**: Ready for deployment

## 🚀 Live Demo

[View Live Project](https://midnight-vinyl-playe.web.app/)

## 📁 Project Structure

```
Midnight Vinyl Music Player/
├── public/
│   ├── index.html              # Main landing page
│   ├── weeknd.html             # The Weeknd player page
│   ├── frankocean.html         # Frank Ocean player page
│   ├── mj.html                 # Michael Jackson player page
│   ├── audio-player.js         # Core audio player class
│   ├── weeknd.js               # The Weeknd player logic
│   ├── frankocean.js           # Frank Ocean player logic
│   ├── mj.js                   # Michael Jackson player logic
│   ├── style.css               # Main stylesheet
│   ├── weeknd.css              # The Weeknd specific styles
│   ├── frankocean.css          # Frank Ocean specific styles
│   ├── mj.css                  # Michael Jackson specific styles
│   ├── weeknd_merged.json      # The Weeknd song data
│   ├── frank_ocean.json        # Frank Ocean song data
│   ├── michael_jackson.json    # Michael Jackson song data
│   └── assets/                 # Images and media files
├── firebase.json               # Firebase hosting configuration
└── README.md                   # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required!

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/CapChris20/Midnight-Vinyl-Music-Player-Project.git
   cd Midnight-Vinyl-Music-Player-Project
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html in your browser
   open public/index.html
   ```

3. **For development server (optional)**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve public
   
   # Using PHP
   php -S localhost:8000 -t public
   ```

### Firebase Deployment

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## 🎮 Usage

### Navigation
1. **Home Page**: Choose your favorite artist from the three available options
2. **Artist Pages**: Each artist has their own dedicated music player interface
3. **Back Button**: Navigate back to the home page from any artist page

### Music Controls
- **▶️ Play/Pause**: Start or stop the current song
- **⏭️ Forward/Backward**: Skip to next or previous song
- **🔄 Repeat**: Loop the current song
- **🔀 Shuffle**: Play songs in random order
- **🔊 Volume**: Adjust audio levels
- **Progress Bar**: Click to jump to any point in the song

### Visual Features
- **Dynamic Backgrounds**: Each artist page features unique background videos
- **Audio Visualizer**: Real-time frequency bars that react to the music
- **Neon Effects**: Glowing buttons and text with cyberpunk styling

## 🎨 Customization

### Adding New Artists

1. **Create artist page**
   ```html
   <!-- Create new-artist.html -->
   <!DOCTYPE html>
   <html>
   <!-- Copy structure from existing artist page -->
   </html>
   ```

2. **Add artist data**
   ```javascript
   // Create new-artist.json with iTunes API data
   ```

3. **Update navigation**
   ```html
   <!-- Add new artist card to index.html -->
   <div class="card">
     <img src="artist-photo.jpg" alt="Artist Name" />
     <a href="new-artist.html">
       <button class="play">Play Artist Name</button>
     </a>
   </div>
   ```

### Styling Customization

The project uses CSS custom properties and can be easily customized:

```css
/* Change color scheme */
:root {
  --primary-color: #ff6bcf;
  --secondary-color: #2de2e6;
  --accent-color: #ffffff;
}
```

## 🔧 Technical Details

### Audio Processing
- **Web Audio API**: Real-time audio analysis and visualization
- **Canvas API**: Dynamic visual effects and animations
- **HTML5 Audio**: Cross-browser audio playback

### Data Sources
- **iTunes Search API**: Song metadata and preview URLs
- **JSON Storage**: Local song data files for offline functionality

### Browser Compatibility
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## 🎯 Key Features Breakdown

### AudioPlayer Class
The core `AudioPlayer` class handles:
- Audio context management
- Frequency analysis
- Time formatting
- Playback controls

### Visualization Engine
Real-time canvas-based visualizations featuring:
- Frequency bar graphs
- Gradient color schemes
- Smooth animations
- Responsive scaling

### Responsive Design
- Mobile-first approach
- Flexible layouts
- Touch-friendly controls
- Optimized performance

## 🚀 Performance Optimizations

- **Lazy Loading**: Images and assets loaded on demand
- **Canvas Optimization**: Efficient rendering with requestAnimationFrame
- **Audio Buffering**: Smart preloading for smooth playback
- **Responsive Images**: Optimized for different screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **iTunes API** for providing song data and previews
- **Google Fonts** for the Orbitron font family
- **Font Awesome** for the icon library
- **Firebase** for hosting capabilities


**Made with ❤️ and lots of ☕ by Captain Chris**

*Experience the future of music with Midnight Vinyl* 🌙🎵

