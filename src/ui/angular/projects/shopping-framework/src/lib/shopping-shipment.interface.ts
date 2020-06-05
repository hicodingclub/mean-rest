import { ShoppingAddr } from './shopping-addr.interface'

export interface ShippingInfo {
  method: string;
  price: number;
  address?: string;
}

export interface ShoppingShipmentIntf {
  isReady(): boolean;
  getShippingInfo(): ShippingInfo;
  getShippingPrice(): number;
  getShippingAddress(): ShoppingAddr | undefined;
}
