export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentProvider = {
  STRIPE: 'stripe',
  SSLCOMMERZ: 'sslcommerz',
} as const;

export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];