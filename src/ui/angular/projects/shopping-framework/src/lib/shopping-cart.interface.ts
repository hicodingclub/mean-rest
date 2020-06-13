export interface ShoppingItem {
  picture: string; // url
  name: string;
  description: string;
  quantity: number;
  price: number;
  stockNumber: number;
  url: string;
  pageUrl: string;
}

export interface ShoppingItems {
  items: ShoppingItem[];
  price: number;
  ready: boolean;
}
