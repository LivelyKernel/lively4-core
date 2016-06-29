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
      //let callerName = arguments.callee; //arguments.callee.caller.name;
      //let re = /(\w+)@|at (\w+) \(/g;
      //let aRegexResult = re.exec(new Error().stack);
      //let callerName = aRegexResult[1] || aRegexResult[2];
      let callerName = new Error().stack;
      
      console.log(this.name + '::' + callerName);
      args.forEach(function(text) {
        console.log(text);  
      }, this);
    }
  }
  
  warn() {
    let args = Array.prototype.slice.call(arguments);
    args.forEach(function(text) {
      console.warn(text);
    });
  }
}