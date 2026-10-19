
import "./style.css";
import { AudioEngine } from "./audio-engine";
import { AudioTaskQueue } from "./audio-queue-controller";

// ==================================================
// 1. AUDIO TRACK DATA
// ==================================================

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  url: string;
}

const tracks: Track[] = [
  {
    id: "T001",
    title: "Ambient Waves",
    artist: "WaveFlow Studio",
    duration: "Sample audio",
    url: "/audio/ambient-waves.mp3",
  },
  {
    id: "T002",
    title: "Ocean Breeze",
    artist: "Blue Horizon",
    duration: "Sample audio",
    url: "/audio/ocean-breeze.mp3",
  },
  {
    id: "T003",
    title: "Night Drive",
    artist: "Neon Dreams",
    duration: "Sample audio",
    url: "/audio/night-drive.mp3",
  },
  {
    id: "T004",
    title: "Morning Light",
    artist: "Sunrise Audio",
    duration: "Sample audio",
    url: "/audio/morning-light.mp3",
  },
];

// ==================================================
// 2. INITIALIZE AUDIO ENGINE AND FIFO QUEUE
// ==================================================

const audioEngine = new AudioEngine();

const audioQueue = new AudioTaskQueue(
  audioEngine.getContext()
);

const decodedTracks = new Map<string, AudioBuffer>();

type QueueStatus =
  | "Waiting"
  | "Processing"
  | "Completed"
  | "Failed";

interface QueueEntry {
  id: string;
  trackId: string;
  title: string;
  status: QueueStatus;
}

const queueEntries: QueueEntry[] = [];

// ==================================================
// 3. RENDER WAVEFLOW INTERFACE
// ==================================================

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root #app not found");
}

app.innerHTML = `
  <div class="app-shell">

    <!-- HEADER -->
    <header class="header">
      <a class="logo" href="#">♫ WaveFlow</a>

      <nav aria-label="Main navigation">
        <a href="#home">Home</a>
        <a href="#player">Player</a>
        <a href="#queue">Queue</a>
      </nav>

      <span class="header-label">AUDIO STUDIO</span>
    </header>

    <!-- HERO -->
    <section class="hero" id="home">
      <div class="hero-copy">

        <span class="tag">
          TYPESCRIPT + WEB AUDIO API
        </span>

        <h1>
          Your Music.<br>
          Your Flow.
        </h1>

        <p>
          Explore asynchronous audio processing,
          FIFO scheduling, and real-time sound analysis
          in one modern audio studio.
        </p>

        <div class="hero-tags">
          <span>Web Audio API</span>
          <span>FIFO Queue</span>
          <span>TypeScript</span>
        </div>
      </div>

      <div class="hero-art" aria-hidden="true">
        <div class="vinyl">
          <div class="vinyl-center">♫</div>
        </div>
      </div>
    </section>

    <!-- AUDIO PLAYER -->
    <section class="player-card" id="player">

      <div class="section-heading">
        <div>
          <span class="eyebrow">AUDIO PLAYER</span>
          <h2>Now Playing</h2>
        </div>

        <span class="status-label" id="player-status">
          Idle
        </span>
      </div>

      <div class="track-info">
        <div class="album-icon">♫</div>

        <div>
          <h3 id="current-title">
            No track selected
          </h3>

          <p id="current-artist">
            Choose a track from the library
          </p>
        </div>
      </div>

      <div class="visualizer-panel">
        <div class="visualizer-header">
          <span>Frequency Spectrum</span>
          <span>FFT: 512</span>
        </div>

        <canvas
          id="visualizer"
          width="900"
          height="220"
          aria-label="Audio frequency visualization"
        ></canvas>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
      </div>

      <div class="time-labels">
        <span id="current-time">0:00</span>
        <span id="total-time">0:00</span>
      </div>

      <div class="player-controls">
        <button type="button" disabled>
          ⏮ Previous
        </button>

        <button
          type="button"
          id="play-btn"
          class="primary-btn"
          disabled
        >
          ▶ Play
        </button>

        <button
          type="button"
          id="stop-btn"
          disabled
        >
          ■ Stop
        </button>

        <button type="button" disabled>
          Next ⏭
        </button>
      </div>

      <p class="feature-note" id="player-message" role="status">
        Add a track to the queue to download and decode it.
      </p>
    </section>

    <!-- LIBRARY AND QUEUE -->
    <div class="content-grid">

      <!-- TRACK LIBRARY -->
      <section class="panel" id="library">
        <div class="section-heading">
          <div>
            <span class="eyebrow">MUSIC COLLECTION</span>
            <h2>Track Library</h2>
          </div>

          <span class="count">
            ${tracks.length} Tracks
          </span>
        </div>

        <div class="track-list">

          ${tracks
            .map(
              (track) => `
                <div class="track-item">
                  <div class="track-icon">♫</div>

                  <div class="track-details">
                    <h3>${track.title}</h3>
                    <p>
                      ${track.artist}
                      · ${track.duration}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="queue-btn"
                    data-track-id="${track.id}"
                  >
                    + Queue
                  </button>
                </div>
              `
            )
            .join("")}

        </div>
      </section>

      <!-- FIFO QUEUE -->
      <section class="panel" id="queue">
        <div class="section-heading">
          <div>
            <span class="eyebrow">FIFO ENGINE</span>
            <h2>Processing Queue</h2>
          </div>

          <span class="count" id="queue-count">
            0 pending
          </span>
        </div>

        <ol class="queue-list" id="queue-list">
          <li class="empty-queue">
            No audio tasks in the queue.
          </li>
        </ol>

        <div class="queue-footer">
          <div>
            <strong>Engine Status</strong>
            <span id="queue-status">Idle</span>
          </div>

          <button
            type="button"
            id="clear-btn"
            class="outline-btn"
          >
            Clear History
          </button>
        </div>
      </section>

    </div>

    <footer class="footer">
      WaveFlow Music Studio · TypeScript · Web Audio API
    </footer>
  </div>
`;

