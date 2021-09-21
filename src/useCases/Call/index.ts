import { BeproContractProvider } from '@providers/implementations/BeproContractProvider';
import { CallController } from './CallController';
import { CallUseCase } from './CallUseCase';
import { callSchema } from './CallSchema';

const beproContractProvider = new BeproContractProvider();

const callUseCase = new CallUseCase(beproContractProvider);
const callController = new CallController(callUseCase);

export { callUseCase, callController, callSchema };
