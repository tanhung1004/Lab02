
export class AudioEngine {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private gainNode: GainNode;

  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private disposed = false;

  public onEnded?: () => void;

  constructor() {
    this.context = new AudioContext();

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 1;

    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  }

  // Share the AudioContext with the FIFO queue
  getContext(): AudioContext {
    return this.context;
  }

  // Expose frequency analysis node for Task 2.7
  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  // Receive decoded audio from the queue
  setBuffer(buffer: AudioBuffer): void {
    if (this.disposed) {
      throw new Error("Audio engine is disposed");
    }

    this.stop();
    this.buffer = buffer;
  }

  // Decode an audio file directly if needed
  async load(data: ArrayBuffer): Promise<void> {
    if (this.disposed) {
      throw new Error("Audio engine is disposed");
    }

    const buffer =
      await this.context.decodeAudioData(data);

    this.setBuffer(buffer);
  }

  // Start playing the prepared audio buffer
  async play(): Promise<void> {
    if (this.disposed || !this.buffer) {
      throw new Error("No audio available");
    }

    await this.context.resume();

    if (this.disposed) {
      throw new Error("Audio engine is disposed");
    }

    this.stop();

    const source = this.context.createBufferSource();

    source.buffer = this.buffer;
    source.connect(this.analyser);

    this.source = source;

    source.onended = () => {
      if (this.source !== source) return;

      this.source = null;
      source.disconnect();
      this.onEnded?.();
    };

    source.start(0);
  }

  // Stop the current source
  stop(): void {
    const source = this.source;
    if (!source) return;

    this.source = null;
    source.onended = null;

    try {
      source.stop();
    } catch {
      // Source may have already stopped
    }

    source.disconnect();
  }

  hasAudio(): boolean {
    return this.buffer !== null;
  }

  getDuration(): number {
    return this.buffer?.duration ?? 0;
  }

  // Release the audio graph
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
