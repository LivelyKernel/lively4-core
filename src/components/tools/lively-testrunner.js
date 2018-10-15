'use strict';

import * as cop from "src/client/ContextJS/src/contextjs.js"
import Morph from 'src/components/widgets/lively-morph.js';


//     Mocha.utils.parseQuery()

// var parseQueryLayer = cop.create("MochaParseQueryLayer");
// parseQueryLayer.layerObject(Mocha.utils, {

// });

export default class TestRunner extends Morph {
  get testDir() { return this.get('#testDir'); }

  initialize() {
    this.windowTitle = "Test Runner"
    this.registerButtons();
    // lively.html.registerInputs(this)
    this.testDir.addEventListener('keydown', event => {
      if (event.keyCode == 13) { // ENTER
        this.onRunButton();
        event.stopPropagation();
        event.preventDefault();
      }
    });

    if (!this.querySelector("#mocha")) {
      this.mochadiv = document.createElement("div");
      this.mochadiv.id = "mocha";
      this.appendChild(this.mochadiv);
    } else {
      this.mochadiv = this.querySelector("#mocha");
    }
    this.querySelector("#mocha").innerHTML = "";

    lively.loadCSSThroughDOM("mochaCSS", lively4url + "/src/external/mocha.css");

    this.resetMocha();

    var testDir =  this.getAttribute('testDir');
    if (testDir) {
      this.testDir.value = testDir;
    }
    this.testDir.addEventListener("input", e => this.testDirChanged(e));
  }

  async findTestFilesInDir(dir) {
    const files = await lively.files.walkDir(lively4url + dir);
    return files
      .filter(fileName => fileName.match(/(-|\.)(spec|test)\.js$/));
  }

  async findTestFiles() {
    var files = []
    var list = this.testDir.value.split(",")
    console.log("list: " + list)

    // await Promise.all(list.map((dir) => {
    //   console.log("find test file in dir: " + dir)
    //   return this.findTestFilesInDir(dir).then(newFiles => {
    //     files = files.concat(newFiles)
    //   })
    // }));

    for (let dir of list) {
      let newFiles = await this.findTestFilesInDir(dir)
      files = files.concat(newFiles)
    }

    return files
    // #WhyNotThis
    // return ["/test/", "/test/templates/"].reduce(async (sum, ea) => {
    //     return sum.concat(await this.findTestFilesInDir(ea))
    // }, [])
  }
  // await that.findTestFilesInDir( "/test/templates/")

  clearTests() {
    if (mocha.suite) {
      mocha.suite.suites.length = 0; // hihi #Holzhammer
    }
    this.querySelector("#mocha").innerHTML= "";
  }

  async loadTests() {
    return Promise.all(
      (await this.findTestFiles()).map(url => {
        var name = url.replace(/.*\//,"").replace(/\/\.[^\.]*/,"");

        // the code in the module has to be reexecuted!
        // var module = lively.modules.module(url)
        // if (module) module.reload()

        lively.reloadModule(url);

        return System.import(url);
        // mocha.addFile(url.replace(/.*\//,"").replace(/\..*/,""))
      })).then(() => lively.warn("LOAD TESTS"));
  }

  runTests() {
    var self = this;
    mocha.run(failures => {
      if (self.prevState) {
        window.history.pushState(self.prevState, '', self.prevLocation + "&grep=.*");
        self.prevState = self.prevLocation = undefined;
      }
      self.fixHTML();
    });
  }

  async onRunButton() {
    this.clearTests();
    await this.loadTests();
    this.runTests();
  }

  async onResetButton() {
    this.clearTests();
    this.resetMocha();
  }

  // some tests, e.g. ContextJS manage to break mocha, so that they can be only once... without this
  resetMocha() {
    lively.loadJavaScriptThroughDOM("mochaJS", lively4url + "/src/external/mocha.js", true).then(() => {
      mocha.setup("bdd");
    });
  }

  //  window.history.pushState({ mochastate: true }, '',        window.location);
  fixHTML() {
    var self = this;
    this.mochadiv.querySelectorAll(".replay").forEach(ea => {
      ea.innerHTML = "R";
      ea.onclick = (evt) => {
        evt.preventDefault();
        self.prevState = window.history.state;
        self.prevLocation = window.location.toString().replace(/&grep=[^&]+/, '');
        var grep = ea.href.replace(/.*(&grep.*)/, '$1');
        window.history.pushState({ mochastate: true }, '', self.prevLocation + grep);
        self.onRunButton();
        return false;
      };
    });
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

  livelyMigrate(other) {
    this.testDir.value = other.testDir.value;
  }

  livelyPrepareSave() {
    this.setAttribute('testDir', this.testDir.value);
  }

  testDirChanged(e) {
    this.setAttribute('testDir', this.testDir.value);
  }
}
