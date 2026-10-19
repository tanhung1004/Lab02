import "./style.css";
import { AudioEngine } from "./audio-engine";

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

// ==================================================
// TASK 2.3 - WEB AUDIO API ENGINE INTEGRATION
// ==================================================

// Create the audio processing engine
const audioEngine = new AudioEngine();

// Find existing player elements
const playerSection =
  document.querySelector<HTMLElement>("#player");

const playButton =
  document.querySelector<HTMLButtonElement>("#play-btn");

const stopButton =
  document.querySelector<HTMLButtonElement>("#stop-btn");

const currentTitle =
  document.querySelector<HTMLElement>("#current-title");

const currentArtist =
  document.querySelector<HTMLElement>("#current-artist");

const totalTime =
  document.querySelector<HTMLElement>("#total-time");

const currentTime =
  document.querySelector<HTMLElement>("#current-time");

const statusLabel =
  document.querySelector<HTMLElement>(".status-label");

if (
  !playerSection ||
  !playButton ||
  !stopButton ||
  !currentTitle ||
  !currentArtist ||
  !totalTime ||
  !currentTime ||
  !statusLabel
) {
  throw new Error("Required player elements were not found");
}

// Add an audio file input to the existing player UI
const uploadSection = document.createElement("div");

uploadSection.className = "audio-upload";

uploadSection.innerHTML = `
  <label for="audio-file">
    Choose an audio file
  </label>

  <input
    type="file"
    id="audio-file"
    accept="audio/*"
  />

  <p id="audio-message" role="status" aria-live="polite">
    Select a local audio file to test the Web Audio Engine.
  </p>
`;

const visualizerPanel =
  playerSection.querySelector(".visualizer-panel");

playerSection.insertBefore(
  uploadSection,
  visualizerPanel
);

const fileInput =
  document.querySelector<HTMLInputElement>("#audio-file");

const audioMessage =
  document.querySelector<HTMLElement>("#audio-message");

if (!fileInput || !audioMessage) {
  throw new Error("Audio upload controls were not found");
}

// Convert seconds to mm:ss
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

// Track the latest file selection
let loadVersion = 0;
let isLoading = false;

// Handle selecting a local audio file
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];

  if (!file) return;

  const version = ++loadVersion;

  isLoading = true;
  playButton.disabled = true;
  stopButton.disabled = true;

  audioEngine.stop();

  statusLabel.textContent = "Loading";
  audioMessage.textContent = `Loading ${file.name}...`;

  currentTime.textContent = "0:00";

  try {
    const buffer = await file.arrayBuffer();

    if (version !== loadVersion) return;

    await audioEngine.load(buffer);

    if (version !== loadVersion) return;

    currentTitle.textContent = file.name;
    currentArtist.textContent = "Local Audio File";

    totalTime.textContent =
      formatTime(audioEngine.getDuration());

    audioMessage.textContent =
      "Audio decoded successfully. Ready to play.";

    statusLabel.textContent = "Ready";

    playButton.disabled = false;
  } catch (error) {
    if (version !== loadVersion) return;

    console.error("Audio loading failed:", error);

    audioMessage.textContent =
      "Could not decode this audio file.";

    statusLabel.textContent = "Error";
  } finally {
    if (version === loadVersion) {
      isLoading = false;
    }
  }
});

// Start playback
playButton.addEventListener("click", async () => {
  if (isLoading || !audioEngine.hasAudio()) return;

  playButton.disabled = true;

  try {
    await audioEngine.play();

    stopButton.disabled = false;
    playButton.textContent = "↻ Replay";

    statusLabel.textContent = "Playing";
    audioMessage.textContent = "Audio playback started.";
  } catch (error) {
    console.error("Playback failed:", error);

    audioMessage.textContent =
      "Unable to start audio playback.";

    statusLabel.textContent = "Error";
  } finally {
    playButton.disabled = false;
  }
});

// Stop playback
stopButton.addEventListener("click", () => {
  audioEngine.stop();

  stopButton.disabled = true;

  currentTime.textContent = "0:00";
  playButton.textContent = "▶ Play";

  statusLabel.textContent = "Stopped";
  audioMessage.textContent = "Playback stopped.";
});

// When the audio finishes naturally
audioEngine.onEnded = () => {
  stopButton.disabled = true;

  playButton.textContent = "▶ Play";
  statusLabel.textContent = "Finished";

  audioMessage.textContent =
    "Playback finished. You can play it again.";
};

// Clean up resources when leaving the page
window.addEventListener("pagehide", () => {
  void audioEngine.dispose();
});

