
export class AudioVisualizer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly analyser: AnalyserNode;
  private readonly frequencyData: Uint8Array<ArrayBuffer>;
  private readonly resizeObserver: ResizeObserver;

  private frameId: number | null = null;
  private running = false;
  private disposed = false;
  private lastDrawTime = 0;

  // Limit visualizer updates to approximately 30 FPS
  private readonly frameInterval = 1000 / 30;

  // Reuse gradient instead of recreating it every frame
  private gradient: CanvasGradient | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    analyser: AnalyserNode
  ) {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context unavailable");
    }

    this.canvas = canvas;
    this.ctx = context;
    this.analyser = analyser;

    // Create frequency buffer once
    this.frequencyData = new Uint8Array(
      new ArrayBuffer(analyser.frequencyBinCount)
    );

    // Watch canvas size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });

    this.resizeObserver.observe(canvas);
    this.resize();
  }

  // Resize canvas using device pixel ratio
  private resize(): void {
    if (this.disposed) return;

    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);

    if (
      this.canvas.width !== pixelWidth ||
      this.canvas.height !== pixelHeight
    ) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Create gradient only when canvas is resized
    this.gradient = this.ctx.createLinearGradient(
      0,
      height,
      0,
      0
    );

    this.gradient.addColorStop(0, "#2563eb");
    this.gradient.addColorStop(0.5, "#38bdf8");
    this.gradient.addColorStop(1, "#a5f3fc");

    if (this.running) {
      this.drawBars();
    } else {
      this.drawIdle();
    }
  }

  // Clear canvas
  private clear(): void {
    this.ctx.clearRect(
      0,
      0,
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );
  }

  // Draw baseline when music is not playing
  private drawIdle(): void {
    this.clear();

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.fillStyle =
      "rgba(148, 163, 184, 0.25)";

    this.ctx.fillRect(
      0,
      Math.max(0, height - 4),
      width,
      2
    );
  }

  // Draw frequency bars from actual audio data
  private drawBars(): void {
    this.clear();

    this.analyser.getByteFrequencyData(
      this.frequencyData
    );

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const barCount = Math.min(
      64,
      this.frequencyData.length
    );

    const gap = 3;

    const barWidth = Math.max(
      1,
      (width - gap * (barCount - 1)) / barCount
    );

    const step = Math.max(
      1,
      Math.floor(
        this.frequencyData.length / barCount
      )
    );

    this.ctx.fillStyle =
      this.gradient ?? "#38bdf8";

    for (let i = 0; i < barCount; i++) {
      const value = this.frequencyData[i * step];

      const barHeight = Math.max(
        3,
        (value / 255) * (height - 12)
      );

      const x = i * (barWidth + gap);
      const y = height - barHeight;

      this.ctx.fillRect(
        x,
        y,
        barWidth,
        barHeight
      );
    }
  }

  // Animation loop with frame throttling
  private animate = (timestamp: number): void => {
    if (!this.running || this.disposed) {
      return;
    }

    if (
      timestamp - this.lastDrawTime >=
      this.frameInterval
    ) {
      this.drawBars();
      this.lastDrawTime = timestamp;
    }

    this.frameId = requestAnimationFrame(
      this.animate
    );
  };

  // Start the visualizer
  start(): void {
    if (this.disposed || this.running) {
      return;
    }

    this.running = true;
    this.lastDrawTime = -Infinity;

    this.frameId = requestAnimationFrame(
      this.animate
    );
  }

  // Stop drawing and cancel animation frame
  stop(): void {
    this.running = false;

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }

    this.frameId = null;

    if (!this.disposed) {
      this.drawIdle();
    }
  }

  // Clean up resources
  dispose(): void {
    if (this.disposed) return;

    this.stop();
    this.disposed = true;

    this.resizeObserver.disconnect();
    this.gradient = null;
  }
}
