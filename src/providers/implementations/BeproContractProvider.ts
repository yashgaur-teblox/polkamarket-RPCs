import * as beprojs from 'bepro-js';

import { ContractProvider } from '@providers/ContractProvider';
import { createNodeRedisClient } from 'handy-redis';

export class BeproContractProvider implements ContractProvider {
  public bepro: any;

  constructor() {
    const blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;
    this.bepro = new beprojs.Application({
      web3Provider: process.env.WEB3_PROVIDER,
      blockConfig
    });
    this.bepro.start();
  }

  public getContract(contract: string, address: string) {
    if (contract === 'predictionMarket') {
      return this.bepro.getPredictionMarketContract({ contractAddress: address });
    } else if (contract === 'erc20') {
      return this.bepro.getERC20Contract({ contractAddress: address });
    } else if (contract === 'realitio') {
      return this.bepro.getRealitioERC20Contract({ contractAddress: address });
    } else {
      // this should never happen - should be overruled by the controller
      throw `'Contract ${contract} is not defined`;
    }
  }

  public async getContractEvents(contract: string, address: string, eventName: string, filter: Object) {
    const beproContract = this.getContract(contract, address);

    if (!beproContract.params.blockConfig) {
      // no block config, querying directly in evm
      const events = await beproContract.getEvents(eventName, filter);
      return events;
    }

    const client = createNodeRedisClient({ url: process.env.REDIS_URL });

    // iterating by block numbers
    let events = [];
    let fromBlock = beproContract.params.blockConfig.fromBlock;
    const blockRanges = []
    const currentBlockNumber = await beproContract.web3.eth.getBlockNumber();

    while (fromBlock < currentBlockNumber) {
      const toBlock = (fromBlock + beproContract.params.blockConfig.blockCount) > currentBlockNumber
        ? currentBlockNumber
        : (fromBlock + beproContract.params.blockConfig.blockCount);

      blockRanges.push({
        fromBlock,
        toBlock
      });

      fromBlock = toBlock;
    }

    await Promise.all(blockRanges.map(async (blockRange) => {
      const blockRangeStr = `${blockRange.fromBlock}-${blockRange.toBlock}`;
      const key = `events:${contract}:${eventName}:${JSON.stringify(filter)}:${blockRangeStr}`;
      // checking redis if events are cached
      const result = await client.get(key);
      let blockEvents;

      if (result) {
        blockEvents = JSON.parse(result);
      } else {
        blockEvents = await beproContract.getContract().getPastEvents(eventName, {
          filter,
          ...blockRange
        });

        // not writing to cache if block range is not complete
        if (blockRange.toBlock - blockRange.fromBlock === beproContract.params.blockConfig.blockCount) {
          await client.set(key, JSON.stringify(blockEvents));
        }
      }
      events = blockEvents.concat(events);
    }));

    return events.sort((a, b) => a.blockNumber - b.blockNumber);
  }
}
