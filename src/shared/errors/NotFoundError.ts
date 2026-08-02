import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorDetails: Record<string, unknown> = {}) {
    super(message, 404, 'NOT_FOUND', errorDetails);
  }
}
