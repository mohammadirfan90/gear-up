import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PaymentService } from './payment.service';
import { stripeProvider } from './providers/stripe.provider';
import { ok, created } from '@/shared/utils/api-response';
import { UnauthorizedError } from '@/shared/errors';
import {
  CreatePaymentInput,
  ListPaymentsInput,
} from './payment.validator';

export class PaymentController {
  private readonly service: PaymentService;

  constructor(prisma: PrismaClient) {
    this.service = new PaymentService(prisma);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const input = req.body as CreatePaymentInput;
    const result = await this.service.createPayment(userId, input);
    created(res, 'Payment intent created', result);
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const params = req.query as unknown as ListPaymentsInput;
    const result = await this.service.listForUser(userId, params);
    ok(res, 'Payments retrieved', result);
  };

  listAdmin = async (req: Request, res: Response): Promise<void> => {
    const params = req.query as unknown as ListPaymentsInput;
    const result = await this.service.listAdmin(params);
    ok(res, 'All payments retrieved', result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const user = req.user!;
    const payment = await this.service.getById(id, user.id, user.role);
    ok(res, 'Payment retrieved', { payment });
  };

  /**
   * POST /api/payments/webhook
   * Uses raw body — must be mounted BEFORE express.json() in app.ts.
   */
  webhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'];
    if (!signature || Array.isArray(signature)) {
      throw new UnauthorizedError('Missing Stripe signature');
    }

    const event = stripeProvider.constructWebhookEvent(
      (req as Request & { rawBody?: Buffer }).rawBody ?? req.body,
      signature
    );

    const result = await this.service.handleWebhook(event as unknown as Parameters<PaymentService['handleWebhook']>[0]);
    res.status(200).json({ received: true, ...result });
  };
}