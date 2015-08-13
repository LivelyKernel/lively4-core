var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
    // then do not normalize the paths
    var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
    allTestFiles.push(normalizedTestModule);
    console.log('Loaded Test: ' + normalizedTestModule);
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
    if (event.data.msg == 'log') {
      console.log(event.data.data);
    }
  };

  require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
  });
});
