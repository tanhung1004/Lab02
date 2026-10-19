
import "./style.css";
import { AudioEngine } from "./audio-engine";
import { AudioTaskQueue } from "./audio-queue-controller";
import { AudioVisualizer } from "./audio-visualizer";

// ==================================================
// 1. TRACK DATA
// ==================================================

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
}

const tracks: Track[] = [
  {
    id: "T001",
    title: "Ambient Waves",
    artist: "WaveFlow Studio",
    url: "/audio/ambient-waves.mp3",
  },
  {
    id: "T002",
    title: "Ocean Breeze",
    artist: "Blue Horizon",
    url: "/audio/ocean-breeze.mp3",
  },
  {
    id: "T003",
    title: "Night Drive",
    artist: "Neon Dreams",
    url: "/audio/night-drive.mp3",
  },
  {
    id: "T004",
    title: "Morning Light",
    artist: "Sunrise Audio",
    url: "/audio/morning-light.mp3",
  },
];

// ==================================================
// 2. AUDIO ENGINE AND QUEUE
// ==================================================

const audioEngine = new AudioEngine();

const audioQueue = new AudioTaskQueue(
  audioEngine.getContext()
);

// Limit decoded audio cache to two tracks
const decodedTracks = new Map<string, AudioBuffer>();
const MAX_CACHED_TRACKS = 2;

// Save the decoded buffer and evict the oldest item
function cacheTrack(
  id: string,
  buffer: AudioBuffer
): void {
  decodedTracks.delete(id);
  decodedTracks.set(id, buffer);

  if (decodedTracks.size > MAX_CACHED_TRACKS) {
    const oldestKey =
      decodedTracks.keys().next().value;

    if (oldestKey !== undefined) {
      decodedTracks.delete(oldestKey);
    }
  }
}

// Refresh the recently used track
function getCachedTrack(
  id: string
): AudioBuffer | undefined {
  const buffer = decodedTracks.get(id);

  if (buffer) {
    cacheTrack(id, buffer);
  }

  return buffer;
}

type QueueStatus =
  | "Waiting"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Cancelled";

interface QueueEntry {
  id: string;
  title: string;
  status: QueueStatus;
}

const queueEntries: QueueEntry[] = [];

let queueId = 0;
let activeEntryId: string | null = null;
let isStartingPlayback = false;
let isDisposed = false;
let isPlaying = false;

// ==================================================
// 3. RENDER USER INTERFACE
// ==================================================

const app =
  document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app element");
}

