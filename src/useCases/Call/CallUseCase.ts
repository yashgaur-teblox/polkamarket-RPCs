import { ContractProvider } from '@providers/ContractProvider';
import { CallDTO } from './CallDTO';

export class CallUseCase {
  constructor(public contractProvider: ContractProvider) {}

  async execute(data: CallDTO) {
    const contract = this.contractProvider.getContract(data.contract, data.address, data.providerIndex);

    return contract.getContract().methods[data.method](...data.args).call();
  }
}
