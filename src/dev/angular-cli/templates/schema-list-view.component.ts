import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  template: '',
})
export class <%-SchemaName%>ListViewComponent implements OnInit {

  @Input() options: any;  // options to control the UI logic
  @Input() style: any;  // customization to ngStyle
  @Input() inputData: any; // define the required input data from each widgets
  @Input() viewInputs: any = {};

  @Input() list: any; // list of items

  @Input() clickItemAction: string;
  @Input() clickedId: string;
  @Input() checkedItem: string[];
  @Input() parentItem: string;
  @Input() referenceFieldsMap: any;
  @Input() listSortOrder: string;
  @Input() listSortField: string;
  @Input() page: number;
  @Input() perPage: number;
  @Input() archivedSearch: boolean;
  @Input() enums: any;

  @Input() associationField: string;
  @Input() assoCompFields: any = [];
  @Input() assoCompObjects: any = [];

  // compile time inputs, with default value defined here
  @Input() cardHasLink: boolean = <%-listViewObj.cardHasLink%>;
  @Input() canUpdate: boolean = <%-listViewObj.canUpdate%>;
  @Input() canDelete: boolean = <%-listViewObj.canDelete%>;
  @Input() canArchive: boolean = <%-listViewObj.canArchive%>;
  @Input() canCheck: boolean = <%-listViewObj.canCheck%>;
  @Input() includeSubDetail: boolean = <%-listViewObj.includeSubDetail%>;
  @Input() cardHasSelect: boolean = <%-listViewObj.cardHasSelect%>;

  @Output() uiEvents = new EventEmitter<any>();

  constructor() {}

  ngOnInit() {}

  toggleListSort(field: string) {
    const event = {
      type: 'toggleListSort',
      params: [field],
    }
    this.uiEvents.emit(event);
  }

  clickOneItem(idx: number) {
    const event = {
      type: 'clickOneItem',
      params: [idx],
    }
    this.uiEvents.emit(event);
  }

  selectOneItem(idx: number) {
    const event = {
      type: 'selectOneItem',
      params: [idx],
    }
    this.uiEvents.emit(event);
  }
  
  clearSelectItems() {
    const event = {
      type: 'clearSelectItems',
      params: [],
    }
    this.uiEvents.emit(event);
  }

  toggleShowDetailItem(idx: number) {
    const event = {
      type: 'toggleShowDetailItem',
      params: [idx],
    }
    this.uiEvents.emit(event);
  }

  onEdit(itemID: string) {
    const event = {
      type: 'onEdit',
      params: [itemID],
    }
    this.uiEvents.emit(event);
  }

  onDelete(itemID: string, idx: number) {
    const event = {
      type: 'onDelete',
      params: [itemID, idx],
    }
    this.uiEvents.emit(event);
  }

  onArchive(itemID: string, idx: number, archived: boolean) {
    const event = {
      type: 'onArchive',
      params: [itemID, idx, archived],
    }
    this.uiEvents.emit(event);
  }

  onDetailLinkClicked(itemID: string) {
    const event = {
      type: 'onDetailLinkClicked',
      params: [itemID],
    }
    this.uiEvents.emit(event);
  }

  onDisplayRefClicked(field: string, value: any, evt: any) {
    const event = {
      type: 'onDisplayRefClicked',
      params: [field, value, evt],
    }
    this.uiEvents.emit(event);
  }

  selectItemSelected(idx: number) {
    const event = {
      type: 'selectItemSelected',
      params: [idx],
    }
    this.uiEvents.emit(event);
  }

  public fieldHasValue(value: any) {
    if (typeof value === 'undefined') return false;
    if (typeof value === 'string') return !!value;
    return true;
  }
}

