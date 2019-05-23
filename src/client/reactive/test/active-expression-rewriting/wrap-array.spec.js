// 'enable aexpr';
'use strict';

import { using, isFunction } from 'utils';

import chai, {expect} from 'src/external/chai.js';
import sinon from 'src/external/sinon-3.2.1.js';
import sinonChai from 'src/external/sinon-chai.js';
chai.use(sinonChai);

const hook = {
  notifyFuncCalled(arr, prop, ...args) {
    lively.notify(prop)
  },
  notifyProp(arr, prop, getSet, val) {
    
  },
}

function getPrototypeDescriptors(obj) {
  const proto = obj.constructor.prototype;

  const descriptors = Object.getOwnPropertyDescriptors(proto);
  return Object.entries(descriptors).map(([key, desc]) => (desc.key = key, desc))
}

function wrapProperty(obj, descriptor, after) {
  Object.defineProperty(obj, descriptor.key, Object.assign({}, descriptor, {
    value(...args) {
      try {
        return descriptor.value.apply(this, args);
      } finally {
        after.call(this, ...args)
      }
    }
  }));
}

function monitorProperties(obj) {
  const prototypeDescriptors = getPrototypeDescriptors(obj);
  Object.entries(Object.getOwnPropertyDescriptors(obj)); // unused -> need for array

  prototypeDescriptors.forEach(descriptor => {
    // var descriptor = prototypeDescriptors.find(d => d.key === 'add')
    if (descriptor.value) {
      if (isFunction(descriptor.value)) {
        wrapProperty(obj, descriptor, function(...args) {
          // #HACK #TODO we need an `withoutLayer` equivalent here
          if (window.__compareAExprResults__) { return; }

          this; // references the modified container
          hook.notifyFuncCalled(this, descriptor.key, ...args);
        });
      } else {
        console.warn(`Property ${descriptor.key} has a value that is not a function, but ${descriptor.value}.`)
      }
    } else {
      console.warn(`Property ${descriptor.key} has no value.`)
    }
  });
}


