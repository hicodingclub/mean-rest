import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-<%-component_file_name%>',
  templateUrl: './<%-schemaName%>-<%-component_file_name%>.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css', './<%-schemaName%>-<%-component_file_name%>.component.css']
})
export class <%-SchemaName%><%-ComponentClassName%>Component extends <%-SchemaName%>ListComponent implements OnInit {
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

  public parentSchema;
  public parentItemId;

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%-schemaName%>Service, injector, router, route, location);

        this.listViews = [ <%for (let widget of widgetDef.views) {%>'<%-widget%>', <%}%>];
        this.listViewFilter = '<%-widgetDef.views[0]%>';
    
  }

  ngOnInit() {
    this.queryOnNgInit = false; // don't do query on the super class.
    super.ngOnInit();

    this.listCategory1 = {}; // no do query based on category;
    this.listCategory2 = {}; // no do query based on category;

    let ref = this.getParentRouteRefField();
    this.parentSchema = this.referenceFieldsReverseMap[ref];

    this.parentItemId = this.getParentRouteItemId();
    let id = this.parentItemId;
    // this is to initialize the detail that will be used for search condition selection
    this.parentData = {};
    if (this.arrayFields.some(x=>x[0] == ref)) {
        this.parentData[ref] = {'selection':[{'_id': id}] }; 
        this.detail[ref] = {'selection':[{'_id': id}] }; //search on array list
    } else {
        this.parentData[ref] = {'_id': id };
        this.detail[ref] = {'_id': id }; //make this as the search context
    }
    this.searchList();
  }
}
