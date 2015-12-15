l4.importScripts('./../../../src/external/bluebird.js');
l4.importScripts('./../../../node_modules/chai/chai.js');

function packError(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

// setup es6 support, then run all test files
function setupTestEnvironment(testFiles) {
  importScripts('./src/external/es6-module-loader-dev.js');
  System.baseURL = '/base/';
  System.paths['babel'] = 'src/external/babel-browser.js';
  System.transpiler = 'babel';

  System.babelOptions = { experimental: true };

  return Promise.all(testFiles.map(testFile => System.import(testFile)));
}

l4.runTests = function() {
  l4.testing.describes.forEach(describe.run);
  return Promise.all(l4.testing.its.map(it.run));
};

// register a test suite
function describe(name, callback) {
  l4.testing.describes.push({
    name: name,
    callback: callback
  });
}

// actually run a testSuite
describe.run = function(description) {
  l4.describeName = description.name;
  description.callback();
};

// register a test case
function it(name, callback) {
  var fullName = l4.describeName + '---' + name;
  l4.testing.its.push({
    name: fullName,
    callback: callback
  });
}

// run a test case and memorize its result
it.run = function(description) {
  var fullName = description.name,
    callback = description.callback;

  return new Promise(resolve => {
    if(callback.length > 0) {
      callback(resolve)
    } else {
      callback();
      resolve();
    }
  })
    .timeout(2000, 'test timed out')
    .then(() => {
      l4.testing.testResults.push({
        fullName: fullName,
        result: 'pass'
      });
    })
    .catch(Promise.TimeoutError, error => {
      l4.testing.testResults.push({
        fullName: fullName,
        result: 'pending'
      });
    })
    .catch(error => {
      l4.testing.testResults.push({
        fullName: fullName,
        result: 'fail',
        error: packError(error)
      });
    });
};

l4.messageTask('run test', function match(event) {
  return hasPort(event) &&
    event.data &&
    event.data.meta &&
    event.data.meta.type === 'run sw tests';
}, function react(event) {
  function sendTestResults(error, results) {
    getSource(event).postMessage({
      meta: {
        type: 'test results',
        receivedMessage: event.data
      },
      message: {
        error: error ? packError(error) : undefined,
        results: results ? results : undefined
      }
    });
  }

  l4.testing = {
    describes: [],
    its: [],
    testResults: []
  };

  var testFiles = event.data.message;

  setupTestEnvironment(testFiles)
    .then(l4.runTests)
    .then(() => {
      sendTestResults(undefined, l4.testing.testResults);
    })
    .catch(sendTestResults);

  return true;
});
