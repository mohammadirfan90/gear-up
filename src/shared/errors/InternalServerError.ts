import { AppError } from './AppError';

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', errorDetails: Record<string, unknown> = {}) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', errorDetails, false);
  }
}
