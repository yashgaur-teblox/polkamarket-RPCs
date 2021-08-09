import { BeproContractProvider } from '../../providers/implementations/BeproContractProvider';
import { ContractController } from './ContractController';
import { ContractUseCase } from './ContractUseCase';

const beproContractProvider = new BeproContractProvider();

const contractUseCase = new ContractUseCase(beproContractProvider);
const contractController = new ContractController(contractUseCase);

export { contractUseCase, contractController };
