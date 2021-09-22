import { Request, Response } from 'express';
import { EventsDTO } from './EventsDTO';

import { EventsUseCase } from './EventsUseCase';

export class EventsController {
  constructor(private eventsUseCase: EventsUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, eventName, filter } = request.query;

    try {
      const data = await this.eventsUseCase.execute({
        contract,
        eventName,
        filter: filter ? JSON.parse(filter as string) : {}
      } as EventsDTO);

      if (typeof data === 'boolean') {
        return response.status(200).send(data);
      }

      return response.status(200).send(Object.values(data));
    } catch (error) {
      return response.status(500).json({
        message: error.message || 'Unexpected contract call error.'
      });
    }
  }
}
