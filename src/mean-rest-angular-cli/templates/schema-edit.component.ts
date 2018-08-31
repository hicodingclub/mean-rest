import { Component, OnInit, Input, Directive } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';
<%if (schemaHasValidator) {%>
import { NG_VALIDATORS, Validator, ValidationErrors, AbstractControl } from '@angular/forms';
  <%_ compositeEditView.forEach( (field) => {
if (field.validators) {%>
@Directive({
  selector: '[<%-schemaName%>Directive<%-field.FieldName%>]',
  providers: [{provide: NG_VALIDATORS, useExisting: <%-SchemaName%>Directive<%-field.FieldName%>, multi: true}]
})
export class <%-SchemaName%>Directive<%-field.FieldName%> implements Validator {
  validators:any[] = [
      <%field.validators.forEach( (v)=>{%>
         {validator: <%-v.validator%>,
          msg: `<%-v.msg%>`
         },<%})%>
  ];
  validate(control: AbstractControl): ValidationErrors | null {
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
                if (result == false ) return { '<%-schemaName%>Directive<%-field.FieldName%>': obj.msg };
            } catch (e) {
                return { '<%-schemaName%>Directive<%-field.FieldName%>': obj.msg };
            }
        }
    }
    return null;
  }
}  <%_}}); %>
<%}%><%#comments: end of: if (schemaHasValidator)%>

<%if (schemaHasRef) {%>
import { ComponentFactoryResolver } from '@angular/core';<%}%>
<%if (schemaHasEditor) {%>
import { QueryList, ViewChildren } from '@angular/core';
import { MraRichTextSelectDirective } from 'mean-rest-angular';<%}%>

@Component({
  selector: 'app-<%-schemaName%>-edit',
  templateUrl: './<%-schemaName%>-edit.component.html',
  styleUrls: ['./<%-schemaName%>-edit.component.css']
})
export class <%-SchemaName%>EditComponent extends <%-SchemaName%>Component implements OnInit {        
    @Input() 
    protected id:string;
    private action:string;
<%if (schemaHasEditor) {%>
    @ViewChildren(MraRichTextSelectDirective) textEditors: QueryList<MraRichTextSelectDirective>;
  <% for (let field of compositeEditView) { let fn=field.fieldName, Fn=field.FieldName; 
    if (field.type === "SchemaString" && field.editor) { %>
    private <%-schemaName%>Edit<%-Fn%> = {valid: true};
<% }}%><%}%>
        
    constructor(
      <%if (schemaHasRef) {%>protected componentFactoryResolver: ComponentFactoryResolver,<%}%>
      protected router: Router,
      protected route: ActivatedRoute,
      protected location: Location,
      protected <%-schemaName%>Service: <%-SchemaName%>Service) {
          super( <%if (schemaHasRef) {%>componentFactoryResolver,<%}%>
                 <%-schemaName%>Service, router, route, location, ViewType.LIST);
<% let theView = compositeEditView; %><%_ include schema-construct.component.ts %>
<% for (let field of compositeEditView) { let fn=field.fieldName, Fn=field.FieldName; 
    if (field.type === "SchemaString" && field.editor) { %>
          this.textEditorMap['<%-schemaName%>Edit<%-Fn%>'] = {
            required: <%if (field.required) {%>true <%}else{%> false <%}%>,
            <%if (typeof field.maxlength === 'number') {%>maxlength: <%-field.maxlength%>,<%}%>
            <%if (typeof field.minlength === 'number') {%>minlength: <%-field.minlength%>,<%}%>
            <%if (field.validators) {%>validators: new <%-SchemaName%>Directive<%-field.FieldName%>(), <%}%>
            fieldState: this.<%-schemaName%>Edit<%-Fn%>,
            fieldName: '<%-fn%>'
          };<% }}%>
          
          let detail = {};
          this.detail = this.formatDetail(detail);
    }

    ngOnInit() {
        if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
        if (this.id) {
            this.action="Edit";
            this.populateDetail(this.id);
        }
        else {
            this.action="Create";
            let detail = {
                <% createView.forEach( (field) => { let fn = field.fieldName;
                if ( typeof(field.defaultValue) !== 'undefined') {%><%-fn%>: <%-field.defaultValue%>,  <%_}}); %>
            }
            this.detail = this.formatDetail(detail);
        }
    }

}