app.innerHTML = `
  <div class="app-shell">

    <!-- HEADER -->
    <header class="header">
      <a href="#home" class="logo">
        ♫ WaveFlow
      </a>

      <nav aria-label="Main navigation">
        <a href="#home">Home</a>
        <a href="#player">Player</a>
        <a href="#queue">Queue</a>
      </nav>

      <span class="header-label">
        AUDIO STUDIO
      </span>
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
          Experience asynchronous audio processing,
          FIFO scheduling, cancellation and
          real-time sound analysis.
        </p>

        <div class="hero-tags">
          <span>Web Audio API</span>
          <span>FIFO Queue</span>
          <span>AbortController</span>
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
          <span class="eyebrow">
            AUDIO PLAYER
          </span>
          <h2>Now Playing</h2>
        </div>

        <span
          class="status-label"
          id="player-status"
        >
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

      <!-- FREQUENCY VISUALIZER -->
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

      <!-- PROGRESS BAR -->
      <div class="progress-bar">
        <div
          class="progress-fill"
          id="progress-fill"
        ></div>
      </div>

      <div class="time-labels">
        <span id="current-time">0:00</span>
        <span id="total-time">0:00</span>
      </div>

      <!-- PLAYER CONTROLS -->
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

      <p
        class="feature-note"
        id="player-message"
        role="status"
        aria-live="polite"
      >
        Add a track to the queue to load audio.
      </p>

    </section>

    <!-- LIBRARY AND FIFO QUEUE -->
    <div class="content-grid">

      <!-- TRACK LIBRARY -->
      <section class="panel" id="library">

        <div class="section-heading">
          <div>
            <span class="eyebrow">
              MUSIC COLLECTION
            </span>
            <h2>Track Library</h2>
          </div>

          <span class="count">
            ${tracks.length} Tracks
          </span>
        </div>

        <div class="track-list">
          ${tracks.map(track => `
            <div class="track-item">

              <div class="track-icon">
                ♫
              </div>

              <div class="track-details">
                <h3>${track.title}</h3>
                <p>
                  ${track.artist} · Sample audio
                </p>
              </div>

              <button
                type="button"
                class="queue-btn"
                data-track-id="${track.id}"
                aria-label="Queue ${track.title}"
              >
                + Queue
              </button>

            </div>
          `).join("")}
        </div>

      </section>

      <!-- PROCESSING QUEUE -->
      <section class="panel" id="queue">

        <div class="section-heading">
          <div>
            <span class="eyebrow">
              FIFO ENGINE
            </span>
            <h2>Processing Queue</h2>
          </div>

          <span
            class="count"
            id="queue-count"
          >
            0 pending
          </span>
        </div>

        <ol
          class="queue-list"
          id="queue-list"
        >
          <li class="empty-queue">
            No audio tasks in the queue.
          </li>
        </ol>

        <div class="queue-footer">
          <div>
            <strong>Engine Status</strong>
            <span id="queue-status">
              Idle
            </span>
          </div>
        </div>

        <!-- CANCELLATION BUTTONS -->
        <div class="queue-actions">

          <button
            type="button"
            id="cancel-active-btn"
            class="danger-btn"
            disabled
          >
            Cancel Task
          </button>

          <button
            type="button"
            id="clear-pending-btn"
            class="outline-btn"
            disabled
          >
            Clear Pending
          </button>

          <button
            type="button"
            id="clear-history-btn"
            class="outline-btn"
            disabled
          >
            Clear History
          </button>

        </div>

        <p
          class="queue-message"
          id="queue-message"
          role="status"
          aria-live="polite"
        >
          No pending tasks.
        </p>

      </section>
    </div>

    <footer class="footer">
      WaveFlow Music Studio · FIFO · AbortController
    </footer>

  </div>
`;

// ==================================================
// 4. DOM REFERENCES
// ==================================================

function getElement<T extends Element>(
  selector: string
): T {
  const element =
    document.querySelector<T>(selector);

  if (!element) {
    throw new Error(
      `Missing element: ${selector}`
    );
  }

  return element;
}

const queueList =
  getElement<HTMLOListElement>("#queue-list");

const queueCount =
  getElement<HTMLElement>("#queue-count");

const queueStatus =
  getElement<HTMLElement>("#queue-status");

const queueMessage =
  getElement<HTMLElement>("#queue-message");

const cancelActiveBtn =
  getElement<HTMLButtonElement>(
    "#cancel-active-btn"
  );

const clearPendingBtn =
  getElement<HTMLButtonElement>(
    "#clear-pending-btn"
  );

const clearHistoryBtn =
  getElement<HTMLButtonElement>(
    "#clear-history-btn"
  );

const playerStatus =
  getElement<HTMLElement>("#player-status");

const playerMessage =
  getElement<HTMLElement>("#player-message");

const currentTitle =
  getElement<HTMLElement>("#current-title");

const currentArtist =
  getElement<HTMLElement>("#current-artist");

const currentTime =
  getElement<HTMLElement>("#current-time");

const totalTime =
  getElement<HTMLElement>("#total-time");

const playBtn =
  getElement<HTMLButtonElement>("#play-btn");

const stopBtn =
  getElement<HTMLButtonElement>("#stop-btn");

const visualizerCanvas =
  getElement<HTMLCanvasElement>("#visualizer");

// Initialize visualizer with existing AnalyserNode
const visualizer = new AudioVisualizer(
  visualizerCanvas,
  audioEngine.getAnalyser()
);

// ==================================================
// 5. HELPER FUNCTIONS
// ==================================================

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

