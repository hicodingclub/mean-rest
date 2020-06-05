export interface PaymentInfo {
  id: string;
  info: string;
}

export interface ShoppingPaymentIntf {
  isReady(): boolean;
  getPaymentInfo(): PaymentInfo;
  setPaymentTotal(total: number): void;
}

