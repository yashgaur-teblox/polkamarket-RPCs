
import { createNodeRedisClient } from 'handy-redis';

export class RedisService {
  public client: any;

  constructor() {
    this.client = createNodeRedisClient({ url: process.env.REDIS_URL, retry_strategy: () => { return undefined; } });
    this.client.nodeRedis.on("error", err => {
      // redis connection error, ignoring and letting the get/set functions error handlers act
      console.log("ERR :: Redis Connection: " + err);
      this.client.end();
    });
  }
}
