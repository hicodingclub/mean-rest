import { Validator, ValidationErrors, AbstractControl } from '@angular/forms';
export declare class MinNumber implements Validator {
    minnumber: string;
    validate(control: AbstractControl): ValidationErrors | null;
}
export declare class MaxNumber implements Validator {
    maxnumber: string;
    validate(control: AbstractControl): ValidationErrors | null;
}
