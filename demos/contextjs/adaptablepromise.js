// #TODO #ContextJS cannot layer constructors
if (!self.OriginalPromise) {
  self.OriginalPromise = self.Promise;
}

export default class Promise extends self.OriginalPromise {  
    constructor(...args) {
      super(...args)
      this.initialize() // we cannot refine constructors...
    }
    initialize() { }
}

self.Promise = Promise

