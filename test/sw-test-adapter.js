import * as messaging from './../src/client/messaging.js';

function unpackError(errorDescription) {
  var error = new Error(errorDescription.name + ': ' + errorDescription.message);
  error.stack = errorDescription.stack;
  return error;
}

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
        it(testcaseName, (done) => {
        });
        break;
      case 'fail':
        it(testcaseName, () => {
          throw unpackError(testResult.error);
        });
        break;
    }
  })
}

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
        console.log(event.data.message.error)
        throw unpackError(event.data.message.error);
      }

      event.data.message.results.forEach(createMockTestcase);
    })
}

export function loadTestEnvironment() {
  return messaging.postMessage({
    meta: {
      type: 'import script'
    },
    message: {
      scriptName: 'FIXME'
    }
  })
    .then(event => {
      var message = event.data.message;
      console.log('IMPORT SCRIPT');
      console.log(message.error);
      console.log(message.isIncluded);
    })
}
