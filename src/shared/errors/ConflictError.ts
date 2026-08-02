import { AppError } from './AppError';

export class ConflictError extends AppError {
  constructor(message = 'Conflict', errorDetails: Record<string, unknown> = {}) {
    super(message, 409, 'CONFLICT', errorDetails);
  }
}
