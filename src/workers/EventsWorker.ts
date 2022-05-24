import { Queue, Worker, Job } from 'bullmq';
import { BaseWorker } from './BaseWorker';

export class EventsWorker extends BaseWorker {
  static QUEUE_NAME = 'events';
  static concurrency = 5;

  static async run(job: Job<any>): Promise<any> {
    // TODO
  }
}
