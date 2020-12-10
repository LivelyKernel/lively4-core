"enable aexpr";

import {expect} from 'src/external/chai.js'
import Bindings from "src/client/bindings.js"

/*MD # [Bindings](edit://src/client/bindings.js) Test

[TestRunner](open://lively-testrunner)


MD*/

describe('Bindings', function() {
  
  describe('connect', function() {
    it('updates right intially', async function() {
      var a = {foo: 3}
      var b = {}
      Bindings.connect(a, "foo", b, "bar")
      expect(b.bar).to.equal(3);
    });
    
    it('updates rigth after left changes', async function() {
      var a = {foo: 3}
      var b = {}
      Bindings.connect(a, "foo", b, "bar")
      a.foo = 4
      expect(b.bar).to.equal(4);
    });

    it('updates left after right changes', async function() {
      var a = {foo: 3}
      var b = {}
      Bindings.connect(a, "foo", b, "bar")
      b.bar = 5
      expect(a.foo).to.equal(5);
    });
  })
});