function wrapArray(arr) {
  monitorProperties(arr);
  return arr;
  
  // Object.defineProperty(arr, 0)

  const internal = Array.from(arr);

  arr.length = 0;

  const proxy = new Proxy(internal, {
    // A trap for Object.getPrototypeOf.
    getPrototypeOf: function(target) {
      return Reflect.getPrototypeOf(target);
    },
    // A trap for Object.setPrototypeOf.
    setPrototypeOf: function(target, prototype) {
      return Reflect.setPrototypeOf(target, prototype);
    },
    // A trap for Object.isExtensible.
    isExtensible: function(target) {
      return Reflect.isExtensible(target);
    },
    // A trap for Object.preventExtensions.
    preventExtensions: function(target) {
      return Reflect.preventExtensions(target)
    },
    // A trap for Object.getOwnPropertyDescriptor.
    getOwnPropertyDescriptor: function(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
    // A trap for Object.defineProperty.
    defineProperty: function(target, prop, descriptor) {
      return Reflect.defineProperty(target, prop, descriptor)
    },
    // A trap for the in operator.
    has: function(target, prop) {
      return Reflect.has(target, prop);
    },
    // A trap for getting property values.
    get: function(target, prop, receiver) {
      lively.notify('GET ' + whatIsWhat.get(receiver))
      return Reflect.get(target, prop, receiver);
    },
    // A trap for setting property values.
    set: function(target, property, value, receiver) {
      lively.notify('SET ' + whatIsWhat.get(receiver))
      return Reflect.set(target, property, value, receiver);
    },
    // A trap for the delete operator.
    deleteProperty: function(target, property) {
      return Reflect.deleteProperty(target, property)
    },
    // A trap for Object.getOwnPropertyNames and Object.getOwnPropertySymbols.
    ownKeys: function(target) {
      return Reflect.ownKeys(target)
    },
    // A trap for a function call.
    apply: function(target, thisArgument, argumentsList) {
      return Reflect.apply(target, thisArgument, argumentsList)
    },
    // A trap for the new operator.
    construct: function(target, argumentsList, newTarget) {
      return Reflect.construct(target, argumentsList, newTarget)
    },
  });
  const whatIsWhat = new Map();
  whatIsWhat.set(arr, 'original');
  whatIsWhat.set(internal, 'internal');
  whatIsWhat.set(proxy, 'proxy');

  Object.setPrototypeOf(arr, proxy);
  
  arr.length = internal.length;
  
  return arr;
}

//---------------------------------------------------
//---------------------------------------------------
//---------------------------------------------------
//---------------------------------------------------
//---------------------------------------------------

function test(name, fn) {
  it(name, () => fn({
    get arr012() { return wrapArray([0,1,2]); },
    get _arr012() { return [0,1,2]; },
    get spy() { return sinon.spy(); },
  }));
}

describe('Arrays as Data Structures', () => {

  test('read 0', ({ arr012 }) => {
    expect(arr012[0]).to.equal(0);
  });

  test('write 4', ({ arr012 }) => {
    arr012[4] = 4;
    
    expect(arr012.length).to.equal(5);
    expect(arr012[3]).to.equal(undefined);
    expect(arr012[4]).to.equal(4);
  });

  test('read first', ({ arr012 }) => {
    expect(arr012.first).to.equal(0);
  });

  test('write first', ({ arr012 }) => {
    arr012.first = 'first';

    expect(arr012.first).to.equal('first');
  });

  test('read last', ({ arr012 }) => {
    expect(arr012.last).to.equal(2);
  });

  test('write last', ({ arr012 }) => {
    arr012.last = 'last';

    expect(arr012.last).to.equal('last');
  });

  test('forEach', ({ spy, arr012 }) => {
    arr012.forEach(spy);
    
    expect(spy).to.be.calledThrice;
    expect(spy.getCall(0).args[0]).to.equal(0);
    expect(spy.getCall(1).args[0]).to.equal(1);
    expect(spy.getCall(2).args[0]).to.equal(2);
  });

  test('push, then forEach', ({ spy, arr012 }) => {
    arr012.push(3);
    arr012.push(4);
    arr012.forEach(spy);
    
    expect(spy).to.have.callCount(5);
    expect(spy.getCall(0).args[0]).to.equal(0);
    expect(spy.getCall(1).args[0]).to.equal(1);
    expect(spy.getCall(2).args[0]).to.equal(2);
    expect(spy.getCall(3).args[0]).to.equal(3);
    expect(spy.getCall(4).args[0]).to.equal(4);
  });

  test('push, then for in', ({ spy, arr012 }) => {
    arr012.push(3);
    arr012.push(4);
    
    for (let i in arr012) {
      spy(i)
    }
    
    expect(spy).to.have.callCount(5);
    expect(spy.getCall(0).args[0]).to.equal('0');
    expect(spy.getCall(1).args[0]).to.equal('1');
    expect(spy.getCall(2).args[0]).to.equal('2');
    expect(spy.getCall(3).args[0]).to.equal('3');
    expect(spy.getCall(4).args[0]).to.equal('4');
  });

  test('push, then for of', ({ spy, arr012 }) => {
    arr012.push(3);
    arr012.push(4);
    
    for (let i of arr012) {
      spy(i)
    }
    
    expect(spy).to.have.callCount(5);
    expect(spy.getCall(0).args[0]).to.equal(0);
    expect(spy.getCall(1).args[0]).to.equal(1);
    expect(spy.getCall(2).args[0]).to.equal(2);
    expect(spy.getCall(3).args[0]).to.equal(3);
    expect(spy.getCall(4).args[0]).to.equal(4);
  });

  test('Object.entries', ({ spy, arr012 }) => {
    arr012.push(3);
    arr012.push(4);

    Object.entries(arr012).forEach((args) => spy(...args));
    
    expect(spy).to.have.callCount(5);
    expect(spy).to.calledWith('0', 0);
    expect(spy).to.calledWith('1', 1);
    expect(spy).to.calledWith('2', 2);
    expect(spy).to.calledWith('3', 3);
    expect(spy).to.calledWith('4', 4);
  });

  test('get length', ({ spy, arr012 }) => {
    arr012.forEach(spy);
    expect(arr012.length).to.equal(3);

    arr012.length = 5;
    expect(arr012.length).to.equal(5);
  });

});
