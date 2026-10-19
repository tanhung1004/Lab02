
export interface AudioTask {
  id: string;
  trackUrl: string;
  controller: AbortController;
  resolve: (buffer: AudioBuffer) => void;
  reject: (error: Error) => void;
}

export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  private activeTask: AudioTask | null = null;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  // Add a task to the FIFO queue
  enqueue(trackUrl: string): Promise<AudioBuffer> {
    const controller = new AbortController();

    return new Promise<AudioBuffer>((resolve, reject) => {
      const task: AudioTask = {
        id: crypto.randomUUID(),
        trackUrl,
        controller,
        resolve,
        reject,
      };

      this.queue.push(task);

      // Start processing if the engine is idle
      void this.processNext();
    });
  }

  // Process tasks in their arrival order
  private async processNext(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift()!;
        this.activeTask = task;

        try {
          const response = await fetch(task.trackUrl, {
            signal: task.controller.signal,
          });

          if (!response.ok) {
            throw new Error(
              `HTTP error: ${response.status}`
            );
          }

          const arrayBuffer = await response.arrayBuffer();

          if (task.controller.signal.aborted) {
            throw new DOMException(
              "Task cancelled",
              "AbortError"
            );
          }

          const audioBuffer =
            await this.audioContext.decodeAudioData(arrayBuffer);

          if (task.controller.signal.aborted) {
            throw new DOMException(
              "Task cancelled",
              "AbortError"
            );
          }

          task.resolve(audioBuffer);
        } catch (error) {
          task.reject(
            error instanceof Error
              ? error
              : new Error(String(error))
          );
        } finally {
          this.activeTask = null;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Cancel currently active task
  cancelActive(): void {
    this.activeTask?.controller.abort();
  }

  // Cancel pending tasks
  clearPending(): void {
    for (const task of this.queue) {
      task.controller.abort();

      task.reject(
        new DOMException(
          "Pending task cancelled",
          "AbortError"
        )
      );
    }

    this.queue = [];
  }

  // Read-only queue status
  getStatus() {
    return {
      processing: this.isProcessing,
      activeTaskId: this.activeTask?.id ?? null,
      pendingCount: this.queue.length,
    };
  }
}
