l4.broadCastMessage = function(message) {
    self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
            try {
                client.postMessage({
                    meta: {
                        type: 'broadcast'
                    },
                    message: message
                });
            } catch(e) {
                if (message && message.name == "log") {
                    throw e // we are screwed
                } else {
                    try { var s = JSON.stringify(message)} catch(e) {}
                    console.log("Error during broadcasting a message: " + s + " error:" + e)
                }
            }
        });
    });
};

function hasPort(e) {
    return e.ports;
}

function getSource(event) {
    "use strict";
    /*
     console.log("SW startup");

     this.onmessage = function(event) {
     console.log("Got message in SW", event.data.text);

     if (event.source) {
     console.log("event.source present");
     event.source.postMessage("Woop!");
     }
     else {
     console.log("No event.source");
     if (event.data.port) {
     event.data.port.postMessage("Woop!");
     }
     }

     if (self.clients) {
     console.log("Attempting postMessage via clients API");
     clients.matchAll().then(function(clients) {
     for (var client of clients) {
     client.postMessage("Whoop! (via client api)");
     }
     });
     }
     else {
     console.log("No clients API");
     }
     };
     */

    return event.ports[0];
}

function justReceive(event) {
    if(hasPort(event)) {
        return;
    }
    console.log('# # # # ## # # # # # # # # # # # # # # #');
    console.log('GOT A MESSAGE1');
    console.log('# # # # ## # # # # # # # # # # # # # # #');
    console.log(event.data, event.source);
    debugger;
}

(function() {
    var messageTasks = [];

    self.addEventListener('message', function(event) {
        justReceive(event);
        messageTasks.some(function(task) {
            "use strict";
            return task.match(event) && task.react(event);
        })
    });

    l4.messageTask = function onCall(name, match, react) {
        messageTasks.push({
            name: name,
            match: match,
            react: react
        });
    };

    /*
     * Message Design
     * ---
     * event
     * -> data
     *   -> meta (meta data for the current message)
     *     -> type
     *   -> message (the actual message)
     */
})();

l4.messageTask('test send back', function match(event) {
  return hasPort(event) &&
    event.data &&
    event.data.meta &&
    event.data.meta.type === 'foo';
}, function react(event) {
  getSource(event).postMessage({
    meta: {
      type: 'msg send back',
      receivedMessage: event.data
    },
    message: 'Sending Back a Message'
  });

  return true;
});

l4.importScripts('./../../node_modules/chai/chai.js');

function describe(name, callback) {
  l4.describeName = name;
  l4.testResults[l4.describeName] = {};

  try {
    callback();
  } catch(e) {}
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

      name: e.name,
      message: e.message,
      stack: e.stack
    });
  }
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
        error: error ? error.toString() + error.stack : undefined,
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
