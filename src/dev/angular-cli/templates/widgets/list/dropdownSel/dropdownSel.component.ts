import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-widget-dropdownSel',
  templateUrl: './<%-schemaName%>-list-widget-dropdownSel.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css', './<%-schemaName%>-list-widget-dropdownSel.component.css']
})
export class <%-SchemaName%>ListWidgetDropdownSelComponent extends <%-SchemaName%>ListComponent implements OnInit {
  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%if (sFeatures.hasRef) {%>null,<%}%> <%-schemaName%>Service, injector, router, route, location);

        this.isDropdownList =  true;
        this.actionType = 'selection';

        this.itemMultiSelect = false;
  }

  ngOnInit() {
    this.inputData = this.inputData || {} // expect stepTitle, preSelectedId
    this.selectedId = this.inputData.preSelectedId;

    super.ngOnInit();
  }
}
