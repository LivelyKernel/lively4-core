module('users.timfelgentreff.babelsberg.PerformanceTests').requires('lively.TestFramework', 'users.timfelgentreff.babelsberg.constraintinterpreter').toRun(function() {

TestCase.subclass('users.timfelgentreff.babelsberg.PerformanceTests.PerformanceTests', {
    Iterations: 10000,
    testImperativeDragSimulation: function () {
        var mouse = {},
            mercury = {},
            thermometer = {},
            temperature = 0,
            gray = {},
            white = {},
            display = {};
        
        for (var i = 0; i < this.Iterations; i++) {
            mouse.location_y = i
            var old = mercury.top
            mercury.top = mouse.location_y
            if (mercury.top > thermometer.top) {
                mercury.top = thermometer.top
            }
            temperature = mercury.top
            if (old < mercury.top) {
                // moves upwards (draws over the white)
                gray.top = mercury.top
            } else {
                // moves downwards (draws over the gray)
                white.bottom = mercury.top
            }
            display.number = temperature
        }
    },
    setUp: function() {
        this.thermometer = lively.PartsBin.getPart("Thermometer", "users/timfelgentreff/PartsBin/");
        this.thermometer.remove();
        var sumObj = {a: 1, b: 1, c:1, d:1, e:1};
        this.sumObj = sumObj;
        this.sumObj2 = {
            get a() { return this.$$a }, $$a: 0,
            get b() { return this.$$b }, $$b: 0,
            get c() { return this.$$c }, $$c: 0,
            get d() { return this.$$d }, $$d: 0,
            get e() { return this.$$e }, $$e: 0,
        }
        bbb.unconstrain(this, "constrainedSumObj");
        this.constrainedSumObj = {a: 1, b: 1, c:1, d:1, e:1};
        this.constraint = bbb.always({solver: new ClSimplexSolver(), ctx: {self: this}}, function () {
            return self.constrainedSumObj.a == 1 &&
                    self.constrainedSumObj.b == 1 &&
                    self.constrainedSumObj.c == 1 &&
                    self.constrainedSumObj.d == 1 &&
                    self.constrainedSumObj.e == 1
        });
    },

    testThermometer: function() {
        var c = this.thermometer.get("Celsius");
        for(var i = 0; i < 100; i++) {
            try {
                c.value = (i % 30) / 100.0;
            } catch(e) {} // ignore
        }
    },
    testMidpointEdit: function() {
        var cassowary = new ClSimplexSolver(),
            deltablue = new DBPlanner();
        cassowary.setAutosolve(false);
        hand = $world.firstHand();
        
        pos = hand.getPosition().addPt(pt(200, 0));
        start = $part('Rectangle', 'PartsBin/Basic').openInWorld(pos);
        end = $part('Rectangle', 'PartsBin/Basic').openInWorld(pos.addXY(100,100));
        [start,end].invoke('applyStyle', {extent: pt(10,10)});
        midP = $part('Ellipse', 'PartsBin/Basic').openInWorld(pos);
        midP.setExtent(pt(20,20));
        
        // ugly: we need a script to force render refresh
        midP.addScript(function update() {
            this.setPosition(this.getPosition());
            start.setPosition(start.getPosition());
        });
        midP.startStepping(100, 'update') // this can be solved with an additional DeltaBlue constraint
                                          // see the C/F converter label update for code -- Tim
        
        // constraint
        (function () {
            var center = start.getPosition().addPt(end.getPosition()).scaleBy(0.5);
            return midP.getPosition().eqPt(center);
        }).shouldBeTrue({midP: midP, start: start, end: end});
        
        // start editing.
        // first argument is the object to be edited, the second a list of accessors or fields
        // note that in the JavaScript implementation, the accessor methods have to return a single value
        // the Ruby version does not have this limitation (so we could write
        //      bbb.edit(start, ["getPosition"])
        // ), but I haven't ported that, yet.
        editCallback = bbb.edit(start.getPosition(), ["x", "y"]);
        this.onMouseMove = function (evt) {
            editCallback(evt.getPosition().addPt(pt(20, 20)));
        }
        
        // end edit by calling callback without values
        editCallback();
        editCallback = null;
        
        // cleanup
        this.onMouseMove = function (evt) {};
        [start,end,midP].invoke('remove');
        start = end = midP = hand = null;
    },


    
    testDeclarativeDragSimulation: function () {
        var ctx = {
                mouse: {location_y: 0},
                mercury: {top: 0, bottom: 0},
                thermometer: {top: 0, bottom: 0},
                temperature: {c: 0},
                gray: {top: 0, bottom: 0},
                white: {top: 0, bottom: 0},
                display: {number: 0}},
            solver = new ClSimplexSolver();
        solver.setAutosolve(false);
        
        bbb.always({solver: solver, ctx: ctx}, function () { return temperature.c == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return white.top == thermometer.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return white.bottom == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return gray.top == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return gray.bottom == mercury.bottom });
        bbb.always({solver: solver, ctx: ctx}, function () { return display.number == temperature.c });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.top == mouse.location_y });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.top <= thermometer.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.bottom == thermometer.bottom });

        for (var i = 0; i < this.Iterations; i++) {
            ctx.mouse.location_y = i
        }
    },
    
    testEditDragSimulation: function () {
        var ctx = {
                mouse: {location_y: 0},
                mercury: {top: 0, bottom: 0},
                thermometer: {top: 0, bottom: 0},
                temperature: {c: 0},
                gray: {top: 0, bottom: 0},
                white: {top: 0, bottom: 0},
                display: {number: 0}};
        var solver = new ClSimplexSolver();
        
        bbb.always({solver: solver, ctx: ctx}, function () { return temperature.c == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return white.top == thermometer.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return white.bottom == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return gray.top == mercury.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return gray.bottom == mercury.bottom });
        bbb.always({solver: solver, ctx: ctx}, function () { return display.number == temperature.c });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.top == mouse.location_y });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.top <= thermometer.top });
        bbb.always({solver: solver, ctx: ctx}, function () { return mercury.bottom == thermometer.bottom });

        var cb = bbb.edit(ctx.mouse, ["location_y"]);
        for (var i = 0; i < this.Iterations; i++) {
            cb(i);
        }
        // cb();
    },
    testLibraryEditDragSimulation: function () {
        var ctx = {
                mouse: {location_y: 0},
                mercury: {top: 0, bottom: 0},
                thermometer: {top: 0, bottom: 0},
                temperature: {c: 0},
                gray: {top: 0, bottom: 0},
                white: {top: 0, bottom: 0},
                display: {number: 0}};
        var solver = new ClSimplexSolver();
        solver.setAutosolve(false);
        
        var cctx = {
            mouse_loc_y: new ClVariable(),
            mercury_top: new ClVariable(),
            mercury_bottom: new ClVariable(),
            thermometer_top: new ClVariable(),
            thermometer_bottom: new ClVariable(),
            temperature_c: new ClVariable(),
            gray_top: new ClVariable(),
            gray_bottom: new ClVariable(),
            white_top: new ClVariable(),
            white_bottom: new ClVariable(),
            display_number: new ClVariable(),
        };
        
        solver.addConstraint(cctx.mercury_top.cnEquals(cctx.temperature_c));
        solver.addConstraint(cctx.white_top.cnEquals(cctx.thermometer_top));
        solver.addConstraint(cctx.white_bottom.cnEquals(cctx.mercury_top));
        solver.addConstraint(cctx.gray_top.cnEquals(cctx.mercury_top));
        solver.addConstraint(cctx.gray_bottom.cnEquals(cctx.mercury_bottom));
        solver.addConstraint(cctx.display_number.cnEquals(cctx.temperature_c));
        solver.addConstraint(cctx.mercury_top.cnEquals(cctx.mouse_loc_y));
        solver.addConstraint(cctx.mercury_top.cnEquals(cctx.thermometer_top));
        solver.addConstraint(cctx.mercury_bottom.cnEquals(cctx.thermometer_bottom));

        solver.addEditVar(cctx.mouse_loc_y);
        solver.beginEdit();
        for (var i = 0; i < this.Iterations; i++) {
            solver.resolveArray([i]);
            ctx.mouse.location_y = cctx.mouse_loc_y.value()
            ctx.mercury.top = cctx.mercury_top.value()
            ctx.mercury.bottom = cctx.mercury_bottom.value()
            ctx.thermometer.top = cctx.thermometer_top.value()
            ctx.thermometer.bottom = cctx.thermometer_bottom.value()
            ctx.temperature.c = cctx.temperature_c.value()
            ctx.gray.top = cctx.gray_top.value()
            ctx.gray.bottom = cctx.gray_bottom.value()
            ctx.white.top = cctx.white_top.value()
            ctx.white.bottom = cctx.white_bottom.value()
            ctx.display.number = cctx.display_number.value()
        }
        solver.endEdit();
    },

    
    testReadAccessPerformance: function() {
        for (var i = 0; i < this.Iterations; i++) {
            this.sumObj.a + this.sumObj.b + this.sumObj.c + this.sumObj.d + this.sumObj.e
        }
    },
    testReadAccessPerformanceWithProperties: function() {
        var sum = 0;
        for (var i = 0; i < this.Iterations; i++) {
            sum += this.sumObj2.a + this.sumObj2.b + this.sumObj2.c + this.sumObj2.d + this.sumObj2.e
        }
    },

    
    testReadAccessConstrainedPerformance: function() {
        for (var i = 0; i < this.Iterations; i++) {
            this.constrainedSumObj.a + this.constrainedSumObj.b +
                this.constrainedSumObj.c + this.constrainedSumObj.d +
                this.constrainedSumObj.e
        }
    },
    testReadAccessConstraintDisabledPerformance: function() {
        this.constraint.disable()
        for (var i = 0; i < this.Iterations; i++) {
            this.constrainedSumObj.a + this.constrainedSumObj.b +
                this.constrainedSumObj.c + this.constrainedSumObj.d +
                this.constrainedSumObj.e
        }
    },
    testCreatingConstraint: function() {
        var c = new ClSimplexSolver(),
            a = pt(0,0);
        bbb.always({
            ctx: {
                a: a,
                _$_self: this.doitContext || this
            },
            solver: c
        }, function() {
            return a.equals(a);;
        });
    },

    testReadAccessUnconstrainedPerformance: function() {
        this.constraint.disable()
        bbb.unconstrain(this.constrainedSumObj);
        for (var i = 0; i < this.Iterations; i++) {
            this.constrainedSumObj.a + this.constrainedSumObj.b +
                this.constrainedSumObj.c + this.constrainedSumObj.d +
                this.constrainedSumObj.e
        }
    },});

}) // end of module
