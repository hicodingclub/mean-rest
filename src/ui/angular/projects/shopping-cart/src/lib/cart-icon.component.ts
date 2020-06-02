import { Component, OnInit, Input } from '@angular/core';

import { ShoppingCartService, Item, ShowItem } from './shopping-cart.service';

@Component({
  selector: 'lib-mdds-cart-icon',
  templateUrl: 'cart-icon.component.html',
  styleUrls: ['add-to-cart.component.css', 'cart-icon.component.css']
})
export class CartIconComponent implements OnInit {
  @Input() public style: any = {}; // {button: {}}

  public itemNumber: number = 0;
  public popup: boolean = false;
  public popupStyle: any = {};
  public showItems: ShowItem[] = [];
  public errorItems: ShowItem[] = [];
  public totalPrice: number = 0;

  constructor(private scService: ShoppingCartService) {
    this.itemNumber = this.scService.getItemNumber();
    this.retrieveItems();
    this.scService.getItemNumberPublisher().subscribe((n: number) => {
      this.itemNumber = n;
      this.retrieveItems();
    });
  }

  ngOnInit() {}

  private retrieveItems() {
    this.scService.getCartItems().subscribe(cartItems => {
      this.showItems = cartItems.showItems;
      this.errorItems = cartItems.errorItems;
      this.totalPrice = cartItems.totalPrice;
    });
  }

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

  public viewCart() {}
  public checkout() {}
}
