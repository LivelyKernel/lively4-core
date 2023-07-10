"enable aexpr";

import {expect} from 'src/external/chai.js'
import Bindings from "src/client/bindings.js"
import Connection from "src/components/halo/Connection.js"

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


// The Halo based Connections

describe('Connections', function() {
  
  describe('connect', function() {
    it('connects event with property', async function() {
      var a = <div>A</div>
      var b = <div>B</div>
      var connection = new Connection(a, "click", b, "foo", true)
      connection.activate();
      await lively.sleep(0) // it seems to take time...

      a.dispatchEvent(new Event("click"))
      
      await lively.sleep(100) // it seems to take time...

      expect(b.foo).to.not.be.undefined();
    });
    
    it('connects event with function', async function() {
      var a = <div>A</div>
      var b = <div>B</div>
      b.func = function(v) { this.bar = v}
      
      var connection = new Connection(a, "click", b, "func", true)
      
      connection.activate();
      await lively.sleep(0) // it seems to take time...

      a.dispatchEvent(new Event("click"))
      
      await lively.sleep(100) // it seems to take time...

      expect(b.bar).to.not.be.undefined();
    });
    
    

    it('connects property with property', async function() {
      var a = <div>A</div>
      var b = <div>B</div>
      var connection = new Connection(a, "foo", b, "bar")
      connection.activate();
      await lively.sleep(0) // it seems to take time...
  
      a.foo = "hello"
      
      await lively.sleep(0) // it seems to take time...
 
      expect(b.bar).to.equal("hello");
    });
    
    it('connects property with function', async function() {
      var a = <div>A</div>
      var b = <div>B</div>
      b.func = function(v) { this.bar = v}
      
      var connection = new Connection(a, "foo", b, "func")
      
      connection.activate();
      await lively.sleep(0) // it seems to take time...

      a.foo = "hello"
      
      await lively.sleep(0) // it seems to take time...

      expect(b.bar).to.equal("hello");
    });
    
    
     it('connects style attribute with style attribute', async function() {
      var a = <div>A</div>
      var b = <div>B</div>
       
      var connection = new Connection(a, "style.width", b, "style.width")
      connection.activate();
      
      await lively.sleep(0) // it seems to take time...
  
      a.style.width = "50px"
      
       await lively.sleep(0) // it seems to take time...

      expect(b.style.width).to.equal("50px");
    });    
  })
});


