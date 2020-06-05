import { Component, OnInit, Input, Inject } from '@angular/core';
import { Router }    from '@angular/router';

import { ShowItem } from '@hicoder/angular-shopping-framework';

import { ShoppingCartService } from './shopping-cart.service';
import { SHOPPING_CART_CHECKOUT_PATH } from "./tokens"

const SHOPPING_CART_ROOT_PATH = 'shopping-cart';
@Component({
  selector: 'lib-mdds-cart-icon',
  templateUrl: 'cart-icon.component.html',
  styleUrls: ['./css/cart-button.css', 'cart-icon.component.css']
})
export class CartIconComponent implements OnInit {
  @Input() public style: any = {}; // {button: {}}

  public itemNumber: number = 0;
  public popup: boolean = false;
  public popupStyle: any = {};
  public totalPrice: number = 0;

  constructor(
    private router: Router,
    private scService: ShoppingCartService,
    @Inject(SHOPPING_CART_CHECKOUT_PATH) private checkoutPath: string) {
    this.itemNumber = this.scService.getItemNumber();
    this.scService.getItemNumberPublisher().subscribe((n: number) => {
      this.itemNumber = n;
    });
  }

  ngOnInit() {}

  public toggle(event) {
    if (!this.popup) {
      const right = (window.innerWidth - event.x) - 2;
      const top = event.y + 15;

      this.popupStyle = {
        right: right.toString() + 'px',
        top: top.toString() + 'px',
      };
    }
    this.popup = !this.popup;
  }

  public closePopup() {
    this.popup = false;
  }

  public viewCart() {
    this.router.navigate([SHOPPING_CART_ROOT_PATH, 'view']);
    this.popup = false;
  }
  public checkout() {
    this.router.navigateByUrl(this.checkoutPath);
    this.popup = false;
  }
}
