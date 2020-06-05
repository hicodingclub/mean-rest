import { ShoppingAddr } from './shopping-addr.interface'

export interface PriceInfo {
  itemsPrice: number;
  shippingPrice: number;
  tax: number;
}

export interface ShoppingPriceIntf {
  isReady(): boolean;
  getPriceInfo(): PriceInfo;
  setTaxDestination(addr: ShoppingAddr ): void;
}
