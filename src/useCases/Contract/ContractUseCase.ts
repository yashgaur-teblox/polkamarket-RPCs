import { ContractProvider } from 'providers/ContractProvider';
import { ContractCallDTO } from './ContractDTO';

export class ContractUseCase {
  constructor(private contractProvider: ContractProvider) {}

  async execute(data: ContractCallDTO) {
    return this.contractProvider[data.contract][data.method](data.args);
  }
}
