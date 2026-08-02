import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', errorDetails: Record<string, unknown> = {}) {
    super(message, 401, 'UNAUTHORIZED', errorDetails);
  }
}
