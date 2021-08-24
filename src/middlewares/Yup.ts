import { Request, Response, NextFunction } from 'express';

export const validateObjectSchema =
  schema =>
  async (request: Request, response: Response, next: NextFunction) => {
    const object = request.query;
    try {
      await schema.validate(object);
      next();
    } catch (e) {
      response.status(400).json({ error: e.errors.join(', ') });
    }
  };
