import { Router } from 'express';
import { callController, callSchema } from '@useCases/Call';
import { validateObjectSchema } from '@middlewares/Yup';

const router = Router();

router.get('/call', validateObjectSchema(callSchema), (request, response) => {
  return callController.handle(request, response);
});

export { router };
