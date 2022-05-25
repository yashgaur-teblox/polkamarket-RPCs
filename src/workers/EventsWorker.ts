import { Queue, Worker, Job } from 'bullmq';

import { BaseWorker } from './BaseWorker';
import { EventsBlockRangeWorker } from './EventsBlockRangeWorker';

import { BeproContractProvider } from '@providers/implementations/BeproContractProvider';

import { Etherscan } from '@services/Etherscan';
import { RedisService } from '@services/RedisService';

export class EventsWorker extends BaseWorker {
  static QUEUE_NAME = 'events';
  static concurrency = 5;

  static async run(job: Job<any>): Promise<any> {
    const beproContractProvider = new BeproContractProvider();

    const blockRanges = await beproContractProvider.getBlockRanges();
    if (blockRanges.length === 0) {
      return;
    }

    const { contract, address, eventName, filter } = job.data;
    const providerIndex = 0;
    const useEtherscan = !!(process.env.ETHERSCAN_URL && process.env.ETHERSCAN_API_KEY);
    const blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;
    const beproContract = beproContractProvider.getContract(contract, address, providerIndex);
    const keys = blockRanges.map((blockRange) => beproContractProvider.blockRangeCacheKey(contract, address, eventName, filter, blockRange));

    // starting by fetching the whole block range, in case all events fit the query
    try {
      const etherscanData = await (
        new Etherscan().getEvents(
          beproContract,
          address,
          blockRanges[0]['fromBlock'],
          'latest',
          eventName,
          filter
        )
      );

      // filling up empty redis slots
      const writeKeys: Array<[key: string, value: string]> = [];

      keys.forEach((key, index) => {
        const fromBlock = parseInt(key.split(':').pop().split('-')[0]);
        const toBlock = parseInt(key.split(':').pop().split('-')[1]);

        if (toBlock % blockConfig['blockCount'] === 0) {
          // key not stored in redis
          writeKeys.push([
            key,
            JSON.stringify(etherscanData.filter(e => e.blockNumber >= fromBlock && e.blockNumber <= toBlock))
          ]);
        }
      });

      if (writeKeys.length > 0) {
        const writeClient = new RedisService().client;
        // await writeClient.mset(writeKeys as any);
        writeClient.end();
      }

      // return etherscanData;
    } catch (err) {
      // error fetching data from etherscan, taking iterations route
    }

    for (const blockRange of blockRanges) {
      EventsBlockRangeWorker.send(
        {
          contract,
          address,
          eventName,
          filter,
          blockRange,
        }
      );
    }
  }
}
