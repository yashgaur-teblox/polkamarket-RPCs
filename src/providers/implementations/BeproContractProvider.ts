import * as beprojs from 'bepro-js';

import { ContractProvider } from '@providers/ContractProvider';
import { Etherscan } from '@services/Etherscan';
import { RedisService } from '@services/RedisService';

import { EventsWorker } from 'src/workers/EventsWorker';

export class BeproContractProvider implements ContractProvider {
  public bepro: any;

  public web3Providers: Array<string>;

  public useEtherscan: boolean;

  public blockConfig: Object | undefined;

  constructor() {
    // providers are comma separated
    this.web3Providers = process.env.WEB3_PROVIDER.split(',');
    this.useEtherscan = !!(process.env.ETHERSCAN_URL && process.env.ETHERSCAN_API_KEY);
    this.blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;
  }

  public initializeBepro(web3ProviderIndex: number) {
    // picking up provider and starting bepro
    this.bepro = new beprojs.Application({
      web3Provider: this.web3Providers[web3ProviderIndex]
    });
    this.bepro.start();
  }

  public getContract(contract: string, address: string, providerIndex: number) {
    this.initializeBepro(providerIndex);

    if (contract === 'predictionMarket') {
      return this.bepro.getPredictionMarketContract({ contractAddress: address });
    } else if (contract === 'erc20') {
      return this.bepro.getERC20Contract({ contractAddress: address });
    } else if (contract === 'realitio') {
      return this.bepro.getRealitioERC20Contract({ contractAddress: address });
    } else if (contract === 'achievements') {
      return this.bepro.getAchievementsContract({ contractAddress: address });
    } else {
      // this should never happen - should be overruled by the controller
      throw `'Contract ${contract} is not defined`;
    }
  }

  public async getBlockRanges() {
    if (!this.blockConfig) {
      return [];
    }

    if (!this.bepro) {
      this.initializeBepro(0);
    }

    // iterating by block numbers
    let fromBlock = this.blockConfig['fromBlock'];
    const blockRanges = [];
    const currentBlockNumber = await this.bepro.web3.eth.getBlockNumber();

    while (fromBlock < currentBlockNumber) {
      let toBlock = (fromBlock - fromBlock % this.blockConfig['blockCount']) + this.blockConfig['blockCount'];
      toBlock = toBlock > currentBlockNumber ? currentBlockNumber : toBlock;

      blockRanges.push({
        fromBlock,
        toBlock
      });

      fromBlock = toBlock + 1;
    }

    return blockRanges;
  }

  normalizeFilter(filter: Object): string {
    // sorting filter keys
    const keys = Object.keys(filter).sort();

    // normalizing filter
    const normalizedFilter = {};
    keys.forEach(key => {
      // ignoring item if not present
      if (!filter[key]) {
        return;
      }

      if (typeof filter[key] === 'string' && filter[key].startsWith('0x')) {
        // parsing as lowercase string in case it's a hexadecimal
        normalizedFilter[key] = filter[key].toString().toLowerCase();
      } else if (typeof filter[key] === 'string' && !isNaN(parseInt(filter[key]))) {
        // parsing string as integer in case it's a number
        normalizedFilter[key] = parseInt(filter[key]);
      } else {
        // storing string as downcase
        normalizedFilter[key] = filter[key].toString().toLowerCase();
      }
    });

    return JSON.stringify(normalizedFilter);
  }

  public blockRangeCacheKey(contract: string, address: string, eventName: string, filter: Object, blockRange: Object) {
    const blockRangeStr = `${blockRange['fromBlock']}-${blockRange['toBlock']}`;
    return `events:${contract}:${address}:${eventName}:${this.normalizeFilter(filter)}:${blockRangeStr}`;
  }

  public async getContractEvents(contract: string, address: string, providerIndex: number, eventName: string, filter: Object) {
    const beproContract = this.getContract(contract, address, providerIndex);
    this.blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;
    let etherscanData;

    if (!this.blockConfig) {
      // no block config, querying directly in evm
      const events = await beproContract.getEvents(eventName, filter);
      return events;
    }

    const readClient = new RedisService().client;

    if (this.useEtherscan) {
      try {
        etherscanData = await (new Etherscan().getEvents(beproContract, address, this.blockConfig['fromBlock'], 'latest', eventName, filter));
      } catch (err) {
        // error fetching data from etherscan, taking RPC route
      }
    }

    // iterating by block numbers
    let events = [];
    let rpcError;
    const blockRanges = await this.getBlockRanges();

    const keys = blockRanges.map((blockRange) => this.blockRangeCacheKey(contract, address, eventName, filter, blockRange));

    const response = await readClient.mget(...keys).catch(err => {
      console.log(err);
      readClient.end();
      throw(err);
    });

    // closing connection after request is finished
    readClient.end();

    // successful etherscan call
    if (etherscanData && !etherscanData.maxLimitReached) {
      // filling up empty redis slots
      const writeKeys: Array<[key: string, value: string]> = [];

      keys.forEach((key, index) => {
        const result = response[index];
        const fromBlock = parseInt(key.split(':').pop().split('-')[0]);
        const toBlock = parseInt(key.split(':').pop().split('-')[1]);

        if (!result && (toBlock % this.blockConfig['blockCount'] === 0)) {
          // key not stored in redis
          writeKeys.push([
            key,
            JSON.stringify(etherscanData.result.filter(e => e.blockNumber >= fromBlock && e.blockNumber <= toBlock))
          ]);
        }
      });

      if (writeKeys.length > 0) {
        const writeClient = new RedisService().client;
        await writeClient.mset(writeKeys as any).catch(err => {
          console.log(err);
          writeClient.end();
          throw(err);
        });
        writeClient.end();
      }

      return etherscanData.result;
    }

    // filling up empty redis slots (only verifying for first provider)
    if (providerIndex === 0 && response.slice(0, -1).some(r => r === null)) {
      // some keys are not stored in redis, triggering backfill worker
      EventsWorker.send(
        {
          contract,
          address,
          eventName,
          filter
        }
      );
    }

    await Promise.all(blockRanges.map(async (blockRange, index) => {
      // checking redis if events are cached
      const result = response[index];
      let blockEvents;

      if (result) {
        blockEvents = JSON.parse(result);
      } else {
        try {
          blockEvents = await beproContract.getContract().getPastEvents(eventName, {
            filter,
            ...blockRange
          });
        } catch (err) {
          // non-blocking, error will be thrown after all calls are performed
          rpcError = err;
          return;
        }

        // not writing to cache if block range is not complete
        if (blockRange.toBlock % this.blockConfig['blockCount'] === 0) {
          const writeClient = new RedisService().client;
          writeClient.nodeRedis.on("error", err => {
            // redis connection error, ignoring and letting the get/set functions error handlers act
            console.log("ERR :: Redis Connection: " + err);
            writeClient.end();
          });

          const key = this.blockRangeCacheKey(contract, address, eventName, filter, blockRange);
          await writeClient.set(key, JSON.stringify(blockEvents)).catch(err => {
            console.log(err);
            writeClient.end();
            throw(err);
          });
          writeClient.end();
        }
      }

      events = blockEvents.concat(events);
    }));

    // if there's a RPC error, error is thrown after all calls are performed
    if (rpcError) throw(rpcError);

    return events.sort((a, b) => a.blockNumber - b.blockNumber);
  }
}
