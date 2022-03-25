import {expect} from 'src/external/chai.js'


describe('Async Test', function() {
  it('works with sleep and done', async function(done) {
    
    await lively.sleep(100)
    done()
  });

  it('works with sleep without done', async function() {
    await lively.sleep(100)
  });
  
  it('calibrate rest 1', async function(done) {
    await lively.rest(50, undefined, true)
    done()
  });

  var a = 0
  
  it('interleave a', async function() {
    await lively.sleep(100)
    
    a = a + 1
    
    await lively.sleep(100)
    a = a + 1
    
    await lively.sleep(100)
    a = a + 1
    
  });

  it('interleave check side effects', async function() {
    expect(a).to.equal(3)
  });
  
  var b = 0
   
  it('interleave a', async function() {
    
    var p = Promise.resolve().then(async () => {
         
    await lively.sleep(100)
    
    b = b + 1
    
    await lively.sleep(100)
    b = b + 1
    
    await lively.sleep(100)
    b = b + 1
  })
    
  // await p
  });

  it('interleave check side effects should be faster then async...', async function() {
    expect(b).to.equal(0)
  });
  
  
  it('normal timeout', async function() {
    var c = 0
    
    // real async
    setTimeout(() => {
      c = 1
    }, 10)
    
    // but we wait for it and we feel lucky
    await lively.sleep(50)
    
    expect(c).to.equal(1)
  });
  

  it('stressed timeout', async function() {
    var c = 0
    
    // real async
    setTimeout(() => {
      c = 1
    }, 10)
    
    // generate a lot of stress here...
    // 100000 .times(() => {
    //   Math.sqrt(Math.random())
    // })
    
    Promise.resolve().then(async () => {
      
      for(var i=0; i < 1000; i++) {
        runZoned(async () => {
          // nothing
          Math.sqrt(Math.random())
        })
        var p = new Promise( resolve => {
        setTimeout(() => {
          resolve()
        }, 0)  
        })
        await p          
      }      
    })
    // but we wait for it and we feel lucky
    await lively.sleep(50)
    
    expect(c).to.equal(1)
  });
  
  it('stressed timeout after', async function() {
    var d = 0
    
    // real async
    setTimeout(() => {
      d = 1
    }, 10)
    
   
    // but we wait for it and we feel lucky
    await lively.sleep(50)
    
    expect(d).to.equal(1)
  });
  
  
  
  


});
