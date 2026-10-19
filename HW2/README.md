
# HW2 – Concurrent FIFO Audio Visualizer Queue Engine

## Overview

WaveFlow is a TypeScript and Vite application that
demonstrates asynchronous audio processing, FIFO
task scheduling, cancellation, and real-time
frequency visualization using the Web Audio API.

## Technologies

- TypeScript
- Vite
- Web Audio API
- Fetch API
- AbortController
- Canvas API
- requestAnimationFrame

## Features

- Modern responsive audio player interface
- Local sample MP3 track library
- FIFO audio download and decoding queue
- Sequential audio task processing
- Active download cancellation
- Pending task cancellation
- Task status tracking
- Audio playback and stop controls
- Real-time FFT frequency visualizer
- Reduced visualizer rendering workload
- Limited decoded audio cache
- Audio and animation resource cleanup

## Project Structure

HW2/
  public/
    audio/
  src/
    audio-engine.ts
    audio-queue-controller.ts
    audio-visualizer.ts
    main.ts
    style.css
  index.html
  package.json
  tsconfig.json
  task_decomposition.md

## Installation

Install dependencies:

    npm install

Start the development server:

    npm run dev

Build for production:

    npm run build

## Audio Files

Place valid MP3 files in public/audio/:

- ambient-waves.mp3
- ocean-breeze.mp3
- night-drive.mp3
- morning-light.mp3

Only use and distribute audio files for which
you have appropriate rights.

## How to Use

1. Start the application.
2. Select a track using the + Queue button.
3. Wait for the audio to download and decode.
4. Press Play to listen to the selected track.
5. Observe the frequency visualization.
6. Press Stop to stop playback.
7. Use Cancel Task to cancel an active download.
8. Use Clear Pending to cancel waiting tasks.
9. Use Clear History to remove finished entries.

## Architecture

Audio downloads and decoding are processed
sequentially through the FIFO queue.

Successfully decoded audio buffers are passed
to the audio engine for playback.

The AnalyserNode provides frequency data to
the Canvas visualizer.

AbortController cancels network downloads.
An already-running decodeAudioData operation
cannot be interrupted directly; cancelled
results are discarded afterward.

## Limitations

- Previous and Next are not implemented.
- Progress bar timing is not implemented.
- FIFO applies to audio preparation tasks,
  not automatic sequential playback.
- Cache size is limited by track count,
  not by an exact memory budget.

## Verification

Refer to task_decomposition.md for the
final verification checklist.

## Status

Implementation complete; final verification pending.
