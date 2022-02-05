/* License https://github.com/witek1902/json2yaml-typescript */
export class JsonToYamlConverterService {
  constructor(
    private presentation: Map<string, string>,
    private decimal: number,
    private decimalException: Map<string, number>,
  ) { }

  public json2yaml(obj:any): string {
    let ret: Array<string> = [];
    this.convert(obj, ret, this.decimal);
    return ret.join("\n").trim();
  }

  private getType(obj: any) {
    let type = typeof obj;

    if (obj instanceof Array) {
      return "array";
    } else if (type == "string") {
      return "string";
    } else if (type == "boolean") {
      return "boolean";
    } else if (type == "number") {
      return "number";
    } else if (type == "undefined" || obj === null) {
      return "null";
    } else if (obj instanceof Map) {
      return "map";
    } else {
      return "hash";
    }
  }

  private convert(obj: any, ret: Array<string>, decimal: number) {
    let type = this.getType(obj);

    switch (type) {
      case "array":
        this.convertArray(obj, ret, decimal);
        break;
      case "map":
        this.convertMap(obj, ret, decimal);
        break;
      case "hash":
        this.convertHash(obj, ret, decimal);
        break;
      case "string":
        this.convertString(obj, ret);
        break;
      case "null":
        ret.push("null");
        break;
      case "number":
        ret.push(obj.toFixed(decimal));
        break;
      case "boolean":
        ret.push(obj ? "true" : "false");
        break;
    }
  }

  private convertArray(obj, ret, decimal) {
    if (obj.length === 0) {
      ret.push("[]");
    }
    for (let i = 0; i < obj.length; i++) {
      let ele = obj[i];
      let recurse = [];
      this.convert(ele, recurse, decimal);

      for (let j = 0; j < recurse.length; j++) {
        ret.push((j == 0 ? "- " : "  ") + recurse[j]);
      }
    }
  }

  private convertMap(obj, ret, decimal) {
    for (let k of obj.keys()) {
      let recurse = [];
      let ele = obj.get(k);
      let d = decimal;
      if (this.decimalException.has(k)) {
        d = this.decimalException.get(k);
      }
      this.convert(ele, recurse, d);
      let type = this.getType(ele);
      if (
        type == "string" ||
        type == "null" ||
        type == "number" ||
        type == "boolean"
      ) {
        ret.push(
          this.normalizeString(k, false) + ": " + recurse[0]
        );
      } else {
        ret.push(this.normalizeString(k, false) + ": ");
        for (let i = 0; i < recurse.length; i++) {
          ret.push("  " + recurse[i]);
        }
      }
    }
  }

  private convertHash(obj, ret, decimal) {
    for (let k in obj) {
      let recurse = [];
      if (obj.hasOwnProperty(k)) {
        let ele = obj[k];
        let d = decimal;
        if (this.decimalException.has(k)) {
          d = this.decimalException.get(k);
        }
        this.convert(ele, recurse, d);
        let type = this.getType(ele);
        if (
          type == "string" ||
          type == "null" ||
          type == "number" ||
          type == "boolean"
        ) {
          ret.push(
            this.normalizeString(k, false) + ": " + recurse[0]
          );
        } else {
          ret.push(this.normalizeString(k, false) + ": ");
          for (let i = 0; i < recurse.length; i++) {
            ret.push("  " + recurse[i]);
          }
        }
      }
    }
  }

  private normalizeString(str: string, quote: boolean) {
    if (this.presentation.has(str)) {
      str = this.presentation.get(str); // replace string with the presention string.
    }
    if (str.match(/^[\w]+$/)) {
      return str;
    } else {
      let rtn = encodeURI(str);
      if (!quote) {
        return rtn;
      } else {
        return '"' + encodeURI(str) + '"';
      }
    }
  }

  private convertString(obj, ret) {
    ret.push(this.normalizeString(obj, true));
  }
}
