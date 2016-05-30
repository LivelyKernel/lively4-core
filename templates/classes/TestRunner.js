'use strict';

export default class TestRunner extends HTMLDivElement {
  initialize() {
    this.windowTitle = "Test Runner"
    lively.html.registerButtons(this)
    lively.html.registerInputs(this)
    if (!this.querySelector("#mocha")) {
      var mochadiv  = document.createElement("div")
      mochadiv.id = "mocha"
      this.appendChild(mochadiv)
    }
    this.querySelector("#mocha").innerHTML= ""
    
    if(!document.querySelector("#mochaCSS")) {
      var link = document.createElement("link")
      link.id="mochaCSS"
      link.type="text/css"
      link.rel="stylesheet"
      link.href=lively4url + "/node_modules/mocha/mocha.css"
      document.head.appendChild(link)
    }

    if(document.querySelector("#mochaScript")) {
        document.querySelector("#mochaScript").remove()
    }
    
      var script = document.createElement("script")
      script.id="mochaScript"
      script.type="text/javascript"
      script.src=lively4url + "/src/external/mocha.js" + "?" + Date.now()
      script.onload = function() {
        mocha.setup("bdd")
      }
      document.head.appendChild(script)
  
  
    
    // <script src="" type="text/javascript" charset="utf-8"></script>
    // <script>mocha.setup("bdd")</script>

    
  }

  async findTestFilesInDir(dir) {
    var dir = lively4url + dir;
    var json = await lively.files.statFile(dir).then(JSON.parse)
    return json.contents.map(ea => ea.name )
      .filter(ea => ea.match(/(?:_|-)test\.js$/))
      .map(ea => dir + ea)
  }
  
  // [1,2,3].reduce((s,ea) => s + ea, 0 )
  async findTestFiles() {
    var files = []
    var list = this.shadowRoot.querySelector("#testDir").value.split(",")
    for(var i in list) {
      files = files.concat(await this.findTestFilesInDir(list[i]))
    };
    return files
    // #WhyNotThis #ContinueHere
    // return ["/test/", "/test/templates/"].reduce(async (sum, ea) => {
    //     return sum.concat(await this.findTestFilesInDir(ea))
    // }, [])
  }
// await that.findTestFilesInDir( "/test/templates/")
  
    // debugger
  // it('sds',()=>{})
  // window.it
  
  async onRunButton() {
    mocha.suite.suites.length = 0; // hihi #Holzhammer
    this.querySelector("#mocha").innerHTML= "";
    await Promise.all(
      (await this.findTestFiles()).map((url) => {
        var name = url.replace(/.*\//,"").replace(/\/\.[^\.]*/,"");
          return lively.import(name, url, true)
          // mocha.addFile(url.replace(/.*\//,"").replace(/\..*/,""))
      }));
    console.log("RUN")
    mocha.run();
  }
  
  async onTestDirChanged() {
    this.onRunButton()
  }
  
  runMocha() {
    // #TODO port this to Lively4
  var self = this;

// this.runTestFile("http://localhost:9001/lively-mocha-tester/tests/test-test.js")

  return new Promise((resolve, reject) => {
      var files = mocha.suite.suites.compact().pluck("file")
      var tests = this.state.loadedTests.filter(ea => files.include(ea.file)).pluck("tests").flatten();

      if (!tests || !tests.length)
        return reject(new Error(`Trying to run tests of ${files.join(", ")} but cannot find them in loaded tests!`));

      mocha.reporter(function Reporter(runner) {
        // this.done = (failures) => show("done " + failures)
        // runner.on("suite", function (x) { show("suite %s", x) }); 
        // runner.on("pending", function (x) { show("pending %s", x) }); 

        runner.on("test", test => {
          try {
            var t = tests.detect(ea => ea.fullTitle === test.fullTitle());
            t.state = "running";
            self.update();
          } catch (e) { self.showError("runner on test error: " + e.stack); }
        });

        // runner.on("test end", test => {
        //   try {
        //     var t = tests.tests.detect(ea => ea.fullTitle === test.fullTitle();
        //     t.state = "finished";
        // self.update();
        //   } catch (e) { self.showError("error: " + e.stack); }
        // });

        runner.on("pass", test => {
          try {
            var t = tests.detect(ea => ea.fullTitle === test.fullTitle());
            t.state = "succeeded";
            t.duration = test.duration;
            self.update();
          } catch (e) { self.showError("runner on pass error: " + e.stack); }
        });

        runner.on("fail", (test, error) => {
          try {
            var t = tests.detect(ea => ea.fullTitle === test.fullTitle());
            if (t) attachErrorToTest(t, error, test.duration);
            else { // "test" is a hook...
              var parentTests = test.parent.tests.invoke("fullTitle")
              tests
                .filter(ea => parentTests.include(ea.fullTitle))
                .forEach(ea => attachErrorToTest(ea, error, test.duration))
            }

            self.update();
            
            function attachErrorToTest(test, error, duration) {
              test.state = "failed";
              test.duration = test.duration;
              test.error = error;
            }

          } catch (e) { self.showError("runner on fail error: " + e.stack); }
        });

        // runner.on("start", test => { show("START %o", lively.printInspect(test ,1)) }); 
        // runner.on("end", test => { show("end %o", lively.printInspect(test ,1)) });

        // runner.on("hook end", function (x) { show("hook end %s", x) });
        // runner.on("suite end", function (x) { show("suite end %s", x) });
      });
      
      mocha.run(failures => resolve());
    });

    
  }
  
}
