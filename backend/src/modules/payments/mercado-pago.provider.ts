import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MercadoPagoConfig,
  Payment,
  PaymentRefund,
  Preference,
  WebhookSignatureValidator,
} from 'mercadopago';
import { PaymentMethod } from '@prisma/client';
import {
  MercadoPagoPaymentDetails,
  MercadoPagoPreferenceInput,
  MercadoPagoPreferenceResult,
  MercadoPagoProvider,
  MercadoPagoRefundResult,
} from './mercado-pago.types';

@Injectable()
export class MercadoPagoCheckoutProvider implements MercadoPagoProvider {
  private client: MercadoPagoConfig | null = null;

  constructor(private readonly configService: ConfigService) {}

  async createPreference(input: MercadoPagoPreferenceInput): Promise<MercadoPagoPreferenceResult> {
    const preference = new Preference(this.getClient());
    const webhookUrl = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_URL');
    const returnUrl =
      this.configService.get<string>('MOBILE_PAYMENT_RETURN_URL') ??
      'barbeariadoartur://payments/result';

    const response = await preference.create({
      body: {
        external_reference: input.orderId,
        expires: true,
        date_of_expiration: input.expiresAt.toISOString(),
        notification_url: webhookUrl,
        back_urls: {
          success: `${returnUrl}?orderId=${input.orderId}&status=success`,
          failure: `${returnUrl}?orderId=${input.orderId}&status=failure`,
          pending: `${returnUrl}?orderId=${input.orderId}&status=pending`,
        },
        auto_return: 'approved',
        statement_descriptor: 'BARBEARIA ARTUR',
        payer: {
          email: input.payerEmail,
        },
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
        },
        items: input.items.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency_id: 'BRL',
        })),
      },
      requestOptions: {
        idempotencyKey: `preference-${input.orderId}`,
      },
    });

    const checkoutUrl = response.init_point ?? response.sandbox_init_point;
    if (!response.id || !checkoutUrl) {
      throw new InternalServerErrorException('Mercado Pago não retornou URL de checkout.');
    }

    return {
      preferenceId: response.id,
      checkoutUrl,
    };
  }

  async getPayment(providerReference: string): Promise<MercadoPagoPaymentDetails> {
    const payment = new Payment(this.getClient());
    const response = await payment.get({ id: providerReference });
    return this.normalizePaymentResponse(response as unknown as Record<string, unknown>);
  }

  async cancelPayment(providerReference: string): Promise<MercadoPagoPaymentDetails> {
    const payment = new Payment(this.getClient());
    const response = await payment.cancel({
      id: providerReference,
      requestOptions: { idempotencyKey: `cancel-${providerReference}` },
    });
    return this.normalizePaymentResponse(response as unknown as Record<string, unknown>);
  }

  async refundPayment(input: {
    providerReference: string;
    amount?: number;
    idempotencyKey: string;
  }): Promise<MercadoPagoRefundResult> {
    const refunds = new PaymentRefund(this.getClient());
    const response =
      input.amount == null
        ? await refunds.total({
            payment_id: input.providerReference,
            requestOptions: { idempotencyKey: input.idempotencyKey },
          })
        : await refunds.create({
            payment_id: input.providerReference,
            body: { amount: input.amount },
            requestOptions: { idempotencyKey: input.idempotencyKey },
          });
    const raw = response as unknown as Record<string, unknown>;

    return {
      id: this.toSafeString(raw.id),
      status: this.toSafeString(raw.status, 'in_process'),
      amount: this.toNumber(raw.amount ?? input.amount ?? 0),
      raw,
    };
  }

  validateWebhookSignature(input: {
    xSignature: string | string[] | undefined;
    xRequestId: string | string[] | undefined;
    dataId: string | string[] | undefined;
  }): void {
    const secret = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('Webhook secret Mercado Pago não configurado.');
    }

    WebhookSignatureValidator.validate({
      ...input,
      secret,
      toleranceSeconds: 300,
    });
  }

  private getClient(): MercadoPagoConfig {
    if (this.client) {
      return this.client;
    }

    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new InternalServerErrorException('Access token Mercado Pago não configurado.');
    }

    this.client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10000 },
    });
    return this.client;
  }

  private normalizePaymentResponse(raw: Record<string, unknown>): MercadoPagoPaymentDetails {
    const paymentMethod = raw.payment_method_id?.toString() ?? '';
    return {
      id: this.toSafeString(raw.id),
      status: this.toSafeString(raw.status, 'pending'),
      statusDetail:
        raw.status_detail == null ? undefined : this.toSafeString(raw.status_detail),
      externalReference:
        raw.external_reference == null ? undefined : this.toSafeString(raw.external_reference),
      transactionAmount: this.toNumber(raw.transaction_amount),
      paymentMethod: this.normalizePaymentMethod(paymentMethod),
      raw,
    };
  }

  private normalizePaymentMethod(value: string): PaymentMethod | undefined {
    if (value === 'pix') {
      return PaymentMethod.PIX;
    }

    if (value.includes('debit')) {
      return PaymentMethod.DEBIT_CARD;
    }

    if (value) {
      return PaymentMethod.CREDIT_CARD;
    }

    return undefined;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    return Number(value ?? 0);
  }

  private toSafeString(value: unknown, fallback = ''): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value);
    }
    return fallback;
  }
}
