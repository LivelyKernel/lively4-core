'use strict';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import CachingPromise from './../../src/base/caching-promise.js';

class Traceable {
  constructor(spy) {
    this.spy = spy;
  }

  trace(f) {
    try {
      f();
    } finally {
      this.spy();
    }
  }
}

describe('Caching Promise', () => {
  it("works with then", () => {
    let spy = sinon.spy();
    let traceable = new Traceable(spy);
    let cachingPromise = new CachingPromise(traceable);

    return new Promise((resolve, reject) => {
      resolve();
    }).then(() => {
      return 42;
    }).then(() => {
      expect(spy).not.to.be.called;
    }).then(() => {
      return cachingPromise.trace(() => {
        return new Promise((resolve, reject) => {
          resolve();
        }).then(() => {
          
        }).then(() => {
          expect(spy).to.be.called;
        });
      });
    });
  });

  it("works with finally", (done) => {
    let spy = sinon.spy();
    let traceable = new Traceable(spy);
    let cachingPromise = new CachingPromise(traceable);

    new Promise((resolve, reject) => {
      resolve();
    }).finally(() => {
      expect(spy).not.to.be.called;
    }).finally(() => {
      return cachingPromise.trace(() => {
        return new Promise((resolve, reject) => {
          resolve();
        }).finally(() => {
        }).finally(() => {
          expect(spy).to.be.called;
          done();
        });
      });
    });
  });

  it("works with catch", (done) => {
    let spy = sinon.spy();
    let traceable = new Traceable(spy);
    let cachingPromise = new CachingPromise(traceable);

    new Promise((resolve, reject) => {
      reject('reason');
    }).catch((reason) => {
      throw reason;
    }).catch((reason) => {
      expect(spy).not.to.be.called;

      return cachingPromise.trace(() => {
        return new Promise((resolve, reject) => {
          reject('reason');
        }).catch((reason) => {
          throw reason;
        }).catch((reason) => {
          expect(spy).to.be.called;
          done();
        });
      });
    });
  });
  
  it("works with Promise.all", (done) => {
    let spy = sinon.spy();
    let traceable = new Traceable(spy);
    let cachingPromise = new CachingPromise(traceable);
    let firstPromise = new Promise((resolve) => resolve());
    let secondPromise = new Promise((resolve) => resolve());
    
    Promise.all([firstPromise, secondPromise]).then(value => {
      return value;
    }).then(value => {
      expect(spy).not.to.be.called;
      
      return cachingPromise.trace(() => {
        return Promise.all([firstPromise, secondPromise]).then(value => {
          return value;
        }).then(value => {
          expect(spy).to.be.called;
          done();
        })
      });
    });
  });
  
  it("works with Promise.race", (done) => {
    let spy = sinon.spy();
    let traceable = new Traceable(spy);
    let cachingPromise = new CachingPromise(traceable);
    let firstPromise = new Promise((resolve) => resolve());
    let secondPromise = new Promise((resolve) => resolve());
    
    Promise.race([firstPromise, secondPromise]).then(value => {
      return value;
    }).then(value => {
      expect(spy).not.to.be.called;
      
      return cachingPromise.trace(() => {
        return Promise.race([firstPromise, secondPromise]).then(value => {
          return value;
        }).then(value => {
          expect(spy).to.be.called;
          done();
        })
      });
    });
  });
  
  it("works with Promise.resolve", (done) => {
    let spy = sinon.spy();
    let traceable = new Traceable(spy);
    let cachingPromise = new CachingPromise(traceable);
    
    Promise.resolve(42).then(value => {
      return value;
    }).then(value => {
      expect(spy).not.to.be.called;
      
      return cachingPromise.trace(() => {
        return Promise.resolve(42).then(value => {
          return value;
        }).then(value => {
          expect(spy).to.be.called;
          done();
        })
      });
    });
  });
  
  it("works with Promise.reject", (done) => {
    let spy = sinon.spy();
    let traceable = new Traceable(spy);
    let cachingPromise = new CachingPromise(traceable);
    
    Promise.reject('error').catch(value => {
      expect(spy).not.to.be.called;
      
      return cachingPromise.trace(() => {
        return Promise.reject('error').catch(value => {
          throw value;
        }).catch(value => {
          expect(spy).to.be.called;
          done();
        })
      });
    });
  });
  
  it("works with new Promise", (done) => {
    let spy = sinon.spy();
    let traceable = new Traceable(spy);
    let cachingPromise = new CachingPromise(traceable);

    new Promise((resolve, reject) => {
      resolve();
    }).then(() => {
      expect(spy).not.to.be.called;

      return cachingPromise.trace(() => {
        return new Promise((resolve, reject) => {
          resolve();
        }).then(() => {
          expect(spy).to.be.called;
          done();
        });
      });
    });
  });
});