// ==================================================
// 6. RENDER FIFO QUEUE
// ==================================================

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
    const item = document.createElement("li");
    item.className = "empty-queue";

    item.textContent =
      "No audio tasks in the queue.";

    queueList.appendChild(item);
  }

  const waitingCount = queueEntries.filter(
    entry => entry.status === "Waiting"
  ).length;

  const processingCount = queueEntries.filter(
    entry => entry.status === "Processing"
  ).length;

  const pendingCount =
    waitingCount + processingCount;

  const hasHistory = queueEntries.some(
    entry =>
      entry.status === "Completed" ||
      entry.status === "Failed" ||
      entry.status === "Cancelled"
  );

  queueCount.textContent =
    `${pendingCount} pending`;

  queueStatus.textContent =
    processingCount > 0
      ? "Processing"
      : audioQueue.isBusy()
        ? "Cancelling"
        : "Idle";

  cancelActiveBtn.disabled =
    activeEntryId === null;

  clearPendingBtn.disabled =
    waitingCount === 0;

  clearHistoryBtn.disabled =
    !hasHistory;
}

// ==================================================
// 7. AUDIO PLAYBACK
// ==================================================

async function playTrack(): Promise<void> {
  if (
    isDisposed ||
    isStartingPlayback ||
    !audioEngine.hasAudio()
  ) {
    return;
  }

  isStartingPlayback = true;
  playBtn.disabled = true;

  try {
    await audioEngine.play();

    if (isDisposed) {
      return;
    }

    // Start drawing only when audio is playing
    isPlaying = true;

    visualizer.stop();

    if (!document.hidden) {
      visualizer.start();
    }

    stopBtn.disabled = false;
    playBtn.textContent = "↻ Replay";

    playerStatus.textContent = "Playing";
    playerMessage.textContent =
      "Audio is playing.";
  } catch (error) {
    isPlaying = false;
    visualizer.stop();

    console.error(
      "Playback error:",
      error
    );

    if (!isDisposed) {
      playerStatus.textContent = "Error";

      playerMessage.textContent =
        "Unable to start playback.";
    }
  } finally {
    isStartingPlayback = false;

    if (!isDisposed) {
      playBtn.disabled = false;
    }
  }
}

// Handle Play
playBtn.addEventListener("click", () => {
  void playTrack();
});

// Handle Stop
stopBtn.addEventListener("click", () => {
  isPlaying = false;

  audioEngine.stop();
  visualizer.stop();

  stopBtn.disabled = true;
  playBtn.textContent = "▶ Play";

  currentTime.textContent = "0:00";

  playerStatus.textContent = "Stopped";
  playerMessage.textContent =
    "Playback stopped.";
});

// Handle natural playback completion
audioEngine.onEnded = () => {
  if (isDisposed) {
    return;
  }

  isPlaying = false;
  visualizer.stop();

  stopBtn.disabled = true;
  playBtn.textContent = "▶ Play";

  playerStatus.textContent = "Finished";

  playerMessage.textContent =
    "Playback finished. Press Play to restart.";
};

// ==================================================
// 8. PREPARE DECODED TRACK
// ==================================================

function prepareTrack(
  track: Track,
  buffer: AudioBuffer
): void {
  if (isDisposed) {
    return;
  }

  // Stop the old track and animation
  isPlaying = false;
  visualizer.stop();

  audioEngine.setBuffer(buffer);

  currentTitle.textContent = track.title;
  currentArtist.textContent = track.artist;

  currentTime.textContent = "0:00";
  totalTime.textContent =
    formatTime(buffer.duration);

  playBtn.textContent = "▶ Play";
  playBtn.disabled = false;
  stopBtn.disabled = true;

  playerStatus.textContent = "Ready";

  playerMessage.textContent =
    `${track.title} is ready to play.`;
}

// ==================================================
// 9. ADD AUDIO TASK TO FIFO QUEUE
// ==================================================

