import { Request, Response, NextFunction } from 'express';
import type { ParsedQs } from 'qs';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/shared/errors';

export type ValidateSchema =
  | ZodSchema
  | {
      body?: ZodSchema;
      params?: ZodSchema;
      query?: ZodSchema;
    };

const formatZodError = (err: ZodError): Record<string, string> => {
  const details: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join('.') || '_form';
    if (!details[path]) details[path] = issue.message;
  }
  return details;
};

const normalizeSchema = (schema: ValidateSchema): ZodSchema => {
  if (
    schema &&
    typeof schema === 'object' &&
    !('_def' in schema) &&
    ('body' in schema || 'params' in schema || 'query' in schema)
  ) {
    const shape: Record<string, ZodSchema> = {};
    const wrapper = schema as {
      body?: ZodSchema;
      params?: ZodSchema;
      query?: ZodSchema;
    };
    if (wrapper.body) shape.body = wrapper.body;
    if (wrapper.params) shape.params = wrapper.params;
    if (wrapper.query) shape.query = wrapper.query;

    if (Object.keys(shape).length === 0) {
      return z.object({
        body: z.unknown(),
        params: z.unknown(),
        query: z.unknown(),
      });
    }

    return z.object(shape);
  }

  return schema as ZodSchema;
};

export const validate = (schema: ValidateSchema) => {
  const composed = normalizeSchema(schema);

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = composed.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      }) as {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.params !== undefined) {
        req.params = parsed.params as Record<string, string>;
      }
      if (parsed.query !== undefined) {
        req.query = parsed.query as ParsedQs;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError('Validation failed', formatZodError(err)));
      } else {
        next(err);
      }
    }
  };
};
