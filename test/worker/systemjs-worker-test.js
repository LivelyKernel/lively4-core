
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
  
  describe('request', () => {
    let myworker
    before(async () => {  
      myworker = new SystemjsWorker(lively4url + "/test/worker/systemjs-worker-test-sum-request-worker.js")

      await myworker.loaded
    })
    
    it('sums', async () => {
      
      var result = await myworker.request("sum", [3, 4]);

      expect(result, "result").equals(7)  
    })
    after(() => {  
        myworker.terminate()
    })
  })
});