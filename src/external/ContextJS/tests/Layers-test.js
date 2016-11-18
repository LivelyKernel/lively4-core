/*
 * Copyright (c) 2008-2016 Hasso Plattner Institute
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

import '../src/module_import.js';
import * as cop from '../src/Layers.js';
import { LayerableObject } from '../src/Layers.js';

import './globalChai.js'

const assert = chai.assert;

// COP Example from: Hirschfeld, Costanza, Nierstrasz. 2008.
// Context-oriented Programming. JOT)
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
            layer1.refineObject(this.object1, {
                f(a, b) {
                    currentTest.execution.push("l1.f");
                    console.log("execute layer1 function for f");
                    return proceed(a, b) + a;
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
            layer2.refineObject(this.object1, {
                f(a, b) {
                    currentTest.execution.push("l2.f");
                    // console.log("execute layer2 function for f");
                    return proceed(a, b) + b;
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
            layer3.refineObject(this.object1, {
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

        it('activates a layer in dynamic scope', function() {
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

        it('can activate two layers simultaneously', function() {
            const f = fixture();
            const object1 = f.makeObject1();
            const layer1 = f.makeLayer1();
            const layer2 = f.makeLayer2();
            withLayers([layer1, layer2], function() {
                assert.equal(object1.f(3,4), 7, "result of f() failed");
                assert.equal(currentTest.execution.toString(), ["l2.f", "l1.f", "d.f"]);
            });
        });

        it('activates two layers in the specified order', function() {
            const f = fixture();
            const object1 = f.makeObject1();
            const layer1 = f.makeLayer1();
            const layer2 = f.makeLayer2();
            withLayers([layer2, layer1], function() {
                object1.f();
                assert.equal(currentTest.execution.toString(), ["l1.f", "l2.f", "d.f"]);
            });
        });

        it('can activate three layers simultaneously', function() {
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

        it('can activate three layers simultaneously (with empty layer)', function() {
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

        it('HTML example', function() {
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

        it('can be nested', function() {
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

        it('tolerates duplicate activation of a layer', function() {
            const layer1 = new Layer('LtestDup');
            withLayers([layer1], () => {
                withLayers([layer1], () => {
                    assert.equal(cop.currentLayers().length, 1, "layer1 activated twice");
                });
                assert.equal(cop.currentLayers().length, 1, "layer1 is deactivated");
            });
        });

        it('can be countered by withoutLayers (scoped deactivation)', function() {
            const layer1 = new Layer('LtestLayerDeactivation1');
            const layer2 = new Layer('LtestLayerDeactivation2');
            withLayers([layer1, layer2], () => {
                withoutLayers([layer2], () => {
                    assert.equal(cop.currentLayers().length, 1, "layer2 is not deactiveated");
                });
                assert.equal(cop.currentLayers().length, 2, "layer2 is not reactivated");
            });
        });

        it('can be nested in with withoutLayers', function() {
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

        it('cleans up layer activations if an error is thrown', function() {
            const layer1 = new Layer('LtestErrorInLayeredActivation')
            const object1 = fixture().makeObject1();
            layer1.refineObject(object1, {
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

        it('reactivates layers if an error is thrown in a scoped deactivation', function() {
            const layer1 = new Layer('LtestErrorInLayeredDeactivation');
            const f = fixture();
            const object1 = f.makeObject1();
            layer1.refineObject(object1, {
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

    describe('object refinement', function () {

        it('overrides methods when the layer is active', function () {
            const example = {
                f() { return 1 }
            };
            // when
            const layer = new Layer().refineObject(example, {
                f() { return 2 }
            });
            // then
            assert.equal(example.f(), 1, 'method should behave unchanged when the layer is inactive');
            withLayers([layer], () => {
                assert.equal(example.f(), 2, 'method should behave according to the layer definition if the layer is active');
            });
        });

        it('overrides methods from the prototype chain', function () {
            class Example {
                f() { return 1 }
            }
            const example = new Example();
            const unchanged = new Example();
            // when
            const layer = new Layer().refineObject(example, {
                f() { return 2 }
            });
            // then
            assert.equal(example.f(), 1,
                    'method should behave unchanged when the layer is inactive');
            withLayers([layer], () => {
                assert.equal(example.f(), 2,
                    'method should behave as defined in the layer if the layer is active');
                assert.equal(unchanged.f(), 1,
                    "not refined object's method should behave unchanged");
            });
        });

        it('can refine multiple objects per layer', function() {
            const layer = new Layer('LtestLayerObjectsInOneLayer');
            const o1 = {f() {return 1}};
            const o2 = {f() {return 2}};
            layer.refineObject(o1, {
                f() {
                    return 3
                },
            });
            layer.refineObject(o2, {
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

    describe('class refinement', function () {

        it('changes behavior of methods', function() {
            // given
            const layer1 = new Layer('LtestLayerClass');
            class Example {
                constructor() {
                    this.execution = [];
                }
                f(a, b) {
                    this.execution.push("f");
                    return a + b;
                }
            }
            layer1.refineClass(Example, {
                f(a, b) {
                    this.execution.push("l1.f");
                    return a * b;
                },
            });
            const object1 = new Example();
            assert.equal(object1.f(2,3), 2 + 3, "method should not change when the layer is not active");
            // when
            withLayers([layer1], () => {
                const r = object1.f(2,3);
                // then
                assert.equal(r, 2 * 3, "method behavior should change when the layer is active");
                assert.equal(object1.execution.toString(), ["f", "l1.f"]);
            })
        });

        it('works with proceed', function () {
            // given
            const layer1 = new Layer('LtestLayerClass');
            class Example {
                constructor() {
                    this.execution = [];
                }
                f(a, b) {
                    this.execution.push("f");
                    return a + b;
                }
            }
            layer1.refineClass(Example, {
                f(a, b) {
                    this.execution.push("l1.f");
                    return proceed(a, b) + a * b;
                },
            });
            const object1 = new Example();
            assert.equal(object1.f(2,3), 2 + 3, "method should not change when the layer is not active");
            // when
            withLayers([layer1], () => {
                const r = object1.f(2,3);
                // then
                assert.equal(r, 2 + 3 + 2 * 3, "method behavior should change when the layer is active");
                assert.equal(object1.execution.toString(), ["f", "l1.f", "f"]);
            })
        });

        it('works with nested layer activations', function() {
            class Example {
                f() { return 0 }
            }
            const layer1 = new Layer().refineClass(Example, {
                f() { return 1 }
            });
            const layer2 = new Layer().refineClass(Example, {
                f() { return 2 }
            });
            const o = new Example();
            assert.equal(o.f(), 0, "no layer should apply");
            withLayers([layer1], () => {
                assert.equal(o.f(), 1, "layer1 should apply");
                withLayers([layer2], () => {
                    assert.equal(o.f(), 2, "layer2 should apply");
                })
            });
        });

        describe('method added by the layer', function () {
            class Example {}
            const layer = new Layer().refineClass(Example, {
                newMethod() { return "totally new" }
            });

            it('is available when the layer is active', function() {
                const o = new Example();
                withLayers([layer], () => {
                    assert.isDefined(o.newMethod, "new method is not there");
                    assert.equal(o.newMethod(), "totally new","layered newMethod() is wrong");
                });
            });

            xit('is not available when the layer is not active', function () {
                const o = new Example();
                assert.throws(() => o.newMethod());
                withLayers([layer], () => {
                    withoutLayers([layer], () => {
                        assert.throws(() => o.newMethod());
                    });
                });
            });

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

    it('testLayerMethod', function() {
        // TODO: why do we need this syntax in addition to refineObject?
        const object1 = { f() { return 0 }, g() { return 1 } },
            layer1 = new Layer('LtestLayerMethod');

        cop.layerMethod(layer1, object1, "f", function(){
            return proceed() + 1});

        assert.equal(object1.f(), 0, "f should behave unchanged");
        assert.equal(object1.g(), 1, "g should behave unchanged");
        withLayers([layer1], () => {
            assert.equal(object1.f(), 1, "f should behave differently with layer");
            assert.equal(object1.g(), 1, "unlayered g should behave unchanged with layer");
        });
        assert.equal(object1.f(), 0, "f should behave unchanged with layer off again");
        // assert(cop.getLayerDefinitionForObject(layer1, object1).property('f'), "f did not get stored");

        cop.layerMethod(layer1, object1, "g", function(){ return 2 });

        assert.equal(object1.g(), 1, "layered g should behave unchanged without layer");
        withLayers([layer1], () => {
            assert.equal(object1.g(), 2, "layered g should behave differently with layer");
            assert.equal(object1.f(), 1, "f should still be layered");
        });
        assert.equal(object1.g(), 1, "layered g should behave unchanged after layer deactivation");
    });

    it('stores partial methods for class prototypes', function() {
        class Example {
            f() { return 0 }
            h() { return 1 }
        }
        const layer1 = new Layer().refineClass(Example, {
            f() { return -0 }
        });
        const layer2 = new Layer().refineClass(Example, {
            h() { return -1 }
        });
        // FIXME: implementation detail?
        const partialLayer1 = cop.getLayerDefinitionForObject(layer1, Example.prototype)
        assert.isFunction(partialLayer1.property('f'), "f did not end up in layer");
        const partialLayer2 = cop.getLayerDefinitionForObject(layer2, Example.prototype);
        assert.isFunction(partialLayer2.property('h'), "layer2 has no method for h");
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
        // FIXME: the following tests all assert on currentLayers(), why not test the behavior instead?
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

    describe('in subclasses', function () {

        describe('a layered inherited method', function () {
            class Base {
                f2() {}
                m1() { return 1 }
                m2() { return "m2" }
            }
            class Child extends Base {
                m1() { return 10 }
                m2() { return "S$m2" }
            }
            class OtherChild extends Base {
            }
            const DummyLayer = new Layer('DummyLayer');
            DummyLayer.refineClass(Base, {
                f2() {},
                newFoo() { return 'newFoo' },
                m2() { return "D$m2," + proceed() }
            });
            DummyLayer.refineClass(Child, {
                m1 () { return 11 },
            });
            DummyLayer.refineClass(OtherChild, {
                m1() { return 101 }
            });
            
            it('is layer-aware', function() {
                const o = new Child();
                assert(o.f2.isLayerAware,
                    "function is not layer aware when subclassing not directly from object")
            });

            it('behaves differently when the layer is active', function() {
                const o = new Child();
                assert.equal(o.m1(), 10, "subclassing is broken")
                withLayers([DummyLayer], () => {
                    assert.equal(o.m1(), 11, "layer in subclass is broken")
                });
            });

            it('can be layered differently in another child class', function() {
                const o = new OtherChild();
                assert.equal(o.m1(), 1, "base is broken")
                withLayers([DummyLayer], () => {
                    assert.equal(o.m1(), 101, "layer in second subclass is broken")
                });
            });

        });

        describe('an added layered method', function () {
            class Base {}
            class Child extends Base { }
            const DummyLayer = new Layer('DummyLayer');

            it('is available if it was added in the superclass by the layer', function() {
                // when
                DummyLayer.refineClass(Base, {
                    newFoo() { return 'newFoo' },
                });
                const o = new Child();
                // then
                withLayers([DummyLayer], () => {
                    // newFoo is added to Base by DummyLayer
                    assert.equal(o.newFoo(), "newFoo", "newFoo is broken");
                });
            });

        });

        describe('an unlayered inherited method', function () {
            class Base {
                fooo() { return "base" }
            }
            class Child extends Base {}

            it('can be layered in the subclass', function() {
                // when
                const DummyLayer = new Layer('DummyLayer');
                DummyLayer.refineClass(Base, {
                    newFoo() { return 'newFoo' }
                });
                DummyLayer.refineClass(Child, {
                    fooo() { return proceed()+"-layer-"+this.newFoo() }
                });
                const o = new Child();
                // then
                assert.equal(o.fooo(), "base", "base is broken");
                withLayers([DummyLayer], () => {
                    assert.equal(o.fooo(), "base-layer-newFoo", "Child is broken");
                });
            });

        });

        describe('a method overridden by the subclass', function () {
            class Base {
                m1() { return "m1" }
                m2() { return "m2" }
            }
            const DummyLayer = new Layer('DummyLayer');
            DummyLayer.refineClass(Base, {
                m1() { return "L$m1a " + proceed() + " L$m1b" },
                m2() { return "D$m2," + proceed() }
            });
            class Child extends Base {
                m1() { return "S$m1a " + super.m1() + " S$m1b" }
                m2() { return "S$m2" }
            }

            it('is not layered', function() {
                const o = new Base();
                withLayers([DummyLayer], () => {
                    assert.equal(o.m2(), "D$m2,m2", "installing wrappers on base class broken");
                });
                const s = new Child();
                withLayers([DummyLayer], () => {
                    assert.equal(s.m2(), "S$m2", "not installing wrappers on subclassing broken`");
                });
            });

            it('invokes layered behavior on super calls', function() {
                const o = new Base();
                assert.equal(o.m1(), "m1", "unlayered m1 in superclass broken");
                withLayers([DummyLayer], () => {
                    assert.equal(o.m1(), "L$m1a m1 L$m1b", "layered m1 broken");
                });
                const s = new Child();
                assert.equal(s.m1(), "S$m1a m1 S$m1b", "base S$m1 broken");
                withLayers([DummyLayer], () => {
                    assert.equal(s.m1(), "S$m1a L$m1a m1 L$m1b S$m1b", "layered S$m1 broken");
                });
            });

            it('can be layered independently from super', function () {
                const s = new Child();
                // when
                const layer = new Layer().refineClass(Child, {
                    m2() { return 'L$m2,' + proceed() }
                });
                withLayers([layer], () => {
                    // then
                    assert.equal(s.m2(), "L$m2,S$m2", "layered S$m2 broken");
                });
                // when
                withLayers([DummyLayer], () => {
                    // then
                    assert.equal(s.m2(), "S$m2", "should not be affected by refinements on super");
                });
            });

        });

    });

    describe('Layer', function () {
        it('overrides toString to return the layer name', function () {
            assert.equal(new Layer('TheName').toString(), 'TheName');
            assert.equal(layer('TestName').toString(), 'TestName');
        });

        it('has a symbol as name by default', function () {
            assert.isDefined(new Layer().name, 'name should not be undefined');
            const name1 = new Layer().name;
            const name2 = new Layer().name;
            assert.notStrictEqual(name1, name2, 'anonymous layers should not share names');
        });

        it('returns itself from #refineObject', function() {
            const layer = new Layer("MyDummyLayer2");
            const o = {foo() {return 1}}
            const refineReturnValue = layer.refineObject(o, {
                foo() { }
            });
            assert.strictEqual(layer, refineReturnValue, "refineObject should return the layer")
        });

        it('returns itself from #refineClass', function () {
            const layer = new Layer();
            class Subject {}
            assert.strictEqual(layer, layer.refineClass(Subject, {}),
                'refineClass should return its receiver');
        });

        it('can be activated globally with #beGlobal', function() {
            const l = new Layer();
            l.beGlobal();
            assert.include(cop.GlobalLayers, l, "be global is broken")
        });

        describe('reinstall', function () {
            it('reenables composition on methods that were overwritten', function () {
                class Example {
                    version() { return "1" }
                }
                const aLayer = new Layer().refineClass(Example, {
                    version() { return proceed() + "a" }
                });
                const ex = new Example();
                assert.isTrue(ex.version.isLayerAware, "method should now be layer aware");
                // when
                Object.defineProperty(Example.prototype, 'version', {
                   value() { return "2" },
                   configurable: true
                });
                assert.isNotOk(ex.version.isLayerAware, "method should now be layer unaware");
                aLayer.reinstallInClass(Example);
                // then
                assert.isTrue(ex.version.isLayerAware, "method should be layer aware again");
                withLayers([aLayer], () => assert.equal(ex.version(), "2a",
                        "method should be layer aware again"));
            });

            it('reenables composition on accessors that were overwritten', function () {
                class Example {
                    constructor () { this._value = 0 }
                    get version() { return "1" }
                    get value() { return this._value }
                    set value(newValue) { this._value = newValue }
                }
                const aLayer = new Layer().refineClass(Example, {
                    get version() { return proceed() + "a" },
                    set value(newValue) { proceed(-newValue) }
                });
                const ex = new Example();
                // when
                Object.defineProperties(Example.prototype, {
                    version: {
                        get() { return "2" },
                        configurable: true
                    },
                    value: {
                        get() { return this._value * 2 },
                        set(newValue) { this._value = newValue / 2 },
                        configurable: true
                    }
                });
                withLayers([aLayer], () => {
                    assert.equal(ex.version, "2", "getter should now be layer unaware");
                    ex.value = 4;
                    assert.equal(ex.value, 4, "setter should now be layer unaware");
                });
                aLayer.reinstallInClass(Example);
                // then
                ex.value = 2;
                assert.equal(ex.value, 2, "setter should be unchanged with inactive layer");
                withLayers([aLayer], () => {
                    assert.equal(ex.version, "2a", "getter should be layer aware again");
                    ex.value = 4;
                    assert.equal(ex.value, -4, "setter should be layer aware again");
                });
            });
        });
    });

    describe('overwriting layered properties', function () {
        it('will not make methods layer unaware', function () {
            // given
            class Example {
                m() { return 1 }
            }
            // when
            const layer1 = new Layer().refineClass(Example, {
                m() { return proceed() + 1 }
            });
            Example.prototype.m = function () { return 2 }
            // then
            assert.equal(new Example().m(), 2, 'new method definition should apply');
            withLayers([layer1], () => assert.equal(new Example().m(), 3,
                'method should still be layered after redefinition'));
        });
    });

    describe('state provided by layers', function () {

        it('testMakePropertyLayerAware', function() {
            const o = {a: 3};

            assert.equal(o.a, 3, "getter is broken");
            o.a = 4;
            assert.equal(o.a, 4, "setter is broken");
            const MyTestLayer1 = new Layer().refineObject(o, {
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

        it('can provide refined getter', function() {
            const o = {a: 5};

            const layer1 = new Layer('L1');
            layer1.refineObject(o, {get a() { return 10 }})
            assert.equal(o.a, 5, "property access is broken");

            const layer2 = new Layer('empty');
            withLayers([layer1], function() {
                assert.equal(o.a, 10, "layer getter broken");
                withLayers([layer2], function() {
                    assert.equal(o.a, 10, "with empty inner layer getter broken");
                });
            });
            assert.equal(o.a, 5, "getter broken after activation");
        });

        it('can provide refined getter and setter', function() {
            const o = {a: 5, l1_value: 10};
            const layer1 = new Layer('L1');
            // when
            layer1.refineObject(o, {
                get a() { return this.l1_value },
                set a(value) { return this.l1_value = value }
            });
            // then
            assert.equal(o.a, 5, "property access is broken");
            o.a = 6;
            assert.equal(o.a, 6, "property setter is broken");
            withLayers([layer1], () => {
                assert.equal(o.a, 10, "layer getter broken");
                o.a = 20;
                assert.equal(o.l1_value, 20, "layer setter broken");
            });
            assert.equal(o.a, 6, "getter broken after activation");
            o.a = 7;
            assert.equal(o.a, 7, "setter broken after activation");
            // FIXME: implementation detail?
            const layerDef = cop.getLayerDefinitionForObject(layer1,o);
            assert.isFunction(layerDef.setterMethod('a'),
                "layer1 has no setter for a");
            assert.isTrue(Object.getOwnPropertyDescriptor(o, "a").set.isLayerAware,
                          "o.a setter is not layerAware");
        });

        it('can provide a getter for a new property in a class', function() {
            class Example {}
            const o = new Example();
            const o2 = new Example();
            const layer1 = new Layer('LtestGetterAndSetterClassInLayer');
            layer1.refineClass(Example, {
                get a() { return 10 }
                // no access to a before refineClass
            });
            o.a = 5; // now we can initialize that property if we wish
            o2.a = 7;
            assert(Object.getOwnPropertyDescriptor(Example.prototype, "a").get, "DummyClass has no getter for a");

            assert.equal(o.a, 5, "layer getter broken after initialization");
            withLayers([layer1], () => {
                assert.equal(o.a, 10, "layer getter broken");
            });
            assert.equal(o.a, 5, "layer getter broken after activation");
            assert.equal(o2.a, 7, "layer getter broken after activation for o2");
        });

        it('can provide a getter in the class for an existing property', function() {
            class Example {
                constructor() {
                    this.a = 0;
                }
            }
            const layer1 = new Layer('LtestGetterAndSetterClassInLayer');
            layer1.refineClass(Example, {
                get a() {
                    return 10;
                },
            });
            const o = new Example();
            const o2 = new Example();
            assert.equal(o.a, 0, "getter broken");
            o.a = 5; // set the "primitive" property
            assert.equal(o.a, 5, "setter broken");
            o2.a = 7;
            assert(Object.getOwnPropertyDescriptor(Example.prototype, "a").get, "DummyClass has no getter for a");
            withLayers([layer1], () => {
                assert.equal(o.a, 10, "layer getter broken");
            });
            assert.equal(o.a, 5, "layer getter broken after activation");
            assert.equal(o2.a, 7, "layer getter broken after activation for o2");
        });

        xit('can provide a getter in the class for for an existing property for existing objects', function() {
            class Example {
                constructor() {
                    this.a = 0;
                }
            }
            const o = new Example(); // note: object created before refine!
            const o2 = new Example();
            const layer1 = new Layer('LtestGetterAndSetterClassInLayer');
            layer1.refineClass(Example, {
                get a() {
                    return 10;
                },
            });
            assert.equal(o.a, 0, "getter broken");
            o.a = 5; // set the "primitive" property
            assert.equal(o.a, 5, "setter broken");
            o2.a = 7;
            assert(Object.getOwnPropertyDescriptor(Example.prototype, "a").get, "DummyClass has no getter for a");
            withLayers([layer1], () => {
                assert.equal(o.a, 10, "layer getter broken");
            });
            assert.equal(o.a, 5, "layer getter broken after activation");
            assert.equal(o2.a, 7, "layer getter broken after activation for o2");
        });

        it('can provide state for classes as a new property', function() {
            class Example {}
            const o1 = new Example(),
                  o2 = new Example(),
                  layer1 = new Layer('LtestLayerStateInTwoObjects1');
            layer1.refineClass(Example, {
                get a() { return this.l1_value },
                set a(value) { this.l1_value = value },
            });
            o1.a = 1; // now we can initialize that property if we wish
            assert.equal(o1.a, 1, "setter or getter broken");
            withLayers([layer1], () => {
                o1.a = 20;
                o2.a = 30;
                assert.equal(o1.a, 20, "layer state in first object broken");
                assert.equal(o2.a, 30, "layer state in second object broken");
            });
            assert.equal(o1.a, 1, "getter broken after layer activation");
            o1.a = 2;
            assert.equal(o1.a, 2, "setter broken after layer activation");
        });

        it('can provide state for classes as an existing property', function() {
            class Example {
                constructor() {
                    this.e = "Hello";
                }
            }
            const layer = new Layer().refineClass(Example, {
                get e() { return this._Layer_e },
                set e(value) { this._Layer_e = value }
            });
            const o = new Example();
            assert(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(o), "e").get, "o.e has no getter");
            assert.equal(o.e, "Hello", "layer getter broken after initialization");
            // no setter call for o.e so far, except in the constructor
            withLayers([layer], () => {
                o.e = "World"
                assert.equal(o.e, "World", "layer getter broken");
            });
            assert.equal(o.e, "Hello", "layer getter broken after activation");
            withLayers([layer], () => {
                assert.equal(o.e, "World", "layer does not remember state");
            });
        });

        xit('can provide state for classes as an existing property for existing objects', function() {
            class Example {
                constructor() {
                    this.a = 0;
                }
            }
            const o1 = new Example(), // note: object created before refine!
                  o2 = new Example(),
                  layer1 = new Layer('LtestLayerStateInTwoObjects1');
            layer1.refineClass(Example, {
                get a() { return this.l1_value },
                set a(value) { this.l1_value = value },
            });
            assert.equal(o1.a, 0, "getter broken");
            o1.a = 1; // set "primitive" property
            assert.equal(o1.a, 1, "setter broken");
            withLayers([layer1], () => {
                o1.a = 20;
                o2.a = 30;
                assert.equal(o1.a, 20, "layer state in first object broken");
                assert.equal(o2.a, 30, "layer state in second object broken");
            });
            assert.equal(o1.a, 1, "getter broken after layer activation");
            o1.a = 2;
            assert.equal(o1.a, 2, "setter broken after layer activation");
        });

        it('allows proceed in getters', function() {
            class Example {
                constructor() {
                    this.m = "Hello";
                }
            }
            const layer = new Layer().refineClass(Example, {
                get m() { return proceed() + " World" }
            });
            const o = new Example();
            withLayers([layer], () => {
                assert.equal(o.m, "Hello World", "layer getter broken");
            });
        });

        it('installs partial accessors correctly', function() {
            class Example {
                constructor() {
                    this.e = "Hello";
                }
            }
            const layer = new Layer().refineClass(Example, {
                get e() { return this._Layer_e },
                set e(value) { this._Layer_e = value }
            });
            let getter = Object.getOwnPropertyDescriptor(Example.prototype, "e").get;
            assert.isDefined(getter, "no getter in class");
            // FIXME: implementation detail?
            const layerDef = cop.getLayerDefinitionForObject(layer, Example.prototype);
            assert.isDefined(layerDef.getterMethod('e'), "no getter in partial class");
        });

        it('can create layer specific bindings for properties', function() {
            const o = {}, layer1 = new Layer('LtestLayerPropertyWithShadow');
            // FIXME: deprecated syntax
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

        it('can create layer specific bindings for properties in classes', function() {
            class Example {
                constructor() {
                    this.a = 0;
                }
            }
            const layer = new Layer();
            // FIXME: deprecated syntax
            cop.layerPropertyWithShadow(layer, Example.prototype, "a");
            const o = new Example();
            o.a = 5;
            withLayers([layer], function() {
                o.a = 10;
                assert.equal(o.a, 10, "shadow broken");
            });
            assert.equal(o.a, 5, "shadow breaks base");
            withLayers([layer], function() {
                assert.equal(o.a, 10, "shadow broken 2");
            });
        });

        it('falls back to unlayered value if layer specific binding does not exist', function() {
            const o = {};
            const layer1 = new Layer('LtestLayerPropertyWithShadowFallsBack');
            // FIXME: deprecated syntax
            cop.layerPropertyWithShadow(layer1, o, "a");
            o.a = 5;
            withLayers([layer1], () => {
                assert.equal(o.a, 5, "fallback is broken");
            });
        });

        it('keeps layer specific bindings separated across layers', function() {
            class MyClass {
                constructor() {
                    this.a = 7;
                }
            }
            const MyTestLayer1 = new Layer().refineClass(MyClass, {
                get a() {
                    return this._MyLayer_a;
                },
                set a(v) {
                    this._MyLayer_a = v;
                }
            });
            const MyTestLayer2 = new Layer().refineClass(MyClass, {
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
                withLayers([MyTestLayer2], () => {
                    o.a = 10;
                });
            });
            withLayers([MyTestLayer1], () => {
                assert.equal(o.a, 9, "outer layer broken")
                withLayers([MyTestLayer2], () => {
                    assert.equal(o.a, 10, "inner layer broken")
                });
            });
        });
    });

    describe('object with structurally scoped layers', function () {
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

        const DummyLayer = new Layer();
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

        let o;
        beforeEach('initialize the test object', function () {
            o = new DummyLayerableObject();
        });

        it('holds a set of activated layers', function() {
            o.setWithLayers([DummyLayer]);
            const layers = o.withLayers;
            assert.sameMembers(layers, [DummyLayer], "no layers active")
        });

        it('behaves normally without own (de)activated layers', function() {
            assert.equal(o.f(), 3, " default fails");
            withLayers([DummyLayer], () => {
                assert.equal(o.f(), 4, " dynamic layer activation is broken");
            });
        });

        it('applies layers activated on itself to its behavior', function() {
            o.setWithLayers([DummyLayer]);
            const r = o.structuralLayers({withLayers: [], withoutLayers: []})
            assert.strictEqual(r.withLayers[0], DummyLayer, "layer not set");
            assert.equal(o.f(), 4, " layered object broken");
        });

        it('does not apply its own layers to unowned objects', function() {
            o.setWithLayers([DummyLayer]);
            assert.equal(o.k1(), 5, " layer is activated in other object?")
        });

        it('does apply its own layers to owned objects', function() {
            o.setWithLayers([DummyLayer]);
            assert.equal(o.k2(), 7, " layer is not activated in my object")
        });

        it('only applies each layer once to each method', function() {
            o.setWithLayers([DummyLayer]);
            withLayers([DummyLayer], () => {
                assert.equal(o.k2(), 7, " layer is not activated in my object")
                assert.equal(o.myObject.count_dummy_k, 1, "number of layered method invocations is wrong")
            });
        });

        it('does not apply own activated layers if they are deactivated dynamically', function() {
            o.setWithLayers([DummyLayer]);
            withoutLayers([DummyLayer], () => {
                assert.equal(o.k2(), 5, " layer is not deactivated in my object")
            });
        });

        it('does not apply own activated layers to an owned object if it disables the layer for itself', function() {
            o.setWithLayers([DummyLayer]);
            o.myObject.setWithoutLayers([DummyLayer]);
            assert.equal(o.k2(), 5, " layer is not deactivated in my object")
        });

        it("provides itself as `this` in layer's partial methods", function() {
            o.setWithLayers([DummyLayer]);
            assert.strictEqual(o.thisRef(), o, " 'this' reference is broken")
        });

        it('activates each layer only once even if owned objects activate the same layer again', function() {
            o.setWithLayers([DummyLayer]);
            o.myObject.setWithLayers([DummyLayer]);
            const r = o.structuralLayers({withLayers: [], withoutLayers: []})
            assert.equal(r.withLayers.length, 1);
        });

        const DummyLayer2 = new Layer();

        it('enables layers structurally with #addWithLayer', function() {
            o.addWithLayer(DummyLayer);
            assert(o.withLayers.length, 1, "add failed")
            o.addWithLayer(DummyLayer);
            assert(o.withLayers.length, 1, "second add failed")
            o.addWithLayer(DummyLayer2);
            assert(o.withLayers.length, 2, "third add failed")
        });

        it('disables layers structurally with #removeWithLayer', function() {
            o.setWithLayers([DummyLayer, DummyLayer2]);
            o.removeWithLayer(DummyLayer);
            assert(o.withLayers.length, 1, "remove failed")
            o.removeWithLayer(DummyLayer);
            assert(o.withLayers.length, 1, "remove failed")
        });
    });

    describe('object with #activeLayers method', function () {

        it('overrides dynamically activated layers', function() {
            class Example { f() { return 0 } }
            const layer = new Layer().refineClass(Example, { f() { return 1 } });
            const o = new Example();
            o.activeLayers = function() { return [] }
            withLayers([layer], function(){
                assert.equal(o.f(), 0, "layer is still active")
            });
        });

        it('receives a function argument that retrieves environment layers in #activeLayers', function() {
            // object overrides the layer composition
            class Example {
                f() { return 0 }
                activeLayers(envLayers) { return envLayers().concat([layer2]) }
            // o.activeLayers= function($super) {
            //     return $super().concat([DummyLayer2])
            // };
            }
            const layer1 = new Layer().refineClass(Example, {
                f() { return proceed() + 100 }
            });
            const layer2 = new Layer().refineClass(Example, {
                f() { return proceed() + 1000 }
            });
            const o = new Example();
            withLayers([layer1], function() {
                assert.equal(o.f(), 1100, "active layers failed")
            });
        });
    });

    describe('proceed', function () {
        it('invokes the next partial method', function() {
            const layer1 = new Layer('LtestLayerObject');
            const object1 = fixture().makeObject1();
            layer1.refineObject(object1, {
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

        let CopProceedTestClass,
            CopProceedTestAddLayer,
            CopProceedPropertyTestLayer,
            CopProceedMultAddLayer,
            CopProceedMultipleProceedLayer;

        function setupClasses() {
            CopProceedTestClass = class CopProceedTestClass {
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
                    return cop.proceed() + " World"
                },

                set p(value) {
                    proceed(value.charAt(0).toUpperCase() + value.slice(1))
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

        it('can provide different arguments to the next partial method', function () {
            const o = {say(a) {return "Say: " +a}},
                  l = new Layer('L');
            l.refineObject(o, { say(a) {return proceed(a + " World") + "!"}})
            assert.equal(o.say("Hello"), "Say: Hello", "test is broken");
            withLayers([l], () => {
                const result = o.say("Hello")
                assert.equal(result, "Say: Hello World!", "adapting arguments is broken");
            });
        });

        it('keeps a stack of methods with different proceed chains', function() {
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

        it('has an active layer composition for each method call', function() {
            // inlining does not use proceedStack
            if (cop.staticInlining || cop.dynamicInlining) return;

            let partialMethods,
                object;

            // FIXME: as cop is a Module now, this should not work
            cop.proceed = function() {
                const composition = cop.proceedStack[cop.proceedStack.length - 1];
                partialMethods = composition.partialMethods;
                object = composition.object;
            }

            const o = new CopProceedTestClass();
            withLayers([CopProceedTestAddLayer], () => {
                o.m();
            });

            assert(partialMethods, "no partialMethods");
            assert(object, "no  object");
        });

        it('can provide different arguments to the next partial method (defined in class)', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken")
            withLayers([CopProceedTestAddLayer], () => {
                assert.equal(o.m(2), 9, "add layer broken")
            });
        });

        it('traverses layers in their order of activation', function() {
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

        it('can be called multiple times in a partial method', function() {
            const o = new CopProceedTestClass();
            assert.equal(o.m(2), 4, "base class broken");
            withLayers([CopProceedMultipleProceedLayer], () => {
                assert.equal(o.m(1), 13, "CopProceedMultipleProceedLayer");
            });
        });

        it('testCurrentLayerComposition', function() {
            // TODO: what does this do? currentLayerComposition is not defined anywhere
            const o = new CopProceedTestClass();
            assert.strictEqual(this.currentLayerComposition, undefined, "layer composition is undefined");
            withLayers([CopProceedTestAddLayer], () => {
                assert.equal(o.m(2), 9, "add layer broken")
            });

        });

        it('can also be used in property accessors', function() {
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
        describe('PartialLayer', function () {
            it('does not contribute inherited properties to the layer', function() {
                const layer = new Layer();
                const obj = {foo() {return 3} };
                layer.refineObject(obj, {foo() {return proceed() + 1}});
                // the object literal has a toString method, like every object
                // but the layer should not modify toString of its targets
                assert.isUndefined(cop.lookupLayeredFunctionForObject(obj, layer, 'toString'), 'toString should not be found')
            });
        });
    });

    describe('layer uninstalling', function () {

        describe('#remove', function () {
            it('deactivates the layer globally', function() {
                // given
                const object1 = fixture().makeObject1();
                const layer = new Layer();
                layer.refineObject(object1, {
                    f(x) { return x }
                });
                layer.beGlobal();
                assert.equal(3, object1.f(3), 'layer not active');
                // when
                layer.remove();
                // then
                assert.equal(0, object1.f(3), 'layer still active');
            });

            it('removes the layer from its context object', function () {
                // given
                const context = {};
                const layer1 = layer(context, 'TestLayerRemoveLayer');
                assert.isDefined(context.TestLayerRemoveLayer, 'layer not in context object');
                // when
                layer1.remove();
                // then
                assert.isUndefined(context.TestLayerRemoveLayer, 'layer still in context object');
            });
        });

        describe('uninstallLayersInObject(anObject)', function () {
            it('unwraps all properties of anObject (makes them layer-unaware)', function() {
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
                // when
                cop.uninstallLayersInObject(obj1);
                // then
                assert.equal(obj1.m1(), 3, "layers still applied");
                assert.equal(obj1.m2(), 2, "layers still applied");
                assert(obj1.m1 === originalM1, "obj1.m1 is still wrapped");
                assert(obj1.m2 === originalM2, "obj2.m2 is still wrapped");
            });
        });

        describe('#uninstall', function () {
            let obj, TestLayer1, TestLayer2, TestLayer3;
            let originalM2, singleLayeredM1, tripleLayeredM3;
            beforeEach('set up the scenario', function () {
                obj =  {
                    m1: function() { return 1 },
                    m2: function() { return 2 },
                    m3: function() { return 3 }
                }
                originalM2 = obj.m2;

                TestLayer1 = new Layer('TestLayer1').refineObject(obj, {
                    m1: function() { return proceed() + 1 },
                    m3: function() { return proceed() + 1 }
                }).beGlobal();
                singleLayeredM1 = obj.m1;

                TestLayer2 = new Layer('TestLayer2').refineObject(obj, {
                    m1: function() { return proceed() + 2 },
                    m2: function() { return proceed() + 2 },
                    m3: function() { return proceed() + 2 }
                }).beGlobal();

                TestLayer3 = new Layer('TestLayer3').refineObject(obj, {
                    m3: function() { return proceed() + 4 }
                }).beGlobal();
                tripleLayeredM3 = obj.m3;

                assert.equal(obj.m1(), 1 + 1 + 2, 'm1 setup failed');
                assert.equal(obj.m2(), 2 + 2, 'm2 setup failed');
                assert.equal(obj.m3(), 3 + 1 + 2 + 4, 'm3 setup failed');
            });

            it('deactivates that layer globally', function() {
                // when
                TestLayer2.uninstall();
                // then
                assert.equal(obj.m1(), 1 + 1, 'm1 erroneously changed');
                assert.equal(obj.m2(), 2, 'm2 broken after uninstall');
                assert.equal(obj.m3(), 3 + 1 + 4, 'm3 layers broken after uninstall');
            });

            // TODO: function unwrapping on uninstall is currently not supported
            xit('unwraps functions if no layers are left for them', function () {
                // when
                TestLayer2.uninstall();
                // then
                assert(obj.m1 === singleLayeredM1, "obj.m1 is not wrapped anymore.");
                assert(obj.m2 === originalM2, "obj.m2 is still wrapped.");
                assert(obj.m3 === tripleLayeredM3, "obj.m3 is not wrapped anymore.");
            });
        });

        describe('#unrefineObject', function () {
            it('removes layer definitions from an object', function() {
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
                withLayers([layer], () => assert.equal(object.foo(), 3));
            });
        });

        describe('#unrefineClass', function () {
            it('removes layer definitions from a prototype', function() {
                class Example {
                    foo() { return 3 }
                }

                const layer = new Layer("TestLayer")
                layer.refineClass(Example, {
                    foo() {
                        return proceed() + 4
                    }
                });

                assert.isDefined(cop.getLayerDefinitionForObject(layer, Example.prototype), "no layer definition");
                layer.unrefineClass(Example);
                assert.isUndefined(cop.getLayerDefinitionForObject(layer, Example.prototype),
                                   "layer definition still there");
                withLayers([layer], () => assert.equal(new Example().foo(), 3));
            });
        });
    });
});

