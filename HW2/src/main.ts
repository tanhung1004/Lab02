
import "./style.css";

// Sample data for UI demonstration
const tracks = [
  {
    id: "T001",
    title: "Ambient Waves",
    artist: "WaveFlow Studio",
    duration: "3:24",
  },
  {
    id: "T002",
    title: "Ocean Breeze",
    artist: "Blue Horizon",
    duration: "4:12",
  },
  {
    id: "T003",
    title: "Night Drive",
    artist: "Neon Dreams",
    duration: "2:58",
  },
  {
    id: "T004",
    title: "Morning Light",
    artist: "Sunrise Audio",
    duration: "3:45",
  },
];

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Application root not found");
}

// Render application layout
app.innerHTML = `
  <div class="app-shell">
    <header class="header">
      <a class="logo" href="#home">
        <span aria-hidden="true">♫</span> WaveFlow
      </a>
      <nav aria-label="Main navigation">
        <a href="#home">Home</a>
        <a href="#player">Player</a>
        <a href="#queue">Queue</a>
      </nav>
      <span class="header-label">AUDIO STUDIO</span>
    </header>

    <main id="home">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <span class="tag">FRONT-END HOMEWORK 2</span>
          <h1 id="hero-title">Your Music. Visualized.</h1>
          <p>
            A concurrent FIFO audio engine featuring
            real-time frequency visualization,
            asynchronous processing and memory safety.
          </p>
          <div class="hero-tags">
            <span>FIFO Processing</span>
            <span>Web Audio API</span>
            <span>60 FPS Target</span>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="vinyl">
            <div class="vinyl-center">♫</div>
          </div>
        </div>
      </section>

      <section class="player-card" id="player"
        aria-labelledby="player-title">
        <div class="section-heading">
          <div>
            <span class="eyebrow">NOW PLAYING</span>
            <h2 id="player-title">Audio Player</h2>
          </div>
          <span class="status-label">Ready</span>
        </div>

        <div class="track-info">
          <div class="album-icon" aria-hidden="true">♫</div>
          <div>
            <h3 id="current-title">No track selected</h3>
            <p id="current-artist">Choose a track below</p>
          </div>
        </div>

        <div class="visualizer-panel">
          <div class="visualizer-header">
            <span>Frequency Spectrum</span>
            <span>FFT · 256/512 Bins</span>
          </div>
          <canvas
            id="visualizer"
            width="960"
            height="220"
            role="img"
            aria-label="Audio frequency spectrum visualization"
          ></canvas>
        </div>

        <div class="progress-bar" aria-hidden="true">
          <div class="progress-fill"></div>
        </div>

        <div class="time-labels">
          <span id="current-time">0:00</span>
          <span id="total-time">0:00</span>
        </div>

        <div class="player-controls">
          <button type="button" id="previous-btn"
            aria-label="Previous track" disabled>
            ⏮
          </button>
          <button type="button" id="play-btn"
            class="primary-btn" disabled>
            ▶ Play
          </button>
          <button type="button" id="stop-btn"
            aria-label="Stop playback" disabled>
            ■
          </button>
          <button type="button" id="next-btn"
            aria-label="Next track" disabled>
            ⏭
          </button>
        </div>

        <p class="feature-note">
          Audio playback will be connected in Task 2.3.
        </p>
      </section>

      <div class="content-grid">
        <section class="panel" id="library"
          aria-labelledby="library-title">
          <div class="section-heading">
            <div>
              <span class="eyebrow">MUSIC COLLECTION</span>
              <h2 id="library-title">Track Library</h2>
            </div>
            <span class="count">${tracks.length} tracks</span>
          </div>

          <div class="track-list">
            ${tracks.map((track) => `
              <article class="track-item">
                <div class="track-icon" aria-hidden="true">♫</div>
                <div class="track-details">
                  <h3>${track.title}</h3>
                  <p>${track.artist}</p>
                </div>
                <span class="track-duration">${track.duration}</span>
                <button type="button"
                  class="queue-btn"
                  aria-label="Add ${track.title} to queue"
                  disabled>
                  + Queue
                </button>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="panel" id="queue"
          aria-labelledby="queue-title">
          <div class="section-heading">
            <div>
              <span class="eyebrow">FIRST IN, FIRST OUT</span>
              <h2 id="queue-title">Processing Queue</h2>
            </div>
            <span class="count">0 pending</span>
          </div>

          <ol id="queue-list" class="queue-list">
            <li class="empty-queue">
              No audio tasks in the queue.
            </li>
          </ol>

          <div class="queue-footer">
            <div>
              <strong>Queue Status</strong>
              <span id="queue-status">Idle</span>
            </div>
            <button type="button" id="cancel-btn"
              class="outline-btn" disabled>
              Cancel Task
            </button>
          </div>
        </section>
      </div>

      <footer class="footer">
        WaveFlow · Concurrent FIFO Audio Visualizer · HW2
      </footer>
    </main>
  </div>
`;
