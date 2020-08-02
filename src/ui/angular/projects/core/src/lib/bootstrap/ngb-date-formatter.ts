import { Injectable, Inject, InjectionToken } from "@angular/core";

import {
  NgbDateParserFormatter,
  NgbDateStruct,
} from "@ng-bootstrap/ng-bootstrap";

const dateStructureToString = function (date: any, fmt: string): string {
  let value;
  if (!date) {
    return "";
  } // undefined

  const d = date.day;
  const M = date.month;
  const yyyy = date.year;
  if (
    typeof d !== "number" ||
    typeof M !== "number" ||
    typeof yyyy !== "number"
  ) {
    return "";
  } // undefined

  const yy = yyyy.toString().slice(2);
  const dd = d < 10 ? "0" + d : d.toString();
  const MM = M < 10 ? "0" + M : M.toString();

  value = fmt
    .replace(/yyyy/gi, yyyy.toString())
    .replace(/yy/gi, yy.toString())
    .replace(/MM/g, MM.toString())
    .replace(/dd/gi, dd.toString());
  return value;
};

const stringToDateStructure = (value: string, fmt: string): any => {
  const date = undefined;
  const result = [];
  if (value.length !== fmt.length) {
    return date;
  } // not ready
  const regexes = [
    { re: /yyyy/i, len: 4 },
    { re: /yy/i, len: 2 },
    { re: /MM/, len: 2 },
    { re: /dd/i, len: 2 },
  ];
  for (const reg of regexes) {
    const p = fmt.search(reg.re); // find position in format
    let v;
    if (p != -1) {
      v = parseInt(value.slice(p, p + reg.len), 10);
    } else {
      v = NaN;
    }
    result.push(v);
  }
  const [yyyy, yy, M, d] = result;
  if ((isNaN(yyyy) && isNaN(yy)) || isNaN(M) || isNaN(d)) {
    return date;
  } // undefined
  return { day: d, month: M, year: yyyy ? yyyy : 2000 + yy };
};

export const MDDS_NGB_DATE_FORMAT = new InjectionToken<string>("MDDS_NGB_DATE_FORMAT");

@Injectable()
export class MraNgbDateFormatterService extends NgbDateParserFormatter {
  constructor(@Inject(MDDS_NGB_DATE_FORMAT) private dateFormat: string) {
    super();
  }
  // from input -> internal model
  parse(value: string): NgbDateStruct {
    return stringToDateStructure(value, this.dateFormat);
  }
  // from internal model -> string
  format(date: NgbDateStruct): string {
    return dateStructureToString(date, this.dateFormat);
  }
}