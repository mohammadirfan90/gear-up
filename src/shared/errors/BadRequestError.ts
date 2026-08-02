import { AppError } from './AppError';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errorDetails: Record<string, unknown> = {}) {
    super(message, 400, 'BAD_REQUEST', errorDetails);
  }
}
