import {expect} from 'src/external/chai.js'
import {pt}  from 'src/client/graphics.js'
import './a.js';
import './b.js';
import './c.js';

var lively = window.lively; var it = window.it

import {MockEvent, createHTML, testWorld} from './templates/templates-fixture.js';

describe('Register Event Listeners', function() {
  var target = document.createElement("div");
  var target2 = document.createElement("div");
  var type = "click";
  var listener = function hello() { } ;
  var listener2 = function hello2() { return 3} ;
  var domain = "selection";
  var oldListeners;

  before(() => {
    oldListeners = lively.eventListeners;
  })
  
  after(() => {
    lively.eventListeners = oldListeners;
  });

  it('should register events when adding events',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener) ;
    expect(lively.eventListeners).length(1);
  });
  
  it('should unregister events of a domain',  () => {
    var removedCalled = false
    lively.eventListeners = [];
    var target1 = document.createElement("div");
    target1.removeEventListener = () => {
      removedCalled = true
    }
    
    lively.addEventListener(domain, target1, type, listener);
    lively.addEventListener("domain2", target2, type, listener);
    expect(lively.eventListeners).length(2);
    lively.removeEventListener(domain, undefined, undefined, undefined); 
    expect(lively.eventListeners).length(1);
    expect(removedCalled).to.be.true()
  });

  it('should unregister events of a target',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener)
    lively.addEventListener(domain, target2, type, listener);
    expect(lively.eventListeners).length(2);
    lively.removeEventListener(undefined, target2, undefined, undefined); 
    expect(lively.eventListeners).length(1);
  });
  
    
  it('should unregister events of a type',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener);
    lively.addEventListener(domain, target, "mousedown", listener);
    expect(lively.eventListeners).length(2);
    lively.removeEventListener(undefined, undefined, "click", undefined); 
    expect(lively.eventListeners).length(1);
  });

  it('should unregister events of a listener',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener);
    lively.addEventListener(domain, target, type, listener2);
    expect(lively.eventListeners).length(2);
    lively.removeEventListener(undefined, undefined, undefined, listener2); 
    expect(lively.eventListeners).length(1);
  });

  it('should unregister events of a listener and domain',  () => {
    lively.eventListeners = [];
    lively.addEventListener(domain, target, type, listener);
    lively.addEventListener(domain, target, type, listener2);
    lively.addEventListener(domain, target, "mousedown", listener2);
    expect(lively.eventListeners).length(3);
    lively.removeEventListener(domain, undefined, undefined, listener2); 
    expect(lively.eventListeners).length(1);
  });

});


describe('Position API', function() {
  
  before(() => {
  })

  afterEach(() => {
    testWorld().innerHTML = "";
  });
  
  describe('getPosition', function() {

    it('should return plain numbers in getter', () => {
      expect(lively.getPosition(document.querySelector('body')).x).to.be.a('number')
    })


    it('should return transform of a svg path', () => {
      var div = document.createElement("div")
      div.innerHTML = `<svg>
    <path transform='translate(100 200)' d='M 0 0 L 100 100'></path>
  </svg>`
      var path = div.querySelector("path")
      expect(lively.getPosition(path).x).to.equal(100)
    })
    
    it('should return 0,0 of a svg path with no transform', () => {
      var div = document.createElement("div")
      div.innerHTML = `<svg>
    <path transform='' d='M 0 0 L 100 100'></path>
  </svg>`
      var path = div.querySelector("path")
      expect(lively.getPosition(path).x).to.equal(0)
    })
  })
  
  describe('setPosition', function() {

    it('should set transform of a svg path', () => {
      var div = document.createElement("div")
      div.innerHTML = `<svg>
    <path transform="translate(0 0)" d='M 0 0 L 100 100'></path>
  </svg>`
      var path = div.querySelector("path")
      lively.setPosition(path, pt(100,200))
      expect(lively.getPosition(path).x).to.equal(100)
    })
    
    
    it('should set transform of a svg path with no transform', () => {
      var div = document.createElement("div")
      div.innerHTML = `<svg>
    <path d='M 0 0 L 100 100'></path>
  </svg>`
      var path = div.querySelector("path")
      // var t = path.transform.baseVal.consolidate()
      
      // t.setTranslate(100,300)
      
      // path.getAttribute("transform")
      // var p = new DOMPoint(0, 0)
      // p.matrixTransform(t)
      // t = path.transform.baseVal.consolidate().matrix
      
      
      lively.setPosition(path, pt(100,200))
      
      expect(lively.getPosition(path).x).to.equal(100)
    })
  })
  
  
  describe('setPosition fixed', function() {

    it('should keep the fixed mode', () => {
      var div = document.createElement("div")
      div.innerHTML = `foo`
      testWorld().appendChild(div)
      div.style.position = "fixed"
      
      lively.setPosition(div, pt(100,200))
      expect(div.style.position).to.equal("fixed")
      
    })
    
  })
  
  
  
})
 
describe('findDependentModules', function() {
  it('findDependentModules', async () => {
    expect(lively).itself.to.respondTo('findDependentModules');
    debugger
    let dependents = await lively.findDependentModules('test/a.js');
    expect(dependents).to.include(SystemJS.normalizeSync('test/b.js'));
    expect(dependents).to.not.include(SystemJS.normalizeSync('test/c.js'));
    
    let dependents2 = await lively.findDependentModules('test/b.js');
    expect(dependents2).to.include(SystemJS.normalizeSync('test/c.js'));
  });
  it('findDependentModules recursive', async () => {
    expect(lively).itself.to.respondTo('findDependentModules');
    
    
    
    let recursiveDependents = await lively.findDependentModules('test/a.js', true);
    expect(recursiveDependents).to.include(SystemJS.normalizeSync('test/b.js'));
    expect(recursiveDependents).to.include(SystemJS.normalizeSync('test/c.js'));
  });
});

