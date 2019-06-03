/* Load Lively */

var resolveLoaded 
export var whenLoaded = new Promise(resolve => {
  resolveLoaded = resolve
})

var mybase = window.location.host + window.location.pathname.replace(/\/[^/]+$/, "");
var externalSite = !lively4url.match(mybase); // I am not somewhere below lively4url

if (document.location.search.match("noserviceworker")) {
  externalSite = true
}

// service worker, only works on localhost or HTTPS
if (window.location.protocol == "http:" && window.location.hostname != "localhost") {
  externalSite = true
}

if ('serviceWorker' in navigator || window.lively4chrome || externalSite) {
  console.log("LOAD Lively4: boot lively4 service worker");
  var root = "" + lively4url + "/";
  var serviceworkerReady = false;

  var onReady = function() {
    serviceworkerReady = true;
    // Lively has all the dependencies


    // Workaround because only one function can listen to serviceworker messages
    window.serviceWorkerMessageHandlers = {};

    if (window.navigator.serviceWorker) {
      window.navigator.serviceWorker.onmessage = function(event) {
        for (let key in window.serviceWorkerMessageHandlers) {
          window.serviceWorkerMessageHandlers[key](event);
        }
      }

      // Add listener for serviceWorker messages
      window.serviceWorkerMessageHandlers['networkNotifications'] = (event) => {
        const message = event.data;

        // Only handle notifications here
        if (message.type != 'notification') return;

        let messageColors = {
          'info': '',
          'warning': 'yellow',
          'error': 'red'
        };

        if ('lively' in window) {
          lively.notify('ServiceWorker', message.data, 5, null, messageColors[message.command]);
        }
      }

      // Add listener for offline/online events
      // This is currently only used in the ServiceWorker, but the ServiceWorker does not get these events
      // So we register here and forward the events
      window.addEventListener('online', () => {
        navigator.serviceWorker.controller.postMessage({
          type: 'network',
          command: 'online'
        });
      });

      window.addEventListener('offline', () => {
        navigator.serviceWorker.controller.postMessage({
          type: 'network',
          command: 'offline'
        });
      });
    }

    resolveLoaded()

  };

  if (('serviceWorker' in navigator && navigator.serviceWorker.controller) || window.lively4chrome || externalSite) {

    console.log("NO Service worker during migration!!!")
    if (window.lively4chrome) {
      console.log("[Livley4] running without service worker");
    } else if (externalSite) {
      console.log("[Lively4] load from external site");
    } else {
      console.log("[Lively4] Use existing service worker");
    }
    // we don't have to do anything here... the service worker is already there
    onReady();
  } else {
    // the scope of the serviceworker can only be refined to something below it's root... so we have to install it as a file at the content's side. 
    navigator.serviceWorker.register(new URL('swx-loader.js', window.location)).then(function(registration) {
      console.log("SWX registration", registration)
      window.lively4swxregistration = registration; // for debugging
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);

      // so now we have to reload!
      console.log("ok... lets wait for the service worker.");
      // console.log("Lively4 ServiceWorker installed! Reboot needed! ;-)")
      // window.location = window.location
    }).catch(function(err) {
      // registration failed
      console.log('ServiceWorker registration failed: ', err);
    });
    navigator.serviceWorker.ready.then(onReady);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});
