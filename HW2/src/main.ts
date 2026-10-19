
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

const decodedTracks = new Map<string, AudioBuffer>();

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

// ==================================================
// 3. RENDER USER INTERFACE
// ==================================================

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app element");
}

app.innerHTML = `
  <div class="app-shell">

    <header class="header">
      <a href="#home" class="logo">♫ WaveFlow</a>

      <nav aria-label="Main navigation">
        <a href="#home">Home</a>
        <a href="#player">Player</a>
        <a href="#queue">Queue</a>
      </nav>

      <span class="header-label">AUDIO STUDIO</span>
    </header>

    <section class="hero" id="home">
      <div class="hero-copy">
        <span class="tag">
          TYPESCRIPT + WEB AUDIO API
        </span>

        <h1>Your Music.<br>Your Flow.</h1>

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

        <button type="button" id="stop-btn" disabled>
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

    <div class="content-grid">

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
          ${tracks.map(track => `
            <div class="track-item">
              <div class="track-icon">♫</div>

              <div class="track-details">
                <h3>${track.title}</h3>
                <p>${track.artist} · Sample audio</p>
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
        </div>

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
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
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
  getElement<HTMLButtonElement>("#cancel-active-btn");

const clearPendingBtn =
  getElement<HTMLButtonElement>("#clear-pending-btn");

const clearHistoryBtn =
  getElement<HTMLButtonElement>("#clear-history-btn");

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

// TASK 2.7 - Initialize frequency visualizer
const visualizerCanvas =
  getElement<HTMLCanvasElement>("#visualizer");

const visualizer = new AudioVisualizer(
  visualizerCanvas,
  audioEngine.getAnalyser()
);

// ==================================================
// 5. HELPERS
// ==================================================

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";

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
// 6. RENDER QUEUE
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
    item.textContent = "No audio tasks in the queue.";
    queueList.appendChild(item);
  }

  const waitingCount = queueEntries.filter(
    item => item.status === "Waiting"
  ).length;

  const processingCount = queueEntries.filter(
    item => item.status === "Processing"
  ).length;

  const unfinishedCount =
    waitingCount + processingCount;

  const hasHistory = queueEntries.some(
    item =>
      item.status === "Completed" ||
      item.status === "Failed" ||
      item.status === "Cancelled"
  );

  queueCount.textContent =
    `${unfinishedCount} pending`;

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

    if (isDisposed) return;

    // Restart the frequency animation for the current audio source.
    visualizer.stop();
    visualizer.start();

    stopBtn.disabled = false;
    playBtn.textContent = "↻ Replay";

    playerStatus.textContent = "Playing";
    playerMessage.textContent = "Audio is playing.";
  } catch (error) {
    visualizer.stop();
    console.error("Playback error:", error);

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

playBtn.addEventListener("click", () => {
  void playTrack();
});

stopBtn.addEventListener("click", () => {
  audioEngine.stop();
  visualizer.stop();

  stopBtn.disabled = true;
  playBtn.textContent = "▶ Play";

  currentTime.textContent = "0:00";
  playerStatus.textContent = "Stopped";
  playerMessage.textContent = "Playback stopped.";
});

audioEngine.onEnded = () => {
  if (isDisposed) return;

  visualizer.stop();

  stopBtn.disabled = true;
  playBtn.textContent = "▶ Play";

  playerStatus.textContent = "Finished";
  playerMessage.textContent =
    "Playback finished. Press Play to restart.";
};

function prepareTrack(
  track: Track,
  buffer: AudioBuffer
): void {
  if (isDisposed) return;

  // Stop rendering bars from the previous track.
  visualizer.stop();
  audioEngine.setBuffer(buffer);

  currentTitle.textContent = track.title;
  currentArtist.textContent = track.artist;

  currentTime.textContent = "0:00";
  totalTime.textContent = formatTime(buffer.duration);

  playBtn.textContent = "▶ Play";
  playBtn.disabled = false;
  stopBtn.disabled = true;

  playerStatus.textContent = "Ready";
  playerMessage.textContent =
    `${track.title} is ready to play.`;
}

// ==================================================
// 8. ADD TRACK TO FIFO QUEUE
// ==================================================

function addTrackToQueue(track: Track): void {
  if (isDisposed) return;

  const cachedBuffer = decodedTracks.get(track.id);

  // Cached tracks can be replayed immediately
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

        // Do not leave a cancelled task as active
        if (activeEntryId === entry.id) {
          activeEntryId = null;
        }

        queueMessage.textContent =
          `${entry.title} was cancelled.`;

        renderQueue();
      },
    })
    .then(buffer => {
      if (isDisposed) return;

      entry.status = "Completed";
      decodedTracks.set(track.id, buffer);

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

// Event delegation for Queue buttons
const library =
  getElement<HTMLElement>("#library");

library.addEventListener("click", event => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const button =
    target.closest<HTMLButtonElement>(".queue-btn");

  if (!button) return;

  const track = tracks.find(
    item => item.id === button.dataset.trackId
  );

  if (track) {
    addTrackToQueue(track);
  }
});

// ==================================================
// 9. CANCEL ACTIVE TASK
// ==================================================

cancelActiveBtn.addEventListener("click", () => {
  const cancelled = audioQueue.cancelActive();

  if (cancelled) {
    queueMessage.textContent =
      "Cancelling the active audio task...";
  }

  renderQueue();
});

// ==================================================
// 10. CANCEL ALL WAITING TASKS
// ==================================================

clearPendingBtn.addEventListener("click", () => {
  const cancelledCount = audioQueue.clearPending();

  queueMessage.textContent =
    `${cancelledCount} waiting task(s) cancelled.`;

  renderQueue();
});

// ==================================================
// 11. CLEAR FINISHED TASK HISTORY
// ==================================================

clearHistoryBtn.addEventListener("click", () => {
  for (let i = queueEntries.length - 1; i >= 0; i--) {
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
});

// ==================================================
// 12. RESOURCE CLEANUP
// ==================================================

window.addEventListener("pagehide", () => {
  isDisposed = true;

  visualizer.dispose();
  audioQueue.dispose();
  decodedTracks.clear();

  void audioEngine.dispose();
});

renderQueue();
