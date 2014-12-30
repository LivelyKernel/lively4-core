lively.require("lively.lang.Runtime").toRun(function() {

  var r = lively.lang.Runtime.Registry;
  r.addProject(r.default(), {
    name: "lively.lang",
    rootDir: "/Users/robert/Lively/lively.lang",

    reloadAll: function(project, thenDo) {
      // var project = r.default().projects["lively.lang"];
      // project.reloadAll(project, function(err) { err ? show(err.stack || String(err)) : alertOK("reloaded!"); })
      var files = [
        "lib/base.js","lib/class.js","lib/collection.js","lib/date.js","lib/events.js","lib/function.js",
        "lib/messenger.js","lib/number.js","lib/object.js","lib/string.js","lib/tree.js","lib/worker.js"
      ];

      lively.lang.fun.composeAsync(
        function deps(n) { lively.requires("lively.MochaTests").toRun(function() { n(); }); },
        function readFiles(n) {
          lively.lang.arr.mapAsyncSeries(files,
            function(fn,_,n) {
              lively.shell.cat(fn, {cwd: project.rootDir},
              function(err, c) { n(err, {name: fn, content: c}); });
            }, n);
        },
        function(fileContents, next) {
          lively.lang.arr.mapAsyncSeries(fileContents,
            function(ea,_,n) {
              r.Project.processChange(
                project, lively.lang.string.joinPath(project.rootDir, ea.name),
                ea.content, n);
            },
            next);
        }
      )(thenDo);
    },

    resources: {

      // React to changes of the lib files. Note that a change of base.js needs to
      // be handled differently b/c it can redefine the entire lively.lang object.
      // Changes of other files require us to update "our" lively.lang object but
      // also to re-install the globalized version of the interface methods to
      // String,Array,...

      "base.js": {
        matches: /lively.lang\/lib\/base\.js$/,
        changeHandler: function(change, project, resource) {
  				var state = {window: {}};
  				evalCode(change.newSource, state, change.resourceId);
  				var lang = state.window.lively && state.window.lively.lang
  				if (!lang) return;
				  Object.keys(lively.lang)
					  .forEach(function(k) { if (!lang[k]) lang[k] = lively.lang[k]; });
					lively.lang = lang;
					lively.lang.deprecatedLivelyPatches();
        }
      },

      "lib code": {
        matches: /lively.lang\/lib\/.*.js$/,
        changeHandler: function(change, project, resource) {
          evalCode(change.newSource, {lively: {lang: lively.lang}}, change.resourceId);
        }
      },

      "tests": {
        matches: /lively.lang\/tests\/.*.js$/,
        changeHandler: function(change, project, resource) {
          lively.lang.fun.composeAsync(
            function(next) {
              lively.require("lively.MochaTests").toRun(function() { next(); });
            },
            function(next) {
              JSLoader.forcedReload("http://cdnjs.cloudflare.com/ajax/libs/expect.js/0.2.0/expect.min.js");
              lively.lang.fun.waitFor(3000, function() { return typeof expect !== "undefined" && expect !== chai.expect; }, next);
            },
            function(next) {
              evalCode(change.newSource, {expect: expect, lively: lively}, change.resourceId);
              next();
            }
          )(function(err) {
            if (err) show(String(err));
            else alertOK("defining tests for " + change.resourceId);
          });
        },
      }

    }
  });

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function evalCode(code, state, resourceName) {
    lively.lang.VM.runEval(code,
      {topLevelVarRecorder: state, context: state, sourceURL: resourceName},
      function(err, result) {
    		err && show("error when updating the runtime for " + resourceName + "\n" + (err.stack || err));
    		!err && alertOK("runtime updated for " + resourceName);
    	});
  }
});
