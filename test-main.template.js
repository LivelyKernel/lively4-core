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

  // window.lively4url = 'http://localhost:9876/base';

  var runTests = async ()=> {
    for(let file of allClientTestFiles) {
      console.log('Load Test File: ' + file);
      try {
        await System.import(/*'base/' + */file + '.js');
      } catch(e) {
        console.error("Error in Test " + file, e)
        console.error("CONTINUE ANYWAY...  ")
      }
    }
    try {
      window.__karma__.start();
    } catch(e) {
      console.error(e.toString(), e, e.stack);
      throw(e);
    }    
  }

  runTests();
  console.log("lively4url: " + lively4url)

});
