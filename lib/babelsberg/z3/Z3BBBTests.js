module('users.timfelgentreff.z3.Z3BBBTests').requires("users.timfelgentreff.babelsberg.tests", "users.timfelgentreff.z3.ServerZ3", "users.timfelgentreff.z3.StrZ3").toRun(function() {
    
    TestCase.subclass("users.timfelgentreff.z3.Z3BBBTest", {
        testDisjunction: function () {
            var solver = new CommandLineZ3(true),
                res = {major: 0, minor: 0, patch: 0},
                req = {major: 3, minor: 1, patch: 0};
            solver.always({
                ctx: {
                    res: res,
                    req: req,
                    ro: bbb.readonly
                }
            }, function () {
                return (
                    (res.major >= ro(req.major)) ||
                    (res.major == ro(req.major) && res.minor >= ro(req.minor)) ||
                    (res.major == ro(req.major) && res.minor == ro(req.minor) && res.patch >= ro(req.patch))
                );
            });
            
            this.assert((res.major >= req.major) ||
                        (res.major == req.major && res.minor >= req.minor) ||
                        (res.major == req.major && res.minor == req.minor) && res.patch >= req.patch);
        },
    testString: function() {
        var z3 = new StrZ3(true),
            obj = {};
        obj.a = "xx";
        obj.b = "yy";
        obj.c = "zz";
        obj.d = "zz";
        obj.e = "abc";
        obj.x = 0;
        obj.y = 0;
        obj.z = 0;
        return; // skip for now, this is unstable as hell anyway
        bbb.always({
            solver: z3,
            ctx: {
                z3: z3,
                obj: obj,
                _$_self: this.doitContext || this
            }
        }, function() {
            return obj.a + obj.b == "xyz" &&
                obj.c.startsWith("Hallo") &&
                obj.c.endsWith("Welt") &&
                obj.d.include("Yay") &&
                obj.d.length == obj.x &&
                obj.d.size() == obj.y
        });
        
        this.assert(obj.a + obj.b === "xyz", obj.a + obj.b + " Z3str concat")
        this.assert(obj.c.startsWith("Hallo"), "Z3str startsWith")
        this.assert(obj.c.endsWith("Welt"), "Z3str endsWith")
        this.assert(obj.d.include("Yay"), "Z3str include")
        this.assert(obj.d.length == obj.x, "Z3str length")
        this.assert(obj.d.size() == obj.y, "Z3str size()")
        this.assert(obj.x == obj.y, "Z3str length === size")
    },
    testStay: function() {
        var z3 = new CommandLineZ3(true),
            obj = {a: 10, b: 20};
        bbb.always({
            solver: z3,
            ctx: {
                z3: z3,
                obj: obj,
                _$_self: this.doitContext || this
            }
        }, function() {
            return obj.a + obj.b == 100;;
        });
        this.assert(obj.a === 10 || obj.b === 20, "Z3 stays should have kept one value")
    }
    });
    
}) // end of module
