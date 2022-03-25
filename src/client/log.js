import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js'

export default class Log {
  
  static rest(time, waited, logging) {
    if (logging) {
      console.log("STATS: AEexps: " + AExprRegistry.allAsArray().length)
    }
    return lively.rest(time, waited, logging)
  }
  
  
  
}