const humanize = require('string-humanize');

class Util {
  static clone(obj) {
    let copy;

    // Handle the 3 simple types, and null or undefined
    if (null === obj || 'object' !== typeof obj) {
      return obj;
    }

    // Handle Date
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
      copy = [];
      for (let i = 0, len = obj.length; i < len; i++) {
        copy[i] = Util.clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      copy = {};
      for (const attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          copy[attr] = Util.clone(obj[attr]);
        }
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }

  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
  };
  
  static lowerFirst(str) {
    return str.charAt(0).toLowerCase() + str.substr(1);
  };
  
  static replaceProperties(src, dest) {
    for (let p in src) {
      if (src.hasOwnProperty(p)) {
        dest[p] = src[p];
      }
    }
    return dest;
  }
  
  static camelToDisplay(str) {
    // insert a space before all caps
    const words = [
      'At',
      'Around',
      'By',
      'After',
      'Along',
      'For',
      'From',
      'Of',
      'On',
      'To',
      'With',
      'Without',
      'And',
      'Nor',
      'But',
      'Or',
      'Yet',
      'So',
      'A',
      'An',
      'The',
    ];
    let arr = humanize(str).split(' ');
    arr = arr.map((x) => {
      let y = Util.capitalizeFirst(x);
      if (words.includes(y)) y = Util.lowerFirst(y);
      return y;
    });
    return Util.capitalizeFirst(arr.join(' '));
  };
  
}

module.exports = Util;