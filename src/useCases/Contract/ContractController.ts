import { Request, Response } from 'express';

import { ContractUseCase } from './ContractUseCase';

export class ContractController {
  constructor(private contractUseCase: ContractUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, method, args } = request.body;

    try {
      await this.contractUseCase.execute({
        contract,
        method,
        args
      });

      return response.status(200).send();
    } catch (error) {
      return response.status(500).json({
        message: error.message || 'Unexpected contract call error.'
      });
    }
  }
}
