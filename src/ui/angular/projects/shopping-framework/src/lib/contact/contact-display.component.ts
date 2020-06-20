import { Component, OnInit, OnChanges, Input } from '@angular/core';

import { ContactPerson } from '../contact.interface';

@Component({
  selector: 'lib-mdds-contact-display',
  templateUrl: './contact-display.component.html',
  styleUrls: ['./contact.component.css'],
})
export class MDDSContactDisplayComponent implements OnInit, OnChanges, ContactPerson {

  @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, intro: {} }

  @Input() public contactPerson: ContactPerson;

  @Input() public person: string;
  @Input() public email: string;
  @Input() public phone: string;
  @Input() public notes: string;

  constructor() {}

  ngOnInit() {
    this.ngOnChanges();
  }
  ngOnChanges() {
    if (this.contactPerson) {
      this.person = this.contactPerson.person;
      this.phone = this.contactPerson.phone;
      this.email = this.contactPerson.email;
      this.notes = this.contactPerson.notes;
    }
  }
}