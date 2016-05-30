
/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

import { default as cop, Layer, LayerableObject } from '../copv2/Layers.js';

let assert = chai.assert;

// COP Example from: Hirschfeld, Costanza, Nierstrasz. 2008.
// Context-oriented Programming. JOT)

let DummyLayer = cop.create("DummyLayer");
let DummyLayer2 = cop.create("DummyLayer2");
let DummyLayer3 = cop.create("DummyLayer3");


class CopExampleDummyClass {
    constructor() {
        this.e = "Hello";
        this.m = "Hello";
        this.execution = []
    }

    f(a, b) {
        this.execution.push("d.f");
        // console.log("execute default f(" + a, ", " + b + ")");
        return 0;
    }

    h() {
        // console.log("h");
        return 2;
    }

    m1() {
        return 1;
    }


    m2() {
        return "m2";
    }

    fooo() {
        return "base";
    }

    say(a) {
        return "Say: " + a
    }
}


DummyLayer.refineClass(CopExampleDummyClass, {

    f(a, n) {
        this.execution.push("ld.f");
        //console.log("execute dummy layer f(" + a, ", " + b + ")");
        return cop.proceed() + 100;
    },

    get e() {
        return this._DummyLayer_e;
    },

    set e(v) {
        this._DummyLayer_e = v;
    },

    get m() {
        return cop.proceed() + " World";
    },

    h() {
        // console.log("D$h old(" + cop.proceed() +")");
        return 3;
    },

    newMethod() {
        return "totally new"
    },

    m1() {
        return 7;
    },

    m2() {
        return "D$m2," + cop.proceed();
    },

    newFoo() {
        return "newFoo";
    }
});

DummyLayer2.refineClass(CopExampleDummyClass, {
    f(a, n) {
        this.execution.push("ld2.f");
        return cop.proceed() + 1000;
    }
});

DummyLayer3.refineClass(CopExampleDummyClass, {
    h() {
        // console.log("D3$h old(" + cop.proceed() +")");
        return 4;
    }
});

class CopExampleDummySubclass extends CopExampleDummyClass {

    f2() {
        return 3;
    }

    m1() {
        return 10;
    }

    toString() {
        return "[a DummySubclass]"
    }

    m2() {
        return "S$m2"
    }

}

DummyLayer.refineClass(CopExampleDummySubclass, {

    f2() {
        return 4;
    },

    m1() {
        return cop.proceed() + 1;
    },

    fooo() {
        let proc =  cop.proceed();
        return proc+"-layer-"+this.newFoo();
    }
});

class CopExampleSecondDummySublass extends CopExampleDummyClass { }

DummyLayer.refineClass(CopExampleSecondDummySublass, {
    m1() {
        return cop.proceed() + 100;
    }
});


describe('COP example', function () {

    const AddressLayer = cop.create("AddressLayer");
    const EmploymentLayer = cop.create("EmploymentLayer");

    class CopExamplePerson {

        constructor(newName, newAddress, newEmployer) {
            this.name = newName;
            this.address = newAddress;
            this.employer = newEmployer;
        }

        print() {
            return "Name: " + this.name;
        }

        toString() {
            return "Person: " + this.name;
        }

    }

    AddressLayer.refineClass(CopExamplePerson, {
        print() {
            return cop.proceed() + "; Address: " + this.address;
        }
    });

    EmploymentLayer.refineClass(CopExamplePerson, {
        print() {
            return cop.proceed() + "; [Employer] " + this.employer.print();
        }
    });


    class CopExampleEmployer {

        constructor(newName, newAddress) {
            this.name = newName;
            this.address = newAddress;
        }

        print() {
            return "Name: " + this.name;
        }

        toString() {
            return "Employer: " + this.name;
        }
    }

    AddressLayer.refineClass(CopExampleEmployer, {
        print() {
            return cop.proceed() + "; Address: " + this.address;
        },
    });

    it('changes behavior with activated layers', function() {
        const name = "Hans Peter",
              address = "Am Kiez 49, 123 Berlin",
              employer_name = "Doener AG",
              employer_address = "An der Ecke, 124 Berlin",
              employer = new CopExampleEmployer(employer_name, employer_address),
              person = new CopExamplePerson(name, address, employer);

        assert.equal(person.print(), "Name: " + name, "toString without a layer is broken");

        cop.withLayers([AddressLayer], () => {
            assert.equal(person.print(), "Name: " + name + "; Address: " + address, "toString with address layer is broken");
        });

        cop.withLayers([EmploymentLayer], () => {
            assert.equal(person.print(), "Name: " + name + "; [Employer] Name: " + employer_name, "toString with employment layer is broken");
        });

        cop.withLayers([AddressLayer, EmploymentLayer], () => {
            assert.equal(person.print(), "Name: " + name +  "; Address: " + address +
                "; [Employer] Name: " + employer_name + "; Address: " + employer_address,
                "toString with employment layer is broken");
        });
    });

});

