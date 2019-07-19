import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

<%if (schemaHasRef) {%>
import { ComponentFactoryResolver } from '@angular/core';<%}%>
<%if (schemaHasEditor) {%>
import { QueryList, ViewChildren } from '@angular/core';
import { MraRichTextShowDirective } from 'mean-rest-angular';<%}%>

@Component({
  selector: 'app-<%-schemaName%>-detail',
  templateUrl: './<%-schemaName%>-detail.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css']
})
export class <%-SchemaName%>DetailComponent extends <%-SchemaName%>Component implements OnInit {
  @Input() 
  public id:string;
  @Input()
  public searchObj:any;
  @Input()
  public disableActionButtions:boolean;

<%if (schemaHasEditor) {%>
  @ViewChildren(MraRichTextShowDirective) textEditors: QueryList<MraRichTextShowDirective>;<%}%>

  constructor(
      <%if (schemaHasRef) {%>public componentFactoryResolver: ComponentFactoryResolver,<%}%>
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(<%if (schemaHasRef) {%>componentFactoryResolver,<%}%>
                <%-schemaName%>Service, injector, router, route, location, ViewType.DETAIL);
<% let theView = detailView; let isEditView = false;%><%_ include schema-construct.component.ts %><% if (detailType === 'term') {%>
          this.actionType = 'term';<%}%>
  }

  ngOnInit() {
      if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
      if (this.id) {
        this.populateDetail(this.id);
      } else if (this.searchObj) {
        // search item based on the unique value
        this.populateDetailByFields(this.searchObj);
      } else {
        console.error("Routing error for detail view... no id...");
      }
  }
}
