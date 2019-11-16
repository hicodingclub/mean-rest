export var dateStructureToString = function(date: any, fmt:string):string {
    let d, M, yyyy, h, m, s;
    let value;
    if (!date) return ""; //undefined
    
    d = date.day;
    M = date.month; 
    yyyy = date.year;
    if (typeof d !== 'number' || typeof M !== 'number'  || typeof yyyy !== 'number' ) return ""; //undefined
    
    let yy = yyyy.toString().slice(2);    
    let dd= d<10? '0'+d: d.toString();
    let MM= M<10? '0'+M: M.toString();
    
    value = fmt.replace(/yyyy/ig, yyyy.toString()).
                   replace(/yy/ig, yy.toString()).
                   replace(/MM/g, MM.toString()).
                   replace(/dd/ig, dd.toString());
    return value;
}

export var stringToDateStructure = function(value: string, fmt:string):any {
    let date;    
    let result = [];
    if (value.length != fmt.length) return date; //not ready
    let regexes = [{re:/yyyy/i, len: 4}, {re: /yy/i, len: 2}, {re:/MM/, len: 2}, {re: /dd/i, len: 2}];
    for (let reg of regexes) {
        let p = fmt.search(reg.re); //find position in format
        let v;
        if (p != -1) v = parseInt(value.slice(p, p+reg.len));
        else v = NaN
        result.push(v);
    }
    let [yyyy, yy, M, d] = result;
    if ( (isNaN(yyyy) && isNaN(yy) ) || isNaN(M) || isNaN(d) ) return date; //undefined
    return {day:d, month: M, year: yyyy?yyyy:2000+yy };

}
