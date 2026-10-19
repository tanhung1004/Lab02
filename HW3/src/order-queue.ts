
export interface OrderRequest {
  id: number;
  productId: number;
  quantity: number;
}

export interface OrderResult {
  orderId: number;
  productId: number;
  success: boolean;
  reason: string;
}

interface QueueTask {
  request: OrderRequest;
  resolve: (result: OrderResult) => void;
  reject: (reason: unknown) => void;
}

export class OrderQueue {
  private tasks: QueueTask[] = [];
  private processing = false;

  // Store the order processing function
  private readonly handler:
    (request: OrderRequest) => OrderResult;

  // Constructor compatible with erasableSyntaxOnly
  constructor(
    handler: (request: OrderRequest) => OrderResult
  ) {
    this.handler = handler;
  }

  // Add a new order to the FIFO queue
  enqueue(request: OrderRequest): Promise<OrderResult> {
    return new Promise<OrderResult>((resolve, reject) => {
      const task: QueueTask = {
        request,
        resolve,
        reject,
      };

      // Add to the end of the queue
      this.tasks.push(task);

      // Start processing if no worker is running
      void this.processQueue();
    });
  }

  // Process order requests sequentially
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      while (this.tasks.length > 0) {
        // FIFO: remove the first request
        const task = this.tasks.shift();

        if (!task) {
          continue;
        }

        try {
          // Simulate asynchronous scheduling
          await Promise.resolve();

          // Execute inventory validation and update
          const result = this.handler(task.request);

          // Return the result to the caller
          task.resolve(result);
        } catch (error) {
          // Reject only the failed task
          task.reject(error);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // Number of requests waiting in the queue
  getPendingCount(): number {
    return this.tasks.length;
  }

  // Whether the queue is currently processing
  isProcessing(): boolean {
    return this.processing;
  }
}
