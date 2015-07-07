module('users.timfelgentreff.z3.StrZ3').requires('users.timfelgentreff.z3.CommandLineZ3').toRun(function() {


    CommandLineZ3.subclass('StrZ3', {
        applyResult: function(r) {
            r = r.split("************************\n", 2)[1]
            
            if (r.startsWith(">> SAT")/* || r.indexOf("\nsat\n") != -1 */) {
                r = r.split("\n").slice(2) // remove header lines
                
                var assignments = r.map(function (str) {
                    var both = str.split(" -> "),
                        name = both[0].trim(),
                        value = this.parseAndEvalSexpr(both[1], name);
                    if (!name) return;
                    return {name: name, value: value};
                }.bind(this));
                
                assignments.compact().each(function (a) {
                    this.varsByName[a.name].value = a.value;
                    if (!this.sync) {
                        this.cvarsByName[a.name].suggestValue(a.value);
                    }
                }.bind(this));
            } else if (r.startsWith(">> UNSAT")) {
                debugger
                throw "Unsatisfiable constraint system";
            } else {
                throw "Z3 failed to solve this system";
            }
        },
    always: function($super, opts, func) {
        return cop.withLayers([StrZ3Layer], function () {
            return $super(opts, func);
        });
    },
    initialize: function($super, sync) {
        var session = lively.net.SessionTracker.getSession();
        this.uuid = session ? session.sessionId.replace(":", "-") : Strings.newUUID();
        $super(sync);
    },

        postMessage: function (string) {
            string = "(set-option :pp.decimal true)\n(set-option :produce-models true)\n" +
                string +
                ("\n(check-sat)\n(get-value (" + this.variables.inject("", function (acc, v) {
                    return acc + v.name + " "
                }) + "))");
            var self = this,
                id = this.uuid,
                filename = this.constructor.z3Path + "-" + id,
                commandString = this.constructor.z3Path + ' -f ' + filename;
            
            if (this.sync) {
                // XXX: for some reason, thenDos don't get called synchronously??
                lively.ide.CommandLineInterface.writeFile(filename, {sync: true, content: string});
                var cmd = lively.ide.CommandLineInterface.run(commandString, {sync: true});
                self.applyResult(cmd.getStdout() + cmd.getStderr());
            } else {
                lively.ide.CommandLineInterface.runAll([
                    {writeFile: filename, options: {sync: this.sync, content: string}},
                    {command: commandString, options: {sync: this.sync}}
                ], function(results) {
                    self.applyResult(results[1].getStdout() + results[1].getStderr());
                });
            }
        },
        
        constraintVariableFor: function($super, value, ivarname, cvar) {
            if ((typeof(value) == "string") || (value instanceof String)) {
                var name = ivarname + "" + this.variables.length;
                var v = new NaCLZ3Variable(name, value + "" /* coerce back into primitive */, this);
                this.addVariable(v, cvar);
                v.isString = true;
                return v;
            } else {
                return $super(value, ivarname, cvar);
            }
        },
        
        pruneUnusedVariables: function() {
            // Z3str does not take unused variables well
            var constraints = ["\n"].concat(this.constraints).reduce(function (acc, c) {
                return acc + "\n" + c.print();
            });
            this.variables.clone().each(function (v, idx) {
                if (!constraints.match(new RegExp(" " + v.name + "[) ]"))) {
                    this.removeVariable(v);
                }
            }.bind(this));
        },
        solve: function($super, c) {
            this.pruneUnusedVariables();
            return $super(c);
        },

    });

cop.create('StrZ3Layer').
refineObject(Global, {
    get NaCLZ3Variable() {
        return StrZ3Variable
    }
}).
refineClass(NaCLZ3BinaryExpression, {
    z3object: function(obj) {
        if (typeof(obj) == "string" || obj instanceof String) {
            return new NaCLZ3Constant('"' + obj + '"', this.solver);
        } else {
            return cop.proceed(obj);
        }
    }
});
NaCLZ3Variable.subclass('StrZ3Variable', {
    printDeclaration: function() {
        if (this.isString) {
            return "(declare-variable " + this.name + " String)"
        } else {
            return cop.proceed();
        }
    },
    
    get cnlength() {
        return this.size();
    },
    
    toString: function() {
        return this.value.toString()
    }
});    Object.extend(StrZ3, {
    z3Path: lively.ide.CommandLineInterface.cwd() + "/" +
            Config.codeBase.replace(Config.rootPath, "") + CommandLineZ3.modulePath + "z3str.py",
    functionMap:  {
        // methodName: [z3function, arity, resultIsString (used as bool flag)]
        "plus": ["Concat", 2, "isString"],
        "include": ["Contains", 2],
        "size": ["Length", 1],
        "endsWith": ["EndsWith", 2],
        "startsWith": ["StartsWith", 2],
        "indexOf": ["Indexof", 2],
        "replace": ["Replace", 3, "isString"],
        "substr": ["Substring", 3, "isString"],
        "substring": ["Substring", 3, "isString"]
    },
})

function initStrZ3Layer() {
    var o = {};
    Properties.own(StrZ3.functionMap).each(function (method) {
        var z3Name = StrZ3.functionMap[method][0],
            arity = StrZ3.functionMap[method][1],
            isString = !!StrZ3.functionMap[method][2];
        
        o[method] = (function (a, b) {
            if (this.isString) {
                var result;
                if (arity == 1) {
                    result = new NaCLZ3UnaryExpression(z3Name, this, this.solver);
                } else if (arity == 2) {
                    result = new NaCLZ3BinaryExpression(z3Name, this, a, this.solver);
                } else if (arity == 3) {
                    result = new NaCLZ3TertiaryExpression(z3Name, this, a, b, this.solver);
                }
                result.isString = isString;
                return result;
            } else {
                return cop.proceed(r);
            }
        })
    });
    StrZ3Layer.refineClass(NaCLZ3Ast, o);
}
initStrZ3Layer()

}) // end of module
