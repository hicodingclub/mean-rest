import { Input, Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, ValidationErrors, AbstractControl } from '@angular/forms';

@Directive({
  selector: '[minnumber]',
  providers: [{provide: NG_VALIDATORS, useExisting: MinNumber, multi: true}]
})
export class MinNumber implements Validator {
  @Input('minnumber') minnumber: string;
    
  validate(control: AbstractControl): ValidationErrors | null {
    let num = control.value;
    let minnum = parseFloat(this.minnumber);
    if (isNaN(minnum)) return null;     //only compare when max is a number
    //only compare when inputs are numbers
    if (typeof num == 'number' && num < minnum)
        return { 'maxnumber': "must be no less than " + minnum };
    return null;
  }
}

@Directive({
  selector: '[maxnumber]',
  providers: [{provide: NG_VALIDATORS, useExisting: MaxNumber, multi: true}]
})
export class MaxNumber implements Validator {
  @Input('maxnumber') maxnumber: string;
    
  validate(control: AbstractControl): ValidationErrors | null {
    let num = control.value;
    let maxnum = parseFloat(this.maxnumber);
    if (isNaN(maxnum)) return null;     //only compare when max is a number
    //only compare when inputs are numbers
    if (typeof num == 'number' && num > maxnum)
        return { 'maxnumber': "must be no greater than " + maxnum };
    return null;
  }
}

/* This is how you can get the name of the control - from which you can mapping to the model name
    let controls = control.parent.controls;
    let whoami;
    for( let prop in controls ) {
        if( controls[ prop ] == control) {
            whoami = prop;
            break;
        }
    }
*/