import { Router } from 'express';
import { contractController } from './useCases/Contract';

const router = Router();

router.get('/call', (request, response) => {
  return contractController.handle(request, response);
});

export { router };
