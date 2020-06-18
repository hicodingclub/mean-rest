import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

import { ContactPerson } from '../contact.interface';

@Component({
  selector: 'lib-mdds-contact-edit',
  templateUrl: './contact-edit.component.html',
  styleUrls: ['./contact.component.css'],
})
export class MDDSContactEditComponent implements OnInit, ContactPerson {

  @Input() public style: any = {}; // { picture: {height: '16rem'}, title: {}, intro: {} }

  @Input() public contactPersonIn: ContactPerson;
  @Output() public contactPersonOut: EventEmitter<ContactPerson> = new EventEmitter<ContactPerson>();
  @Output() public cancel: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() public person: string;
  @Input() public email: string;
  @Input() public phone: string;
  @Input() public notes: string;

  constructor() {}

  ngOnInit() {
    if (this.contactPersonIn) {
      this.person = this.contactPersonIn.person;
      this.phone = this.contactPersonIn.email;
      this.email = this.contactPersonIn.email;
      this.notes = this.contactPersonIn.notes;
    }
  }

  onSubmit() {
    const contactPersonIn: ContactPerson = {
      person: this.person,
      phone: this.person,
      email: this.email,
      notes: this.notes,
    }
    this.contactPersonOut.emit(contactPersonIn);
  }
  onCancel() {
    this.cancel.emit(true);
  }
}