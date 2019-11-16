import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseComponent, ViewType } from '@hicoder/angular-core';
import { Injector } from '@angular/core';
import { <%-SchemaName%>Service } from './<%-schemaName%>.service';

const itemCamelName = '<%-schemaCamelName%>';

export { ViewType };
<%if (schemaHasRef || referred) {%>
import { ViewChild } from '@angular/core';<%}%>
<%if (referred) {%>
import { ElementRef } from '@angular/core';<%}%>
<%if (schemaHasRef) {%>
import { ComponentFactoryResolver } from '@angular/core';
import { <%-ModuleName%>RefSelectDirective } from '../<%-moduleName%>.component';
    <%_ for (let field of compositeEditBriefView) { 
        if (field.Ref) {%>
  <%_ if (refApi[field.ref].includes("R")) {%>import { <%-field.Ref%>DetailSelComponent } from '../<%-field.ref%>/<%-field.ref%>-detail/<%-field.ref%>-detail-sel.component';<%}%>
  <%_ if (refApi[field.ref].includes("R")) {%>import { <%-field.Ref%>DetailPopComponent } from '../<%-field.ref%>/<%-field.ref%>-detail/<%-field.ref%>-detail-pop.component';<%}%>
  <%_ if (refApi[field.ref].includes("L")) {%>import { <%-field.Ref%>SelectComponent } from '../<%-field.ref%>/<%-field.ref%>-list/<%-field.ref%>-select.component';<%}%><%}}%>
<%}%>

export class <%-SchemaName%>Component extends BaseComponent {
<%if (schemaHasRef) {%>
    public selectComponents = {
  <%_ for (let field of compositeEditBriefView) { 
      if (field.Ref) {%>
      '<%-field.fieldName%>': {
          <% if (refApi[field.ref].includes("R")) {%>'select-type':<%-field.Ref%>SelectComponent,<%}%>
          <% if (refApi[field.ref].includes("R")) {%>'select-detail-type': <%-field.Ref%>DetailSelComponent,<%}%>
          <% if (refApi[field.ref].includes("L")) {%>'pop-detail-type': <%-field.Ref%>DetailPopComponent,<%}%>
          'componentRef': null},<%}}%>
    }
    @ViewChild(<%-ModuleName%>RefSelectDirective) refSelectDirective: <%-ModuleName%>RefSelectDirective;
<%}%>
<%if (referred) {%>
    @ViewChild('<%-ModuleName%>Modal') public focusEl: ElementRef;<%}%>

    constructor(
      <% if (schemaHasRef) {%>public componentFactoryResolver: ComponentFactoryResolver,<%}%>
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location,
      public view: ViewType ) {

        super(<%-schemaName%>Service, injector, router, route, location, view, itemCamelName);

        <% include schema-base-construct.component.ts%>

        this.schemaName = '<%-schemaName%>';
        <% if (schemaHasDate)  {%>this.dateFormat = '<%-dateFormat%>';
        this.timeFormat = '<%-timeFormat%>';<%}%>
        this.modulePath = '<%-moduleName%>';
        this.indexFields = [<%for (let field of indexView) {%>'<%-field.fieldName%>',<%}%> ];
    }
}
