"disable deepeval"

/*
 * And here it is... the utitly class for awesome string manipulation!
 * #Design what are standard libraries for string manipulation? Underscore etc?
 */

export default class Strings {
  
  static toUpperCaseFirst(s) {
    if (!s || s.length == 0 ) return s
    return s[0].toUpperCase() + s.slice(1)
  }
  
  static toCamelCase(string, delimiter = " ") {
    return string
      .split(delimiter)
      .map((ea, index) => index === 0 ? ea : this.toUpperCaseFirst(ea))
      .join("")
  }
  
  static prefixSelector(prefix, s) {
    return prefix + this.toUpperCaseFirst(s)
  }
  
  static matchAll(regExString, s) {
    var all  =[]
    var regEx = new RegExp(regExString, "gs")
    do {
      var m = regEx.exec(s)
      if (m) all.push(m)
    } while(m)
    return all
  }

  /* matches one, and call func with it */
  static matchDo(regExString, s, func) {
    var m = s.match(regExString)
    if (m) {
      return func.call(...m)
    }
  }

  static indent(s, level = 1, prefix = "  ") {
    for(let i=0; i < level; i++) { s = prefix + s}
    return s
  }
  
  static matchAllDo(regExString, s, func) {
    var regEx = new RegExp(regExString, "g")
    do {
      var m = regEx.exec(s)
      if (m)  func.call(...m)
    } while(m)
  }
  
  /* source: https://www.w3resource.com/javascript-exercises/javascript-array-exercise-28.php */
  static longestCommonPrefix(arr1){
    const arr= arr1.concat().sort();
    const a1= arr[0];
    const a2= arr[arr.length-1];
    const L= a1.length;
    let i= 0;
    while(i< L && a1.charAt(i)=== a2.charAt(i)) i++;
    return a1.substring(0, i);
  }
    
  /* source: https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex */  
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
    
  static fixUmlauts(value) {
    value = value.replace(/ä/g, 'ae');
    value = value.replace(/ö/g, 'oe');
    value = value.replace(/ü/g, 'ue');
    value = value.replace(/ß/g, 'ss');
    value = value.replace(/Ä/g, 'Ae');
    value = value.replace(/Ö/g, 'Oe');
    value = value.replace(/Ü/g, 'Ue');
    return value;
  }  
}
  
  
