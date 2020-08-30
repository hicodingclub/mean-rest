import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-<%-component_file_name%>',
  templateUrl: './<%-schemaName%>-<%-component_file_name%>.component.html',
  styleUrls: ['./<%-schemaName%>-<%-component_file_name%>.component.css'],
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

  constructor(
    public <%-schemaName%>Service: <%-SchemaName%>Service,
    public injector: Injector,
    public router: Router,
    public route: ActivatedRoute,
    public location: Location) {
      super(<%-schemaName%>Service, injector, router, route, location);
        this.actionType = 'selection';
        this.listViews = [ <%for (let widget of widgetDef.views) {%>'<%-widget%>', <%}%>];
        this.listViewFilter = '<%-widgetDef.views[0]%>';
  }

  ngOnInit() {
    this.inputData = this.inputData || {} // expect stepTitle, preSelectedId
    this.selectedId = this.inputData.preSelectedId;

    super.ngOnInit();
  }
}