// ==================================================
// 4. DOM REFERENCES
// ==================================================

function requiredElement<T extends Element>(
  selector: string
): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

const queueList =
  requiredElement<HTMLOListElement>("#queue-list");

const queueCount =
  requiredElement<HTMLElement>("#queue-count");

const queueStatus =
  requiredElement<HTMLElement>("#queue-status");

const playerStatus =
  requiredElement<HTMLElement>("#player-status");

const playerMessage =
  requiredElement<HTMLElement>("#player-message");

const currentTitle =
  requiredElement<HTMLElement>("#current-title");

const currentArtist =
  requiredElement<HTMLElement>("#current-artist");

const currentTime =
  requiredElement<HTMLElement>("#current-time");

const totalTime =
  requiredElement<HTMLElement>("#total-time");

const playButton =
  requiredElement<HTMLButtonElement>("#play-btn");

const stopButton =
  requiredElement<HTMLButtonElement>("#stop-btn");

const clearButton =
  requiredElement<HTMLButtonElement>("#clear-btn");

// ==================================================
// 5. UTILITY FUNCTIONS
// ==================================================

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

// Safely display the FIFO queue
function renderQueue(): void {
  queueList.replaceChildren();

  for (const entry of queueEntries) {
    const item = document.createElement("li");
    item.className = "queue-entry";

    const title = document.createElement("strong");
    title.textContent = entry.title;

    const status = document.createElement("span");
    status.className =
      `queue-task-status ${entry.status.toLowerCase()}`;

    status.textContent = entry.status;

    item.append(title, status);
    queueList.appendChild(item);
  }

  if (queueEntries.length === 0) {
    const emptyItem = document.createElement("li");

    emptyItem.className = "empty-queue";
    emptyItem.textContent = "No audio tasks in the queue.";

    queueList.appendChild(emptyItem);
  }

  const pending = queueEntries.filter(
    (entry) =>
      entry.status === "Waiting" ||
      entry.status === "Processing"
  ).length;

  const processing = queueEntries.some(
    (entry) => entry.status === "Processing"
  );

  queueCount.textContent = `${pending} pending`;

  queueStatus.textContent =
    processing ? "Processing" : "Idle";
}

// ==================================================
// 6. PLAYBACK CONTROLS
// ==================================================

let isStartingPlayback = false;

