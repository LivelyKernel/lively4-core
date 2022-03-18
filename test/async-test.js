import {expect} from 'src/external/chai.js'


describe('Async Test', function() {
  it('works with sleep and done', async function(done) {
    
    await lively.sleep(100)
    done()
  });
  
  
  it('works with sleep without done', async function() {
    await lively.sleep(100)
  });
});
