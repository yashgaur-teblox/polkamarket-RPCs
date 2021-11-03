import { ContractProvider } from '@providers/ContractProvider';
import { EventsDTO } from './EventsDTO';

export class EventsUseCase {
  constructor(private contractProvider: ContractProvider) {}

  async execute({ contract, eventName, filter, address }: EventsDTO) {
    const events = await this.contractProvider.getContractEvents(contract, address, eventName, filter);

    return events;
  }
}
