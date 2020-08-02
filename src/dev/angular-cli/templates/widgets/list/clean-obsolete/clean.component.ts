import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list-widget-clean',
  templateUrl: './<%-schemaName%>-list-widget-clean.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css', './<%-schemaName%>-list-widget-clean.component.css']
})
export class <%-SchemaName%>ListWidgetCleanComponent extends <%-SchemaName%>ListComponent implements OnInit {
  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%if (sFeatures.hasRef) {%>null,<%}%> <%-schemaName%>Service, injector, router, route, location);
        this.perPage = <%-homeListNumber%>;
        this.listCategory1 = {}; // no do query based on category for home view;
        this.listCategory2 = {}; // no do query based on category for home view;
  }

  ngOnInit() {
      super.ngOnInit();
  }
}
