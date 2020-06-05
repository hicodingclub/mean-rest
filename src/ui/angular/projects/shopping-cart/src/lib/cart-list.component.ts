import { Component, OnInit, Input } from '@angular/core';
import { Router }    from '@angular/router';

import { ShowItem } from '@hicoder/angular-shopping-framework';

import { ShoppingCartService } from './shopping-cart.service';

const SHOPPING_CART_ROOT_PATH = 'shopping-cart';
@Component({
  selector: 'lib-mdds-cart-list',
  templateUrl: 'cart-list.component.html',
  styleUrls: ['./css/item-list.css', 'cart-list.component.css']
})
export class CartListComponent implements OnInit {
  @Input() public style: any = {}; // {button: {}}

  public showItems: ShowItem[] = [];
  public errorItems: ShowItem[] = [];
  public totalPrice: number = 0;

  constructor(private scService: ShoppingCartService) {
    this.retrieveItems();
  }

  ngOnInit() {}

  private retrieveItems() {
    this.scService.getCartItems().subscribe(cartItems => {
      this.showItems = cartItems.showItems;
      this.errorItems = cartItems.errorItems;
      this.totalPrice = cartItems.totalPrice;
    });
  }
}
