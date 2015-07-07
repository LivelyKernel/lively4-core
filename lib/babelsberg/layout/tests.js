module('users.timfelgentreff.layout.tests').requires('lively.TestFramework', 'users.timfelgentreff.babelsberg.constraintinterpreter', 'users.timfelgentreff.layout.layout', 'users.timfelgentreff.layout.test_fixture').toRun(function() {
    //.requiresLib({url: 'http://sinonjs.org/releases/sinon-1.10.0.js', loadTest: function() { return typeof sinon !== 'undefined'; }})
    //debugger
    /*var temp = {
        require: window.require
    };
    window.require = temp.require;
    */
    JSLoader.loadJs(module('users.timfelgentreff.layout.sinon').uri())
    
TestCase.subclass('users.timfelgentreff.layout.tests.SimpleLayoutTest', {
    testSameExtent: function () {
        var parent = FixtureSameExtent.getSameExtent(this);
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after constraint definition.");
    },
    
    testSameExtentAssignmentLeft: function () {
        var parent = FixtureSameExtent.getSameExtent(this);
        var expectedExtent = pt(70,35);
        parent.child1.setExtent(expectedExtent);
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "child1 and child2 do not have the same extent after assignment.");
        this.assertEquals(expectedExtent, parent.child1.getExtent(), "child1 does not have the assigned extent.");
        this.assertEquals(expectedExtent, parent.child2.getExtent(), "child2 does not have the assigned extent.");
    },
    testSameExtentAssignmentRight: function () {
        var parent = FixtureSameExtent.getSameExtent(this);
        var expectedExtent = pt(70,35);
        parent.child2.setExtent(expectedExtent);
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "child1 and child2 do not have the same extent after assignment.");
        this.assertEquals(expectedExtent, parent.child1.getExtent(), "child1 does not have the assigned extent.");
        this.assertEquals(expectedExtent, parent.child2.getExtent(), "child2 does not have the assigned extent.");
    }
});

