import { Queue, Worker, Job } from 'bullmq';

import { BaseWorker } from './BaseWorker';

import { BeproContractProvider } from '@providers/implementations/BeproContractProvider';

import { Etherscan } from '@services/Etherscan';
import { RedisService } from '@services/RedisService';

export class EventsBlockRangeWorker extends BaseWorker {
  static QUEUE_NAME = 'events-blocks';
  static concurrency = 5;

  static async run(job: Job<any>): Promise<any> {
    const beproContractProvider = new BeproContractProvider();

    const blockRanges = await beproContractProvider.getBlockRanges();
    if (blockRanges.length === 0) {
      return;
    }

    const { contract, address, eventName, filter, blockRange } = job.data;
    const providerIndex = 0;
    const useEtherscan = !!(process.env.ETHERSCAN_URL && process.env.ETHERSCAN_API_KEY);
    const blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;
    const beproContract = beproContractProvider.getContract(contract, address, providerIndex);
    let data;

    if (useEtherscan) {
      try {
        data = await (
          new Etherscan().getEvents(
            beproContract,
            address,
            blockRange['fromBlock'],
            blockRange['toBlock'],
            eventName,
            filter
          )
        );
      } catch (err) {
        // error fetching data from etherscan, taking RPC route
      }
    }

    if (!data) {
      data = await beproContract.getContract().getPastEvents(eventName, {
        filter,
        ...blockRange
      });
    }

    if (blockRange['toBlock'] % blockConfig['blockCount'] === 0) {
      const key = beproContractProvider.blockRangeCacheKey(contract, address, eventName, filter, blockRange);
      const writeClient = new RedisService().client;
      await writeClient.set(key, JSON.stringify(data));
      // closing connection after request is finished
      writeClient.end();
    }
  }
}
