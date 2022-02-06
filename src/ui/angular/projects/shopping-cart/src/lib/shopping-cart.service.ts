import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from 'rxjs';

import { ShoppingItem, ShoppingItems } from '@hicoder/angular-shopping-framework';

// The field name to parse the item information from response of item URL
export interface ItemMeta {
  name: string;
  price: string;
  picture?: string;
  description?: string;
  stockNumber?: string;
  skuID?: string;
}

export interface Item {
  url: string; // used to get item from backend end during checkout.
  meta: ItemMeta; // used to parse the information returned from url.
  quantity: number;

  // Following are the initial information when user adding stock to cart
  name: string;
  price: number;
  description?: string;
  pageUrl: string; //link to show the item on UI

  type: string,
}

// Interface to show items when user see cart details
export interface ShowCart {
  totalPrice: number;
  totalQuantity: number;
  showItems: ShoppingItem[];
  errorItems: ShoppingItem[];
}

export const DEFAULTSTOCKNUMBER = 10000;
const SHOPPINGCARTKEY = "mdds-shopping-cart";

@Injectable({
  providedIn: "root",
})
export class ShoppingCartService {
  private items: Item[] = []; // items added to cart
  private showItems: ShoppingItem[]; // items to show in cart
  private totalPrice: number; // total price of showItems
  private totalQuantity: number; // total quantity of showItems
  private itemNumberPublisher: Subject<number> = new Subject<number>();

  constructor(private http: HttpClient) {
    this.items = JSON.parse(localStorage.getItem(SHOPPINGCARTKEY) || "[]");
  }

  private store() {
    localStorage.setItem(SHOPPINGCARTKEY, JSON.stringify(this.items));
    this.itemNumberPublisher.next(this.getTotalItemNumber());
  }
  private clear() {
    localStorage.removeItem(SHOPPINGCARTKEY);
    this.itemNumberPublisher.next(this.getTotalItemNumber());
  }

  private findItem(itemUrl: string): number {
    for (let i = 0; i < this.items.length; i += 1) {
      if (this.items[i].url === itemUrl) {
        return i;
      }
    }
    return -1;
  }
  public getItemQuantity(itemUrl: string): number {
    for (let i = 0; i < this.items.length; i += 1) {
      if (this.items[i].url === itemUrl) {
        return this.items[i].quantity;
      }
    }
    return 0;
  }
  public getTotalItemNumber(): number {
    let cnt = 0;
    for (let i = 0; i < this.items.length; i += 1) {
      cnt += this.items[i].quantity;
    }
    return cnt;
  }
  public getItemNumberPublisher(): Subject<number> {
    return this.itemNumberPublisher;
  }

  public addItem(item: Item) {
    const idx = this.findItem(item.url);
    if (idx === -1) {
      // item not found
      this.items.push(item);
    } else {
      item.quantity += this.items[idx].quantity;
      this.items[idx] = item;
    }
    this.store();
  }
  public removeItem(itemUrl: string) {
    const idx = this.findItem(itemUrl);
    if (idx === -1) {
      // item not found
      return;
    }
    this.items.splice(idx, 1);
    this.store();
  }
  public setItemQuantity(itemUrl: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(itemUrl);
      return;
    }
    const idx = this.findItem(itemUrl);
    if (idx === -1) {
      // item not found. Cart and UI Page out of sync. Hope it can be synced by notification.
      return;
    }
    this.items[idx].quantity = quantity;
    this.store();
  }
  public getCartItems(): Observable<ShowCart> {
    return new Observable(subscriber => {
      this.showItems = [];
      this.totalPrice = 0;
      this.totalQuantity = 0;
      const items: Item[] = [];
    
      const promises: Promise<any>[] = [];
      for (const item of this.items) {
        const promise = this.http.get(item.url).toPromise();
        promises.push(promise);
      }
      try {
        // for each promiss, catch errors for individule promiss and return it as result
        const results = Promise.all(promises.map((p) => p.catch((e) => e))).then( results => {
          const showItems: ShoppingItem[] = [];
          const errorItems: ShoppingItem[] = [];
          let totalPrice = 0;
          let totalQuantity = 0;
          let showItem: ShoppingItem;
          let item: Item;
          for (let i = 0; i < this.items.length; i += 1) {
            const result: any = results[i];
            let subPrice = 0;
            let subQuantity = 0
            if (result instanceof Error) {
              showItem = {
                picture: '',
                name: this.items[i].name,
                description: this.items[i].description,
                quantity: this.items[i].quantity,
                price: this.items[i].price,
                stockNumber: 0,
                url: this.items[i].url,
                pageUrl: this.items[i].pageUrl,
                skuID: this.items[i].pageUrl.split('/').slice(-1)[0],

                type: this.items[i].type,
              };
              errorItems.push(showItem);
            } else {
              const meta: ItemMeta = this.items[i].meta;
              const stockNumber: number = meta.stockNumber? result[meta.stockNumber] : DEFAULTSTOCKNUMBER, // stock number not given. Use a very large number
              showItem = {
                picture: meta.picture ? result[meta.picture] : '',
                name: result[meta.name],
                description: meta.description? result[meta.description] : '',
                quantity: this.items[i].quantity < stockNumber? this.items[i].quantity : stockNumber,
                price: result[meta.price],
                stockNumber: stockNumber,
                url: this.items[i].url,
                pageUrl: this.items[i].pageUrl,
                skuID: meta.skuID? result[meta.skuID] : this.items[i].pageUrl.split('/').slice(-1)[0],

                type: this.items[i].type,
              };
              item = this.items[i];
              item.quantity = showItem.quantity
              items.push(item);

              showItems.push(showItem);
              subPrice = showItem.price * showItem.quantity;
              subQuantity = showItem.quantity;
            }
            if (!isNaN(subPrice)) {
              totalPrice += subPrice;
            }
            totalQuantity += subQuantity;
          }
          this.items = items; // Update items with information from server. Error items is removed.
          this.store();

          this.showItems = showItems;
          this.totalPrice = totalPrice;
          this.totalQuantity = totalQuantity;
          subscriber.next({showItems, errorItems, totalQuantity, totalPrice});
        });
      } catch (err) {
        subscriber.error(err);
      }
    });
  }
  public getShoppingItems(): ShoppingItems {
    return {
      items: this.showItems,
      quantity: this.totalQuantity,
      price: this.totalPrice,
      ready: this.showItems.length > 0,
    }
  }
  public clearCart(): void {
    this.items = [];
    this.showItems = [];
    this.totalPrice = 0;
    this.totalQuantity = 0;
    this.clear();
  }
}
