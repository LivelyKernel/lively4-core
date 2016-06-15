
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

import { proceed, withLayers, withoutLayers, layer, Layer } from '../contextjs.js';
import * as cop from '../Layers.js';
import { LayerableObject } from '../Layers.js';

const assert = chai.assert;

// COP Example from: Hirschfeld, Costanza, Nierstrasz. 2008.
// Context-oriented Programming. JOT)
const DummyLayer = new Layer("DummyLayer");
const DummyLayer2 = new Layer("DummyLayer2");
const DummyLayer3 = new Layer("DummyLayer3");


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
        return proceed() + 100;
    },

    get e() {
        return this._DummyLayer_e;
    },

    set e(v) {
        this._DummyLayer_e = v;
    },

    get m() {
        return proceed() + " World";
    },

    h() {
        // console.log("D$h old(" + proceed() +")");
        return 3;
    },

    newMethod() {
        return "totally new"
    },

    m1() {
        return 7;
    },

    m2() {
        return "D$m2," + proceed();
    },

    newFoo() {
        return "newFoo";
    }
});

DummyLayer2.refineClass(CopExampleDummyClass, {
    f(a, n) {
        this.execution.push("ld2.f");
        return proceed() + 1000;
    }
});

DummyLayer3.refineClass(CopExampleDummyClass, {
    h() {
        // console.log("D3$h old(" + proceed() +")");
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
        return proceed() + 1;
    },

    fooo() {
        let proc =  proceed();
        return proc+"-layer-"+this.newFoo();
    }
});

class CopExampleSecondDummySublass extends CopExampleDummyClass { }

DummyLayer.refineClass(CopExampleSecondDummySublass, {
    m1() {
        return proceed() + 100;
    }
});


describe('COP example', function () {

    const AddressLayer = new Layer("AddressLayer");
    const EmploymentLayer = new Layer("EmploymentLayer");

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
            return proceed() + "; Address: " + this.address;
        }
    });

    EmploymentLayer.refineClass(CopExamplePerson, {
        print() {
            return proceed() + "; [Employer] " + this.employer.print();
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
            return proceed() + "; Address: " + this.address;
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

        withLayers([AddressLayer], () => {
            assert.equal(person.print(), "Name: " + name + "; Address: " + address, "toString with address layer is broken");
        });

        withLayers([EmploymentLayer], () => {
            assert.equal(person.print(), "Name: " + name + "; [Employer] Name: " + employer_name, "toString with employment layer is broken");
        });

        withLayers([AddressLayer, EmploymentLayer], () => {
            assert.equal(person.print(), "Name: " + name +  "; Address: " + address +
                "; [Employer] Name: " + employer_name + "; Address: " + employer_address,
                "toString with employment layer is broken");
        });
    });

});

