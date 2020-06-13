import { Component, OnInit, Input, Inject } from "@angular/core";
import { Router } from "@angular/router";

import { ShoppingItem } from '@hicoder/angular-shopping-framework';

import { SHOPPING_CART_CONTINUE_PATH } from "./tokens"
import { SHOPPING_CART_CHECKOUT_PATH } from "./tokens"
import { ShoppingCartService } from "./shopping-cart.service";

const SHOPPING_CART_ROOT_PATH = 'shopping-cart';

@Component({
  selector: "lib-mdds-cart-view",
  templateUrl: "cart-view.component.html",
  styleUrls: [
    "./css/cart-button.css",
    "./css/item-list.css",
    "cart-view.component.css",
  ],
})
export class CartViewComponent implements OnInit {
  @Input() public style: any = {}; // {button: {}}

  public showItems: ShoppingItem[] = [];
  public errorItems: ShoppingItem[] = [];
  public totalPrice: number = 0;

  public quantityChangingItem: ShoppingItem;
  public quantityPop: boolean = false;
  public newQuantity: number = 0;
  public maxQuantity: number = 0;

  constructor(
    private router: Router,
    private scService: ShoppingCartService,
    @Inject(SHOPPING_CART_CONTINUE_PATH) private continueShoppingPath: string,
    @Inject(SHOPPING_CART_CHECKOUT_PATH) private checkoutPath: string,
  ) {
    this.retrieveItems();
  }

  ngOnInit() {}

  private retrieveItems() {
    this.scService.getCartItems().subscribe((cartItems) => {
      this.showItems = cartItems.showItems;
      this.errorItems = cartItems.errorItems;
      this.totalPrice = cartItems.totalPrice;
    });
  }

  public continueShopping() {
    this.router.navigateByUrl(this.continueShoppingPath);
  }
  public checkout() {
    this.router.navigateByUrl(this.checkoutPath);
  }
  public changeQuantity(itemUrl: string) {
    const idx = this.findItem(this.showItems, itemUrl);
    if (idx === -1) {
      // item not found
      return;
    }
    let item = this.showItems[idx];
    this.quantityChangingItem = item;
    this.maxQuantity = item.stockNumber;
    this.newQuantity = item.quantity;
    this.quantityPop = true;
  }
  public delete(itemUrl: string) {
    const idx = this.findItem(this.showItems, itemUrl);
    if (idx === -1) {
      // item not found
      return;
    }
    this.showItems.splice(idx, 1);
    this.scService.removeItem(itemUrl);
    this.totalPrice = this.calculatePrice();
  }

  public quantityChanged() {
    this.quantityPop = false;
    if (this.newQuantity === this.quantityChangingItem.quantity) {
      return;
    }
    if (this.newQuantity === 0) {
      this.delete(this.quantityChangingItem.url);
      return;
    }
    this.quantityChangingItem.quantity = this.newQuantity;
    this.totalPrice = this.calculatePrice();
    this.scService.setItemQuantity(this.quantityChangingItem.url, this.newQuantity);
  }
  public quantityChangeCancelled() {
    this.quantityPop = false;
  }

  private findItem(items: ShoppingItem[], itemUrl: string): number {
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].url === itemUrl) {
        return i;
      }
    }
    return -1;
  }
  private calculatePrice(): number {
    let totalPrice = 0;
    for (let item of this.showItems) {
      totalPrice += item.price * item.quantity;
    }
    return totalPrice;
  }
}
