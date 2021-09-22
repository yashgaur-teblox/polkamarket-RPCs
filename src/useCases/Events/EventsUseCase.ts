import { ContractProvider } from '@providers/ContractProvider';
import { EventsDTO } from './EventsDTO';

export class EventsUseCase {
  constructor(private contractProvider: ContractProvider) {}

  async execute({ contract, eventName, filter }: EventsDTO) {
    const events = await this.contractProvider[contract]
      .getContract()
      .getPastEvents(eventName, {
        fromBlock: 0,
        toBlock: 'latest',
        filter: filter
      });

    return events;
  }
}
