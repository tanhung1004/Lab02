
export class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode;
  private frequencyData: Uint8Array<ArrayBuffer>;

  private frameId: number | null = null;
  private running = false;
  private disposed = false;
  private resizeObserver: ResizeObserver;

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

    // One value for each FFT frequency bin
    this.frequencyData = new Uint8Array(
      new ArrayBuffer(analyser.frequencyBinCount)
    );

    // Adjust canvas resolution whenever its CSS size changes
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });

    this.resizeObserver.observe(canvas);
    this.resize();
  }

  // Match canvas pixels to displayed dimensions
  private resize(): void {
    if (this.disposed) return;

    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

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
    this.drawIdle();
  }

  // Clear the visualizer panel
  private clear(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.clearRect(0, 0, width, height);
  }

  // Draw the resting baseline
  private drawIdle(): void {
    if (this.running) return;

    this.clear();

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.fillStyle = "rgba(148, 163, 184, 0.25)";
    this.ctx.fillRect(0, height - 4, width, 2);
  }

  // Draw frequency bars based on the analyser data
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

    const gap = 4;
    const barWidth = Math.max(
      1,
      (width - gap * (barCount - 1)) / barCount
    );

    const step = Math.max(
      1,
      Math.floor(this.frequencyData.length / barCount)
    );

    const gradient = this.ctx.createLinearGradient(
      0,
      height,
      0,
      0
    );

    gradient.addColorStop(0, "#2563eb");
    gradient.addColorStop(0.5, "#38bdf8");
    gradient.addColorStop(1, "#a5f3fc");

    this.ctx.fillStyle = gradient;

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

  // Animation loop
  private animate = (): void => {
    if (!this.running || this.disposed) return;

    this.drawBars();
    this.frameId = requestAnimationFrame(
      this.animate
    );
  };

  // Start the visualizer
  start(): void {
    if (this.disposed || this.running) return;

    this.running = true;
    this.animate();
  }

  // Stop animation and clear the bars
  stop(): void {
    this.running = false;

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    if (!this.disposed) {
      this.drawIdle();
    }
  }

  // Release browser observers and animation frames
  dispose(): void {
    if (this.disposed) return;

    this.stop();
    this.disposed = true;
    this.resizeObserver.disconnect();
  }
}
