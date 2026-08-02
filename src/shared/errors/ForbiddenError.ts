import { AppError } from './AppError';

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', errorDetails: Record<string, unknown> = {}) {
    super(message, 403, 'FORBIDDEN', errorDetails);
  }
}
