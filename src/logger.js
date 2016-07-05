export class Logger {
  constructor(options) {
    this.options = this.parseOptions(options);
    this.name = '';// arguments.callee.caller.name;
  }
  
  parseOptions(options) {
    options = options || {};
    
    if(options.debug === undefined) {
      options.debug = false;
    }
    
    return options;
  }
  
  log() {
    if(this.options.debug === true) {
      let args = Array.prototype.slice.call(arguments);
      
      console.log(this.getCaller());
      console.log.apply(null, args);
    }
  }
  
  warn() {
    let args = Array.prototype.slice.call(arguments);
    
    console.log(this.getCaller());
    console.warn.apply(null, args);
  }
  
  trap() {
    if (this.options.debug === true) {
      debugger;
    }
  }
  
  getCaller() {
      let re = /@|at (\w+).(\w+) \(/g;
      re.exec(new Error().stack);
      re.exec(new Error().stack);
      let aRegexResult = re.exec(new Error().stack);
      
      let className = aRegexResult[1];
      let callerName = aRegexResult[2];
      
      return className + '::' + callerName;
    }
}