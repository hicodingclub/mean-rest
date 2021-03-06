import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MddsBaseComponent, ViewType } from '@hicoder/angular-core';
import { Component, OnInit, Injector, Input, Output, EventEmitter } from '@angular/core';
import { <%-SchemaName%>Service } from './<%-schemaName%>.service';

const itemCamelName = '<%-schemaCamelName%>';

export { ViewType };
<%if (sFeatures.hasRef || referred) {%>
import { ViewChild } from '@angular/core';<%}%>
<%if (referred) {%>
import { ElementRef } from '@angular/core';<%}%>
<%if (sFeatures.hasRef) {%>
import { <%-ModuleName%>RefSelectDirective } from '../<%-moduleName%>.component';
    <%_ for (let field of compositeEditBriefView) { 
        if (field.Ref) {%>
  <%_ if (refApi[field.ref].includes("R")) {%>import { <%-field.Ref%>DetailPopComponent } from '../<%-field.ref%>/<%-field.ref%>-detail/<%-field.ref%>-detail-pop.component';<%}%>
  <%_ if (refApi[field.ref].includes("L")) {%>
      %>import { <%-field.Ref%>ListSelectComponent } from '../<%-field.ref%>/<%-field.ref%>-list/<%-field.ref%>-list-select.component';%><%}%><%}}%>
<%}%>

@Component({
    template: '',
})
export class <%-SchemaName%>Component extends MddsBaseComponent implements OnInit {
    // *** common input fields
    @Input()
    public style: any; // {}
    @Input()
    public options: any; // {} uiOptions
    @Input()
    public searchObj: any;

    @Input()
    public snackbarMessages: any = {}; // keys: edit, create, list, detail, delete, deleteMany TODO: archive, unarchive

    // *** list component
    @Input()
    public inputData: any;
    @Input()
    public queryParams: any;  // {listSortField: 'a', listSortOrder: 'asc' / 'desc', perPage: 6}
    @Input()
    public categoryBy:string; //field name whose value is used as category
    @Input()
    public listViews: string[] = [];
    @Input()
    public viewInputs: any = {};

    // list-asso component
    @Input('asso') public associationField: string;

    // list select component
    @Output() outputData: any;

    // *** edit / create component
    @Input() 
    public id: string;
    @Input()
    public cid: string; // copy id
    @Input()
    public initData: any; // some fields has data already. eg: {a: b}. Used for add
    @Input()
    public embeddedView: boolean;
    @Input()
    public embedMode: string; // parent to tell the action - create
    @Output()
    public doneData = new EventEmitter<boolean>();
    @Output()
    public done = new EventEmitter<any>();

    // *** detail component
    // @Input() 
    // public id:string;
    @Input()
    public disableActionButtons:boolean;
    @Output()
    public eventEmitter: EventEmitter<any> = new EventEmitter();
    @Input()
    public listRouterLink: string = '<%-listRouterLink%>'; // router link from detail to list

    // detail sub component
    // @Input() inputData;

    // detail show field component
    // @Input() id: string;
    @Input() detailObj: any;
    @Input() showFieldsStr: string;

    // detail sel component
    //@Input() inputData;
    //@Output() outputData;

    // detail pop component
    // @Input() inputData;
    // @Output() outputData;

<%if (sFeatures.hasRef) {%>
    public selectComponents = {
  <%_ for (let field of compositeEditBriefView) { 
      if (field.Ref) {%>
      '<%-field.fieldName%>': {
          <% if (refApi[field.ref].includes("L")) {%>'select-type': <%-field.Ref%>ListSelectComponent,<%}%>
          <% if (refApi[field.ref].includes("R")) {%>'pop-detail-type': <%-field.Ref%>DetailPopComponent,<%}%>
          'componentRef': null},<%}}%>
    }
    @ViewChild(<%-ModuleName%>RefSelectDirective, {static: true}) refSelectDirective: <%-ModuleName%>RefSelectDirective;
<%}%>
<%if (referred) {%>
    @ViewChild('<%-ModuleName%>Modal', {static: true}) public focusEl: ElementRef;<%}%>

    constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {

        super(<%-schemaName%>Service, injector, router, route, location);
        this.setItemNames(itemCamelName);

        <% include schema-base-construct.component.ts%>

        this.schemaName = '<%-schemaName%>';
        <% if (sFeatures.hasDate)  {%>this.dateFormat = '<%-dateFormat%>';
        this.timeFormat = '<%-timeFormat%>';<%}%>
        this.modulePath = '<%-moduleName%>';
        this.indexFields = [<%for (let field of indexView) {%>'<%-field.fieldName%>',<%}%> ];
    }

    ngOnInit() {
        this.style = this.style || {};
        this.options = this.options || {};
    }
}
