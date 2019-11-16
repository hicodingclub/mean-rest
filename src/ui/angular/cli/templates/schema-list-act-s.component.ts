import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-act-sel',
  templateUrl: './<%-schemaName%>-list-act-sel.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css']
})
export class <%-SchemaName%>ListActSelComponent extends <%-SchemaName%>ListComponent implements OnInit {
  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%if (schemaHasRef) {%>null,<%}%> <%-schemaName%>Service, injector, router, route, location);

        <%if (selectActionViewType === 'dropdown') { %>this.isDropdownList =  true;<%}%>
        this.actionType = 'selection';
        this.listViewFilter = '<%-selectActionViewType%>';
        this.listCategory1 = {}; // no do query based on category for select view;
        this.listCategory2 = {}; // no do query based on category for select view;
  }

  ngOnInit() {
    this.inputData == this.inputData || {} // expect stepTitle, preSelectedId
    this.selectedId = this.inputData.preSelectedId;

    const detail = this.searchObj || {};
    this.detail = this.formatDetail(detail);
    this.searchList();
  }
}
