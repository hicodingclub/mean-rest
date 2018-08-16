import { Component, OnInit, Input, Directive } from '@angular/core';
import { Router, ActivatedRoute }    from '@angular/router';

import { <%-SchemaName%>Component, ViewType } from '../<%-schemaName%>.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';

import { NG_VALIDATORS, Validator, ValidationErrors, AbstractControl } from '@angular/forms';
<%_ compositeEditView.forEach( (field) => { %>
<%if (field.validators) {%>
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
}<%}%>
<%_ }); %>


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
  private validators:any = {};

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
              <% if ( typeof(field.defaultValue) !== 'undefined') {%><%-field.fieldName%>: <%-field.defaultValue%>,  <%_}%> <%_ }); %>
          }
      }
  }
}