describe('contextjs', function () {
    let currentTest;

    beforeEach(function() {
        this.execution  = [];
        currentTest = this;
        this.oldGlobalLayers = cop.GlobalLayers.slice();
        // when we are testing layers, there should be no other layers active in the system (to make things easier)
        cop.GlobalLayers.splice(0, cop.GlobalLayers.length); // remove all
        cop.resetLayerStack();
    });

    afterEach(function() {
        // remove all global layers and put oldGlobalLayers in there again
        cop.GlobalLayers.splice(0, cop.GlobalLayers.length, ...this.oldGlobalLayers);
        cop.resetLayerStack();
    });

    function fixture() { return {
        object1: null,
        makeObject1() {
            return this.object1 = {
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
        },

        layer1: null,
        makeLayer1() {
            const layer1 = this.layer1 = new Layer('LmakeLayer1');
            if (this.object1 === null)
                this.makeObject1();
            cop.layerObject(layer1, this.object1, {
                f(a, b) {
                    currentTest.execution.push("l1.f");
                    console.log("execute layer1 function for f");
                    return cop.proceed(a, b) + a;
                }
            });
            layer1.toString = function() {return "Layer L1";};
            return layer1;
        },

        layer2: null,
        makeLayer2() {
            const layer2 = this.layer2 = new Layer('makeLayer2');
            if (this.object1 === null)
                this.makeObject1();
            cop.layerObject(layer2, this.object1, {
                f(a, b) {
                    currentTest.execution.push("l2.f");
                    // console.log("execute layer2 function for f");
                    return cop.proceed(a, b) + b;
                },
                g() {
                    currentTest.execution.push("l2.g");
                    // console.log("execute default g");
                    return proceed() + " World";
                }
            });
            layer2.toString = function() {return "Layer L2"};
            return layer2;
        },

        emptyLayer: null,
        makeEmptyLayer() {
            const emptyLayer = this.emptyLayer = new Layer('LEmpty');
            emptyLayer.toString = function() {return "Empty Layer"};
            return emptyLayer;
        },

        layer3: null,
        makeLayer3() {
            const layer3 = this.layer3 = new Layer('LmakeLayer3');
            if (this.object1 === null)
                this.makeObject1();
            cop.layerObject(layer3, this.object1, {
                f(a, b) {
                    currentTest.execution.push("l3.f");
                    // console.log("execute layer3 function for f");
                    return proceed() * 10;
                }
            });
            layer3.toString = function() {return "Layer L3"};
            return layer3;
        },
    }};

    describe('layer function', function () {
        it('creates new layers if they do not exist already', function () {
            // assert(typeof cop.NamedLayers.NewLayer === 'undefined',
            //        'NewLayer already existed prior to the test setup');
            assert(layer('NewLayer') instanceof Layer);
        });

        it('retrieves existing layers by name', function () {
            const l1 = layer('LayerCreationTestLayer');
            const l2 = layer('LayerCreationTestLayer');
            assert.strictEqual(l1, l2,
                'layer function should return same Layer for the same name');
        });

        it('does not know about manually created Layers', function () {
            const l1 = new Layer('IndependentLayerCreationTestLayer');
            const l2 = layer('IndependentLayerCreationTestLayer');
            assert.notStrictEqual(l1, l2,
               'the Layer constructor should not affect the layer function');
        });

        it('can create layers as properties of other objects', function () {
            const context = {};
            const l1 = layer(context, "TestLayerInContextObject");
            assert.isDefined(context.TestLayerInContextObject);
            assert.instanceOf(context.TestLayerInContextObject, Layer);
            const l2 = layer(context, "TestLayerInContextObject");
            assert.strictEqual(l1, l2, 'should not replace existing layers');
        });

        it('will not overwrite existing properties in objects', function () {
            const context = { x: 5, y() { return x; } };
            const yMethod = context.y;
            assert.throws(() => layer(context, 'x'), 'existing property');
            assert.equal(context.x, 5, 'context object should not be modified');
            assert.throws(() => layer(context, 'y'), 'existing property');
            assert.strictEqual(context.y, yMethod, 'context object should not be modified');
        });

        it('stores layers in objects separately from those outside of objects', function () {
            const context = {};
            const l1 = layer(context, "TestLayerInContextObject");
            const l2 = layer("TestLayerInContextObject");
            assert.notStrictEqual(l1, l2,
                'layers in objects should be independent from those outside');
        });
    });

    it('can inspect the current layers', function() {
        const layer1 = fixture().makeLayer1();
        withLayers([layer1], function() {
            assert(layer1, "no layer1");
            assert(cop.currentLayers()[0], "currentLayers failed");
        });
    });

    describe('withLayers', function () {

        it('testOneLayer', function() {
            const f = fixture();
            const object1 = f.makeObject1();
            const layer1 = f.makeLayer1();
            assert.equal(object1.f(2,3), 0, "default result of f() failed");
            withLayers([layer1], () => {
                const r = object1.f(2,3);
                assert.equal(r, 2, "result of f() failed");
                assert.equal(currentTest.execution.toString(), [ "d.f", "l1.f", "d.f"]);
            });
        });

        it('testTwoLayers', function() {
            const f = fixture();
            const object1 = f.makeObject1();
            const layer1 = f.makeLayer1();
            const layer2 = f.makeLayer2();
            withLayers([layer1, layer2], function() {
                assert.equal(object1.f(3,4), 7, "result of f() failed");
                assert.equal(currentTest.execution.toString(), ["l2.f", "l1.f", "d.f"]);
            });
        });

        it('testTwoLayerInverse', function() {
            const f = fixture();
            const object1 = f.makeObject1();
            const layer1 = f.makeLayer1();
            const layer2 = f.makeLayer2();
            withLayers([layer2, layer1], function() {
                object1.f();
                assert.equal(currentTest.execution.toString(), ["l1.f", "l2.f", "d.f"]);
            });
        });

        it('testThreeLayers', function() {
            const f = fixture();
            const object1 = f.makeObject1();
            const layer1 = f.makeLayer1();
            const layer2 = f.makeLayer2();
            const layer3 = f.makeLayer3();
            withLayers([layer1, layer2, layer3], () => {
                object1.f();
                const r = object1.g();
                assert.equal(r, "Hello World", "result of g() is wrong");
                assert.equal(currentTest.execution.toString(), ["l3.f", "l2.f","l1.f", "d.f", "l2.g", "d.g"]);
            });
        });

        it('testTwoLayersAndEmpty', function() {
            const f = fixture();
            const object1 = f.makeObject1();
            const emptyLayer = f.makeEmptyLayer();
            const layer1 = f.makeLayer1();
            const layer2 = f.makeLayer2();
            withLayers([layer1, emptyLayer, layer2], () => {
                object1.f();
                assert.equal(currentTest.execution.toString(), ["l2.f","l1.f", "d.f"]);
            });
        });

        it('testHTMLLayerExample', function() {
            const f = fixture();
            const object1 = f.makeObject1();
            const htmlLayer = new Layer('LmakeHtmlLayer');
            htmlLayer.refineObject(object1, {
                print() { return '<b>' + proceed() + '</b>' }
            });
            withLayers([htmlLayer], () => {
                assert.equal(object1.print(), "<b>"+object1.myString + "</b>", "html print does not work")
            });
        });
    });

    describe('layerClass', function () {

        it('testLayerClass', function() {
            const layer1 = new Layer('LtestLayerClass');
            cop.layerClass(layer1, CopExampleDummyClass, {
                f(a, b) {
                    this.execution.push("l1.f");
                    // console.log("execute layer1 function for f");
                    return proceed() + a;
                },
            });
            const object1 = new CopExampleDummyClass();

            assert.equal(object1.f(2,3), 0, "default result of f() with layer aware failed");
            withLayers([layer1], () => {
                const r = object1.f(2,3);
                assert.equal(r, 2, "result of f() failed");
                assert.equal(object1.execution.toString(), ["d.f", "l1.f", "d.f"]);
            })
        });

        it('testNestedLayerInClass', function() {
            const o = new CopExampleDummyClass();
            withLayers([DummyLayer], () => {
                assert.equal(o.h(), 3, "outer layer broken");
                withLayers([DummyLayer3], () => {
                    // console.log("Layers: " + cop.currentLayers());
                    // cop.currentLayers().forEach(function(ea){
                    //     var p = ea[CopExampleDummyClass.prototype];
                    //     if (p) {
                    //         console.log("" + ea + ".h : " + p.h)
                    //     }})
                    assert.equal(o.h(), 4, "inner layer broken");
                })
            });
            // console.log("LOG: " + o.log)
        });
    });

    // FIXME: this tests ECMAScript, not ContextJS
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

    describe('layerObject', function () {
        // TODO: why do we need this syntax in addition to Layer.prototype.refineObject?
        it('testLayerObject', function() {
            const layer1 = new Layer('LtestLayerObject');
            const object1 = fixture().makeObject1();
            cop.layerObject(layer1, object1, {
                f(a, b) {
                    currentTest.execution.push("l1.f");
                    // console.log("execute layer1 function for f");
                    return proceed() + a;
                },
            });
            withLayers([layer1], () => {
                const r = object1.f(2);
                assert.equal(r, 2, "result of f() failed");
                assert.equal(currentTest.execution.toString(), ["l1.f", "d.f"]);
            });
        });

        it('testLayerObjectsInOneLayer', function() {
            const layer = new Layer('LtestLayerObjectsInOneLayer');
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
            withLayers([layer], () => {
                assert.equal(o1.f(), 3, "result of o1.f() failed");
                assert.equal(o2.f(), 4, "result of o2.f() failed");
            });
        });
    });

    it('testLayerMethod', function() {
        // TODO: why do we need this syntax in addition to refineObject?
        const object1 = {f() {return 0}, g() {}},
            layer1 = new Layer('LtestLayerMethod');

        cop.layerMethod(layer1, object1, "f", function(){
            return proceed() + 1});

        assert(cop.getLayerDefinitionForObject(layer1, object1).f, "f did not get stored");

        cop.layerMethod(layer1, object1, "g", function(){});

        assert(cop.getLayerDefinitionForObject(layer1, object1).f, "f did not get stored");
        assert(cop.getLayerDefinitionForObject(layer1, object1).g, "g did not get stored");
    });

    it('stores partial methods for class prototypes', function() {
        // FIXME: implementation detail?
        assert(cop.getLayerDefinitionForObject(DummyLayer, CopExampleDummyClass.prototype).f, "f did not end up in DummyLayer");
        assert(cop.getLayerDefinitionForObject(DummyLayer, CopExampleDummyClass.prototype), "DummyLayer2 has no partial class");
        assert(cop.getLayerDefinitionForObject(DummyLayer, CopExampleDummyClass.prototype).h, "DummyLayer2 has no method for h");
    });

    describe('dynamically scoped layer activation', function () {

        it('testNestedLayerActivation', function() {
            const layer1 = new Layer('LtestNested1'),
                layer2 = new Layer('LtestNested2');
            assert.equal(cop.currentLayers().length, 0, "there are active layers where there shouldn't be ")
            withLayers([layer1], () => {
                assert.equal(cop.currentLayers().length, 1, "layer1 is not active");
                assert.include(cop.currentLayers(), layer1, "layer1 is not active");
                withLayers([layer2], () => {
                    assert.equal(cop.currentLayers().length, 2, "layer2 is not active");
                });
                assert.equal(cop.currentLayers().length, 1, "layer2 is not deactivated");
            });
            assert.equal(cop.currentLayers().length, 0, "layer1 is not deactivated");
        });

        it('testNestedLayerDeactivationAndActivation', function() {
            const layer1 = new Layer('l1'),
                layer2 = new Layer('l2'),
                layer3 = new Layer('l3');
            withLayers([layer1, layer2, layer3], () => {
                withoutLayers([layer2], () => {
                    assert.equal(cop.currentLayers().toString(), ["l1","l3"].toString());
                    withLayers([layer2], () => {
                        assert.equal(cop.currentLayers().toString(), ["l1","l3","l2"].toString());
                    });
                });
            });
        });

        it('testDuplicateLayerActivation', function() {
            const layer1 = new Layer('LtestDup');
            withLayers([layer1], () => {
                withLayers([layer1], () => {
                    assert.equal(cop.currentLayers().length, 1, "layer1 activated twice");
                });
                assert.equal(cop.currentLayers().length, 1, "layer1 is deactivated");
            });
        });

        it('testLayerDeactivation', function() {
            const layer1 = new Layer('LtestLayerDeactivation1');
            const layer2 = new Layer('LtestLayerDeactivation2');
            withLayers([layer1, layer2], () => {
                withoutLayers([layer2], () => {
                    assert.equal(cop.currentLayers().length, 1, "layer2 is not deactiveated");
                });
                assert.equal(cop.currentLayers().length, 2, "layer2 is not reactivated");
            });
        });

        it('testErrorInLayeredActivation', function() {
            const layer1 = new Layer('LtestErrorInLayeredActivation')
            const object1 = fixture().makeObject1();
            cop.layerObject(layer1, object1, {
                f() {
                    throw {testError: true}
                },
            });
            try {
                withLayers([layer1], () => {
                    object1.f();
                });
            } catch (e) {
                if (!e.testError) throw e;
                assert.equal(cop.currentLayers().length, 0, "layer1 is still active");

            }
        });

        it('testErrorInLayeredDeactivation', function() {
            const layer1 = new Layer('LtestErrorInLayeredDeactivation');
            const f = fixture();
            const object1 = f.makeObject1();
            cop.layerObject(layer1, object1, {
                f() {
                    throw {testError: true};
                },
            });
            withLayers([layer1], () => {
                try {
                    withoutLayers([layer1], () => {
                        assert.equal(cop.currentLayers().length, 0, "layer1 deactivation is not active");
                        object1.f();
                    });
                } catch (e) {
                    if (!e.testError) throw e;
                };
                assert.equal(cop.currentLayers().length, 1, "layer1 deactivation is still active");
            });
        });
    });


    it('testComposeLayers', function() {
        const layer1 = {toString(){return "l1"}};
        const layer2 = {toString(){return "l2"}};
        const layer3 = {toString(){return "l3"}};

        // FIXME: implementation detail?
        let stack = [{}];
        assert.equal(cop.composeLayers(stack.slice(0)).toString(), [].toString());
        assert.equal(cop.composeLayers([{}, {withLayers: [layer1]}]).toString(), ["l1"].toString());
        assert.equal(cop.composeLayers([{}, {withLayers: [layer1]},{withLayers: [layer2, layer3]} ]).toString(), ["l1","l2","l3"].toString());
    });

    it('testComposeLayersWithWithoutLayers', function() {
        const layer1 = {toString(){return "l1"}},
              layer2 = {toString(){return "l2"}},
              layer3 = {toString(){return "l3"}};

        // FIXME: implementation detail?
        let stack = [{}];
        assert.equal(
            cop.composeLayers([
                {},
                {withLayers: [layer1, layer2, layer3]},
                {withoutLayers: [layer2]}]).toString(),
            ["l1","l3"].toString());
    });

    it('testThisReferenceInLayeredMethod', function(){
        const layer1 = new Layer('testThisReferenceInLayeredMethod')
        const object1 = fixture().makeObject1();
        layer1.refineObject(object1, {
            f() {
                assert(object1 === this, "this is not object1 in layer");
            }
        });
        withLayers([layer1], function() {
            object1.f();
        });
    });

    describe('global layer activation', function () {
        it('testGlobalLayers', function() {
            const layer1 = {name: "Layer1"};
            const layer2 = {name: "Layer2"};
            cop.enableLayer(layer1);
            cop.enableLayer(layer2);
            // FIXME: implementation detail? GlobalLayers[...]
            assert.strictEqual(cop.GlobalLayers[0], layer1, "layer1 not global");
            assert.strictEqual(cop.GlobalLayers[1], layer2, "layer2 not global");
            cop.disableLayer(layer1);
            assert.strictEqual(cop.GlobalLayers[0], layer2, "layer1 not removed from global");
            cop.disableLayer(layer2);
            assert.strictEqual(cop.GlobalLayers.length, 0, "global layers still active");
        });

        it('testEnableDisableLayer', function() {
            const layer1 = new Layer("Layer1");
            cop.enableLayer(layer1);
            assert.equal(cop.currentLayers().length, 1, "layer 1 is not enabled");
            // console.log("current layers: " + cop.currentLayers())
            cop.disableLayer(layer1);
            assert(!cop.LayerStack[cop.LayerStack.length - 1].composition, "there is a cached composition!");
            assert.equal(cop.currentLayers().length, 0, "layer 1 is not disabeled");
        });

        it('is independent from dynamically scoped activation', function() {
            const layer1 = new Layer("Layer1"),
                layer2 = new Layer("Layer2");
            withLayers([layer2], () => {
                cop.enableLayer(layer1);
                assert.equal(cop.currentLayers().length, 2, "layer 2 is not enabled");
            });
            assert.equal(cop.currentLayers().length, 1, "layer 1 is not enabled");
            cop.disableLayer(layer1);
        });

        it('overrides dynamically scoped activation of the same layer', function() {
            const layer1 = new Layer('Layer1');
            withLayers([layer1], () => {
                cop.enableLayer(layer1);
                assert.equal(cop.currentLayers().length, 1, "layer 1 enabled twice?");
            });
            assert.include(cop.currentLayers(), layer1, "layer 1 should still be enabled");
        });
    });

    describe('behavior with subclasses of layered classes', function () {

        it('testLayerSubclass', function() {
            const o = new CopExampleDummySubclass();
            assert(o.f2.isLayerAware, "function is not layer aware when subclassing not directly from object")
        });

        it('testNewMethodOnlyInLayer', function() {
            const o = new CopExampleDummyClass();
            withLayers([DummyLayer], () => {
                assert(o.newMethod, "new method is not there");
                assert.equal(o.newMethod(), "totally new","layered newMethod() is wrong");
            });
        });

        it('testLayerMethodInSubclass', function() {
            const o = new CopExampleDummySubclass();
            assert.equal(o.m1(), 10, "subclassing is broken")
            withLayers([DummyLayer], () => {
                assert.equal(o.m1(), 11, "layer in subclass is broken")
            });
        });

        it('testLayerMethodInSecondSubclass', function() {
            const o = new CopExampleSecondDummySublass();
            assert.equal(o.m1(), 1, "base is broken")
            withLayers([DummyLayer], () => {
                assert.equal(o.m1(), 101, "layer in second subclass is broken")
            });
        });

        it('testSetWithLayers', function() {
            const o = new CopExampleDummySubclass();
            assert.equal(o.fooo(), "base", "base is broken");
            withLayers([DummyLayer], () => {
                assert.equal(o.fooo(), "base-layer-newFoo", "SecondDummySubclass is broken");
            });
        });

        it('testExecuteLayeredBehaviorOfSuperclass', function() {
            const o = new CopExampleDummySubclass();
            withLayers([DummyLayer], () => {
                assert.equal(o.newFoo(), "newFoo", "newFoo is broken");
            });
        });


        it('testDoNotOverideLayeredMethodInSubclass', function() {
            const o = new CopExampleDummyClass();
            withLayers([DummyLayer], () => {
                assert.equal(o.m2(), "D$m2,m2", "installing wrappers on base class broken");
            });

            const s = new CopExampleDummySubclass();
            withLayers([DummyLayer], () => {
                assert.equal(s.m2(), "S$m2", "not installing wrappers on subclassing broken`");
            });
        });
    });

    describe('Layer object', function () {
        let DummyClass,
            DummySubclass,
            DummyLayer,
            DummyLayer2;

        beforeEach('set up the test classes and layers', function () {
            DummyClass = class DummyClass {};
            DummySubclass = class DummySubclass extends DummyClass {};
            DummyLayer = new Layer('TmpDummyLayer');
            DummyLayer2 = new Layer('TmpDummyLayer2');
        });

        afterEach('remove test classes and layers', function() {
            DummyClass = undefined;
            DummySubclass = undefined;
            DummyLayer = undefined;
            DummyLayer2 = undefined;
        });

        it('overrides toString to return the layer name', function () {
            assert.equal(new Layer('TheName').toString(), 'TheName');
            assert.equal(layer('TestName').toString(), 'TestName');
        });

        describe('subclassing', function () {
            // TODO: move these methods and the fixture to the "behavior for subclasses ..." description

            it('testSetup', function() {
                assert(DummyClass);
                assert(DummySubclass);
                assert(DummyLayer);
            });

            it('testLayerClassAndSubclasses', function() {
                Object.assign(DummyClass.prototype, {
                    m1(){return "m1"},
                });

                Object.assign(DummySubclass.prototype, {
                    m1(){return "S$m1"},
                    m2(){return "S$m2"},
                });

                cop.layerClass(DummyLayer, DummyClass, {
                    m1() {return "L$m1,"+proceed()}
                });

                const o = new DummyClass();
                assert.equal(o.m1(), "m1", "base m1 broken");
                withLayers([DummyLayer], () => {
                    assert.equal(o.m1(), "L$m1,m1", "layered m1 broken");
                });

                const s = new DummySubclass();
                assert.equal(s.m1(), "S$m1", "base S$m1 broken");
                withLayers([DummyLayer], () => {
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

                cop.layerClass(DummyLayer, DummyClass, {
                    m1() { return "L$m1a " + proceed() + " L$m1b" }
                });


                const o = new DummyClass();
                assert.equal(o.m1(), "m1", "unlayered m1 in superclass broken");

                withLayers([DummyLayer], () => {
                    assert.equal(o.m1(), "L$m1a m1 L$m1b", "layered m1 broken");
                });

                const s = new DummySubclass();
                assert.equal(s.m1(), "S$m1a m1 S$m1b", "base S$m1 broken");
                withLayers([DummyLayer], () => {
                    assert.equal(s.m1(), "S$m1a L$m1a m1 L$m1b S$m1b", "layered S$m1 broken");
                });
            });


            it('testMultipleLayerDefintions', function() {
                Object.assign(DummyClass.prototype, {m1() { return "m1" }});

                Object.assign(DummySubclass.prototype, {m1() { return "S$m1" }});

                cop.layerClass(DummyLayer, DummyClass, {
                    m1() {return "L$m1,"+proceed()}
                });

                cop.layerClass(DummyLayer2, DummySubclass, {
                    m1() {return "L$m1,"+proceed()}
                });

                const s = new DummySubclass();
                withLayers([DummyLayer], () => {
                    assert.equal(s.m1(), "L$m1,S$m1", "layered S$m1 broken");
                })
            });
        });

        it('returns itself from #refineObject', function() {
            const layer = new Layer("MyDummyLayer2");
            const o = {foo() {return 1}}
            const refineReturnValue = layer.refineObject(o, {
                foo() { }
            });
            assert.strictEqual(layer, refineReturnValue, "refineObject should return the layer")
        });

        it('should be activated globally by #beGlobal', function() {
            const l = new Layer();
            l.beGlobal();
            assert.include(cop.GlobalLayers, l, "be global is broken")

        });
    });

    describe('state provided by layers', function () {
        const MyTestLayer1 = new Layer("MyTestLayer1");
        const MyTestLayer2 = new Layer("MyTestLayer2");

        it('testMakePropertyLayerAware', function() {
            const o = {a: 3};

            assert.equal(o.a, 3, "getter is broken");
            o.a = 4;
            assert.equal(o.a, 4, "setter is broken");
            MyTestLayer1.refineObject(o, {
                get a() { return 5 }
            });

            const getter = Object.getOwnPropertyDescriptor(o, "a").get;
            // FIXME: implementation detail?
            assert(getter, "o has not getter for a");
            assert(getter.isLayerAware || getter.isInlinedByCop, "o.a getter is not layerAware");

            const setter = Object.getOwnPropertyDescriptor(o, "a").set;
            assert(setter, "o has not setter for a");
            assert(setter.isLayerAware || getter.isInlinedByCop, "o.a setter is not layerAware");
        });

        it('testLayerGetter', function() {
            const o = {a: 5};

            const layer1 = new Layer('L1');
            assert.equal(o.a, 5, "property access is broken");
            layer1.refineObject(o, {get a() { return 10 }})

            const layer2 = new Layer('L2');
            withLayers([layer1], function() {
                assert.equal(o.a, 10, "layer getter broken");
                withLayers([layer2], function() {
                    assert.equal(o.a, 10, "with empty innner layer getter broken");
                });
            });
            assert.equal(o.a, 5, "layer getter broken after activation");
        });

        it('testLayerGetterAndSetter', function() {
            const o = {a: 5};
            const layer1 = new Layer('L1');
            assert.equal(o.a, 5, "property access is broken");

            o.l1_value = 10;
            layer1.refineObject(o, {
                get a() { return this.l1_value },
                set a(value) { return this.l1_value = value }
            });
            // FIXME: implementation detail?
            const layerDef = cop.getLayerDefinitionForObject(layer1,o);
            assert(Object.getOwnPropertyDescriptor(layerDef, "a").set,
                "layer1 has no setter for a");
            assert(Object.getOwnPropertyDescriptor(o, "a").set.isLayerAware, "o.a setter is not layerAware");

            withLayers([layer1], () => {
                assert.equal(o.a, 10, "layer getter broken");
                o.a = 20;
                assert.equal(o.l1_value, 20, "layer setter broken");
            });
        });

        it('testLayerStateInTwoObjects', function() {
            const o1 = new CopExampleDummyClass(),
                  o2 = new CopExampleDummyClass(),
                  layer1 = new Layer('LtestLayerStateInTwoObjects1');
            cop.layerClass(layer1, CopExampleDummyClass, {
                get a() { return this.l1_value },
                set a(value) { this.l1_value = value },
            });
            withLayers([layer1], () => {
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
            const layer1 = new Layer('LtestGetterAndSetterClassInLayer');
            cop.layerClass(layer1, CopExampleDummyClass, {
                get a() {
                    return 10;
                },
            });
            o.a = 5; // initialize works only after layer installation
            o2.a = 7; // initialize works only after layer installation
            assert(Object.getOwnPropertyDescriptor(CopExampleDummyClass.prototype, "a").get, "DummyClass has no getter for a");

            assert.equal(o.a, 5, "layer getter broken after initialization");
            withLayers([layer1], () => {
                assert.equal(o.a, 10, "layer getter broken");
            });
            assert.equal(o.a, 5, "layer getter broken after activation");
            assert.equal(o2.a, 7, "layer getter broken after activation for o2");
        });

        it('testGetterLayerInClass', function() {
            const o = new CopExampleDummyClass();
            assert(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(o), "e").get, "o.e has no getter");
            assert.equal(o.e, "Hello", "layer getter broken after initialization");
            withLayers([DummyLayer], () => {
                o.e = "World"
                assert.equal(o.e, "World", "layer getter broken");
            });
            assert.equal(o.e, "Hello", "layer getter broken after activation");
            withLayers([DummyLayer], () => {
                assert.equal(o.e, "World", "layer does not remember state");
            });

        });

        it('testGetterProceed', function() {
            const o = new CopExampleDummyClass();
            withLayers([DummyLayer], () => {
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
            const o = {}, layer1 = new Layer('LtestLayerPropertyWithShadow');
            cop.layerPropertyWithShadow(layer1, o, "a");
            o.a = 5;
            withLayers([layer1], function() {
                o.a = 10;
                assert.equal(o.a, 10, "shadow broken");
            });
            assert.equal(o.a, 5, "shadow don't changes base");
            withLayers([layer1], function() {
                assert.equal(o.a, 10, "shadow broken 2");
            });
        });

        it('testLayerClassPropertyWithShadow', function() {
            const o = new CopExampleDummyClass();
            cop.layerPropertyWithShadow(DummyLayer, o, "a");
            o.a = 5;
            withLayers([DummyLayer], function() {
                o.a = 10;
                assert.equal(o.a, 10, "shadow broken");
            });
            assert.equal(o.a, 5, "shadow breaks base");
            withLayers([DummyLayer], function() {
                assert.equal(o.a, 10, "shadow broken 2");
            });
        });

        it('testLayerPropertyWithShadowFallsBack', function() {
            const o = {};
            const layer1 = new Layer('LtestLayerPropertyWithShadowFallsBack');
            cop.layerPropertyWithShadow(layer1, o, "a");
            o.a = 5;
            withLayers([layer1], () => {
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
            withLayers([MyTestLayer1], () => {
                o.a = 9;
                withLayers([MyTestLayer2], function() {
                    o.a = 10;
                }.bind(this));
            });
            withLayers([MyTestLayer1], () => {
                assert.equal(o.a, 9, "outer layer broken")
                withLayers([MyTestLayer2], () => {
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
                proceed();
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
            withLayers([DummyLayer], () => {
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
            withLayers([DummyLayer], () => {
                assert.equal(o.k2(), 7, " layer is not activated in my object")
                assert.equal(o.myObject.count_dummy_k, 1, " layered method is excuted wrong number")
            });
        });

        it('testStateActivationAndWithoutLayers', function() {
            o.setWithLayers([DummyLayer]);
            withoutLayers([DummyLayer], () => {
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
        // TODO(jr): find out what this is about

        it('testOverrideActiveLayers', function() {
            const o = new CopExampleDummyClass();
            o.activeLayers = function() { return [] }
            withLayers([DummyLayer], function(){
                assert.equal(o.f(), 0, "layer is still active")
            });
        });

        it('testOverrideActiveLayersWithAdditionalLayer', function() {
            // object overrides the layer composition
            const o = new CopExampleDummyClass();
            // FIXME: this should not work because we no longer use Prototype.js
            o.activeLayers= function($super) {
                return $super().concat([DummyLayer2])
            };
            withLayers([DummyLayer], function() {
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

            CopProceedTestAddLayer = new Layer('CopProceedTestAddLayer')
            .refineClass(CopProceedTestClass, {
                m(a) {
                    return cop.proceed(a + 1)
                },
            });

            CopProceedPropertyTestLayer = new Layer('CopProceedPropertyTestLayer')
            .refineClass(CopProceedTestClass, {
                get p() {
                    return proceed() + " World"
                },

                set p(value) {
                    cop.proceed(value.charAt(0).toUpperCase() + value.slice(1))
                },

            });


            CopProceedMultAddLayer = new Layer('CopProceedMultAddLayer')
            .refineClass(CopProceedTestClass, {
                m(a) {
                    return cop.proceed(a) * 3
                }
            });

            CopProceedMultipleProceedLayer = new Layer('CopProceedMultipleProceedLayer')
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

        it('testAdaptArgumentsInLayer', function () {
            const o = {say(a) {return "Say: " +a}},
                  l = new Layer('L');
            l.refineObject(o, { say(a) {return cop.proceed(a + " World") + "!"}})
            assert.equal(o.say("Hello"), "Say: Hello", "test is broken");
            withLayers([l], () => {
                const result = o.say("Hello")
                assert.equal(result, "Say: Hello World!", "adapting arguments is broken");
            });
        });

        it('testMakeFunctionLayerAware', function() {
            // inlining does not use proceedStack
            if (cop.staticInlining || cop.dynamicInlining) return;

            // TODO: why do we test the proceedStack length? Shouldn't we test the behavior instead? (but most of the other tests do that)
            let newLength;
            const o = {m() { return 1 }};
            const layer = new Layer('someLayer').refineObject(o, {
                m() { newLength = cop.proceedStack.length }
            });
            const oldLength = cop.proceedStack.length;
            withLayers([layer], () => o.m());
            assert.isAbove(newLength, oldLength, "stack did not change")
        });

        it('testMakeFunctionLayerAwareSetsLayerComposition', function() {
            // inlining does not use proceedStack
            if (cop.staticInlining || cop.dynamicInlining) return;

            let partialMethods,
                object,
                prototypeObject,
                functionName;

            // FIXME: as cop is a Module now, this should not work
            cop.proceed = function() {
                const composition = cop.proceedStack[cop.proceedStack.length - 1];
                partialMethods = composition.partialMethods;
                object = composition.object;
                prototypeObject = composition.prototypeObject;
                functionName = composition.functionName;
            }

            const o = new CopProceedTestClass();
            withLayers([CopProceedTestAddLayer], () => {
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
            withLayers([CopProceedTestAddLayer], () => {
                assert.equal(o.m(2), 9, "add layer broken")
            });
        });

        it('testProceedFromMultOverAddToBase', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken");
            withLayers([CopProceedTestAddLayer], () => {
                withLayers([CopProceedMultAddLayer], () => {
                    assert.equal(o.m(2), 27, "mult and add layer broken");
                });
                assert.equal(o.m(2), 9, "mult and add layer broken");
            });
            assert.equal(o.m(2), 4, "mult and add layer broken");
        });

        it('testMultipleProceed', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken");
            withLayers([CopProceedMultipleProceedLayer], () => {
                assert.equal(o.m(1), 13, "CopProceedMultipleProceedLayer");
            });
        });

        it('testCurrentLayerComposition', function() {
            const o = new CopProceedTestClass();
            assert.strictEqual(this.currentLayerComposition, undefined, "layer composition is undefined");
            withLayers([CopProceedTestAddLayer], () => {
                assert.equal(o.m(2), 9, "add layer broken")
            });

        });

        it('testGetterAndSetterWithCopProceed', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken");
            assert.equal(o.p, "Hello", "base getter broken");

            withLayers([CopProceedPropertyTestLayer], () => {
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
            layer.refineObject(obj, {foo() {return proceed() + 1}});
            assert.strictEqual(cop.lookupLayeredFunctionForObject(obj, layer, 'toString'), undefined, 'toString should not be found')
        });
    });

    describe('layer uninstalling', function () {

        it('testLayerRemove', function() {
            // given
            const object1 = fixture().makeObject1();
            const context = {};
            const layer_obj = layer(context, 'TestLayerRemoveLayer');
            layer_obj.refineObject(object1, {
                f(x) { return x }
            });
            layer_obj.beGlobal();
            assert.equal(3, object1.f(3), 'layer not global');
            assert.isDefined(context.TestLayerRemoveLayer, 'layer not in context object');
            // when
            layer_obj.remove();
            // then
            assert.equal(0, object1.f(3), 'layer still global');
            assert.isUndefined(context.TestLayerRemoveLayer, 'layer still in context object');
        });

        // FIXME: this test case uses the global connect function
        xit('testMakeFunctionLayerUnawareThatIsConnected', function() {
            const obj1 = {m1(a) {return a}};
            const obj2 = {m2(b) {
                this.b = b;
                // do nothing
            }};

            const originalFunction = obj1.m1;

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
                m1() { return proceed() + 1 }
            });

            const layer2 = new Layer();
            layer2.refineObject(obj1, {
                m2() { return proceed() + 1 }
            });

            cop.uninstallLayersInObject(obj1);

            assert(obj1.m1 === originalM1, "obj1.m1 is still wrapped");
            assert(obj1.m2 === originalM2, "obj2.m2 is still wrapped");

        });

        function uninstallScenario() {
            const obj =  {
                m1: function() { return 1 },
                m2: function() { return 2 },
                m3: function() { return 3 }
            }
            const originalM2 = obj.m2;

            const TestLayer1 = new Layer('TestLayer1').refineObject(obj, {
                m1: function() { return proceed() + 1 },
                m3: function() { return proceed() + 1 }
            }).beGlobal();
            var singleLayeredM1 = obj.m1;

            const TestLayer2 = new Layer('TestLayer2').refineObject(obj, {
                m1: function() { return proceed() + 2 },
                m2: function() { return proceed() + 2 },
                m3: function() { return proceed() + 2 }
            }).beGlobal();

            const TestLayer3 = new Layer('TestLayer3').refineObject(obj, {
                m3: function() { return proceed() + 4 }
            }).beGlobal();
            const tripleLayeredM3 = obj.m3;

            assert.equal(obj.m1(), 1 + 1 + 2, 'm1 setup failed');
            assert.equal(obj.m2(), 2 + 2, 'm2 setup failed');
            assert.equal(obj.m3(), 3 + 1 + 2 + 4, 'm3 setup failed');

            return {
                obj, TestLayer1, TestLayer2, TestLayer3,
                originalM2, singleLayeredM1, tripleLayeredM3
            };
        }

        it('disables that layer', function() {
            const { obj, TestLayer2 } = uninstallScenario();
            // when
            TestLayer2.uninstall();
            // then
            assert.equal(obj.m1(), 1 + 1, 'm1 erroneously changed');
            assert.equal(obj.m2(), 2, 'm2 broken after uninstall');
            assert.equal(obj.m3(), 3 + 1 + 4, 'm3 layers broken after uninstall');
        });

        // TODO: function unwrapping on uninstall is currently not supported
        xit('unwraps functions if no layers are left for them', function () {
            const { obj, TestLayer2, singleLayeredM1, originalM2,
                tripleLayeredM3 } = uninstallScenario();
            // when
            TestLayer2.uninstall();
            // then
            assert(obj.m1 === singleLayeredM1, "obj.m1 is not wrapped anymore.");
            assert(obj.m2 === originalM2, "obj.m2 is still wrapped.");
            assert(obj.m3 === tripleLayeredM3, "obj.m3 is not wrapped anymore.");
        });
    });

    describe('unrefineObject', function () {
        it('testUntrefineObject', function() {
            const object = {foo() {return 3 }};

            const layer = new Layer("TestLayer");
            layer.refineObject(object, {
                foo() {
                    return proceed() + 4
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
                    return proceed() + 4
                }
            });

            assert(cop.getLayerDefinitionForObject(layer, klass.prototype), "no layer definition");
            layer.unrefineClass(klass);
            assert.isUndefined(cop.getLayerDefinitionForObject(layer, klass.prototype),
                               "layer definition still there");
        });
    });
});

