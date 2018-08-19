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
<%_ briefView.forEach( (field) => { 
          if (field.enumValues) {%>
          this.enums['<%-field.fieldName%>'] = [<%field.enumValues.forEach( (f)=>{%>'<%-f%>',<%})%>]; <%}});%>
<%_ let refObjects = [];
    for (let field of briefView) { 
        if (field.type === "ObjectId") refObjects.push(field.fieldName);
    }
    if (refObjects.length > 0) {%>
          this.referenceFields = [<%for (let fnm of refObjects) {%>'<%-fnm%>',<%}%>];<%}%>
<%_ let dateObjects = [];
    for (let field of briefView) { 
        if (field.type === "SchemaDate") dateObjects.push([field.fieldName, field.format]);
    }
    if (dateObjects.length > 0) {%>
          this.dateFields = [<%for (let fnm of dateObjects) {%>['<%-fnm[0]%>', '<%-fnm[1]%>'],<%}%>];<%}%>
  }

  ngOnInit() {
      this.route.url.subscribe(url =>{this.populateList();});
  }
    
  public onTextSearchEnter(text:string):void {
      this.searchText = text;
      let searchContext;
      if (!this.searchText) searchContext = [];
      else searchContext = [
<%_for (let field of briefView) { 
      if (field.type === "SchemaString") {%>
            {'<%-field.fieldName%>': this.searchText},<%}}%>
        ];
      this.searchAdd("$or", searchContext);
  }
}
