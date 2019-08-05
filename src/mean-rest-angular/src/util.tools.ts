export class Util {

  static clone(obj:any):any {
    let copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = Util.clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = Util.clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  static gStringify(detail:any): string {
    let str = "";
    if (!str)  {
        for (let prop in detail) {
            if (prop !== '_id' && typeof detail[prop] !=='undefined' && typeof detail[prop] !== 'object') {
                str += " " + detail[prop];
            }
        }
    }
    if (!str) str = detail["_id"]?detail["_id"]:"..."
    str = str.replace(/^\s+|\s+$/g, '')
    if (str.length > 30) str = str.substr(0, 27) + '...';
    return str;
  }

  static gStringifyFields(detail:any, fields:string[]): string { //used for reference category only now
    let str = "";
    if (!str)  {
        for (let prop in detail) {
            if (fields.includes(prop) && typeof detail[prop] !== 'undefined' && typeof detail[prop] !== 'object') {
                str += " " + detail[prop];
            }
        }
    }
    if (!str) str = detail["_id"]?detail["_id"]:"..."
    str = str.replace(/^\s+|\s+$/g, '')
    // if (str.length > 30) str = str.substr(0, 27) + '...'; Don't restrict length here
    return str;
  }

}


