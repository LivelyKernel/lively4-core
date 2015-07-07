module('users.timfelgentreff.z3.emz3.EmZ3').requires('users.timfelgentreff.z3.NaClZ3').toRun(function() {

    NaCLZ3.subclass("EmZ3", {
        initialize: function ($super) {
            $super();
            var prefixUrl; //new URL(module('users.timfelgentreff.z3.emz3.EMZ3').uri()).dirname();
            // A little hackery to find the URL of this very file.
            // Throw an error, then parse the stack trace looking for filenames.
            var errlines = [];
            try {
                throw new Error();
            } catch(e) {
                errlines = e.stack.split("\n");
            }
            for (var i = 0; i < errlines.length; i++) {
              var match = /((?:https?|file):\/\/.+\/)EmZ3.js/.exec(errlines[i]);
              if (match) {
                prefixUrl = match[1];
                break;
              }
            }
            for (var i = 0; i < errlines.length; i++) {
              var match = /((?:https?|file):\/\/.+\/)babelsberg.z3.js/.exec(errlines[i]);
              if (match) {
                prefixUrl = match[1];
                break;
              }
            }
            if (!prefixUrl) {
                if (!module("users.timfelgentreff.z3.emz3.EmZ3").uri()) {
                    throw 'Could not determine em-z3 uri';
                }
                prefixUrl = module("users.timfelgentreff.z3.emz3.EmZ3").uri().replace("EmZ3.js", "");
            }

            var self = this;
            var request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                var DONE = request.DONE || 4;
                if (request.readyState === DONE){
                    // Initialize the Module object.
                    var Module = {};
                    self.Module = Module;
                    Module.TOTAL_MEMORY = 128 * 1024 * 1024;
                    Module.memoryInitializerPrefixURL = prefixUrl;
                    Module.arguments = ["-smt2", "problem.smt2"];
                    // Don't start or stop the program, just set it up.
                    // We'll call the API functions ourself.
                    Module.noInitialRun = true;
                    Module.noExitRuntime = true;
                    // Route stdout to an overridable method on the object.
                    // Module.stdin = (function stdin() {
                    //     return self.stdin();
                    // });

                    // Route stdout to an overridable method on the object.
                    // Module.stdout = (function stdout(x) {
                    //     console.log(x);
                    //     self.stdout(x);
                    // });

                    // Route stderr to an overridable method on the object.
                    Module.stderr = (function stderr(x) {
                        self.stderr(x);
                    });

                    // Eval the code.  This will probably take quite a while in Firefox
                    // as it parses and compiles all the functions.  The result is that
                    // our "Module" object is populated with all the exported VM functions.
                    console.log("evaluating asmjs code...");
                    eval(request.responseText);
                    self.FS = FS;
                }
            };
            request.open("GET", prefixUrl + "z3.js", false); // be synchronous
            request.send();
        },

        loadModule: function () {},

        run: function (code) {
            var self = this;
            this.stdout = [];
            this.FS.createDataFile("/", "problem.smt2", "(check-sat)" + code, true, true);
            try {
                var oldlog = console.log;
                console.log = function () {
                    self.stdout.push.apply(self.stdout, arguments);
                    oldlog.apply(console, arguments);
                }
                this.Module.callMain(["-smt2", "/problem.smt2"]);
            } finally {
                console.log = oldlog;
                this.FS.unlink("/problem.smt2");
            }
            return this.stdout.join("");
        },

        stdin: function () {
            debugger
        },
        stdout: function (c) {
            this.stdout.push(String.fromCharCode(c));
        },
        stderr: function (c) {
            this.stdout.push(String.fromCharCode(c));
        },

        applyResults: function (result) {
            result = result.replace(/\(error.*\n/m, "").replace(/^WARNING.*\n/m, "");
            if (result.startsWith("sat")/* || result.indexOf("\nsat\n") != -1 */) {
                var idx = result.indexOf("sat");
                result = result.slice(idx + "sat".length, result.length);
                // remove outer parens
                result = result.trim().slice(2, result.length - 2);

                var assignments = result.split(/\)\s+\(/m).map(function (str) {
                    // these are now just pairs of varname value
                    var both = str.trim().split(" ");
                    if (both.length < 2) return;
                    both = [both[0].trim(), both.slice(1, both.length).join(" ").trim()];

                    var name = both[0];
                    var value = this.parseAndEvalSexpr(both[1], both[0]);
                    return {name: name, value: value};
                }.bind(this));
                assignments.each(function (a) {
                    this.varsByName[a.name].value = a.value;
                }.bind(this));
            } else if (result.startsWith("unsat")) {
                debugger
                throw "Unsatisfiable constraint system";
            } else {
                throw "Z3 failed to solve this system";
            }
        },
        postMessage: function (string) {
            string = string.replace(/\n/g, " ") +
                ("(check-sat)(get-value (" + this.variables.inject("", function (acc, v) {
                    return acc + v.name + " "
                }) + "))");
            this.applyResults(this.run(string).replace("sat", "") /* remove first sat */);
    },

    });
}) // end of module
