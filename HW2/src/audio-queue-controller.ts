
export type TaskStatus =
  | "Waiting"
  | "Processing"
  | "Completed"
  | "Failed";

export interface AudioQueueTask {
  id: string;
  url: string;
  onStart?: () => void;
  resolve: (buffer: AudioBuffer) => void;
  reject: (error: Error) => void;
}

export class AudioTaskQueue {
  private queue: AudioQueueTask[] = [];
  private activeTask: AudioQueueTask | null = null;
  private processing = false;
  private disposed = false;

  constructor(private context: AudioContext) {}

  // Add a task to the end of the queue
  enqueue(
    url: string,
    onStart?: () => void
  ): Promise<AudioBuffer> {
    if (this.disposed) {
      return Promise.reject(
        new Error("Queue has been disposed")
      );
    }

    return new Promise<AudioBuffer>((resolve, reject) => {
      const task: AudioQueueTask = {
        id: crypto.randomUUID(),
        url,
        onStart,
        resolve,
        reject,
      };

      this.queue.push(task);

      // Start a worker only when one is not running
      void this.processQueue();
    });
  }

  // Sequential FIFO processing
  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift();

        if (!task) continue;

        this.activeTask = task;

        try {
          // Notify the UI only when this task starts
          task.onStart?.();

          // Download audio asynchronously
          const response = await fetch(task.url);

          if (!response.ok) {
            throw new Error(
              `Download failed: HTTP ${response.status}`
            );
          }

          // Convert response into binary data
          const arrayBuffer =
            await response.arrayBuffer();

          // Decode MP3/WAV into Web Audio buffer
          const audioBuffer =
            await this.context.decodeAudioData(
              arrayBuffer
            );

          // Return decoded audio to the caller
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
      this.processing = false;
    }
  }

  // Number of tasks waiting to be processed
  getPendingCount(): number {
    return this.queue.length;
  }

  // Check whether a task is currently running
  isBusy(): boolean {
    return this.processing;
  }

  // Reject tasks that have not started
  clearPending(): void {
    const pending = this.queue.splice(0);

    for (const task of pending) {
      task.reject(
        new Error("Pending task was cleared")
      );
    }
  }

  // Prevent new tasks and clear waiting tasks
  dispose(): void {
    this.disposed = true;
    this.clearPending();
  }
}
