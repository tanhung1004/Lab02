# HW2 – Task Decomposition

## Project Information
- **Project:** Concurrent FIFO Audio Visualizer Queue Engine
- **Application:** Audio Queue & Frequency Visualizer
- **Tech Stack:** TypeScript, Vite, HTML, CSS, Web Audio API
- **Duration:** 1 Week
- **Performance Target:** 60 FPS
- **Audio Analysis:** AnalyserNode with 256/512 frequency bins

## Task 2.1 – Project Setup
- [ ] Configure TypeScript and Vite.
- [ ] Set up package.json, tsconfig.json and index.html.
- [ ] Configure main.ts as the application entry point.
- [ ] Verify the application runs on localhost.

**Files:** package.json, tsconfig.json, index.html, src/main.ts

**Commit:** `chore(hw2): initialize audio visualizer project`

## Task 2.2 – Audio Player UI
- [ ] Build the audio player interface.
- [ ] Create a track list and playback controls.
- [ ] Create the visualizer display area.
- [ ] Apply responsive styling.

**Files:** src/main.ts, src/style.css

**Commit:** `feat(hw2): build audio player interface`

## Task 2.3 – Web Audio API Engine
- [ ] Initialize AudioContext.
- [ ] Implement audio buffer decoding.
- [ ] Create and connect AudioBufferSourceNode.
- [ ] Configure AnalyserNode.
- [ ] Handle audio context lifecycle.

**Files:** src/main.ts, src/audio-visualizer.ts

**Commit:** `feat(hw2): integrate web audio engine`

## Task 2.4 – FIFO Queue Controller
- [ ] Define AudioTask interface.
- [ ] Implement AudioTaskQueue class.
- [ ] Store pending audio tasks in a FIFO queue.
- [ ] Implement enqueue() and processNext().
- [ ] Prevent unintended parallel queue processing.

**Files:** src/audio-queue-controller.ts

**Commit:** `feat(hw2): implement FIFO audio task queue`

## Task 2.5 – Async Download & Decode
- [ ] Fetch audio tracks asynchronously.
- [ ] Integrate Promise and async/await.
- [ ] Decode downloaded audio buffers.
- [ ] Process download and decode tasks in FIFO order.
- [ ] Handle failed network requests and decoding errors.

**Files:** src/audio-queue-controller.ts, src/main.ts

**Commit:** `feat(hw2): add asynchronous audio processing`

## Task 2.6 – AbortController & Cancellation
- [ ] Create an AbortController for each download task.
- [ ] Pass AbortSignal to fetch().
- [ ] Implement cancellation for pending tasks.
- [ ] Cancel active downloads safely.
- [ ] Reject cancelled tasks with appropriate errors.
- [ ] Continue processing the remaining queue.

**Files:** src/audio-queue-controller.ts

**Commit:** `feat(hw2): implement task cancellation`

## Task 2.7 – Frequency Visualizer
- [ ] Read audio frequency data from AnalyserNode.
- [ ] Configure FFT to provide 256/512 frequency bins.
- [ ] Render the visualizer with Canvas or SVG.
- [ ] Use requestAnimationFrame for animation.
- [ ] Optimize rendering toward 60 FPS.

**Files:** src/audio-visualizer.ts, src/style.css

**Commit:** `feat(hw2): implement real-time audio visualization`

## Task 2.8 – Memory Safety & Performance
- [ ] Stop and disconnect inactive AudioBufferSourceNodes.
- [ ] Cancel unused requestAnimationFrame callbacks.
- [ ] Release unused audio buffers and references.
- [ ] Clean up listeners and audio resources.
- [ ] Verify repeated playback and cancellation.
- [ ] Inspect memory usage and frame performance.

**Files:** src/audio-queue-controller.ts, src/audio-visualizer.ts, src/main.ts

**Commit:** `fix(hw2): prevent audio resource leaks`

## Task 2.9 – Final Verification & Documentation
- [ ] Test FIFO processing order.
- [ ] Test simultaneous user download requests.
- [ ] Test cancellation and error handling.
- [ ] Verify frequency visualization.
- [ ] Check animation performance.
- [ ] Document setup and usage.
- [ ] Review Git commits and push to GitHub.

**Files:** task_decomposition.md, README.md

**Commit:** `docs(hw2): complete testing and documentation`

## Definition of Done
- FIFO audio queue processes tasks correctly.
- Asynchronous downloads and audio decoding work.
- Cancellation using AbortController is implemented.
- Frequency visualizer uses Web Audio AnalyserNode.
- Rendering targets 60 FPS without unnecessary application state updates.
- Audio nodes and animation resources are cleaned up correctly.
- Testing, documentation and Git history are complete.
