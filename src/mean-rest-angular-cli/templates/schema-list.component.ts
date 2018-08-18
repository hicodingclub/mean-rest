import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

@Component({
  selector: 'app-<%-schemaName%>-list',
  templateUrl: './<%-schemaName%>-list.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css']
})
export class <%-SchemaName%>ListComponent extends <%-SchemaName%>Component implements OnInit {
  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected <%-schemaName%>Service: <%-SchemaName%>Service) {
          super(<%-schemaName%>Service, router, route, ViewType.LIST);
<%_ briefView.forEach( (field) => { %>
          <%if (field.enumValues) {%>this.enums['<%-field.fieldName%>'] = [<%field.enumValues.forEach( (f)=>{%>'<%-f%>',<%})%>]; <% } _%>
<%_ }); %>
<%_ let objects = [];
    for (let field of briefView) { 
        if (field.type === "ObjectId") objects.push(field.fieldName);
    }
    if (objects.length > 0) {%>
          this.referenceFields = [<%for (let fnm of objects) {%>'<%-fnm%>',<%}%>];
<%}%>
  }

  ngOnInit() {
      this.route.url.subscribe(url =>{this.populateList();});
  }
    
  public onTextSearchEnter(text:string):void {
        console.log("===search for: ", text);
  }
}
