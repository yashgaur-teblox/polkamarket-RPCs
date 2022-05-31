import { Queue, QueueScheduler, Worker, Job, JobsOptions } from 'bullmq';

import IORedis from 'ioredis';

export class BaseWorker {
  static QUEUE_NAME = '';
  static concurrency = 5;

  protected static queue: Queue;

  static init() {
    const connection = new IORedis(process.env.REDIS_URL || 6379);

    this.queue = new Queue(
      this.QUEUE_NAME,
      {
        connection,
        defaultJobOptions: {
          attempts: 5,
          timeout: 60000,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }
    );

    new Worker(this.QUEUE_NAME, this.run, { connection, concurrency: 5 });
    new QueueScheduler(this.QUEUE_NAME, { connection });

    // TODO: improve this
    return this.queue;
  }

  static async send(data: any, opts?: JobsOptions | undefined): Promise<any> {
    return await this.queue?.add(this.name + '_' + new Date().toISOString(), data, opts);
  }

  static async run(job: Job<any>): Promise<any> {}
}