function addTrackToQueue(track: Track): void {
  if (isDisposed) {
    return;
  }

  // Reuse cached audio when available
  const cachedBuffer =
    getCachedTrack(track.id);

  if (cachedBuffer) {
    prepareTrack(track, cachedBuffer);

    queueMessage.textContent =
      `${track.title} loaded from cache.`;

    return;
  }

  const entry: QueueEntry = {
    id: `task-${++queueId}`,
    title: track.title,
    status: "Waiting",
  };

  queueEntries.push(entry);
  renderQueue();

  void audioQueue
    .enqueue(track.url, {
      onStart: () => {
        if (isDisposed) return;

        entry.status = "Processing";
        activeEntryId = entry.id;

        queueMessage.textContent =
          `Processing ${entry.title}...`;

        renderQueue();
      },

      onCancel: () => {
        if (isDisposed) return;

        entry.status = "Cancelled";

        if (activeEntryId === entry.id) {
          activeEntryId = null;
        }

        queueMessage.textContent =
          `${entry.title} was cancelled.`;

        renderQueue();
      },
    })
    .then((buffer: AudioBuffer) => {
      if (isDisposed) return;

      entry.status = "Completed";

      // Cache decoded audio with memory limit
      cacheTrack(track.id, buffer);

      // Prepare audio for playback
      prepareTrack(track, buffer);

      queueMessage.textContent =
        `${track.title} downloaded and decoded.`;
    })
    .catch((error: unknown) => {
      if (isDisposed) return;

      if (isAbortError(error)) {
        entry.status = "Cancelled";
      } else {
        entry.status = "Failed";

        console.error(
          `Failed to load ${track.title}:`,
          error
        );

        playerMessage.textContent =
          `Could not load ${track.title}.`;

        queueMessage.textContent =
          `${track.title} failed to load.`;
      }
    })
    .finally(() => {
      if (isDisposed) return;

      if (activeEntryId === entry.id) {
        activeEntryId = null;
      }

      renderQueue();
    });
}

// Event delegation for Track Library buttons
const library =
  getElement<HTMLElement>("#library");

library.addEventListener("click", event => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const button =
    target.closest<HTMLButtonElement>(
      ".queue-btn"
    );

  if (!button) return;

  const track = tracks.find(
    item =>
      item.id === button.dataset.trackId
  );

  if (track) {
    addTrackToQueue(track);
  }
});

// ==================================================
// 10. CANCEL ACTIVE TASK
// ==================================================

cancelActiveBtn.addEventListener(
  "click",
  () => {
    const cancelled =
      audioQueue.cancelActive();

    if (cancelled) {
      queueMessage.textContent =
        "Cancelling the active audio task...";
    }

    renderQueue();
  }
);

// ==================================================
// 11. CLEAR PENDING TASKS
// ==================================================

clearPendingBtn.addEventListener(
  "click",
  () => {
    const cancelledCount =
      audioQueue.clearPending();

    queueMessage.textContent =
      `${cancelledCount} waiting task(s) cancelled.`;

    renderQueue();
  }
);

// ==================================================
// 12. CLEAR FINISHED HISTORY
// ==================================================

clearHistoryBtn.addEventListener(
  "click",
  () => {
    for (
      let i = queueEntries.length - 1;
      i >= 0;
      i--
    ) {
      const status = queueEntries[i].status;

      if (
        status === "Completed" ||
        status === "Failed" ||
        status === "Cancelled"
      ) {
        queueEntries.splice(i, 1);
      }
    }

    queueMessage.textContent =
      "Finished task history cleared.";

    renderQueue();
  }
);

// ==================================================
// 13. BACKGROUND TAB PERFORMANCE
// ==================================================

// Stop rendering when browser tab is hidden
function handleVisibilityChange(): void {
  if (isDisposed) {
    return;
  }

  if (document.hidden) {
    visualizer.stop();
  } else if (isPlaying) {
    visualizer.start();
  }
}

document.addEventListener(
  "visibilitychange",
  handleVisibilityChange
);

// ==================================================
// 14. RESOURCE CLEANUP
// ==================================================

window.addEventListener("pagehide", () => {
  if (isDisposed) {
    return;
  }

  isDisposed = true;
  isPlaying = false;

  // Remove background visibility listener
  document.removeEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  // Stop animation and release ResizeObserver
  visualizer.dispose();

  // Cancel pending and active downloads
  audioQueue.dispose();

  // Release decoded audio references
  decodedTracks.clear();

  // Close AudioContext
  void audioEngine.dispose();
});

// Initial queue render
renderQueue();