TestCase.subclass('users.timfelgentreff.layout.tests.TestWidth', {
    testWidthEquals200: function () {
        var parent = FixtureWidth.getWidthEqual200(this);
        
        this.assertEquals(parent.child1.getExtent().x, 200, "Box does not have the specified width of 200, instead: " + parent.child1.getExtent().x);
    }
});
TestCase.subclass('users.timfelgentreff.layout.tests.TestListenOnSubclass', {
    testListenOnSubclass: function() {
        this.layoutSolver = new LayoutSolver();
        
        var originalCounter = 0;
        var layoutCounter = 0;
        var originalSpy = this.spyInClass(lively.morphic.Morph, "getExtent", function() {
            originalCounter++;
        }).callsThrough();
        var layoutSpy = this.spyInClass(LayoutConstraintVariableBox, "getExtent", function() {
            layoutCounter++;
        }).callsThrough();

        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new SubclassedBox(new Rectangle(10, 10, 100, 250)));
        parent.addMorph(parent.child2 = new SubclassedBox(new Rectangle(150, 10, 130, 200)));

        bbb.always({
            solver: this.layoutSolver,
            allowUnsolvableOperations: true,
            ctx: {
                parent: parent,
            allowUnsolvableOperations: true,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.getExtent().eqPt(parent.child2.getExtent());;
        });
        
        originalSpy.uninstall();
        layoutSpy.uninstall();

        this.assertEquals(layoutCounter, 2,  "layout was called " + layoutCounter + " time(s)");
        this.assertEquals(originalCounter, 0,  "original function was called " + originalCounter + " time(s).");
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent.");
    },
    testListenOnOverwrittenMethod: function() {
        this.layoutSolver = new LayoutSolver();
        
        /*
        var originalCounter = 0;
        var overwrittenCounter = 0;
        var layoutCounter = 0;
        var originalSpy = this.spyInClass(lively.morphic.Morph, "getExtent", function() {
            originalCounter++;
        }).callsThrough();
        var overwrittenSpy = this.spyInClass(OverwrittenExtentBox, "getExtent", function() {
            overwrittenCounter++;
        }).callsThrough();
        var layoutSpy = this.spyInClass(LayoutConstraintVariableBox, "getExtent", function() {
            layoutCounter++;
        }).callsThrough();
        */

        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new OverwrittenExtentBox(new Rectangle(10, 10, 100, 250)));
        parent.addMorph(parent.child2 = new OverwrittenExtentBox(new Rectangle(150, 10, 130, 200)));

        bbb.always({
            solver: this.layoutSolver,
            allowUnsolvableOperations: true,
            ctx: {
                parent: parent,
            allowUnsolvableOperations: true,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.getExtent().eqPt(parent.child2.getExtent());;
        });
        
        /*
        originalSpy.uninstall();
        overwrittenSpy.uninstall();
        layoutSpy.uninstall();

        this.assertEquals(originalCounter, 0,  "original function was called " + originalCounter + " time(s).");
        this.assertEquals(overwrittenCounter, 2,  "overwritten method was called " + overwrittenCounter + " time(s)");
        this.assertEquals(layoutCounter, 0,  "layout was called " + layoutCounter + " time(s)");
        */
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent.");
    },
    testListenOnSuperCall: function() {
        this.layoutSolver = new LayoutSolver();
        
        var originalCounter = 0;
        var overwrittenCounter = 0;
        var layoutCounter = 0;
        var originalSpy = this.spyInClass(lively.morphic.Morph, "getExtent", function() {
            originalCounter++;
        }).callsThrough();
        var overwrittenSpy = this.spyInClass(SuperCallBox, "getExtent", function() {
            overwrittenCounter++;
        }).callsThrough();
        var layoutSpy = this.spyInClass(LayoutConstraintVariableBox, "getExtent", function() {
            layoutCounter++;
        }).callsThrough();

        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new SuperCallBox(new Rectangle(10, 10, 100, 250)));
        parent.addMorph(parent.child2 = new SuperCallBox(new Rectangle(150, 10, 130, 200)));

        bbb.always({
            solver: this.layoutSolver,
            allowUnsolvableOperations: true,
            ctx: {
                parent: parent,
            allowUnsolvableOperations: true,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.getExtent().eqPt(parent.child2.getExtent());;
        });
        
        originalSpy.uninstall();
        overwrittenSpy.uninstall();
        layoutSpy.uninstall();

        this.assertEquals(layoutCounter, 2,  "layout was called " + layoutCounter + " time(s)");
        this.assertEquals(overwrittenCounter, 2,  "overwritten method was called " + overwrittenCounter + " time(s)");
        this.assertEquals(originalCounter, 0,  "original function was called " + originalCounter + " time(s).");
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent.");
    }
});TestCase.subclass('users.timfelgentreff.layout.tests.TestHeight', {
    testHeightGeq200: function () {
        var parent = FixtureHeight.getHeightGeq200(this);
        
        this.assert(parent.child1.getExtent().y >= 200, "Box does not have a greate height that 200, it is: " + parent.child1.getExtent().y);
    }
});

