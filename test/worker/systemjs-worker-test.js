
import SystemjsWorker from "src/worker/systemjs-worker.js"

import {expect} from 'src/external/chai.js';

describe('SystemJSWorker', () => {
  
  
  describe('onmessage and postMessage', () => {
    let myworker
    before(async () => {  
      myworker = new SystemjsWorker(lively4url + "/test/worker/systemjs-worker-test-sum-worker.js")

      await myworker.loaded
    })
    
    it('sums', async () => {
      var wasrun = false
      myworker.onmessage = (evt) => {
        wasrun = true
        expect(evt.data).equals(7)
      }
      myworker.postMessage([3, 4]);

      await lively.sleep(1) // not directly connected yet
      
      expect(wasrun, "wasrun").equals(true)
      
    })
    after(() => {  
       myworker.terminate()
    })
    
  })
  
  describe('request from system to worker', () => {
    let myworker
    before(async () => {  
      myworker = new SystemjsWorker(lively4url + "/test/worker/systemjs-worker-test-sum-request-worker.js")

      await myworker.loaded
    })
    
    it('sums', async () => {
      
      var result = await myworker.postRequest("sum", 3, 4);

      expect(result, "result").equals(7)  
    })
    
    after(() => {  
        myworker.terminate()
    })
  })
  
  describe('request from worker to system', () => {
    let myworker
    
    before(async () => {  
      myworker = new SystemjsWorker(lively4url + "/test/worker/systemjs-worker-test-inverse-request-worker.js")

      await myworker.loaded
      
      myworker.onrequest = (param) => {
        if (param === "a") return 3
        if (param === "b") return 4
        throw Error("Message " + param + " not understood")
      }
    })
    
    it('sums', async () => {
      
      var result = await myworker.postRequest("sum");

      expect(result, "result").equals(7)  
    })
    
    after(() => {  
        myworker.terminate()

    })
  })
  
  
  
  describe('timeout', () => {
    let myworker
    before(async () => {  
      myworker = new SystemjsWorker(lively4url + "/test/worker/systemjs-worker-test-timeout-worker.js")

      await myworker.loaded
    })
  
    
    it('throws an error', async () => {
      
      myworker.timeout = 100
      
      let error, result
      let errorWasThrown = false
      try {
        result = await myworker.postRequest("nothing?");
        
      } catch(e) {
        errorWasThrown = true
        error = e
        expect("" + error).match(/timeout/)  
      }
      expect(result).to.be.undefined
      expect(errorWasThrown, "error was thrown").to.be.true
    })
    
    
    after(() => {  
        myworker.terminate()
    })
  })
});