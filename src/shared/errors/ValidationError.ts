import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errorDetails: Record<string, unknown> = {}) {
    super(message, 400, 'VALIDATION_ERROR', errorDetails);
  }
}
