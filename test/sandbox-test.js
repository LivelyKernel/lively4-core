import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

import Sandbox from '../src/client/sandbox.js';


// Karma runs without a lively4 server, and loads everthing uncached... but start.html requires a server
if (!self.__karma__) {

  describe("Sandbox", function() {

    let sbPromise;
    let sb;

    before(async function before() {
      this.timeout(60 * 1000);
      sbPromise = new Sandbox();
      sb = await sbPromise
    })

    after(() => {
      sb.iframe.remove()
    })

    beforeEach(() => {
    });
    afterEach(() => {
    });

    it("Sandbox defined", () => {
      expect(Sandbox).to.exist
    });

    it("constructor returns a Promise of a Sandbox", async () => {
      expect(sbPromise).to.be.an.instanceOf(Promise)
      expect(sb).to.be.an.instanceOf(Sandbox)
    });

    it("has the same lively4url", async () => {
      expect(sb.lively4url).to.equal(lively4url)
    });

  })
}