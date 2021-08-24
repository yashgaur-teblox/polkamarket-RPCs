import { BeproContractProvider } from '@providers/implementations/BeproContractProvider';
import { ContractController } from './ContractController';
import { ContractUseCase } from './ContractUseCase';
import { contractSchema } from './ContractSchema';

const beproContractProvider = new BeproContractProvider();

const contractUseCase = new ContractUseCase(beproContractProvider);
const contractController = new ContractController(contractUseCase);

export { contractUseCase, contractController, contractSchema };
