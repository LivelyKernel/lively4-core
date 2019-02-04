export default class TimeFrame
{
  constructor(width=400, time=30000){
    this.width = width;
    this.time = time;
    this._latest = undefined
    this._start = Date.now()
    this._latest = this._start
  }
  
  latest() {
    return this._latest
  }
  
  oldest() {
    return this._latest - this.time
  }

  interpolate(timestamp) {
    if (timestamp === undefined || timestamp >= this.latest())
      return 1
    else if (timestamp <= this.oldest())
      return 0
    else
      return 1 - ((this.latest() - timestamp) / this.time)
  }

  elapsedSeconds(timespan) {
    return (timespan - this._start) / 1000
  }
  
  toX(timestamp) {
    return this.width * this.interpolate(timestamp)
  }

  toWidth(start, end) {
    return this.toX(end) - this.toX(start)
  }
  
  update() {
    this._latest = Date.now()
  }
  
}