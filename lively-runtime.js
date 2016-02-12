lively.require("lively.lang.Runtime").toRun(function() {

  lively.lang.Runtime.Registry.addProject({
    name: "lively.lang",

    reloadAll: function(project, thenDo) {
      // var project = lively.lang.Runtime.Registry.current().projects["lively.lang"]
      // lively.lang.Runtime.Registry.current().projects["lively.lang"].reloadAll(project, thenDo)
      var file = lively.lang.string.joinPath(project.rootDir, "package.json");
      return lively.lang.promise(lively.shell.cat)(file)
        .then(JSON.parse)
        .then(jso => jso.libFiles)
        .then(files => lively.lang.promise(lively.lang.Runtime.loadFiles)(project, files))
        .then(() => lively.lang.deprecatedLivelyPatches())
        .then(lively.lang.fun.withNull(thenDo))
        .then(show.curry("Reloaded"))
        .catch(thenDo);
    },

    resources: {

      // React to changes of the lib files. Note that a change of base.js needs to
      // be handled differently b/c it can redefine the entire lively.lang object.
      // Changes of other files require us to update "our" lively.lang object but
      // also to re-install the globalized version of the interface methods to
      // String,Array,...

      "base.js": {
        matches: /lib\/base\.js$/,
        changeHandler: function(change, project, resource) {
  				var state = {window: {}};
  				lively.lang.Runtime.evalCode(project, change.newSource, state, change.resourceId);
  				var lang = state.window.lively && state.window.lively.lang
  				if (!lang) return;
				  Object.keys(lively.lang)
					  .forEach(function(k) { if (!lang[k]) lang[k] = lively.lang[k]; });
					lively.lang = lang;
					lively.lang.deprecatedLivelyPatches();
        }
      },

      "lib code": {
        matches: /lib\/.*.js$/,
        changeHandler: function(change, project, resource) {
          lively.lang.Runtime.evalCode(project, change.newSource, {lively: {lang: lively.lang}}, change.resourceId);
        }
      },

      "tests": {
        matches: /tests\/.*.js$/,
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
              lively.lang.Runtime.evalCode(project, change.newSource, {
                mocha: Global.mocha,
                expect: Global.expect,
                lively: lively
              }, change.resourceId);
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

});
