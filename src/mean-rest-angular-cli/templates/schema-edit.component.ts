import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-edit',
  templateUrl: './<%-schemaName%>-edit.component.html',
  styleUrls: ['./<%-schemaName%>-edit.component.css']
})
export class <%-SchemaName%>EditComponent extends <%-SchemaName%>Component implements OnInit {        
  @Input() 
  protected id:string;
  private action:string;
  private enums:any = {};

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected <%-schemaName%>Service: <%-SchemaName%>Service) {
          super(<%-schemaName%>Service, router, route, ViewType.LIST);
<%_ compositeEditView.forEach( (field) => { %>
          <%if (field.enumValues) {%>this.enums['<%-field.fieldName%>'] = [<%field.enumValues.forEach( (f)=>{%>'<%-f%>',<%})%>]; <% } _%>
<%_ }); %>
      }

  ngOnInit() {
      if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
      if (this.id) {
          this.action="Edit";
          this.populateDetail(this.id);
      }
      else {
          this.action="Create";
          this.detail = {
<%_ createView.forEach( (field) => { %>
              <% if (! (typeof(field.defaultValue) == 'undefined')) {%><%-field.fieldName%>: <%-field.defaultValue%>,  <%_}%> <%_ }); %>
          }
      }
  }
}
