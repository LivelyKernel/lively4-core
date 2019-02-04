import { expect } from 'src/external/chai.js';
import TimeFrame from 'src/client/stroboscope/timeframe.js';


describe('timeframe manipulation', () => {
  it('constructor sets timestamps correctly', () => {
    var time = 10000
    
    var frame = new TimeFrame(4000, time)

    expect(frame.latest() - frame.oldest()).to.equal(time);
  });
    
  it('interpolate timestamps in timeframe', () => {
    var time = 1000
    
    var frame = new TimeFrame(4000, time)

    var oldest = frame.oldest()
    
    expect(frame.interpolate(oldest)).to.equal(0);
    expect(frame.interpolate(oldest - 1000)).to.equal(0);

    expect(frame.interpolate(oldest + 250)).to.equal(0.25);
    expect(frame.interpolate(oldest + 500)).to.equal(0.5);
    expect(frame.interpolate(oldest + 750)).to.equal(0.75);
    
    expect(frame.interpolate(oldest + time)).to.equal(1);
    expect(frame.interpolate(oldest + time + 1000)).to.equal(1);
  });
  
  it('calculate X for a timestamp', () => {
    var time = 1000
    
    var frame = new TimeFrame(4000, time)

    var oldest = frame.oldest()
    
    expect(frame.toX(oldest)).to.equal(0);
    expect(frame.toX(oldest - 1000)).to.equal(0);

    expect(frame.toX(oldest + 250)).to.equal(1000);
    expect(frame.toX(oldest + 500)).to.equal(2000);
    expect(frame.toX(oldest + 750)).to.equal(3000);
    
    expect(frame.toX(oldest + time)).to.equal(4000);
    expect(frame.toX(oldest + time + 1000)).to.equal(4000);
  });
  
  it('calculate width for two timestamps', () => {
    var time = 1000
    
    var frame = new TimeFrame(4000, time)

    var oldest = frame.oldest()
    
    expect(frame.toWidth(oldest, oldest)).to.equal(0);
    expect(frame.toWidth(oldest - 1000, oldest)).to.equal(0);

    expect(frame.toWidth(oldest, oldest + 250)).to.equal(1000);
    expect(frame.toWidth(oldest, oldest + 500)).to.equal(2000);
    expect(frame.toWidth(oldest + 250, oldest + 750)).to.equal(2000);
    
    expect(frame.toWidth(oldest, oldest + time)).to.equal(4000);
    expect(frame.toWidth(oldest, oldest + time + 1000)).to.equal(4000);
    
    expect(frame.toWidth(oldest + 500, oldest + time + 1000)).to.equal(2000);
    expect(frame.toWidth(oldest + time, oldest + time + 1000)).to.equal(0);
  });
  
  it('calculate elapsed time', () => {
    var time = 10000
    
    var frame = new TimeFrame(4000, time)
    var latest = frame.latest()

    expect(frame.elapsedSeconds(latest)).to.equal(0);
    expect(frame.elapsedSeconds(latest + 500)).to.equal(0.5);
    expect(frame.elapsedSeconds(latest + 1000)).to.equal(1);
  });
  
});