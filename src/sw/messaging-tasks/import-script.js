l4.messageTask('import script', function match(event) {
  return hasPort(event) &&
    event.data &&
    event.data.meta &&
    event.data.meta.type === 'import script';
}, function react(event) {
  var scriptName = event.data.message.scriptName;
  var error;
  try {
    l4.importScripts('./src/sw/messaging-tasks/run-sw-tests.js');
  } catch(e) {
    error = e;
  }

  getSource(event).postMessage({
    meta: {
      type: 'script imported',
      receivedMessage: event.data
    },
    message: {
      isIncluded: l4.isIncluded,
      error: error ? error.toString() : undefined
    }
  });

  return true;
});
