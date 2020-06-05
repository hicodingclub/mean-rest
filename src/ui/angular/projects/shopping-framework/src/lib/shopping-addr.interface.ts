export interface ShoppingAddr {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface ShippingAddrIntf {
  getShippingAddress(): ShoppingAddr | undefined;
}
