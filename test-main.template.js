import { runSWTests, loadTestEnvironment } from './test/sw-test-adapter.js';
import focalStorage from './src/external/focalStorage.js'
 
window.lastDropboxToken = "INSERTDROPBOXTOKEN";

focalStorage.setItem("githubToken", "INSERTGITHUBTOKEN").then(function(){
  var allClientTestFiles = [];
  var allSWTestFiles = [];
  var TEST_CLIENT_REGEXP = /(-spec|-test)\.js$/i;
  var TEST_REACTIVE_REGEXP = /src\/client\/((ContextJS)|(reactive)|(vivide))\/.*(\.|-)(spec|test)\.js$/i;
  var TEST_SW_REGEXP = /-swtest\.js$/i;

  // Get a list of all the test files to include
  Object.keys(window.__karma__.files).forEach(file => {
    if (/node_modules/.test(file)) return; // ignore sub tests...

    if (TEST_CLIENT_REGEXP.test(file)) {
      let normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
      allClientTestFiles.push(normalizedTestModule);
      // console.log('Test to load: ' + normalizedTestModule);
    }

    if (TEST_REACTIVE_REGEXP.test(file)) {
      let normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
      allClientTestFiles.push(normalizedTestModule);
      // console.log('Reactive Test to load: ' + normalizedTestModule);
    }

    if (TEST_SW_REGEXP.test(file)) {
      let normalizedTestModule = file;
      allSWTestFiles.push(normalizedTestModule);
      // console.log('SW Test to load: ' + normalizedTestModule);
    }
  });

  window.lively4url = 'http://localhost:9876/base';

  var runTests = ()=> {
     Promise.all(allClientTestFiles.map(function (file) {
        // console.log('Load Test File: ' + file);
        return System.import(/*'base/' + */file + '.js');
      }))
        // .then(loadTestEnvironment)
        // .then(() => {
        //   return runSWTests(allSWTestFiles);
        // })
        .then(function() {
          window.__karma__.start();
        })
        .catch(error => {
          console.error(error.toString(), error, error.stack);
          throw(error);
        });
  }

  runTests();

  console.log("lively4url: " + lively4url)

});
