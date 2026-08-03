/**
 * Stripe Provider — adapter around the Stripe SDK.
 * The service layer never touches Stripe directly; it uses this module.
 */

import Stripe from 'stripe';
import { env } from '@/shared/config/env';

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
};

export interface CreatePaymentIntentInput {
  amount: number; // cents
  currency: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  status: string;
}

export const stripeProvider = {
  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create(
      {
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: input.idempotencyKey }
    );

    if (!intent.client_secret) {
      throw new Error('Stripe did not return a client secret');
    }

    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
    };
  },

  async retrievePaymentIntent(id: string): Promise<PaymentIntentResult> {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(id);
    if (!intent.client_secret) {
      throw new Error('PaymentIntent missing client_secret');
    }
    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
    };
  },

  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const stripe = getStripe();
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  },
};