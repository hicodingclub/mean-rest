import { Component, OnInit, AfterViewInit, Input, Output, Directive, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Injector } from '@angular/core';

declare const $: any;

import { <%-SchemaName%>EditCustComponent } from '../../../<%-moduleName%>-cust/base/<%-schemaName%>/<%-schemaName%>-edit.cust.component';
import { ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';
<%for (let mapField of mapFieldsRef) {%>
import { <%-mapField[1]%> } from '../../<%-mapField[0]%>/<%-mapField[0]%>.service';<% } %>

<%if (schemaHasValidator) {%>
import { NG_VALIDATORS, Validator, ValidationErrors, AbstractControl, FormGroup } from '@angular/forms';
  <%_ compositeEditView.forEach( (field) => {
if (field.validators) {%>
@Directive({
  selector: '[<%-moduleName%><%-SchemaName%>Directive<%-field.FieldName%>]',
  providers: [{provide: NG_VALIDATORS, useExisting: <%-ModuleName%><%-SchemaName%>Directive<%-field.FieldName%>, multi: true}]
})
export class <%-ModuleName%><%-SchemaName%>Directive<%-field.FieldName%> implements Validator {
  validators:any[] = [
      <%field.validators.forEach( (v)=>{%>
         {validator: <%-v.validator%>,
          msg: `<%-v.msg%>`
         },<%})%>
  ];
  validate(control: AbstractControl): ValidationErrors | null {
    //TODO: For validator of NgModelGroup, need to get list of contained controls and do validation on the combined data.

    let value = control.value;
    return this.validateValue(value);
  }
  validateValue(value:any): ValidationErrors | null {
    //only compare when input presents
    let result = true;
    if (typeof value == '<%-field.jstype%>') {
        for (let idx = 0; idx < this.validators.length; idx ++) {
            let obj = this.validators[idx];
            try {
                result = obj.validator(value)
                if (result == false ) return { '<%-moduleName%><%-SchemaName%>Directive<%-field.FieldName%>': obj.msg };
            } catch (e) {
                return { '<%-moduleName%><%-SchemaName%>Directive<%-field.FieldName%>': obj.msg };
            }
        }
    }
    return null;
  }
}<%_}}); %><%#comments: end of: forEach %>
<%}%><%#comments: end of: if (schemaHasValidator%>

<%if (schemaHasRef) {%>
import { ComponentFactoryResolver } from '@angular/core';<%}%>
<%if (schemaHasEditor) {%>
import { QueryList, ViewChildren } from '@angular/core';
import { MddsRichTextSelectDirective } from '@hicoder/angular-core';<%}%>

@Component({
  selector: 'app-<%-schemaName%>-edit',
  templateUrl: './<%-schemaName%>-edit.component.html',
  styleUrls: ['./<%-schemaName%>-edit.component.css']
})
export class <%-SchemaName%>EditComponent extends <%-SchemaName%>EditCustComponent implements OnInit, AfterViewInit {        
    // @Input() 
    // public id: string;
    // @Input()
    // public cid: string; // copy id
    // @Input()
    // public initData: any; // some fields has data already. eg: {a: b}. Used for add
    // @Output()
    // public doneData = new EventEmitter<boolean>();
    // @Output()
    // public done = new EventEmitter<any>();
    // @Input()
    // public embeddedView: boolean;
    // @Input()
    // public embedMode: string; // parent to tell the action - create

    public action: string;
    public minDate = {year: (new Date()).getFullYear() - 100, month: 1, day: 1};

<%if (schemaHasEditor) {%>
    @ViewChildren(MddsRichTextSelectDirective) textEditors: QueryList<MddsRichTextSelectDirective>;
  <% for (let field of compositeEditView) { let fn=field.fieldName, Fn=field.FieldName; 
    if (field.type === 'SchemaString' && field.editor) { %>
    public Edit<%-Fn%>: any = {valid: true};
<% }}%><%}%>

    constructor(<%if (schemaHasRef) {%>
      public componentFactoryResolver: ComponentFactoryResolver,<%}%>
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(<%if (schemaHasRef) {%>componentFactoryResolver,<%}%>
                <%-schemaName%>Service, injector, router, route, location);
          this.view = ViewType.EDIT;
<% let theView = compositeEditView; let isEditView = true;%><%_ include schema-construct.component.ts %>
<% for (let field of compositeEditView) { let fn=field.fieldName, Fn=field.FieldName; 
    if (field.type === 'SchemaString' && field.editor) { %>
          this.textEditorMap['Edit<%-Fn%>'] = {
            required: <%if (field.required) {%>true <%}else{%> false <%}%>,
            <%if (typeof field.maxlength === 'number') {%>maxlength: <%-field.maxlength%>,<%}%>
            <%if (typeof field.minlength === 'number') {%>minlength: <%-field.minlength%>,<%}%>
            <%if (field.validators) {%>validators: new <%-SchemaName%>Directive<%-field.FieldName%>(), <%}%>
            fieldState: this.Edit<%-Fn%>,
            fieldName: '<%-fn%>'
          };<% }}%>
          
          const detail = {};
          this.detail = this.formatDetail(detail);
    }

    ngOnInit() {
      super.ngOnInit();
      if (this.embedMode == 'create') { // parent ask to create
        this.action='Create';
        this.getDetailData();
      } else {
        if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
        if (this.id) {
            this.action='Edit';
            this.populateDetailForAction(this.id, 'edit'); //populate with action as 'edit'
        }
        else {
            this.action='Create';
            if (!this.cid) this.cid = this.route.snapshot.queryParamMap.get('cid');
            if (this.cid) {
                this.populateDetailFromCopy(this.cid);
            } else {
              this.getDetailData();
            }
        }
      }
      // get editHintFields
      this.searchHintFieldValues();
    }

    ngAfterViewInit() {
      // Initialize all tooltips
      $('[data-toggle="tooltip"]').tooltip();
    }

    getDetailData() {
      if (this.initData) {
        this.action='Add';
        let detail = {<%_ createView.forEach( (field) => { 
              let fn = field.fieldName;let fdv = field.defaultValue;
              if ( typeof(fdv) !== 'undefined') {%>
          <%-fn%>: <%-JSON.stringify(fdv)%>,<%_}
            }); %>
        };
        for (let prop of Object.keys(this.initData)) {
            detail[prop] = this.initData[prop];
            this.hiddenFields.push(prop);
        }
        this.detail = this.formatDetail(detail);
      } else {
          let detail = {<%_ createView.forEach( (field) => { 
                let fn = field.fieldName;let fdv = field.defaultValue;
                if ( typeof(fdv) !== 'undefined') {%>
            <%-fn%>: <%-JSON.stringify(fdv)%>,<%_}
              }); %>
          };
          this.detail = this.formatDetail(detail);
      }
    }
}
