import { Component, OnInit, OnChanges, Input } from '@angular/core';

import { Address } from '../addr.interface';

@Component({
  selector: 'lib-mdds-address-display',
  templateUrl: './addr-display.component.html',
  styleUrls: ['./addr.component.css'],
})
export class MDDSAddressDisplayComponent implements OnInit, OnChanges, Address {

  @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, intro: {} }

  @Input() public addr: Address;

  @Input() public name: string;

  @Input() public title: string = "Address";
  @Input() public line1: string;
  @Input() public line2: string;
  @Input() public city: string;
  @Input() public state: string;
  @Input() public zipCode: string;
  @Input() public country: string;

  @Input() public phone: string;

  constructor() {}

  ngOnInit() {
    this.ngOnChanges();
  }
  ngOnChanges() {
    if (this.addr) {
      this.name = this.addr.name;
      this.line1 = this.addr.line1;
      this.line2 = this.addr.line2;
      this.city = this.addr.city;
      this.state = this.addr.state;
      this.zipCode = this.addr.zipCode;
      this.country = this.addr.country;
      this.phone = this.addr.phone;
    }
  }
}