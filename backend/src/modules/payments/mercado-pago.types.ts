import { PaymentMethod } from '@prisma/client';

export type MercadoPagoPreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

export type MercadoPagoPreferenceInput = {
  orderId: string;
  orderNumber: string;
  payerEmail: string;
  items: MercadoPagoPreferenceItem[];
  expiresAt: Date;
};

export type MercadoPagoPreferenceResult = {
  preferenceId: string;
  checkoutUrl: string;
};

export type MercadoPagoPaymentStatus = string;

export type MercadoPagoPaymentDetails = {
  id: string;
  status: MercadoPagoPaymentStatus;
  statusDetail?: string;
  externalReference?: string;
  transactionAmount?: number;
  paymentMethod?: PaymentMethod;
  raw: Record<string, unknown>;
};

export type MercadoPagoRefundResult = {
  id: string;
  status: string;
  amount: number;
  raw: Record<string, unknown>;
};

export interface MercadoPagoProvider {
  createPreference(input: MercadoPagoPreferenceInput): Promise<MercadoPagoPreferenceResult>;
  getPayment(providerReference: string): Promise<MercadoPagoPaymentDetails>;
  cancelPayment(providerReference: string): Promise<MercadoPagoPaymentDetails>;
  refundPayment(input: {
    providerReference: string;
    amount?: number;
    idempotencyKey: string;
  }): Promise<MercadoPagoRefundResult>;
}
