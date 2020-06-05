export interface ShowItem {
  picture: string; // url
  name: string;
  description: string;
  quantity: number;
  price: number;
  stockNumber: number;
  url: string;
  pageUrl: string;
}

export interface ShoppingCartIntf {
  getShowItems(): ShowItem[];
  getTotalPrice(): number;
}
