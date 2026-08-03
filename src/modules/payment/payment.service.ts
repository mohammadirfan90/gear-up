import { PrismaClient } from '@prisma/client';
import { ForbiddenError, NotFoundError, ConflictError } from '@/shared/errors';
import { buildPagination, buildPaginationMeta } from '@/shared/utils/pagination';
import { PaymentRepository } from './payment.repository';
import { stripeProvider } from './providers/stripe.provider';
import {
  CreatePaymentInput,
  ListPaymentsInput,
} from './payment.validator';
import { OrderStatus } from '@/modules/rental/rental.types';
import { RentalRepository } from '@/modules/rental/rental.repository';
import { PaymentProvider } from './payment.types';

export class PaymentService {
  private readonly repository: PaymentRepository;
  private readonly rentalRepository: RentalRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new PaymentRepository(prisma);
    this.rentalRepository = new RentalRepository(prisma);
  }

  /**
   * POST /api/payments/create
   * Idempotent: if a pending payment already exists for the order, return it.
   */
  async createPayment(userId: string, input: CreatePaymentInput) {
    const order = await this.rentalRepository.findById(input.rentalOrderId);
    if (!order) {
      throw new NotFoundError('Rental order not found', { resource: 'rental', id: input.rentalOrderId });
    }

    if (order.customerId !== userId) {
      throw new ForbiddenError('You can only pay for your own orders');
    }

    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.CONFIRMED) {
      throw new ConflictError(
        `Order cannot be paid in status "${order.status}"`,
        { status: 'Order must be placed or confirmed' }
      );
    }

    // Idempotency: existing pending payment?
    const existing = await this.repository.findPendingByOrderId(order.id);
    if (existing) {
      return this.buildPaymentResult(existing, order.id);
    }

    // Server-side amount recomputation
    const amountCents = Math.round(Number(order.totalAmount) * 100);
    if (amountCents <= 0) {
      throw new ConflictError('Order total must be positive', { amount: 'Invalid total' });
    }

    // Create Stripe PaymentIntent
    const intent = await stripeProvider.createPaymentIntent({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        rentalOrderId: order.id,
        customerId: userId,
      },
      idempotencyKey: `rental_${order.id}`,
    });

    // Persist pending payment
    const payment = await this.repository.create({
      rentalOrder: { connect: { id: order.id } },
      user: { connect: { id: userId } },
      transactionId: intent.id,
      amount: Number(order.totalAmount),
      currency: 'usd',
      provider: PaymentProvider.STRIPE,
      status: 'pending',
    });

    return this.buildPaymentResult(payment, intent.clientSecret);
  }

  /**
   * POST /api/payments/webhook (Stripe → us)
   * Idempotent per event.id.
   */
  async handleWebhook(event: { id: string; type: string; data: { object: { id: string; metadata?: Record<string, string>; last_payment_error?: { message?: string } } } }) {
    const existing = await this.prisma.payment.findUnique({
      where: { transactionId: event.data.object.id },
    });

    if (!existing) return { skipped: true, reason: 'payment not found' };

    // Already in terminal state — skip
    if (existing.status === 'completed' || existing.status === 'failed' || existing.status === 'refunded') {
      return { skipped: true, reason: `already ${existing.status}` };
    }

    if (event.type === 'payment_intent.succeeded') {
      await this.markPaymentCompleted(existing.id, event.data.object.id);
    } else if (event.type === 'payment_intent.payment_failed') {
      await this.repository.updateStatus(existing.id, {
        status: 'failed',
        failureReason: event.data.object.last_payment_error?.message ?? 'Payment failed',
      });
    }

    return { processed: true };
  }

  private async markPaymentCompleted(paymentId: string, transactionId: string) {
    await this.prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          paidAt: new Date(),
        },
      });

      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) return;

      // Move rental order to PAID
      await tx.rentalOrder.update({
        where: { id: payment.rentalOrderId },
        data: { status: OrderStatus.PAID },
      });

      await tx.rentalStatusHistory.create({
        data: {
          rentalOrderId: payment.rentalOrderId,
          fromStatus: OrderStatus.CONFIRMED,
          toStatus: OrderStatus.PAID,
          changedById: payment.userId,
          reason: `Payment ${transactionId} succeeded`,
        },
      });
    });
  }

  async listForUser(userId: string, params: ListPaymentsInput) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total] = await Promise.all([
      this.repository.findManyForUser(userId, { skip, take, status: params.status }),
      this.repository.countForUser(userId, params.status),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async listAdmin(params: ListPaymentsInput) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total] = await Promise.all([
      this.repository.findManyAdmin({ skip, take, status: params.status }),
      this.repository.countAdmin(params.status),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string, userId: string, userRole: string) {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new NotFoundError('Payment not found', { resource: 'payment', id });
    }

    if (userRole !== 'admin' && payment.userId !== userId) {
      throw new ForbiddenError('You cannot view this payment');
    }
    return payment;
  }

  private async buildPaymentResult(payment: { id: string; transactionId: string; amount: unknown; status: string }, clientSecret: string) {
    return {
      paymentId: payment.id,
      transactionId: payment.transactionId,
      amount: Number(payment.amount),
      status: payment.status,
      clientSecret,
    };
  }
}