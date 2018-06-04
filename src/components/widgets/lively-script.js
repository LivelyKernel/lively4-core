import Morph from 'src/components/widgets/lively-morph.js';
import boundEval from 'src/client/bound-eval.js';
import _ from 'src/external/lodash/lodash.js'
import { uuid as generateUuid } from 'utils'

/* Replacement for "script" tag, that supports
 *  - import module statements
 *  - extended syntax 
 * by going through or own "boundEval" that uses babel incl. our plugins
 *
 * #TODO coordinate evaluation of multiple script tags
 *
 */

export var currentScriptPromises = []

export var moduleMap = new Map()


export default class LivelyScript extends Morph {

  
  async initialize() {
    var src = this.textContent
    // console.log("LivelyScript>>initialize " + src)

    this.get("#result").innerHTML = `[pending exec script${this.id ? " " + this.id :""}]`
    var result = await this.boundEval(src)
    if (result.isError) {
      lively.showError(result.value)
    }
    
    if (result.value && result.value.then) {
      result.value = await result.value
    }
    
    
    if (result.value instanceof HTMLElement && result.value !== this) {
      this.get("#result").innerHTML = ""
      this.get("#result").appendChild(result.value)
    } else if (result.value !== undefined) {
      this.get("#result").innerHTML = "" + result.value 
    } else {
      this.get("#result").innerHTML = ""
    }
  }

  moduleFor(obj) {
    var moduleName  = moduleMap.get(obj)
    if (!moduleName) {
      moduleName = "livelyscript_" + generateUuid()
      moduleMap.set(obj, moduleName)
    }
    return moduleName
  }
  
  async boundEval(str) {
    // console.log("" + this.id + ">>boundEval " + str )
    var targetModule =  this.moduleFor(lively.findWorldContext(this)) // all scripts in one container should share scope? 
    
    var resolveMe
    if (currentScriptPromises.length > 0) {
      // console.log("script wait on " + currentScriptPromise)
      var last = _.last(currentScriptPromises); // wait on each other... scripts can only be executed sequencitally?
    }
    var myPromise = new Promise(resolve => {
      resolveMe = resolve
    })
    currentScriptPromises.push(myPromise)
    if (last) {
      // console.log("wait on last: " + last)
      await last
    }
    // console.log("" + this.id + ">>boundEval exec " + str )
    var myPromisedResult = boundEval(str, this, targetModule)
    myPromisedResult.then(() => {
      var first = currentScriptPromises.shift()
      if (first !== myPromise) {
        currentScriptPromises  = []
        throw new Error("LivelyScript execution order broken, resetting it...")
      }
      resolveMe()
    })
    return myPromisedResult
  }
}
