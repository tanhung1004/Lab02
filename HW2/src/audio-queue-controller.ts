
export interface QueueCallbacks {
  onStart?: () => void;
  onCancel?: () => void;
}

interface AudioQueueTask {
  id: string;
  url: string;
  controller: AbortController;
  callbacks: QueueCallbacks;
  resolve: (buffer: AudioBuffer) => void;
  reject: (reason: Error) => void;
}

function abortError(): DOMException {
  return new DOMException("Audio task cancelled", "AbortError");
}

function toError(value: unknown): Error {
  return value instanceof Error
    ? value
    : new Error(String(value));
}

export class AudioTaskQueue {
  private queue: AudioQueueTask[] = [];
  private activeTask: AudioQueueTask | null = null;
  private processing = false;
  private disposed = false;

  constructor(private context: AudioContext) {}

  // Add a task to the end of the FIFO queue
  enqueue(
    url: string,
    callbacks: QueueCallbacks = {}
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
        controller: new AbortController(),
        callbacks,
        resolve,
        reject,
      };

      this.queue.push(task);
      void this.processQueue();
    });
  }

  // Process only one audio task at a time
  private async processQueue(): Promise<void> {
    if (this.processing || this.disposed) return;

    this.processing = true;

    try {
      while (this.queue.length > 0 && !this.disposed) {
        const task = this.queue.shift();

        if (!task) continue;

        this.activeTask = task;
        const signal = task.controller.signal;

        try {
          if (signal.aborted) throw abortError();

          task.callbacks.onStart?.();

          // AbortSignal cancels an active download
          const response = await fetch(task.url, {
            signal,
          });

          if (!response.ok) {
            throw new Error(
              `Download failed: HTTP ${response.status}`
            );
          }

          const data = await response.arrayBuffer();

          if (signal.aborted) throw abortError();

          // decodeAudioData cannot be interrupted directly
          const decoded =
            await this.context.decodeAudioData(data);

          // Ignore decoded results from cancelled tasks
          if (signal.aborted) throw abortError();

          task.resolve(decoded);
        } catch (error: unknown) {
          if (signal.aborted) {
            task.reject(abortError());
          } else {
            task.reject(toError(error));
          }
        } finally {
          this.activeTask = null;
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // Cancel the task currently being processed
  cancelActive(): boolean {
    const task = this.activeTask;

    if (!task || task.controller.signal.aborted) {
      return false;
    }

    task.controller.abort();
    task.callbacks.onCancel?.();

    return true;
  }

  // Cancel tasks that have not started yet
  clearPending(): number {
    const tasks = this.queue.splice(0);

    for (const task of tasks) {
      task.controller.abort();
      task.callbacks.onCancel?.();
      task.reject(abortError());
    }

    return tasks.length;
  }

  getPendingCount(): number {
    return this.queue.length;
  }

  isBusy(): boolean {
    return this.processing;
  }

  // Prevent new tasks and cancel existing ones
  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;
    this.clearPending();
    this.cancelActive();
  }
}