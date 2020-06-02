import { Component, OnInit, Input } from '@angular/core';

import { ShoppingCartService, Item, ItemMeta } from './shopping-cart.service';

@Component({
  selector: 'lib-mdds-add-to-cart',
  templateUrl: 'add-to-cart.component.html',
  styleUrls: ['add-to-cart.component.css']
})
export class AddToCartComponent implements OnInit {
  @Input() public style: any = {}; // {button: {}}

  @Input() public url: string;
  @Input() public meta: ItemMeta;
  @Input() public name: string;
  @Input() public description: string;
  @Input() public price: number;
  @Input() public pageUrl: string;

  constructor(private scService: ShoppingCartService) { }

  ngOnInit() {
  }

  public addToCart() {
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
    }
  }
}
