import { Injectable } from '@angular/core';
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
}