async function playTrack(): Promise<void> {
  if (!audioEngine.hasAudio() || isStartingPlayback) {
    return;
  }

  isStartingPlayback = true;
  playButton.disabled = true;

  try {
    await audioEngine.play();

    stopButton.disabled = false;

    playerStatus.textContent = "Playing";
    playerMessage.textContent = "Audio is playing.";

    playButton.textContent = "↻ Replay";
  } catch (error) {
    console.error("Playback error:", error);

    playerStatus.textContent = "Error";
    playerMessage.textContent =
      "Unable to start playback.";
  } finally {
    isStartingPlayback = false;
    playButton.disabled = false;
  }
}

playButton.addEventListener("click", () => {
  void playTrack();
});

stopButton.addEventListener("click", () => {
  audioEngine.stop();

  stopButton.disabled = true;
  playButton.textContent = "▶ Play";

  currentTime.textContent = "0:00";

  playerStatus.textContent = "Stopped";
  playerMessage.textContent = "Playback stopped.";
});

audioEngine.onEnded = () => {
  stopButton.disabled = true;

  playButton.textContent = "▶ Play";

  playerStatus.textContent = "Finished";
  playerMessage.textContent =
    "Playback finished. Press Play to restart.";
};

// ==================================================
// 7. PREPARE DECODED AUDIO FOR PLAYBACK
// ==================================================

function prepareTrack(
  track: Track,
  buffer: AudioBuffer
): void {
  audioEngine.setBuffer(buffer);

  currentTitle.textContent = track.title;
  currentArtist.textContent = track.artist;

  currentTime.textContent = "0:00";
  totalTime.textContent = formatTime(buffer.duration);

  playButton.textContent = "▶ Play";
  playButton.disabled = false;
  stopButton.disabled = true;

  playerStatus.textContent = "Ready";
  playerMessage.textContent =
    `${track.title} is ready to play.`;
}

// ==================================================
// 8. FIFO QUEUE EVENT HANDLING
// ==================================================

let entryCounter = 0;

function addTrackToQueue(track: Track): void {
  const entry: QueueEntry = {
    id: `queue-${++entryCounter}`,
    trackId: track.id,
    title: track.title,
    status: "Waiting",
  };

  queueEntries.push(entry);
  renderQueue();

  // Already decoded? Prepare it without downloading again
  const cachedBuffer = decodedTracks.get(track.id);

  if (cachedBuffer) {
    entry.status = "Completed";
    prepareTrack(track, cachedBuffer);
    renderQueue();
    return;
  }

  // Enqueue returns a Promise<AudioBuffer>
  void audioQueue
    .enqueue(track.url, () => {
      // Only this task becomes Processing
      entry.status = "Processing";
      renderQueue();
    })
    .then((buffer) => {
      decodedTracks.set(track.id, buffer);

      entry.status = "Completed";
      renderQueue();

      // The most recently completed track becomes ready
      prepareTrack(track, buffer);
    })
    .catch((error: unknown) => {
      console.error(`Queue failed: ${track.title}`, error);

      entry.status = "Failed";
      renderQueue();

      playerMessage.textContent =
        `Failed to load ${track.title}. Check its MP3 file.`;
    });
}

// Event delegation for all Queue buttons
const library =
  requiredElement<HTMLElement>("#library");

library.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const button = target.closest<HTMLButtonElement>(
    ".queue-btn"
  );

  if (!button) return;

  const trackId = button.dataset.trackId;

  const track = tracks.find(
    (item) => item.id === trackId
  );

  if (!track) return;

  addTrackToQueue(track);
});

// ==================================================
// 9. CLEAR COMPLETED/FAILED HISTORY
// ==================================================

clearButton.addEventListener("click", () => {
  for (let i = queueEntries.length - 1; i >= 0; i--) {
    const status = queueEntries[i].status;

    if (status === "Completed" || status === "Failed") {
      queueEntries.splice(i, 1);
    }
  }

  renderQueue();
});

// ==================================================
// 10. CLEAN UP
// ==================================================

window.addEventListener("pagehide", () => {
  audioQueue.dispose();
  void audioEngine.dispose();
});

renderQueue();
