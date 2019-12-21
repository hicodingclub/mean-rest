import { Input, Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidationErrors, AbstractControl } from '@angular/forms';

@Directive({
  selector: '[libMddsMinNumber]',
  providers: [{provide: NG_VALIDATORS, useExisting: MddsMinNumberDirective, multi: true}]
})
export class MddsMinNumberDirective implements Validator {
  @Input() libMddsMinNumber: string;

  validate(control: AbstractControl): ValidationErrors | null {
    const num = control.value;
    const minnum = parseFloat(this.libMddsMinNumber);
    if (isNaN(minnum)) { return null; } // only compare when max is a number
    // only compare when inputs are numbers
    if (typeof num === 'number' && num < minnum) {
        return { libMddsMinNumber: 'must be no less than ' + minnum };
    }
    return null;
  }
}

@Directive({
  selector: '[libMddsMaxNumber]',
  providers: [{provide: NG_VALIDATORS, useExisting: MddsMaxNumberDirective, multi: true}]
})
export class MddsMaxNumberDirective implements Validator {
  @Input() libMddsMaxnumber: string;

  validate(control: AbstractControl): ValidationErrors | null {
    const num = control.value;
    const maxnum = parseFloat(this.libMddsMaxnumber);
    if (isNaN(maxnum)) { return null; } // only compare when max is a number
    // only compare when inputs are numbers
    if (typeof num === 'number' && num > maxnum) {
        return { libMddsMaxnumber: 'must be no greater than ' + maxnum };
    }
    return null;
  }
}
