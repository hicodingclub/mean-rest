import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { MraCommonService } from 'mean-rest-angular';

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
  <%_ if (schemaHasDate) { %>
  private  minDate = {year: (new Date()).getFullYear()-100, month: 1, day: 1}; <%}%>

  constructor(
      <%if (schemaHasRef) {%>protected componentFactoryResolver: ComponentFactoryResolver,<%}%>
      protected <%-schemaName%>Service: <%-SchemaName%>Service,
      protected commonService: MraCommonService,
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location) {
          super(<%if (schemaHasRef) {%>componentFactoryResolver,<%}%>
                <%-schemaName%>Service, commonService, router, route, location, ViewType.LIST);
<% let theView = briefView; %><%_ include schema-construct.component.ts %>
          //this is to initialize the detail that will be used for search condition selection
          let detail = {};
          this.detail = this.formatDetail(detail);
  }

  ngOnInit() {
      this.route.url.subscribe(url =>{this.populateList();});
  }
}
