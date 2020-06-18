import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router }    from '@angular/router';

import { ShoppingItem, ShoppingItems } from '@hicoder/angular-shopping-framework';

import { ShoppingCartService } from './shopping-cart.service';

const SHOPPING_CART_ROOT_PATH = 'shopping-cart';
@Component({
  selector: 'lib-mdds-cart-list',
  templateUrl: 'cart-list.component.html',
  styleUrls: ['./css/item-list.css', 'cart-list.component.css']
})
export class CartListComponent implements OnInit, AfterViewInit {
  @Input() public style: any = {}; // {button: {}}
  @Output() public shoppingItems: EventEmitter<ShoppingItems> = new EventEmitter<ShoppingItems>();

  public showItems: ShoppingItem[] = [];
  public errorItems: ShoppingItem[] = [];
  public totalPrice: number = 0;
  public totalQuantity: number = 0;

  constructor(private scService: ShoppingCartService) {
    this.retrieveItems();
  }

  ngOnInit() {}
  ngAfterViewInit() {
    this.emitShoppintItems()
  }

  emitShoppintItems() {
    if (this.showItems.length > 0 ) {
      this.shoppingItems.emit({
        items: this.showItems,
        quantity: this.totalQuantity,
        price: this.totalPrice,
        ready: true,
      });
    }
  }

  private retrieveItems() {
    this.scService.getCartItems().subscribe(cartItems => {
      this.showItems = cartItems.showItems;
      this.errorItems = cartItems.errorItems;
      this.totalPrice = cartItems.totalPrice;
      this.totalQuantity = cartItems.totalQuantity;

      this.emitShoppintItems();
    });
  }
}
