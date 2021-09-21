import { BeproContractProvider } from '@providers/implementations/BeproContractProvider';
import { EventsController } from './EventsController';
import { EventsUseCase } from './EventsUseCase';
import { eventsSchema } from './EventsSchema';

const beproContractProvider = new BeproContractProvider();

const eventsUseCase = new EventsUseCase(beproContractProvider);
const eventsController = new EventsController(eventsUseCase);

export { eventsUseCase, eventsController, eventsSchema };
