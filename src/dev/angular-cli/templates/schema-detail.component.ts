import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>DetailCustComponent } from '../../../<%-moduleName%>-cust/<%-schemaName%>/<%-schemaName%>-detail.cust.component';
import { ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

<%if (schemaHasRef) {%>
import { ComponentFactoryResolver } from '@angular/core';<%}%>
<%if (schemaHasEditor) {%>
import { QueryList, ViewChildren } from '@angular/core';
import { MddsRichTextShowDirective } from '@hicoder/angular-core';<%}%>

@Component({
  selector: 'app-<%-schemaName%>-detail',
  templateUrl: './<%-schemaName%>-detail.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css']
})
export class <%-SchemaName%>DetailComponent extends <%-SchemaName%>DetailCustComponent implements OnInit, AfterViewInit {
  // @Input() 
  // public id:string;
  // @Input()
  // public searchObj:any;
  // @Input()
  // public disableActionButtions:boolean;
  // @Output()
  // public eventEmitter: EventEmitter<any> = new EventEmitter();

<%if (schemaHasEditor) {%>
  @ViewChildren(MddsRichTextShowDirective) textEditors: QueryList<MddsRichTextShowDirective>;<%}%>

  constructor(
      <%if (schemaHasRef) {%>public componentFactoryResolver: ComponentFactoryResolver,<%}%>
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(<%if (schemaHasRef) {%>componentFactoryResolver,<%}%>
                <%-schemaName%>Service, injector, router, route, location, ViewType.DETAIL);
<% let theView = detailView; let isEditView = false;%><%_ include schema-construct.component.ts %>
  }

  ngOnInit() {
      super.ngOnInit();
      if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
      if (this.id) {
        this.populateDetail(this.id);
      } else if (this.searchObj) {
        // search item based on the unique value
        this.populateDetailByFields(this.searchObj);
      } else {
        console.error("Routing error for detail view... no id...");
        return;
      }
  }

  ngAfterViewInit() {
    <%_for (let ref of referredBy) {
      let refApi = ref[8]; 
      let refName = ref[10]; 
      if (detailRefBlackList && detailRefBlackList.includes(refName)) {
          continue;
      }
      if (refApi.includes("L")) {%>
    //Load first reference, if not others activated
    if (!this.options['disableRefLink'] && !this.isChildRouterActivated()) {
      this.router.navigate(['./<%-ref[0]%>/list', {}], {relativeTo: this.route, queryParamsHandling: 'preserve',});
    }<%
        break;
      }
    }%>
  }
}
