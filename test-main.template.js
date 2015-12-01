"use strict";

import * as messaging from './src/client/messaging.js';

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
      console.log('Loaded Test: ' + normalizedTestModule);
    }

    if (TEST_SW_REGEXP.test(file)) {
      let normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
      allSWTestFiles.push(normalizedTestModule);
      console.log('Loaded SW Test: ' + normalizedTestModule);
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
        //console.log(event.data.message);
      }
    };

    Promise.all(allClientTestFiles.map(function (file) {
      console.log('Load Test File: ' + file);
      return System.import(/*'base/' + */file + '.js');
    }))
      .then(() => {
        console.log('# # #');
        console.log(messaging);
      })
      .then(function() {
        window.__karma__.start();
      });
  });
});
