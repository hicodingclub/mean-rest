import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { Address } from '../addr.interface';

@Component({
  selector: 'lib-mdds-address-edit',
  templateUrl: './addr-edit.component.html',
  styleUrls: ['./addr.component.css'],
})
export class MDDSAddressEditComponent implements OnInit, Address {

  @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, intro: {} }

  @Input() public addrIn: Address;
  @Output() public addrOut: EventEmitter<Address> = new EventEmitter<Address>();
  @Output() public cancel: EventEmitter<boolean> = new EventEmitter<boolean>();


  @Input() public title: string = "Address";

  @Input() public name: string;
  @Input() public line1: string;
  @Input() public line2: string;
  @Input() public city: string;
  @Input() public state: string;
  @Input() public zipCode: string;
  @Input() public country: string;

  @Input() public phone: string;

  constructor() {}

  ngOnInit() {
    if (this.addrIn) {
      this.name = this.addrIn.name;
      this.line1 = this.addrIn.line1;
      this.line2 = this.addrIn.line2;
      this.city = this.addrIn.city;
      this.state = this.addrIn.state;
      this.zipCode = this.addrIn.zipCode;
      this.country = this.addrIn.country;
      this.phone = this.addrIn.phone;
    }
  }

  onSubmit() {
    const addr: Address = {
      name: this.name,
      line1: this.line1,
      line2: this.line2,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country,
      phone: this.phone,
    }
    this.addrOut.emit(addr);
  }
  onCancel() {
    this.cancel.emit(true);
  }
}