import { ShoppingAddr } from './shopping-addr.interface'

export interface PriceInfo {
  itemsPrice: number;
  shippingPrice: number;
  totalBeforeTax: number,
  tax: number;
  totalPrice: number,
  ready: boolean,
}
