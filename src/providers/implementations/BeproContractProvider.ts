import * as beprojs from 'bepro-js';

import { ContractProvider } from '@providers/ContractProvider';

export class BeproContractProvider implements ContractProvider {
  public bepro: any;

  constructor() {
    this.bepro = new beprojs.Application({
      web3Provider: process.env.WEB3_PROVIDER
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
}
