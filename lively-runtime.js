lively.require("lively.lang.Runtime").toRun(function() {

  // Create Lively runtime project for lively.lang and register the lib/ files
  // TODO: add tests
  var runtime = lively.lang.Runtime;
  var registry = runtime.Registry.default();
  var baseDir = "/home/lively/expt/lively-lang/lib/";
  var files = ["base.js","collection.js","date.js","class.js","events.js","function.js","messenger.js","number.js","object.js","string.js","worker.js"];
  var project = runtime.Registry.addProject(registry, {name: "lively.lang", resources: {}});
  files.forEach(function(fn) {
  	runtime.Project.addResource(project, {name: baseDir+fn, code: "", varRecorder: {}})
  });
  
  // React to changes of the lib files. Note that a change of base.js needs to
  // be handled differently b/c it can redefine the entire lively.lang object.
  // Changes of other files require us to update "our" lively.lang object but
  // also to re-install the globalized version of the interface methods to
  // String,Array,...
  runtime.Project.setChangeHandlers(project, [{
    debug: true,
    matchesResource: /.*lively.lang\/lib\/.*.js$/,
    handler: function(change, project, resource, whenHandled) {
    	var isBase = !!resource.name.match("lib/base.js"),
  				state = isBase ? {window: {}} : {lively: {lang: lively.lang}};
  		lively.lang.VM.runEval(
  		  change.newSource,
  		  {topLevelVarRecorder: state, context: state, sourceURL: resource.name},
  		  function(err, result) {
    			if (!err) {
    			  var lang = isBase ? state.window.lively.lang : state.lively.lang
    				try {
    					if (isBase) { // new lively.lang object
    					  Object.keys(lively.lang)
      					  .forEach(function(k) { if (!lang[k]) lang[k] = lively.lang[k]; });
      					 lively.lang = lang;
      					lively.lang.deprecatedLivelyPatches();
    					}
    				} catch (e) { err = e; }
    			}
    			err && show("error when updating the runtime for " + resource.name + "\n" + (err.stack || err));
    			!err && alertOK("lively;lang updated");
    	  	whenHandled();
    		});
    }
  }]);
});
