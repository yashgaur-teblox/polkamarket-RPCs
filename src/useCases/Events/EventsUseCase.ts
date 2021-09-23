import { ContractProvider } from '@providers/ContractProvider';
import { EventsDTO } from './EventsDTO';

export class EventsUseCase {
  constructor(private contractProvider: ContractProvider) {}

  async execute({ contract, eventName, filter, address }: EventsDTO) {
    const beproContract = this.contractProvider.getContract(contract, address);

    const events = await beproContract.getEvents(eventName, filter);

    return events;
  }
}
