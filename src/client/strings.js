/*
 * And here it is... the utitly class for awesome string manipulation!
 * #Design what are standard libraries for string manipulation? Underscore etc?
 */

export default class Strings {
  
  static toUpperCaseFirst(s) {
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
    var regEx = new RegExp(regExString, "g")
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
      return func.call(m[0],m[1],m[2],m[3],m[4],m[5],m[6],m[7],m[8])
    }
  }

  static matchAllDo(regExString, s, func) {
    var regEx = new RegExp(regExString, "g")
    do {
      var m = regEx.exec(s)
      if (m)  func.call(m[0],m[1],m[2],m[3],m[4],m[5],m[6],m[7],m[8])
    } while(m)
  }

  
}
