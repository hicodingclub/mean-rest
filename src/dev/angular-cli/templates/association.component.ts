import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-detail-asso',
  templateUrl: './<%-schemaName%>-detail-asso.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css']
})
export class <%-SchemaName%>AssoComponent extends <%-SchemaName%>Component implements OnInit {
  @Input() 
  public id:string;

  public associationSchema: string;
  public associationField: string;

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(<%-schemaName%>Service, injector, router, route, location);
          this.view = ViewType.DETAIL;
<% let theView = detailView; let isEditView = false;%><%_ include schema-construct.component.ts %>
  }

  ngOnInit() {
    // urls in <schema>/asso/:id/<assoSchema>/<assoField> format
    let urls = this.route.snapshot.url.join().split(',');
    this.associationSchema = urls[urls.length-2];
    this.associationField = urls[urls.length-1];
    this.detail = {};

    if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.populateDetail(this.id);
    } else {
      console.error("Routing error for association detail view... no id...");
    }
  }

  ngAfterViewInit() {
  }
}
