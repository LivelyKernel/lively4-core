/*
 * And here it is... the utitly class for awesome string manipulation!
 * #Design what are standard libraries for string manipulation? Underscore etc?
 */

export default class Strings {
  
  static toUpperCaseFirst(s) {
    return s[0].toUpperCase() + s.slice(1)
  }
  
  static prefixSelector(prefix, s) {
    return prefix + this.toUpperCaseFirst(s)
  }
  
  static matchAll(regExString, s) {
    var all  =[]
    var regEx = new RegExp(regExString, "g")
    do {
      var m = regEx.exec(s)
      if (m) all.push(m)
    } while(m)
    return all
  }
}
