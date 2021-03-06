import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';
import { <%-SchemaName%>DetailComponent } from './<%-schemaName%>-detail.component';

@Component({
  selector: 'app-<%-schemaName%>-detail-widget-post',
  templateUrl: './<%-schemaName%>-detail-widget-post.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css', './<%-schemaName%>-detail-widget-post.component.css']
})
export class <%-SchemaName%>DetailWidgetPostComponent extends <%-SchemaName%>DetailComponent implements OnInit, AfterViewInit {
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
