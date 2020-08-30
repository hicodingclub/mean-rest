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
  <%_
  let clickItemAction = 'select';
  let cardHasLink = false;
  let cardHasSelect = false;
  let canArchive = false;
  let canCheck = true;
  let includeSubDetail = false;
  let itemMultiSelect = true;
  %>
  public clickItemAction: string = '<%-clickItemAction%>';
  public cardHasLink: boolean = <%-cardHasLink%>;
  public cardHasSelect: boolean = <%-cardHasSelect%>;
  public includeSubDetail: boolean = <%-includeSubDetail%>;
  public canUpdate: boolean = <%-listViewObj.canUpdate%>;
  public canDelete: boolean = <%-listViewObj.canDelete%>;
  public canArchive: boolean = <%-canArchive%>;
  public canCheck: boolean = <%-canCheck%>;
  public itemMultiSelect: boolean = <%-itemMultiSelect%>;
  public majorUi: boolean = <%-listViewObj.majorUi%>;

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%-schemaName%>Service, injector, router, route, location);

        this.listViews = [ <%for (let widget of widgetDef.views) {%>'<%-widget%>', <%}%>];
        this.listViewFilter = '<%-widgetDef.views[0]%>';
    
        this.actionType = 'selection';
  }

  ngOnInit() {
    this.queryOnNgInit = false; // don't do query on the super class.
    super.ngOnInit();

    this.inputData = this.inputData || {} // expect stepTitle, preSelectedId
    this.selectedId = this.inputData.preSelectedId;
    this.listCategory1 = {}; // no do query based on category;
    this.listCategory2 = {}; // no do query based on category;
    this.searchList();
  }

  public onEdit(id: string) {
    this.onEmbeddedEdit(id);
  }
}
