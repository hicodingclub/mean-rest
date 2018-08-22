import { Component, OnInit, Input, Directive } from '@angular/core';
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
    let result = true;
    //only compare when input presents
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
import { ViewContainerRef, ComponentFactoryResolver, ViewChild, Type } from '@angular/core';
    <%_ for (let field of compositeEditView) { 
        if (field.Ref) {%>
import { <%-field.Ref%>SelectComponent } from '../../<%-field.ref%>/<%-field.ref%>-list/<%-field.ref%>-select.component';<%}}%>

@Directive({
  selector: '[<%-schemaName%>-ref-select]',
})
export class <%-SchemaName%>RefSelectDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
<%}%>

@Component({
  selector: 'app-<%-schemaName%>-edit',
  templateUrl: './<%-schemaName%>-edit.component.html',
  styleUrls: ['./<%-schemaName%>-edit.component.css']
})
export class <%-SchemaName%>EditComponent extends <%-SchemaName%>Component implements OnInit {        
  @Input() 
  protected id:string;
  private action:string;
<%if (schemaHasRef) {%>   
  protected selectComponents = {
  <%_ for (let field of compositeEditView) { 
      if (field.Ref) {%>
      "<%-field.fieldName%>": {"type":<%-field.Ref%>SelectComponent, "componentRef": null},<%}}%>
  }
  @ViewChild(<%-SchemaName%>RefSelectDirective) refSelectDirective: <%-SchemaName%>RefSelectDirective;
<%}%>
  constructor(
      <%if (schemaHasRef) {%>protected componentFactoryResolver: ComponentFactoryResolver,<%}%>
      protected router: Router,
      protected route: ActivatedRoute,
      protected <%-schemaName%>Service: <%-SchemaName%>Service) {
          super(<%-schemaName%>Service, router, route, ViewType.LIST);
<% let theView = compositeEditView; %><%_ include schema-construct.component.ts %>
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
