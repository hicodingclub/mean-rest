import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { MraCommonService } from 'mean-rest-angular';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-sub',
  templateUrl: './<%-schemaName%>-list-sub.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css']
})
export class <%-SchemaName%>ListSubComponent extends <%-SchemaName%>ListComponent implements OnInit {
  constructor(
      protected <%-schemaName%>Service: <%-SchemaName%>Service,
      protected commonService: MraCommonService,
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location) {
        super(<%if (schemaHasRef) {%>null,<%}%> <%-schemaName%>Service, commonService, router, route, location);
  }

  ngOnInit() {
      let ref = this.getParentRouteRefField();
      let id = this.getParentRouteItemId();
      this.detail = {};
      this.detail[ref] = {'_id': id }; //make this as the search context
      this.processSearchContext();
      this.populateList();
  }
}
