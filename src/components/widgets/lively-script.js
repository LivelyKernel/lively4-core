import Morph from 'src/components/widgets/lively-morph.js';
import boundEval from 'src/client/bound-eval.js';
import _ from 'src/external/lodash/lodash.js'
import { uuid as generateUuid, waitForDeepProperty } from 'utils'

import {stripErrorString} from "src/components/widgets/lively-code-mirror.js"


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
    
  }
  
  
  // evalute script not when the component is initialized, but when it is actually in the DOM
  async attachedCallback() {
    // console.log("SCRIPT attached ", lively.findWorldContext(this))
    var src = this.textContent
    // console.log("LivelyScript>>initialize " + src)

    this.get("#result").innerHTML = `[pending exec script${this.id ? " " + this.id :""}]`
    var result = await this.boundEval(src)
    if (result.isError) {
      this.get("#result").innerHTML = "<lively-error><pre>" + stripErrorString(result.value).replace(/</g,"&lt;") + "</pre></lively-error>" 
      return 
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
  

  async moduleFor(obj) {
    var moduleName  = moduleMap.get(obj)
    if (!moduleName) {
      var container = lively.query(this, "lively-container")
      if (container) {
        
        await waitForDeepProperty(container, "getURL")
        container.livelyScriptContainerId = container.livelyScriptContainerId || generateUuid()
        
        // all scripts in one container share the same module... but a second container will get a different module
        moduleName = (container.getURL() || lively4url).toString() + "_" +container.livelyScriptContainerId
      } else {
        // no container, so we assume lively4 as root
        moduleName = lively4url + "/livelyscript_" + generateUuid() // so that some relative urls work...
      }
      moduleMap.set(obj, moduleName)
    }
    return moduleName
  }
  
  async boundEval(str) {
    // console.log("" + this.id + ">>boundEval " + str )
    var worldContext = lively.findWorldContext(this)
    
    
    if (worldContext) {
      // #Bug we are not yet in a body or shadow-root
      console.warn("Executing lively-script without world context" , this)
    }
    
    var targetModule =  await this.moduleFor(worldContext) // all scripts in one container should share scope? 
    
    //console.log("[lively-script] worldContext: " + worldContext + " targetModule: ", targetModule)
    
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
    console.log("" + this.id + ">>boundEval " + "targetModule: " + targetModule + "\n exec: \"" + str + '"', )
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
  
  toString() {
    return "[LivelyScript]"
  }
  
  livelyExample() {
    this.textContent = "3 + 4"
    this.initialize()
  }
  
  
}
