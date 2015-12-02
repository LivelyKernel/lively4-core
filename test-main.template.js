"use strict";

import { runSWTests, loadTestEnvironment } from './test/sw-test-adapter.js';

focalStorage.setItem("githubToken", "INSERTGITHUBTOKEN").then(function(){
  var allClientTestFiles = [];
  var allSWTestFiles = [];
  var TEST_CLIENT_REGEXP = /(-spec|-test)\.js$/i;
  var TEST_SW_REGEXP = /-swtest\.js$/i;

  // Get a list of all the test files to include
  Object.keys(window.__karma__.files).forEach(file => {
    if (TEST_CLIENT_REGEXP.test(file)) {
      // Normalize paths to RequireJS module names.
      // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
      // then do not normalize the paths
      let normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
      allClientTestFiles.push(normalizedTestModule);
      console.log('Test to load: ' + normalizedTestModule);
    }

    if (TEST_SW_REGEXP.test(file)) {
      let normalizedTestModule = file;
      allSWTestFiles.push(normalizedTestModule);
      console.log('SW Test to load: ' + normalizedTestModule);
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker-loader.js', {
      scope: "http://localhost:9876/"
    }).then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(function(err) {
      // registration failed
      console.log('ServiceWorker registration failed: ', err);
    });
  }

  navigator.serviceWorker.ready.then(function() {
    "use strict";

    navigator.serviceWorker.onmessage = function(event) {
      if (event.data.meta && event.data.meta.type == 'broadcast') {
        let message = event.data.message;
        //console.log(message);
      }
    };

    Promise.all(allClientTestFiles.map(function (file) {
      console.log('Load Test File: ' + file);
      return System.import(/*'base/' + */file + '.js');
    }))
      .then(loadTestEnvironment)
      .then(() => {
        return runSWTests(allSWTestFiles);
      })
      .then(function() {
        window.__karma__.start();
      })
      .catch(error => {
        console.error(error);
        console.error(error.stack);
        console.error(error.toString());
        throw(error);
      });
  });
});