describe('getTotalClientBounds', function() {
  
  it('return global bounds of an element', () => {
    var element = document.createElement("div");
    lively.setClientPosition(element, pt(0,0));
    lively.setExtent(element, pt(100,100))
    this.sut = element;
    document.body.appendChild(this.sut);
    var child = document.createElement("div");
    element.appendChild(child);

    lively.setPosition(child, pt(200,300));
    lively.setExtent(child, pt(300,400));

    var result= lively.getTotalClientBounds(element);
    expect(result.width).to.gt(100) // #TODO this is weired in #Travis 901 vs 500
  })
    
  after("cleanup", () => {
    this.sut && this.sut.remove()
  });
})


describe('isInBody', function() {
  
  it('should return false when not open', () => {
    var element = document.createElement("div");
    
    this.sut = element;

    expect(lively.isInBody(this.sut)).to.be.false 
  })
  
  it('should return true when open', () => {
    var element = document.createElement("div");
    
    this.sut = element;
    document.body.appendChild(this.sut);

    expect(lively.isInBody(this.sut)).to.be.true 
  })
    
  after("cleanup", () => {
    this.sut && this.sut.remove()
  });
})


describe('unloadModule', function() {
  const testModulePath = 'test/unload-test-module.js';

  beforeEach(() => {
    // Ensure clean state before each test
    window.__unloadTestModuleState = {
      executionCount: 0,
      unloadCount: 0
    };
  });

  after(async () => {
    // Clean up: unload the test module
    try {
      await lively.unloadModule(testModulePath);
    } catch(e) {
      // ignore cleanup errors
    }
    delete window.__unloadTestModuleState;
  });

  it('should call __unload__ without reloading the module', async () => {
    // Load the module for the first time
    const module = await System.import(testModulePath);
    const normalizedPath = System.normalizeSync(testModulePath);

    // Verify module was loaded once
    expect(module.getExecutionCount()).to.equal(1);
    expect(module.getUnloadCount()).to.equal(0);

    // Store execution count before unload
    const executionCountBeforeUnload = module.getExecutionCount();

    // Unload the module
    await lively.unloadModule(testModulePath);

    // Verify __unload__ was called
    expect(window.__unloadTestModuleState.unloadCount).to.equal(1);

    // Verify module was NOT reloaded during unload (execution count should stay the same)
    expect(window.__unloadTestModuleState.executionCount).to.equal(executionCountBeforeUnload);

    // Verify module was removed from SystemJS registry
    expect(System.get(normalizedPath)).to.be.undefined;
  });

  it('should handle unloading a module that is not loaded', async () => {
    const nonExistentPath = 'test/non-existent-module-xyz.js';

    // Should not throw when unloading a non-existent module
    await lively.unloadModule(nonExistentPath);

    // Should successfully complete without errors
    expect(true).to.be.true;
  });

  it('should handle modules without __unload__ hook', async () => {
    // Use an existing simple test module without __unload__
    const simplePath = 'test/a.js';
    await System.import(simplePath);

    // Should not throw when unloading a module without __unload__
    await lively.unloadModule(simplePath);

    const normalizedPath = System.normalizeSync(simplePath);
    expect(System.get(normalizedPath)).to.be.undefined;
  });
})

describe('Module Loading Exclusion', function() {
  
  it('should identify grammarly components for exclusion', () => {
    const grammarlyElement = document.createElement('grammarly-editor-plugin');
    expect(lively.shouldExcludeFromModuleLoading(grammarlyElement)).to.be.true;
  });
  
  it('should not identify script elements for exclusion', () => {
    const scriptElement = document.createElement('script');
    expect(lively.shouldExcludeFromModuleLoading(scriptElement)).to.be.false;
  });
  
  it('should not identify lively-preferences for exclusion', () => {
    const preferencesElement = document.createElement('lively-preferences');
    expect(lively.shouldExcludeFromModuleLoading(preferencesElement)).to.be.false;
  });
  
  it('should not identify regular lively components for exclusion', () => {
    const containerElement = document.createElement('lively-container');
    expect(lively.shouldExcludeFromModuleLoading(containerElement)).to.be.false;
  });
  
  it('should not identify regular elements for exclusion', () => {
    const divElement = document.createElement('div');
    expect(lively.shouldExcludeFromModuleLoading(divElement)).to.be.false;
  });
  
  it('should handle null and undefined gracefully', () => {
    expect(lively.shouldExcludeFromModuleLoading(null)).to.be.false;
    expect(lively.shouldExcludeFromModuleLoading(undefined)).to.be.false;
  });
  
  it('allElements should include grammarly components (generic collection)', () => {
    const testContainer = document.createElement('div');
    const grammarlyElement = document.createElement('grammarly-extension');
    const regularDiv = document.createElement('div');
    
    testContainer.appendChild(grammarlyElement);
    testContainer.appendChild(regularDiv);
    
    const allElements = lively.allElements(false, testContainer);
    
    // allElements is generic and should include everything
    expect(Array.from(allElements).includes(grammarlyElement)).to.be.true;
    expect(Array.from(allElements).includes(regularDiv)).to.be.true;
    expect(Array.from(allElements).includes(testContainer)).to.be.true;
  });
})



  
  