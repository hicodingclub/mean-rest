import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-home',
  templateUrl: './<%-schemaName%>-list-home.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css']
})
export class <%-SchemaName%>ListHomeComponent extends <%-SchemaName%>ListComponent implements OnInit {
  private parentData = {};
  constructor(
      protected <%-schemaName%>Service: <%-SchemaName%>Service,
      protected injector: Injector,
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location) {
        super(<%if (schemaHasRef) {%>null,<%}%> <%-schemaName%>Service, injector, router, route, location);
        this.per_page = <%-homeListNumber%>;
  }

  ngOnInit() {
      this.populateList();
  }
}
