import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

<%if (schemaHasRef) {%>
import { ComponentFactoryResolver } from '@angular/core';<%}%>

@Component({
  selector: 'app-<%-schemaName%>-list',
  templateUrl: './<%-schemaName%>-list.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css']
})
export class <%-SchemaName%>ListComponent extends <%-SchemaName%>Component implements OnInit {
  constructor(
      <%if (schemaHasRef) {%>protected componentFactoryResolver: ComponentFactoryResolver,<%}%>
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location,
      protected <%-schemaName%>Service: <%-SchemaName%>Service) {
          super(<%if (schemaHasRef) {%>componentFactoryResolver,<%}%>
                <%-schemaName%>Service, router, route, location, ViewType.LIST);
<% let theView = briefView; %><%_ include schema-construct.component.ts %>
          //this is to initialize the detail that will be used for search condition selection
          let detail = {};
          this.detail = this.formatDetail(detail);
  }

  ngOnInit() {
      this.route.url.subscribe(url =>{this.populateList();});
  }
}
