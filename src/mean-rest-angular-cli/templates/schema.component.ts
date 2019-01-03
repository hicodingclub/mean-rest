import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { BaseComponent, ViewType } from 'mean-rest-angular';
import { MraCommonService } from 'mean-rest-angular';
import { <%-SchemaName%>Service } from './<%-schemaName%>.service';

var itemName = "<%-schemaName%>";

export { ViewType };

<%if (schemaHasRef || referred) {%>
import { ViewChild } from '@angular/core';<%}%>
<%if (referred) {%>
import { ElementRef } from '@angular/core';<%}%>
<%if (schemaHasRef) {%>
import { ComponentFactoryResolver } from '@angular/core';
import { <%-ModuleName%>RefSelectDirective } from '../<%-moduleName%>.component';
    <%_ for (let field of compositeEditView) { 
        if (field.Ref) {%>
import { <%-field.Ref%>DetailSelComponent } from '../<%-field.ref%>/<%-field.ref%>-detail/<%-field.ref%>-detail-sel.component';
import { <%-field.Ref%>DetailPopComponent } from '../<%-field.ref%>/<%-field.ref%>-detail/<%-field.ref%>-detail-pop.component';
import { <%-field.Ref%>SelectComponent } from '../<%-field.ref%>/<%-field.ref%>-list/<%-field.ref%>-select.component';<%}}%>
<%}%>

export class <%-SchemaName%>Component extends BaseComponent {
<%if (schemaHasRef) {%>   
    protected selectComponents = {
  <%_ for (let field of compositeEditView) { 
      if (field.Ref) {%>
      "<%-field.fieldName%>": {
          "select-type":<%-field.Ref%>SelectComponent, 
          "select-detail-type": <%-field.Ref%>DetailSelComponent,
          "pop-detail-type": <%-field.Ref%>DetailPopComponent,
          "componentRef": null},<%}}%>
    }
    @ViewChild(<%-ModuleName%>RefSelectDirective) refSelectDirective: <%-ModuleName%>RefSelectDirective;
<%}%>
<%if (referred) {%> 
    @ViewChild('<%-ModuleName%>Modal') protected focusEl:ElementRef;<%}%>

    constructor(
      <%if (schemaHasRef) {%>protected componentFactoryResolver: ComponentFactoryResolver,<%}%>
      protected <%-schemaName%>Service: <%-SchemaName%>Service,
      protected commonService: MraCommonService,      
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location,
      protected view: ViewType ) {
        super(<%-schemaName%>Service, commonService, router, route, location, view, itemName);
        <% if (schemaHasDate)  {%>this.dateFormat = "<%-dateFormat%>";
        this.timeFormat = "<%-timeFormat%>";<%}%>
        this.indexFields = [<%for (let field of indexView) {%>'<%-field.fieldName%>',<%}%>];
    }
}
