import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';

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
  protected id:string;
<%if (schemaHasEditor) {%>
  @ViewChildren(MraRichTextShowDirective) textEditors: QueryList<MraRichTextShowDirective>;<%}%>

  constructor(
      <%if (schemaHasRef) {%>protected componentFactoryResolver: ComponentFactoryResolver,<%}%>
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location,
      protected <%-schemaName%>Service: <%-SchemaName%>Service) {
          super(<%if (schemaHasRef) {%>componentFactoryResolver,<%}%>
                <%-schemaName%>Service, router, route, location, ViewType.DETAIL);
<% let theView = detailView; %><%_ include schema-construct.component.ts %>
<% for (let field of detailView) { let fn=field.fieldName, Fn=field.FieldName; 
    if (field.type === "SchemaString" && field.editor) { %>
          this.textEditorMap['<%-schemaName%>Detail<%-Fn%>'] = {
            fieldName: '<%-fn%>'
          };<% }}%>
  }

  ngOnInit() {
      if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
      if (this.id) this.populateDetail(this.id);
      else console.error("Routing error for detail view... no id...");
  }
}
