import { Input, Directive } from "@angular/core";
import {
  NG_VALIDATORS,
  Validator,
  ValidationErrors,
  AbstractControl,
  FormGroup,
} from "@angular/forms";

@Directive({
  selector: "[libMddsMinNumber]",
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: MddsMinNumberDirective,
      multi: true,
    },
  ],
})
export class MddsMinNumberDirective implements Validator {
  @Input() libMddsMinNumber: string;

  validate(control: AbstractControl): ValidationErrors | null {
    const num = control.value;
    const minnum = parseFloat(this.libMddsMinNumber);
    if (isNaN(minnum)) {
      return null;
    } // only compare when max is a number
    // only compare when inputs are numbers
    if (typeof num === "number" && num < minnum) {
      return { libMddsMinNumber: `must not be less than ${minnum}` };
    }
    return null;
  }
}

@Directive({
  selector: "[libMddsMaxNumber]",
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: MddsMaxNumberDirective,
      multi: true,
    },
  ],
})
export class MddsMaxNumberDirective implements Validator {
  @Input() libMddsMaxNumber: string;

  validate(control: AbstractControl): ValidationErrors | null {
    const num = control.value;
    const maxnum = parseFloat(this.libMddsMaxNumber);
    if (isNaN(maxnum)) {
      return null;
    } // only compare when max is a number
    // only compare when inputs are numbers
    if (typeof num === "number" && num > maxnum) {
      return { libMddsMaxNumber: `must not be greater than ${maxnum}` };
    }
    return null;
  }
}

@Directive({
  selector: "[libMddsMultiSelectionRequired]",
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: MddsDirectiveMultiSelectionRequired,
      multi: true,
    },
  ],
})
export class MddsDirectiveMultiSelectionRequired implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    let selected = false;
    let controlGroup = control as FormGroup; //cast to FormGroup
    if (controlGroup) {
      for (let ctrl in controlGroup.controls) {
        if (controlGroup.controls[ctrl].value) {
          //true or false of the selected item
          selected = true;
          break;
        }
      }
    }

    if (selected) {
      return null; //no error
    } else {
      return { required: true };
    }
  }
}

@Directive({
  selector: "[libMddsArrayRequired]",
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: MddsDirectiveArrayRequired,
      multi: true,
    },
  ],
})
export class MddsDirectiveArrayRequired implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    let selected = false;
    let controlGroup = control as FormGroup; //cast to FormGroup
    if (controlGroup) {
      for (let ctrl in controlGroup.controls) {
        if (controlGroup.controls[ctrl].value) {
          //length of array
          selected = true;
          break;
        }
      }
    }

    if (selected) {
      return null; //no error
    } else {
      return { required: true };
    }
  }
}

@Directive({
  selector: "[libMddsMapRequired]",
  providers: [
    { provide: NG_VALIDATORS, useExisting: MddsDirectiveMapRequired, multi: true },
  ],
})
export class MddsDirectiveMapRequired implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    let selected = false;
    let controlGroup = control as FormGroup; //cast to FormGroup
    if (controlGroup) {
      for (let ctrl in controlGroup.controls) {
        if (controlGroup.controls[ctrl].value) {
          //value of each map key is set
          selected = true;
          break;
        }
      }
    }

    if (selected) {
      return null; //no error
    } else {
      return { required: true };
    }
  }
}
