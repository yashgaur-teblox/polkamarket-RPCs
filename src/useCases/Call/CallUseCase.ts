import { ContractProvider } from '@providers/ContractProvider';
import { CallDTO } from './CallDTO';

export class CallUseCase {
  constructor(private contractProvider: ContractProvider) {}

  async execute(data: CallDTO) {
    const contract = this.contractProvider[data.contract].getContract();

    return contract.methods[data.method](...data.args).call();
  }
}
