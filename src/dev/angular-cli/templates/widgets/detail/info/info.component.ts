import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';
import { <%-SchemaName%>DetailComponent } from './<%-schemaName%>-detail.component';

@Component({
  selector: 'app-<%-schemaName%>-detail-widget-info',
  templateUrl: './<%-schemaName%>-detail-widget-info.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css', './<%-schemaName%>-detail-widget-info.component.css']
})
export class <%-SchemaName%>DetailWidgetInfoComponent extends <%-SchemaName%>DetailComponent implements OnInit, AfterViewInit {
  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(<%-schemaName%>Service, injector, router, route, location);
  }

  ngOnInit() {
      super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }
}
