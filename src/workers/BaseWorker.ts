import { Queue, Worker, Job, JobsOptions } from 'bullmq';

export class BaseWorker {
  static QUEUE_NAME = '';
  static concurrency = 5;

  private static queue: Queue;

  static init() {
    this.queue = new Queue(this.QUEUE_NAME);

    new Worker(this.QUEUE_NAME, this.run);

    // TODO: improve this
    return this.queue;
  }

  static async send(data: any, opts?: JobsOptions | undefined): Promise<any> {
    return await this.queue?.add(this.name + '_' + new Date().toISOString(), data, opts);
  }

  static async run(job: Job<any>): Promise<any> {}
}
