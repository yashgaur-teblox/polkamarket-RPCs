import { Request, Response } from 'express';
import { CallDTO } from './CallDTO';

import { CallUseCase } from './CallUseCase';

export class CallController {
  constructor(private callUseCase: CallUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, method, args, address } = request.query;

    try {
      const data = await this.callUseCase.execute({
        contract,
        method,
        address,
        args: args ? (args as string).split(',') : []
      } as CallDTO);

      if (typeof data === 'boolean') {
        return response.status(200).send(data);
      }

      return response.status(200).send(Object.values(data));
    } catch (error) {
      return response.status(500).json({
        message: error.message || 'Unexpected contract call error.'
      });
    }
  }
}
