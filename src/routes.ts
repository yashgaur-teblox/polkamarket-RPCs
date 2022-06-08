import { Router } from 'express';
import { callController, callSchema } from '@useCases/Call';
import { eventsController, eventsSchema } from '@useCases/Events';
import { validateObjectSchema } from '@middlewares/Yup';

const router = Router();

router.get('/call', validateObjectSchema(callSchema), (request, response) => {
  return callController.handle(request, response);
});

router.get(
  '/events',
  validateObjectSchema(eventsSchema),
  (request, response) => {
    return eventsController.handle(request, response);
  }
);

router.post(
  '/events',
  validateObjectSchema(eventsSchema),
  (request, response) => {
    return eventsController.handleWorker(request, response);
  }
);

export { router };
