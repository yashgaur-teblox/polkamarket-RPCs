import { PolkamarketsContractProvider } from '@providers/implementations/PolkamarketsContractProvider';
import { CallController } from './CallController';
import { CallUseCase } from './CallUseCase';
import { callSchema } from './CallSchema';

const polkamarketsContractProvider = new PolkamarketsContractProvider();

const callUseCase = new CallUseCase(polkamarketsContractProvider);
const callController = new CallController(callUseCase);

export { callUseCase, callController, callSchema };
