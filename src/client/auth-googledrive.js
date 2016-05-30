'use strict';

import * as messaging from './messaging.js';

import focalStorage from '../external/focalStorage.js';

console.log("focalStorage: ", focalStorage)
console.log("load googledriveAuth")


function parseAuthInfoFromUrl(data) {
  var authInfo = JSON.parse(
    '{"' + data.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    function(key, value) { return key === "" ? value : decodeURIComponent(value); });
  return authInfo;
}

function notifyMe(title, text, cb) {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification(title, {
      icon: 'http://www.google.com/drive/images/drive/logo-drive.png',
      body: text,
    });
    notification.onclick = cb
  }
}


export default class AuthGoogledrive {

  static onAuthenticated(windowUuid, authInfo) {

  	var state = authInfo.state
  	var token = authInfo.token

  	if (!state) { console.log("not state! authinfo: " + JSON.stringify(authInfo))}
  	console.log("authInfo: ", authInfo)
  	focalStorage.setItem("googledriveToken", token).then(function() {
  		var cb = AuthGoogledrive.onAuthenticatedCallbacks[state]
  		if (cb) {
  			console.log("running onAuthenticated callback: " + cb)
  			cb(token)
  		} else {
  			console.log("no callback found for" + state)
  		}
  	})
  }

  static logout(cb) {
  	focalStorage.setItem("googledriveToken", null).then(cb)
  }


  static challengeForAuth(uuid, cb) {
  	if (uuid && cb) {
  		AuthGoogledrive.onAuthenticatedCallbacks[uuid] = cb
  	}
  	function popup(url) {
  	    var width = 525,
  	        height = 525,
  	        screenX = window.screenX,
  	        screenY = window.screenY,
  	        outerWidth = window.outerWidth,
  	        outerHeight = window.outerHeight;

  	    var left = screenX + Math.max(outerWidth - width, 0) / 2;
  	    var top = screenY + Math.max(outerHeight - height, 0) / 2;

  	    var features = [
  	              "width=" + width,
  	              "height=" + height,
  	              "top=" + top,
  	              "left=" + left,

  	              "status=no",
  	              "resizable=yes",
  	              "toolbar=no",
  	              "menubar=no",
  	              "scrollbars=yes"];
  	    var popupWindow = window.open(url, "oauth", features.join(","));
  	    if (!popupWindow) {
  	    	notifyMe("googledrive Authenfication required", "click here to authenticate", function() {
  	    		console.log("try to open window")
  				window.open(url, "oauth", features.join(","));
  	    	})
  	    } else {
  	    	// popup.uuid = lively.net.CloudStorage.addPendingRequest(req);
  	    	popupWindow.focus();
  	    }
  	}

   	var appInfo = {
  	    "clientId": "255612037819-mggijqbougej39s0j95oqvq3ej5hid79.apps.googleusercontent.com",
  	    "redirectUri": "https://lively-kernel.org/lively4-auth/oauth/googledrive.html"
  	};

  	$.get("https://lively-kernel.org/lively4-auth/open_googledrive_accesstoken?state="+uuid, null, function(data){
  	    console.log("challenge got a token, too: " + data)
  	    var authInfo = parseAuthInfoFromUrl(data)
  	    AuthGoogledrive.onAuthenticated(uuid, authInfo)
  	})

      var url =
              "https://accounts.google.com/o/oauth2/v2/auth" +
              "?client_id=" + appInfo.clientId +
              "&response_type=token" +
              "&scope=https://www.googleapis.com/auth/drive" +
              "&state=" + uuid +
              "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);

      console.log("query googledrive")

      popup(url);
  }

  static load() {
    this.onAuthenticatedCallbacks = {}
    // receive messages
    navigator.serviceWorker.addEventListener("message", function(event) {
        if (event.data.name == 'githubAuthTokenRequired') {
        	console.log("goth auth token required: " + JSON.stringify(event.data))
        	var callbackId = event.data.callbackId
        	AuthGoogledrive.challengeForAuth(Date.now(), function(token) {
        		messaging.postMessage({
  	        	type: 'callback',
    	    		callbackId: callbackId,
    	    		args: [token]
    			  })
        	})
        }
    })
  }

}
AuthGoogledrive.load()


