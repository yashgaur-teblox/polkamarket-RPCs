import { ContractProvider } from '@providers/ContractProvider';
import { EventsDTO } from './EventsDTO';

export class EventsUseCase {
  constructor(private contractProvider: ContractProvider) {}

  async execute(data: EventsDTO) {
    const contract = this.contractProvider[data.contract].getContract();

    return contract.methods[data.method](...data.args).call();
  }
}
