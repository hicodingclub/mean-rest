export interface OrderInfo {
  items: string;
  itemsTotal: number;
  shipping: string;
  price: string;
  priceTotal: number;
  orderType?: string;
  contact?: string;
  notes?: string;
}
