import { ContractProvider } from '@providers/ContractProvider';
import { ContractCallDTO } from './ContractDTO';

export class ContractUseCase {
  constructor(private contractProvider: ContractProvider) {}

  async execute(data: ContractCallDTO) {
    const contract = this.contractProvider[data.contract].getContract();

    return contract.methods[data.method](...data.args).call();
  }
}
