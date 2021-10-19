import { Component, OnInit, Input, OnChanges, SimpleChanges, Inject } from '@angular/core';

import { ShoppingCartService, Item, ItemMeta, DEFAULTSTOCKNUMBER } from './shopping-cart.service';
import { SHOPPING_CART_OUTOFSTOCK_TEXT } from "./tokens"

@Component({
  selector: 'lib-mdds-add-to-cart',
  templateUrl: 'add-to-cart.component.html',
  styleUrls: ['./css/cart-button.css', 'add-to-cart.component.css']
})
export class AddToCartComponent implements OnInit, OnChanges {
  @Input() public style: any = {}; // {button: {}}

  @Input() public url: string;
  @Input() public meta: ItemMeta;
  @Input() public name: string;
  @Input() public description: string;
  @Input() public price: number;
  @Input() public pageUrl: string;
  @Input() public stockNumber: number = DEFAULTSTOCKNUMBER;

  public inCartQuantity: number = 0;

  constructor(private scService: ShoppingCartService,
    @Inject(SHOPPING_CART_OUTOFSTOCK_TEXT) public outOfStockText: string) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.url) {
      this.inCartQuantity = this.scService.getItemQuantity(this.url);
    }
  }

  public addToCart() {
    this.inCartQuantity = this.scService.getItemQuantity(this.url);
    if (this.stockNumber <= this.inCartQuantity) {
      return;
    }
    if (this.url && this.meta && this.name) {
      const item: Item = {
        url: this.url,
        quantity: 1,
        meta: this.meta,

        name: this.name,
        description: this.description,
        price: this.price,
        pageUrl: this.pageUrl,
      };
      this.scService.addItem(item);
      this.inCartQuantity = this.scService.getItemQuantity(this.url);
    }
  }
}
