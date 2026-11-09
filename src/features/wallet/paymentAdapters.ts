import { PaymentGatewayAdapter, PaymentGatewayProvider } from '../../types/finance';

/**
 * 1. JazzCash Mobile Gateway Adapter (Pakistan)
 */
export const JazzCashAdapter: PaymentGatewayAdapter = {
  provider: 'jazzcash',
  displayName: 'JazzCash Mobile Account',
  icon: '📱',
  async initiateDeposit(amount, currency, userId) {
    const txId = `jc_tx_${Date.now()}`;
    return {
      txId,
      instructions: `Please approve the MPIN prompt sent to your JazzCash mobile number for ${currency} ${amount}.`,
      paymentUrl: `https://sandbox.jazzcash.com.pk/pay?tx=${txId}&uid=${userId}`,
    };
  },
  async verifyWebhook(payload, signature) {
    return Boolean(payload && signature);
  },
};

/**
 * 2. Easypaisa Mobile Gateway Adapter (Pakistan)
 */
export const EasypaisaAdapter: PaymentGatewayAdapter = {
  provider: 'easypaisa',
  displayName: 'Easypaisa Wallet',
  icon: '💳',
  async initiateDeposit(amount, currency, userId) {
    const txId = `ep_tx_${Date.now()}`;
    return {
      txId,
      instructions: `Approve the in-app Easypaisa payment notification for ${currency} ${amount}.`,
      paymentUrl: `https://easypay.easypaisa.com.pk/pay?order=${txId}&uid=${userId}`,
    };
  },
  async verifyWebhook(payload, signature) {
    return Boolean(payload && signature);
  },
};

/**
 * 3. Local Bank Transfer & Raast Instant Adapter (Pakistan / Global)
 */
export const BankTransferAdapter: PaymentGatewayAdapter = {
  provider: 'bank_transfer',
  displayName: 'Bank Transfer / Raast Instant',
  icon: '🏦',
  async initiateDeposit(amount, currency, userId) {
    const txId = `bank_ref_${Date.now()}`;
    return {
      txId,
      instructions: `Transfer ${currency} ${amount} to TaskIt Escrow IBAN: PK92MEZN00012345678901 with reference ${txId}.`,
    };
  },
  async verifyWebhook(payload, signature) {
    return Boolean(payload && signature);
  },
};

/**
 * 4. Stripe Global Gateway Adapter (Cards & Apple/Google Pay)
 */
export const StripeAdapter: PaymentGatewayAdapter = {
  provider: 'stripe',
  displayName: 'Stripe (Credit / Debit Cards)',
  icon: '🌐',
  async initiateDeposit(amount, currency, userId) {
    const txId = `ch_stripe_${Date.now()}`;
    return {
      txId,
      paymentUrl: `https://checkout.stripe.com/pay/${txId}`,
      instructions: `Redirecting to secure Stripe Card checkout for ${currency} ${amount}.`,
    };
  },
  async verifyWebhook(payload, signature) {
    return Boolean(payload && signature);
  },
};

export const PAYMENT_ADAPTERS: Record<PaymentGatewayProvider, PaymentGatewayAdapter> = {
  jazzcash: JazzCashAdapter,
  easypaisa: EasypaisaAdapter,
  bank_transfer: BankTransferAdapter,
  stripe: StripeAdapter,
};

export function getPaymentAdapter(provider: PaymentGatewayProvider): PaymentGatewayAdapter {
  const adapter = PAYMENT_ADAPTERS[provider];
  if (!adapter) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
  return adapter;
}
