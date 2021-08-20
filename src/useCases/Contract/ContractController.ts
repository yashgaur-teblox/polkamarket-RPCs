import { Request, Response } from 'express';
import { ContractCallDTO } from './ContractDTO';

import { ContractUseCase } from './ContractUseCase';

export class ContractController {
  constructor(private contractUseCase: ContractUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, method, args } = request.query;

    try {
      const data = await this.contractUseCase.execute({
        contract,
        method,
        args: args || []
      } as ContractCallDTO);

      return response.status(200).send(data);
    } catch (error) {
      return response.status(500).json({
        message: error.message || 'Unexpected contract call error.'
      });
    }
  }
}
