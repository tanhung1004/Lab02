
export class AudioEngine {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private gainNode: GainNode;

  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private disposed = false;

  public onEnded?: () => void;

  constructor() {
    // Create Web Audio processing environment
    this.context = new AudioContext();

    // Set up frequency analysis
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    // Set up audio output
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 1;

    // Audio processing graph
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  }

  // Decode audio data into an AudioBuffer
  async load(arrayBuffer: ArrayBuffer): Promise<void> {
    this.assertActive();

    const decodedBuffer =
      await this.context.decodeAudioData(arrayBuffer);

    this.assertActive();
    this.stop();

    this.buffer = decodedBuffer;
  }

  // Start playback
  async play(): Promise<void> {
    this.assertActive();

    if (!this.buffer) {
      throw new Error("No audio file loaded");
    }

    // Browsers may suspend AudioContext initially
    await this.context.resume();
    this.assertActive();

    this.stop();

    const source = this.context.createBufferSource();

    source.buffer = this.buffer;
    source.connect(this.analyser);

    this.source = source;

    source.onended = () => {
      if (this.source !== source) return;

      source.disconnect();
      this.source = null;

      this.onEnded?.();
    };

    source.start(0);
  }

  // Stop playback and release the source node
  stop(): void {
    if (!this.source) return;

    const source = this.source;
    this.source = null;

    source.onended = null;

    try {
      source.stop();
    } catch {
      // Source may already have stopped
    }

    source.disconnect();
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  getDuration(): number {
    return this.buffer?.duration ?? 0;
  }

  hasAudio(): boolean {
    return this.buffer !== null;
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error("AudioEngine has been disposed");
    }
  }

  // Release Web Audio resources
  async dispose(): Promise<void> {
    if (this.disposed) return;

    this.disposed = true;
    this.stop();
    this.buffer = null;

    this.analyser.disconnect();
    this.gainNode.disconnect();

    if (this.context.state !== "closed") {
      await this.context.close();
    }
  }
}
