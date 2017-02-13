
var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;


export function sortAlphaNum(a,b) {
    var aA = a.replace(reA, "");
    var bA = b.replace(reA, "");
    if(aA === bA) {
        var aN = parseInt(a.replace(reN, ""), 10);
        var bN = parseInt(b.replace(reN, ""), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
        return aA > bA ? 1 : -1;
    }
}


// ["A1", "A10", "A11", "A12", "A2", "A3", "A4", "B10", "B2", "F1", "F12", "F3"].sort(sortAlphaNum);