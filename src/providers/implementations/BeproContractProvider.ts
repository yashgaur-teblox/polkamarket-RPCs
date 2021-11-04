import * as beprojs from 'bepro-js';

import { ContractProvider } from '@providers/ContractProvider';
import { createNodeRedisClient } from 'handy-redis';

export class BeproContractProvider implements ContractProvider {
  public bepro: any;

  constructor() {
    this.bepro = new beprojs.Application({
      web3Provider: process.env.WEB3_PROVIDER,
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
    const blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;

    if (!blockConfig) {
      // no block config, querying directly in evm
      const events = await beproContract.getEvents(eventName, filter);
      return events;
    }

    const client = createNodeRedisClient({ url: process.env.REDIS_URL, retry_strategy: () => { return undefined; } });
    client.nodeRedis.on("error", err => {
      // redis connection error, ignoring and letting the get/set functions error handlers act
      console.log("ERR :: Redis Connection: " + err);
    });


    // iterating by block numbers
    let events = [];
    let fromBlock = blockConfig.fromBlock;
    const blockRanges = []
    const currentBlockNumber = await beproContract.web3.eth.getBlockNumber();

    while (fromBlock < currentBlockNumber) {
      const toBlock = (fromBlock + blockConfig.blockCount) > currentBlockNumber
        ? currentBlockNumber
        : (fromBlock + blockConfig.blockCount);

      blockRanges.push({
        fromBlock,
        toBlock
      });

      fromBlock = toBlock;
    }

    const keys = blockRanges.map((blockRange) => {
      const blockRangeStr = `${blockRange.fromBlock}-${blockRange.toBlock}`;
      return `events:${contract}:${address}:${eventName}:${JSON.stringify(filter)}:${blockRangeStr}`;
    });

    const response = await client.mget(...keys).catch(err => {
      console.log(err);
      throw(err);
    });

    await Promise.all(blockRanges.map(async (blockRange, index) => {
      // checking redis if events are cached
      const result = response[index];
      let blockEvents;

      if (result) {
        blockEvents = JSON.parse(result);
      } else {
        blockEvents = await beproContract.getContract().getPastEvents(eventName, {
          filter,
          ...blockRange
        });

        // not writing to cache if block range is not complete
        if (blockRange.toBlock - blockRange.fromBlock === blockConfig.blockCount) {
          const blockRangeStr = `${blockRange.fromBlock}-${blockRange.toBlock}`;
          const key = `events:${contract}:${address}:${eventName}:${JSON.stringify(filter)}:${blockRangeStr}`;
          await client.set(key, JSON.stringify(blockEvents)).catch(err => {
            console.log(err);
            throw(err);
          });
        }
      }
      events = blockEvents.concat(events);
    }));

    return events.sort((a, b) => a.blockNumber - b.blockNumber);
  }
}
