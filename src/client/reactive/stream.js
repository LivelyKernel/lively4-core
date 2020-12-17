import aexpr from 'active-expression-rewriting';

const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor
const AsyncGeneratorFunction = Object.getPrototypeOf(async function*(){}).constructor

export default class Stream {
  constructor(source) {
    this._ended = false;
    this._data = [];
    this._dataCallbacks = [];
    this._endCallbacks = [];
    this._downstream = [];
    
    // #TODO: source processing
  }
  
  write(d) {
    if(this._ended) { return; }
    
    this._data.push(d);
    this._dataCallbacks.forEach(cb => cb(d));
    this._downstream.forEach(stream => stream.write(d));
  }
  end() {
    if(this._ended) { return; }
    
    this._ended = true;
    this._endCallbacks.forEach(cb => cb());
    this._downstream.forEach(stream => stream.end());
  }
  
  /**
   * @param type = {data, end, error}
   */
  on(type, callback) {
    if(type === 'data') {
      this._dataCallbacks.push(callback);
      this._data.forEach(d => callback(d));
    }
    if(type === 'end') {
      this._endCallbacks.push(callback);
      if(this._ended) {
        callback();
      }
    }
    
    return this;
  }
  pipe(dest) {
    this._downstream.push(dest)
    
    this._data.forEach(d => dest.write(d));
    if(this._ended) {
      dest.end();
    }
    
    return dest;
  }
  
  map(fn) {
    const newStream = new Stream();
    
    this.on('data', d => {
      newStream.write(fn(d));
    });
    this.on('end', () => {
      newStream.end();
    });
    
    return newStream;
  }
  zip(...inputStreams) {
    const newStream = new Stream();
    
    const streams = [this, ...inputStreams];
    let cursor = 0;
    
    function pushDownstream() {
      while(streams.every(stream => stream._data.length > cursor)) {
        newStream.write(streams.map(stream => stream._data[cursor]));
        cursor++;
      }
    }
    
    // should end the newStream when the cursor reaches the minimum data length of any ended input stream
    function checkEndCondition() {
      let minLengthOfEndedStreams = Infinity;
      streams.forEach(stream => {
        if(stream._ended) {
          minLengthOfEndedStreams = Math.min(minLengthOfEndedStreams, stream._data.length);
        }
      });
      if(minLengthOfEndedStreams <= cursor) {
        newStream.end();
      }
    }

    function updateDownstream() {
      pushDownstream();
      checkEndCondition();
    }
    
    streams.forEach(stream => stream.on('data', updateDownstream));
    streams.forEach(stream => stream.on('end', updateDownstream));
    
    return newStream;
  }
  
  static from(thing, ...args) {
    const newStream = new Stream();

    if (thing instanceof GeneratorFunction) {
      for (let item of thing()) {
        newStream.write(item);
      }
      newStream.end();
    } else if (thing instanceof AsyncGeneratorFunction) {
      (async () => {
        for await (let item of thing()) {
          newStream.write(item);
        }
        newStream.end();
      })();
    }

    return newStream;
  }
  
  asAsyncGenerator() {
    const that = this;
    let currentItemIndex = 0;
    
    let gotNewValue;
    let waitForValue;
    function resetWaitForValue() {
      waitForValue = new Promise(resolve => {
        gotNewValue = resolve;
      });
    }
    resetWaitForValue();

    let signalEnd;
    const waitForEnd = new Promise(resolve => {
      signalEnd = resolve;
    })
    
    this.on('data', () => {
      const temp = gotNewValue;
      resetWaitForValue();
      temp();
    });
    this.on('end', () => {
      signalEnd()
    });

    async function* genFunc() {

      while (true) {
        while (that._data.length > currentItemIndex) {
          yield that._data[currentItemIndex++];
        } 
        
        const done = await Promise.race([waitForValue.then(() => false), waitForEnd.then(() => true)]);
        if (done) {
          return;
        }
      }
    }
    
    return genFunc();
  }
  
  transform(genFunc) {
    const that = this;
    const newStream = new Stream();

    (async function() {
      for await (let i of genFunc(that.asAsyncGenerator())) {
        newStream.write(i);
      }
      newStream.end();
    })()
    
    return newStream;
  }
  
}
