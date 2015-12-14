import * as messaging from './../src/client/messaging.js';

function unpackError(errorDescription) {
  var error = new Error(errorDescription.name + ': ' + errorDescription.message);
  error.stack = errorDescription.stack;
  return error;
}

// convert a test result description to a mocha test case
function createMockTestcase(testResult) {
  var suiteName = testResult.fullName.split('---')[0];
  var testcaseName = testResult.fullName.split('---')[1];

  describe(suiteName, () => {
    switch (testResult.result) {
      case 'pass':
        it(testcaseName, () => {
        });
        break;
      case 'pending':
        it(testcaseName, (done) => {});
        break;
      case 'fail':
        it(testcaseName, () => {
          throw unpackError(testResult.error);
        });
        break;
    }
  })
}

// execute the given files on ServiceWorker
// receive test result from ServiceWorker
// create real test cases with result from ServiceWorker
export function runSWTests(allSWTestFiles) {
  // run sw tests
  return messaging.postMessage({
    meta: {
      type: 'run sw tests'
    },
    message: allSWTestFiles
  })
    .then(event => {
      if (event.data.message.error) {
        console.log('Running SW tests failed');
        console.log(event.data.message.error);
        throw unpackError(event.data.message.error);
      }

      event.data.message.results.forEach(createMockTestcase);
    })
}

// command the ServiceWorker to load its testing environment
export function loadTestEnvironment() {
  return messaging.postMessage({
    meta: {
      type: 'import script'
    },
    message: {
      scriptName: './src/sw/messaging-tasks/run-sw-tests.js'
    }
  })
    .then(event => {
      var message = event.data.message;
      if(message.error) {
        console.log('Error during importScripts message');
        console.log(message.error);
      }
    })
}
