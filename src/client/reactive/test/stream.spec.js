"enable aexpr";
import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Stream from 'src/client/reactive/stream.js';

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
  describe("generator interaction", function() {

    it("Stream.from(<GeneratorFunction>)", async () => {
      const s = Stream.from(function*() {
        yield 1;
        yield 2;
        yield 3;
      });

      const dataSpy = dataSpyFor(s);
      const endSpy = endSpyFor(s);

      expect(dataSpy).to.be.calledThrice;
      expect(dataSpy.withArgs(1)).to.be.calledBefore(dataSpy.withArgs(2));
      expect(dataSpy.withArgs(2)).to.be.calledBefore(dataSpy.withArgs(3));
      expect(endSpy).to.be.calledOnce;
    });

    it("Stream.from(<AsyncGeneratorFunction>)", async () => {
      const s = Stream.from(async function*() {
        yield 1;
        await lively.sleep(500)
        yield 2;
        await lively.sleep(500)
        yield 3;
      });

      const dataSpy = dataSpyFor(s);
      const endSpy = endSpyFor(s);

      expect(dataSpy).not.to.be.called;
      expect(endSpy).not.to.be.called;

      await lively.sleep(250)
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(1);
      expect(endSpy).not.to.be.called;
      dataSpy.reset();

      await lively.sleep(500)
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(2);
      expect(endSpy).not.to.be.called;
      dataSpy.reset();

      await lively.sleep(500)
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(3);
      expect(endSpy).to.be.calledOnce;
    });

    it(".asAsyncGenerator", async () => {
      let val = 0;

      const stream = new Stream();

      // already existing increments
      stream.write(val++);
      stream.write(val++);

      (async () => {
        stream.write(val++);

        await lively.sleep(10);
        stream.write(val++);

        await lively.sleep(10);
        stream.write(val++);

        await lively.sleep(10);
        stream.write(val++);

        await lively.sleep(10);
        stream.write(val++);
        stream.end();
        // executed before #final_check, because the `end` is for await loop continues executed as a new async micro task (this is why we need the `- 1` in #final_check)
        stream.write(val++);

        // test is already over
        await lively.sleep(10);
        stream.write(val++);
      })();

      let j = 0;
      for await (let v of stream.asAsyncGenerator()) {
        expect(v).to.equal(j++);
      }
      // #final_check
      expect(j).to.equal(val - 1);
    });

    it(".asAsyncGenerator can deal with multiple changes in a synchronous execution", async () => {
      let val = 0;

      const stream = new Stream();

      (async () => {
        await lively.sleep(10);
        stream.write(val++);
        stream.write(val++);
        stream.write(val++);
        stream.end();
        stream.write(val++);
      })();

      let j = 0;
      for await (let v of stream.asAsyncGenerator()) {
        expect(v).to.equal(j++);
      }
      expect(j).to.equal(3);
    });

    it("multiple .asAsyncGenerator can co-exist", async () => {
      let val = 0;

      const stream = new Stream();

      (async () => {
        await lively.sleep(10);
        stream.write(val++);
        stream.write(val++);
        stream.write(val++);
        stream.end();
        stream.write(val++);
      })();

      async function loop() {
        let j = 0;
        for await (let v of stream.asAsyncGenerator()) {
          expect(v).to.equal(j++);
        }
        return j;
      }
      
      const iterationCounts = await Promise.all((2).times(loop));
      iterationCounts.forEach(j => {
        expect(j).to.equal(3);
      });
    });

    it("Stream::transform(<AsyncGeneratorFunction>)", async () => {
      const src = new Stream();
      const dest = src.transform(async function*(gen) {
        for await (let i of gen) {
          yield i
          yield i+1
          await lively.sleep(200)
          yield i+2
          await lively.sleep(500)
          yield i+3
        }
      });

      (async () => {
        src.write(1);
        await lively.sleep(500)
        src.write(5);
        await lively.sleep(500)
        src.end();
      })();

      const dataSpy = dataSpyFor(dest);
      const endSpy = endSpyFor(dest);

      expect(dataSpy).not.to.be.called;
      expect(endSpy).not.to.be.called;

      // wait a bit
      await lively.sleep(100)
      expect(dataSpy).to.be.calledTwice;
      expect(dataSpy.withArgs(1)).to.be.calledBefore(dataSpy.withArgs(2));
      expect(endSpy).not.to.be.called;
      dataSpy.reset();

      await lively.sleep(200)
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(3);
      expect(endSpy).not.to.be.called;
      dataSpy.reset();
      
      await lively.sleep(500)
      expect(dataSpy).to.be.calledThrice;
      expect(dataSpy.withArgs(4)).to.be.calledBefore(dataSpy.withArgs(5));
      expect(dataSpy.withArgs(5)).to.be.calledBefore(dataSpy.withArgs(6));
      expect(endSpy).not.to.be.called;
      dataSpy.reset();

      await lively.sleep(200)
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(7);
      expect(endSpy).not.to.be.called;
      dataSpy.reset();
      
      await lively.sleep(500)
      expect(dataSpy).to.be.calledOnce;
      expect(dataSpy).to.be.calledWith(8);
      expect(endSpy).to.be.calledOnce;
    });
  });
});
