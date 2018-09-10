export default class CachingPromise {
  constructor(cachingFetch) {
    this.cachingFetch = cachingFetch;
  }

  trace(f) {
    var result;
    let cachingFetch = this.cachingFetch;

    let originalThen = Promise.prototype.then;
    let originalFinally = Promise.prototype.finally;
    let originalCatch = Promise.prototype.catch;

    var wrapArgs = (f) => {
      return (...cbArgs) => {
        return cachingFetch.trace(() => {
          return f(...cbArgs);
        });
      };
    };
    
    function promiseConstructorHook(p, args) {
      let wrappedArgs = args.map(wrapArgs);
      return p(...wrappedArgs)
    }
        
    // overwrite Promises only once to avoid endless loops
    if (!window.OriginalPromise) {      
      window.OriginalPromise = Promise;

      window.Promise = function Promise(...args) {
        if (this.constructorHook) {
          var p = (...rest) => {
            return new window.OriginalPromise(...rest)
          }
          return this.constructorHook(p, args)
        }
        return new window.OriginalPromise(...args)
      };
      window.Promise.prototype = window.OriginalPromise.prototype;
      window.Promise.__proto__ = window.OriginalPromise // meta-class inheritance... Promise.all should work
    }

    try {
      // Override Promise constructor
      window.Promise.prototype.constructorHook = promiseConstructorHook;

      Promise.prototype.then = function(...args) {
        let wrappedArgs = args.map(wrapArgs);
        return originalThen.apply(this, wrappedArgs);
      };

      Promise.prototype.finally = function(...args) {
        let wrappedArgs = args.map(wrapArgs);
        return originalFinally.apply(this, wrappedArgs);
      };

      Promise.prototype.catch = function(...args) {
        let wrappedArgs = args.map(wrapArgs);
        return originalCatch.apply(this, wrappedArgs);
      };

      result = f();
    } finally {
      window.Promise.prototype.constructorHook = undefined;
      Promise.prototype.then = originalThen;
      Promise.prototype.finally = originalFinally;
      Promise.prototype.catch = originalCatch;
    }

    return result;
  }
}
