l4.isIncluded = 42;
l4.importScripts('./../../../node_modules/chai/chai.js');

function describe(name, callback) {
  l4.describeName = name;
  l4.testResults[l4.describeName] = {};

  callback();
}

function it(name, callback) {
  var fullName = l4.describeName + '---' + name;

  // TODO: async tests
  if(callback.length > 0) {
    throw new Error('Async testcases not yet supported');
  }

  try{
    callback();

    l4.testResults.push({
      fullName: fullName,
      result: 'pass'
    });
  } catch(e) {
    l4.testResults.push({
      fullName: fullName,
      result: 'fail',
      error: packError(e)
    });
  }
}

function packError(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

function setupTestEnvironment(testFiles) {
  importScripts('./src/external/es6-module-loader-dev.js');
  System.baseURL = '/base/';
  System.paths['babel'] = 'src/external/babel-browser.js';
  System.transpiler = 'babel';

  System.babelOptions = { experimental: true };

  return System.import(testFiles[0]);
}

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

  l4.testResults = [];
  var testFiles = eval(event.data.message);

  setupTestEnvironment(testFiles)
    .then(() => {
      sendTestResults(undefined, l4.testResults);
    })
    .catch(sendTestResults);

  return true;
});