TestCase.subclass('users.timfelgentreff.layout.tests.ConstainedVariablesTest', {
    setUp: function() {
    },
    tearDown: function() {
        //this.uninstallSpies();
    },
    checkbbbCompoundConstraintVariables: function (parent) {
        var morphCvar = ConstrainedVariable.findConstraintVariableFor(parent, "child1");
        var shapeCvar = ConstrainedVariable.findConstraintVariableFor(parent.child1, "shape");
        var extentCvar = ConstrainedVariable.findConstraintVariableFor(parent.child1.shape, "_Extent");
        var xCvar = ConstrainedVariable.findConstraintVariableFor(parent.child1.shape._Extent, "x");
        var yCvar = ConstrainedVariable.findConstraintVariableFor(parent.child1.shape._Extent, "y");

        this.assertIdentity(morphCvar, shapeCvar.parentConstrainedVariable);
        this.assertIdentity(shapeCvar, extentCvar.parentConstrainedVariable);
        this.assertIdentity(extentCvar, xCvar.parentConstrainedVariable);
        this.assertIdentity(extentCvar, yCvar.parentConstrainedVariable);
    },

    checkLayoutCompoundConstraintVariables: function (parent) {
        var morphCvar = ConstrainedVariable.findConstraintVariableFor(parent, "child1");
        var shapeCvar = ConstrainedVariable.findConstraintVariableFor(parent.child1, "shape");
        var extentCvar = ConstrainedVariable.findConstraintVariableFor(parent.child1.shape, "_Extent");
        var xCvar = ConstrainedVariable.findConstraintVariableFor(parent.child1.shape._Extent, "x");
        var yCvar = ConstrainedVariable.findConstraintVariableFor(parent.child1.shape._Extent, "y");
        
        var morphLayoutCvar = morphCvar.externalVariables(this.layoutSolver);
        var shapeLayoutCvar = shapeCvar.externalVariables(this.layoutSolver);
        var extentLayoutCvar = extentCvar.externalVariables(this.layoutSolver);
        var xLayoutCvar = xCvar.externalVariables(this.layoutSolver);
        var yLayoutCvar = yCvar.externalVariables(this.layoutSolver);
        
        this.assertIdentity(morphLayoutCvar, shapeLayoutCvar.parentConstraintVariable, "morph: "+morphLayoutCvar.name+" <- shape: "+shapeLayoutCvar.parentConstraintVariable.name);
        this.assertIdentity(shapeLayoutCvar, extentLayoutCvar.parentConstraintVariable, "shape: "+shapeLayoutCvar.name+" <- extent: "+extentLayoutCvar.parentConstraintVariable.name);
        this.assertIdentity(extentLayoutCvar, xLayoutCvar.parentConstraintVariable, "extent: "+extentLayoutCvar.name+" <- x: "+xLayoutCvar.parentConstraintVariable.name);
        this.assertIdentity(extentLayoutCvar, yLayoutCvar.parentConstraintVariable, "extent: "+extentLayoutCvar.name+" <- y: "+yLayoutCvar.parentConstraintVariable.name);
    },

    testConstructCompoundConstraintVariable: function () {
        var parent = FixtureSameExtent.getSameExtent(this);

        this.checkbbbCompoundConstraintVariables(parent);
        this.checkLayoutCompoundConstraintVariables(parent);
    },
    
    testAssignmentCallsSuggestValue: function () {
        var counter = 0;
        var spy = this.spyInClass(LayoutConstraintVariablePoint, "suggestValue", function() {
            counter++;
        }).callsThrough();

        var parent = FixtureSameExtent.getSameExtent(this);

        parent.child1.setExtent(pt(2,3));

        this.assert(counter == 1,  "function suggestValue was not called once but " + counter + " times");
        
        spy.uninstall();
    },
    
    testStillConstrainedAfterAssignment: function () {
        var parent = FixtureSameExtent.getSameExtent(this);

        parent.child1.setExtent(pt(2,3));

        this.checkLayoutCompoundConstraintVariables(parent);
        this.checkbbbCompoundConstraintVariables(parent);
    },

    testGetValueFromLayoutVariableVariable: function () {
        var counter = 0;
        var parent = FixtureSameExtent.getSameExtent(this);
        var spy = this.spyInClass(LayoutConstraintVariablePoint, "value", function() {
            counter++;
        }).callsThrough();
        var actualExtent = parent.child1.getExtent();
        spy.uninstall();
        
        this.assert(counter == 1,  "function v'alue' was not called once but " + counter + " times");
        
        parent.child1.setExtent(pt(2,3));
        var expectedExtent = ConstrainedVariable
            .findConstraintVariableFor(parent.child1.shape, "_Extent")
            .externalVariables(this.layoutSolver)
            .value();
        this.assertIdentity(expectedExtent, actualExtent, "actual and returned extent are not identical");
    }
});
Object.subclass('FixtureAspectRatio');
Object.subclass('FixtureWidth');
Object.subclass('FixtureHeight');
Object.subclass('FixtureSameExtent');
Object.subclass('FixtureMorph');
Object.extend(FixtureSameExtent, {
    getSameExtent: function(testCase) {
        // Creates a Box with 2 child Boxes constrained to the same extent.
        testCase.layoutSolver = new LayoutSolver();
        
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Morph.makeRectangle(10, 10, 100, 250));
        parent.addMorph(parent.child2 = new lively.morphic.Morph.makeRectangle(150, 10, 130, 200));

        bbb.always({
            solver: testCase.layoutSolver,
            allowUnsolvableOperations: true,
            ctx: {
                parent: parent,
            allowUnsolvableOperations: true,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.sameExtent(parent.child2);;
        });

        return parent;
    },
    
    getSameExtentCassowary: function(testCase) {
        // Creates a Box with a child Box constrained to the same extent using Cassowary.
        testCase.solver = new ClSimplexSolver();
        
        var parent = lively.morphic.Morph.makeRectangle(7, 7, 300, 350);
        parent.addMorph(parent.child1 = lively.morphic.Morph.makeRectangle(10, 10, 100, 250));

        bbb.always({
            solver: testCase.solver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.getExtent().eqPt(parent.getExtent());;
        });
        
        return parent;
    },
    
    get2SameExtents: function(testCase) {
        testCase.layoutSolver = new LayoutSolver();
        
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Box(pt(10,10).extent(pt(100,250))));
        parent.addMorph(parent.child2 = new lively.morphic.Box(pt(150,10).extent(pt(130, 200))));
        parent.addMorph(parent.child3 = new lively.morphic.Box(pt(10,10).extent(pt(300,250))));
        parent.addMorph(parent.child4 = new lively.morphic.Box(pt(150,10).extent(pt(330, 200))));

        bbb.always({
            solver: testCase.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.sameExtent(parent.child2);;
        });
        
        bbb.always({
            solver: testCase.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child3.sameExtent(parent.child4);;
        });
        
        return parent;
    },
    
    getChainOfSameExtents: function(testCase) {
        testCase.layoutSolver = new LayoutSolver();
        
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Box(pt(10,10).extent(pt(100,20))));
        parent.addMorph(parent.child2 = new lively.morphic.Box(pt(10,10).extent(pt(200, 40))));
        parent.addMorph(parent.child3 = new lively.morphic.Box(pt(10,10).extent(pt(300,60))));
        parent.addMorph(parent.child4 = new lively.morphic.Box(pt(10,10).extent(pt(400, 80))));

        bbb.always({
            solver: testCase.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.sameExtent(parent.child2);;
        });
        
        bbb.always({
            solver: testCase.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child2.sameExtent(parent.child3);;
        });
        
        bbb.always({
            solver: testCase.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child3.sameExtent(parent.child4);;
        });
        
        return parent;
    }
});
TestCase.subclass('users.timfelgentreff.layout.tests.SameExtentTest', {
    testSameExtent: function () {
        var parent = FixtureSameExtent.getSameExtent(this);
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after constraint definition.");
    },
    testSameExtentAssignmentLeft: function () {
        var parent = FixtureSameExtent.getSameExtent(this);
        var expectedExtent = pt(70,35);
        parent.child1.setExtent(expectedExtent);
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after assignment.");
        this.assertEquals(expectedExtent, parent.child1.getExtent(), "Box does not have the assigned extent.");
        this.assertEquals(expectedExtent, parent.child2.getExtent(), "Box does not have the assigned extent.");
    },
    testSameExtentAssignmentRight: function () {
        var parent = FixtureSameExtent.getSameExtent(this);
        var expectedExtent = pt(70,35);
        parent.child2.setExtent(expectedExtent);
        
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after assignment.");
        this.assertEquals(expectedExtent, parent.child1.getExtent(), "Box does not have the assigned extent.");
        this.assertEquals(expectedExtent, parent.child2.getExtent(), "Box does not have the assigned extent.");
    },
    test2IndependentSameExtents: function () {
        var parent = FixtureSameExtent.get2SameExtents(this);

        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after constraint definition.");
        this.assertEquals(parent.child3.getExtent(), parent.child4.getExtent(), "Boxes do not have the same extent after constraint definition.");
    }
});
Object.extend(FixtureAspectRatio, {
    getAspectRatio: function(testCase) {
        testCase.layoutSolver = new LayoutSolver();
        
        var parent = FixtureMorph.getParentWithOneChild();

        bbb.always({
            solver: testCase.layoutSolver,
            allowUnsolvableOperations: true,
            ctx: {
                parent: parent,
            allowUnsolvableOperations: true,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.aspectRatio() >= 2;;
        });
        
        return parent;
    },
    getAspectRatioAsLinearExpression: function(testCase) {
        testCase.layoutSolver = new LayoutSolver();
        
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Morph.makeRectangle(10, 10, 100, 250));

        bbb.always({
            solver: testCase.layoutSolver,
            allowUnsolvableOperations: true,
            ctx: {
                parent: parent,
            allowUnsolvableOperations: true,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.getExtent().x >= parent.child1.getExtent().y * 2;;
        });
        
        return parent;
    },
    getSquare: function(testCase) {
        testCase.layoutSolver = new LayoutSolver();
        
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Morph.makeRectangle(10, 10, 100, 250));

        bbb.always({
            solver: testCase.layoutSolver,
            allowUnsolvableOperations: true,
            ctx: {
                parent: parent,
            allowUnsolvableOperations: true,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.getExtent().x == parent.child1.getExtent().y;;
        });
        
        return parent;
    }
});
Object.extend(FixtureMorph, {
    setSolver: function(testCase) {
        testCase.layoutSolver = new LayoutSolver();
    },
    getParentWithOneChild: function() {
        var parent = new lively.morphic.Box(pt(7,7).extent(pt(300,300)));
        parent.addMorph(parent.child1 = new lively.morphic.Morph.makeRectangle(10, 10, 100, 250));

        return parent;
    },
    getParentWithTwoChildren: function(testCase) {
        throw "not yet implemented"
    },
    getParentWithFourChildren: function(testCase) {
        throw "not yet implemented"
    },
    getParentWithOneChildAndTwoSubchildren: function(testCase) {
        throw "not yet implemented"
    }
});
Object.extend(FixtureWidth, {
    getWidthEqual200: function(testCase) {
        FixtureMorph.setSolver(testCase);
        
        var parent = FixtureMorph.getParentWithOneChild();

        bbb.always({
            solver: testCase.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.width() == 200;;
        });
        
        return parent;
    }
});
Object.extend(FixtureHeight, {
    getHeightGeq200: function(testCase) {
        FixtureMorph.setSolver(testCase);
        
        var parent = FixtureMorph.getParentWithOneChild();

        bbb.always({
            solver: testCase.layoutSolver,
            ctx: {
                parent: parent,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.height() >= 200;;
        });
        
        return parent;
    }
});
TestCase.subclass('users.timfelgentreff.layout.tests.ChainOfSameExtentTest', {
    test2ChainOfSameExtents: function () {
        var parent = FixtureSameExtent.getChainOfSameExtents(this);

/*        console.log(parent);
        console.log(parent.child1);
        console.log(parent.child1.solver);
        console.log(parent.child1.solver.constraints);
        console.log(parent.child1.value.getExtent().x, parent.child1.value.getExtent().y);
        console.log(parent.child2.value.getExtent().x, parent.child2.value.getExtent().y);
        console.log(parent.child3.value.getExtent().x, parent.child3.value.getExtent().y);
        console.log(parent.child4.value.getExtent().x, parent.child4.value.getExtent().y);
*/
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after constraint definition1.");
        this.assertEquals(parent.child2.getExtent(), parent.child3.getExtent(), "Boxes do not have the same extent after constraint definition2.");
        this.assertEquals(parent.child3.getExtent(), parent.child4.getExtent(), "Boxes do not have the same extent after constraint definition3.");
    },

    testAssignment: function () {
        var parent = FixtureSameExtent.getChainOfSameExtents(this);
        var expectedExtent = pt(70,35);
        parent.child2.setExtent(expectedExtent);
        
        this.assertEquals(expectedExtent, parent.child1.getExtent(), "Box does not have the assigned extent.");
        this.assertEquals(parent.child1.getExtent(), parent.child2.getExtent(), "Boxes do not have the same extent after assignment.");
        this.assertEquals(parent.child2.getExtent(), parent.child3.getExtent(), "Boxes do not have the same extent after assignment.");
        this.assertEquals(parent.child3.getExtent(), parent.child4.getExtent(), "Boxes do not have the same extent after assignment.");
    }
});

TestCase.subclass('users.timfelgentreff.layout.tests.AspectRatioTest', {
    testSquare: function () {
        var parent = FixtureAspectRatio.getSquare(this);
        
        this.assertEquals(parent.child1.getExtent().x, parent.child1.getExtent().y, "Box is not a square. x: " + parent.child1.getExtent().x + ", y: " + parent.child1.getExtent().y);
    },
    testAspectRatioAsLinearExpression: function () {
        var parent = FixtureAspectRatio.getAspectRatioAsLinearExpression(this);
        
        this.assert(parent.child1.getExtent().x / parent.child1.getExtent().y >= 2, "Box does not have an aspect ratio greater than 2. It was " + parent.child1.getExtent().x + " -> " + parent.child1.getExtent().y + " = " + (parent.child1.getExtent().x / parent.child1.getExtent().y));
    },
    testAspectRatio: function () {
        var parent = FixtureAspectRatio.getAspectRatio(this);
        
        this.assert(parent.child1.getExtent().x / parent.child1.getExtent().y <= 2, "Box does not have an aspect ratio greater than 2. It was " + parent.child1.getExtent().x + " -> " + parent.child1.getExtent().y + " = " + (parent.child1.getExtent().x / parent.child1.getExtent().y));
    }
});

TestCase.subclass('users.timfelgentreff.layout.tests.TestStayInParent', {
    getFixture: function() {
        var parent = new lively.morphic.Morph.makeRectangle(10, 10, 100, 100);
        parent.addMorph(parent.child1 = new lively.morphic.Morph.makeRectangle(0, 0, 250, 250));
        parent.child1.addMorph(parent.child1.child1 = new lively.morphic.Morph.makeRectangle(200, 100, 100, 50));

        return parent;

    },
    testStayInParent: function () {
        FixtureMorph.setSolver(this);
        
        var parent = this.getFixture();
        var margin = 20;
        
        //console.log(parent.child1.innerBounds().toString(), parent.child1.child1.bounds().toString());
        bbb.always({
            solver: this.layoutSolver,
            ctx: {
                parent: parent,
                margin: margin,
                _$_self: this.doitContext || this
            }
        }, function() {
            return parent.child1.contains(parent.child1.child1, margin);;
        });;
        //console.log(parent.child1.innerBounds().toString(), parent.child1.child1.bounds().toString());
        this.assert(parent.child1.innerBounds().insetBy(margin).containsRect(parent.child1.child1.bounds()), "Boxes do not contain each other: " + parent.child1.innerBounds().toString() + " " + parent.child1.child1.bounds().toString());
    }
});

/*
 *  General
 */
TestCase.subclass('users.timfelgentreff.layout.tests.RecursiveUnconstraintTest', {
    testFunctionality: function () {
        var parent = FixtureSameExtent.getSameExtentCassowary(this);

        this.assertEquals(
            parent.getExtent(),
            parent.submorphs[0].getExtent(),
            "Boxes do not have the same extent after constraint definition."
        );
    },
    
    testConstraintsOnMultipleLayers: function () {
        var parent = FixtureSameExtent.getSameExtentCassowary(this);

        this.assert(parent.__lookupGetter__("shape").isConstraintAccessor, "get shape is not a constraint accessor.");
        this.assert(parent.shape.__lookupGetter__("_Extent").isConstraintAccessor, "get _Extent is not a constraint accessor.");
        this.assert(parent.shape._Extent.__lookupGetter__("x").isConstraintAccessor, "get x is not a constraint accessor.");
        this.assert(parent.shape._Extent.__lookupGetter__("y").isConstraintAccessor, "get y is not a constraint accessor.");
        this.assert(parent.child1.__lookupGetter__("shape").isConstraintAccessor, "get shape is not a constraint accessor.");
        this.assert(parent.child1.shape.__lookupGetter__("_Extent").isConstraintAccessor, "get _Extent is not a constraint accessor.");
        this.assert(parent.child1.shape._Extent.__lookupGetter__("x").isConstraintAccessor, "get x is not a constraint accessor.");
        this.assert(parent.child1.shape._Extent.__lookupGetter__("y").isConstraintAccessor, "get y is not a constraint accessor.");
        
        var shape = ConstrainedVariable.findConstraintVariableFor(parent, "shape");
        var extent = ConstrainedVariable.findConstraintVariableFor(parent.shape, "_Extent");
        var x = ConstrainedVariable.findConstraintVariableFor(parent.shape._Extent, "x");
        var y = ConstrainedVariable.findConstraintVariableFor(parent.shape._Extent, "y");
        this.assertIdentity(shape, extent.parentConstrainedVariable, "parentConstrainedVariables are not set correctly.");
        this.assertIdentity(extent, x.parentConstrainedVariable, "parentConstrainedVariables are not set correctly.");
        this.assertIdentity(extent, y.parentConstrainedVariable, "parentConstrainedVariables are not set correctly.");
    },
    
    testRecursiveUnconstrain: function () {
        var parent = FixtureSameExtent.getSameExtentCassowary(this);

        bbb.unconstrain(parent.shape._Extent, "x");
        bbb.unconstrain(parent.shape._Extent, "y");

        this.assert(parent.__lookupGetter__("shape").isConstraintAccessor, "get shape is not a constraint accessor.");
        this.assert(parent.shape.__lookupGetter__("_Extent").isConstraintAccessor, "get _Extent is not a constraint accessor.");
        this.assert(typeof parent.shape._Extent.__lookupGetter__("x") === "undefined", "get x is still a constraint accessor.");
        this.assert(typeof parent.shape._Extent.__lookupGetter__("y") === "undefined", "get y is still a constraint accessor.");

        bbb.unconstrain(parent.child1, "shape");

        this.assert(parent.__lookupGetter__("child1").isConstraintAccessor, "get child1 is not a constraint accessor.");
        this.assert(typeof parent.child1.__lookupGetter__("shape") === "undefined", "get shape is still a constraint accessor.");
        this.assert(typeof parent.child1.shape.__lookupGetter__("_Extent") === "undefined", "get _Extent is still a constraint accessor.");
        this.assert(typeof parent.child1.shape._Extent.__lookupGetter__("x") === "undefined", "get x is still a constraint accessor.");
        this.assert(typeof parent.child1.shape._Extent.__lookupGetter__("y") === "undefined", "get y is still a constraint accessor.");
    }
});

}) // end of module
