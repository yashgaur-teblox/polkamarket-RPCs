import { Job, JobsOptions } from 'bullmq';

import { BaseWorker } from './BaseWorker';

import { BeproContractProvider } from '@providers/implementations/BeproContractProvider';

import { Etherscan } from '@services/Etherscan';
import { RedisService } from '@services/RedisService';

export class EventsWorker extends BaseWorker {
  static QUEUE_NAME = 'events';
  static concurrency = 5;

  static async run(job: Job<any>): Promise<any> {
    const beproContractProvider = new BeproContractProvider();

    const { contract, address, eventName, filter, blockRange } = job.data;
    const providerIndex = 0;
    const useEtherscan = !!(process.env.ETHERSCAN_URL && process.env.ETHERSCAN_API_KEY);
    const blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;
    const beproContract = beproContractProvider.getContract(contract, address, providerIndex);
    let data;

    // if blockRange is not provided, the whole set will try to be fetched
    const fromBlock = blockRange ? blockRange['fromBlock'] : blockConfig['fromBlock'];
    const toBlock = blockRange ? blockRange['toBlock'] : 'latest';

    if (useEtherscan) {
      try {
        data = await (
          new Etherscan().getEvents(
            beproContract,
            address,
            fromBlock,
            toBlock,
            eventName,
            filter
          )
        );
      } catch (err) {
        // error fetching data from etherscan, taking RPC route
      }
    }

    if (!blockRange) {
      const blockRanges = await beproContractProvider.getBlockRanges();

      if (!data) {
        // triggering worker with all block ranges
        blockRanges.forEach((blockRange) => {
          EventsWorker.send(
            {
              contract,
              address,
              eventName,
              filter,
              blockRange
            }
          );
        });

        return;
      }

      // filling up empty redis slots
      const writeKeys: Array<[key: string, value: string]> = [];

      blockRanges.forEach((blockRange, index) => {
        const key = beproContractProvider.blockRangeCacheKey(contract, address, eventName, filter, blockRange);

        if (toBlock % blockConfig['blockCount'] === 0) {
          // key not stored in redis
          writeKeys.push([
            key,
            JSON.stringify(data.filter(e => e.blockNumber >= fromBlock && e.blockNumber <= toBlock))
          ]);
        }
      });

      if (writeKeys.length > 0) {
        const writeClient = new RedisService().client;
        await writeClient.mset(writeKeys as any);
        writeClient.end();
      }

      return;
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
