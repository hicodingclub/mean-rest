"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var forms_1 = require("@angular/forms");
var MinNumber = /** @class */ (function () {
    function MinNumber() {
    }
    MinNumber_1 = MinNumber;
    MinNumber.prototype.validate = function (control) {
        var num = control.value;
        var minnum = parseFloat(this.minnumber);
        if (isNaN(minnum))
            return null; //only compare when max is a number
        //only compare when inputs are numbers
        if (typeof num == 'number' && num < minnum)
            return { 'minnumber': "must be no less than " + minnum };
        return null;
    };
    var MinNumber_1;
    __decorate([
        core_1.Input('minnumber')
    ], MinNumber.prototype, "minnumber", void 0);
    MinNumber = MinNumber_1 = __decorate([
        core_1.Directive({
            selector: '[minnumber]',
            providers: [{ provide: forms_1.NG_VALIDATORS, useExisting: MinNumber_1, multi: true }]
        })
    ], MinNumber);
    return MinNumber;
}());
exports.MinNumber = MinNumber;
var MaxNumber = /** @class */ (function () {
    function MaxNumber() {
    }
    MaxNumber_1 = MaxNumber;
    MaxNumber.prototype.validate = function (control) {
        var num = control.value;
        var maxnum = parseFloat(this.maxnumber);
        if (isNaN(maxnum))
            return null; //only compare when max is a number
        //only compare when inputs are numbers
        if (typeof num == 'number' && num > maxnum)
            return { 'maxnumber': "must be no greater than " + maxnum };
        return null;
    };
    var MaxNumber_1;
    __decorate([
        core_1.Input('maxnumber')
    ], MaxNumber.prototype, "maxnumber", void 0);
    MaxNumber = MaxNumber_1 = __decorate([
        core_1.Directive({
            selector: '[maxnumber]',
            providers: [{ provide: forms_1.NG_VALIDATORS, useExisting: MaxNumber_1, multi: true }]
        })
    ], MaxNumber);
    return MaxNumber;
}());
exports.MaxNumber = MaxNumber;
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
