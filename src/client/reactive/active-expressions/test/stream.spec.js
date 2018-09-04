"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Stream from 'src/client/reactive/active-expressions/stream.js';

describe("Streams", function() {
  
  function dataSpyFor(stream) {
    const dataSpy = sinon.spy();
    stream.on('data', dataSpy);
    return dataSpy;
  }
  
  function endSpyFor(stream) {
    const endSpy = sinon.spy();
    stream.on('end', endSpy);
    return endSpy;
  }
  
  it("is defined", () => {
    expect(Stream).to.be.ok;
  });
  describe("simple streaming", function() {
    it("`.on` in chainable", () => {
      const s = new Stream();

      const result = s.on('data', () => {});
      expect(result).to.equal(s);
    });

    it("streams data (setup listeners beforehand)", () => {
      const s = new Stream();
      const dataSpy = dataSpyFor(s);
      const endSpy = endSpyFor(s);
      
      expect(dataSpy).not.to.be.called;
      expect(endSpy).not.to.be.called;

      s.write(1);
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(1);
      dataSpy.reset();
      expect(endSpy).not.to.be.called;
      
      s.write(2);
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(2);
      dataSpy.reset();
      expect(endSpy).not.to.be.called;
      
      s.end();
      expect(dataSpy).not.to.be.called;
      expect(endSpy).to.be.calledOnce;
    });

    it("streams data (setup listeners afterwards)", () => {
      const s = new Stream();
      s.write(1);
      s.write(2);
      s.end();
      
      const dataSpy = dataSpyFor(s);
      const endSpy = endSpyFor(s);
      
      expect(dataSpy).to.be.calledTwice;
      expect(dataSpy.withArgs(1)).to.be.calledBefore(dataSpy.withArgs(2));
      expect(dataSpy.withArgs(2)).to.be.calledBefore(endSpy);
      expect(endSpy).to.be.calledOnce;
    });
    
    it("ended streams still emit previously stored data", () => {
      const s = new Stream();
      s.write(1);
      s.end();

      const dataSpy = dataSpyFor(s);
      
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(1);
      dataSpy.reset();
      
      s.write(2);
      expect(dataSpy).not.to.be.called;
    });
    
    it("ended streams do not emit further data", () => {
      const s = new Stream();
      s.end();

      const dataSpy = dataSpyFor(s);
      const endSpy = endSpyFor(s);
      
      expect(dataSpy).not.to.be.called;
      expect(endSpy).to.be.calledOnce;

      s.write(1);
      expect(dataSpy).not.to.be.called;
      
      const lateDataSpy = dataSpyFor(s);
      expect(lateDataSpy).not.to.be.called;
    });
    
    it("streams end only once", () => {
      const s = new Stream();
      s.end();

      const endSpy = endSpyFor(s);
      
      expect(endSpy).to.be.calledOnce;
      endSpy.reset();

      s.end();
      expect(endSpy).not.to.be.called;
      
      const secondEndSpy = endSpyFor(s);
      expect(secondEndSpy).to.be.calledOnce;
    });
  });
  
  describe("pipe", function() {
    it("returns the destination stream (chaining)", () => {
      const dest = new Stream();
      const result = new Stream().pipe(dest);

      expect(result).to.equal(dest);
    });
    
    it("write data already present to the destination stream", () => {
      const src = new Stream();
      const dest = new Stream();

      const dataSpy = dataSpyFor(dest);
      const endSpy = endSpyFor(dest);

      src.write(1);
      src.end();

      src.pipe(dest);
      
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(1);
      expect(endSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledBefore(endSpy);
    });
    
    it("pipes data to the destination stream", () => {
      const src = new Stream();
      const dest = new Stream();
      src.pipe(dest);

      const dataSpy = dataSpyFor(dest);
      const endSpy = endSpyFor(dest);

      expect(dataSpy).not.to.be.called;
      expect(endSpy).not.to.be.called;

      src.write(1);
      
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(1);
      dataSpy.reset();
      expect(endSpy).not.to.be.called;
      
      src.end();
      
      expect(dataSpy).not.to.be.called;
      expect(endSpy).to.be.calledOnce;
    });
  });
  
  describe("transformations", function() {
    it("map", () => {
      const src = new Stream();

      src.write(1);

      const dest = src.map(d => d + "test");

      const dataSpy = dataSpyFor(dest);
      const endSpy = endSpyFor(dest);
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith('1test');
      dataSpy.reset();
      expect(endSpy).not.to.be.called;
      
      src.write(2);
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith('2test');
      dataSpy.reset();
      expect(endSpy).not.to.be.called;

      src.end();
      expect(dataSpy).not.to.be.called;
      expect(endSpy).to.be.calledOnce;
      endSpy.reset();

      src.write(3);
      expect(dataSpy).not.to.be.called;
      expect(endSpy).not.to.be.called;
    });

    describe("zip", function() {
    
      it("zip two streams", () => {
        const src1 = new Stream();
        const src2 = new Stream();

        const dest = src1.zip(src2);

        const dataSpy = dataSpyFor(dest);
        const endSpy = endSpyFor(dest);

        expect(dataSpy).not.to.be.called;
        expect(endSpy).not.to.be.called;

        src1.write(1);
        expect(dataSpy).not.to.be.called;
        expect(endSpy).not.to.be.called;

        src1.write(2);
        expect(dataSpy).not.to.be.called;
        expect(endSpy).not.to.be.called;

        src2.write('a');
        expect(dataSpy).to.be.calledOnce;
        expect(dataSpy).to.be.calledWith([1,'a']);
        dataSpy.reset();
        expect(endSpy).not.to.be.called;

        src1.write(3);
        expect(dataSpy).not.to.be.called;
        expect(endSpy).not.to.be.called;

        src2.write('b');
        expect(dataSpy).to.be.calledOnce;
        expect(dataSpy).to.be.calledWith([2,'b']);
        dataSpy.reset();
      });
      
      it("immediately pushes data already on input streams", () => {
        const src1 = new Stream();
        src1.write(1);
        src1.write(2);
        src1.write(3);
        
        const src2 = new Stream();
        src2.write('a');
        src2.write('b');

        const dest = src1.zip(src2);
        const dataSpy = dataSpyFor(dest);
        const endSpy = endSpyFor(dest);

        expect(dataSpy).to.be.calledTwice;
        expect(dataSpy.withArgs([1,'a'])).to.be.calledBefore(dataSpy.withArgs([2,'b']));
        expect(endSpy).not.to.be.called;
      });
      
      it("end a zipped stream early", () => {
        const src1 = new Stream();
        const src2 = new Stream();

        const dest = src1.zip(src2);
        const dataSpy = dataSpyFor(dest);
        const endSpy = endSpyFor(dest);

        src1.write(1);
        src1.end();

        expect(dataSpy).not.to.be.called;
        expect(endSpy).not.to.be.called;

        src2.write('a');
        
        expect(dataSpy).to.be.calledOnce;
        expect(dataSpy).to.be.calledWith([1, 'a']);
        expect(endSpy).to.be.calledOnce;
      });
      
      
      it("handles more than two streams", () => {
        const src1 = new Stream();
        const src2 = new Stream();
        const src3 = new Stream();

        const dest = src1.zip(src2, src3);
        const dataSpy = dataSpyFor(dest);
        const endSpy = endSpyFor(dest);

        src1.write(1);
        src1.write(2);
        src2.write('a');

        expect(dataSpy).not.to.be.called;
        expect(endSpy).not.to.be.called;

        src3.write('hello');

        expect(dataSpy).to.be.calledOnce;
        expect(dataSpy).to.be.calledWith([1, 'a', 'hello']);
        dataSpy.reset();
        expect(endSpy).not.to.be.called;
        
        src3.write('world');
        
        expect(dataSpy).not.to.be.called;
        expect(endSpy).not.to.be.called;

        src2.write('b');

        expect(dataSpy).to.be.calledOnce;
        expect(dataSpy).to.be.calledWith([2, 'b', 'world']);
        dataSpy.reset();
        expect(endSpy).not.to.be.called;
        
        src2.end();

        expect(dataSpy).not.to.be.called;
        expect(endSpy).to.be.calledOnce;
      });
    });
  });
});
