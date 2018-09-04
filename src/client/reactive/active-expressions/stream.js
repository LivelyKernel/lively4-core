import aexpr from 'aexpr-source-transformation-propagation';

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
    })
    
    return newStream;
  }
  zip(stream) {
    
  }
}