describe('cop', function () {
    let currentTest;

    beforeEach(function() {
        this.execution  = [];
        currentTest = this;
        this.oldGlobalLayers = cop.GlobalLayers;
        // when we are testing layers, there should be no other layers active in the system (to make things easier)
        cop.GlobalLayers = [];
        cop.resetLayerStack();
    });

    afterEach(function() {
        cop.GlobalLayers = this.oldGlobalLayers;
        cop.resetLayerStack();
    });

    let object1;
    function makeObject1() {
        object1 = {
            myString: "I am an object",
            f(a, b) {
                currentTest.execution.push("d.f");
                // console.log("execute default f(" + a, ", " + b + ")");
                return 0;
            },
            g() {
                currentTest.execution.push("d.g");
                // console.log("execute default g");
                return "Hello";
            },
            print() {
                return this.myString;
            },
            toString() {
                return "object1"
            }

        };
    };

    let layer1;
    function makeLayer1() {
        layer1 = cop.create('LmakeLayer1');
        cop.layerObject(layer1, object1, {
            f(a, b) {
                currentTest.execution.push("l1.f");
                console.log("execute layer1 function for f");
                return cop.proceed(a, b) + a;
            }
        });
        layer1.toString = function() {return "Layer L1";};
    }

    let layer2;
    function makeLayer2() {
        layer2 = cop.basicCreate('makeLayer2');
        cop.layerObject(layer2, object1, {
            f(a, b) {
                currentTest.execution.push("l2.f");
                // console.log("execute layer2 function for f");
                return cop.proceed(a, b) + b;
            },
            g() {
                currentTest.execution.push("l2.g");
                // console.log("execute default g");
                return cop.proceed() + " World";
            }
        });
        layer2.toString = function() {return "Layer L2"};
    }

    let emptyLayer;
    function makeEmptyLayer() {
        emptyLayer = cop.basicCreate('LEmpty');
        emptyLayer.toString = function() {return "Empty Layer"};
    }

    let layer3;
    function makeLayer3() {
        layer3 = cop.basicCreate('LmakeLayer3');;
        cop.layerObject(layer3, object1, {
            f(a, b) {
                currentTest.execution.push("l3.f");
                // console.log("execute layer3 function for f");
                return cop.proceed() * 10;
            }
        });
        layer3.toString = function() {return "Layer L3"};
    }

    it('can create a Layer', function() {
        cop.create("DummyLayer2");
        assert.isDefined(DummyLayer2);
        assert(DummyLayer2.toString(), "DummyLayer2");
    });

    it('can create a Layer in a namespace', function() {
        cop.tests.DummyLayer3 = cop.create("cop.tests.DummyLayer3");
        assert.isDefined(cop.tests.DummyLayer3);
        assert(cop.tests.DummyLayer3.toString(), "DummyLayer3");
    });


    it('can inspect the current layers', function() {
        makeObject1();
        makeLayer1();
        cop.withLayers([layer1], function() {
            assert(layer1, "no layer1");
            assert(cop.currentLayers().first(), "currentLayers failed");
        });
    });

    it('testOneLayer', function() {
        makeObject1();
        makeLayer1();
        assert.equal(object1.f(2,3), 0, "default result of f() failed");
        cop.withLayers([layer1], () => {
            const r = object1.f(2,3);
            assert.equal(r, 2, "result of f() failed");
            assert.equal(currentTest.execution.toString(), [ "d.f", "l1.f", "d.f"]);
        });

      });

    it('testTwoLayers', function() {
          makeObject1();
          makeLayer1();
          makeLayer2();
        cop.withLayers([layer1, layer2], function() {
            assert.equal(object1.f(3,4), 7, "result of f() failed");
            assert.equal(currentTest.execution.toString(), ["l2.f", "l1.f", "d.f"]);
        });
      });

    it('testTwoLayerInverse', function() {
          makeObject1();
          makeLayer1();
          makeLayer2();
        cop.withLayers([layer2, layer1], function() {
            cop.makeFunctionLayerAware(object1,"f");
            object1.f();
            assert.equal(currentTest.execution.toString(), ["l1.f", "l2.f", "d.f"]);
        });
      });

    it('testThreeLayers', function() {
          makeObject1();
          makeLayer1();
          makeLayer2();
          makeLayer3();
        cop.withLayers([layer1, layer2, layer3], () => {
            cop.makeFunctionLayerAware(object1,"f");
            cop.makeFunctionLayerAware(object1,"g");
            object1.f();
            const r = object1.g();
            assert.equal(r, "Hello World", "result of g() is wrong");
            assert.equal(currentTest.execution.toString(), ["l3.f", "l2.f","l1.f", "d.f", "l2.g", "d.g"]);
        });
      });

    it('testTwoLayersAndEmpty', function() {
          makeObject1();
          makeEmptyLayer();
          makeLayer1();
          makeLayer2();
        cop.withLayers([layer1, emptyLayer, layer2], () => {
            object1.f();
            assert.equal(currentTest.execution.toString(), ["l2.f","l1.f", "d.f"]);
        });

      });

    it('testHTMLLayerExample', function() {
          makeObject1();
        const htmlLayer = cop.basicCreate('LmakeHtmlLayer');
        // FIXME: why are private functions used here?
        // ensurePartialLayer, makeFunctionLayerAware
        cop.ensurePartialLayer(htmlLayer, object1)["print"] =  function() {
            return "<b>"+ cop.proceed() + "</b>";
        };
        htmlLayer.toString = function() {return "Layer HTML";};
        cop.makeFunctionLayerAware(object1,"print");
        cop.withLayers([htmlLayer], () => {
            assert.equal(object1.print(), "<b>"+object1.myString + "</b>", "html print does not work")
        });
    });

    it('testLayerClass', function() {
        const layer1 = cop.basicCreate('LtestLayerClass');
        cop.layerClass(layer1, CopExampleDummyClass, {
            f(a, b) {
                this.execution.push("l1.f");
                // console.log("execute layer1 function for f");
                return cop.proceed() + a;
            },
        });
        const object1 = new CopExampleDummyClass();
        cop.makeFunctionLayerAware(CopExampleDummyClass.prototype,"f");

        assert.equal(object1.f(2,3), 0, "default result of f() with layer aware failed");
        cop.withLayers([layer1], () => {
            const r = object1.f(2,3);
            assert.equal(r, 2, "result of f() failed");
            assert.equal(object1.execution.toString(), ["d.f", "l1.f", "d.f"]);
        })
    });

    it('testNestedLayerInClass', function() {
        const o = new CopExampleDummyClass();
        cop.withLayers([DummyLayer], () => {
            assert.equal(o.h(), 3, "outer layer broken");
            cop.withLayers([DummyLayer3], () => {
                // console.log("Layers: " + cop.currentLayers());
                // cop.currentLayers().each(function(ea){
                //     var p = ea[CopExampleDummyClass.prototype];
                //     if (p) {
                //         console.log("" + ea + ".h : " + p.h)
                //     }})
                assert.equal(o.h(), 4, "inner layer broken");
            })
        });
        // console.log("LOG: " + o.log)
    });

    it('testLayerObject', function() {
        const layer1 = cop.basicCreate('LtestLayerObject');
        makeObject1();
        cop.layerObject(layer1, object1, {
            f(a, b) {
                currentTest.execution.push("l1.f");
                // console.log("execute layer1 function for f");
                return cop.proceed() + a;
            },
        });
        cop.withLayers([layer1], () => {
            const r = object1.f(2);
            assert.equal(r, 2, "result of f() failed");
            assert.equal(currentTest.execution.toString(), ["l1.f", "d.f"]);
        });
      });

    // How to lookup objects in layers
    it('testObjectAsDictionaryKeys', function() {
        // it seems that the string value is used as the "key" in dictionary lookups
        const a = {name: "foo", toString() {return this.name}};
        const b = {name: "bar", toString() {return this.name}};
        const d = {};
        d[a] = 1;
        d[b] = 2;
        assert.equal(d[a], 1, "objects as keys are broken")
    });

    it('testLayerObjectsInOneLayer', function() {
        const layer = cop.basicCreate('LtestLayerObjectsInOneLayer');
        const o1 = {f() {return 1}};
        const o2 = {f() {return 2}};
        cop.layerObject(layer, o1, {
            f() {
                return 3
            },
        });
        cop.layerObject(layer, o2, {
            f() {
                return 4
            },
        });
        cop.withLayers([layer], () => {
            assert.equal(o1.f(), 3, "result of o1.f() failed");
            assert.equal(o2.f(), 4, "result of o2.f() failed");
        });
    });

    it('testLayerMethod', function() {
        const object1 = {f() {return 0}, g() {}},
            layer1 = cop.basicCreate('LtestLayerMethod');

        cop.layerMethod(layer1, object1, "f", function(){
            return cop.proceed() + 1});

        assert(cop.getLayerDefinitionForObject(layer1, object1).f, "f did not get stored");

        cop.layerMethod(layer1, object1, "g", function(){});

        assert(cop.getLayerDefinitionForObject(layer1, object1).f, "f did not get stored");
        assert(cop.getLayerDefinitionForObject(layer1, object1).g, "g did not get stored");
    });

    it('stores partial methods for class prototypes', function() {
        // TODO: implementation detail?
        assert(cop.getLayerDefinitionForObject(DummyLayer, CopExampleDummyClass.prototype).f, "f did not end up in DummyLayer");
        assert(cop.getLayerDefinitionForObject(DummyLayer, CopExampleDummyClass.prototype), "DummyLayer2 has no partial class");
        assert(cop.getLayerDefinitionForObject(DummyLayer, CopExampleDummyClass.prototype).h, "DummyLayer2 has no method for h");
    });

    it('testLayerActivation', function() {
        const layer1 = cop.basicCreate('LtestLayerActivation');
        const oldLength = cop.currentLayers().length;
        cop.withLayers([layer1], () => {
            assert.equal(cop.currentLayers().length, oldLength + 1, "layer1 is not actived");
        });
        assert.equal(cop.currentLayers().length, oldLength, "layer1 is not deactived");
    });

    it('testNestedLayerActivation', function() {
        const layer1 = cop.basicCreate('LtestNested1'),
              layer2 = cop.basicCreate('LtestNested2');
        assert.equal(cop.currentLayers().length, 0, "there are active layers where there shouldn't be ")
        cop.withLayers([layer1], () => {
            assert.equal(cop.currentLayers().length, 1, "layer1 is not active");
            cop.withLayers([layer2], () => {
                assert.equal(cop.currentLayers().length, 2, "layer2 is not active");
            });
            assert.equal(cop.currentLayers().length, 1, "layer2 is not deactivated");
        });
        assert.equal(cop.currentLayers().length, 0, "layer1 is not deactivated");
    });

    it('testNestedLayerDeactivationAndActivation', function() {
        const layer1 = cop.basicCreate('l1'),
              layer2 = cop.basicCreate('l2'),
              layer3 = cop.basicCreate('l3');
        cop.withLayers([layer1, layer2, layer3], () => {
            cop.withoutLayers([layer2], () => {
                assert.equal(cop.currentLayers().toString(), ["l1","l3"].toString());
                cop.withLayers([layer2], () => {
                    assert.equal(cop.currentLayers().toString(), ["l1","l3","l2"].toString());
                });
            });
        });
    });

    it('testDuplicateLayerActivation', function() {
        const layer1 = cop.basicCreate('LtestDup');
        cop.withLayers([layer1], () => {
            cop.withLayers([layer1], () => {
                assert.equal(cop.currentLayers().length, 1, "layer1 activated twice");
            });
            assert.equal(cop.currentLayers().length, 1, "layer1 is deactivated");
        });
    });

    it('testLayerDeactivation', function() {
        const layer1 = cop.basicCreate('LtestLayerDeactivation1');
        const layer2 = cop.basicCreate('LtestLayerDeactivation2');
        cop.withLayers([layer1, layer2], () => {
            cop.withoutLayers([layer2], () => {
                assert.equal(cop.currentLayers().length, 1, "layer2 is not deactiveated");
            });
            assert.equal(cop.currentLayers().length, 2, "layer2 is not reactivated");
        });
    });

    it('testErrorInLayeredActivation', function() {
        const layer1 = cop.basicCreate('LtestErrorInLayeredActivation')
        makeObject1();
        cop.layerObject(layer1, object1, {
            f() {
                throw {testError: true}
            },
        });
        try {
            cop.withLayers([layer1], () => {
                object1.f();
            });
        } catch (e) {
            if (!e.testError) throw e;
            assert.equal(cop.currentLayers().length, 0, "layer1 is still active");

        }
    });

    it('testErrorInLayeredDeactivation', function() {
        const layer1 = cop.basicCreate('LtestErrorInLayeredDeactivation');
        makeObject1();
        cop.layerObject(layer1, object1, {
            f() {
                throw {testError: true};
            },
        });
        cop.withLayers([layer1], () => {
            try {
                cop.withoutLayers([layer1], () => {
                    assert.equal(cop.currentLayers().length, 0, "layer1 deactivation is not active");
                    object1.f();
                });
            } catch (e) {
                if (!e.testError) throw e;
            };
            assert.equal(cop.currentLayers().length, 1, "layer1 deactivation is still active");
        });
    });


    it('testComposeLayers', function() {
        const layer1 = {toString(){return "l1"}};
        const layer2 = {toString(){return "l2"}};
        const layer3 = {toString(){return "l3"}};

        let stack = [{}];
        assert.equal(cop.composeLayers(stack.clone()).toString(), [].toString());
        assert.equal(cop.composeLayers([{}, {withLayers: [layer1]}]).toString(), ["l1"].toString());
        assert.equal(cop.composeLayers([{}, {withLayers: [layer1]},{withLayers: [layer2, layer3]} ]).toString(), ["l1","l2","l3"].toString());
    });

    it('testComposeLayersWithWithoutLayers', function() {
        const layer1 = {toString(){return "l1"}},
              layer2 = {toString(){return "l2"}},
              layer3 = {toString(){return "l3"}};

        let stack = [{}];
        assert.equal(
            cop.composeLayers([
                {},
                {withLayers: [layer1, layer2, layer3]},
                {withoutLayers: [layer2]}]).toString(),
            ["l1","l3"].toString());
    });

    it('testThisReferenceInLayeredMethod', function(){
        const layer1 = cop.basicCreate('testThisReferenceInLayeredMethod')
        makeObject1();
        layer1.refineObject(object1, {
            f() {
                assert(object1 === this, "this is not object1 in layer");
            }
        });
        cop.withLayers([layer1], function() {
            object1.f();
        });
    });

    it('testGlobalLayers', function() {
        const layer1 = {name: "Layer1"};
        const layer2 = {name: "Layer2"};
        cop.enableLayer(layer1);
        cop.enableLayer(layer2);
        // TODO: implementation detail? GlobalLayers[...]
        assert.strictEqual(cop.GlobalLayers[0], layer1, "layer1 not global");
        assert.strictEqual(cop.GlobalLayers[1], layer2, "layer2 not global");
        cop.disableLayer(layer1);
        assert.strictEqual(cop.GlobalLayers[0], layer2, "layer1 not removed from global");
        cop.disableLayer(layer2);
        assert.strictEqual(cop.GlobalLayers.length, 0, "global layers still active");
    });

    it('testEnableDisableLayer', function() {
        const layer1 = cop.basicCreate("Layer1");
        cop.enableLayer(layer1);
        assert.equal(cop.currentLayers().length, 1, "layer 1 is not enabled");
        // console.log("current layers: " + cop.currentLayers())
        cop.disableLayer(layer1);
        assert(!cop.LayerStack.last().composition, "there is a cached composition!");
        assert.equal(cop.currentLayers().length, 0, "layer 1 is not disabeled");
    });


    it('testEnableLayersInContext', function() {
        const layer1 = cop.basicCreate("Layer1"),
              layer2 = cop.basicCreate("Layer2");
        cop.withLayers([layer2], () => {
            cop.enableLayer(layer1);
            assert.equal(cop.currentLayers().length, 2, "layer 2 is not enabled");
        });
        assert.equal(cop.currentLayers().length, 1, "layer 1 is not enabled");
        cop.disableLayer(layer1);
    });

    it('testEnableLayersInContextAgain', function() {
        const layer1 = cop.basicCreate('Layer1');
        cop.withLayers([layer1], () => {
            cop.enableLayer(layer1);
            assert.equal(cop.currentLayers().length, 1, "layer 1 enabled twice?");
        });
        assert.equal(cop.currentLayers().length, 1, "layer 1 is not enabled");
    });

    it('testLayerSubclass', function() {
        const o = new CopExampleDummySubclass();
        assert(o.f2.isLayerAware, "function is not layer aware when subclassing not directly from object")
    });

    it('testNewMethodOnlyInLayer', function() {
        const o = new CopExampleDummyClass();
        cop.withLayers([DummyLayer], () => {
            assert(o.newMethod, "new method is not there");
            assert.equal(o.newMethod(), "totally new","layered newMethod() is wrong");
        });
    });

    it('testLayerMethodInSubclass', function() {
        const o = new CopExampleDummySubclass();
        assert.equal(o.m1(), 10, "subclassing is broken")
        cop.withLayers([DummyLayer], () => {
            assert.equal(o.m1(), 11, "layer in subclass is broken")
        });
    });

    it('testLayerMethodInSecondSubclass', function() {
        const o = new CopExampleSecondDummySublass();
        assert.equal(o.m1(), 1, "base is broken")
        cop.withLayers([DummyLayer], () => {
            assert.equal(o.m1(), 101, "layer in second subclass is broken")
        });
    });

    it('testSetWithLayers', function() {
        const o = new CopExampleDummySubclass();
        assert.equal(o.fooo(), "base", "base is broken");
        cop.withLayers([DummyLayer], () => {
            assert.equal(o.fooo(), "base-layer-newFoo", "SecondDummySubclass is broken");
        });
    });

    it('testExecuteLayeredBehaviorOfSuperclass', function() {
        const o = new CopExampleDummySubclass();
        cop.withLayers([DummyLayer], () => {
            assert.equal(o.newFoo(), "newFoo", "newFoo is broken");
        });
    });


    it('testDoNotOverideLayeredMethodInSubclass', function() {
        const o = new CopExampleDummyClass();
        cop.withLayers([DummyLayer], () => {
            assert.equal(o.m2(), "D$m2,m2", "installing wrappers on base class broken");
        });

        const s = new CopExampleDummySubclass();
        cop.withLayers([DummyLayer], () => {
            assert.equal(s.m2(), "S$m2", "not installing wrappers on subclassing broken`");
        });
    });

    it('testLayerRemove', function() {
        // given
        makeObject1();
        const context = {};
        const layer = cop.create(context, 'TestLayerRemoveLayer');
        layer.refineObject(object1, {
            f(x) { return x }
        });
        layer.beGlobal();
        assert.equal(3, object1.f(3), 'layer not global');
        assert.isDefined(context.TestLayerRemoveLayer, 'layer not in context object');
        // when
        layer.remove();
        // then
        assert.equal(0, object1.f(3), 'layer still global');
        assert.isUndefined(context.TestLayerRemoveLayer, 'layer still in context object');
    });

    describe('argument adaption', function () {
        it('testAdaptArgumentsInLayer', function () {
            const o = {say(a) {return "Say: " +a}},
                  l = cop.basicCreate('L');
            l.refineObject(o, { say(a) {return cop.proceed(a + " World") + "!"}})
            assert.equal(o.say("Hello"), "Say: Hello", "test is broken");
            cop.withLayers([l], () => {
                if (typeof console.group !== 'undefined')
                    console.group("SayHello");
                const result = o.say("Hello")
                if (typeof console.group !== 'undefined')
                    console.groupEnd("SayHello");
                assert.equal(result, "Say: Hello World!", "adapting arguments is broken");
            });
        });
    });

    describe('Layer', function () {
        let TmpDummyClass,
            TmpDummySubclass,
            TmpDummyLayer,
            TmpDummyLayer2;

        beforeEach('set up the test classes and layers', function () {
            TmpDummyClass = class TmpDummyClass {};
            TmpDummySubclass = class TmpDummySubclass extends TmpDummyClass {};
            TmpDummyLayer = cop.create('TmpDummyLayer');
            TmpDummyLayer2 = cop.create('TmpDummyLayer2');
        });

        // TODO: refactor, remove this indirection

        function dummyClass() {
            return TmpDummyClass;
        };

        function dummySubclass() {
            return TmpDummySubclass;
        };

        function dummyLayer() {
            return TmpDummyLayer;
        };

        function dummyLayer2() {
            return TmpDummyLayer2;
        };

        afterEach('remove test classes and layers', function() {
            TmpDummyClass = undefined;
            TmpDummySubclass = undefined;
            TmpDummyLayer = undefined;
            TmpDummyLayer2 = undefined;
        });

        describe('subclassing', function () {

            it('testSetup', function() {
                assert(dummyClass());
                assert(dummySubclass());
                assert(dummyLayer());
            });

            it('testLayerClassAndSubclasses', function() {
                dummyClass().addMethods({
                    m1(){return "m1"},
                });

                dummySubclass().addMethods({
                    m1(){return "S$m1"},
                    m2(){return "S$m2"},
                });

                cop.layerClass(dummyLayer(), dummyClass(), {
                    m1() {return "L$m1,"+cop.proceed()}
                });

                const o = new (dummyClass())();
                assert.equal(o.m1(), "m1", "base m1 broken");
                cop.withLayers([dummyLayer()], () => {
                    assert.equal(o.m1(), "L$m1,m1", "layered m1 broken");
                });

                const s = new (dummySubclass())();
                assert.equal(s.m1(), "S$m1", "base S$m1 broken");
                cop.withLayers([dummyLayer()], () => {
                    assert.equal(s.m1(), "S$m1",
                        "overriden method should not show layered behavior");
                });
            });

            it('testLayerClassAndSubclassesWithSuper', function() {
                class DummyClass {
                    m1() { return "m1" }
                }
                class DummySubclass extends DummyClass {
                    m1() { return "S$m1a " + super.m1() + " S$m1b" }
                }

                cop.layerClass(dummyLayer(), DummyClass, {
                    m1() { return "L$m1a " + cop.proceed() + " L$m1b" }
                });


                const o = new DummyClass();
                assert.equal(o.m1(), "m1", "unlayered m1 in superclass broken");

                cop.withLayers([dummyLayer()], () => {
                    assert.equal(o.m1(), "L$m1a m1 L$m1b", "layered m1 broken");
                });

                const s = new DummySubclass();
                assert.equal(s.m1(), "S$m1a m1 S$m1b", "base S$m1 broken");
                cop.withLayers([dummyLayer()], () => {
                    assert.equal(s.m1(), "S$m1a L$m1a m1 L$m1b S$m1b", "layered S$m1 broken");
                });
            });


            it('testMultipleLayerDefintions', function() {
                dummyClass().addMethods({m1() { return "m1" }});

                dummySubclass().addMethods({m1() { return "S$m1" }});

                cop.layerClass(dummyLayer(), dummyClass(), {
                    m1() {return "L$m1,"+cop.proceed()}
                });

                cop.layerClass(dummyLayer2(), dummySubclass(), {
                    m1() {return "L$m1,"+cop.proceed()}
                });

                const s = new (dummySubclass())();
                cop.withLayers([dummyLayer()], () => {
                    assert.equal(s.m1(), "L$m1,S$m1", "layered S$m1 broken");
                })
            });
        });

        describe('alternative syntax', function () {

            it('testNewSyntax', function() {
                const l = cop.create("MyDummyLayer2");
                assert(l instanceof Layer, "l is no layer")
                assert(l.layerClass instanceof Function, "l does not respond to layerClass")
                assert(l.layerObject instanceof Function, "l does not respond to layerObject")
            });

            it('testCreateLayer', function() {
                const l = cop.create("MyDummyLayer2");
                assert(l instanceof Layer, "l is no layer")
            });

            it('testRefineClass', function() {
                const l = cop.create("MyDummyLayer2");
                assert(l.refineClass instanceof Function, "l does not respond to refineClass")
            });

            it('testRefineObject', function() {
                const l = cop.create("MyDummyLayer2");
                assert(l.refineObject instanceof Function, "l does not respond to refineObject")

                const o = {foo() {return 1}}
                const r = l.refineObject(o, {
                    foo() { }
                });

                assert.strictEqual(l, r, "refineObject does not return layer")
            });

            it('testBeGlobal', function() {
                const l = cop.create("MyDummyLayer2");
                l.beGlobal();
                assert(cop.GlobalLayers.include(l), "be global is broken")

            });
        });
    });

    describe('layer state', function () {
        const MyTestLayer1 = cop.create("MyTestLayer1");
        const MyTestLayer2 = cop.create("MyTestLayer2");

        it('testMakePropertyLayerAware', function() {
            // TODO: implementation detail?
            const o = {a: 3};
            cop.makePropertyLayerAware(o,"a");

            assert.equal(o.a, 3, "getter is broken");
            o.a = 4;
            assert.equal(o.a, 4, "setter is broken");

            const getter = Object.getOwnPropertyDescriptor(o, "a").get;
            assert(getter, "o has not getter for a");
            assert(getter.isLayerAware || getter.isInlinedByCop, "o.a getter is not layerAware");

            const setter = Object.getOwnPropertyDescriptor(o, "a").set;
            assert(setter, "o has not setter for a");
            assert(setter.isLayerAware || getter.isInlinedByCop, "o.a setter is not layerAware");
        });

        it('testLayerGetter', function() {
            const o = {a: 5};

            const layer1 = cop.basicCreate('L1');
            assert.equal(o.a, 5, "property access is broken");
            layer1.refineObject(o, {get a() { return 10 }})

            const layer2 = cop.basicCreate('L2');
            cop.withLayers([layer1], function() {
                assert.equal(o.a, 10, "layer getter broken");
                cop.withLayers([layer2], function() {
                    assert.equal(o.a, 10, "with empty innner layer getter broken");
                });
            });
            assert.equal(o.a, 5, "layer getter broken after activation");
        });

        it('testLayerGetterAndSetter', function() {
            const o = {a: 5};
            const layer1 = cop.create('L1');
            assert.equal(o.a, 5, "property access is broken");

            o.l1_value = 10;
            layer1.refineObject(o, {
                get a() { return this.l1_value },
                set a(value) { return this.l1_value = value }
            });
            // TODO: implementation detail?
            const layerDef = cop.getLayerDefinitionForObject(layer1,o);
            assert(Object.getOwnPropertyDescriptor(layerDef, "a").set,
                "layer1 has no setter for a");
            assert(Object.getOwnPropertyDescriptor(o, "a").set.isLayerAware, "o.a setter is not layerAware");

            cop.withLayers([layer1], () => {
                assert.equal(o.a, 10, "layer getter broken");
                o.a = 20;
                assert.equal(o.l1_value, 20, "layer setter broken");
            });
        });

        it('testLayerStateInTwoObjects', function() {
            const o1 = new CopExampleDummyClass(),
                  o2 = new CopExampleDummyClass(),
                  layer1 = cop.basicCreate('LtestLayerStateInTwoObjects1');
            cop.layerClass(layer1, CopExampleDummyClass, {
                get a() { return this.l1_value },
                set a(value) { this.l1_value = value },
            });
            cop.withLayers([layer1], () => {
                o1.a = 20;
                o2.a = 30;
                assert.equal(o1.a, 20, "layer state in two objects broken");
                assert.equal(o2.a, 30, "layer state in two objects broken 2");
            });
        });

        it('testGetterAndSetterClassInLayer', function() {
            const o = new CopExampleDummyClass();
            o.toString = function(){return "[o]"};
            const o2 = new CopExampleDummyClass();
            o2.toString= function(){return "[o2]"};
            const layer1 = cop.create('LtestGetterAndSetterClassInLayer');
            cop.layerClass(layer1, CopExampleDummyClass, {
                get a() {
                    return 10;
                },
            });
            o.a = 5; // initialize works only after layer installation
            o2.a = 7; // initialize works only after layer installation
            assert(Object.getOwnPropertyDescriptor(CopExampleDummyClass.prototype, "a").get, "DummyClass has no getter for a");

            assert.equal(o.a, 5, "layer getter broken after initialization");
            cop.withLayers([layer1], () => {
                assert.equal(o.a, 10, "layer getter broken");
            });
            assert.equal(o.a, 5, "layer getter broken after activation");
            assert.equal(o2.a, 7, "layer getter broken after activation for o2");
        });

        it('testGetterLayerInClass', function() {
            const o = new CopExampleDummyClass();
            assert(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(o), "e").get, "o.e has no getter");
            assert.equal(o.e, "Hello", "layer getter broken after initialization");
            cop.withLayers([DummyLayer], () => {
                o.e = "World"
                assert.equal(o.e, "World", "layer getter broken");
            });
            assert.equal(o.e, "Hello", "layer getter broken after activation");
            cop.withLayers([DummyLayer], () => {
                assert.equal(o.e, "World", "layer does not remember state");
            });

        });

        it('testGetterProceed', function() {
            const o = new CopExampleDummyClass();
            cop.withLayers([DummyLayer], () => {
                assert.equal(o.m, "Hello World", "layer getter broken");
            });
        });

        it('testLayerInstallation', function() {
            let getter = Object.getOwnPropertyDescriptor(CopExampleDummyClass.prototype, "e").get;
            assert.isDefined(getter, "no getter in class");
            // FIXME: implementation detail?
            const layerDef = cop.getLayerDefinitionForObject(DummyLayer, CopExampleDummyClass.prototype);
            getter = Object.getOwnPropertyDescriptor(layerDef, "e").get;
            assert(getter, "no getter in partial class");
        });

        it('testLayerPropertyWithShadow', function() {
            const o = {}, layer1 = cop.create('LtestLayerPropertyWithShadow');
            cop.layerPropertyWithShadow(layer1, o, "a");
            o.a = 5;
            cop.withLayers([layer1], function() {
                o.a = 10;
                assert.equal(o.a, 10, "shadow broken");
            });
            assert.equal(o.a, 5, "shadow don't changes base");
            cop.withLayers([layer1], function() {
                assert.equal(o.a, 10, "shadow broken 2");
            });
        });

        it('testLayerClassPropertyWithShadow', function() {
            const o = new CopExampleDummyClass();
            cop.layerPropertyWithShadow(DummyLayer, o, "a");
            o.a = 5;
            cop.withLayers([DummyLayer], function() {
                o.a = 10;
                assert.equal(o.a, 10, "shadow broken");
            });
            assert.equal(o.a, 5, "shadow breaks base");
            cop.withLayers([DummyLayer], function() {
                assert.equal(o.a, 10, "shadow broken 2");
            });
        });

        it('testLayerPropertyWithShadowFallsBack', function() {
            const o = {};
            const layer1 = cop.basicCreate('LtestLayerPropertyWithShadowFallsBack');
            cop.layerPropertyWithShadow(layer1, o, "a");
            o.a = 5;
            cop.withLayers([layer1], () => {
                assert.equal(o.a, 5, "fallback is broken");
            });
        });

        it('testNestedStateAccess', function() {
            class MyClass {
                constructor() {
                    this.a = 7;
                }
            }
            MyTestLayer1.refineClass(MyClass, {
                get a() {
                    return this._MyLayer_a;
                },
                set a(v) {
                    this._MyLayer_a = v;
                }
            });
            MyTestLayer2.refineClass(MyClass, {
                get a() {
                    return this._MyLayer2_a;
                },
                set a(v) {
                    this._MyLayer2_a = v;
                }
            });
            const o = new MyClass();
            cop.withLayers([MyTestLayer1], () => {
                o.a = 9;
                cop.withLayers([MyTestLayer2], function() {
                    o.a = 10;
                }.bind(this));
            });
            cop.withLayers([MyTestLayer1], () => {
                assert.equal(o.a, 9, "outer layer broken")
                cop.withLayers([MyTestLayer2], () => {
                    assert.equal(o.a, 10, "inner layer broken")
                });
            });
        });
    });

    describe('layer object activation', function () {
        class DummyLayerableObject extends LayerableObject {

            constructor() {
                super();
                this.otherObject = new DummyOtherObject();
                this.myObject = new DummyOtherObject();
                this.myObject.owner = this;
            }

            f() {
                return 3
            }

            k1() {
                return this.otherObject.k();
            }

            k2() {
                return this.myObject.k();
            }
        }

        DummyLayer.refineClass(DummyLayerableObject, {
            f() {
                return 4
            },

            thisRef() {
                return this
            }
        });

        class DummyOtherObject extends LayerableObject {

            constructor() {
                super();
                this.count_dummy_k = 0;
            }

            k() {
                return 5
            }

        }

        DummyLayer.refineClass(DummyOtherObject, {
            k() {
                cop.proceed();
                this.count_dummy_k = this.count_dummy_k + 1;
                return 7
            }
        });

        // TODO: avoid shared state between tests
        let o;
        beforeEach('initialize the test object', function () {
            o = new DummyLayerableObject();
        });

        it('testSetAndGetActiveLayers', function() {
            o.setWithLayers([DummyLayer]);
            const layers = o.withLayers;
            assert(layers, "no layers active")
        });

        it('testDummyObjectDefault', function() {
            assert.equal(o.f(), 3, " default fails");
            cop.withLayers([DummyLayer], () => {
                assert.equal(o.f(), 4, " dynamic layer activation is broken");
            });
        });

        it('testSetLayersForObject', function() {
            o.setWithLayers([DummyLayer]);
            const r = o.structuralLayers({withLayers: [], withoutLayers: []})
            assert.strictEqual(r.withLayers[0], DummyLayer, "layer not set");
            assert.equal(o.f(), 4, " layered object broken");
        });

        it('testLayerIsNotActivatedInOtherObject', function() {
            o.setWithLayers([DummyLayer]);
            assert.equal(o.k1(), 5, " layer is activated in other object?")
        });

        it('testLayerIsActivatedInMyObject', function() {
            o.setWithLayers([DummyLayer]);
            assert.equal(o.k2(), 7, " layer is not activated in my object")
        });

        it('testStateActivationAndWithLayers', function() {
            o.setWithLayers([DummyLayer]);
            cop.withLayers([DummyLayer], () => {
                assert.equal(o.k2(), 7, " layer is not activated in my object")
                assert.equal(o.myObject.count_dummy_k, 1, " layered method is excuted wrong number")
            });
        });

        it('testStateActivationAndWithoutLayers', function() {
            o.setWithLayers([DummyLayer]);
            cop.withoutLayers([DummyLayer], () => {
                assert.equal(o.k2(), 5, " layer is not deactivated in my object")
            });
        });

        it('testStateActivationAndObjectDeclaredWithoutLayers', function() {
            o.setWithLayers([DummyLayer]);
            o.myObject.setWithoutLayers([DummyLayer]);
            assert.equal(o.k2(), 5, " layer is not deactivated in my object")
        });

        it('testThisReference', function() {
            o.setWithLayers([DummyLayer]);
            assert.strictEqual(o.thisRef(), o, " 'this' reference is broken")
        });

        it('testDoubleActivation', function() {
            o.setWithLayers([DummyLayer]);
            o.myObject.setWithLayers([DummyLayer]);
            const r = o.structuralLayers({withLayers: [], withoutLayers: []})
            assert.equal(r.withLayers.length, 1);
        });

        it('testAddWithLayerTest', function() {
            o.addWithLayer(DummyLayer);
            assert(o.withLayers.length, 1, "add failed")
            o.addWithLayer(DummyLayer);
            assert(o.withLayers.length, 1, "second add failed")
            o.addWithLayer(DummyLayer2);
            assert(o.withLayers.length, 2, "third add failed")
        });

        it('testRemoveWithLayerTest', function() {
            o.setWithLayers([DummyLayer, DummyLayer2]);
            o.removeWithLayer(DummyLayer);
            assert(o.withLayers.length, 1, "remove failed")
            o.removeWithLayer(DummyLayer);
            assert(o.withLayers.length, 1, "remove failed")
        });
    });

    describe('activeLayers', function () {

        it('testOverrideActiveLayers', function() {
            const o = new CopExampleDummyClass();
            o.activeLayers = function() { return [] }
            cop.withLayers([DummyLayer], function(){
                assert.equal(o.f(), 0, "layer is still active")
            });
        });

        it('testOverrideActiveLayersWithAdditionalLayer', function() {
            // object overrides the layer composition
            const o = new CopExampleDummyClass();
            o.activeLayers= function($super) {
                return $super().concat([DummyLayer2])
            };
            cop.withLayers([DummyLayer], function() {
                assert.equal(o.f(), 1100, "active layers failed")
            });
        });
    });

    describe('proceed', function () {
        let CopProceedTestClass,
            CopProceedTestAddLayer,
            CopProceedPropertyTestLayer,
            CopProceedMultAddLayer,
            CopProceedMultipleProceedLayer;

        function setupClasses() {
            CopProceedTestClass = class _CopProceedTestClass {
                constructor() {
                    this.p = "Hello";
                }

                m(a) {
                    return a * a
                }
            };

            cop.makeFunctionLayerAware(CopProceedTestClass.prototype, 'm')
            cop.makePropertyLayerAware(CopProceedTestClass.prototype, 'p')

            CopProceedTestAddLayer = cop.create('CopProceedTestAddLayer')
            .refineClass(CopProceedTestClass, {
                m(a) {
                    return cop.proceed(a + 1)
                },
            });

            CopProceedPropertyTestLayer = cop.create('CopProceedPropertyTestLayer')
            .refineClass(CopProceedTestClass, {
                get p() {
                    return cop.proceed() + " World"
                },

                set p(value) {
                    cop.proceed(value.capitalize())
                },

            });


            CopProceedMultAddLayer = cop.create('CopProceedMultAddLayer')
            .refineClass(CopProceedTestClass, {
                m(a) {
                    return cop.proceed(a) * 3
                }
            });

            CopProceedMultipleProceedLayer = cop.create('CopProceedMultipleProceedLayer')
            .refineClass(CopProceedTestClass, {
                m(a) {
                    return cop.proceed(a * 2) + cop.proceed(a *3)
                }
            });
        };

        let originalProceed;
        beforeEach('setUp', function() {
            originalProceed = cop.proceed;
            setupClasses();
        });

        afterEach('tearDown', function() {
            cop.proceed = originalProceed;
        });

        it('testMakeFunctionLayerAware', function() {
            // inlining does not use proceedStack
            if (cop.staticInlining || cop.dynamicInlining) return;

            let newLength;
            cop.proceed = function() { newLength = cop.proceedStack.length }
            const o = {m() { return 1 }}
            cop.makeFunctionLayerAware(o, 'm')
            const oldLength = cop.proceedStack.length;
            o.m();
            assert(newLength > oldLength, "stack did not change")
        });

        it('testMakeFunctionLayerAwareSetsLayerComposition', function() {
            // inlining does not use proceedStack
            if (cop.staticInlining || cop.dynamicInlining) return;

            let partialMethods,
                object,
                prototypeObject,
                functionName;

            cop.proceed = function() {
                const composition = cop.proceedStack.last();
                partialMethods = composition.partialMethods;
                object = composition.object;
                prototypeObject = composition.prototypeObject;
                functionName = composition.functionName;
            }

            const o = new CopProceedTestClass();
            cop.withLayers([CopProceedTestAddLayer], () => {
                o.m();
            });

            assert(partialMethods, "no partialMethods");
            assert(object, "no  object");
            assert(prototypeObject, "no  prototypeObject");
            assert(functionName, "no functionName");

        });

        it('testProceedWithoutLayers', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken")
        });

        it('testProceedFromAddToBase', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken")
            cop.withLayers([CopProceedTestAddLayer], () => {
                assert.equal(o.m(2), 9, "add layer broken")
            });
        });

        it('testProceedFromMultOverAddToBase', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken");
            cop.withLayers([CopProceedTestAddLayer], () => {
                cop.withLayers([CopProceedMultAddLayer], () => {
                    assert.equal(o.m(2), 27, "mult and add layer broken");
                });
                assert.equal(o.m(2), 9, "mult and add layer broken");
            });
            assert.equal(o.m(2), 4, "mult and add layer broken");
        });

        it('testMultipleProceed', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken");
            cop.withLayers([CopProceedMultipleProceedLayer], () => {
                assert.equal(o.m(1), 13, "CopProceedMultipleProceedLayer");
            });
        });

        it('testCurrentLayerComposition', function() {
            const o = new CopProceedTestClass();
            assert.strictEqual(this.currentLayerComposition, undefined, "layer composition is undefined");
            cop.withLayers([CopProceedTestAddLayer], () => {
                assert.equal(o.m(2), 9, "add layer broken")
            });

        });

        it('testGetterAndSetterWithCopProceed', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken");
            assert.equal(o.p, "Hello", "base getter broken");

            cop.withLayers([CopProceedPropertyTestLayer], () => {
                assert.equal(o.p, "Hello World", "getter broken");
                o.p = "hi";
                assert.equal(o.p, "Hi World", "setter broken");
            });
        });
    });

    describe('regressions', function () {
        it('testLookupLayeredFunctionForObjectIgnoresInheritedProperties', function() {
            const layer = new Layer();
            const obj = {foo() {return 3} };
            layer.refineObject(obj, {foo() {return cop.proceed() + 1}});
            assert.strictEqual(cop.lookupLayeredFunctionForObject(obj, layer, 'toString'), undefined, 'toString should not be found')
        });
    });

    describe('layer uninstalling', function () {

        it('testMakeFunctionLayerUnaware', function() {
            const obj = {m() {return 3}};
            const originalFunction = obj.m;
            cop.makeFunctionLayerAware(obj, "m");

            assert(obj.m !== originalFunction, "make layer aware failed")

            cop.makeFunctionLayerUnaware(obj, "m");

            assert(obj.m === originalFunction, "make layer unaware failed")
        });

        // FIXME: this test case uses the global connect function
        xit('testMakeFunctionLayerUnawareThatIsConnected', function() {
            const obj1 = {m1(a) {return a}};
            const obj2 = {m2(b) {
                this.b = b;
                // do nothing
            }};

            const originalFunction = obj1.m1;
            cop.makeFunctionLayerAware(obj1, "m1");

            const layerWrapper = obj1.m1;

            connect(obj1, "m1", obj2, "m2");
            const bindingsWrapper = obj1.m1;


            assert(bindingsWrapper !== layerWrapper, "binding did not work")
            assert(bindingsWrapper.originalFunction == layerWrapper, "bindings did not wrap around layer?")

            cop.makeFunctionLayerUnaware(obj1, "m1");
            assert(obj1.m1 === bindingsWrapper, "make layer unaware overwrote binding")

            obj1.m1(99)
            assert.equal(99, obj2.b);
        });

        it('testUninstallLayerInObject', function() {
            const obj1 = {
                m1() {return 3},
                m2() {return 2}
            };
            const originalM1 = obj1.m1;
            const originalM2 = obj1.m2;


            const layer = new Layer();
            layer.refineObject(obj1, {
                m1() { return cop.proceed() + 1 }
            });

            const layer2 = new Layer();
            layer2.refineObject(obj1, {
                m2() { return cop.proceed() + 1 }
            });

            cop.uninstallLayersInObject(obj1);

            assert(obj1.m1 === originalM1, "obj1.m1 is still wrapped");
            assert(obj1.m2 === originalM2, "obj2.m2 is still wrapped");

        });

        // FIXME: this test case uses Morph
        xit('testUninstallLayer', function() {
            lively.morphic.Morph.subclass('obj', {
                m1: function() { return 1 },
                m2: function() { return 2 },
                m3: function() { return 3 }
            })
            var originalM2 = obj.prototype.m2;

            cop.create('TestLayer1').refineClass(obj, {
                m1: function() { return cop.proceed() + 1 },
                m2: function() { return cop.proceed() + 1 },
                m3: function() { return cop.proceed() + 1 }
            }).beGlobal();
            var singleLayeredM1 = obj.prototype.m1;

            cop.create('TestLayer2').refineClass(obj, {
                m2: function() { return cop.proceed() + 2 },
                m3: function() { return cop.proceed() + 2 }
            }).beGlobal();

            cop.create('TestLayer3').refineClass(obj, {
                m3: function() { return cop.proceed() + 3 }
            }).beGlobal();
            var tripleLayeredM3 = obj.prototype.m3;

            TestLayer2.uninstall();

            assert(obj.prototype.m1 === singleLayeredM1, "obj.m1 is not wrapped anymore.");
            assert(obj.prototype.m2 === originalM2, "obj.m2 is still wrapped.");
            assert(obj.prototype.m3 === tripleLayeredM3, "obj.m3 is not wrapped anymore.");
        });
    });

    describe('unrefineObject', function () {
        it('testUntrefineObject', function() {
            const object = {foo() {return 3 }};

            const layer = new Layer("TestLayer");
            layer.refineObject(object, {
                foo() {
                    return cop.proceed() + 4
                }
            });

            assert(cop.getLayerDefinitionForObject(layer, object), "no layer definition")
            layer.unrefineObject(object);
            assert(cop.getLayerDefinitionForObject(layer, object) == undefined, "layer definition still there");
        });

        it('testUntrefineClass', function() {
            class klass {
                foo() { return 3 }
            }

            const layer = new Layer("TestLayer")
            layer.refineClass(klass, {
                foo() {
                    return cop.proceed() + 4
                }
            });

            assert(cop.getLayerDefinitionForObject(layer, klass.prototype), "no layer definition");
            layer.unrefineClass(klass);
            assert.isUndefined(cop.getLayerDefinitionForObject(layer, klass.prototype),
                               "layer definition still there");
        });
    });
});

