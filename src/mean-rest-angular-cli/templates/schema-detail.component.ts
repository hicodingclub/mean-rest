import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-detail',
  templateUrl: './<%-schemaName%>-detail.component.html',
  styleUrls: ['./<%-schemaName%>-detail.component.css']
})
export class <%-SchemaName%>DetailComponent extends <%-SchemaName%>Component implements OnInit {
  @Input() 
  protected id:string;

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected <%-schemaName%>Service: <%-SchemaName%>Service) {
          super(<%-schemaName%>Service, router, route, ViewType.DETAIL);
<%_ let refObjects = [];
    for (let field of detailView) { 
        if (field.type === "ObjectId") refObjects.push(field.fieldName);
    }
    if (refObjects.length > 0) {%>
          this.referenceFields = [<%for (let fnm of refObjects) {%>'<%-fnm%>',<%}%>];<%}%> 
<%_ let dateObjects = [];
    for (let field of detailView) { 
        if (field.type === "SchemaDate") dateObjects.push([field.fieldName, field.format]);
    }
    if (dateObjects.length > 0) {%>
          this.dateFields = [<%for (let fnm of dateObjects) {%>['<%-fnm[0]%>', '<%-fnm[1]%>'],<%}%>];<%}%>
  }

  ngOnInit() {
      if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
      if (this.id) this.populateDetail(this.id);
      else console.error("Routing error for detail view... no id...");
  }
}
