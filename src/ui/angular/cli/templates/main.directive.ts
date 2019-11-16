<%_if (hasRequiredArray || hasRequiredMultiSelection || hasRequiredMap) {%>
import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidationErrors, AbstractControl, FormGroup } from '@angular/forms';<%_} %>
<%_if (hasDate) {%>
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { dateStructureToString, stringToDateStructure } from 'mean-rest-angular';

export class MraNgbDateFormatterService extends NgbDateParserFormatter {
    private dateFormat = '<%-dateFormat%>';
    private timeFormat = '<%-timeFormat%>';

    // from input -> internal model
    parse(value: string): NgbDateStruct {
        return stringToDateStructure(value, this.dateFormat);
    }
    // from internal model -> string
    format(date: NgbDateStruct): string {
        return dateStructureToString(date, this.dateFormat);
    }
}<%_} %><%_if (hasRequiredMultiSelection) {%>
@Directive({
  selector: '[directiveMultiSelectionRequired]',
  providers: [{provide: NG_VALIDATORS, useExisting: DirectiveMultiSelectionRequired, multi: true}]
})
export class DirectiveMultiSelectionRequired implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    let selected = false;
    let controlGroup = control as FormGroup; //cast to FormGroup
    if(controlGroup) {
      for(let ctrl in controlGroup.controls) {
        if(controlGroup.controls[ctrl].value) { //true or false of the selected item
          selected = true;
          break;
        }
      }
    }

    if (selected) {
      return null; //no error
    } else {
      return { 'required': true };
    }
  }
}  <%_} %><%_if (hasRequiredArray) {%>
@Directive({
  selector: '[directiveArrayRequired]',
  providers: [{provide: NG_VALIDATORS, useExisting: DirectiveArrayRequired, multi: true}]
})
export class DirectiveArrayRequired implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    let selected = false;
    let controlGroup = control as FormGroup; //cast to FormGroup
    if(controlGroup) {
      for(let ctrl in controlGroup.controls) {
        if(controlGroup.controls[ctrl].value) { //length of array
          selected = true;
          break;
        }
      }
    }

    if (selected) {
      return null; //no error
    } else {
      return { 'required': true };
    }
  }
}  <%_} %><%_if (hasRequiredMap) {%>
@Directive({
  selector: '[directiveMapRequired]',
  providers: [{provide: NG_VALIDATORS, useExisting: DirectiveMapRequired, multi: true}]
})
export class DirectiveMapRequired implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    let selected = false;
    let controlGroup = control as FormGroup; //cast to FormGroup
    if(controlGroup) {
      for(let ctrl in controlGroup.controls) {
        if(controlGroup.controls[ctrl].value) {//value of each map key is set
          selected = true;
          break;
        }
      }
    }

    if (selected) {
      return null; //no error
    } else {
      return { 'required': true };
    }
  }
}  <%_} %>