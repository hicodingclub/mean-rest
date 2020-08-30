import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListCustComponent } from '../../../<%-moduleName%>-cust/base/<%-schemaName%>/<%-schemaName%>-list.cust.component';
import { ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  template: '',
})
export class <%-SchemaName%>ListComponent extends <%-SchemaName%>ListCustComponent implements OnInit {
  <%_ if (sFeatures.hasDate) { %>
  public minDate = {year: (new Date()).getFullYear() - 100, month: 1, day: 1};<%}%><%
  let jsonData = JSON.stringify(listViewProperties);
  let unquoted = jsonData.replace(/"([^"-]+)":/g, '$1:').replace(/"([^"]+)":/g, `'$1':`);
  %>
  public listViewProperties: any = <%-unquoted%>;

  // used by association widget for the associated schema
  public assoCompInstance: any;
  public assoCompFields: any = [];
  public assoCompObjects: any = [];

  public clickItemAction: string = '<%-listViewObj.clickItemAction%>';
  public cardHasLink: boolean = <%-listViewObj.cardHasLink%>;
  public cardHasSelect: boolean = <%-listViewObj.cardHasSelect%>;
  public includeSubDetail: boolean = <%-listViewObj.includeSubDetail%>;
  public canUpdate: boolean = <%-listViewObj.canUpdate%>;
  public canDelete: boolean = <%-listViewObj.canDelete%>;
  public canArchive: boolean = <%-listViewObj.canArchive%>;
  public canCheck: boolean = <%-listViewObj.canCheck%>;
  public itemMultiSelect: boolean = <%-listViewObj.itemMultiSelect%>;
  public majorUi: boolean = <%-listViewObj.majorUi%>;

  // Do query on NgInit in this base class
  public queryOnNgInit: boolean = true;

  // @Input() options: any; {disableCatetory: false, disablePagination: false, disbleActionButtons: false
  //                        disableListSearch: false, disableTitle: false, disableRefs: false
  //                        disableListHead: false, disableTitleRow: false}
  // @Input()
  // public inputData:any;
  // @Input()
  // public searchObj:any;
  // @Input()
  // public queryParams: any;  // {listSortField: 'a', listSortOrder: 'asc' / 'desc', perPage: 6}
  // @Input()
  // public categoryBy:string; //field name whose value is used as category

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(<%-schemaName%>Service, injector, router, route, location);
          this.view = ViewType.LIST;
<% let theView = briefView; %><%_ include schema-construct.component.ts %>

          <% if (defaultSortField) { %>
          this.setListSort('<%-defaultSortField%>', '<%-defaultSortFieldDisplay%>', '<%-defaultSortOrder%>');<%}%>
          <%_ const listCategoriesString = JSON.stringify(listCategories);%>
          const listCategories = <%-listCategoriesString%>;
          this.listCategory1 = listCategories[0] || {};
          this.listCategory2 = listCategories[1] || {};
  }

  ngOnInit() {
      super.ngOnInit();

      this.adjustListViewForWindowSize();

      if (!this.options) {
        this.options = {};
      }

      const properties = [
        'clickItemAction',
        'cardHasLink',
        'cardHasSelect',
        'includeSubDetail',
        'canUpdate',
        'canDelete',
        'canArchive',
        'canCheck',
        'itemMultiSelect',
        'majorUi',
      ];
      this.applyProperties(this.options, this, properties);
  
      if (this.options.disableCatetory) {
        this.listCategory1 = {}; // no do query based on category for home view;
        this.listCategory2 = {}; // no do query based on category for home view;
      }

      this.listViewFilter = this.options.listViewFilter || this.listViewFilter

      // this is to initialize the detail that will be used for search condition selection
      let detail = {};
      if (this.searchObj) {
        this.searchDetailReady = true; // search provided from "detail", not from search bar.
        detail = this.searchObj;
      }
      if (this.queryParams) {
        this.listSortField = this.queryParams.listSortField;
        this.listSortOrder = this.queryParams.listSortOrder;
        if (this.queryParams.perPage) {
          this.perPage = this.queryParams.perPage 
        }
      }
      this.detail = this.formatDetail(detail);

      if (this.queryOnNgInit) {
        this.searchList();
        // get editHintFields
        this.searchHintFieldValues();
      }
  }

  viewUIEvent(evt: any) {
    const thisObject = this;
    thisObject[evt.type].apply(this, evt.params);
  }

  static getInstance() {
    //used by others to call some common functions
    return new <%-SchemaName%>ListComponent(null, null, null, null, null);
  }
}