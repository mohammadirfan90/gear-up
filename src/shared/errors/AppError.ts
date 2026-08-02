export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly errorDetails: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    errorDetails: Record<string, unknown> = {},
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.errorDetails = errorDetails;

    Error.captureStackTrace(this, this.constructor);
  }
}
