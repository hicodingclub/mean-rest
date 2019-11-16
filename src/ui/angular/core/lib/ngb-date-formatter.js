"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateStructureToString = function (date, fmt) {
    var d, M, yyyy, h, m, s;
    var value;
    if (!date)
        return ""; //undefined
    d = date.day;
    M = date.month;
    yyyy = date.year;
    if (typeof d !== 'number' || typeof M !== 'number' || typeof yyyy !== 'number')
        return ""; //undefined
    var yy = yyyy.toString().slice(2);
    var dd = d < 10 ? '0' + d : d.toString();
    var MM = M < 10 ? '0' + M : M.toString();
    value = fmt.replace(/yyyy/ig, yyyy.toString()).
        replace(/yy/ig, yy.toString()).
        replace(/MM/g, MM.toString()).
        replace(/dd/ig, dd.toString());
    return value;
};
exports.stringToDateStructure = function (value, fmt) {
    var date;
    var result = [];
    if (value.length != fmt.length)
        return date; //not ready
    var regexes = [{ re: /yyyy/i, len: 4 }, { re: /yy/i, len: 2 }, { re: /MM/, len: 2 }, { re: /dd/i, len: 2 }];
    for (var _i = 0, regexes_1 = regexes; _i < regexes_1.length; _i++) {
        var reg = regexes_1[_i];
        var p = fmt.search(reg.re); //find position in format
        var v = void 0;
        if (p != -1)
            v = parseInt(value.slice(p, p + reg.len));
        else
            v = NaN;
        result.push(v);
    }
    var yyyy = result[0], yy = result[1], M = result[2], d = result[3];
    if ((isNaN(yyyy) && isNaN(yy)) || isNaN(M) || isNaN(d))
        return date; //undefined
    return { day: d, month: M, year: yyyy ? yyyy : 2000 + yy };
};
