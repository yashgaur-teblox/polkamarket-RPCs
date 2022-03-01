import { Request, Response } from 'express';
import { CallDTO } from './CallDTO';

import { CallUseCase } from './CallUseCase';

export class CallController {
  constructor(private callUseCase: CallUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, method, args, address } = request.query;

    for(let providerIndex = 0; providerIndex < this.callUseCase.contractProvider.web3Providers.length; providerIndex++) {
      try {
        let data = await this.callUseCase.execute({
          contract,
          method,
          address,
          providerIndex,
          args: args ? (args as string).split(',') : []
        } as CallDTO);

        if (typeof data === 'boolean' || typeof data === 'string') {
          return response.status(200).send([data]);
        }

        return response.status(200).send(Object.values(data));
      } catch (error) {
        // No providers left, raising last error
        if (providerIndex === this.callUseCase.contractProvider.web3Providers.length - 1) {
          return response.status(500).json({
            message: error.message || 'Unexpected contract call error.'
          });
        }
      }
    }
  }
}
