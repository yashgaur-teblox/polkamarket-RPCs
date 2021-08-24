import { Router } from 'express';
import { contractController, contractSchema } from '@useCases/Contract';
import { validateObjectSchema } from '@middlewares/Yup';

const router = Router();

router.get(
  '/call',
  validateObjectSchema(contractSchema),
  (request, response) => {
    return contractController.handle(request, response);
  }
);

export { router };
