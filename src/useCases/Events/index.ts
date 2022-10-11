import { PolkamarketsContractProvider } from '@providers/implementations/PolkamarketsContractProvider';
import { EventsController } from './EventsController';
import { EventsUseCase } from './EventsUseCase';
import { eventsSchema } from './EventsSchema';

const polkamarketsContractProvider = new PolkamarketsContractProvider();

const eventsUseCase = new EventsUseCase(polkamarketsContractProvider);
const eventsController = new EventsController(eventsUseCase);

export { eventsUseCase, eventsController, eventsSchema };
