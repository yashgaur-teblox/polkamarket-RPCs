import * as beprojs from 'bepro-js';

import { ContractProvider } from 'providers/ContractProvider';

export class BeproContractProvider implements ContractProvider {
  public bepro: any;
  public predictionMarket: any;
  public erc20: any;
  public realitio: any;

  constructor() {
    this.bepro = new beprojs.Application({ mainnet: false });
    this.bepro.start();
    this.getContracts();
  }

  public async getContracts() {
    this.getPredictionMarketContract();
    this.getRealitioERC20Contract();
    this.getERC20Contract();
  }

  public getPredictionMarketContract() {
    this.predictionMarket = this.bepro.getPredictionMarketContract({
      contractAddress: process.env.PREDICTION_MARKET_CONTRACT_ADDRESS
    });
  }

  public getERC20Contract() {
    this.erc20 = this.bepro.getERC20Contract({
      contractAddress: process.env.ERC20_CONTRACT_ADDRESS
    });
  }

  public getRealitioERC20Contract() {
    this.realitio = this.bepro.getRealitioERC20Contract({
      contractAddress: process.env.REALITIO_ERC20_CONTRACT_ADDRESS
    });
  }
}
